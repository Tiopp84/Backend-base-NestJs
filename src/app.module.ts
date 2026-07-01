import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { ServicesModule } from './modules/services/services.module';
import { PackagesModule } from './modules/packages/packages.module';
import { StaffModule } from './modules/staff/staff.module';
import { UsersModule } from './modules/users/users.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { RedisModule } from './modules/redis/redis.module';
import { QueuesModule } from './modules/queues/queues.module';
import { UploadModule } from './modules/upload/upload.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { validate } from './common/config/env.validation';

@Module({
  imports: [
    // 2. Kích hoạt đọc file .env và biến nó thành Global (toàn cục) với validation
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    PrismaModule,
    AuthModule,
    ServicesModule,
    PackagesModule,
    StaffModule,
    UsersModule,
    InvoicesModule,
    BookingsModule,
    ProductsModule,
    OrdersModule,
    RedisModule,
    QueuesModule,
    UploadModule,
    NotificationsModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: parseInt(config.get<string>('THROTTLE_TTL', '60000'), 10),
            limit: parseInt(config.get<string>('THROTTLE_LIMIT', '10'), 10),
          },
        ],
        storage: new ThrottlerStorageRedisService(
          `redis://${config.get('REDIS_HOST', 'localhost')}:${config.get('REDIS_PORT', 6379)}`
        ),
      }),
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
