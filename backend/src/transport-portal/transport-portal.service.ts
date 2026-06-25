import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransportDeclaration } from './transport-declaration.entity';
import { Truck } from '../trucks/truck.entity';

@Injectable()
export class TransportPortalService {
  constructor(
    @InjectRepository(TransportDeclaration) private declRepo: Repository<TransportDeclaration>,
    @InjectRepository(Truck) private truckRepo: Repository<Truck>,
  ) {}

  // ── Flotte : camions + leur disponibilité ────────────────────────────────

  async getMyFleet(deliveryCompanyId: string) {
    const trucks = await this.truckRepo.find({
      where: { deliveryCompany: { id: deliveryCompanyId } },
    });
    const declarations = await this.declRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.truck', 'truck')
      .leftJoin('truck.deliveryCompany', 'dc')
      .where('dc.id = :id', { id: deliveryCompanyId })
      .getMany();
    return trucks.map((truck) => ({
      ...truck,
      declaration: declarations.find((d) => d.truck.id === truck.id) ?? null,
    }));
  }

  async createTruck(
    dto: {
      matricule: string;
      capaciteTonnage: number;
      capacitePalettes: number;
      type?: string;
      dateDebut?: string;
      dateFin?: string | null;
      chauffeurNom?: string | null;
      chauffeurTel?: string | null;
      disponible?: boolean;
    },
    deliveryCompanyId: string,
    logistiqueCompanyId: string,
    userId: string,
  ) {
    const truck = await this.truckRepo.save(
      this.truckRepo.create({
        matricule: dto.matricule,
        capaciteTonnage: dto.capaciteTonnage,
        capacitePalettes: dto.capacitePalettes,
        ...(dto.type && { type: dto.type }),
        isActive: true,
        deliveryCompany: { id: deliveryCompanyId },
      }),
    );

    if (dto.dateDebut) {
      await this.declRepo.save(
        this.declRepo.create({
          truck: { id: truck.id },
          dateDebut: dto.dateDebut,
          dateFin: dto.dateFin ?? null,
          chauffeurNom: dto.chauffeurNom ?? null,
          chauffeurTel: dto.chauffeurTel ?? null,
          isActive: dto.disponible !== false,
          logistiqueCompanyId,
          declaredByUserId: userId,
        }),
      );
    }

    return truck;
  }

  async updateTruck(
    truckId: string,
    dto: {
      matricule?: string;
      capaciteTonnage?: number;
      capacitePalettes?: number;
      type?: string;
      dateDebut?: string;
      dateFin?: string | null;
      chauffeurNom?: string | null;
      chauffeurTel?: string | null;
      disponible?: boolean;
    },
    deliveryCompanyId: string,
    logistiqueCompanyId: string,
    userId: string,
  ) {
    const truck = await this.truckRepo.findOne({
      where: { id: truckId },
      relations: ['deliveryCompany'],
    });
    if (!truck) throw new NotFoundException('Camion non trouvé');
    if (truck.deliveryCompany?.id !== deliveryCompanyId) throw new ForbiddenException('Accès interdit');

    await this.truckRepo.update(truckId, {
      ...(dto.matricule !== undefined && { matricule: dto.matricule }),
      ...(dto.capaciteTonnage !== undefined && { capaciteTonnage: dto.capaciteTonnage }),
      ...(dto.capacitePalettes !== undefined && { capacitePalettes: dto.capacitePalettes }),
      ...(dto.type !== undefined && { type: dto.type }),
    });

    if (dto.dateDebut !== undefined) {
      const existing = await this.declRepo.findOne({ where: { truck: { id: truckId } } });
      if (existing) {
        Object.assign(existing, {
          dateDebut: dto.dateDebut,
          dateFin: dto.dateFin ?? null,
          chauffeurNom: dto.chauffeurNom ?? null,
          chauffeurTel: dto.chauffeurTel ?? null,
          ...(dto.disponible !== undefined && { isActive: dto.disponible }),
        });
        await this.declRepo.save(existing);
      } else {
        await this.declRepo.save(
          this.declRepo.create({
            truck: { id: truckId },
            dateDebut: dto.dateDebut,
            dateFin: dto.dateFin ?? null,
            chauffeurNom: dto.chauffeurNom ?? null,
            chauffeurTel: dto.chauffeurTel ?? null,
            isActive: dto.disponible !== false,
            logistiqueCompanyId,
            declaredByUserId: userId,
          }),
        );
      }
    } else if (dto.disponible !== undefined) {
      const existing = await this.declRepo.findOne({ where: { truck: { id: truckId } } });
      if (existing) {
        await this.declRepo.update(existing.id, { isActive: dto.disponible });
      }
    }

    return this.truckRepo.findOne({ where: { id: truckId } });
  }

  async removeTruck(truckId: string, deliveryCompanyId: string) {
    const truck = await this.truckRepo.findOne({
      where: { id: truckId },
      relations: ['deliveryCompany'],
    });
    if (!truck) throw new NotFoundException('Camion non trouvé');
    if (truck.deliveryCompany?.id !== deliveryCompanyId) throw new ForbiddenException('Accès interdit');

    // Delete declaration manually (onDelete: CASCADE on the FK handles it at DB level,
    // but explicit delete avoids issues if the TypeORM entity-remove path bypasses it)
    await this.declRepo
      .createQueryBuilder()
      .delete()
      .where('"truckId" = :truckId', { truckId })
      .execute();

    return this.truckRepo.remove(truck);
  }

  // ── Vue LOGISTIC_ADMIN : déclarations des transporteurs ─────────────────

  getDeclarationsForLogistique(logistiqueCompanyId: string, dateFrom?: string, dateTo?: string) {
    const qb = this.declRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.truck', 'truck')
      .leftJoinAndSelect('truck.deliveryCompany', 'dc')
      .where('d.logistiqueCompanyId = :logistiqueCompanyId', { logistiqueCompanyId })
      .andWhere('d.isActive = true');

    if (dateFrom) qb.andWhere('d.dateDebut <= :dateTo2', { dateTo2: dateTo ?? dateFrom });
    if (dateTo)   qb.andWhere('(d.dateFin IS NULL OR d.dateFin >= :dateFrom2)', { dateFrom2: dateFrom ?? dateTo });

    return qb.orderBy('d.dateDebut', 'ASC').getMany();
  }
}
