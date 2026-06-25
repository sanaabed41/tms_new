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
exports.TransportPortalService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const transport_declaration_entity_1 = require("./transport-declaration.entity");
const truck_entity_1 = require("../trucks/truck.entity");
let TransportPortalService = class TransportPortalService {
    declRepo;
    truckRepo;
    constructor(declRepo, truckRepo) {
        this.declRepo = declRepo;
        this.truckRepo = truckRepo;
    }
    async getMyFleet(deliveryCompanyId) {
        const trucks = await this.truckRepo.find({
            where: { deliveryCompany: { id: deliveryCompanyId } },
        });
        const declarations = await this.declRepo
            .createQueryBuilder('d')
            .leftJoinAndSelect('d.truck', 'truck')
            .leftJoin('truck.deliveryCompany', 'dc')
            .where('dc.id = :id', { id: deliveryCompanyId })
            .getMany();
        return trucks.map((truck) => ({
            ...truck,
            declaration: declarations.find((d) => d.truck.id === truck.id) ?? null,
        }));
    }
    async createTruck(dto, deliveryCompanyId, logistiqueCompanyId, userId) {
        const truck = await this.truckRepo.save(this.truckRepo.create({
            matricule: dto.matricule,
            capaciteTonnage: dto.capaciteTonnage,
            capacitePalettes: dto.capacitePalettes,
            ...(dto.type && { type: dto.type }),
            isActive: true,
            deliveryCompany: { id: deliveryCompanyId },
        }));
        if (dto.dateDebut) {
            await this.declRepo.save(this.declRepo.create({
                truck: { id: truck.id },
                dateDebut: dto.dateDebut,
                dateFin: dto.dateFin ?? null,
                chauffeurNom: dto.chauffeurNom ?? null,
                chauffeurTel: dto.chauffeurTel ?? null,
                isActive: dto.disponible !== false,
                logistiqueCompanyId,
                declaredByUserId: userId,
            }));
        }
        return truck;
    }
    async updateTruck(truckId, dto, deliveryCompanyId, logistiqueCompanyId, userId) {
        const truck = await this.truckRepo.findOne({
            where: { id: truckId },
            relations: ['deliveryCompany'],
        });
        if (!truck)
            throw new common_1.NotFoundException('Camion non trouvé');
        if (truck.deliveryCompany?.id !== deliveryCompanyId)
            throw new common_1.ForbiddenException('Accès interdit');
        await this.truckRepo.update(truckId, {
            ...(dto.matricule !== undefined && { matricule: dto.matricule }),
            ...(dto.capaciteTonnage !== undefined && { capaciteTonnage: dto.capaciteTonnage }),
            ...(dto.capacitePalettes !== undefined && { capacitePalettes: dto.capacitePalettes }),
            ...(dto.type !== undefined && { type: dto.type }),
        });
        if (dto.dateDebut !== undefined) {
            const existing = await this.declRepo.findOne({ where: { truck: { id: truckId } } });
            if (existing) {
                Object.assign(existing, {
                    dateDebut: dto.dateDebut,
                    dateFin: dto.dateFin ?? null,
                    chauffeurNom: dto.chauffeurNom ?? null,
                    chauffeurTel: dto.chauffeurTel ?? null,
                    ...(dto.disponible !== undefined && { isActive: dto.disponible }),
                });
                await this.declRepo.save(existing);
            }
            else {
                await this.declRepo.save(this.declRepo.create({
                    truck: { id: truckId },
                    dateDebut: dto.dateDebut,
                    dateFin: dto.dateFin ?? null,
                    chauffeurNom: dto.chauffeurNom ?? null,
                    chauffeurTel: dto.chauffeurTel ?? null,
                    isActive: dto.disponible !== false,
                    logistiqueCompanyId,
                    declaredByUserId: userId,
                }));
            }
        }
        else if (dto.disponible !== undefined) {
            const existing = await this.declRepo.findOne({ where: { truck: { id: truckId } } });
            if (existing) {
                await this.declRepo.update(existing.id, { isActive: dto.disponible });
            }
        }
        return this.truckRepo.findOne({ where: { id: truckId } });
    }
    async removeTruck(truckId, deliveryCompanyId) {
        const truck = await this.truckRepo.findOne({
            where: { id: truckId },
            relations: ['deliveryCompany'],
        });
        if (!truck)
            throw new common_1.NotFoundException('Camion non trouvé');
        if (truck.deliveryCompany?.id !== deliveryCompanyId)
            throw new common_1.ForbiddenException('Accès interdit');
        await this.declRepo
            .createQueryBuilder()
            .delete()
            .where('"truckId" = :truckId', { truckId })
            .execute();
        return this.truckRepo.remove(truck);
    }
    getDeclarationsForLogistique(logistiqueCompanyId, dateFrom, dateTo) {
        const qb = this.declRepo
            .createQueryBuilder('d')
            .leftJoinAndSelect('d.truck', 'truck')
            .leftJoinAndSelect('truck.deliveryCompany', 'dc')
            .where('d.logistiqueCompanyId = :logistiqueCompanyId', { logistiqueCompanyId })
            .andWhere('d.isActive = true');
        if (dateFrom)
            qb.andWhere('d.dateDebut <= :dateTo2', { dateTo2: dateTo ?? dateFrom });
        if (dateTo)
            qb.andWhere('(d.dateFin IS NULL OR d.dateFin >= :dateFrom2)', { dateFrom2: dateFrom ?? dateTo });
        return qb.orderBy('d.dateDebut', 'ASC').getMany();
    }
};
exports.TransportPortalService = TransportPortalService;
exports.TransportPortalService = TransportPortalService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(transport_declaration_entity_1.TransportDeclaration)),
    __param(1, (0, typeorm_1.InjectRepository)(truck_entity_1.Truck)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], TransportPortalService);
//# sourceMappingURL=transport-portal.service.js.map