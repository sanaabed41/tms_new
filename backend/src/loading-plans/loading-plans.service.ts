import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoadingPlan } from './loading-plan.entity';
import { BonLivraison } from '../bons-livraison/bon-livraison.entity';
import { Truck } from '../trucks/truck.entity';
import { Quai } from '../quais/quai.entity';
import { BlStatus } from '../common/enums/bl-status.enum';

@Injectable()
export class LoadingPlansService {
  constructor(
    @InjectRepository(LoadingPlan) private repo: Repository<LoadingPlan>,
    @InjectRepository(BonLivraison) private blRepo: Repository<BonLivraison>,
    @InjectRepository(Truck) private truckRepo: Repository<Truck>,
    @InjectRepository(Quai) private quaiRepo: Repository<Quai>,
  ) {}

  private baseQuery(companyId: string) {
    return this.repo.createQueryBuilder('lp')
      .leftJoinAndSelect('lp.truck', 'truck')
      .leftJoinAndSelect('truck.deliveryCompany', 'dc')
      .leftJoinAndSelect('dc.company', 'company')
      .leftJoinAndSelect('lp.bonsLivraison', 'bl')
      .leftJoinAndSelect('bl.societeExpeditrice', 'soc')
      .leftJoinAndSelect('bl.filiere', 'filiere')
      .leftJoinAndSelect('bl.blArticles', 'bla')
      .leftJoinAndSelect('bla.article', 'article')
      .leftJoinAndSelect('lp.validatedBy', 'user')
      .where(
        '(CAST(lp."logistiqueCompanyId" AS text) = :companyId OR company.id = CAST(:companyId AS uuid))',
        { companyId },
      );
  }

  findAll(companyId: string, date?: string) {
    const qb = this.baseQuery(companyId);
    if (date) qb.andWhere('lp.dateLivraison = :date', { date });
    return qb
      .orderBy('lp.createdAt', 'DESC')
      .addOrderBy('bl.ordreChargement', 'ASC', 'NULLS LAST')
      .getMany();
  }

  findHistory(companyId: string, dateFrom?: string, dateTo?: string) {
    const qb = this.baseQuery(companyId);
    if (dateFrom) qb.andWhere('lp.dateLivraison >= :dateFrom', { dateFrom });
    if (dateTo)   qb.andWhere('lp.dateLivraison <= :dateTo',   { dateTo });
    return qb
      .orderBy('lp.dateLivraison', 'DESC')
      .addOrderBy('bl.ordreChargement', 'ASC', 'NULLS LAST')
      .getMany();
  }

  async findOne(id: string) {
    const lp = await this.repo.findOne({
      where: { id },
      relations: ['truck', 'truck.deliveryCompany', 'bonsLivraison', 'bonsLivraison.societeExpeditrice', 'bonsLivraison.filiere', 'bonsLivraison.blArticles', 'bonsLivraison.blArticles.article', 'validatedBy'],
    });
    if (!lp) throw new NotFoundException('Loading plan not found');
    lp.bonsLivraison?.sort((a, b) => ((a as any).ordreChargement ?? 0) - ((b as any).ordreChargement ?? 0));
    return lp;
  }

  async create(dto: any) {
    const truck = await this.truckRepo.findOne({ where: { id: dto.truckId } });
    if (!truck) throw new NotFoundException('Truck not found');

    const reference = `PC-${Date.now()}`;
    const lp = this.repo.create({
      reference,
      dateLivraison: dto.dateLivraison,
      truck: { id: dto.truckId },
      logistiqueCompanyId: dto.logistiqueCompanyId ?? null,
    });
    const saved = await this.repo.save(lp);
    return this.findOne(saved.id);
  }

