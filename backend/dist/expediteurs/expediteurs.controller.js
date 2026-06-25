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
exports.ExpediteursController = void 0;
const common_1 = require("@nestjs/common");
const expediteurs_service_1 = require("./expediteurs.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const role_enum_1 = require("../common/enums/role.enum");
const swagger_1 = require("@nestjs/swagger");
let ExpediteursController = class ExpediteursController {
    service;
    constructor(service) {
        this.service = service;
    }
    findAll(user) {
        return this.service.findAll(user.companyId);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    create(dto, user) {
        return this.service.create(dto, user.companyId);
    }
    update(id, dto) {
        return this.service.update(id, dto);
    }
    remove(id) {
        return this.service.remove(id);
    }
    createFiliere(id, dto) {
        return this.service.createFiliere(id, dto);
    }
    updateFiliere(filiereId, dto) {
        return this.service.updateFiliere(filiereId, dto);
    }
    removeFiliere(filiereId) {
        return this.service.removeFiliere(filiereId);
    }
};
exports.ExpediteursController = ExpediteursController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.LOGISTIC_ADMIN, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ExpediteursController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.LOGISTIC_ADMIN, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExpediteursController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.LOGISTIC_ADMIN, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ExpediteursController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.LOGISTIC_ADMIN, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ExpediteursController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.LOGISTIC_ADMIN, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExpediteursController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/filieres'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.LOGISTIC_ADMIN, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ExpediteursController.prototype, "createFiliere", null);
__decorate([
    (0, common_1.Put)('filieres/:filiereId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.LOGISTIC_ADMIN, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('filiereId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ExpediteursController.prototype, "updateFiliere", null);
__decorate([
    (0, common_1.Delete)('filieres/:filiereId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.LOGISTIC_ADMIN, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('filiereId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExpediteursController.prototype, "removeFiliere", null);
exports.ExpediteursController = ExpediteursController = __decorate([
    (0, swagger_1.ApiTags)('Expéditeurs'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('expediteurs'),
    __metadata("design:paramtypes", [expediteurs_service_1.ExpediteursService])
], ExpediteursController);
//# sourceMappingURL=expediteurs.controller.js.map