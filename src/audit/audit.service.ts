import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log({
    userId,
    userEmail,
    action,
    entity,
    entityId,
    changes,
  }: {
    userId: string;
    userEmail: string;
    action: string;
    entity: string;
    entityId: string;
    changes?: object;
  }) {
    await this.prisma.auditLog.create({
      data: {
        userId,
        userEmail,
        action,
        entity,
        entityId,
        changes: changes ? JSON.stringify(changes) : null,
      },
    });
  }

  async findAll() {
    const logs = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        userEmail: true,
        action: true,
        entity: true,
        entityId: true,
        changes: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      message: 'Audit logs retrieved successfully',
      data: logs,
    };
  }
}