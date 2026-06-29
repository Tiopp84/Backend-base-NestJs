import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        // 1. Đọc nhãn @Roles(...) xem API này yêu cầu những roleId nào
        const requiredRoles = this.reflector.getAllAndOverride<number[]>('roles', [
            context.getHandler(),
            context.getClass(),
        ]);

        // Nếu API không dán nhãn @Roles, mặc định cho phép tất cả đi qua
        if (!requiredRoles) {
            return true;
        }

        // 2. Lấy thông tin user (đã được ông AuthGuard nhét vào request từ trước)
        const { user } = context.switchToHttp().getRequest();

        // 3. Kiểm tra xem roleId của user có nằm trong danh sách được phép không
        if (!user || !requiredRoles.includes(user.roleId)) {
            throw new ForbiddenException('Bạn không có quyền thực hiện hành động này!');
        }

        return true;
    }
}