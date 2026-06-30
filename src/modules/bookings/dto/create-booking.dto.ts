import { IsString, IsNotEmpty, IsArray, ValidateNested, IsOptional, IsNumber, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class BookingEmployeeDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  roleType: string;

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

  @IsString()
  @IsNotEmpty()
  status: string; // PENDING, CONFIRMED, CANCELLED

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingDetailDto)
  details: BookingDetailDto[];
}