  async assignBl(planId: string, blId: string, _userId: string, force = false) {
    const lp = await this.findOne(planId);
    const bl = await this.blRepo.findOne({ where: { id: blId }, relations: ['societeExpeditrice'] });
    if (!bl) throw new NotFoundException('BL not found');
    if (bl.statut !== BlStatus.VALIDATED) throw new BadRequestException('Only validated BL can be loaded');

    // Note : la contrainte SINGLE_EXPEDITEUR est désactivée — plusieurs sociétés autorisées par camion

    // Auto-invalidate if plan was validated
    if (lp.isValidated) {
      await this.repo.update(planId, { isValidated: false });
      await this.repo.query(`UPDATE loading_plans SET "validatedById" = NULL WHERE id = $1`, [planId]);
    }

    const truck = await this.truckRepo.findOne({ where: { id: lp.truck.id } });
    const currentTonnage = lp.bonsLivraison.reduce((s, b) => s + Number(b.tonnageTotal), 0);
    const currentPalettes = lp.bonsLivraison.reduce((s, b) => s + Number(b.nombrePalettes), 0);

    if (!force) {
      if (currentTonnage + Number(bl.tonnageTotal) > Number(truck!.capaciteTonnage)) {
        throw new BadRequestException(`CAPACITY_TONNAGE:Dépassement capacité tonnage (${truck!.capaciteTonnage}T max)`);
      }
      if (bl.nombrePalettes > 0 && currentPalettes + bl.nombrePalettes > truck!.capacitePalettes) {
        throw new BadRequestException(`CAPACITY_PALETTES:Dépassement capacité palettes (${truck!.capacitePalettes} max)`);
      }
    }

    // Prochain ordre de chargement (max existant + 1)
    const maxOrdre = lp.bonsLivraison.reduce(
      (max, b) => Math.max(max, (b as any).ordreChargement ?? 0), 0,
    );
    const nextOrdre = maxOrdre + 1;

    // Mise à jour directe via UPDATE SQL —évite les conflits TypeORM avec eager relations
    await this.blRepo.query(
      `UPDATE bons_livraison SET statut = $1, "loadingPlanId" = $2, "ordreChargement" = $3 WHERE id = $4`,
      [BlStatus.LOADED, planId, nextOrdre, blId],
    );

    const newTonnage = currentTonnage + Number(bl.tonnageTotal);
    const newPalettes = currentPalettes + (bl.nombrePalettes ?? 0);

    await this.repo.update(planId, {
      tonnageCharge: newTonnage,
      palettesChargees: newPalettes,
    });

    return this.findOne(planId);
  }

  async removeBl(planId: string, blId: string) {
    // Auto-invalidate if plan was validated
    const lpCheck = await this.repo.findOne({ where: { id: planId }, select: ['id', 'isValidated'] });
    if (lpCheck?.isValidated) {
      await this.repo.update(planId, { isValidated: false });
      await this.repo.query(`UPDATE loading_plans SET "validatedById" = NULL WHERE id = $1`, [planId]);
    }

    // Remettre le BL en VALIDATED, effacer FK et ordre
    await this.blRepo.query(
      `UPDATE bons_livraison SET statut = $1, "loadingPlanId" = NULL, "ordreChargement" = NULL WHERE id = $2`,
      [BlStatus.VALIDATED, blId],
    );

    // Reséquencer les BLs restants (1, 2, 3…)
    const remaining: { id: string }[] = await this.blRepo.query(
      `SELECT id FROM bons_livraison WHERE "loadingPlanId" = $1 ORDER BY "ordreChargement" ASC NULLS LAST`,
      [planId],
    );
    if (remaining.length > 0) {
      await Promise.all(
        remaining.map((bl, index) =>
          this.blRepo.query(
            `UPDATE bons_livraison SET "ordreChargement" = $1 WHERE id = $2`,
            [index + 1, bl.id],
          ),
        ),
      );
    }

    const lp = await this.findOne(planId);
    const newTonnage = lp.bonsLivraison.reduce((s, b) => s + Number(b.tonnageTotal), 0);
    const newPalettes = lp.bonsLivraison.reduce((s, b) => s + (b.nombrePalettes ?? 0), 0);

    await this.repo.update(planId, {
      tonnageCharge: newTonnage,
      palettesChargees: newPalettes,
    });
  }

