import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BookingStatus } from 'src/common/enums/business.enum';
import { getSafeSortBy } from 'src/common/utils/pagination.util';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('notifications') private readonly notificationsQueue: Queue,
  ) { }

  async create(data: CreateBookingDto, userPayload?: any) {
    const isCustomer = userPayload?.roleName === 'Customer';
    const customerId = isCustomer ? userPayload.sub : data.customerId;
    const status = isCustomer ? BookingStatus.Pending : data.status;

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
      throw new BadRequestException('Booking must contain at least one service');
    }

    const detailsData = await Promise.all(data.details.map(async (detail) => {
      const service = await this.prisma.service.findUnique({
        where: { id: detail.serviceId },
        select: { price: true },
      });
      if (!service) {
        throw new NotFoundException(`Service with ID ${detail.serviceId} not found`);
      }

      if (detail.custPkgId) {
        const customerPackage = await this.prisma.customerPackage.findFirst({
          where: {
            id: detail.custPkgId,
            customerId,
            remainingSessions: { gte: 1 },
          },
        });
        if (!customerPackage) {
          throw new BadRequestException('Customer package is invalid or has no remaining sessions');
        }
      }

      return {
        serviceId: detail.serviceId,
        custPkgId: detail.custPkgId,
        startTime: new Date(detail.startTime),
        endTime: new Date(detail.endTime),
        actualPrice: isCustomer ? (detail.custPkgId ? 0 : service.price) : detail.actualPrice,
        employees: {
          create: isCustomer ? [] : detail.employees?.map(emp => ({
            employeeId: emp.employeeId,
            roleType: emp.roleType,
            commissionEarned: emp.commissionEarned,
          })) || [],
        },
      };
    }));

    await this.notificationsQueue.add('send-booking-notification', {
      customerId,
      message: 'Bạn có một booking mới',
    });
    return this.prisma.booking.create({
      data: {
        customerId,
        invoiceId: data.invoiceId,
        arrivalTime: new Date(data.arrivalTime),
        status,
        details: {
          create: detailsData,
        },
      },
      include: {
        details: {
          include: { employees: true },
        },
      },
    });
  }

  async findAll(paginationDto: PaginationDto, employeeId?: string) {
    const { page, limit, sortBy, order } = paginationDto;
    const skip = (page - 1) * limit;
    const safeSortBy = getSafeSortBy(sortBy, ['id', 'arrivalTime', 'status', 'customerId', 'invoiceId']);
    const where = employeeId ? {
      details: {
        some: {
          employees: {
            some: {
              employeeId
            }
          }
        }
      }
    } : {};

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [safeSortBy]: order } as any,
        include: {
          details: {
            include: { 
              employees: {
                include: { employee: true }
              },
              service: true
            },
          },
          customer: true
        },
      }),
      this.prisma.booking.count({ where }),
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
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        details: {
          include: { employees: true },
        },
      },
    });
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }
    return booking;
  }

  async updateStatus(id: string, data: UpdateBookingStatusDto) {
    await this.findOne(id); // Ensure exists
    return this.prisma.booking.update({
      where: { id },
      data: {
        status: data.status,
      },
    });
  }

  async allocateEmployees(detailId: string, employees: { employeeId: string; roleType: string; commissionEarned: number }[]) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Delete existing allocation for this detail
      await tx.bookingEmployee.deleteMany({
        where: { bookingDetailId: detailId },
      });
      // 2. Create new allocations
      if (employees.length > 0) {
        await tx.bookingEmployee.createMany({
          data: employees.map((emp) => ({
            bookingDetailId: detailId,
            employeeId: emp.employeeId,
            roleType: emp.roleType,
            commissionEarned: emp.commissionEarned,
          })),
        });
      }
      return tx.bookingDetail.findUnique({
        where: { id: detailId },
        include: { employees: true },
      });
    });
  }

  async updateDetail(detailId: string, data: { startTime?: string; endTime?: string }) {
    return this.prisma.bookingDetail.update({
      where: { id: detailId },
      data: {
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        endTime: data.endTime ? new Date(data.endTime) : undefined,
      },
    });
  }
}
