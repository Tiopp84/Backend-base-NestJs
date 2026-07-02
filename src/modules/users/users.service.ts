import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export const userSafeFields = {
  id: true,
  email: true,
  phone: true,
  fullName: true,
  roleId: true,
  loyaltyPoints: true,
  googleId: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  async create(data: CreateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { phone: data.phone }] }
    });
    if (existing) {
      throw new ConflictException('Email or phone already exists');
    }
    const passwordHash = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        passwordHash,
        roleId: data.roleId,
      },
      select: userSafeFields,
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, limit, sortBy, order } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        this.prisma.user.findMany({
            skip,
            take: limit,
            orderBy: { [sortBy]: order } as any,
            select: userSafeFields,
        }),
        this.prisma.user.count(),
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
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSafeFields,
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(id: string, data: UpdateUserDto) {
    await this.findOne(id); // Ensure exists

    const updateData: any = { ...data };
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    delete updateData.password;

    return await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: userSafeFields,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Ensure exists
    return this.prisma.user.delete({
      where: { id },
      select: userSafeFields,
    });
  }

  async getCustomerPackages(userId: string) {
    return this.prisma.customerPackage.findMany({
      where: { customerId: userId },
      include: { package: true },
    });
  }

  async purchasePackage(userId: string, packageId: string) {
    const pkg = await this.prisma.package.findUnique({
      where: { id: packageId },
    });
    if (!pkg) {
      throw new NotFoundException(`Package with ID ${packageId} not found`);
    }

    // 1. Tạo Invoice
    const invoice = await this.prisma.invoice.create({
      data: {
        customerId: userId,
        totalAmount: pkg.price,
        paymentMethod: 'CASH',
        status: 'PAID',
      },
    });

    // 2. Tạo CustomerPackage
    const customerPackage = await this.prisma.customerPackage.create({
      data: {
        customerId: userId,
        packageId: packageId,
        remainingSessions: pkg.totalSessions,
      },
      include: {
        package: true,
      },
    });

    // 3. Cộng điểm tích lũy Loyalty (Mỗi 10,000 VND spent = 1 điểm)
    const pointsToAdd = Math.floor(Number(pkg.price) / 10000);
    if (pointsToAdd > 0) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (user) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { loyaltyPoints: user.loyaltyPoints + pointsToAdd },
        });
      }
    }

    return {
      message: 'Mua gói liệu trình thành công!',
      invoice,
      customerPackage,
    };
  }

  async findAllRoles() {
    return this.prisma.role.findMany();
  }
}

