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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpediteursService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const societe_expeditrice_entity_1 = require("./societe-expeditrice.entity");
const filiere_entity_1 = require("./filiere.entity");
let ExpediteursService = class ExpediteursService {
    societeRepo;
    filiereRepo;
    constructor(societeRepo, filiereRepo) {
        this.societeRepo = societeRepo;
        this.filiereRepo = filiereRepo;
    }
    findAll(companyId) {
        return this.societeRepo.find({
            where: { company: { id: companyId } },
            relations: ['filieres'],
            order: { nom: 'ASC' },
        });
    }
    async findOne(id) {
        const s = await this.societeRepo.findOne({ where: { id }, relations: ['filieres'] });
        if (!s)
            throw new common_1.NotFoundException('Société expéditrice introuvable');
        return s;
    }
    async create(dto, companyId) {
        const societe = this.societeRepo.create({ ...dto, company: { id: companyId } });
        return this.societeRepo.save(societe);
    }
    async update(id, dto) {
        await this.findOne(id);
        await this.societeRepo.update(id, {
            nom: dto.nom,
            code: dto.code,
            couleur: dto.couleur,
            adresse: dto.adresse,
            telephone: dto.telephone,
        });
        return this.findOne(id);
    }
    async remove(id) {
        await this.findOne(id);
        return this.societeRepo.delete(id);
    }
    async createFiliere(societeId, dto) {
        await this.findOne(societeId);
        const f = this.filiereRepo.create({ ...dto, societeExpeditrice: { id: societeId } });
        return this.filiereRepo.save(f);
    }
    async updateFiliere(filiereId, dto) {
        await this.filiereRepo.update(filiereId, { nom: dto.nom, code: dto.code });
        return this.filiereRepo.findOne({ where: { id: filiereId } });
    }
    async removeFiliere(filiereId) {
        return this.filiereRepo.delete(filiereId);
    }
};
exports.ExpediteursService = ExpediteursService;
exports.ExpediteursService = ExpediteursService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(societe_expeditrice_entity_1.SocieteExpeditrice)),
    __param(1, (0, typeorm_1.InjectRepository)(filiere_entity_1.Filiere)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ExpediteursService);
//# sourceMappingURL=expediteurs.service.js.map