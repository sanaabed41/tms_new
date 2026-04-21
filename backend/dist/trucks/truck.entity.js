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
exports.Truck = void 0;
const typeorm_1 = require("typeorm");
const delivery_company_entity_1 = require("../delivery-companies/delivery-company.entity");
const loading_plan_entity_1 = require("../loading-plans/loading-plan.entity");
let Truck = class Truck {
    id;
    matricule;
    capaciteTonnage;
    capacitePalettes;
    type;
    isActive;
    deliveryCompany;
    loadingPlans;
};
exports.Truck = Truck;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Truck.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Truck.prototype, "matricule", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Truck.prototype, "capaciteTonnage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], Truck.prototype, "capacitePalettes", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Truck.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Truck.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => delivery_company_entity_1.DeliveryCompany, (dc) => dc.camions),
    __metadata("design:type", delivery_company_entity_1.DeliveryCompany)
], Truck.prototype, "deliveryCompany", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => loading_plan_entity_1.LoadingPlan, (lp) => lp.truck),
    __metadata("design:type", Array)
], Truck.prototype, "loadingPlans", void 0);
exports.Truck = Truck = __decorate([
    (0, typeorm_1.Entity)('trucks')
], Truck);
//# sourceMappingURL=truck.entity.js.map