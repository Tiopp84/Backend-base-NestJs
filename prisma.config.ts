import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  migrations: {
    path: 'prisma/migrations',
    seed: 'yarn ts-node prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  }
});