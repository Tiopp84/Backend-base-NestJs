import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsInt, Max, Min, IsString } from 'class-validator';

export class PaginationDto {
    @ApiPropertyOptional({ example: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @ApiPropertyOptional({ example: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 10;

    @ApiPropertyOptional({ example: 'id' })
    @IsOptional()
    @IsString()
    sortBy: string = 'id';

    @ApiPropertyOptional({ example: 'desc' })
    @IsOptional()
    @IsIn(['asc', 'desc'])
    order: 'asc' | 'desc' = 'desc';

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    employeeId?: string;
}
