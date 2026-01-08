import { IsNotEmpty, IsNumber, IsString, IsEnum, IsOptional } from 'class-validator';

export class SepayWebhookDto {
    @IsNotEmpty()
    @IsNumber()
    id!: number;

    @IsNotEmpty()
    @IsString()
    gateway!: string;

    @IsNotEmpty()
    @IsString()
    transactionDate!: string;

    @IsNotEmpty()
    @IsString()
    accountNumber!: string;

    @IsOptional()
    @IsString()
    code?: string | null;

    @IsNotEmpty()
    @IsString()
    content!: string;

    @IsNotEmpty()
    @IsEnum(['in', 'out'])
    transferType!: 'in' | 'out';

    @IsNotEmpty()
    @IsNumber()
    transferAmount!: number;

    @IsOptional()
    @IsNumber()
    accumulated?: number | null;

    @IsOptional()
    @IsString()
    subAccount?: string | null;

    @IsOptional()
    @IsString()
    referenceCode?: string | null;

    @IsOptional()
    @IsString()
    description?: string | null;
}

export interface ParsedPaymentContent {
    email: string;
    plan: string;
    duration: string;
}
