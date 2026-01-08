import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserPlan } from '../../../../common/enums/user-plan.enum';
import { PaymentDuration } from '../subscription.config';

export class CreatePaymentDto {
    @IsNotEmpty()
    @IsEnum(UserPlan, { message: 'Plan must be PRO or TEAM' })
    plan!: UserPlan;

    @IsNotEmpty()
    @IsEnum(PaymentDuration, { message: 'Duration must be 1M or 12M' })
    duration!: PaymentDuration;
}

export interface PaymentCheckoutResponse {
    checkoutURL: string;
    formFields: any; // SDK returns object with mixed types (string, number, etc.)
    orderInvoiceNumber: string;
    amount: number;
    description: string;
}

