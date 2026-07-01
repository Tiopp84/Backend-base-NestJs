import { plainToInstance, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, validateSync } from 'class-validator';

enum StorageProvider {
  MINIO = 'MINIO',
  CLOUDINARY = 'CLOUDINARY',
}

class EnvironmentVariables {
  @IsString()
  DATABASE_URL: string;

  @IsString()
  JWT_ACCESS_SECRET: string;

  @IsString()
  JWT_REFRESH_SECRET: string;

  @IsOptional()
  @IsString()
  JWT_ACCESS_EXPIRES_IN: string = '15m';

  @IsOptional()
  @IsString()
  JWT_REFRESH_EXPIRES_IN: string = '7d';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  PORT: number = 3000;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  THROTTLE_TTL: number = 60000;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  THROTTLE_LIMIT: number = 10;

  @IsOptional()
  @IsString()
  REDIS_HOST: string = 'localhost';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  REDIS_PORT: number = 6379;

  @IsOptional()
  @IsEnum(StorageProvider)
  STORAGE_PROVIDER: StorageProvider = StorageProvider.MINIO;
}

export function validate(config: Record<string, any>) {
  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    config,
    { enableImplicitConversion: true },
  );
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
