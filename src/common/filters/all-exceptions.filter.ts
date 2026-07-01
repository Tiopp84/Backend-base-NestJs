import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch() // Bắt tất cả các loại lỗi
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const path = request.url;
        const method = request.method;

        // Kiểm tra xem lỗi có phải lỗi HTTP chuẩn (404, 401, 403...) không
        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        // Lấy thông báo lỗi
        const messageBody =
            exception instanceof HttpException
                ? exception.getResponse()
                : 'Internal server error';

        let message = 'Internal server error';
        let errorString = 'InternalServerError';
        let errorCode = 'INTERNAL_SERVER_ERROR';

        if (exception instanceof HttpException) {
            if (typeof messageBody === 'object' && messageBody !== null) {
                message = messageBody['message'] || JSON.stringify(messageBody);
                errorString = messageBody['error'] || 'HttpException';
                errorCode = messageBody['errorCode'] || errorString.toUpperCase().replace(/\s+/g, '_');
            } else {
                message = String(messageBody);
                errorString = 'HttpException';
                errorCode = 'HTTP_EXCEPTION';
            }
        }

        // Ghi log trên máy chủ
        if (status >= 500) {
            const stack = exception instanceof Error ? exception.stack : JSON.stringify(exception);
            this.logger.error(`[${method}] ${path} - Status: ${status} - Error: ${message}. Stack trace:\n${stack}`);
        } else {
            this.logger.warn(`[${method}] ${path} - Status: ${status} - Warning: ${message}`);
        }

        // Đóng gói JSON trả về thống nhất
        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            message: Array.isArray(message) ? message[0] : message, // Lấy lỗi validate đầu tiên nếu là mảng
            error: errorString,
            errorCode: errorCode,
            path: path,
        });
    }
}