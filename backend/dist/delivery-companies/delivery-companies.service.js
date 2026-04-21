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
exports.DeliveryCompaniesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const delivery_company_entity_1 = require("./delivery-company.entity");
let DeliveryCompaniesService = class DeliveryCompaniesService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    findAll(companyId) {
        return this.repo.find({ where: { company: { id: companyId } }, relations: ['camions'] });
    }
    async findOne(id) {
        const dc = await this.repo.findOne({ where: { id }, relations: ['camions', 'company'] });
        if (!dc)
            throw new common_1.NotFoundException('Delivery company not found');
        return dc;
    }
    create(dto, companyId) {
        const dc = this.repo.create({ ...dto, company: { id: companyId } });
        return this.repo.save(dc);
    }
    async update(id, dto) {
        await this.findOne(id);
        await this.repo.update(id, dto);
        return this.findOne(id);
    }
    async remove(id) {
        const dc = await this.findOne(id);
        return this.repo.remove(dc);
    }
};
exports.DeliveryCompaniesService = DeliveryCompaniesService;
exports.DeliveryCompaniesService = DeliveryCompaniesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(delivery_company_entity_1.DeliveryCompany)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], DeliveryCompaniesService);
//# sourceMappingURL=delivery-companies.service.js.map