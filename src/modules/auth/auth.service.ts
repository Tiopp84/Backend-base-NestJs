import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) { }

    async register(data: RegisterDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: data.email },
            include: { role: true },
        });

        if (existingUser) {
            throw new BadRequestException('Email đã tồn tại');
        }

        const saltRound = 10;
        const hashedPassword = await bcrypt.hash(data.password, saltRound);

        const newUser = await this.prisma.user.create({
            data: {
                email: data.email,
                passwordHash: hashedPassword,
                fullName: data.fullName,
            },
        });
        return {
            message: 'Đăng ký thành công',
            data: {
                id: newUser.id,
                email: newUser.email,
                fullName: newUser.fullName,
                roleId: newUser.roleId,
            }
        };
    }

    async login(data: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: data.email },
            include: { role: true },
        });
        if (!user) {
            throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
        }

        const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
        }

        const payload = {
            sub: user.id,
            email: user.email,
            roleId: user.roleId,
            roleName: user.role?.roleName || null,
        };

        const accessToken = await this.jwtService.signAsync(payload, {
            secret: process.env.JWT_ACCESS_SECRET,
            expiresIn: '15m',
        });

        const refresToken = await this.jwtService.signAsync(payload, {
            secret: process.env.JWT_REFRESH_SECRET,
            expiresIn: '7d',
        });

        await this.prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: refresToken },
        });

        return {
            message: 'Đăng nhập thành công',
            accessToken,
            refresToken
        };
    }
}