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
exports.Filiere = void 0;
const typeorm_1 = require("typeorm");
const societe_expeditrice_entity_1 = require("./societe-expeditrice.entity");
let Filiere = class Filiere {
    id;
    nom;
    code;
    societeExpeditrice;
};
exports.Filiere = Filiere;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Filiere.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Filiere.prototype, "nom", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Filiere.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => societe_expeditrice_entity_1.SocieteExpeditrice, (s) => s.filieres, { onDelete: 'CASCADE' }),
    __metadata("design:type", societe_expeditrice_entity_1.SocieteExpeditrice)
], Filiere.prototype, "societeExpeditrice", void 0);
exports.Filiere = Filiere = __decorate([
    (0, typeorm_1.Entity)('filieres')
], Filiere);
//# sourceMappingURL=filiere.entity.js.map