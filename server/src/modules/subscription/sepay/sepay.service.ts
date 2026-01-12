import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SepayTransaction,
  TransactionStatus,
} from './entities/sepay-transaction.entity';
import { User } from '../../auth/entities/user.entity';
import { SepayWebhookDto, ParsedPaymentContent } from './dto/sepay-webhook.dto';
import { SepayIpnDto } from './dto/sepay-ipn.dto';
import { UserPlan } from '../../../common/enums/user-plan.enum';
import {
  getPlanPrice,
  getDurationInMonths,
  PaymentDuration,
} from './subscription.config';
import { PaymentCheckoutResponse } from './dto/create-payment.dto';
import { SePayPgClient } from 'sepay-pg-node';

@Injectable()
export class SepayService {
  private readonly logger = new Logger(SepayService.name);
  private readonly sepayClient: SePayPgClient;

  constructor(
    @InjectRepository(SepayTransaction)
    private readonly transactionRepo: Repository<SepayTransaction>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    this.sepayClient = new SePayPgClient({
      env: (process.env.SEPAY_ENV || 'sandbox') as 'sandbox' | 'production',
      merchant_id: process.env.SEPAY_MERCHANT_ID || '',
      secret_key: process.env.SEPAY_SECRET_KEY || '',
    });

    this.logger.log(
      `SePay client initialized in ${process.env.SEPAY_ENV || 'sandbox'} mode`,
    );
  }

  async createPaymentCheckout(
    user: User,
    plan: UserPlan,
    duration: PaymentDuration,
  ): Promise<PaymentCheckoutResponse> {
    if (plan !== UserPlan.PRO && plan !== UserPlan.TEAM) {
      throw new BadRequestException('Invalid plan. Must be PRO or TEAM');
    }

    const amount = getPlanPrice(plan, duration);
    if (!amount) {
      throw new BadRequestException('Invalid plan or duration combination');
    }

    const timestamp = Date.now();
    const randomSuffix = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
    const orderInvoiceNumber = `ORCA-${plan}-${duration}-${timestamp}-${randomSuffix}`;

    const description = `ORCA ${user.email} ${plan} ${duration}`;

    const baseUrl = process.env.CLIENT_URL || 'https://orcacli.codes';
    const successUrl = `${baseUrl}/dashboard/subscription?payment=success&order=${orderInvoiceNumber}`;
    const errorUrl = `${baseUrl}/dashboard/subscription?payment=error&order=${orderInvoiceNumber}`;
    const cancelUrl = `${baseUrl}/dashboard/subscription?payment=cancel&order=${orderInvoiceNumber}`;

    this.logger.log(
      `Creating payment checkout for user ${user.email}: ${plan} ${duration} - ${amount} VND`,
    );

    const checkoutURL = this.sepayClient.checkout.initCheckoutUrl();

    const formFields = this.sepayClient.checkout.initOneTimePaymentFields({
      payment_method: 'BANK_TRANSFER',
      order_invoice_number: orderInvoiceNumber,
      order_amount: amount,
      currency: 'VND',
      order_description: description,
      success_url: successUrl,
      error_url: errorUrl,
      cancel_url: cancelUrl,
    });

    return {
      checkoutURL,
      formFields,
      orderInvoiceNumber,
      amount,
      description,
    };
  }

