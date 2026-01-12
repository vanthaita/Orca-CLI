import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsObject,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SepayOrderDto {
  @IsNotEmpty()
  @IsString()
  id!: string;

  @IsNotEmpty()
  @IsString()
  order_id!: string;

  @IsNotEmpty()
  @IsString()
  order_status!: string;

  @IsNotEmpty()
  @IsString()
  order_invoice_number!: string;

  @IsNotEmpty()
  @IsString()
  order_amount!: string;

  @IsOptional()
  @IsString()
  order_description?: string;
}

export class SepayTransactionDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  payment_method?: string;

  @IsNotEmpty()
  @IsString()
  transaction_status!: string;

  @IsNotEmpty()
  @IsString()
  transaction_amount!: string;

  @IsNotEmpty()
  @IsString()
  transaction_id!: string;

  @IsOptional()
  @IsString()
  transaction_currency?: string;
}

export class SepayIpnDto {
  @IsNotEmpty()
  @IsString()
  notification_type!: string;

  @IsOptional()
  @IsNumber()
  timestamp?: number;

  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => SepayOrderDto)
  order!: SepayOrderDto;

  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => SepayTransactionDto)
  transaction!: SepayTransactionDto;
}
