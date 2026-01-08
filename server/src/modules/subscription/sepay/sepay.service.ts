import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SepayTransaction, TransactionStatus } from './entities/sepay-transaction.entity';
import { User } from '../../auth/entities/user.entity';
import { SepayWebhookDto, ParsedPaymentContent } from './dto/sepay-webhook.dto';
import { UserPlan } from '../../../common/enums/user-plan.enum';
import { getPlanPrice, getDurationInMonths, PaymentDuration, PLAN_PRICING } from './subscription.config';
import { PaymentCheckoutResponse } from './dto/create-payment.dto';
import { SePayPgClient } from 'sepay-pg-node';
import * as crypto from 'crypto';

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
        // Initialize SePay client
        this.sepayClient = new SePayPgClient({
            env: (process.env.SEPAY_ENV || 'sandbox') as 'sandbox' | 'production',
            merchant_id: process.env.SEPAY_MERCHANT_ID || '',
            secret_key: process.env.SEPAY_SECRET_KEY || '',
        });

        this.logger.log(`SePay client initialized in ${process.env.SEPAY_ENV || 'sandbox'} mode`);
    }

    /**
     * Create payment checkout URL and form fields for user to scan QR and pay
     */
    async createPaymentCheckout(
        user: User,
        plan: UserPlan,
        duration: PaymentDuration
    ): Promise<PaymentCheckoutResponse> {
        // Validate plan
        if (plan !== UserPlan.PRO && plan !== UserPlan.TEAM) {
            throw new BadRequestException('Invalid plan. Must be PRO or TEAM');
        }

        // Get pricing
        const amount = getPlanPrice(plan, duration);
        if (!amount) {
            throw new BadRequestException('Invalid plan or duration combination');
        }

        // Generate unique order invoice number
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
        const orderInvoiceNumber = `ORCA-${plan}-${duration}-${timestamp}-${randomSuffix}`;

        // Create payment description with parseable format
        // Format: "ORCA {email} {PLAN} {DURATION}"
        const description = `ORCA ${user.email} ${plan} ${duration}`;

        // Get success/error/cancel URLs
        const baseUrl = process.env.CLIENT_URL || 'https://orcacli.codes';
        const successUrl = `${baseUrl}/dashboard/subscription?payment=success&order=${orderInvoiceNumber}`;
        const errorUrl = `${baseUrl}/dashboard/subscription?payment=error&order=${orderInvoiceNumber}`;
        const cancelUrl = `${baseUrl}/dashboard/subscription?payment=cancel&order=${orderInvoiceNumber}`;

        this.logger.log(`Creating payment checkout for user ${user.email}: ${plan} ${duration} - ${amount} VND`);

        // Initialize checkout URL
        const checkoutURL = this.sepayClient.checkout.initCheckoutUrl();

        // Initialize form fields
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


    /**
     * Process incoming webhook from SePay
     */
    async processWebhook(payload: SepayWebhookDto): Promise<{ success: boolean; message: string }> {
        this.logger.log(`Processing SePay webhook for transaction ID: ${payload.id}`);

        // Only process incoming transfers
        if (payload.transferType !== 'in') {
            this.logger.warn(`Ignoring outgoing transfer: ${payload.id}`);
            return { success: true, message: 'Outgoing transfer ignored' };
        }

        // Check for duplicate transaction
        const existing = await this.transactionRepo.findOne({
            where: { sepayId: payload.id }
        });

        if (existing) {
            this.logger.warn(`Duplicate transaction detected: ${payload.id}`);
            return { success: true, message: 'Transaction already processed' };
        }

        // Create transaction record
        const transaction = this.transactionRepo.create({
            sepayId: payload.id,
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
            // Parse payment content
            const parsed = this.parsePaymentContent(payload.content);
            if (!parsed) {
                throw new BadRequestException('Invalid payment content format');
            }

            // Find user by email
            const user = await this.userRepo.findOne({
                where: { email: parsed.email }
            });

            if (!user) {
                throw new NotFoundException(`User not found: ${parsed.email}`);
            }

            // Validate plan and duration
            const plan = this.validatePlan(parsed.plan);
            const duration = this.validateDuration(parsed.duration);

            // Validate payment amount
            const expectedAmount = getPlanPrice(plan, duration);
            if (!expectedAmount) {
                throw new BadRequestException(`Invalid plan or duration: ${parsed.plan} ${parsed.duration}`);
            }

            // Allow small variance (±1000 VND) for rounding
            const variance = 1000;
            if (Math.abs(payload.transferAmount - expectedAmount) > variance) {
                throw new BadRequestException(
                    `Payment amount mismatch. Expected: ${expectedAmount}, Received: ${payload.transferAmount}`
                );
            }

            // Upgrade user plan
            await this.upgradeUserPlan(user, plan, duration);

            // Update transaction record
            transaction.userId = user.id;
            transaction.planUpgrade = plan;
            transaction.duration = duration;
            transaction.status = TransactionStatus.PROCESSED;

            await this.transactionRepo.save(transaction);

            this.logger.log(`Successfully processed payment for ${user.email} - ${plan} ${duration}`);

            return {
                success: true,
                message: `User ${user.email} upgraded to ${plan} plan for ${duration}`
            };

        } catch (error) {
            this.logger.error(`Error processing transaction ${payload.id}:`, error);

            transaction.status = TransactionStatus.FAILED;
            transaction.errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await this.transactionRepo.save(transaction);

            throw error;
        }
    }

    /**
     * Parse payment content to extract user email, plan, and duration
     * Expected format: "ORCA user@example.com PRO 1M"
     */
    private parsePaymentContent(content: string): ParsedPaymentContent | null {
        // Remove extra whitespace and convert to uppercase for matching
        const normalized = content.trim().toUpperCase();

        // Pattern: ORCA <email> <PLAN> <DURATION>
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

    /**
     * Validate and convert plan string to UserPlan enum
     */
    private validatePlan(planStr: string): UserPlan {
        const upperPlan = planStr.toUpperCase();
        if (upperPlan === 'PRO') return UserPlan.PRO;
        if (upperPlan === 'TEAM') return UserPlan.TEAM;
        throw new BadRequestException(`Invalid plan: ${planStr}`);
    }

    /**
     * Validate duration string
     */
    private validateDuration(durationStr: string): PaymentDuration {
        const upperDuration = durationStr.toUpperCase();
        if (upperDuration === '1M') return PaymentDuration.MONTHLY;
        if (upperDuration === '12M') return PaymentDuration.YEARLY;
        throw new BadRequestException(`Invalid duration: ${durationStr}`);
    }

    /**
     * Upgrade user's plan and set expiry date
     */
    private async upgradeUserPlan(user: User, plan: UserPlan, duration: PaymentDuration): Promise<void> {
        const months = getDurationInMonths(duration);

        // Calculate new expiry date
        const now = new Date();
        const currentExpiry = user.planExpiresAt && user.planExpiresAt > now
            ? user.planExpiresAt
            : now;

        const newExpiry = new Date(currentExpiry);
        newExpiry.setMonth(newExpiry.getMonth() + months);

        // Update user
        user.plan = plan;
        user.planExpiresAt = newExpiry;

        await this.userRepo.save(user);

        this.logger.log(`Upgraded user ${user.email} to ${plan} plan until ${newExpiry.toISOString()}`);
    }

    /**
     * Verify webhook signature (if SePay provides it)
     * Currently SePay doesn't provide signature in webhook, so this is optional
     */
    private verifySignature(payload: any, signature: string): boolean {
        const secret = process.env.SEPAY_SECRET_KEY;
        if (!secret) {
            this.logger.warn('SEPAY_SECRET_KEY not configured, skipping signature verification');
            return true;
        }

        const computedSignature = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(payload))
            .digest('hex');

        return signature === computedSignature;
    }

    /**
     * Get all transactions for a user
     */
    async getUserTransactions(userId: string): Promise<SepayTransaction[]> {
        return this.transactionRepo.find({
            where: { userId },
            order: { createdAt: 'DESC' }
        });
    }

    /**
     * Get transaction statistics
     */
    async getTransactionStats() {
        const total = await this.transactionRepo.count();
        const processed = await this.transactionRepo.count({
            where: { status: TransactionStatus.PROCESSED }
        });
        const failed = await this.transactionRepo.count({
            where: { status: TransactionStatus.FAILED }
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
