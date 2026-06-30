import { PrismaClient } from '@prisma/client';
import { Role } from '../src/common/enums/role.enum';

import * as dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding roles...');

  const rolesToInsert = [
    { roleName: Role.Admin },
    { roleName: Role.Manager },
    { roleName: Role.Employee },
    { roleName: Role.Customer },
  ];

  for (const role of rolesToInsert) {
    const existingRole = await prisma.role.findFirst({
      where: { roleName: role.roleName },
    });

    if (!existingRole) {
      await prisma.role.create({
        data: role,
      });
      console.log(`Created role: ${role.roleName}`);
    } else {
      console.log(`Role ${role.roleName} already exists`);
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
