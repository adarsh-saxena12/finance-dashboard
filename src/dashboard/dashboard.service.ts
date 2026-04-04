import { PrismaService } from '../prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary() {
    const [income, expense, recentTransactions] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { type: 'INCOME', deletedAt: null },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { type: 'EXPENSE', deletedAt: null },
        _sum: { amount: true },
      }),
      this.prisma.transaction.findMany({
        where: { deletedAt: null },
        orderBy: { date: 'desc' },
        take: 5,
        include: {
          user: { select: { id: true, name: true } },
        },
      }),
    ]);

    const totalIncome = income._sum.amount || 0;
    const totalExpense = expense._sum.amount || 0;
    const netBalance = totalIncome - totalExpense;

    return {
      success: true,
      message: 'Dashboard summary retrieved successfully',
      data: {
        totalIncome,
        totalExpense,
        netBalance,
        recentTransactions,
      },
    };
  }

  async getCategoryBreakdown() {
    const categories = await this.prisma.transaction.groupBy({
      by: ['category', 'type'],
      where: { deletedAt: null },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    const breakdown = categories.map((c) => ({
      category: c.category,
      type: c.type,
      total: c._sum.amount || 0,
      count: c._count.id,
    }));

    return {
      success: true,
      message: 'Category breakdown retrieved successfully',
      data: breakdown,
    };
  }

  async getMonthlyTrends() {
    const transactions = await this.prisma.transaction.findMany({
      where: { deletedAt: null },
      select: {
        amount: true,
        type: true,
        date: true,
      },
      orderBy: { date: 'asc' },
    });

    const trendsMap: { [key: string]: { month: string; income: number; expense: number; net: number } } = {};

    transactions.forEach((t) => {
      const month = t.date.toISOString().slice(0, 7);
      if (!trendsMap[month]) {
        trendsMap[month] = { month, income: 0, expense: 0, net: 0 };
      }
      if (t.type === 'INCOME') {
        trendsMap[month].income += t.amount;
      } else {
        trendsMap[month].expense += t.amount;
      }
      trendsMap[month].net =
        trendsMap[month].income - trendsMap[month].expense;
    });

    return {
      success: true,
      message: 'Monthly trends retrieved successfully',
      data: Object.values(trendsMap),
    };
  }

  async getWeeklyTrends() {
    const sevenWeeksAgo = new Date();
    sevenWeeksAgo.setDate(sevenWeeksAgo.getDate() - 49);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        deletedAt: null,
        date: { gte: sevenWeeksAgo },
      },
      select: {
        amount: true,
        type: true,
        date: true,
      },
      orderBy: { date: 'asc' },
    });

    const weeksMap: {
      [key: string]: {
        week: string;
        startDate: string;
        endDate: string;
        income: number;
        expense: number;
        net: number;
      };
    } = {};

    transactions.forEach((t) => {
      const date = new Date(t.date);
      const dayOfWeek = date.getDay();
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - dayOfWeek);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const weekKey = startOfWeek.toISOString().slice(0, 10);

      if (!weeksMap[weekKey]) {
        weeksMap[weekKey] = {
          week: weekKey,
          startDate: startOfWeek.toISOString().slice(0, 10),
          endDate: endOfWeek.toISOString().slice(0, 10),
          income: 0,
          expense: 0,
          net: 0,
        };
      }

      if (t.type === 'INCOME') {
        weeksMap[weekKey].income += t.amount;
      } else {
        weeksMap[weekKey].expense += t.amount;
      }

      weeksMap[weekKey].net =
        weeksMap[weekKey].income - weeksMap[weekKey].expense;
    });

    return {
      success: true,
      message: 'Weekly trends retrieved successfully',
      data: Object.values(weeksMap),
    };
  }

  async getTopCategories() {
    const categories = await this.prisma.transaction.groupBy({
      by: ['category'],
      where: { deletedAt: null, type: 'EXPENSE' },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 5,
    });

    return {
      success: true,
      message: 'Top categories retrieved successfully',
      data: categories.map((c) => ({
        category: c.category,
        total: c._sum.amount || 0,
      })),
    };
  }

  async getUserSummary(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [income, expense, recentTransactions] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { userId, type: 'INCOME', deletedAt: null },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { userId, type: 'EXPENSE', deletedAt: null },
        _sum: { amount: true },
      }),
      this.prisma.transaction.findMany({
        where: { userId, deletedAt: null },
        orderBy: { date: 'desc' },
        take: 5,
      }),
    ]);

    const totalIncome = income._sum.amount || 0;
    const totalExpense = expense._sum.amount || 0;
    const netBalance = totalIncome - totalExpense;

    return {
      success: true,
      message: 'User summary retrieved successfully',
      data: {
        user,
        totalIncome,
        totalExpense,
        netBalance,
        recentTransactions,
      },
    };
  }
}