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
exports.TruckAvailability = void 0;
const typeorm_1 = require("typeorm");
const truck_entity_1 = require("../trucks/truck.entity");
const company_entity_1 = require("../companies/company.entity");
let TruckAvailability = class TruckAvailability {
    id;
    date;
    statut;
    motif;
    truck;
    company;
    createdAt;
};
exports.TruckAvailability = TruckAvailability;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TruckAvailability.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], TruckAvailability.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'DISPONIBLE' }),
    __metadata("design:type", String)
], TruckAvailability.prototype, "statut", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], TruckAvailability.prototype, "motif", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => truck_entity_1.Truck, { eager: true, onDelete: 'CASCADE' }),
    __metadata("design:type", truck_entity_1.Truck)
], TruckAvailability.prototype, "truck", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => company_entity_1.Company, { onDelete: 'CASCADE' }),
    __metadata("design:type", company_entity_1.Company)
], TruckAvailability.prototype, "company", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TruckAvailability.prototype, "createdAt", void 0);
exports.TruckAvailability = TruckAvailability = __decorate([
    (0, typeorm_1.Entity)('truck_availabilities'),
    (0, typeorm_1.Unique)(['truck', 'date'])
], TruckAvailability);
//# sourceMappingURL=truck-availability.entity.js.map