  async processWebhook(
    payload: SepayWebhookDto,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(
      `Processing SePay webhook for transaction ID: ${payload.id}`,
    );
    this.logger.debug(
      `Webhook payload content: ${payload.content}, amount: ${payload.transferAmount}`,
    );

    if (payload.transferType !== 'in') {
      this.logger.warn(`Ignoring outgoing transfer: ${payload.id}`);
      return { success: true, message: 'Outgoing transfer ignored' };
    }

    const existing = await this.transactionRepo.findOne({
      where: { sepayId: String(payload.id) },
    });

    if (existing) {
      this.logger.warn(
        `Duplicate transaction detected: ${payload.id}, Status: ${existing.status}`,
      );
      return { success: true, message: 'Transaction already processed' };
    }

    const transaction = this.transactionRepo.create({
      sepayId: String(payload.id),
      gateway: payload.gateway,
      transactionDate: new Date(payload.transactionDate),
      accountNumber: payload.accountNumber,
      content: payload.content,
      transferType: payload.transferType,
      transferAmount: payload.transferAmount,
      referenceCode: payload.referenceCode || null,
      status: TransactionStatus.PENDING,
    });

    try {
      const parsed = this.parsePaymentContent(payload.content);
      if (!parsed) {
        this.logger.error(
          `Failed to parse payment content: "${payload.content}"`,
        );
        throw new BadRequestException('Invalid payment content format');
      }

      this.logger.log(
        `Parsed content: Email=${parsed.email}, Plan=${parsed.plan}, Duration=${parsed.duration}`,
      );

      const user = await this.userRepo.findOne({
        where: { email: parsed.email },
      });

      if (!user) {
        this.logger.error(`User not found with email: ${parsed.email}`);
        throw new NotFoundException(`User not found: ${parsed.email}`);
      }

      const plan = this.validatePlan(parsed.plan);
      const duration = this.validateDuration(parsed.duration);

      const expectedAmount = getPlanPrice(plan, duration);
      if (!expectedAmount) {
        throw new BadRequestException(
          `Invalid plan or duration: ${parsed.plan} ${parsed.duration}`,
        );
      }

      const variance = 1000;
      if (Math.abs(payload.transferAmount - expectedAmount) > variance) {
        this.logger.error(
          `Payment amount mismatch. Expected: ${expectedAmount}, Received: ${payload.transferAmount}`,
        );
        throw new BadRequestException(
          `Payment amount mismatch. Expected: ${expectedAmount}, Received: ${payload.transferAmount}`,
        );
      }

      this.logger.log(
        `Upgrading user ${user.id} (${user.email}) to ${plan} ${duration}`,
      );
      await this.upgradeUserPlan(user, plan, duration);

      transaction.userId = user.id;
      transaction.planUpgrade = plan;
      transaction.duration = duration;
      transaction.status = TransactionStatus.PROCESSED;

      await this.transactionRepo.save(transaction);

      this.logger.log(
        `Successfully processed payment for ${user.email} - ${plan} ${duration}`,
      );

      return {
        success: true,
        message: `User ${user.email} upgraded to ${plan} plan for ${duration}`,
      };
    } catch (error) {
      this.logger.error(`Error processing transaction ${payload.id}:`, error);

      transaction.status = TransactionStatus.FAILED;
      transaction.errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      await this.transactionRepo.save(transaction);

      throw error;
    }
  }

  private parsePaymentContent(content: string): ParsedPaymentContent | null {
    const normalized = content.trim().toUpperCase();

    const pattern = /ORCA\s+([^\s]+)\s+(PRO|TEAM)\s+(1M|12M)/i;
    const match = normalized.match(pattern);

    if (!match) {
      this.logger.warn(`Failed to parse payment content: ${content}`);
      return null;
    }

    return {
      email: match[1].toLowerCase(),
      plan: match[2].toUpperCase(),
      duration: match[3].toUpperCase(),
    };
  }

  private validatePlan(planStr: string): UserPlan {
    const upperPlan = planStr.toUpperCase();
    if (upperPlan === 'PRO') return UserPlan.PRO;
    if (upperPlan === 'TEAM') return UserPlan.TEAM;
    throw new BadRequestException(`Invalid plan: ${planStr}`);
  }

  private validateDuration(durationStr: string): PaymentDuration {
    const upperDuration = durationStr.toUpperCase();
    if (upperDuration === '1M') return PaymentDuration.MONTHLY;
    if (upperDuration === '12M') return PaymentDuration.YEARLY;
    throw new BadRequestException(`Invalid duration: ${durationStr}`);
  }

