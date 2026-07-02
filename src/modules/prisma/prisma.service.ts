import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private pool: Pool;

    constructor(private configService: ConfigService) {
        // 1. Khởi tạo một Pool kết nối của thư viện 'pg'
        const pool = new Pool({
            connectionString: configService.get<string>('DATABASE_URL')
        });

        // 2. Bọc Pool đó bằng Adapter của Prisma
        const adapter = new PrismaPg(pool);

        // 3. Truyền Adapter vào PrismaClient
        super({
            adapter: adapter,
            log: process.env.NODE_ENV === 'production'
                ? ['warn', 'error']
                : ['query', 'info', 'warn', 'error'],
        });

        this.pool = pool;
    }

    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
        await this.pool.end();
    }
}
