import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
        private prisma: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // 1. Lấy request từ client gửi lên
        const request = context.switchToHttp().getRequest();

        // 2. Trích xuất token từ Header
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new UnauthorizedException('Bạn chưa cung cấp Token đăng nhập');
        }

        try {
            // 3. Nhờ JwtService giải mã và kiểm tra hạn sử dụng của Token
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
            });

            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
                select: {
                    id: true,
                    email: true,
                    roleId: true,
                    role: {
                        select: {
                            roleName: true,
                        },
                    },
                },
            });

            if (!user) {
                throw new UnauthorizedException('Tài khoản không còn tồn tại');
            }

            request['user'] = {
                ...payload,
                sub: user.id,
                email: user.email,
                roleId: user.roleId,
                roleName: user.role?.roleName || null,
            };
        } catch {
            // Bắt mọi lỗi: sai chữ ký, hết hạn...
            throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
        }

        // 5. Cho phép đi qua cửa
        return true;
    }

    // Hàm phụ trợ để bóc tách chữ "Bearer" ra khỏi chuỗi Token
    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
