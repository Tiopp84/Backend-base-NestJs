import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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

  async findByCustomerId(customerId: string, paginationDto: PaginationDto) {
    const { page, limit, sortBy, order } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { customerId },
        skip,
        take: limit,
        orderBy: { [sortBy]: order } as any,
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
    
    if (data.status === 'PAID' && invoice.status !== 'PAID') {
      await this.prisma.$transaction(async (tx) => {
        // 1. Trừ buổi liệu trình của khách
        for (const booking of invoice.bookings) {
          for (const detail of booking.details) {
            if (detail.custPkgId) {
              const custPkg = await tx.customerPackage.findUnique({
                where: { id: detail.custPkgId },
              });
              if (custPkg) {
                const newSessions = Math.max(0, custPkg.remainingSessions - 1);
                await tx.customerPackage.update({
                  where: { id: custPkg.id },
                  data: { remainingSessions: newSessions },
                });
              }
            }
          }
        }

        // 2. Trừ tồn kho sản phẩm trong đơn hàng
        for (const order of invoice.orders) {
          for (const detail of order.details) {
            const product = await tx.product.findUnique({
              where: { id: detail.productId },
            });
            if (product) {
              const newStock = Math.max(0, product.stockQuantity - detail.quantity);
              await tx.product.update({
                where: { id: product.id },
                data: { stockQuantity: newStock },
              });
            }
          }
        }

        // 3. Cộng điểm tích lũy Loyalty (Mỗi 10,000 VND spent = 1 điểm)
        const pointsToAdd = Math.floor(Number(invoice.totalAmount) / 10000);
        if (pointsToAdd > 0) {
          const user = await tx.user.findUnique({
            where: { id: invoice.customerId },
          });
          if (user) {
            await tx.user.update({
              where: { id: user.id },
              data: { loyaltyPoints: user.loyaltyPoints + pointsToAdd },
            });
          }
        }
      });
    }

    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: data.status,
      },
    });
  }

  async update(id: string, data: { totalAmount?: number; paymentMethod?: string; status?: string }) {
    const invoice = await this.findOne(id);
    
    if (data.status === 'PAID' && invoice.status !== 'PAID') {
      await this.prisma.$transaction(async (tx) => {
        // 1. Trừ buổi liệu trình
        for (const booking of invoice.bookings) {
          for (const detail of booking.details) {
            if (detail.custPkgId) {
              const custPkg = await tx.customerPackage.findUnique({
                where: { id: detail.custPkgId },
              });
              if (custPkg) {
                const newSessions = Math.max(0, custPkg.remainingSessions - 1);
                await tx.customerPackage.update({
                  where: { id: custPkg.id },
                  data: { remainingSessions: newSessions },
                });
              }
            }
          }
        }

        // 2. Trừ tồn kho sản phẩm
        for (const order of invoice.orders) {
          for (const detail of order.details) {
            const product = await tx.product.findUnique({
              where: { id: detail.productId },
            });
            if (product) {
              const newStock = Math.max(0, product.stockQuantity - detail.quantity);
              await tx.product.update({
                where: { id: product.id },
                data: { stockQuantity: newStock },
              });
            }
          }
        }

        // 3. Cộng điểm tích lũy Loyalty
        const total = data.totalAmount !== undefined ? data.totalAmount : Number(invoice.totalAmount);
        const pointsToAdd = Math.floor(total / 10000);
        if (pointsToAdd > 0) {
          const user = await tx.user.findUnique({
            where: { id: invoice.customerId },
          });
          if (user) {
            await tx.user.update({
              where: { id: user.id },
              data: { loyaltyPoints: user.loyaltyPoints + pointsToAdd },
            });
          }
        }
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
}

