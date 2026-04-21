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
exports.SocieteExpeditrice = void 0;
const typeorm_1 = require("typeorm");
const company_entity_1 = require("../companies/company.entity");
const filiere_entity_1 = require("./filiere.entity");
let SocieteExpeditrice = class SocieteExpeditrice {
    id;
    nom;
    code;
    couleur;
    adresse;
    telephone;
    createdAt;
    company;
    filieres;
};
exports.SocieteExpeditrice = SocieteExpeditrice;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SocieteExpeditrice.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SocieteExpeditrice.prototype, "nom", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SocieteExpeditrice.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SocieteExpeditrice.prototype, "couleur", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SocieteExpeditrice.prototype, "adresse", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SocieteExpeditrice.prototype, "telephone", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SocieteExpeditrice.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => company_entity_1.Company, { nullable: false, onDelete: 'CASCADE' }),
    __metadata("design:type", company_entity_1.Company)
], SocieteExpeditrice.prototype, "company", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => filiere_entity_1.Filiere, (f) => f.societeExpeditrice, { cascade: true, eager: true }),
    __metadata("design:type", Array)
], SocieteExpeditrice.prototype, "filieres", void 0);
exports.SocieteExpeditrice = SocieteExpeditrice = __decorate([
    (0, typeorm_1.Entity)('societes_expeditrices')
], SocieteExpeditrice);
//# sourceMappingURL=societe-expeditrice.entity.js.map