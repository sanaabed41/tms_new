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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BonLivraison = exports.TypeChargement = void 0;
const typeorm_1 = require("typeorm");
const company_entity_1 = require("../companies/company.entity");
const bl_article_entity_1 = require("./bl-article.entity");
const loading_plan_entity_1 = require("../loading-plans/loading-plan.entity");
const bl_status_enum_1 = require("../common/enums/bl-status.enum");
const societe_expeditrice_entity_1 = require("../expediteurs/societe-expeditrice.entity");
const filiere_entity_1 = require("../expediteurs/filiere.entity");
var TypeChargement;
(function (TypeChargement) {
    TypeChargement["VRAC"] = "VRAC";
    TypeChargement["PALETTE"] = "PALETTE";
    TypeChargement["FRIGO"] = "FRIGO";
    TypeChargement["CITERNE"] = "CITERNE";
})(TypeChargement || (exports.TypeChargement = TypeChargement = {}));
let BonLivraison = class BonLivraison {
    id;
    numeroBl;
    clientNom;
    clientAdresse;
    origine;
    destination;
    typeChargement;
    tonnageTotal;
    nombrePalettes;
    statut;
    datelivraison;
    erpReference;
    notes;
    createdAt;
    company;
    societeExpeditrice;
    filiere;
    blArticles;
    loadingPlan;
};
exports.BonLivraison = BonLivraison;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], BonLivraison.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], BonLivraison.prototype, "numeroBl", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], BonLivraison.prototype, "clientNom", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BonLivraison.prototype, "clientAdresse", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BonLivraison.prototype, "origine", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BonLivraison.prototype, "destination", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: TypeChargement, default: TypeChargement.VRAC }),
    __metadata("design:type", String)
], BonLivraison.prototype, "typeChargement", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], BonLivraison.prototype, "tonnageTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], BonLivraison.prototype, "nombrePalettes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: bl_status_enum_1.BlStatus, default: bl_status_enum_1.BlStatus.DRAFT }),
    __metadata("design:type", String)
], BonLivraison.prototype, "statut", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], BonLivraison.prototype, "datelivraison", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BonLivraison.prototype, "erpReference", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], BonLivraison.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], BonLivraison.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => company_entity_1.Company, (company) => company.bonsLivraison),
    __metadata("design:type", company_entity_1.Company)
], BonLivraison.prototype, "company", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => societe_expeditrice_entity_1.SocieteExpeditrice, { nullable: true, eager: false, onDelete: 'SET NULL' }),
    __metadata("design:type", Object)
], BonLivraison.prototype, "societeExpeditrice", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => filiere_entity_1.Filiere, { nullable: true, eager: false, onDelete: 'SET NULL' }),
    __metadata("design:type", Object)
], BonLivraison.prototype, "filiere", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => bl_article_entity_1.BlArticle, (bla) => bla.bonLivraison, { cascade: true }),
    __metadata("design:type", Array)
], BonLivraison.prototype, "blArticles", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => loading_plan_entity_1.LoadingPlan, (lp) => lp.bonsLivraison, { nullable: true }),
    __metadata("design:type", loading_plan_entity_1.LoadingPlan)
], BonLivraison.prototype, "loadingPlan", void 0);
exports.BonLivraison = BonLivraison = __decorate([
    (0, typeorm_1.Entity)('bons_livraison')
], BonLivraison);
//# sourceMappingURL=bon-livraison.entity.js.map