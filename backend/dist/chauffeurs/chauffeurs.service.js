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
exports.ChauffeursService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const chauffeur_entity_1 = require("./chauffeur.entity");
let ChauffeursService = class ChauffeursService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    findAll(companyId) {
        return this.repo.createQueryBuilder('c')
            .leftJoinAndSelect('c.deliveryCompany', 'dc')
            .leftJoin('dc.company', 'company')
            .where('company.id = :companyId', { companyId })
            .orderBy('c.nom', 'ASC')
            .getMany();
    }
    findByDeliveryCompany(deliveryCompanyId) {
        return this.repo.find({
            where: { deliveryCompany: { id: deliveryCompanyId } },
            order: { nom: 'ASC' },
        });
    }
    async findOne(id) {
        const c = await this.repo.findOne({ where: { id }, relations: ['deliveryCompany'] });
        if (!c)
            throw new common_1.NotFoundException('Chauffeur introuvable');
        return c;
    }
    create(dto) {
        const chauffeur = this.repo.create({
            nom: dto.nom,
            prenom: dto.prenom,
            telephone: dto.telephone,
            cin: dto.cin,
            permis: dto.permis,
            deliveryCompany: { id: dto.deliveryCompanyId },
        });
        return this.repo.save(chauffeur);
    }
    async update(id, dto) {
        await this.findOne(id);
        await this.repo.update(id, {
            nom: dto.nom,
            prenom: dto.prenom,
            telephone: dto.telephone,
            cin: dto.cin,
            permis: dto.permis,
        });
        return this.findOne(id);
    }
    async toggleActive(id) {
        const chauffeur = await this.findOne(id);
        await this.repo.update(id, { isActive: !chauffeur.isActive });
        return this.findOne(id);
    }
    async remove(id) {
        await this.findOne(id);
        return this.repo.delete(id);
    }
};
exports.ChauffeursService = ChauffeursService;
exports.ChauffeursService = ChauffeursService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(chauffeur_entity_1.Chauffeur)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ChauffeursService);
//# sourceMappingURL=chauffeurs.service.js.map