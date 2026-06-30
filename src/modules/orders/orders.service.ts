import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateOrderDto) {
    return this.prisma.order.create({
      data: {
        customerId: data.customerId,
        invoiceId: data.invoiceId,
        status: data.status,
        details: {
          create: data.details.map(detail => ({
            productId: detail.productId,
            employeeId: detail.employeeId,
            quantity: detail.quantity,
            unitPrice: detail.unitPrice,
            commissionEarned: detail.commissionEarned,
          })),
        },
      },
      include: {
        details: true,
      },
    });
  }

  async findAll() {
    return this.prisma.order.findMany({
      include: { details: true },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { details: true },
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async updateStatus(id: string, data: UpdateOrderStatusDto) {
    await this.findOne(id); // Ensure exists
    return this.prisma.order.update({
      where: { id },
      data: {
        status: data.status,
      },
    });
  }
}

