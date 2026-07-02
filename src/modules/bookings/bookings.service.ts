import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('notifications') private readonly notificationsQueue: Queue,
  ) { }

  async create(data: CreateBookingDto) {
    await this.notificationsQueue.add('send-booking-notification', {
      customerId: data.customerId,
      message: 'Bạn có một booking mới',
    });
    return this.prisma.booking.create({
      data: {
        customerId: data.customerId,
        invoiceId: data.invoiceId,
        arrivalTime: new Date(data.arrivalTime),
        status: data.status,
        details: {
          create: data.details.map(detail => ({
            serviceId: detail.serviceId,
            custPkgId: detail.custPkgId,
            startTime: new Date(detail.startTime),
            endTime: new Date(detail.endTime),
            actualPrice: detail.actualPrice,
            employees: {
              create: detail.employees?.map(emp => ({
                employeeId: emp.employeeId,
                roleType: emp.roleType,
                commissionEarned: emp.commissionEarned,
              })) || [],
            },
          })),
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
        orderBy: { [sortBy]: order } as any,
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

