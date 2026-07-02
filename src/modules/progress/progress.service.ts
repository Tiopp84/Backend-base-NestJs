import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProgressDto } from './dto/create-progress.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

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

  async findAll(userId: string, roleName: string, paginationDto: PaginationDto) {
    const { page, limit, sortBy, order } = paginationDto;
    const skip = (page - 1) * limit;

    const whereClause = roleName === 'Customer' ? {
      bookingDetail: {
        booking: {
          customerId: userId,
        },
      },
    } : {};

    const [data, total] = await Promise.all([
      this.prisma.customerProgress.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { [sortBy]: order } as any,
        include: {
          bookingDetail: {
            include: {
              service: true,
              booking: true,
            },
          },
        },
      }),
      this.prisma.customerProgress.count({
        where: whereClause,
      }),
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
}
