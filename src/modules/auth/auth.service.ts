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

        const customerRole = await this.prisma.role.findFirst({
            where: { roleName: 'Customer' },
        });

        const newUser = await this.prisma.user.create({
            data: {
                email: data.email,
                passwordHash: hashedPassword,
                fullName: data.fullName,
                roleId: customerRole?.id || null,
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

        let roleName = user.role?.roleName || null;
        let roleId = user.roleId;

        if (!roleId) {
            const customerRole = await this.prisma.role.findFirst({
                where: { roleName: 'Customer' },
            });
            if (customerRole) {
                await this.prisma.user.update({
                    where: { id: user.id },
                    data: { roleId: customerRole.id },
                });
                roleId = customerRole.id;
                roleName = 'Customer';
            }
        }

        const payload = {
            sub: user.id,
            email: user.email,
            roleId: roleId,
            roleName: roleName,
        };

        const accessToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
            expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m') as any,
        });

        const refreshToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as any,
        });
        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

        await this.prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: refreshTokenHash },
        });

        return {
            message: 'Đăng nhập thành công',
            accessToken,
            refreshToken
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

            if (!user || !user.refreshToken) {
                throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã bị thu hồi');
            }

            const isRefreshTokenValid = await bcrypt.compare(token, user.refreshToken);
            if (!isRefreshTokenValid) {
                throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã bị thu hồi');
            }

            let roleName = user.role?.roleName || null;
            let roleId = user.roleId;

            if (!roleId) {
                const customerRole = await this.prisma.role.findFirst({
                    where: { roleName: 'Customer' },
                });
                if (customerRole) {
                    await this.prisma.user.update({
                        where: { id: user.id },
                        data: { roleId: customerRole.id },
                    });
                    roleId = customerRole.id;
                    roleName = 'Customer';
                }
            }

            const newPayload = {
                sub: user.id,
                email: user.email,
                roleId: roleId,
                roleName: roleName,
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

        const customerRole = await this.prisma.role.findFirst({
            where: { roleName: 'Customer' },
        });

        if (user) {
            // Cập nhật googleId hoặc role nếu chưa có
            const updateData: any = {};
            if (!user.googleId) {
                updateData.googleId = profile.googleId;
            }
            if (!user.roleId && customerRole) {
                updateData.roleId = customerRole.id;
            }
            if (Object.keys(updateData).length > 0) {
                user = await this.prisma.user.update({
                    where: { id: user.id },
                    data: updateData,
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
                    roleId: customerRole?.id || null,
                },
                include: { role: true }
            });
        }

        let roleName = user.role?.roleName || null;
        let roleId = user.roleId;

        if (!roleId && customerRole) {
            roleId = customerRole.id;
            roleName = 'Customer';
        }

        const payload = {
            sub: user.id,
            email: user.email,
            roleId: roleId,
            roleName: roleName,
        };

        const accessToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
            expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m') as any,
        });

        const refreshToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as any,
        });
        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

        await this.prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: refreshTokenHash },
        });

        return {
            accessToken,
            refreshToken,
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

    async clearRefreshToken(userId: string) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });
    }
}
