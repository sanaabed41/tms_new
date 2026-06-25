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
exports.Quai = void 0;
const typeorm_1 = require("typeorm");
const company_entity_1 = require("../companies/company.entity");
const societe_expeditrice_entity_1 = require("../expediteurs/societe-expeditrice.entity");
const filiere_entity_1 = require("../expediteurs/filiere.entity");
let Quai = class Quai {
    id;
    nom;
    isActive;
    company;
    societeExpeditrice;
    filiere;
};
exports.Quai = Quai;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Quai.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Quai.prototype, "nom", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Quai.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => company_entity_1.Company, { nullable: true, onDelete: 'SET NULL', eager: false }),
    __metadata("design:type", Object)
], Quai.prototype, "company", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => societe_expeditrice_entity_1.SocieteExpeditrice, { nullable: true, onDelete: 'CASCADE', eager: true }),
    __metadata("design:type", Object)
], Quai.prototype, "societeExpeditrice", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => filiere_entity_1.Filiere, { nullable: true, onDelete: 'CASCADE', eager: true }),
    __metadata("design:type", Object)
], Quai.prototype, "filiere", void 0);
exports.Quai = Quai = __decorate([
    (0, typeorm_1.Entity)('quais')
], Quai);
//# sourceMappingURL=quai.entity.js.map