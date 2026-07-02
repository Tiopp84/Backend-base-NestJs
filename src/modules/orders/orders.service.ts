import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { OrderStatus } from 'src/common/enums/business.enum';
import { getSafeSortBy } from 'src/common/utils/pagination.util';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateOrderDto, userPayload?: any) {
    const isCustomer = userPayload?.roleName === 'Customer';
    const customerId = isCustomer ? userPayload.sub : data.customerId;
    const status = isCustomer ? OrderStatus.Pending : data.status;

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: data.invoiceId },
      select: { customerId: true },
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${data.invoiceId} not found`);
    }
    if (invoice.customerId !== customerId) {
      throw new ForbiddenException('Invoice does not belong to this customer');
    }
    if (!data.details?.length) {
      throw new BadRequestException('Order must contain at least one product');
    }

    const detailsData = await Promise.all(data.details.map(async (detail) => {
      const product = await this.prisma.product.findUnique({
        where: { id: detail.productId },
        select: {
          price: true,
          commissionRate: true,
        },
      });
      if (!product) {
        throw new NotFoundException(`Product with ID ${detail.productId} not found`);
      }

      const unitPrice = isCustomer ? Number(product.price) : detail.unitPrice;
      return {
        productId: detail.productId,
        employeeId: detail.employeeId,
        quantity: detail.quantity,
        unitPrice,
        commissionEarned: isCustomer
          ? unitPrice * detail.quantity * Number(product.commissionRate)
          : detail.commissionEarned,
      };
    }));

    return this.prisma.order.create({
      data: {
        customerId,
        invoiceId: data.invoiceId,
        status,
        details: {
          create: detailsData,
        },
      },
      include: {
        details: true,
      },
    });
  }

  async findAll(paginationDto: PaginationDto, employeeId?: string) {
    const { page, limit, sortBy, order } = paginationDto;
    const skip = (page - 1) * limit;
    const safeSortBy = getSafeSortBy(sortBy, ['id', 'customerId', 'invoiceId', 'status']);
    const where = employeeId ? {
      details: {
        some: {
          employeeId
        }
      }
    } : {};

    const [data, total] = await Promise.all([
        this.prisma.order.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [safeSortBy]: order } as any,
            include: { 
              details: {
                include: { product: true }
              },
              customer: true
            },
        }),
        this.prisma.order.count({ where }),
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
