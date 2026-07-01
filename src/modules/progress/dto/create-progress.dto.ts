import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateProgressDto {
  @IsString()
  @IsNotEmpty()
  bookingDetailId: string;

  @IsString()
  @IsOptional()
  imgBeforeUrl?: string;

  @IsString()
  @IsOptional()
  imgAfterUrl?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
