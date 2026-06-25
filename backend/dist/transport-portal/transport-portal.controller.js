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
exports.TransportPortalController = void 0;
const common_1 = require("@nestjs/common");
const transport_portal_service_1 = require("./transport-portal.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const role_enum_1 = require("../common/enums/role.enum");
let TransportPortalController = class TransportPortalController {
    service;
    constructor(service) {
        this.service = service;
    }
    getMyFleet(user) {
        if (!user.deliveryCompanyId)
            return [];
        return this.service.getMyFleet(user.deliveryCompanyId);
    }
    createTruck(user, dto) {
        if (!user.deliveryCompanyId)
            return { error: 'No delivery company assigned' };
        return this.service.createTruck(dto, user.deliveryCompanyId, user.companyId, user.sub);
    }
    updateTruck(user, id, dto) {
        return this.service.updateTruck(id, dto, user.deliveryCompanyId, user.companyId, user.sub);
    }
    removeTruck(user, id) {
        return this.service.removeTruck(id, user.deliveryCompanyId);
    }
    getDeclarations(user, dateFrom, dateTo) {
        return this.service.getDeclarationsForLogistique(user.companyId, dateFrom, dateTo);
    }
};
exports.TransportPortalController = TransportPortalController;
__decorate([
    (0, common_1.Get)('fleet'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.TRANSPORT_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TransportPortalController.prototype, "getMyFleet", null);
__decorate([
    (0, common_1.Post)('trucks'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.TRANSPORT_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TransportPortalController.prototype, "createTruck", null);
__decorate([
    (0, common_1.Put)('trucks/:id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.TRANSPORT_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], TransportPortalController.prototype, "updateTruck", null);
__decorate([
    (0, common_1.Delete)('trucks/:id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.TRANSPORT_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TransportPortalController.prototype, "removeTruck", null);
__decorate([
    (0, common_1.Get)('declarations'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.LOGISTIC_ADMIN, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('dateFrom')),
    __param(2, (0, common_1.Query)('dateTo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], TransportPortalController.prototype, "getDeclarations", null);
exports.TransportPortalController = TransportPortalController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('transport-portal'),
    __metadata("design:paramtypes", [transport_portal_service_1.TransportPortalService])
], TransportPortalController);
//# sourceMappingURL=transport-portal.controller.js.map