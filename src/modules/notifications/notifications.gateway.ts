import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true }) // Cho phép kết nối từ Frontend
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    handleConnection(client: Socket) {
        console.log(`Client kết nối: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client ngắt kết nối: ${client.id}`);
    }

    // Hàm để gửi thông báo cho tất cả hoặc một người cụ thể
    sendNotification(userId: string, message: string) {
        this.server.emit(`notification-${userId}`, { message });
    }
}