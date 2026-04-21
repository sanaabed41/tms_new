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
exports.DeliveryCompany = void 0;
const typeorm_1 = require("typeorm");
const company_entity_1 = require("../companies/company.entity");
const truck_entity_1 = require("../trucks/truck.entity");
let DeliveryCompany = class DeliveryCompany {
    id;
    nom;
    adresse;
    telephone;
    isActive;
    createdAt;
    company;
    camions;
};
exports.DeliveryCompany = DeliveryCompany;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DeliveryCompany.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], DeliveryCompany.prototype, "nom", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DeliveryCompany.prototype, "adresse", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DeliveryCompany.prototype, "telephone", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], DeliveryCompany.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], DeliveryCompany.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => company_entity_1.Company, (company) => company.deliveryCompanies),
    __metadata("design:type", company_entity_1.Company)
], DeliveryCompany.prototype, "company", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => truck_entity_1.Truck, (truck) => truck.deliveryCompany),
    __metadata("design:type", Array)
], DeliveryCompany.prototype, "camions", void 0);
exports.DeliveryCompany = DeliveryCompany = __decorate([
    (0, typeorm_1.Entity)('delivery_companies')
], DeliveryCompany);
//# sourceMappingURL=delivery-company.entity.js.map