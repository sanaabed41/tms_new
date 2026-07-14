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
const quai_entity_1 = require("../quais/quai.entity");
const user_entity_1 = require("../users/user.entity");
const bl_status_enum_1 = require("../common/enums/bl-status.enum");
const role_enum_1 = require("../common/enums/role.enum");
const mail_service_1 = require("../mail/mail.service");
let LoadingPlansService = class LoadingPlansService {
    repo;
    blRepo;
    truckRepo;
    quaiRepo;
    userRepo;
    mailService;
    constructor(repo, blRepo, truckRepo, quaiRepo, userRepo, mailService) {
        this.repo = repo;
        this.blRepo = blRepo;
        this.truckRepo = truckRepo;
        this.quaiRepo = quaiRepo;
        this.userRepo = userRepo;
        this.mailService = mailService;
    }
    baseQuery(companyId) {
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
            .where('(CAST(lp."logistiqueCompanyId" AS text) = :companyId OR company.id = CAST(:companyId AS uuid))', { companyId });
    }
    async sendReport(companyId, date, companyNom) {
        const plans = await this.findAll(companyId, date);
        const transportAdmins = await this.userRepo.find({
            where: { company: { id: companyId }, role: role_enum_1.Role.TRANSPORT_ADMIN, isActive: true },
            relations: ['company'],
        });
        if (transportAdmins.length === 0) {
            return { sent: 0, message: 'Aucun administrateur transport actif trouvé.' };
        }
        const results = await Promise.all(transportAdmins.map((u) => this.mailService.sendDailyReport(u.email, date, companyNom, plans)));
        return { sent: transportAdmins.length, emails: transportAdmins.map((u) => u.email), results };
    }
    findAll(companyId, date) {
        const qb = this.baseQuery(companyId);
        if (date)
            qb.andWhere('lp.dateLivraison = :date', { date });
        return qb
            .orderBy('lp.createdAt', 'DESC')
            .addOrderBy('bl.ordreChargement', 'ASC', 'NULLS LAST')
            .getMany();
    }
    findHistory(companyId, dateFrom, dateTo) {
        const qb = this.baseQuery(companyId);
        if (dateFrom)
            qb.andWhere('lp.dateLivraison >= :dateFrom', { dateFrom });
        if (dateTo)
            qb.andWhere('lp.dateLivraison <= :dateTo', { dateTo });
        return qb
            .orderBy('lp.dateLivraison', 'DESC')
            .addOrderBy('bl.ordreChargement', 'ASC', 'NULLS LAST')
            .getMany();
    }
    async findOne(id) {
        const lp = await this.repo.findOne({
            where: { id },
            relations: ['truck', 'truck.deliveryCompany', 'bonsLivraison', 'bonsLivraison.societeExpeditrice', 'bonsLivraison.filiere', 'bonsLivraison.blArticles', 'bonsLivraison.blArticles.article', 'validatedBy'],
        });
        if (!lp)
            throw new common_1.NotFoundException('Loading plan not found');
        lp.bonsLivraison?.sort((a, b) => (a.ordreChargement ?? 0) - (b.ordreChargement ?? 0));
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
            logistiqueCompanyId: dto.logistiqueCompanyId ?? null,
        });
        const saved = await this.repo.save(lp);
        return this.findOne(saved.id);
    }
    async assignBl(planId, blId, _userId, force = false) {
        const lp = await this.findOne(planId);
        const bl = await this.blRepo.findOne({ where: { id: blId }, relations: ['societeExpeditrice'] });
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
        const maxOrdre = lp.bonsLivraison.reduce((max, b) => Math.max(max, b.ordreChargement ?? 0), 0);
        const nextOrdre = maxOrdre + 1;
        await this.blRepo.query(`UPDATE bons_livraison SET statut = $1, "loadingPlanId" = $2, "ordreChargement" = $3 WHERE id = $4`, [bl_status_enum_1.BlStatus.LOADED, planId, nextOrdre, blId]);
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
        await this.blRepo.query(`UPDATE bons_livraison SET statut = $1, "loadingPlanId" = NULL, "ordreChargement" = NULL WHERE id = $2`, [bl_status_enum_1.BlStatus.VALIDATED, blId]);
        const remaining = await this.blRepo.query(`SELECT id FROM bons_livraison WHERE "loadingPlanId" = $1 ORDER BY "ordreChargement" ASC NULLS LAST`, [planId]);
        if (remaining.length > 0) {
            await Promise.all(remaining.map((bl, index) => this.blRepo.query(`UPDATE bons_livraison SET "ordreChargement" = $1 WHERE id = $2`, [index + 1, bl.id])));
        }
        const lp = await this.findOne(planId);
        const newTonnage = lp.bonsLivraison.reduce((s, b) => s + Number(b.tonnageTotal), 0);
        const newPalettes = lp.bonsLivraison.reduce((s, b) => s + (b.nombrePalettes ?? 0), 0);
        await this.repo.update(planId, {
            tonnageCharge: newTonnage,
            palettesChargees: newPalettes,
        });
    }
    async validate(planId, userId, signature) {
        const update = { isValidated: true, validatedBy: { id: userId } };
        if (signature)
            update.signature = signature;
        await this.repo.update(planId, update);
        return this.findOne(planId);
    }
    async validateAll(companyId, date, userId, signature) {
        const plans = await this.findAll(companyId, date);
        const toValidate = plans.filter((p) => !p.isValidated && p.bonsLivraison?.length > 0);
        const update = { isValidated: true, validatedBy: { id: userId } };
        if (signature)
            update.signature = signature;
        await Promise.all(toValidate.map((p) => this.repo.update(p.id, update)));
        return { validated: toValidate.length };
    }
    async remove(id) {
        const lp = await this.findOne(id);
        for (const bl of lp.bonsLivraison) {
            await this.blRepo.query(`UPDATE bons_livraison SET "loadingPlanId" = NULL, statut = $1 WHERE id = $2`, [bl_status_enum_1.BlStatus.VALIDATED, bl.id]);
        }
        return this.repo.delete(id);
    }
    async setArrivalTime(planId, heureArrivee) {
        await this.repo.update(planId, { heureArrivee });
        return this.findOne(planId);
    }
    async loadingAction(planId, action) {
        const plan = await this.repo.findOne({ where: { id: planId } });
        if (!plan)
            throw new common_1.NotFoundException('Plan introuvable');
        const now = new Date();
        const update = {};
        if (action === 'START') {
            update.loadingStatus = 'IN_PROGRESS';
            update.loadingStartedAt = now;
        }
        else if (action === 'PAUSE') {
            const elapsed = plan.loadingStartedAt
                ? Math.floor((now.getTime() - new Date(plan.loadingStartedAt).getTime()) / 1000)
                : 0;
            update.loadingStatus = 'PAUSED';
            update.loadingElapsedSeconds = (plan.loadingElapsedSeconds || 0) + elapsed;
            update.loadingStartedAt = null;
        }
        else if (action === 'DONE') {
            const elapsed = plan.loadingStartedAt && plan.loadingStatus === 'IN_PROGRESS'
                ? Math.floor((now.getTime() - new Date(plan.loadingStartedAt).getTime()) / 1000)
                : 0;
            update.loadingStatus = 'DONE';
            update.loadingElapsedSeconds = (plan.loadingElapsedSeconds || 0) + elapsed;
            update.loadingStartedAt = null;
            update.entryStatus = 'EXITED';
        }
        await this.repo.update(planId, update);
        return this.findOne(planId);
    }
    async entryAction(planId, action, quai) {
        const lp = await this.findOne(planId);
        if (!lp)
            throw new common_1.NotFoundException('Plan introuvable');
        if (action === 'UNENTER') {
            if (lp.loadingStatus !== 'WAITING') {
                throw new common_1.BadRequestException('Impossible de retirer un camion déjà en cours de chargement');
            }
            await this.repo.update(planId, { entryStatus: 'CALLED', quai: null, enteredAt: null });
            return this.findOne(planId);
        }
        const map = { CALL: 'CALLED', ENTER: 'ENTERED', EXIT: 'EXITED' };
        const update = { entryStatus: map[action] };
        if (action === 'CALL')
            update.calledAt = new Date();
        if (action === 'ENTER')
            update.enteredAt = new Date();
        if (action === 'ENTER') {
            const targetQuai = quai || lp.quai;
            if (targetQuai) {
                update.quai = targetQuai;
            }
        }
        if (action === 'CALL') {
            if (quai)
                update.quai = quai;
            const bls = (lp.bonsLivraison || [])
                .filter((bl) => bl.ordreChargement != null)
                .sort((a, b) => a.ordreChargement - b.ordreChargement);
            const stations = [];
            for (const bl of bls) {
                const code = bl.filiere?.code;
                if (code && !stations.includes(code))
                    stations.push(code);
            }
            if (stations.length > 0) {
                update.stationsSequence = stations;
                update.currentStation = stations[0];
                update.currentStationIdx = 0;
            }
        }
        await this.repo.update(planId, update);
        return this.findOne(planId);
    }
    async nextStation(planId) {
        const plan = await this.findOne(planId);
        if (!plan)
            throw new common_1.NotFoundException('Plan introuvable');
        const seq = plan.stationsSequence || [];
        const curIdx = plan.currentStationIdx || 0;
        const nextIdx = curIdx + 1;
        const sessionElapsed = plan.loadingStartedAt && plan.loadingStatus === 'IN_PROGRESS'
            ? Math.floor((Date.now() - new Date(plan.loadingStartedAt).getTime()) / 1000)
            : 0;
        const totalElapsed = (plan.loadingElapsedSeconds || 0) + sessionElapsed;
        if (nextIdx >= seq.length) {
            await this.repo.update(planId, {
                loadingStatus: 'DONE',
                entryStatus: 'EXITED',
                loadingElapsedSeconds: totalElapsed,
                loadingStartedAt: null,
                currentStation: null,
                currentStationIdx: nextIdx,
            });
        }
        else {
            await this.repo.update(planId, {
                loadingStatus: 'WAITING',
                loadingElapsedSeconds: totalElapsed,
                loadingStartedAt: null,
                currentStationIdx: nextIdx,
                currentStation: seq[nextIdx],
            });
        }
        return this.findOne(planId);
    }
    async getQuaisLibres(companyId, date) {
        const targetDate = date || new Date().toISOString().split('T')[0];
        const quais = await this.quaiRepo.find({
            where: { company: { id: companyId }, isActive: true },
            relations: ['societeExpeditrice', 'filiere'],
            order: { societeExpeditrice: { nom: 'ASC' }, filiere: { nom: 'ASC' }, nom: 'ASC' },
        });
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
        const occupied = {};
        for (const row of activePlans) {
            if (row.lp_quai) {
                occupied[row.lp_quai] = { entryStatus: row.lp_entryStatus, matricule: row.truck_matricule };
            }
        }
        const toQuaiStatus = (q) => {
            const info = occupied[q.nom];
            return { id: q.id, nom: q.nom, occupe: !!info, entryStatus: info?.entryStatus ?? null, matricule: info?.matricule ?? null };
        };
        const dedicatedQuais = quais.filter((q) => q.societeExpeditrice != null);
        const generiques = quais.filter((q) => q.societeExpeditrice == null).map(toQuaiStatus);
        const societeMap = new Map();
        for (const q of dedicatedQuais) {
            const soc = q.societeExpeditrice;
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
    async reorderBls(planId, blIds) {
        await Promise.all(blIds.map((blId, index) => this.blRepo.update(blId, { ordreChargement: index + 1 })));
        return this.findOne(planId);
    }
    getDayReport(companyId, date) {
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
    getSecurityPlans(companyId, date) {
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
    getMagasinPlans(companyId, date) {
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
        if (date)
            qb.andWhere('lp.dateLivraison = :date', { date });
        return qb
            .orderBy('lp.heureArrivee', 'ASC', 'NULLS LAST')
            .addOrderBy('lp.createdAt', 'ASC')
            .getMany();
    }
};
exports.LoadingPlansService = LoadingPlansService;
exports.LoadingPlansService = LoadingPlansService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(loading_plan_entity_1.LoadingPlan)),
    __param(1, (0, typeorm_1.InjectRepository)(bon_livraison_entity_1.BonLivraison)),
    __param(2, (0, typeorm_1.InjectRepository)(truck_entity_1.Truck)),
    __param(3, (0, typeorm_1.InjectRepository)(quai_entity_1.Quai)),
    __param(4, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        mail_service_1.MailService])
], LoadingPlansService);
//# sourceMappingURL=loading-plans.service.js.map