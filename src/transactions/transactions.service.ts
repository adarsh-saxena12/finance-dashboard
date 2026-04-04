import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { AuditService } from '../audit/audit.service';
import { Role } from '../common/types';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateTransactionDto, user: { id: string; email: string }) {
    const transaction = await this.prisma.transaction.create({
      data: {
        amount: dto.amount,
        type: dto.type,
        category: dto.category,
        date: new Date(dto.date),
        notes: dto.notes,
        userId: user.id,
      },
    });

    await this.auditService.log({
      userId: user.id,
      userEmail: user.email,
      action: 'CREATE',
      entity: 'Transaction',
      entityId: transaction.id,
      changes: dto,
    });

    return {
      success: true,
      message: 'Transaction created successfully',
      data: transaction,
    };
  }

  async findAll(filters: FilterTransactionDto) {
    const page = parseInt(filters.page || '1');
    const limit = parseInt(filters.limit || '10');
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (filters.type) where.type = filters.type;
    if (filters.category) where.category = filters.category;
    if (filters.search) {
      where.OR = [
        { category: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate);
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      success: true,
      message: 'Transactions retrieved successfully',
      data: {
        transactions,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async findOne(id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return {
      success: true,
      message: 'Transaction retrieved successfully',
      data: transaction,
    };
  }

  async update(
    id: string,
    dto: UpdateTransactionDto,
    user: { id: string; email: string; role: string },
  ) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, deletedAt: null },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (user.role === Role.ANALYST && transaction.userId !== user.id) {
      throw new ForbiddenException(
        'Analysts can only update their own transactions',
      );
    }

    const updated = await this.prisma.transaction.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
      },
    });

    await this.auditService.log({
      userId: user.id,
      userEmail: user.email,
      action: 'UPDATE',
      entity: 'Transaction',
      entityId: id,
      changes: dto,
    });

    return {
      success: true,
      message: 'Transaction updated successfully',
      data: updated,
    };
  }

  async remove(id: string, user: { id: string; email: string }) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, deletedAt: null },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    await this.prisma.transaction.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.log({
      userId: user.id,
      userEmail: user.email,
      action: 'DELETE',
      entity: 'Transaction',
      entityId: id,
    });

    return {
      success: true,
      message: 'Transaction deleted successfully',
      data: null,
    };
  }
}