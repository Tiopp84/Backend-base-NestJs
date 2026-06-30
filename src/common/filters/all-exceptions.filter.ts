import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch() // Bắt tất cả các loại lỗi
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        // Kiểm tra xem lỗi có phải lỗi HTTP chuẩn (404, 401, 403...) không
        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        // Lấy thông báo lỗi
        const message =
            exception instanceof HttpException
                ? exception.getResponse()
                : 'Internal server error';

        // Đóng gói JSON trả về thống nhất
        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            message: message['message'] || message, // Nếu là lỗi validate, message thường là object
            error: message['error'] || 'Unknown Error',
        });
    }
}