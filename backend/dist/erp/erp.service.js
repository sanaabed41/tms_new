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
exports.ErpService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const article_entity_1 = require("../articles/article.entity");
const bon_livraison_entity_1 = require("../bons-livraison/bon-livraison.entity");
const bl_article_entity_1 = require("../bons-livraison/bl-article.entity");
const bl_status_enum_1 = require("../common/enums/bl-status.enum");
let ErpService = class ErpService {
    artRepo;
    blRepo;
    blaRepo;
    constructor(artRepo, blRepo, blaRepo) {
        this.artRepo = artRepo;
        this.blRepo = blRepo;
        this.blaRepo = blaRepo;
    }
    async upsertArticles(articles) {
        const results = [];
        for (const dto of articles) {
            const existing = await this.artRepo.findOne({ where: { code: dto.code } });
            if (existing) {
                await this.artRepo.update(existing.id, {
                    libelle: dto.libelle,
                    poidsUnitaire: dto.poidsUnitaire,
                    ...(dto.unite ? { unite: dto.unite } : {}),
                });
                results.push({ code: dto.code, action: 'updated' });
            }
            else {
                await this.artRepo.save(this.artRepo.create({
                    code: dto.code,
                    libelle: dto.libelle,
                    poidsUnitaire: dto.poidsUnitaire,
                    unite: dto.unite || 'Unité',
                }));
                results.push({ code: dto.code, action: 'created' });
            }
        }
        return results;
    }
    async upsertBons(companyId, bons) {
        const results = [];
        for (const dto of bons) {
            const existing = await this.blRepo.findOne({
                where: { erpReference: dto.erpReference, company: { id: companyId } },
                relations: ['blArticles'],
            });
            if (existing) {
                if (existing.statut === bl_status_enum_1.BlStatus.LOADED || existing.statut === bl_status_enum_1.BlStatus.DELIVERED) {
                    results.push({ erpReference: dto.erpReference, numeroBl: existing.numeroBl, action: 'skipped' });
                    continue;
                }
                await this.blRepo.update(existing.id, {
                    clientNom: dto.clientNom,
                    ...(dto.clientAdresse !== undefined ? { clientAdresse: dto.clientAdresse } : {}),
                    ...(dto.origine !== undefined ? { origine: dto.origine } : {}),
                    ...(dto.destination !== undefined ? { destination: dto.destination } : {}),
                    tonnageTotal: dto.tonnageTotal,
                    ...(dto.nombrePalettes !== undefined ? { nombrePalettes: dto.nombrePalettes } : {}),
                    ...(dto.datelivraison ? { datelivraison: new Date(dto.datelivraison) } : {}),
                    ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
                });
                if (dto.articles?.length) {
                    await this.blaRepo.delete({ bonLivraison: { id: existing.id } });
                    await this.syncArticles(existing.id, dto.articles);
                }
                results.push({ erpReference: dto.erpReference, numeroBl: existing.numeroBl, action: 'updated' });
            }
            else {
                const bl = await this.blRepo.save(this.blRepo.create({
                    numeroBl: dto.numeroBl,
                    erpReference: dto.erpReference,
                    clientNom: dto.clientNom,
                    clientAdresse: dto.clientAdresse,
                    origine: dto.origine,
                    destination: dto.destination,
                    typeChargement: dto.typeChargement || 'VRAC',
                    tonnageTotal: dto.tonnageTotal,
                    nombrePalettes: dto.nombrePalettes ?? 0,
                    datelivraison: dto.datelivraison ? new Date(dto.datelivraison) : undefined,
                    notes: dto.notes,
                    statut: bl_status_enum_1.BlStatus.VALIDATED,
                    company: { id: companyId },
                }));
                if (dto.articles?.length)
                    await this.syncArticles(bl.id, dto.articles);
                results.push({ erpReference: dto.erpReference, numeroBl: dto.numeroBl, action: 'created' });
            }
        }
        return { processed: results.length, results };
    }
    async syncArticles(blId, lines) {
        for (const line of lines) {
            const article = await this.artRepo.findOne({ where: { code: line.code } });
            if (!article)
                continue;
            await this.blaRepo.save(this.blaRepo.create({
                bonLivraison: { id: blId },
                article,
                quantite: line.quantite,
                poidsTotal: article.poidsUnitaire * line.quantite,
            }));
        }
    }
};
exports.ErpService = ErpService;
exports.ErpService = ErpService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(article_entity_1.Article)),
    __param(1, (0, typeorm_1.InjectRepository)(bon_livraison_entity_1.BonLivraison)),
    __param(2, (0, typeorm_1.InjectRepository)(bl_article_entity_1.BlArticle)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ErpService);
//# sourceMappingURL=erp.service.js.map