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
exports.CompaniesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const company_entity_1 = require("./company.entity");
const company_type_enum_1 = require("../common/enums/company-type.enum");
let CompaniesService = class CompaniesService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    findAll(type) {
        const where = type ? { type } : {};
        return this.repo.find({ where, relations: ['logistiqueCompany'], order: { nom: 'ASC' } });
    }
    findByLogistique(logistiqueId) {
        return this.repo.find({
            where: { type: company_type_enum_1.CompanyType.EXPEDITEUR, logistiqueCompany: { id: logistiqueId } },
            relations: ['logistiqueCompany'],
            order: { nom: 'ASC' },
        });
    }
    async findOne(id) {
        const company = await this.repo.findOne({
            where: { id },
            relations: ['logistiqueCompany', 'expediteurClients'],
        });
        if (!company)
            throw new common_1.NotFoundException('Company not found');
        return company;
    }
    normalize(dto) {
        if (dto.nom)
            dto.nom = dto.nom.trim();
        if (dto.code)
            dto.code = dto.code.trim().toUpperCase();
        return dto;
    }
    async assertCodeUnique(code, excludeId) {
        if (!code)
            return;
        const existing = await this.repo.findOne({
            where: excludeId
                ? { code: code.trim().toUpperCase(), id: (0, typeorm_2.Not)(excludeId) }
                : { code: code.trim().toUpperCase() },
        });
        if (existing)
            throw new common_1.BadRequestException(`Le code "${code.toUpperCase()}" est déjà utilisé par "${existing.nom}"`);
    }
    async create(dto) {
        const normalized = this.normalize({ ...dto });
        await this.assertCodeUnique(normalized.code ?? '');
        const data = { ...normalized };
        if (dto.logistiqueCompanyId) {
            data.logistiqueCompany = { id: dto.logistiqueCompanyId };
        }
        const entity = this.repo.create(data);
        return this.repo.save(entity);
    }
    async update(id, dto) {
        await this.findOne(id);
        const normalized = this.normalize({ ...dto });
        await this.assertCodeUnique(normalized.code ?? '', id);
        const data = { ...normalized };
        if ('logistiqueCompanyId' in dto) {
            data.logistiqueCompany = dto.logistiqueCompanyId ? { id: dto.logistiqueCompanyId } : null;
        }
        await this.repo.update(id, data);
        return this.findOne(id);
    }
    async remove(id) {
        const company = await this.repo.findOne({ where: { id }, relations: ['users'] });
        if (!company)
            throw new common_1.NotFoundException('Company not found');
        if (company.users?.length)
            throw new common_1.BadRequestException(`Impossible de supprimer : ${company.users.length} utilisateur(s) sont liés à cette société`);
        return this.repo.remove(company);
    }
    async setLogistiqueCompany(expediteurId, logistiqueId) {
        const expediteur = await this.repo.findOne({ where: { id: expediteurId } });
        if (!expediteur)
            throw new common_1.NotFoundException('Société expéditrice introuvable');
        if (expediteur.type !== company_type_enum_1.CompanyType.EXPEDITEUR)
            throw new common_1.BadRequestException('La société doit être de type EXPEDITEUR');
        if (logistiqueId) {
            const logistique = await this.repo.findOne({ where: { id: logistiqueId } });
            if (!logistique)
                throw new common_1.NotFoundException('Société logistique introuvable');
            if (logistique.type !== company_type_enum_1.CompanyType.LOGISTIQUE)
                throw new common_1.BadRequestException('La société logistique doit être de type LOGISTIQUE');
        }
        await this.repo.update(expediteurId, {
            logistiqueCompany: logistiqueId ? { id: logistiqueId } : null,
        });
        return this.findOne(expediteurId);
    }
};
exports.CompaniesService = CompaniesService;
exports.CompaniesService = CompaniesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(company_entity_1.Company)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CompaniesService);
//# sourceMappingURL=companies.service.js.map