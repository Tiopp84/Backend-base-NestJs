import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateServiceDto {
  @IsString()
  @IsOptional()
  serviceName?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  durationMin?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  commissionRate?: number;
}
