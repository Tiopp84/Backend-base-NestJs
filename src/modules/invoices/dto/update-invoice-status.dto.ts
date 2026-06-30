import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateInvoiceStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string; // PENDING, PAID, REFUNDED
}
