import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
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
  console.log('Cleaning up existing database...');
  await prisma.customerProgress.deleteMany();
  await prisma.bookingEmployee.deleteMany();
  await prisma.bookingDetail.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.orderDetail.deleteMany();
  await prisma.order.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.employeeSchedule.deleteMany();
  await prisma.employeeSkill.deleteMany();
  await prisma.customerPackage.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.service.deleteMany();
  await prisma.package.deleteMany();
  await prisma.product.deleteMany();

  console.log('Seeding roles...');
  const roles = ['Admin', 'Manager', 'Employee', 'Customer'];
  const dbRoles: Record<string, any> = {};

  for (const rName of roles) {
    dbRoles[rName] = await prisma.role.create({
      data: { roleName: rName },
    });
    console.log(`Created role: ${rName}`);
  }

  const saltRound = 10;
  const defaultPasswordHash = await bcrypt.hash('123456', saltRound);

  console.log('Seeding users...');
  // 1. Admin user
  const adminUser = await prisma.user.create({
    data: {
      fullName: 'Hệ Thống Admin',
      email: 'admin@amazinpro.com',
      phone: '0900000000',
      passwordHash: defaultPasswordHash,
      roleId: dbRoles['Admin'].id,
    },
  });
  console.log('Created Admin user: admin@amazinpro.com');

  // 2. Manager user
  const managerUser = await prisma.user.create({
    data: {
      fullName: 'Trần Quản Lý',
      email: 'manager@amazinpro.com',
      phone: '0900000002',
      passwordHash: defaultPasswordHash,
      roleId: dbRoles['Manager'].id,
    },
  });
  console.log('Created Manager user: manager@amazinpro.com');

  // 3. Employee users
  const staffToInsert = [
    { fullName: 'Khánh Linh (Chuyên viên Massage)', email: 'linh.massage@amazinpro.com', phone: '0912345671' },
    { fullName: 'Phương Thảo (Chuyên viên Skincare)', email: 'thao.skincare@amazinpro.com', phone: '0912345672' },
    { fullName: 'Anh Tuấn (Chuyên viên Hair Care)', email: 'tuan.hair@amazinpro.com', phone: '0912345673' },
  ];
  const dbStaff: any[] = [];
  for (const staff of staffToInsert) {
    const u = await prisma.user.create({
      data: {
        fullName: staff.fullName,
        email: staff.email,
        phone: staff.phone,
        passwordHash: defaultPasswordHash,
        roleId: dbRoles['Employee'].id,
      },
    });
    dbStaff.push(u);
    console.log(`Created employee: ${staff.fullName}`);
  }

  // 4. Customer users
  const customer1 = await prisma.user.create({
    data: {
      fullName: 'Nguyễn Văn Khách',
      email: 'customer@amazinpro.com',
      phone: '0900000001',
      passwordHash: defaultPasswordHash,
      roleId: dbRoles['Customer'].id,
      loyaltyPoints: 250, // Start with some loyalty points
    },
  });
  const customer2 = await prisma.user.create({
    data: {
      fullName: 'Lê Thị Spa',
      email: 'customer2@amazinpro.com',
      phone: '0900000003',
      passwordHash: defaultPasswordHash,
      roleId: dbRoles['Customer'].id,
      loyaltyPoints: 0,
    },
  });
  console.log('Created customer users');

  console.log('Seeding services...');
  const servicesToInsert = [
    { serviceName: 'Aroma Luxury Massage', durationMin: 60, price: 450000, commissionRate: 0.1 },
    { serviceName: 'Facial Acne Treatment', durationMin: 75, price: 600000, commissionRate: 0.12 },
    { serviceName: 'Hydrotherapy Hair Wash', durationMin: 45, price: 200000, commissionRate: 0.08 },
    { serviceName: 'Gel Nail Art & Care', durationMin: 60, price: 250000, commissionRate: 0.1 },
  ];
  const dbServices: any[] = [];
  for (const s of servicesToInsert) {
    const service = await prisma.service.create({ data: s });
    dbServices.push(service);
    console.log(`Created service: ${s.serviceName}`);
  }

  console.log('Seeding employee skills...');
  const skillsToLink = [
    { employeeIndex: 0, serviceIndex: 0 }, // Linh -> Massage
    { employeeIndex: 0, serviceIndex: 3 }, // Linh -> Nail
    { employeeIndex: 1, serviceIndex: 1 }, // Thảo -> Skincare
    { employeeIndex: 2, serviceIndex: 2 }, // Tuấn -> Hair Wash
  ];
  for (const link of skillsToLink) {
    const employee = dbStaff[link.employeeIndex];
    const service = dbServices[link.serviceIndex];
    await prisma.employeeSkill.create({
      data: {
        employeeId: employee.id,
        serviceId: service.id,
      },
    });
    console.log(`Linked skill: ${employee.fullName} -> ${service.serviceName}`);
  }

  console.log('Seeding employee schedules (next 7 days)...');
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const workDate = new Date(today);
    workDate.setDate(today.getDate() + i);
    const dateStr = workDate.toISOString().split('T')[0];

    for (const emp of dbStaff) {
      await prisma.employeeSchedule.create({
        data: {
          employeeId: emp.id,
          workDate: new Date(dateStr),
          startTime: new Date(`${dateStr}T08:00:00Z`),
          endTime: new Date(`${dateStr}T17:00:00Z`),
          status: 'ACTIVE',
        },
      });
    }
  }
  console.log('Created schedules successfully');

  console.log('Seeding products...');
  const productsToInsert = [
    { productName: 'Premium Sunscreen SPF 50', price: 350000, stockQuantity: 50, commissionRate: 0.05 },
    { productName: 'Organic Rose Water Toner', price: 250000, stockQuantity: 40, commissionRate: 0.05 },
    { productName: 'Hyaluronic Acid Serum', price: 480000, stockQuantity: 30, commissionRate: 0.06 },
  ];
  const dbProducts: any[] = [];
  for (const p of productsToInsert) {
    const prod = await prisma.product.create({ data: p });
    dbProducts.push(prod);
    console.log(`Created product: ${p.productName}`);
  }

  console.log('Seeding packages...');
  const packagesToInsert = [
    { packageName: '10 Sessions Skincare Treatment', totalSessions: 10, price: 5000000 },
    { packageName: '5 Sessions Massage Combo', totalSessions: 5, price: 2000000 },
  ];
  const dbPackages: any[] = [];
  for (const pkg of packagesToInsert) {
    const p = await prisma.package.create({ data: pkg });
    dbPackages.push(p);
    console.log(`Created package: ${pkg.packageName}`);
  }

  console.log('Seeding customer packages (wallet)...');
  // Customer 1 owns a 5 Sessions Massage Combo (already used 1 session, remaining 4)
  const custPkg1 = await prisma.customerPackage.create({
    data: {
      customerId: customer1.id,
      packageId: dbPackages[1].id, // 5 Sessions Massage Combo
      remainingSessions: 4,
    },
  });

  // Customer 2 owns a 10 Sessions Skincare Treatment (unused, remaining 10)
  await prisma.customerPackage.create({
    data: {
      customerId: customer2.id,
      packageId: dbPackages[0].id, // 10 Sessions Skincare Treatment
      remainingSessions: 10,
    },
  });
  console.log('Created customer packages');

  console.log('Seeding invoices...');
  // Invoice 1: Purchased Package (PAID)
  const invoice1 = await prisma.invoice.create({
    data: {
      customerId: customer1.id,
      totalAmount: 2000000,
      paymentMethod: 'CASH',
      status: 'PAID',
    },
  });

  // Invoice 2: Purchased Products (PAID)
  const invoice2 = await prisma.invoice.create({
    data: {
      customerId: customer1.id,
      totalAmount: 1050000, // 3 * Premium Sunscreen
      paymentMethod: 'TRANSFER',
      status: 'PAID',
    },
  });

  // Invoice 3: Booking appointment (PENDING)
  const invoice3 = await prisma.invoice.create({
    data: {
      customerId: customer1.id,
      totalAmount: 600000, // Facial Acne Treatment
      paymentMethod: 'CASH',
      status: 'PENDING',
    },
  });
  console.log('Created invoices');

  console.log('Seeding product orders...');
  // Order 1: Connected to Invoice 2
  const order1 = await prisma.order.create({
    data: {
      customerId: customer1.id,
      invoiceId: invoice2.id,
      status: 'DELIVERED',
      details: {
        create: [
          {
            productId: dbProducts[0].id, // Sunscreen
            employeeId: dbStaff[0].id, // Linh recommended it
            quantity: 3,
            unitPrice: 350000,
            commissionEarned: 350000 * 3 * 0.05, // 52,500
          },
        ],
      },
    },
  });
  console.log('Created order and order details');

  console.log('Seeding bookings...');
  // Booking 1: Linked to Invoice 3 (PENDING, tomorrow)
  const tomorrowStr = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const booking1 = await prisma.booking.create({
    data: {
      customerId: customer1.id,
      invoiceId: invoice3.id,
      arrivalTime: new Date(`${tomorrowStr}T10:00:00Z`),
      status: 'PENDING',
      details: {
        create: [
          {
            serviceId: dbServices[1].id, // Skincare Treatment
            startTime: new Date(`${tomorrowStr}T10:00:00Z`),
            endTime: new Date(`${tomorrowStr}T11:15:00Z`),
            actualPrice: 600000,
            employees: {
              create: [
                {
                  employeeId: dbStaff[1].id, // Thảo
                  roleType: 'MAIN',
                  commissionEarned: 600000 * 0.12, // 72,000
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Booking 2: Linked to Invoice 1 (CONFIRMED, occurred yesterday)
  const yesterdayStr = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const booking2 = await prisma.booking.create({
    data: {
      customerId: customer1.id,
      invoiceId: invoice1.id,
      arrivalTime: new Date(`${yesterdayStr}T09:00:00Z`),
      status: 'CONFIRMED',
      details: {
        create: [
          {
            serviceId: dbServices[0].id, // Aroma Luxury Massage
            custPkgId: custPkg1.id, // Using package
            startTime: new Date(`${yesterdayStr}T09:00:00Z`),
            endTime: new Date(`${yesterdayStr}T10:00:00Z`),
            actualPrice: 450000,
            employees: {
              create: [
                {
                  employeeId: dbStaff[0].id, // Linh
                  roleType: 'MAIN',
                  commissionEarned: 450000 * 0.1, // 45,000
                },
              ],
            },
          },
        ],
      },
    },
    include: {
      details: true,
    },
  });
  console.log('Created bookings, booking details, and booking employees');

  console.log('Seeding customer progress...');
  // Progress log for Booking 2's first detail
  await prisma.customerProgress.create({
    data: {
      bookingDetailId: booking2.details[0].id,
      imgBeforeUrl: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=400',
      imgAfterUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=400',
      notes: 'Khách hàng cảm thấy thư giãn, da dẻ hồng hào hơn sau khi thực hiện liệu trình massage.',
    },
  });
  console.log('Created customer progress logs');

  console.log('Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
