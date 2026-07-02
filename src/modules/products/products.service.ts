import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { getSafeSortBy } from 'src/common/utils/pagination.util';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        productName: data.productName,
        price: data.price,
        stockQuantity: data.stockQuantity,
        commissionRate: data.commissionRate,
      },
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, limit, sortBy, order } = paginationDto;
    const skip = (page - 1) * limit;
    const safeSortBy = getSafeSortBy(sortBy, ['id', 'productName', 'price', 'stockQuantity', 'commissionRate']);

    const [data, total] = await Promise.all([
        this.prisma.product.findMany({
            skip,
            take: limit,
            orderBy: { [safeSortBy]: order } as any,
        }),
        this.prisma.product.count(),
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

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async update(id: string, data: UpdateProductDto) {
    await this.findOne(id); // Ensure exists
    return this.prisma.product.update({
      where: { id },
      data: {
        productName: data.productName,
        price: data.price,
        stockQuantity: data.stockQuantity,
        commissionRate: data.commissionRate,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Ensure exists
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
