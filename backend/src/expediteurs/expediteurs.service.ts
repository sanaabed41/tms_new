import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocieteExpeditrice } from './societe-expeditrice.entity';
import { Filiere } from './filiere.entity';

@Injectable()
export class ExpediteursService {
  constructor(
    @InjectRepository(SocieteExpeditrice) private societeRepo: Repository<SocieteExpeditrice>,
    @InjectRepository(Filiere) private filiereRepo: Repository<Filiere>,
  ) {}

  findAll(companyId: string) {
    return this.societeRepo.find({
      where: { company: { id: companyId } },
      relations: ['filieres'],
      order: { nom: 'ASC' },
    });
  }

  async findOne(id: string) {
    const s = await this.societeRepo.findOne({ where: { id }, relations: ['filieres'] });
    if (!s) throw new NotFoundException('Société expéditrice introuvable');
    return s;
  }

  async create(dto: any, companyId: string) {
    const societe = this.societeRepo.create({ ...dto, company: { id: companyId } });
    return this.societeRepo.save(societe);
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    await this.societeRepo.update(id, {
      nom: dto.nom,
      code: dto.code,
      couleur: dto.couleur,
      adresse: dto.adresse,
      telephone: dto.telephone,
    });
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.societeRepo.delete(id);
  }

  // ── Filières ──────────────────────────────────────────────────────────────

  async createFiliere(societeId: string, dto: any) {
    await this.findOne(societeId);
    const f = this.filiereRepo.create({ ...dto, societeExpeditrice: { id: societeId } });
    return this.filiereRepo.save(f);
  }

  async updateFiliere(filiereId: string, dto: any) {
    await this.filiereRepo.update(filiereId, { nom: dto.nom, code: dto.code });
    return this.filiereRepo.findOne({ where: { id: filiereId } });
  }

  async removeFiliere(filiereId: string) {
    return this.filiereRepo.delete(filiereId);
  }
}