  private async upgradeUserPlan(
    user: User,
    plan: UserPlan,
    duration: PaymentDuration,
  ): Promise<void> {
    const months = getDurationInMonths(duration);

    const now = new Date();
    const currentExpiry =
      user.planExpiresAt && user.planExpiresAt > now ? user.planExpiresAt : now;

    const newExpiry = new Date(currentExpiry);
    newExpiry.setMonth(newExpiry.getMonth() + months);

    user.plan = plan;
    user.planExpiresAt = newExpiry;

    await this.userRepo.save(user);

    this.logger.log(
      `Upgraded user ${user.email} to ${plan} plan until ${newExpiry.toISOString()}`,
    );
  }

  async getUserTransactions(userId: string): Promise<SepayTransaction[]> {
    return this.transactionRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async processIpnWebhook(payload: SepayIpnDto) {
    this.logger.log(`Processing SePay IPN: ${payload.notification_type}`);

    if (payload.notification_type !== 'ORDER_PAID') {
      return { success: true, message: 'Ignored notification type' };
    }

    const { transaction, order } = payload;

    const existing = await this.transactionRepo.findOne({
      where: { sepayId: transaction.transaction_id },
    });

    if (existing) {
      this.logger.warn(
        `Duplicate IPN transaction: ${transaction.transaction_id}`,
      );
      if (existing.status === TransactionStatus.PROCESSED) {
        return { success: true, message: 'Already processed' };
      }
    }

    const txn =
      existing ||
      this.transactionRepo.create({
        sepayId: transaction.transaction_id,
        gateway: 'SePay_Gateway',
        transactionDate: new Date(),
        accountNumber: 'GATEWAY',
        content: order.order_description,
        transferType: 'in',
        transferAmount: parseFloat(transaction.transaction_amount) || 0,
        referenceCode: transaction.id,
        status: TransactionStatus.PENDING,
      });

    try {
      if (transaction.transaction_status !== 'APPROVED') {
        throw new BadRequestException(
          `Transaction not approved: ${transaction.transaction_status}`,
        );
      }

      const description = order.order_description || '';
      const parsed = this.parsePaymentContent(description);

      if (!parsed) {
        throw new BadRequestException(
          `Could not parse payment content: ${description}`,
        );
      }

      const user = await this.userRepo.findOne({
        where: { email: parsed.email },
      });
      if (!user) {
        throw new NotFoundException(`User not found: ${parsed.email}`);
      }

      const plan = this.validatePlan(parsed.plan);
      const duration = this.validateDuration(parsed.duration);

      const expectedAmount = getPlanPrice(plan, duration);
      if (!expectedAmount) {
        throw new BadRequestException(
          `Invalid plan configuration: ${plan} ${duration}`,
        );
      }
      const receivedAmount = parseFloat(transaction.transaction_amount);

      const variance = 1000;
      if (Math.abs(receivedAmount - expectedAmount) > variance) {
        throw new BadRequestException(
          `Amount mismatch. Expected ${expectedAmount}, got ${receivedAmount}`,
        );
      }

      await this.upgradeUserPlan(user, plan, duration);

      txn.userId = user.id;
      txn.planUpgrade = plan;
      txn.duration = duration;
      txn.status = TransactionStatus.PROCESSED;

      await this.transactionRepo.save(txn);

      this.logger.log(`IPN: Upgraded ${user.email} to ${plan} ${duration}`);

      return { success: true };
    } catch (error) {
      this.logger.error('Error processing IPN:', error);
      txn.status = TransactionStatus.FAILED;
      txn.errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      await this.transactionRepo.save(txn);
      return { success: false, message: txn.errorMessage };
    }
  }

  async getTransactionStats() {
    const total = await this.transactionRepo.count();
    const processed = await this.transactionRepo.count({
      where: { status: TransactionStatus.PROCESSED },
    });
    const failed = await this.transactionRepo.count({
      where: { status: TransactionStatus.FAILED },
    });

    const totalRevenue = await this.transactionRepo
      .createQueryBuilder('txn')
      .select('SUM(txn.transferAmount)', 'total')
      .where('txn.status = :status', { status: TransactionStatus.PROCESSED })
      .getRawOne();

    return {
      total,
      processed,
      failed,
      pending: total - processed - failed,
      totalRevenue: totalRevenue?.total ? parseInt(totalRevenue.total) : 0,
    };
  }
}
