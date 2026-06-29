import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Đánh dấu Global cực kỳ quan trọng
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Export ra để các module khác (như SalonsModule) có thể sử dụng
})
export class PrismaModule { }