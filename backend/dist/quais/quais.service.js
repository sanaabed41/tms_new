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
exports.QuaisService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const quai_entity_1 = require("./quai.entity");
let QuaisService = class QuaisService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    findAll(companyId) {
        const where = companyId ? { company: { id: companyId } } : {};
        return this.repo.find({
            where,
            relations: ['societeExpeditrice', 'filiere'],
            order: { societeExpeditrice: { nom: 'ASC' }, filiere: { nom: 'ASC' }, nom: 'ASC' },
        });
    }
    async create(companyId, dto) {
        const quai = this.repo.create({
            nom: dto.nom,
            isActive: dto.isActive ?? true,
            company: { id: companyId },
            societeExpeditrice: dto.societeExpeditriceId ? { id: dto.societeExpeditriceId } : null,
            filiere: dto.filiereId ? { id: dto.filiereId } : null,
        });
        return this.repo.save(quai);
    }
    async update(id, dto) {
        const quai = await this.repo.findOne({ where: { id } });
        if (!quai)
            throw new common_1.NotFoundException('Quai introuvable');
        if (dto.nom !== undefined)
            quai.nom = dto.nom;
        if (dto.isActive !== undefined)
            quai.isActive = dto.isActive;
        if ('societeExpeditriceId' in dto)
            quai.societeExpeditrice = dto.societeExpeditriceId ? { id: dto.societeExpeditriceId } : null;
        if ('filiereId' in dto)
            quai.filiere = dto.filiereId ? { id: dto.filiereId } : null;
        return this.repo.save(quai);
    }
    async remove(id) {
        const quai = await this.repo.findOne({ where: { id } });
        if (!quai)
            throw new common_1.NotFoundException('Quai introuvable');
        return this.repo.remove(quai);
    }
};
exports.QuaisService = QuaisService;
exports.QuaisService = QuaisService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(quai_entity_1.Quai)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], QuaisService);
//# sourceMappingURL=quais.service.js.map