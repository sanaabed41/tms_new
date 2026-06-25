import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository, DeepPartial } from 'typeorm';
import { Company } from './company.entity';
import { CompanyType } from '../common/enums/company-type.enum';

@Injectable()
export class CompaniesService {
  constructor(@InjectRepository(Company) private repo: Repository<Company>) {}

  findAll(type?: CompanyType) {
    const where = type ? { type } : {};
    return this.repo.find({ where, relations: ['logistiqueCompany'], order: { nom: 'ASC' } });
  }

  findByLogistique(logistiqueId: string) {
    return this.repo.find({
      where: { type: CompanyType.EXPEDITEUR, logistiqueCompany: { id: logistiqueId } },
      relations: ['logistiqueCompany'],
      order: { nom: 'ASC' },
    });
  }

  async findOne(id: string) {
    const company = await this.repo.findOne({
      where: { id },
      relations: ['logistiqueCompany', 'expediteurClients'],
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  private normalize(dto: Partial<Company>): Partial<Company> {
    if (dto.nom) dto.nom = dto.nom.trim();
    if (dto.code) dto.code = dto.code.trim().toUpperCase();
    return dto;
  }

  private async assertCodeUnique(code: string, excludeId?: string) {
    if (!code) return;
    const existing = await this.repo.findOne({
      where: excludeId
        ? { code: code.trim().toUpperCase(), id: Not(excludeId) }
        : { code: code.trim().toUpperCase() },
    });
    if (existing)
      throw new BadRequestException(`Le code "${code.toUpperCase()}" est déjà utilisé par "${existing.nom}"`);
  }

  async create(dto: any): Promise<Company> {
    const normalized = this.normalize({ ...dto });
    await this.assertCodeUnique(normalized.code ?? '');
    const data: DeepPartial<Company> = { ...normalized } as DeepPartial<Company>;
    if (dto.logistiqueCompanyId) {
      (data as any).logistiqueCompany = { id: dto.logistiqueCompanyId };
    }
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    const normalized = this.normalize({ ...dto });
    await this.assertCodeUnique(normalized.code ?? '', id);
    const data: any = { ...normalized };
    if ('logistiqueCompanyId' in dto) {
      data.logistiqueCompany = dto.logistiqueCompanyId ? { id: dto.logistiqueCompanyId } : null;
    }
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    const company = await this.repo.findOne({ where: { id }, relations: ['users'] });
    if (!company) throw new NotFoundException('Company not found');
    if (company.users?.length)
      throw new BadRequestException(
        `Impossible de supprimer : ${company.users.length} utilisateur(s) sont liés à cette société`,
      );
    return this.repo.remove(company);
  }

  /** Associe une Company EXPEDITEUR à sa Company LOGISTIQUE */
  async setLogistiqueCompany(expediteurId: string, logistiqueId: string | null) {
    const expediteur = await this.repo.findOne({ where: { id: expediteurId } });
    if (!expediteur) throw new NotFoundException('Société expéditrice introuvable');
    if (expediteur.type !== CompanyType.EXPEDITEUR)
      throw new BadRequestException('La société doit être de type EXPEDITEUR');
    if (logistiqueId) {
      const logistique = await this.repo.findOne({ where: { id: logistiqueId } });
      if (!logistique) throw new NotFoundException('Société logistique introuvable');
      if (logistique.type !== CompanyType.LOGISTIQUE)
        throw new BadRequestException('La société logistique doit être de type LOGISTIQUE');
    }
    await this.repo.update(expediteurId, {
      logistiqueCompany: logistiqueId ? { id: logistiqueId } : null,
    } as any);
    return this.findOne(expediteurId);
  }
}
