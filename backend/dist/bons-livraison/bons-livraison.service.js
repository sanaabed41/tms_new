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
exports.BonsLivraisonService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bon_livraison_entity_1 = require("./bon-livraison.entity");
const bl_article_entity_1 = require("./bl-article.entity");
const bl_status_enum_1 = require("../common/enums/bl-status.enum");
let BonsLivraisonService = class BonsLivraisonService {
    repo;
    blArticleRepo;
    constructor(repo, blArticleRepo) {
        this.repo = repo;
        this.blArticleRepo = blArticleRepo;
    }
    findAll(companyId, statut) {
        const where = { company: { id: companyId } };
        if (statut)
            where.statut = statut;
        return this.repo.find({
            where,
            relations: ['blArticles', 'blArticles.article', 'loadingPlan', 'societeExpeditrice', 'filiere'],
            order: { createdAt: 'DESC' },
        });
    }
    findAvailable(companyId) {
        return this.repo.find({
            where: { company: { id: companyId }, statut: bl_status_enum_1.BlStatus.VALIDATED, loadingPlan: (0, typeorm_2.IsNull)() },
            relations: ['blArticles', 'blArticles.article', 'societeExpeditrice', 'filiere'],
        });
    }
    async findOne(id) {
        const bl = await this.repo.findOne({
            where: { id },
            relations: ['blArticles', 'blArticles.article', 'loadingPlan', 'company', 'societeExpeditrice', 'filiere'],
        });
        if (!bl)
            throw new common_1.NotFoundException('BL not found');
        return bl;
    }
    async create(dto, companyId) {
        const bl = this.repo.create({
            numeroBl: dto.numeroBl,
            clientNom: dto.clientNom,
            clientAdresse: dto.clientAdresse,
            origine: dto.origine,
            destination: dto.destination,
            typeChargement: dto.typeChargement,
            tonnageTotal: dto.tonnageTotal,
            nombrePalettes: dto.nombrePalettes ?? 0,
            datelivraison: dto.datelivraison,
            erpReference: dto.erpReference,
            notes: dto.notes,
            company: { id: companyId },
            ...(dto.societeExpediticeId ? { societeExpeditrice: { id: dto.societeExpediticeId } } : {}),
            ...(dto.filiereId ? { filiere: { id: dto.filiereId } } : {}),
        });
        const saved = await this.repo.save(bl);
        if (dto.articles?.length) {
            const blArticles = dto.articles.map((a) => this.blArticleRepo.create({
                bonLivraison: { id: saved.id },
                article: { id: a.articleId },
                quantite: a.quantite,
                poidsTotal: a.poidsTotal,
            }));
            await this.blArticleRepo.save(blArticles);
        }
        return this.findOne(saved.id);
    }
    async update(id, dto) {
        const bl = await this.findOne(id);
        if (bl.statut === bl_status_enum_1.BlStatus.LOADED && Object.keys(dto).some((k) => k !== 'statut')) {
            throw new common_1.BadRequestException('Cannot edit a loaded BL — only status change is allowed');
        }
        await this.repo.update(id, {
            clientNom: dto.clientNom,
            clientAdresse: dto.clientAdresse,
            origine: dto.origine,
            destination: dto.destination,
            typeChargement: dto.typeChargement,
            tonnageTotal: dto.tonnageTotal,
            nombrePalettes: dto.nombrePalettes,
            datelivraison: dto.datelivraison,
            notes: dto.notes,
            statut: dto.statut,
            ...(dto.societeExpediticeId !== undefined
                ? { societeExpeditrice: dto.societeExpediticeId ? { id: dto.societeExpediticeId } : null }
                : {}),
            ...(dto.filiereId !== undefined
                ? { filiere: dto.filiereId ? { id: dto.filiereId } : null }
                : {}),
        });
        return this.findOne(id);
    }
    async remove(id) {
        const bl = await this.findOne(id);
        if (bl.statut === bl_status_enum_1.BlStatus.LOADED)
            throw new common_1.BadRequestException('Cannot delete a loaded BL');
        return this.repo.remove(bl);
    }
};
exports.BonsLivraisonService = BonsLivraisonService;
exports.BonsLivraisonService = BonsLivraisonService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(bon_livraison_entity_1.BonLivraison)),
    __param(1, (0, typeorm_1.InjectRepository)(bl_article_entity_1.BlArticle)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], BonsLivraisonService);
//# sourceMappingURL=bons-livraison.service.js.map