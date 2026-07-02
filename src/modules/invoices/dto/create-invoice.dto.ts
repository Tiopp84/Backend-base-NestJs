import { IsString, IsNotEmpty, IsNumber, Min, IsEnum } from 'class-validator';
import { InvoiceStatus, PaymentMethod } from 'src/common/enums/business.enum';

export class CreateInvoiceDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsEnum(InvoiceStatus)
  status: InvoiceStatus;
}
