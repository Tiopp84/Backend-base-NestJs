import { IsString, IsNotEmpty, IsArray, ValidateNested, IsOptional, IsNumber, IsDateString, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { BookingEmployeeRole, BookingStatus } from 'src/common/enums/business.enum';

export class BookingEmployeeDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsEnum(BookingEmployeeRole)
  roleType: BookingEmployeeRole;

  @IsNumber()
  @Min(0)
  commissionEarned: number;
}

export class BookingDetailDto {
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @IsString()
  @IsOptional()
  custPkgId?: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsNumber()
  @Min(0)
  actualPrice: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BookingEmployeeDto)
  employees?: BookingEmployeeDto[];
}

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsString()
  @IsNotEmpty()
  invoiceId: string;

  @IsDateString()
  arrivalTime: string;

  @IsEnum(BookingStatus)
  status: BookingStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingDetailDto)
  details: BookingDetailDto[];
}
