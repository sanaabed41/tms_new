"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadingPlansService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const loading_plan_entity_1 = require("./loading-plan.entity");
const bon_livraison_entity_1 = require("../bons-livraison/bon-livraison.entity");
const truck_entity_1 = require("../trucks/truck.entity");
const bl_status_enum_1 = require("../common/enums/bl-status.enum");
let LoadingPlansService = class LoadingPlansService {
    repo;
    blRepo;
    truckRepo;
    constructor(repo, blRepo, truckRepo) {
        this.repo = repo;
        this.blRepo = blRepo;
        this.truckRepo = truckRepo;
    }
    findAll(companyId, date) {
        const qb = this.repo.createQueryBuilder('lp')
            .leftJoinAndSelect('lp.truck', 'truck')
            .leftJoinAndSelect('truck.deliveryCompany', 'dc')
            .leftJoinAndSelect('dc.company', 'company')
            .leftJoinAndSelect('lp.bonsLivraison', 'bl')
            .leftJoinAndSelect('bl.blArticles', 'bla')
            .leftJoinAndSelect('bla.article', 'article')
            .leftJoinAndSelect('lp.validatedBy', 'user')
            .where('company.id = :companyId', { companyId });
        if (date)
            qb.andWhere('lp.dateLivraison = :date', { date });
        return qb.orderBy('lp.createdAt', 'DESC').getMany();
    }
    async findOne(id) {
        const lp = await this.repo.findOne({
            where: { id },
            relations: ['truck', 'truck.deliveryCompany', 'bonsLivraison', 'bonsLivraison.blArticles', 'bonsLivraison.blArticles.article', 'validatedBy'],
        });
        if (!lp)
            throw new common_1.NotFoundException('Loading plan not found');
        return lp;
    }
    async create(dto) {
        const truck = await this.truckRepo.findOne({ where: { id: dto.truckId } });
        if (!truck)
            throw new common_1.NotFoundException('Truck not found');
        const reference = `PC-${Date.now()}`;
        const lp = this.repo.create({
            reference,
            dateLivraison: dto.dateLivraison,
            truck: { id: dto.truckId },
        });
        const saved = await this.repo.save(lp);
        return this.findOne(saved.id);
    }
    async assignBl(planId, blId, _userId, force = false) {
        const lp = await this.findOne(planId);
        const bl = await this.blRepo.findOne({ where: { id: blId } });
        if (!bl)
            throw new common_1.NotFoundException('BL not found');
        if (bl.statut !== bl_status_enum_1.BlStatus.VALIDATED)
            throw new common_1.BadRequestException('Only validated BL can be loaded');
        if (lp.isValidated) {
            await this.repo.update(planId, { isValidated: false });
            await this.repo.query(`UPDATE loading_plans SET "validatedById" = NULL WHERE id = $1`, [planId]);
        }
        const truck = await this.truckRepo.findOne({ where: { id: lp.truck.id } });
        const currentTonnage = lp.bonsLivraison.reduce((s, b) => s + Number(b.tonnageTotal), 0);
        const currentPalettes = lp.bonsLivraison.reduce((s, b) => s + Number(b.nombrePalettes), 0);
        if (!force) {
            if (currentTonnage + Number(bl.tonnageTotal) > Number(truck.capaciteTonnage)) {
                throw new common_1.BadRequestException(`CAPACITY_TONNAGE:Dépassement capacité tonnage (${truck.capaciteTonnage}T max)`);
            }
            if (bl.nombrePalettes > 0 && currentPalettes + bl.nombrePalettes > truck.capacitePalettes) {
                throw new common_1.BadRequestException(`CAPACITY_PALETTES:Dépassement capacité palettes (${truck.capacitePalettes} max)`);
            }
        }
        await this.blRepo
            .createQueryBuilder()
            .update(bon_livraison_entity_1.BonLivraison)
            .set({ statut: bl_status_enum_1.BlStatus.LOADED })
            .where('id = :id', { id: blId })
            .execute();
        await this.blRepo.query(`UPDATE bons_livraison SET "loadingPlanId" = $1 WHERE id = $2`, [planId, blId]);
        const newTonnage = currentTonnage + Number(bl.tonnageTotal);
        const newPalettes = currentPalettes + (bl.nombrePalettes ?? 0);
        await this.repo.update(planId, {
            tonnageCharge: newTonnage,
            palettesChargees: newPalettes,
        });
        return this.findOne(planId);
    }
    async removeBl(planId, blId) {
        const lpCheck = await this.repo.findOne({ where: { id: planId }, select: ['id', 'isValidated'] });
        if (lpCheck?.isValidated) {
            await this.repo.update(planId, { isValidated: false });
            await this.repo.query(`UPDATE loading_plans SET "validatedById" = NULL WHERE id = $1`, [planId]);
        }
        await this.blRepo
            .createQueryBuilder()
            .update(bon_livraison_entity_1.BonLivraison)
            .set({ statut: bl_status_enum_1.BlStatus.VALIDATED })
            .where('id = :id', { id: blId })
            .execute();
        await this.blRepo.query(`UPDATE bons_livraison SET "loadingPlanId" = NULL WHERE id = $1`, [blId]);
        const lp = await this.findOne(planId);
        const newTonnage = lp.bonsLivraison.reduce((s, b) => s + Number(b.tonnageTotal), 0);
        const newPalettes = lp.bonsLivraison.reduce((s, b) => s + (b.nombrePalettes ?? 0), 0);
        await this.repo.update(planId, {
            tonnageCharge: newTonnage,
            palettesChargees: newPalettes,
        });
    }
    async validate(planId, userId) {
        await this.repo.update(planId, {
            isValidated: true,
            validatedBy: { id: userId },
        });
        return this.findOne(planId);
    }
    async validateAll(companyId, date, userId) {
        const plans = await this.findAll(companyId, date);
        const toValidate = plans.filter((p) => !p.isValidated && p.bonsLivraison?.length > 0);
        await Promise.all(toValidate.map((p) => this.repo.update(p.id, { isValidated: true, validatedBy: { id: userId } })));
        return { validated: toValidate.length };
    }
    async remove(id) {
        const lp = await this.findOne(id);
        for (const bl of lp.bonsLivraison) {
            await this.blRepo.query(`UPDATE bons_livraison SET "loadingPlanId" = NULL, statut = $1 WHERE id = $2`, [bl_status_enum_1.BlStatus.VALIDATED, bl.id]);
        }
        return this.repo.delete(id);
    }
};
exports.LoadingPlansService = LoadingPlansService;
exports.LoadingPlansService = LoadingPlansService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(loading_plan_entity_1.LoadingPlan)),
    __param(1, (0, typeorm_1.InjectRepository)(bon_livraison_entity_1.BonLivraison)),
    __param(2, (0, typeorm_1.InjectRepository)(truck_entity_1.Truck)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], LoadingPlansService);
//# sourceMappingURL=loading-plans.service.js.map