import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateInvoiceDto) {
    return this.prisma.invoice.create({
      data: {
        customerId: data.customerId,
        totalAmount: data.totalAmount,
        paymentMethod: data.paymentMethod,
        status: data.status,
      },
    });
  }

  async findAll() {
    return this.prisma.invoice.findMany({
      include: { bookings: true, orders: true },
    });
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { bookings: true, orders: true },
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }
    return invoice;
  }

  async updateStatus(id: string, data: UpdateInvoiceStatusDto) {
    await this.findOne(id); // Ensure exists
    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: data.status,
      },
    });
  }
}

