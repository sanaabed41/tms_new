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
exports.LoadingPlan = void 0;
const typeorm_1 = require("typeorm");
const truck_entity_1 = require("../trucks/truck.entity");
const bon_livraison_entity_1 = require("../bons-livraison/bon-livraison.entity");
const user_entity_1 = require("../users/user.entity");
let LoadingPlan = class LoadingPlan {
    id;
    reference;
    dateLivraison;
    tonnageCharge;
    palettesChargees;
    isValidated;
    signature;
    heureArrivee;
    loadingStatus;
    entryStatus;
    quai;
    stationsSequence;
    currentStationIdx;
    currentStation;
    loadingStartedAt;
    loadingElapsedSeconds;
    calledAt;
    enteredAt;
    logistiqueCompanyId;
    createdAt;
    truck;
    bonsLivraison;
    validatedBy;
};
exports.LoadingPlan = LoadingPlan;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], LoadingPlan.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], LoadingPlan.prototype, "reference", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], LoadingPlan.prototype, "dateLivraison", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], LoadingPlan.prototype, "tonnageCharge", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], LoadingPlan.prototype, "palettesChargees", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], LoadingPlan.prototype, "isValidated", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], LoadingPlan.prototype, "signature", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], LoadingPlan.prototype, "heureArrivee", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'WAITING' }),
    __metadata("design:type", String)
], LoadingPlan.prototype, "loadingStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'IDLE' }),
    __metadata("design:type", String)
], LoadingPlan.prototype, "entryStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 30, nullable: true }),
    __metadata("design:type", String)
], LoadingPlan.prototype, "quai", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], LoadingPlan.prototype, "stationsSequence", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], LoadingPlan.prototype, "currentStationIdx", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], LoadingPlan.prototype, "currentStation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], LoadingPlan.prototype, "loadingStartedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], LoadingPlan.prototype, "loadingElapsedSeconds", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], LoadingPlan.prototype, "calledAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], LoadingPlan.prototype, "enteredAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], LoadingPlan.prototype, "logistiqueCompanyId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], LoadingPlan.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => truck_entity_1.Truck, (truck) => truck.loadingPlans, { eager: true }),
    __metadata("design:type", truck_entity_1.Truck)
], LoadingPlan.prototype, "truck", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => bon_livraison_entity_1.BonLivraison, (bl) => bl.loadingPlan),
    __metadata("design:type", Array)
], LoadingPlan.prototype, "bonsLivraison", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, eager: true }),
    __metadata("design:type", user_entity_1.User)
], LoadingPlan.prototype, "validatedBy", void 0);
exports.LoadingPlan = LoadingPlan = __decorate([
    (0, typeorm_1.Entity)('loading_plans')
], LoadingPlan);
//# sourceMappingURL=loading-plan.entity.js.map