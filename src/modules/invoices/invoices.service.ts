import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { InvoiceStatus } from 'src/common/enums/business.enum';
import { getSafeSortBy } from 'src/common/utils/pagination.util';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateInvoiceDto, userPayload?: any) {
    const isCustomer = userPayload?.roleName === 'Customer';
    return this.prisma.invoice.create({
      data: {
        customerId: isCustomer ? userPayload.sub : data.customerId,
        totalAmount: data.totalAmount,
        paymentMethod: data.paymentMethod,
        status: isCustomer ? InvoiceStatus.Pending : data.status,
      },
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, limit, sortBy, order } = paginationDto;
    const skip = (page - 1) * limit;
    const safeSortBy = getSafeSortBy(sortBy, ['id', 'customerId', 'totalAmount', 'paymentMethod', 'status', 'createdAt']);

    const [data, total] = await Promise.all([
        this.prisma.invoice.findMany({
            skip,
            take: limit,
            orderBy: { [safeSortBy]: order } as any,
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

  async findByCustomerId(customerId: string, paginationDto: PaginationDto) {
    const { page, limit, sortBy, order } = paginationDto;
    const skip = (page - 1) * limit;
    const safeSortBy = getSafeSortBy(sortBy, ['id', 'totalAmount', 'paymentMethod', 'status', 'createdAt']);

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { customerId },
        skip,
        take: limit,
        orderBy: { [safeSortBy]: order } as any,
        include: { bookings: true, orders: true },
      }),
      this.prisma.invoice.count({ where: { customerId } }),
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
      include: {
        bookings: {
          include: {
            details: true,
          },
        },
        orders: {
          include: {
            details: true,
          },
        },
      },
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }
    return invoice;
  }

  async updateStatus(id: string, data: UpdateInvoiceStatusDto, userPayload?: any) {
    const invoice = await this.findOne(id);

    if (userPayload && userPayload.roleName === 'Customer') {
      if (invoice.customerId !== userPayload.sub) {
        throw new ForbiddenException('Bạn không có quyền sửa đổi hóa đơn này');
      }
    }
    
    if (data.status === InvoiceStatus.Paid) {
      return this.finalizePayment(id);
    }

    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: data.status,
      },
    });
  }

  async update(id: string, data: UpdateInvoiceDto) {
    await this.findOne(id);
    
    if (data.status === InvoiceStatus.Paid) {
      return this.finalizePayment(id, {
        totalAmount: data.totalAmount,
        paymentMethod: data.paymentMethod,
      });
    }

    return this.prisma.invoice.update({
      where: { id },
      data: {
        totalAmount: data.totalAmount !== undefined ? data.totalAmount : undefined,
        paymentMethod: data.paymentMethod !== undefined ? data.paymentMethod : undefined,
        status: data.status !== undefined ? data.status : undefined,
      },
    });
  }

  private async finalizePayment(
    id: string,
    data: { totalAmount?: number; paymentMethod?: string } = {},
  ) {
    return this.prisma.$transaction(async (tx) => {
      const claimed = await tx.invoice.updateMany({
        where: {
          id,
          status: { not: InvoiceStatus.Paid },
        },
        data: {
          totalAmount: data.totalAmount !== undefined ? data.totalAmount : undefined,
          paymentMethod: data.paymentMethod !== undefined ? data.paymentMethod : undefined,
          status: InvoiceStatus.Paid,
        },
      });

      const invoice = await tx.invoice.findUnique({
        where: { id },
        include: {
          bookings: {
            include: {
              details: true,
            },
          },
          orders: {
            include: {
              details: true,
            },
          },
        },
      });
      if (!invoice) {
        throw new NotFoundException(`Invoice with ID ${id} not found`);
      }

      if (claimed.count === 0) {
        return invoice;
      }

      for (const booking of invoice.bookings) {
        for (const detail of booking.details) {
          if (detail.custPkgId) {
            const updatedPackage = await tx.customerPackage.updateMany({
              where: {
                id: detail.custPkgId,
                remainingSessions: { gte: 1 },
              },
              data: {
                remainingSessions: { decrement: 1 },
              },
            });
            if (updatedPackage.count === 0) {
              throw new BadRequestException('Customer package does not have enough remaining sessions');
            }
          }
        }
      }

      for (const order of invoice.orders) {
        for (const detail of order.details) {
          const updatedProduct = await tx.product.updateMany({
            where: {
              id: detail.productId,
              stockQuantity: { gte: detail.quantity },
            },
            data: {
              stockQuantity: { decrement: detail.quantity },
            },
          });
          if (updatedProduct.count === 0) {
            throw new BadRequestException('Product stock is not enough for this order');
          }
        }
      }

      const pointsToAdd = Math.floor(Number(invoice.totalAmount) / 10000);
      if (pointsToAdd > 0) {
        await tx.user.update({
          where: { id: invoice.customerId },
          data: {
            loyaltyPoints: { increment: pointsToAdd },
          },
        });
      }

      return invoice;
    });
  }
}
