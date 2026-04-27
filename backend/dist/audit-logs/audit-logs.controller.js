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
exports.AuditLogsController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const role_enum_1 = require("../common/enums/role.enum");
const audit_logs_service_1 = require("./audit-logs.service");
const audit_log_entity_1 = require("./audit-log.entity");
const user_entity_1 = require("../users/user.entity");
const company_entity_1 = require("../companies/company.entity");
const bon_livraison_entity_1 = require("../bons-livraison/bon-livraison.entity");
let AuditLogsController = class AuditLogsController {
    service;
    userRepo;
    companyRepo;
    blRepo;
    logRepo;
    constructor(service, userRepo, companyRepo, blRepo, logRepo) {
        this.service = service;
        this.userRepo = userRepo;
        this.companyRepo = companyRepo;
        this.blRepo = blRepo;
        this.logRepo = logRepo;
    }
    findAll(companyId, action, fromDate, toDate, search) {
        return this.service.findAll({ companyId, action, fromDate, toDate, search });
    }
    async getStats() {
        const [totalCompanies, activeCompanies, totalUsers, activeUsers, totalBls,] = await Promise.all([
            this.companyRepo.count(),
            this.companyRepo.count({ where: { isActive: true } }),
            this.userRepo.count(),
            this.userRepo.count({ where: { isActive: true } }),
            this.blRepo.count(),
        ]);
        const recentLogs = await this.service.findAll({ limit: 20 });
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const loginsToday = await this.logRepo.count({
            where: {
                action: 'LOGIN_SUCCESS',
                createdAt: (0, typeorm_2.MoreThanOrEqual)(todayStart),
            },
        });
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        const loginsWeek = await this.logRepo
            .createQueryBuilder('l')
            .where('l.action = :a', { a: 'LOGIN_SUCCESS' })
            .andWhere('l.createdAt >= :w', { w: weekStart })
            .getCount();
        return {
            companies: { total: totalCompanies, active: activeCompanies, inactive: totalCompanies - activeCompanies },
            users: { total: totalUsers, active: activeUsers, inactive: totalUsers - activeUsers },
            bls: { total: totalBls },
            logins: { today: loginsToday, week: loginsWeek },
            recentLogs,
        };
    }
};
exports.AuditLogsController = AuditLogsController;
__decorate([
    (0, common_1.Get)('audit-logs'),
    __param(0, (0, common_1.Query)('companyId')),
    __param(1, (0, common_1.Query)('action')),
    __param(2, (0, common_1.Query)('fromDate')),
    __param(3, (0, common_1.Query)('toDate')),
    __param(4, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], AuditLogsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuditLogsController.prototype, "getStats", null);
exports.AuditLogsController = AuditLogsController = __decorate([
    (0, swagger_1.ApiTags)('Admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    (0, common_1.Controller)('admin'),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(company_entity_1.Company)),
    __param(3, (0, typeorm_1.InjectRepository)(bon_livraison_entity_1.BonLivraison)),
    __param(4, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [audit_logs_service_1.AuditLogsService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AuditLogsController);
//# sourceMappingURL=audit-logs.controller.js.map