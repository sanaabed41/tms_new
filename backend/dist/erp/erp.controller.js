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
exports.ErpController = void 0;
const common_1 = require("@nestjs/common");
const erp_service_1 = require("./erp.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const role_enum_1 = require("../common/enums/role.enum");
const swagger_1 = require("@nestjs/swagger");
let ErpController = class ErpController {
    service;
    constructor(service) {
        this.service = service;
    }
    upsertArticles(body) {
        return this.service.upsertArticles(body.articles);
    }
    upsertBons(user, body) {
        return this.service.upsertBons(user.companyId, body.bons);
    }
};
exports.ErpController = ErpController;
__decorate([
    (0, common_1.Post)('articles'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.COMPANY_ADMIN, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ErpController.prototype, "upsertArticles", null);
__decorate([
    (0, common_1.Post)('bons-livraison'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.COMPANY_ADMIN, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ErpController.prototype, "upsertBons", null);
exports.ErpController = ErpController = __decorate([
    (0, swagger_1.ApiTags)('ERP Integration'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('erp'),
    __metadata("design:paramtypes", [erp_service_1.ErpService])
], ErpController);
//# sourceMappingURL=erp.controller.js.map