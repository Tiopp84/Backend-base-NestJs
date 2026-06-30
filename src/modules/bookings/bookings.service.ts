import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsGateway: NotificationsGateway,
  ) { }

  async create(data: CreateBookingDto) {
    this.notificationsGateway.sendNotification(data.customerId, 'Bạn có một booking mới');
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

  async findAll(paginationDto: PaginationDto) {
    const { page, limit, sortBy, order } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        skip,
        take: limit,
        orderBy: { [sortBy]: order } as any,
        include: {
          details: {
            include: { employees: true },
          },
        },
      }),
      this.prisma.booking.count(),
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
}

