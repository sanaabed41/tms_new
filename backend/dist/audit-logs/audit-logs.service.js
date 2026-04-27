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
exports.AuditLogsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const audit_log_entity_1 = require("./audit-log.entity");
let AuditLogsService = class AuditLogsService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async log(payload) {
        try {
            await this.repo.save(this.repo.create(payload));
        }
        catch {
        }
    }
    async findAll(filters = {}) {
        const qb = this.repo.createQueryBuilder('log').orderBy('log.createdAt', 'DESC');
        if (filters.companyId) {
            qb.andWhere('log.companyId = :cid', { cid: filters.companyId });
        }
        if (filters.action) {
            qb.andWhere('log.action = :action', { action: filters.action });
        }
        if (filters.fromDate) {
            qb.andWhere('log.createdAt >= :from', { from: new Date(filters.fromDate) });
        }
        if (filters.toDate) {
            const to = new Date(filters.toDate);
            to.setHours(23, 59, 59, 999);
            qb.andWhere('log.createdAt <= :to', { to });
        }
        if (filters.search) {
            qb.andWhere('(log.actorEmail ILIKE :s OR log.targetEmail ILIKE :s OR log.companyNom ILIKE :s)', { s: `%${filters.search}%` });
        }
        return qb.take(filters.limit ?? 500).getMany();
    }
};
exports.AuditLogsService = AuditLogsService;
exports.AuditLogsService = AuditLogsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AuditLogsService);
//# sourceMappingURL=audit-logs.service.js.map