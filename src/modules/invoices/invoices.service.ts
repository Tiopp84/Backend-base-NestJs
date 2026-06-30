import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

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

  async findAll(paginationDto: PaginationDto) {
    const { page, limit, sortBy, order } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        this.prisma.invoice.findMany({
            skip,
            take: limit,
            orderBy: { [sortBy]: order } as any,
            include: { bookings: true, orders: true },
        }),
        this.prisma.invoice.count(),
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

