import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdatePackageDto {
  @IsString()
  @IsOptional()
  packageName?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  totalSessions?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;
}
