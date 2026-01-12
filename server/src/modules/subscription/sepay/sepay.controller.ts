import {
  Controller,
  Post,
  Body,
  Logger,
  HttpCode,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SepayService } from './sepay.service';
import { SepayWebhookDto } from './dto/sepay-webhook.dto';
import { SepayIpnDto } from './dto/sepay-ipn.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { UserRole } from '../../../common/enums/user-role.enum';
import type { Request } from 'express';

@Controller('subscription/sepay')
export class SepayController {
  private readonly logger = new Logger(SepayController.name);

  constructor(private readonly sepayService: SepayService) {}

  @Post('initiate-payment')
  @UseGuards(JwtAuthGuard)
  async initiatePayment(
    @Req() req: Request,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    const user = (req as any).user;
    this.logger.log(
      `User ${user.email} initiating payment for ${createPaymentDto.plan} ${createPaymentDto.duration}`,
    );

    try {
      const checkoutData = await this.sepayService.createPaymentCheckout(
        user,
        createPaymentDto.plan,
        createPaymentDto.duration,
      );

      return {
        success: true,
        data: checkoutData,
      };
    } catch (error) {
      this.logger.error('Error creating payment checkout:', error);
      throw error;
    }
  }

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(@Body() payload: SepayWebhookDto) {
    this.logger.log('Received SePay webhook');
    this.logger.debug(`Webhook payload: ${JSON.stringify(payload)}`);

    try {
      const result = await this.sepayService.processWebhook(payload);
      return result;
    } catch (error) {
      this.logger.error('Error processing webhook:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Processing failed',
      };
    }
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  async getUserTransactions(@Req() req: Request) {
    const userId = (req as any).user?.id as string;
    const transactions = await this.sepayService.getUserTransactions(userId);

    return {
      transactions: transactions.map((txn) => ({
        id: txn.id,
        amount: txn.transferAmount,
        plan: txn.planUpgrade,
        duration: txn.duration,
        status: txn.status,
        transactionDate: txn.transactionDate,
        gateway: txn.gateway,
        referenceCode: txn.referenceCode,
      })),
    };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getStats() {
    return this.sepayService.getTransactionStats();
  }

  @Post('ipn')
  @HttpCode(200)
  async handleIpnWebhook(@Body() payload: SepayIpnDto) {
    return this.sepayService.processIpnWebhook(payload);
  }
}

@Controller('sepay')
export class SepayIpnController {
  constructor(private readonly sepayService: SepayService) {}

  @Post('ipn')
  @HttpCode(200)
  async handleIpn(@Body() payload: SepayIpnDto) {
    return this.sepayService.processIpnWebhook(payload);
  }
}
