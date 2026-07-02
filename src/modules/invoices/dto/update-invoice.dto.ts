import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { InvoiceStatus, PaymentMethod } from 'src/common/enums/business.enum';

export class UpdateInvoiceDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAmount?: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;
}
