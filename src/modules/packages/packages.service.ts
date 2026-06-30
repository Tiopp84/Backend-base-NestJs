import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

@Injectable()
export class PackagesService {
    constructor(
        private readonly prisma: PrismaService
    ) { }

    async findAll() {
        return this.prisma.package.findMany();
    }

    async create(data: CreatePackageDto) {
        return this.prisma.package.create({
            data: {
                packageName: data.packageName,
                totalSessions: data.totalSessions,
                price: data.price,
            },
        });
    }
    async findOne(id: string) {
        const pkg = await this.prisma.package.findUnique({
            where: { id },
        });
        if (!pkg) {
            throw new NotFoundException(`Package with ID ${id} not found`);
        }
        return pkg;
    }

    async update(id: string, data: UpdatePackageDto) {
        await this.findOne(id); // Ensure exists
        return this.prisma.package.update({
            where: { id },
            data: {
                packageName: data.packageName,
                totalSessions: data.totalSessions,
                price: data.price,
            },
        });
    }

    async remove(id: string) {
        await this.findOne(id); // Ensure exists
        return this.prisma.package.delete({
            where: { id },
        });
    }
}
