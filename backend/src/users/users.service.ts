import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

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
    const user = this.repo.create({
      ...dto,
      password: hashed,
      company: { id: dto.companyId },
    });
    return this.repo.save(user);
  }

  async update(id: string, dto: any, caller: { role: Role; companyId: string }) {
    const target = await this.findOne(id);

    // COMPANY_ADMIN ne peut modifier que les users de sa propre société
    if (caller.role === Role.COMPANY_ADMIN && target.company?.id !== caller.companyId) {
      throw new ForbiddenException('Accès interdit');
    }

    // Personne ne peut s'auto-élever au rang SUPER_ADMIN sauf un SUPER_ADMIN
    if (dto.role === Role.SUPER_ADMIN && caller.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Vous ne pouvez pas attribuer ce rôle');
    }

    if (dto.password) dto.password = await bcrypt.hash(dto.password, 10);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async toggleActive(id: string) {
    const user = await this.findOne(id);
    await this.repo.update(id, { isActive: !user.isActive });
    return this.findOne(id);
  }

  async remove(id: string, caller: { role: Role; companyId: string }) {
    const target = await this.findOne(id);

    if (caller.role === Role.COMPANY_ADMIN && target.company?.id !== caller.companyId) {
      throw new ForbiddenException('Accès interdit');
    }

    // Personne ne peut supprimer un SUPER_ADMIN sauf un autre SUPER_ADMIN
    if (target.role === Role.SUPER_ADMIN && caller.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Accès interdit');
    }

    return this.repo.remove(target);
  }
}
