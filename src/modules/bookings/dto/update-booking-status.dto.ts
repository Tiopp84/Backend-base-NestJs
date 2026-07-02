import { IsEnum } from 'class-validator';
import { BookingStatus } from 'src/common/enums/business.enum';

export class UpdateBookingStatusDto {
  @IsEnum(BookingStatus)
  status: BookingStatus;
}
