import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoadingPlan } from './loading-plan.entity';
import { BonLivraison } from '../bons-livraison/bon-livraison.entity';
import { Truck } from '../trucks/truck.entity';
import { BlStatus } from '../common/enums/bl-status.enum';

@Injectable()
export class LoadingPlansService {
  constructor(
    @InjectRepository(LoadingPlan) private repo: Repository<LoadingPlan>,
    @InjectRepository(BonLivraison) private blRepo: Repository<BonLivraison>,
    @InjectRepository(Truck) private truckRepo: Repository<Truck>,
  ) {}

  findAll(companyId: string, date?: string) {
    const qb = this.repo.createQueryBuilder('lp')
      .leftJoinAndSelect('lp.truck', 'truck')
      .leftJoinAndSelect('truck.deliveryCompany', 'dc')
      .leftJoinAndSelect('dc.company', 'company')
      .leftJoinAndSelect('lp.bonsLivraison', 'bl')
      .leftJoinAndSelect('bl.blArticles', 'bla')
      .leftJoinAndSelect('bla.article', 'article')
      .leftJoinAndSelect('lp.validatedBy', 'user')
      .where('company.id = :companyId', { companyId });
    if (date) qb.andWhere('lp.dateLivraison = :date', { date });
    return qb.orderBy('lp.createdAt', 'DESC').getMany();
  }

  async findOne(id: string) {
    const lp = await this.repo.findOne({
      where: { id },
      relations: ['truck', 'truck.deliveryCompany', 'bonsLivraison', 'bonsLivraison.blArticles', 'bonsLivraison.blArticles.article', 'validatedBy'],
    });
    if (!lp) throw new NotFoundException('Loading plan not found');
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
    });
    const saved = await this.repo.save(lp);
    return this.findOne(saved.id);
  }

  async assignBl(planId: string, blId: string, _userId: string, force = false) {
    const lp = await this.findOne(planId);
    const bl = await this.blRepo.findOne({ where: { id: blId } });
    if (!bl) throw new NotFoundException('BL not found');
    if (bl.statut !== BlStatus.VALIDATED) throw new BadRequestException('Only validated BL can be loaded');

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

    // Mise à jour directe via UPDATE SQL — évite les conflits TypeORM avec eager relations
    await this.blRepo
      .createQueryBuilder()
      .update(BonLivraison)
      .set({ statut: BlStatus.LOADED })
      .where('id = :id', { id: blId })
      .execute();

    // Forcer la FK via query builder
    await this.blRepo.query(
      `UPDATE bons_livraison SET "loadingPlanId" = $1 WHERE id = $2`,
      [planId, blId],
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

    // Remettre le BL en VALIDATED et effacer la FK
    await this.blRepo
      .createQueryBuilder()
      .update(BonLivraison)
      .set({ statut: BlStatus.VALIDATED })
      .where('id = :id', { id: blId })
      .execute();

    await this.blRepo.query(
      `UPDATE bons_livraison SET "loadingPlanId" = NULL WHERE id = $1`,
      [blId],
    );

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
    // Libérer tous les BL du plan
    for (const bl of lp.bonsLivraison) {
      await this.blRepo.query(
        `UPDATE bons_livraison SET "loadingPlanId" = NULL, statut = $1 WHERE id = $2`,
        [BlStatus.VALIDATED, bl.id],
      );
    }
    return this.repo.delete(id);
  }
}
