import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Cấu hình bảo mật helmet
  app.use(helmet());

  // Rewrite /auth/google/callback sang /api/v1/auth/google/callback để khớp với cấu hình Client ID của Google và NestJS Prefix/Versioning
  app.use((req: any, res: any, next: any) => {
    if (req.path === '/auth/google/callback') {
      req.url = '/api/v1/auth/google/callback' + req.url.substring('/auth/google/callback'.length);
    }
    next();
  });

  // Cấu hình CORS
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
  app.enableCors({
    origin: [frontendUrl],
    credentials: true,
  });

  // Kích hoạt shutdown hooks
  app.enableShutdownHooks();

  app.use(cookieParser());

  // Cấu hình global prefix và versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Bật ValidationPipe toàn cục
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Tự động loại bỏ các trường dữ liệu rác không có trong DTO
      forbidNonWhitelisted: true, // Báo lỗi nếu client cố tình gửi dữ liệu rác
      stopAtFirstError: true,
    }),
  );

  // Cấu hình Swagger
  const config = new DocumentBuilder()
    .setTitle('Backend Base Project API')
    .setDescription('API documentation for SpaBooking Managament')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document); // Swagger được chuyển sang api-docs để không trùng với prefix api

  // Đăng ký bộ lọc lỗi toàn cục
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
}
bootstrap();
