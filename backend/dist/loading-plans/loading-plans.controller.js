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
exports.LoadingPlansController = void 0;
const common_1 = require("@nestjs/common");
const loading_plans_service_1 = require("./loading-plans.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const role_enum_1 = require("../common/enums/role.enum");
const swagger_1 = require("@nestjs/swagger");
let LoadingPlansController = class LoadingPlansController {
    service;
    constructor(service) {
        this.service = service;
    }
    findAll(user, date) {
        return this.service.findAll(user.companyId, date);
    }
    findOne(id) { return this.service.findOne(id); }
    create(dto) { return this.service.create(dto); }
    assignBl(id, blId, user, force) {
        return this.service.assignBl(id, blId, user.id, force);
    }
    validateAll(user, date) {
        return this.service.validateAll(user.companyId, date, user.id);
    }
    removeBl(id, blId) {
        return this.service.removeBl(id, blId);
    }
    validate(id, user) {
        return this.service.validate(id, user.id);
    }
    remove(id) { return this.service.remove(id); }
};
exports.LoadingPlansController = LoadingPlansController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.COMPANY_ADMIN, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LoadingPlansController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.COMPANY_ADMIN, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LoadingPlansController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.COMPANY_ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LoadingPlansController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/assign-bl'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.COMPANY_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('blId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Query)('force', new common_1.DefaultValuePipe(false), common_1.ParseBoolPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Boolean]),
    __metadata("design:returntype", void 0)
], LoadingPlansController.prototype, "assignBl", null);
__decorate([
    (0, common_1.Put)('validate-all'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.COMPANY_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LoadingPlansController.prototype, "validateAll", null);
__decorate([
    (0, common_1.Delete)(':id/remove-bl/:blId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.COMPANY_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('blId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], LoadingPlansController.prototype, "removeBl", null);
__decorate([
    (0, common_1.Put)(':id/validate'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.COMPANY_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LoadingPlansController.prototype, "validate", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.COMPANY_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LoadingPlansController.prototype, "remove", null);
exports.LoadingPlansController = LoadingPlansController = __decorate([
    (0, swagger_1.ApiTags)('Loading Plans'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('loading-plans'),
    __metadata("design:paramtypes", [loading_plans_service_1.LoadingPlansService])
], LoadingPlansController);
//# sourceMappingURL=loading-plans.controller.js.map