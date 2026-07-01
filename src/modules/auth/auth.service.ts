import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
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

        if (!user.passwordHash) {
            throw new UnauthorizedException('Tài khoản này được đăng ký qua Google. Vui lòng đăng nhập bằng Google.');
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
            secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
            expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m') as any,
        });

        const refresToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as any,
        });

        await this.prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: refresToken },
        });

        return {
            message: 'Đăng nhập thành công',
            accessToken,
            refreshToken: refresToken
        };
    }

    async refreshAccessToken(token: string) {
        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            });

            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
                include: { role: true }
            });

            if (!user || user.refreshToken !== token) {
                throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã bị thu hồi');
            }

            const newPayload = {
                sub: user.id,
                email: user.email,
                roleId: user.roleId,
                roleName: user.role?.roleName || null,
            };

            const accessToken = await this.jwtService.signAsync(newPayload, {
                secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
                expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m') as any,
            });

            return { accessToken };
        } catch (error) {
            throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
        }
    }

    async validateGoogleUser(profile: any) {
        let user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { googleId: profile.googleId },
                    { email: profile.email }
                ]
            },
            include: { role: true }
        });

        if (user) {
            // Cập nhật googleId nếu chưa có
            if (!user.googleId) {
                user = await this.prisma.user.update({
                    where: { id: user.id },
                    data: { googleId: profile.googleId },
                    include: { role: true }
                });
            }
        } else {
            // Tạo mới user
            user = await this.prisma.user.create({
                data: {
                    email: profile.email,
                    fullName: profile.fullName,
                    googleId: profile.googleId,
                },
                include: { role: true }
            });
        }

        const payload = {
            sub: user.id,
            email: user.email,
            roleId: user.roleId,
            roleName: user.role?.roleName || null,
        };

        const accessToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
            expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m') as any,
        });

        const refresToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as any,
        });

        await this.prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: refresToken },
        });

        return {
            accessToken,
            refreshToken: refresToken,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                roleId: user.roleId,
            }
        };
    }

    async getFreshProfile(userId: string) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                loyaltyPoints: true,
                role: {
                    select: {
                        roleName: true,
                    },
                },
            },
        });
    }
}