import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Truck } from './truck.entity';

@Injectable()
export class TrucksService {
  constructor(@InjectRepository(Truck) private repo: Repository<Truck>) {}

  findAll(deliveryCompanyId?: string) {
    const where = deliveryCompanyId ? { deliveryCompany: { id: deliveryCompanyId } } : {};
    return this.repo.find({ where, relations: ['deliveryCompany'] });
  }

  async findOne(id: string) {
    const truck = await this.repo.findOne({ where: { id }, relations: ['deliveryCompany'] });
    if (!truck) throw new NotFoundException('Truck not found');
    return truck;
  }

  create(dto: any) {
    const truck = this.repo.create({ ...dto, deliveryCompany: { id: dto.deliveryCompanyId } });
    return this.repo.save(truck);
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const truck = await this.findOne(id);
    return this.repo.remove(truck);
  }
}
