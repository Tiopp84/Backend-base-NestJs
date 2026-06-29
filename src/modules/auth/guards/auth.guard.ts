import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
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

            // 4. Nếu hợp lệ, nhét thông tin (ID, Email) vào request để các API sau này dùng
            request['user'] = payload;
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