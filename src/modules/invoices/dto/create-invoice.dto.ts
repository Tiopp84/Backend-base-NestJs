import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateInvoiceDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string; // CASH, TRANSFER, CARD

  @IsString()
  @IsNotEmpty()
  status: string; // PENDING, PAID, REFUNDED
}
