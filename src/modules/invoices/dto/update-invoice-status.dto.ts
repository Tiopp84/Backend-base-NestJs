import { IsEnum } from 'class-validator';
import { InvoiceStatus } from 'src/common/enums/business.enum';

export class UpdateInvoiceStatusDto {
  @IsEnum(InvoiceStatus)
  status: InvoiceStatus;
}
