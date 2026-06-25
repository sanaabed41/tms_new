"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcryptjs"));
const user_entity_1 = require("./user.entity");
const role_enum_1 = require("../common/enums/role.enum");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
const filiere_entity_1 = require("../expediteurs/filiere.entity");
let UsersService = class UsersService {
    repo;
    filiereRepo;
    auditLogs;
    constructor(repo, filiereRepo, auditLogs) {
        this.repo = repo;
        this.filiereRepo = filiereRepo;
        this.auditLogs = auditLogs;
    }
    findAll(companyId) {
        if (companyId) {
            return this.repo.find({ where: { company: { id: companyId } }, relations: ['company', 'filieres', 'filieres.societeExpeditrice', 'deliveryCompany'] });
        }
        return this.repo.find({ relations: ['company', 'filieres', 'filieres.societeExpeditrice', 'deliveryCompany'] });
    }
    async findOne(id) {
        const user = await this.repo.findOne({ where: { id }, relations: ['company', 'filieres', 'filieres.societeExpeditrice'] });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async setFilieres(userId, filiereIds) {
        const user = await this.repo.findOne({ where: { id: userId }, relations: ['filieres'] });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        user.filieres = filiereIds.length > 0
            ? await this.filiereRepo.findBy({ id: (0, typeorm_2.In)(filiereIds) })
            : [];
        return this.repo.save(user);
    }
    findByEmail(email) {
        return this.repo.findOne({ where: { email }, relations: ['company', 'deliveryCompany'] });
    }
    async create(dto, createdBy) {
        if (createdBy.role === role_enum_1.Role.LOGISTIC_ADMIN && dto.companyId !== createdBy.company?.id) {
            throw new common_1.ForbiddenException('Cannot create user for another company');
        }
        const hashed = await bcrypt.hash(dto.password, 10);
        const user = this.repo.create({ ...dto, password: hashed, company: { id: dto.companyId } });
        const saved = await this.repo.save(user);
        await this.auditLogs.log({
            action: 'USER_CREATED',
            actorId: createdBy.id,
            actorEmail: createdBy.email,
            actorRole: createdBy.role,
            targetId: saved.id,
            targetEmail: saved.email,
            companyId: dto.companyId,
            metadata: { role: dto.role },
        });
        return saved;
    }
    async update(id, dto, caller) {
        const target = await this.findOne(id);
        if (caller.role === role_enum_1.Role.LOGISTIC_ADMIN && target.company?.id !== caller.companyId) {
            throw new common_1.ForbiddenException('Accès interdit');
        }
        if (dto.role === role_enum_1.Role.SUPER_ADMIN && caller.role !== role_enum_1.Role.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Vous ne pouvez pas attribuer ce rôle');
        }
        if (dto.password)
            dto.password = await bcrypt.hash(dto.password, 10);
        await this.repo.update(id, dto);
        return this.findOne(id);
    }
    async toggleActive(id, actor) {
        const user = await this.findOne(id);
        const newState = !user.isActive;
        await this.repo.update(id, { isActive: newState });
        await this.auditLogs.log({
            action: newState ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
            actorId: actor?.id,
            actorEmail: actor?.email,
            actorRole: actor?.role,
            targetId: user.id,
            targetEmail: user.email,
            companyId: user.company?.id,
            companyNom: user.company?.nom,
        });
        return this.findOne(id);
    }
    async remove(id, caller) {
        const target = await this.findOne(id);
        if (caller.role === role_enum_1.Role.LOGISTIC_ADMIN && target.company?.id !== caller.companyId) {
            throw new common_1.ForbiddenException('Accès interdit');
        }
        if (target.role === role_enum_1.Role.SUPER_ADMIN && caller.role !== role_enum_1.Role.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Accès interdit');
        }
        await this.auditLogs.log({
            action: 'USER_DELETED',
            actorId: caller.id,
            actorEmail: caller.email,
            actorRole: caller.role,
            targetId: target.id,
            targetEmail: target.email,
            companyId: target.company?.id,
            companyNom: target.company?.nom,
        });
        return this.repo.remove(target);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(filiere_entity_1.Filiere)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        audit_logs_service_1.AuditLogsService])
], UsersService);
//# sourceMappingURL=users.service.js.map