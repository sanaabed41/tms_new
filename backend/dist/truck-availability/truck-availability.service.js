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
exports.TruckAvailabilityService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const truck_availability_entity_1 = require("./truck-availability.entity");
const truck_entity_1 = require("../trucks/truck.entity");
let TruckAvailabilityService = class TruckAvailabilityService {
    repo;
    truckRepo;
    constructor(repo, truckRepo) {
        this.repo = repo;
        this.truckRepo = truckRepo;
    }
    findByDate(companyId, date) {
        return this.repo.createQueryBuilder('ta')
            .leftJoinAndSelect('ta.truck', 'truck')
            .leftJoinAndSelect('truck.deliveryCompany', 'dc')
            .leftJoinAndSelect('dc.company', 'company')
            .where('company.id = :companyId', { companyId })
            .andWhere('ta.date = :date', { date })
            .orderBy('dc.nom')
            .addOrderBy('truck.matricule')
            .getMany();
    }
    async addTruck(companyId, truckId, date) {
        const truck = await this.truckRepo.findOne({ where: { id: truckId } });
        if (!truck)
            throw new common_1.NotFoundException('Truck not found');
        const existing = await this.repo.findOne({ where: { truck: { id: truckId }, date } });
        if (existing)
            throw new common_1.ConflictException('Truck already declared available for this date');
        const availability = this.repo.create({
            date,
            truck: { id: truckId },
            company: { id: companyId },
        });
        return this.repo.save(availability);
    }
    async bulkSet(companyId, truckIds, date) {
        await this.repo
            .createQueryBuilder()
            .delete()
            .from(truck_availability_entity_1.TruckAvailability)
            .where('date = :date AND "companyId" = :companyId', { date, companyId })
            .execute();
        if (truckIds.length === 0)
            return { set: 0 };
        const trucks = await this.truckRepo.findBy({ id: (0, typeorm_2.In)(truckIds) });
        const entities = trucks.map((truck) => this.repo.create({ date, truck, company: { id: companyId } }));
        await this.repo.save(entities);
        return { set: entities.length };
    }
    async remove(companyId, id) {
        const ta = await this.repo.findOne({ where: { id } });
        if (!ta)
            throw new common_1.NotFoundException('Availability not found');
        await this.repo.delete(id);
    }
};
exports.TruckAvailabilityService = TruckAvailabilityService;
exports.TruckAvailabilityService = TruckAvailabilityService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(truck_availability_entity_1.TruckAvailability)),
    __param(1, (0, typeorm_1.InjectRepository)(truck_entity_1.Truck)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], TruckAvailabilityService);
//# sourceMappingURL=truck-availability.service.js.map