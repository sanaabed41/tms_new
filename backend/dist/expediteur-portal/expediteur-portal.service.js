"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpediteursPortalService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcryptjs"));
const crypto = __importStar(require("crypto"));
const config_1 = require("@nestjs/config");
const societe_expeditrice_entity_1 = require("../expediteurs/societe-expeditrice.entity");
const filiere_entity_1 = require("../expediteurs/filiere.entity");
const bon_livraison_entity_1 = require("../bons-livraison/bon-livraison.entity");
const loading_plan_entity_1 = require("../loading-plans/loading-plan.entity");
const user_entity_1 = require("../users/user.entity");
const quai_entity_1 = require("../quais/quai.entity");
const company_entity_1 = require("../companies/company.entity");
const invitation_entity_1 = require("../invitations/invitation.entity");
const role_enum_1 = require("../common/enums/role.enum");
const company_type_enum_1 = require("../common/enums/company-type.enum");
const mail_service_1 = require("../mail/mail.service");
let ExpediteursPortalService = class ExpediteursPortalService {
    societeRepo;
    filiereRepo;
    blRepo;
    loadingPlanRepo;
    userRepo;
    quaiRepo;
    companyRepo;
    invitationRepo;
    mailService;
    config;
    constructor(societeRepo, filiereRepo, blRepo, loadingPlanRepo, userRepo, quaiRepo, companyRepo, invitationRepo, mailService, config) {
        this.societeRepo = societeRepo;
        this.filiereRepo = filiereRepo;
        this.blRepo = blRepo;
        this.loadingPlanRepo = loadingPlanRepo;
        this.userRepo = userRepo;
        this.quaiRepo = quaiRepo;
        this.companyRepo = companyRepo;
        this.invitationRepo = invitationRepo;
        this.mailService = mailService;
        this.config = config;
    }
    async getFiliereIds(userId) {
        const rows = await this.userRepo.manager.query(`SELECT "filieresId" FROM user_filieres WHERE "usersId" = $1`, [userId]);
        return rows.map((r) => r.filieresId);
    }
    async getMySociete(expediteurCompanyId) {
        let societe = await this.societeRepo.findOne({
            where: { expediteurCompany: { id: expediteurCompanyId } },
            relations: ['filieres', 'company'],
        });
        if (!societe) {
            societe = await this.societeRepo
                .createQueryBuilder('se')
                .leftJoinAndSelect('se.filieres', 'f')
                .leftJoinAndSelect('se.company', 'logi')
                .innerJoin('companies', 'exp', 'exp."logistiqueCompanyId" = logi.id AND exp.id = :expId', { expId: expediteurCompanyId })
                .getOne();
            if (societe) {
                await this.societeRepo.update(societe.id, {
                    expediteurCompany: { id: expediteurCompanyId },
                });
            }
        }
        if (!societe)
            throw new common_1.NotFoundException('Aucune société expéditrice liée à ce compte');
        return societe;
    }
    async getMyBls(expediteurCompanyId, date, filiereIds) {
        const societe = await this.getMySociete(expediteurCompanyId);
        const qb = this.blRepo.createQueryBuilder('bl')
            .leftJoinAndSelect('bl.filiere', 'filiere')
            .leftJoinAndSelect('bl.loadingPlan', 'lp')
            .leftJoinAndSelect('lp.truck', 'truck')
            .where('bl.societeExpeditriceId = :sid', { sid: societe.id })
            .orderBy('bl.datelivraison', 'DESC')
            .addOrderBy('bl.ordreChargement', 'ASC', 'NULLS LAST');
        if (date)
            qb.andWhere('bl.datelivraison = :date', { date });
        if (filiereIds?.length)
            qb.andWhere('filiere.id IN (:...filiereIds)', { filiereIds });
        return qb.getMany();
    }
    async getMyBlsForFiliere(_expediteurCompanyId, callerUserId, date) {
        const filiereIds = await this.getFiliereIds(callerUserId);
        if (!filiereIds.length)
            return [];
        const qb = this.blRepo.createQueryBuilder('bl')
            .leftJoinAndSelect('bl.filiere', 'filiere')
            .leftJoinAndSelect('bl.loadingPlan', 'lp')
            .leftJoinAndSelect('lp.truck', 'truck')
            .where('bl.filiereId IN (:...filiereIds)', { filiereIds })
            .orderBy('bl.datelivraison', 'DESC')
            .addOrderBy('bl.ordreChargement', 'ASC', 'NULLS LAST');
        if (date)
            qb.andWhere('bl.datelivraison = :date', { date });
        return qb.getMany();
    }
    getMyUsers(expediteurCompanyId) {
        return this.userRepo.find({
            where: { company: { id: expediteurCompanyId }, role: role_enum_1.Role.FILIERE_ADMIN },
            relations: ['filieres'],
            order: { nom: 'ASC' },
        });
    }
    async getMyUsersForFiliere(expediteurCompanyId, callerUserId) {
        const filiereIds = await this.getFiliereIds(callerUserId);
        if (!filiereIds.length)
            return [];
        return this.userRepo
            .createQueryBuilder('u')
            .leftJoinAndSelect('u.filieres', 'f')
            .where('u.companyId = :cid', { cid: expediteurCompanyId })
            .andWhere('f.id IN (:...ids)', { ids: filiereIds })
            .andWhere('u.role IN (:...roles)', { roles: [role_enum_1.Role.MAGASINIER, role_enum_1.Role.SECURITE] })
            .orderBy('u.nom', 'ASC')
            .getMany();
    }
    async toggleUserActive(expediteurCompanyId, callerUserId, targetUserId, callerRole) {
        const target = await this.userRepo.findOne({
            where: { id: targetUserId, company: { id: expediteurCompanyId } },
            relations: ['filieres'],
        });
        if (!target)
            throw new common_1.NotFoundException('Utilisateur introuvable');
        if (callerRole !== role_enum_1.Role.EXPEDITEUR_ADMIN) {
            const caller = await this.userRepo.findOne({
                where: { id: callerUserId },
                relations: ['filieres'],
            });
            const callerFiliereIds = (caller?.filieres ?? []).map((f) => f.id);
            const targetFiliereIds = (target.filieres ?? []).map((f) => f.id);
            if (!callerFiliereIds.some((id) => targetFiliereIds.includes(id))) {
                throw new common_1.ForbiddenException('Accès interdit');
            }
        }
        await this.userRepo.update(targetUserId, { isActive: !target.isActive });
        return this.userRepo.findOne({ where: { id: targetUserId }, relations: ['filieres'] });
    }
    async deleteFiliereAdmin(expediteurCompanyId, targetUserId) {
        const target = await this.userRepo.findOne({
            where: { id: targetUserId, company: { id: expediteurCompanyId }, role: role_enum_1.Role.FILIERE_ADMIN },
        });
        if (!target)
            throw new common_1.NotFoundException('Admin filière introuvable');
        return this.userRepo.remove(target);
    }
    async deleteWorker(expediteurCompanyId, callerUserId, targetUserId, callerRole) {
        if (callerRole === role_enum_1.Role.EXPEDITEUR_ADMIN) {
            return this.deleteFiliereAdmin(expediteurCompanyId, targetUserId);
        }
        const target = await this.userRepo.findOne({
            where: { id: targetUserId, company: { id: expediteurCompanyId } },
            relations: ['filieres'],
        });
        if (!target)
            throw new common_1.NotFoundException('Utilisateur introuvable');
        if (target.role !== role_enum_1.Role.MAGASINIER && target.role !== role_enum_1.Role.SECURITE) {
            throw new common_1.ForbiddenException('Action non autorisée');
        }
        const caller = await this.userRepo.findOne({ where: { id: callerUserId }, relations: ['filieres'] });
        const callerFiliereIds = (caller?.filieres ?? []).map((f) => f.id);
        const targetFiliereIds = (target.filieres ?? []).map((f) => f.id);
        if (!callerFiliereIds.some((id) => targetFiliereIds.includes(id))) {
            throw new common_1.ForbiddenException('Accès interdit');
        }
        return this.userRepo.remove(target);
    }
    async getMyProfile(userId) {
        return this.userRepo.findOne({ where: { id: userId }, relations: ['filieres', 'company'] });
    }
    async updateMyProfile(userId, dto) {
        const updateData = {};
        if (dto.prenom !== undefined)
            updateData.prenom = dto.prenom;
        if (dto.nom !== undefined)
            updateData.nom = dto.nom;
        if (dto.newPassword) {
            updateData.password = await bcrypt.hash(dto.newPassword, 10);
        }
        if (Object.keys(updateData).length) {
            await this.userRepo.update(userId, updateData);
        }
        return this.userRepo.findOne({ where: { id: userId }, relations: ['filieres', 'company'] });
    }
    async getMyQuais(expediteurCompanyId) {
        const societe = await this.getMySociete(expediteurCompanyId);
        return this.quaiRepo.find({
            where: { societeExpeditrice: { id: societe.id } },
            relations: ['filiere'],
            order: { nom: 'ASC' },
        });
    }
    async getMyQuaisForFiliere(userId) {
        const filiereIds = await this.getFiliereIds(userId);
        if (!filiereIds.length)
            return [];
        return this.quaiRepo.find({
            where: { filiere: { id: (0, typeorm_2.In)(filiereIds) } },
            relations: ['filiere'],
            order: { nom: 'ASC' },
        });
    }
    async getDashboard(expediteurCompanyId) {
        const societe = await this.getMySociete(expediteurCompanyId);
        const today = new Date().toISOString().split('T')[0];
        const [totalBls, blsAujourdhui, users, quais] = await Promise.all([
            this.blRepo.count({ where: { societeExpeditrice: { id: societe.id } } }),
            this.blRepo.count({ where: { societeExpeditrice: { id: societe.id }, datelivraison: today } }),
            this.userRepo.count({ where: { company: { id: expediteurCompanyId } } }),
            this.quaiRepo.count({ where: { societeExpeditrice: { id: societe.id } } }),
        ]);
        return {
            societe: { id: societe.id, nom: societe.nom, couleur: societe.couleur, code: societe.code },
            filieres: societe.filieres.length,
            quais,
            users,
            totalBls,
            blsAujourdhui,
        };
    }
    async getMyValidatedPlans(expediteurCompanyId, date) {
        const societe = await this.getMySociete(expediteurCompanyId);
        const qb = this.loadingPlanRepo.createQueryBuilder('lp')
            .innerJoinAndSelect('lp.truck', 'truck')
            .leftJoinAndSelect('lp.bonsLivraison', 'bl')
            .leftJoinAndSelect('bl.filiere', 'filiere')
            .leftJoinAndSelect('bl.societeExpeditrice', 'se')
            .leftJoinAndSelect('lp.validatedBy', 'validatedBy')
            .where('lp.isValidated = true')
            .andWhere(`lp."dateLivraison" IN (
          SELECT DISTINCT lp2."dateLivraison"
          FROM loading_plans lp2
          INNER JOIN bons_livraison bl2 ON bl2."loadingPlanId" = lp2.id
          WHERE bl2."societeExpeditriceId" = :sid
            AND lp2."isValidated" = true
        )`)
            .setParameter('sid', societe.id)
            .orderBy('lp.dateLivraison', 'DESC')
            .addOrderBy('lp.reference', 'ASC');
        if (date)
            qb.andWhere('lp.dateLivraison = :date', { date });
        return qb.getMany();
    }
    async getValidatedPlansForFiliere(_expediteurCompanyId, callerUserId, date) {
        const filiereIds = await this.getFiliereIds(callerUserId);
        if (!filiereIds.length)
            return [];
        const qb = this.loadingPlanRepo.createQueryBuilder('lp')
            .innerJoinAndSelect('lp.truck', 'truck')
            .leftJoinAndSelect('lp.bonsLivraison', 'bl', 'bl."filiereId" IN (:...fliIds)')
            .leftJoinAndSelect('bl.filiere', 'filiere')
            .leftJoinAndSelect('bl.societeExpeditrice', 'se')
            .leftJoinAndSelect('lp.validatedBy', 'validatedBy')
            .where('lp.isValidated = true')
            .andWhere((qb2) => {
            const sub = qb2.subQuery()
                .select('1')
                .from('bons_livraison', 'bl2')
                .where('bl2."loadingPlanId" = lp.id')
                .andWhere('bl2."filiereId" IN (:...fliIds)')
                .getQuery();
            return `EXISTS (${sub})`;
        })
            .setParameter('fliIds', filiereIds)
            .orderBy('lp.dateLivraison', 'DESC')
            .addOrderBy('lp.reference', 'ASC');
        if (date)
            qb.andWhere('lp.dateLivraison = :date', { date });
        return qb.getMany();
    }
    async updateMySociete(expediteurCompanyId, dto) {
        const societe = await this.getMySociete(expediteurCompanyId);
        await this.societeRepo.update(societe.id, {
            nom: dto.nom,
            adresse: dto.adresse,
            telephone: dto.telephone,
            couleur: dto.couleur,
        });
        return this.getMySociete(expediteurCompanyId);
    }
    async createFiliere(expediteurCompanyId, dto) {
        const societe = await this.getMySociete(expediteurCompanyId);
        return this.filiereRepo.save(this.filiereRepo.create({ nom: dto.nom, code: dto.code, societeExpeditrice: { id: societe.id } }));
    }
    async updateFiliere(expediteurCompanyId, filiereId, dto) {
        const societe = await this.getMySociete(expediteurCompanyId);
        const filiere = await this.filiereRepo.findOne({
            where: { id: filiereId, societeExpeditrice: { id: societe.id } },
        });
        if (!filiere)
            throw new common_1.ForbiddenException('Filière introuvable ou accès refusé');
        if (dto.nom !== undefined)
            filiere.nom = dto.nom;
        if (dto.code !== undefined)
            filiere.code = dto.code;
        return this.filiereRepo.save(filiere);
    }
    async deleteFiliere(expediteurCompanyId, filiereId) {
        const societe = await this.getMySociete(expediteurCompanyId);
        const filiere = await this.filiereRepo.findOne({
            where: { id: filiereId, societeExpeditrice: { id: societe.id } },
        });
        if (!filiere)
            throw new common_1.ForbiddenException('Filière introuvable ou accès refusé');
        return this.filiereRepo.remove(filiere);
    }
    async createQuai(expediteurCompanyId, dto) {
        const societe = await this.getMySociete(expediteurCompanyId);
        return this.quaiRepo.save(this.quaiRepo.create({
            nom: dto.nom,
            isActive: true,
            societeExpeditrice: { id: societe.id },
            company: null,
            filiere: dto.filiereId ? { id: dto.filiereId } : null,
        }));
    }
    async updateQuai(expediteurCompanyId, quaiId, dto) {
        const societe = await this.getMySociete(expediteurCompanyId);
        const quai = await this.quaiRepo.findOne({
            where: { id: quaiId, societeExpeditrice: { id: societe.id } },
        });
        if (!quai)
            throw new common_1.ForbiddenException('Quai introuvable ou accès refusé');
        if (dto.nom !== undefined)
            quai.nom = dto.nom;
        if (dto.isActive !== undefined)
            quai.isActive = dto.isActive;
        if ('filiereId' in dto)
            quai.filiere = dto.filiereId ? { id: dto.filiereId } : null;
        return this.quaiRepo.save(quai);
    }
    async deleteQuai(expediteurCompanyId, quaiId) {
        const societe = await this.getMySociete(expediteurCompanyId);
        const quai = await this.quaiRepo.findOne({
            where: { id: quaiId, societeExpeditrice: { id: societe.id } },
        });
        if (!quai)
            throw new common_1.ForbiddenException('Quai introuvable ou accès refusé');
        return this.quaiRepo.remove(quai);
    }
    async createQuaiForFiliere(userId, dto) {
        const filiereIds = await this.getFiliereIds(userId);
        if (!filiereIds.length)
            throw new common_1.ForbiddenException('Aucune filière associée');
        const targetFiliereId = dto.filiereId ?? filiereIds[0];
        if (!filiereIds.includes(targetFiliereId))
            throw new common_1.ForbiddenException('Filière non autorisée');
        const filiere = await this.filiereRepo.findOne({
            where: { id: targetFiliereId },
            relations: ['societeExpeditrice'],
        });
        if (!filiere)
            throw new common_1.NotFoundException('Filière introuvable');
        return this.quaiRepo.save(this.quaiRepo.create({
            nom: dto.nom,
            isActive: true,
            societeExpeditrice: { id: filiere.societeExpeditrice.id },
            company: null,
            filiere: { id: targetFiliereId },
        }));
    }
    async updateQuaiForFiliere(userId, quaiId, dto) {
        const filiereIds = await this.getFiliereIds(userId);
        if (!filiereIds.length)
            throw new common_1.ForbiddenException('Aucune filière associée');
        const quai = await this.quaiRepo.findOne({
            where: { id: quaiId },
            relations: ['filiere'],
        });
        if (!quai)
            throw new common_1.NotFoundException('Quai introuvable');
        if (quai.filiere && !filiereIds.includes(quai.filiere.id))
            throw new common_1.ForbiddenException('Accès refusé à ce quai');
        if (dto.nom !== undefined)
            quai.nom = dto.nom;
        if (dto.isActive !== undefined)
            quai.isActive = dto.isActive;
        if ('filiereId' in dto) {
            if (dto.filiereId && !filiereIds.includes(dto.filiereId))
                throw new common_1.ForbiddenException('Filière non autorisée');
            quai.filiere = dto.filiereId ? { id: dto.filiereId } : null;
        }
        return this.quaiRepo.save(quai);
    }
    async deleteQuaiForFiliere(userId, quaiId) {
        const filiereIds = await this.getFiliereIds(userId);
        const quai = await this.quaiRepo.findOne({ where: { id: quaiId }, relations: ['filiere'] });
        if (!quai)
            throw new common_1.NotFoundException('Quai introuvable');
        if (quai.filiere && !filiereIds.includes(quai.filiere.id))
            throw new common_1.ForbiddenException('Accès refusé à ce quai');
        return this.quaiRepo.remove(quai);
    }
    async getMagasinierDashboard(expediteurCompanyId, userId) {
        const today = new Date().toISOString().split('T')[0];
        const plans = await this.getValidatedPlansForFiliere(expediteurCompanyId, userId, today);
        const allBls = plans.flatMap((p) => p.bonsLivraison ?? []);
        const totalBls = allBls.length;
        const tonnage = allBls.reduce((s, bl) => s + Number(bl.tonnageTotal ?? 0), 0);
        const statsMap = {};
        for (const bl of allBls) {
            const key = bl.filiere?.id ?? '__none__';
            if (!statsMap[key]) {
                statsMap[key] = {
                    nom: bl.filiere?.nom ?? '—',
                    code: bl.filiere?.code ?? '—',
                    count: 0,
                    tonnage: 0,
                };
            }
            statsMap[key].count++;
            statsMap[key].tonnage += Number(bl.tonnageTotal ?? 0);
        }
        return {
            trucks: plans.length,
            totalBls,
            tonnage,
            filiereStats: Object.values(statsMap),
        };
    }
    async getMyLogistique(expediteurCompanyId) {
        const expediteur = await this.companyRepo.findOne({
            where: { id: expediteurCompanyId },
            relations: ['logistiqueCompany'],
        });
        if (!expediteur)
            throw new common_1.NotFoundException('Société expéditrice introuvable');
        const logistique = expediteur.logistiqueCompany ?? null;
        if (!logistique)
            return { company: null, adminUser: null, pendingInvitation: false };
        const [adminUser, pendingInvitation] = await Promise.all([
            this.userRepo.findOne({
                where: { company: { id: logistique.id }, role: role_enum_1.Role.LOGISTIC_ADMIN },
            }),
            this.invitationRepo.findOne({
                where: { company: { id: logistique.id }, role: role_enum_1.Role.LOGISTIC_ADMIN, isUsed: false },
            }),
        ]);
        return {
            company: logistique,
            adminUser: adminUser ? {
                id: adminUser.id,
                prenom: adminUser.prenom,
                nom: adminUser.nom,
                email: adminUser.email,
                isActive: adminUser.isActive,
            } : null,
            pendingInvitation: !!pendingInvitation,
        };
    }
    async setupLogistique(expediteurCompanyId, dto) {
        const expediteur = await this.companyRepo.findOne({
            where: { id: expediteurCompanyId },
            relations: ['logistiqueCompany'],
        });
        if (!expediteur)
            throw new common_1.NotFoundException('Société expéditrice introuvable');
        if (expediteur.logistiqueCompany)
            throw new common_1.BadRequestException('Une société logistique est déjà liée à votre compte');
        const existingNom = await this.companyRepo.findOne({ where: { nom: dto.companyNom } });
        if (existingNom)
            throw new common_1.BadRequestException(`Une société avec le nom "${dto.companyNom}" existe déjà`);
        const existingUser = await this.userRepo.findOne({ where: { email: dto.adminEmail } });
        if (existingUser)
            throw new common_1.BadRequestException('Un compte existe déjà pour cet email');
        const logistique = await this.companyRepo.save(this.companyRepo.create({
            nom: dto.companyNom,
            adresse: dto.adresse,
            telephone: dto.telephone,
            type: company_type_enum_1.CompanyType.LOGISTIQUE,
            isActive: true,
        }));
        await this.companyRepo.update(expediteurCompanyId, {
            logistiqueCompany: { id: logistique.id },
        });
        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = await bcrypt.hash(rawToken, 8);
        const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
        await this.invitationRepo.save(this.invitationRepo.create({
            email: dto.adminEmail,
            role: role_enum_1.Role.LOGISTIC_ADMIN,
            token: hashedToken,
            expiresAt,
            company: { id: logistique.id },
        }));
        const frontUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
        const mailResult = await this.mailService.sendInvitation(dto.adminEmail, logistique.nom, role_enum_1.Role.LOGISTIC_ADMIN, rawToken, frontUrl);
        return { company: logistique, ...mailResult };
    }
    async resendLogistiqueInvitation(expediteurCompanyId) {
        const expediteur = await this.companyRepo.findOne({
            where: { id: expediteurCompanyId },
            relations: ['logistiqueCompany'],
        });
        if (!expediteur?.logistiqueCompany)
            throw new common_1.NotFoundException('Aucune société logistique liée');
        const invitation = await this.invitationRepo.findOne({
            where: {
                company: { id: expediteur.logistiqueCompany.id },
                role: role_enum_1.Role.LOGISTIC_ADMIN,
                isUsed: false,
            },
        });
        if (!invitation)
            throw new common_1.NotFoundException('Aucune invitation en attente');
        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = await bcrypt.hash(rawToken, 8);
        const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
        await this.invitationRepo.update(invitation.id, { token: hashedToken, expiresAt });
        const frontUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
        const mailResult = await this.mailService.sendInvitation(invitation.email, expediteur.logistiqueCompany.nom, role_enum_1.Role.LOGISTIC_ADMIN, rawToken, frontUrl);
        return mailResult;
    }
};
exports.ExpediteursPortalService = ExpediteursPortalService;
exports.ExpediteursPortalService = ExpediteursPortalService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(societe_expeditrice_entity_1.SocieteExpeditrice)),
    __param(1, (0, typeorm_1.InjectRepository)(filiere_entity_1.Filiere)),
    __param(2, (0, typeorm_1.InjectRepository)(bon_livraison_entity_1.BonLivraison)),
    __param(3, (0, typeorm_1.InjectRepository)(loading_plan_entity_1.LoadingPlan)),
    __param(4, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(5, (0, typeorm_1.InjectRepository)(quai_entity_1.Quai)),
    __param(6, (0, typeorm_1.InjectRepository)(company_entity_1.Company)),
    __param(7, (0, typeorm_1.InjectRepository)(invitation_entity_1.Invitation)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        mail_service_1.MailService,
        config_1.ConfigService])
], ExpediteursPortalService);
//# sourceMappingURL=expediteur-portal.service.js.map