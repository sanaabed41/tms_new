import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryCompany } from './delivery-company.entity';

@Injectable()
export class DeliveryCompaniesService {
  constructor(@InjectRepository(DeliveryCompany) private repo: Repository<DeliveryCompany>) {}

  findAll(companyId: string) {
    return this.repo.find({ where: { company: { id: companyId } }, relations: ['camions'] });
  }

  async findOne(id: string) {
    const dc = await this.repo.findOne({ where: { id }, relations: ['camions', 'company'] });
    if (!dc) throw new NotFoundException('Delivery company not found');
    return dc;
  }

  create(dto: any, companyId: string) {
    const dc = this.repo.create({ ...dto, company: { id: companyId } });
    return this.repo.save(dc);
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const dc = await this.findOne(id);
    return this.repo.remove(dc);
  }
}
