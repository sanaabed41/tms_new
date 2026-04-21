import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './company.entity';

@Injectable()
export class CompaniesService {
  constructor(@InjectRepository(Company) private repo: Repository<Company>) {}

  findAll() {
    return this.repo.find({ relations: ['users', 'deliveryCompanies'] });
  }

  async findOne(id: string) {
    const company = await this.repo.findOne({ where: { id }, relations: ['users', 'deliveryCompanies'] });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  create(dto: Partial<Company>) {
    const company = this.repo.create(dto);
    return this.repo.save(company);
  }

  async update(id: string, dto: Partial<Company>) {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const company = await this.findOne(id);
    return this.repo.remove(company);
  }
}
