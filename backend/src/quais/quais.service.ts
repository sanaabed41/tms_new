import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quai } from './quai.entity';

@Injectable()
export class QuaisService {
  constructor(@InjectRepository(Quai) private repo: Repository<Quai>) {}

  findAll(companyId?: string) {
    const where = companyId ? { company: { id: companyId } } : {};
    return this.repo.find({
      where,
      relations: ['societeExpeditrice', 'filiere'],
      order: { societeExpeditrice: { nom: 'ASC' }, filiere: { nom: 'ASC' }, nom: 'ASC' },
    });
  }

  async create(companyId: string, dto: any) {
    const quai = this.repo.create({
      nom: dto.nom,
      isActive: dto.isActive ?? true,
      company: { id: companyId },
      societeExpeditrice: dto.societeExpeditriceId ? { id: dto.societeExpeditriceId } : null,
      filiere: dto.filiereId ? { id: dto.filiereId } : null,
    });
    return this.repo.save(quai);
  }

  async update(id: string, dto: any) {
    const quai = await this.repo.findOne({ where: { id } });
    if (!quai) throw new NotFoundException('Quai introuvable');
    if (dto.nom !== undefined) quai.nom = dto.nom;
    if (dto.isActive !== undefined) quai.isActive = dto.isActive;
    if ('societeExpeditriceId' in dto)
      (quai as any).societeExpeditrice = dto.societeExpeditriceId ? { id: dto.societeExpeditriceId } : null;
    if ('filiereId' in dto)
      (quai as any).filiere = dto.filiereId ? { id: dto.filiereId } : null;
    return this.repo.save(quai);
  }

  async remove(id: string) {
    const quai = await this.repo.findOne({ where: { id } });
    if (!quai) throw new NotFoundException('Quai introuvable');
    return this.repo.remove(quai);
  }
}
