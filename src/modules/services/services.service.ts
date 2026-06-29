import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';

@Injectable()
export class ServicesService {
    constructor(
        private readonly prisma: PrismaService
    ) { }

    async findAll() {
        return this.prisma.service.findMany();
    }

    async create(data: CreateServiceDto) {
        return this.prisma.service.create({
            data: {
                serviceName: data.serviceName,
                durationMin: data.durationMin,
                price: data.price,
                commissionRate: data.commissionRate,
            },
        });
    }
}
