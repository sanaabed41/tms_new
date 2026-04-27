import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { AuditLog } from './audit-log.entity';

export interface LogPayload {
  action: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  targetId?: string;
  targetEmail?: string;
  companyId?: string;
  companyNom?: string;
  ip?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog) private repo: Repository<AuditLog>,
  ) {}

  async log(payload: LogPayload): Promise<void> {
    try {
      await this.repo.save(this.repo.create(payload));
    } catch {
      // audit log must never crash the main flow
    }
  }

  async findAll(filters: {
    companyId?: string;
    action?: string;
    fromDate?: string;
    toDate?: string;
    search?: string;
    limit?: number;
  } = {}): Promise<AuditLog[]> {
    const qb = this.repo.createQueryBuilder('log').orderBy('log.createdAt', 'DESC');

    if (filters.companyId) {
      qb.andWhere('log.companyId = :cid', { cid: filters.companyId });
    }
    if (filters.action) {
      qb.andWhere('log.action = :action', { action: filters.action });
    }
    if (filters.fromDate) {
      qb.andWhere('log.createdAt >= :from', { from: new Date(filters.fromDate) });
    }
    if (filters.toDate) {
      const to = new Date(filters.toDate);
      to.setHours(23, 59, 59, 999);
      qb.andWhere('log.createdAt <= :to', { to });
    }
    if (filters.search) {
      qb.andWhere(
        '(log.actorEmail ILIKE :s OR log.targetEmail ILIKE :s OR log.companyNom ILIKE :s)',
        { s: `%${filters.search}%` },
      );
    }

    return qb.take(filters.limit ?? 500).getMany();
  }
}
