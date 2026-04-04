import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('Seeding database...');

  await prisma.transaction.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await bcrypt.hash('admin123', 10);
  const analystPassword = await bcrypt.hash('analyst123', 10);
  const viewerPassword = await bcrypt.hash('viewer123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@finance.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const analyst = await prisma.user.create({
    data: {
      name: 'Analyst User',
      email: 'analyst@finance.com',
      password: analystPassword,
      role: 'ANALYST',
    },
  });

  await prisma.user.create({
    data: {
      name: 'Viewer User',
      email: 'viewer@finance.com',
      password: viewerPassword,
      role: 'VIEWER',
    },
  });

  const transactions = [
    {
      amount: 50000,
      type: 'INCOME' as const,
      category: 'Salary',
      date: new Date('2026-01-01'),
      notes: 'Monthly salary',
      userId: admin.id,
    },
    {
      amount: 25000,
      type: 'INCOME' as const,
      category: 'Freelance',
      date: new Date('2026-01-15'),
      notes: 'Freelance project payment',
      userId: analyst.id,
    },
    {
      amount: 8000,
      type: 'EXPENSE' as const,
      category: 'Rent',
      date: new Date('2026-01-05'),
      notes: 'Monthly rent',
      userId: admin.id,
    },
    {
      amount: 3000,
      type: 'EXPENSE' as const,
      category: 'Utilities',
      date: new Date('2026-01-10'),
      notes: 'Electricity and water',
      userId: admin.id,
    },
    {
      amount: 5000,
      type: 'EXPENSE' as const,
      category: 'Food',
      date: new Date('2026-01-20'),
      notes: 'Groceries and dining',
      userId: analyst.id,
    },
    {
      amount: 60000,
      type: 'INCOME' as const,
      category: 'Salary',
      date: new Date('2026-02-01'),
      notes: 'Monthly salary',
      userId: admin.id,
    },
    {
      amount: 12000,
      type: 'EXPENSE' as const,
      category: 'Travel',
      date: new Date('2026-02-10'),
      notes: 'Business trip',
      userId: analyst.id,
    },
    {
      amount: 8000,
      type: 'EXPENSE' as const,
      category: 'Rent',
      date: new Date('2026-02-05'),
      notes: 'Monthly rent',
      userId: admin.id,
    },
    {
      amount: 15000,
      type: 'INCOME' as const,
      category: 'Investment',
      date: new Date('2026-02-20'),
      notes: 'Stock dividends',
      userId: admin.id,
    },
    {
      amount: 4000,
      type: 'EXPENSE' as const,
      category: 'Food',
      date: new Date('2026-02-25'),
      notes: 'Groceries',
      userId: analyst.id,
    },
    {
      amount: 60000,
      type: 'INCOME' as const,
      category: 'Salary',
      date: new Date('2026-03-01'),
      notes: 'Monthly salary',
      userId: admin.id,
    },
    {
      amount: 8000,
      type: 'EXPENSE' as const,
      category: 'Rent',
      date: new Date('2026-03-05'),
      notes: 'Monthly rent',
      userId: admin.id,
    },
    {
      amount: 20000,
      type: 'INCOME' as const,
      category: 'Freelance',
      date: new Date('2026-03-15'),
      notes: 'Consulting fee',
      userId: analyst.id,
    },
    {
      amount: 6000,
      type: 'EXPENSE' as const,
      category: 'Utilities',
      date: new Date('2026-03-10'),
      notes: 'Internet and phone',
      userId: admin.id,
    },
    {
      amount: 9000,
      type: 'EXPENSE' as const,
      category: 'Entertainment',
      date: new Date('2026-03-20'),
      notes: 'Subscriptions and events',
      userId: analyst.id,
    },
  ];

  await prisma.transaction.createMany({ data: transactions });

  console.log('✅ Database seeded successfully');
  console.log('');
  console.log('Test accounts:');
  console.log('ADMIN    → admin@finance.com    / admin123');
  console.log('ANALYST  → analyst@finance.com  / analyst123');
  console.log('VIEWER   → viewer@finance.com   / viewer123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });