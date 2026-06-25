import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chauffeur } from './chauffeur.entity';

@Injectable()
export class ChauffeursService {
  constructor(@InjectRepository(Chauffeur) private repo: Repository<Chauffeur>) {}

  findAll(companyId: string) {
    return this.repo.createQueryBuilder('c')
      .leftJoinAndSelect('c.deliveryCompany', 'dc')
      .leftJoin('dc.company', 'company')
      .where('company.id = :companyId', { companyId })
      .orderBy('c.nom', 'ASC')
      .getMany();
  }

  findByDeliveryCompany(deliveryCompanyId: string) {
    return this.repo.find({
      where: { deliveryCompany: { id: deliveryCompanyId } },
      order: { nom: 'ASC' },
    });
  }

  async findOne(id: string) {
    const c = await this.repo.findOne({ where: { id }, relations: ['deliveryCompany'] });
    if (!c) throw new NotFoundException('Chauffeur introuvable');
    return c;
  }

  create(dto: any) {
    const chauffeur = this.repo.create({
      nom: dto.nom,
      prenom: dto.prenom,
      telephone: dto.telephone,
      cin: dto.cin,
      permis: dto.permis,
      deliveryCompany: { id: dto.deliveryCompanyId },
    });
    return this.repo.save(chauffeur);
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    await this.repo.update(id, {
      nom: dto.nom,
      prenom: dto.prenom,
      telephone: dto.telephone,
      cin: dto.cin,
      permis: dto.permis,
    });
    return this.findOne(id);
  }

  async toggleActive(id: string) {
    const chauffeur = await this.findOne(id);
    await this.repo.update(id, { isActive: !chauffeur.isActive });
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.repo.delete(id);
  }
}
