import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransportDeclaration } from './transport-declaration.entity';
import { Truck } from '../trucks/truck.entity';
import { LoadingPlan } from '../loading-plans/loading-plan.entity';
import { TruckAvailability } from '../truck-availability/truck-availability.entity';

@Injectable()
export class TransportPortalService {
  constructor(
    @InjectRepository(TransportDeclaration) private declRepo: Repository<TransportDeclaration>,
    @InjectRepository(Truck) private truckRepo: Repository<Truck>,
    @InjectRepository(LoadingPlan) private planRepo: Repository<LoadingPlan>,
    @InjectRepository(TruckAvailability) private availRepo: Repository<TruckAvailability>,
  ) {}

  private today() { return new Date().toISOString().split('T')[0]; }

  // ── Flotte : camions + disponibilité du jour ─────────────────────────────

  async getMyFleet(deliveryCompanyId: string) {
    const trucks = await this.truckRepo.find({
      where: { deliveryCompany: { id: deliveryCompanyId } },
    });
    const date = this.today();
    const avails = await this.availRepo
      .createQueryBuilder('ta')
      .leftJoin('ta.truck', 'truck')
      .leftJoin('truck.deliveryCompany', 'dc')
      .where('dc.id = :id', { id: deliveryCompanyId })
      .andWhere('ta.date = :date', { date })
      .select(['ta.id', 'ta.statut', 'ta.motif', 'ta.date', 'truck.id'])
      .getMany();

    return trucks.map((truck) => ({
      ...truck,
      todayAvailability: avails.find((a) => a.truck?.id === truck.id) ?? null,
    }));
  }

  async createTruck(
    dto: {
      matricule: string;
      capaciteTonnage: number;
      capacitePalettes?: number;
      type?: string;
      chauffeurNom?: string | null;
      chauffeurTel?: string | null;
    },
    deliveryCompanyId: string,
    logistiqueCompanyId: string,
    _userId: string,
  ) {
    const truck = await this.truckRepo.save(
      this.truckRepo.create({
        matricule: dto.matricule,
        capaciteTonnage: dto.capaciteTonnage,
        capacitePalettes: dto.capacitePalettes ?? 0,
        ...(dto.type && { type: dto.type }),
        chauffeurNom: dto.chauffeurNom ?? null,
        chauffeurTel: dto.chauffeurTel ?? null,
        isActive: true,
        deliveryCompany: { id: deliveryCompanyId },
      }),
    );

    // Auto-créer une disponibilité DISPONIBLE pour aujourd'hui
    const date = this.today();
    const existing = await this.availRepo.findOne({ where: { truck: { id: truck.id }, date } });
    if (!existing) {
      await this.availRepo.save(
        this.availRepo.create({
          truck: { id: truck.id },
          date,
          statut: 'DISPONIBLE',
          motif: null,
          company: { id: logistiqueCompanyId },
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
      chauffeurNom?: string | null;
      chauffeurTel?: string | null;
    },
    deliveryCompanyId: string,
    _logistiqueCompanyId: string,
    _userId: string,
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
      ...(dto.chauffeurNom !== undefined && { chauffeurNom: dto.chauffeurNom }),
      ...(dto.chauffeurTel !== undefined && { chauffeurTel: dto.chauffeurTel }),
    });

    return this.truckRepo.findOne({ where: { id: truckId } });
  }

  async setAvailability(
    truckId: string,
    deliveryCompanyId: string,
    logistiqueCompanyId: string,
    date: string,
    statut: 'DISPONIBLE' | 'INDISPONIBLE',
    motif?: string,
  ) {
    const truck = await this.truckRepo.findOne({
      where: { id: truckId },
      relations: ['deliveryCompany'],
    });
    if (!truck) throw new NotFoundException('Camion non trouvé');
    if (truck.deliveryCompany?.id !== deliveryCompanyId) throw new ForbiddenException('Accès interdit');

    const existing = await this.availRepo.findOne({ where: { truck: { id: truckId }, date } });
    if (existing) {
      await this.availRepo.update(existing.id, { statut, motif: motif ?? null });
    } else {
      await this.availRepo.save(
        this.availRepo.create({
          truck: { id: truckId },
          date,
          statut,
          motif: motif ?? null,
          company: { id: logistiqueCompanyId },
        }),
      );
    }
    return { truckId, date, statut, motif: motif ?? null };
  }

  async removeTruck(truckId: string, deliveryCompanyId: string) {
    const truck = await this.truckRepo.findOne({
      where: { id: truckId },
      relations: ['deliveryCompany'],
    });
    if (!truck) throw new NotFoundException('Camion non trouvé');
    if (truck.deliveryCompany?.id !== deliveryCompanyId) throw new ForbiddenException('Accès interdit');

    await this.declRepo
      .createQueryBuilder()
      .delete()
      .where('"truckId" = :truckId', { truckId })
      .execute();

    return this.truckRepo.remove(truck);
  }

  async getRapport(deliveryCompanyId: string, date: string) {
    const trucks = await this.truckRepo.find({
      where: { deliveryCompany: { id: deliveryCompanyId }, isActive: true },
      relations: ['deliveryCompany'],
    });

    const plans = await this.planRepo
      .createQueryBuilder('lp')
      .leftJoinAndSelect('lp.truck', 'truck')
      .leftJoinAndSelect('truck.deliveryCompany', 'dc')
      .leftJoinAndSelect('lp.bonsLivraison', 'bl')
      .leftJoinAndSelect('bl.filiere', 'filiere')
      .leftJoinAndSelect('bl.societeExpeditrice', 'soc')
      .where('dc.id = :deliveryCompanyId', { deliveryCompanyId })
      .andWhere('lp.dateLivraison = :date', { date })
      .orderBy('bl.ordreChargement', 'ASC')
      .getMany();

    return trucks.map((truck) => ({
      truck,
      plan: plans.find((p) => p.truck?.id === truck.id) ?? null,
    }));
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
