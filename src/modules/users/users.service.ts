import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcrypt';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { getSafeSortBy } from 'src/common/utils/pagination.util';

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
    const safeSortBy = getSafeSortBy(sortBy, ['id', 'email', 'phone', 'fullName', 'roleId', 'loyaltyPoints']);

    const [data, total] = await Promise.all([
        this.prisma.user.findMany({
            skip,
            take: limit,
            orderBy: { [safeSortBy]: order } as any,
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

  async updateMyProfile(userId: string, data: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng.');
    }

    const updateData: any = {};

    // Update fullName
    if (data.fullName !== undefined) {
      updateData.fullName = data.fullName;
    }

    // Update phone with uniqueness check
    if (data.phone !== undefined) {
      if (data.phone !== user.phone) {
        const existingPhone = await this.prisma.user.findFirst({
          where: { phone: data.phone, id: { not: userId } },
        });
        if (existingPhone) {
          throw new ConflictException('Số điện thoại này đã được sử dụng bởi tài khoản khác.');
        }
      }
      updateData.phone = data.phone;
    }

    // Change password
    if (data.newPassword) {
      if (!data.currentPassword) {
        throw new BadRequestException('Vui lòng nhập mật khẩu hiện tại để xác nhận đổi mật khẩu.');
      }
      if (!user.passwordHash) {
        throw new BadRequestException('Tài khoản đăng ký qua Google không có mật khẩu để xác minh. Vui lòng liên hệ quản trị viên.');
      }
      const isCurrentValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
      if (!isCurrentValid) {
        throw new BadRequestException('Mật khẩu hiện tại không đúng.');
      }
      updateData.passwordHash = await bcrypt.hash(data.newPassword, 10);
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('Không có thông tin nào được thay đổi.');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: userSafeFields,
    });
  }

  async findAllRoles() {
    return this.prisma.role.findMany();
  }
}
