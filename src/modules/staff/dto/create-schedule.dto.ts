import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateScheduleDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsDateString()
  workDate: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsString()
  @IsNotEmpty()
  status: string; // ACTIVE, CANCELLED, LEAVE
}
