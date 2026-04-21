import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TruckAvailability } from './truck-availability.entity';
import { Truck } from '../trucks/truck.entity';

@Injectable()
export class TruckAvailabilityService {
  constructor(
    @InjectRepository(TruckAvailability) private repo: Repository<TruckAvailability>,
    @InjectRepository(Truck) private truckRepo: Repository<Truck>,
  ) {}

  findByDate(companyId: string, date: string) {
    return this.repo.createQueryBuilder('ta')
      .leftJoinAndSelect('ta.truck', 'truck')
      .leftJoinAndSelect('truck.deliveryCompany', 'dc')
      .leftJoinAndSelect('dc.company', 'company')
      .where('company.id = :companyId', { companyId })
      .andWhere('ta.date = :date', { date })
      .orderBy('dc.nom')
      .addOrderBy('truck.matricule')
      .getMany();
  }

  async addTruck(companyId: string, truckId: string, date: string) {
    const truck = await this.truckRepo.findOne({ where: { id: truckId } });
    if (!truck) throw new NotFoundException('Truck not found');

    const existing = await this.repo.findOne({ where: { truck: { id: truckId }, date } });
    if (existing) throw new ConflictException('Truck already declared available for this date');

    const availability = this.repo.create({
      date,
      truck: { id: truckId },
      company: { id: companyId },
    });
    return this.repo.save(availability);
  }

  async bulkSet(companyId: string, truckIds: string[], date: string) {
    // Remove all availabilities for this date
    await this.repo
      .createQueryBuilder()
      .delete()
      .from(TruckAvailability)
      .where('date = :date AND "companyId" = :companyId', { date, companyId })
      .execute();

    if (truckIds.length === 0) return { set: 0 };

    const trucks = await this.truckRepo.findBy({ id: In(truckIds) });
    const entities = trucks.map((truck) =>
      this.repo.create({ date, truck, company: { id: companyId } }),
    );
    await this.repo.save(entities);
    return { set: entities.length };
  }

  async remove(companyId: string, id: string) {
    const ta = await this.repo.findOne({ where: { id } });
    if (!ta) throw new NotFoundException('Availability not found');
    await this.repo.delete(id);
  }
}
