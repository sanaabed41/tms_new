import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';
import { Role } from '../common/enums/role.enum';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private repo: Repository<User>,
    private auditLogs: AuditLogsService,
  ) {}

  findAll(companyId?: string) {
    if (companyId) {
      return this.repo.find({ where: { company: { id: companyId } }, relations: ['company'] });
    }
    return this.repo.find({ relations: ['company'] });
  }

  async findOne(id: string) {
    const user = await this.repo.findOne({ where: { id }, relations: ['company'] });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email }, relations: ['company'] });
  }

  async create(dto: any, createdBy: User) {
    if (createdBy.role === Role.COMPANY_ADMIN && dto.companyId !== createdBy.company?.id) {
      throw new ForbiddenException('Cannot create user for another company');
    }
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.repo.create({ ...dto, password: hashed, company: { id: dto.companyId } });
    const saved = await this.repo.save(user) as unknown as User;

    await this.auditLogs.log({
      action: 'USER_CREATED',
      actorId: createdBy.id,
      actorEmail: createdBy.email,
      actorRole: createdBy.role,
      targetId: saved.id,
      targetEmail: saved.email,
      companyId: dto.companyId,
      metadata: { role: dto.role },
    });

    return saved;
  }

  async update(id: string, dto: any, caller: { role: Role; companyId: string }) {
    const target = await this.findOne(id);

    if (caller.role === Role.COMPANY_ADMIN && target.company?.id !== caller.companyId) {
      throw new ForbiddenException('Accès interdit');
    }
    if (dto.role === Role.SUPER_ADMIN && caller.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Vous ne pouvez pas attribuer ce rôle');
    }

    if (dto.password) dto.password = await bcrypt.hash(dto.password, 10);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async toggleActive(id: string, actor?: { id: string; email: string; role: string }) {
    const user = await this.findOne(id);
    const newState = !user.isActive;
    await this.repo.update(id, { isActive: newState });

    await this.auditLogs.log({
      action: newState ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      actorId: actor?.id,
      actorEmail: actor?.email,
      actorRole: actor?.role,
      targetId: user.id,
      targetEmail: user.email,
      companyId: user.company?.id,
      companyNom: user.company?.nom,
    });

    return this.findOne(id);
  }

  async remove(id: string, caller: { role: Role; companyId: string; id?: string; email?: string }) {
    const target = await this.findOne(id);

    if (caller.role === Role.COMPANY_ADMIN && target.company?.id !== caller.companyId) {
      throw new ForbiddenException('Accès interdit');
    }
    if (target.role === Role.SUPER_ADMIN && caller.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Accès interdit');
    }

    await this.auditLogs.log({
      action: 'USER_DELETED',
      actorId: caller.id,
      actorEmail: caller.email,
      actorRole: caller.role,
      targetId: target.id,
      targetEmail: target.email,
      companyId: target.company?.id,
      companyNom: target.company?.nom,
    });

    return this.repo.remove(target);
  }
}
