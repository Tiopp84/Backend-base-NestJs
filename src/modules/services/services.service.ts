import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { getSafeSortBy } from 'src/common/utils/pagination.util';

@Injectable()
export class ServicesService {
    constructor(
        private readonly prisma: PrismaService,
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    ) { }

    async findAll(paginationDto: PaginationDto) {
        const { page, limit, sortBy, order } = paginationDto;
        const skip = (page - 1) * limit;
        const safeSortBy = getSafeSortBy(sortBy, ['id', 'serviceName', 'durationMin', 'price', 'commissionRate']);

        // Lấy dữ liệu phân trang + Sắp xếp
        const [data, total] = await Promise.all([
            this.prisma.service.findMany({
                skip,
                take: limit,
                orderBy: { [safeSortBy]: order } as any,
            }),
            this.prisma.service.count(), // Đếm tổng số để frontend tính số trang
        ]);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async create(data: CreateServiceDto) {
        const result = await this.prisma.service.create({
            data: {
                serviceName: data.serviceName,
                durationMin: data.durationMin,
                price: data.price,
                commissionRate: data.commissionRate,
            },
        });
        await this.cacheManager.clear();
        return result;
    }
    async findOne(id: string) {
        const service = await this.prisma.service.findUnique({
            where: { id },
        });
        if (!service) {
            throw new NotFoundException(`Service with ID ${id} not found`);
        }
        return service;
    }

    async update(id: string, data: UpdateServiceDto) {
        await this.findOne(id); // Ensure exists
        const result = await this.prisma.service.update({
            where: { id },
            data: {
                serviceName: data.serviceName,
                durationMin: data.durationMin,
                price: data.price,
                commissionRate: data.commissionRate,
            },
        });
        await this.cacheManager.clear();
        return result;
    }

    async remove(id: string) {
        await this.findOne(id); // Ensure exists
        const result = await this.prisma.service.delete({
            where: { id },
        });
        await this.cacheManager.clear();
        return result;
    }
}
