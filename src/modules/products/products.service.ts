import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

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

  async findAll() {
    return this.prisma.product.findMany();
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
