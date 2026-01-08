import { Controller, Post, Body, Logger, HttpCode, Get, UseGuards, Req } from '@nestjs/common';
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

    constructor(private readonly sepayService: SepayService) { }

    /**
     * Initiate payment - Create checkout URL and form fields
     * This endpoint allows authenticated users to create a payment session
     */
    @Post('initiate-payment')
    @UseGuards(JwtAuthGuard)
    async initiatePayment(
        @Req() req: Request,
        @Body() createPaymentDto: CreatePaymentDto
    ) {
        const user = (req as any).user;
        this.logger.log(`User ${user.email} initiating payment for ${createPaymentDto.plan} ${createPaymentDto.duration}`);

        try {
            const checkoutData = await this.sepayService.createPaymentCheckout(
                user,
                createPaymentDto.plan,
                createPaymentDto.duration
            );

            return {
                success: true,
                data: checkoutData
            };
        } catch (error) {
            this.logger.error('Error creating payment checkout:', error);
            throw error;
        }
    }

    /**
     * SePay webhook endpoint (IPN)
     * This endpoint receives payment notifications from SePay
     * Also available at /api/v1/sepay/ipn for compatibility
     */
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
            // Still return 200 to SePay to avoid retries
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Processing failed'
            };
        }
    }

    /**
     * Get user's transaction history (protected endpoint)
     */
    @Get('transactions')
    @UseGuards(JwtAuthGuard)
    async getUserTransactions(@Req() req: Request) {
        const userId = (req as any).user?.id as string;
        const transactions = await this.sepayService.getUserTransactions(userId);

        return {
            transactions: transactions.map(txn => ({
                id: txn.id,
                amount: txn.transferAmount,
                plan: txn.planUpgrade,
                duration: txn.duration,
                status: txn.status,
                transactionDate: txn.transactionDate,
                gateway: txn.gateway,
                referenceCode: txn.referenceCode,
            }))
        };
    }

    /**
     * Get transaction statistics (admin only)
     */
    @Get('stats')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async getStats() {
        return this.sepayService.getTransactionStats();
    }

    /**
     * IPN Webhook endpoint (alias)
     * Alternative route for SePay IPN configuration: /api/v1/sepay/ipn
     */
    @Post('ipn')
    @HttpCode(200)
    async handleIpnWebhook(@Body() payload: SepayIpnDto) {
        // Delegate to the new IPN handler
        return this.sepayService.processIpnWebhook(payload);
    }
}
