import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProgressDto } from './dto/create-progress.dto';

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateProgressDto) {
    const bookingDetail = await this.prisma.bookingDetail.findUnique({
      where: { id: data.bookingDetailId },
    });
    if (!bookingDetail) {
      throw new NotFoundException(`Booking detail with ID ${data.bookingDetailId} not found`);
    }

    return this.prisma.customerProgress.create({
      data: {
        bookingDetailId: data.bookingDetailId,
        imgBeforeUrl: data.imgBeforeUrl || null,
        imgAfterUrl: data.imgAfterUrl || null,
        notes: data.notes || null,
      },
      include: {
        bookingDetail: {
          include: {
            service: true,
            booking: true,
          },
        },
      },
    });
  }

  async findAll(userId: string, roleName: string) {
    if (roleName === 'Customer') {
      return this.prisma.customerProgress.findMany({
        where: {
          bookingDetail: {
            booking: {
              customerId: userId,
            },
          },
        },
        include: {
          bookingDetail: {
            include: {
              service: true,
              booking: true,
            },
          },
        },
        orderBy: {
          id: 'desc',
        },
      });
    }

    return this.prisma.customerProgress.findMany({
      include: {
        bookingDetail: {
          include: {
            service: true,
            booking: true,
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
    });
  }
}
