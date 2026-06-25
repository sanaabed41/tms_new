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
exports.Company = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
const delivery_company_entity_1 = require("../delivery-companies/delivery-company.entity");
const bon_livraison_entity_1 = require("../bons-livraison/bon-livraison.entity");
const company_type_enum_1 = require("../common/enums/company-type.enum");
let Company = class Company {
    id;
    nom;
    type;
    adresse;
    telephone;
    couleur;
    code;
    isActive;
    createdAt;
    users;
    deliveryCompanies;
    bonsLivraison;
    logistiqueCompany;
    expediteurClients;
};
exports.Company = Company;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Company.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Company.prototype, "nom", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: company_type_enum_1.CompanyType, default: company_type_enum_1.CompanyType.LOGISTIQUE }),
    __metadata("design:type", String)
], Company.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Company.prototype, "adresse", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Company.prototype, "telephone", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Company.prototype, "couleur", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, unique: true }),
    __metadata("design:type", String)
], Company.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Company.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Company.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => user_entity_1.User, (user) => user.company),
    __metadata("design:type", Array)
], Company.prototype, "users", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => delivery_company_entity_1.DeliveryCompany, (dc) => dc.company),
    __metadata("design:type", Array)
], Company.prototype, "deliveryCompanies", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => bon_livraison_entity_1.BonLivraison, (bl) => bl.company),
    __metadata("design:type", Array)
], Company.prototype, "bonsLivraison", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Company, (c) => c.expediteurClients, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'logistiqueCompanyId' }),
    __metadata("design:type", Object)
], Company.prototype, "logistiqueCompany", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Company, (c) => c.logistiqueCompany),
    __metadata("design:type", Array)
], Company.prototype, "expediteurClients", void 0);
exports.Company = Company = __decorate([
    (0, typeorm_1.Entity)('companies')
], Company);
//# sourceMappingURL=company.entity.js.map