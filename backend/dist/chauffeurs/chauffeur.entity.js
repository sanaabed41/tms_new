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
exports.Chauffeur = void 0;
const typeorm_1 = require("typeorm");
const delivery_company_entity_1 = require("../delivery-companies/delivery-company.entity");
let Chauffeur = class Chauffeur {
    id;
    nom;
    prenom;
    telephone;
    cin;
    permis;
    isActive;
    createdAt;
    deliveryCompany;
};
exports.Chauffeur = Chauffeur;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Chauffeur.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Chauffeur.prototype, "nom", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Chauffeur.prototype, "prenom", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Chauffeur.prototype, "telephone", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Chauffeur.prototype, "cin", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Chauffeur.prototype, "permis", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Chauffeur.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Chauffeur.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => delivery_company_entity_1.DeliveryCompany, { onDelete: 'CASCADE', eager: false }),
    __metadata("design:type", delivery_company_entity_1.DeliveryCompany)
], Chauffeur.prototype, "deliveryCompany", void 0);
exports.Chauffeur = Chauffeur = __decorate([
    (0, typeorm_1.Entity)('chauffeurs')
], Chauffeur);
//# sourceMappingURL=chauffeur.entity.js.map