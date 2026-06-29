import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    constructor() {
        // 1. Khởi tạo một Pool kết nối của thư viện 'pg'
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL
        });

        // 2. Bọc Pool đó bằng Adapter của Prisma
        const adapter = new PrismaPg(pool);

        // 3. Truyền Adapter vào PrismaClient
        super({
            adapter: adapter,
            log: ['query', 'info', 'warn', 'error'],
        });
    }

    async onModuleInit() {
        await this.$connect();
    }
}