  async validate(planId: string, userId: string, signature?: string) {
    const update: any = { isValidated: true, validatedBy: { id: userId } };
    if (signature) update.signature = signature;
    await this.repo.update(planId, update);
    return this.findOne(planId);
  }

  async validateAll(companyId: string, date: string, userId: string, signature?: string) {
    const plans = await this.findAll(companyId, date);
    const toValidate = plans.filter((p) => !p.isValidated && p.bonsLivraison?.length > 0);
    const update: any = { isValidated: true, validatedBy: { id: userId } as any };
    if (signature) update.signature = signature;
    await Promise.all(toValidate.map((p) => this.repo.update(p.id, update)));
    return { validated: toValidate.length };
  }

  async remove(id: string) {
    const lp = await this.findOne(id);
    for (const bl of lp.bonsLivraison) {
      await this.blRepo.query(
        `UPDATE bons_livraison SET "loadingPlanId" = NULL, statut = $1 WHERE id = $2`,
        [BlStatus.VALIDATED, bl.id],
      );
    }
    return this.repo.delete(id);
  }

  async setArrivalTime(planId: string, heureArrivee: string) {
    await this.repo.update(planId, { heureArrivee });
    return this.findOne(planId);
  }

  async loadingAction(planId: string, action: 'START' | 'PAUSE' | 'DONE') {
    const plan = await this.repo.findOne({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan introuvable');
    const now = new Date();
    const update: Partial<LoadingPlan> = {};

    if (action === 'START') {
      update.loadingStatus = 'IN_PROGRESS';
      update.loadingStartedAt = now;
    } else if (action === 'PAUSE') {
      const elapsed = plan.loadingStartedAt
        ? Math.floor((now.getTime() - new Date(plan.loadingStartedAt).getTime()) / 1000)
        : 0;
      update.loadingStatus = 'PAUSED';
      update.loadingElapsedSeconds = (plan.loadingElapsedSeconds || 0) + elapsed;
      update.loadingStartedAt = null as any;
    } else if (action === 'DONE') {
      const elapsed = plan.loadingStartedAt && plan.loadingStatus === 'IN_PROGRESS'
        ? Math.floor((now.getTime() - new Date(plan.loadingStartedAt).getTime()) / 1000)
        : 0;
      update.loadingStatus = 'DONE';
      update.loadingElapsedSeconds = (plan.loadingElapsedSeconds || 0) + elapsed;
      update.loadingStartedAt = null as any;
      update.entryStatus = 'EXITED';
    }
    await this.repo.update(planId, update);
    return this.findOne(planId);
  }

  async entryAction(planId: string, action: 'CALL' | 'ENTER' | 'EXIT' | 'UNENTER', quai?: string) {
    const lp = await this.findOne(planId);
    if (!lp) throw new NotFoundException('Plan introuvable');

    if (action === 'UNENTER') {
      if (lp.loadingStatus !== 'WAITING') {
        throw new BadRequestException('Impossible de retirer un camion déjà en cours de chargement');
      }
      await this.repo.update(planId, { entryStatus: 'CALLED', quai: null, enteredAt: null } as any);
      return this.findOne(planId);
    }

    const map: Record<string, string> = { CALL: 'CALLED', ENTER: 'ENTERED', EXIT: 'EXITED' };
    const update: any = { entryStatus: map[action] };

    if (action === 'CALL') update.calledAt = new Date();
    if (action === 'ENTER') update.enteredAt = new Date();

    if (action === 'ENTER') {
      const targetQuai = quai || lp.quai;
      if (targetQuai) {
        update.quai = targetQuai;
      }
    }

    if (action === 'CALL') {
      if (quai) update.quai = quai;

      // Calculer la séquence de stations filière selon l'ordreChargement des BLs
      const bls = (lp.bonsLivraison || [])
        .filter((bl: any) => bl.ordreChargement != null)
        .sort((a: any, b: any) => a.ordreChargement - b.ordreChargement);

      const stations: string[] = [];
      for (const bl of bls) {
        const code = (bl as any).filiere?.code;
        if (code && !stations.includes(code)) stations.push(code);
      }

      if (stations.length > 0) {
        update.stationsSequence = stations;
        update.currentStation   = stations[0];
        update.currentStationIdx = 0;
      }
    }

    await this.repo.update(planId, update);
    return this.findOne(planId);
  }

  async nextStation(planId: string) {
    const plan = await this.findOne(planId);
    if (!plan) throw new NotFoundException('Plan introuvable');

    const seq     = (plan as any).stationsSequence as string[] || [];
    const curIdx  = (plan as any).currentStationIdx as number || 0;
    const nextIdx = curIdx + 1;

    // Accumuler le temps de la station courante
    const sessionElapsed = plan.loadingStartedAt && plan.loadingStatus === 'IN_PROGRESS'
      ? Math.floor((Date.now() - new Date(plan.loadingStartedAt).getTime()) / 1000)
      : 0;
    const totalElapsed = (plan.loadingElapsedSeconds || 0) + sessionElapsed;

    if (nextIdx >= seq.length) {
      // Dernière station : camion terminé, attente sortie sécurité
      await this.repo.update(planId, {
        loadingStatus:         'DONE',
        entryStatus:           'EXITED',
        loadingElapsedSeconds: totalElapsed,
        loadingStartedAt:      null as any,
        currentStation:        null as any,
        currentStationIdx:     nextIdx,
      } as any);
    } else {
      // Station suivante : reset du timer, nouveau currentStation
      await this.repo.update(planId, {
        loadingStatus:         'WAITING',
        loadingElapsedSeconds: totalElapsed,
        loadingStartedAt:      null as any,
        currentStationIdx:     nextIdx,
        currentStation:        seq[nextIdx],
      } as any);
    }
    return this.findOne(planId);
  }

  async getQuaisLibres(companyId: string, date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Fetch all quais for this company with société/filière relations
    const quais = await this.quaiRepo.find({
      where: { company: { id: companyId }, isActive: true },
      relations: ['societeExpeditrice', 'filiere'],
      order: { societeExpeditrice: { nom: 'ASC' }, filiere: { nom: 'ASC' }, nom: 'ASC' },
    });

    // Fetch currently occupied quais (CALLED or ENTERED)
    const activePlans = await this.repo.createQueryBuilder('lp')
      .leftJoin('lp.truck', 'truck')
      .leftJoin('truck.deliveryCompany', 'dc')
      .leftJoin('dc.company', 'company')
      .where('company.id = CAST(:companyId AS uuid)', { companyId })
      .andWhere('lp.dateLivraison = :date', { date: targetDate })
      .andWhere("lp.entryStatus IN ('CALLED', 'ENTERED')")
      .andWhere('lp.quai IS NOT NULL')
      .select(['lp.id', 'lp.quai', 'lp.entryStatus'])
      .addSelect('truck.matricule')
      .getRawMany();

    const occupied: Record<string, { entryStatus: string; matricule: string }> = {};
    for (const row of activePlans) {
      if (row.lp_quai) {
        occupied[row.lp_quai] = { entryStatus: row.lp_entryStatus, matricule: row.truck_matricule };
      }
    }

    const toQuaiStatus = (q: Quai) => {
      const info = occupied[q.nom];
      return { id: q.id, nom: q.nom, occupe: !!info, entryStatus: info?.entryStatus ?? null, matricule: info?.matricule ?? null };
    };

    // Separate dedicated quais (linked to société) from generic ones
    const dedicatedQuais = quais.filter((q) => q.societeExpeditrice != null);
    const generiques = quais.filter((q) => q.societeExpeditrice == null).map(toQuaiStatus);

    // Group dedicated quais by société → filière
    const societeMap = new Map<string, any>();
    for (const q of dedicatedQuais) {
      const soc = q.societeExpeditrice!;
      if (!societeMap.has(soc.id)) {
        societeMap.set(soc.id, { id: soc.id, nom: soc.nom, couleur: soc.couleur, filieres: new Map() });
      }
      const socEntry = societeMap.get(soc.id);
      const filiereKey = q.filiere?.id ?? '__none__';
      if (!socEntry.filieres.has(filiereKey)) {
        socEntry.filieres.set(filiereKey, {
          id: q.filiere?.id ?? null,
          nom: q.filiere?.nom ?? null,
          code: q.filiere?.code ?? null,
          quais: [],
        });
      }
      socEntry.filieres.get(filiereKey).quais.push(toQuaiStatus(q));
    }

    const societes = Array.from(societeMap.values()).map((s) => ({
      ...s,
      filieres: Array.from(s.filieres.values()),
    }));

    return { societes, generiques };
  }

  async reorderBls(planId: string, blIds: string[]) {
    await Promise.all(
      blIds.map((blId, index) =>
        this.blRepo.update(blId, { ordreChargement: index + 1 }),
      ),
    );
    return this.findOne(planId);
  }

  getDayReport(companyId: string, date: string) {
    const qb = this.repo.createQueryBuilder('lp')
      .leftJoinAndSelect('lp.truck', 'truck')
      .leftJoinAndSelect('truck.deliveryCompany', 'dc')
      .leftJoinAndSelect('dc.company', 'company')
      .leftJoinAndSelect('lp.bonsLivraison', 'bl')
      .leftJoinAndSelect('bl.societeExpeditrice', 'soc')
      .leftJoinAndSelect('bl.filiere', 'filiere')
      .where('company.id = CAST(:companyId AS uuid)', { companyId })
      .andWhere('lp.isValidated = true')
      .andWhere("lp.entryStatus != 'IDLE'")
      .andWhere('lp.dateLivraison = :date', { date });
    return qb.orderBy('lp.heureArrivee', 'ASC', 'NULLS LAST').getMany();
  }

  getSecurityPlans(companyId: string, date?: string) {
    const qb = this.repo.createQueryBuilder('lp')
      .leftJoinAndSelect('lp.truck', 'truck')
      .leftJoinAndSelect('truck.deliveryCompany', 'dc')
      .leftJoinAndSelect('dc.company', 'company')
      .leftJoinAndSelect('lp.bonsLivraison', 'bl')
      .leftJoinAndSelect('bl.societeExpeditrice', 'soc')
      .where('company.id = CAST(:companyId AS uuid)', { companyId })
      .andWhere('lp.isValidated = true')
      .andWhere("lp.entryStatus != 'IDLE'");
    const targetDate = date || new Date().toISOString().split('T')[0];
    qb.andWhere('lp.dateLivraison = :date', { date: targetDate });
    return qb
      .orderBy('lp.heureArrivee', 'ASC', 'NULLS LAST')
      .addOrderBy('lp.createdAt', 'ASC')
      .getMany();
  }

  getMagasinPlans(companyId: string, date?: string) {
    const qb = this.repo.createQueryBuilder('lp')
      .leftJoinAndSelect('lp.truck', 'truck')
      .leftJoinAndSelect('truck.deliveryCompany', 'dc')
      .leftJoinAndSelect('dc.company', 'company')
      .leftJoinAndSelect('lp.bonsLivraison', 'bl')
      .leftJoinAndSelect('bl.societeExpeditrice', 'soc')
      .leftJoinAndSelect('bl.filiere', 'filiere')
      .leftJoinAndSelect('lp.validatedBy', 'user')
      .where('company.id = CAST(:companyId AS uuid)', { companyId })
      .andWhere('lp.isValidated = true');
    if (date) qb.andWhere('lp.dateLivraison = :date', { date });
    return qb
      .orderBy('lp.heureArrivee', 'ASC', 'NULLS LAST')
      .addOrderBy('lp.createdAt', 'ASC')
      .getMany();
  }
}
