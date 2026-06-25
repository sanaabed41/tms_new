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
exports.ExpediteursPortalController = void 0;
const common_1 = require("@nestjs/common");
const expediteur_portal_service_1 = require("./expediteur-portal.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const role_enum_1 = require("../common/enums/role.enum");
const swagger_1 = require("@nestjs/swagger");
let ExpediteursPortalController = class ExpediteursPortalController {
    service;
    constructor(service) {
        this.service = service;
    }
    dashboard(user) {
        return this.service.getDashboard(user.companyId);
    }
    getMySociete(user) {
        return this.service.getMySociete(user.companyId);
    }
    updateMySociete(user, dto) {
        return this.service.updateMySociete(user.companyId, dto);
    }
    getMagasinierDashboard(user) {
        return this.service.getMagasinierDashboard(user.companyId, user.sub);
    }
    getMyPlanning(user, date) {
        if (user.role === role_enum_1.Role.FILIERE_ADMIN ||
            user.role === role_enum_1.Role.MAGASINIER ||
            user.role === role_enum_1.Role.SECURITE) {
            return this.service.getValidatedPlansForFiliere(user.companyId, user.sub, date);
        }
        return this.service.getMyValidatedPlans(user.companyId, date);
    }
    getMyProfile(user) {
        return this.service.getMyProfile(user.sub);
    }
    updateMyProfile(user, dto) {
        return this.service.updateMyProfile(user.sub, dto);
    }
    getMyBls(user, date) {
        if (user.role === role_enum_1.Role.FILIERE_ADMIN || user.role === role_enum_1.Role.MAGASINIER) {
            return this.service.getMyBlsForFiliere(user.companyId, user.sub, date);
        }
        return this.service.getMyBls(user.companyId, date);
    }
    getMyUsers(user) {
        if (user.role === role_enum_1.Role.FILIERE_ADMIN) {
            return this.service.getMyUsersForFiliere(user.companyId, user.sub);
        }
        return this.service.getMyUsers(user.companyId);
    }
    toggleUserActive(user, id) {
        return this.service.toggleUserActive(user.companyId, user.sub, id, user.role);
    }
    deleteUser(user, id) {
        return this.service.deleteWorker(user.companyId, user.sub, id, user.role);
    }
    getMyQuais(user) {
        if (user.role === role_enum_1.Role.MAGASINIER || user.role === role_enum_1.Role.SECURITE) {
            return this.service.getMyQuaisForFiliere(user.sub);
        }
        return this.service.getMyQuais(user.companyId);
    }
    getMyLogistique(user) {
        return this.service.getMyLogistique(user.companyId);
    }
    setupLogistique(user, dto) {
        return this.service.setupLogistique(user.companyId, dto);
    }
    resendLogistiqueInvitation(user) {
        return this.service.resendLogistiqueInvitation(user.companyId);
    }
    createFiliere(user, dto) {
        return this.service.createFiliere(user.companyId, dto);
    }
    updateFiliere(user, id, dto) {
        return this.service.updateFiliere(user.companyId, id, dto);
    }
    deleteFiliere(user, id) {
        return this.service.deleteFiliere(user.companyId, id);
    }
    createQuai(user, dto) {
        if (user.role === role_enum_1.Role.FILIERE_ADMIN) {
            return this.service.createQuaiForFiliere(user.sub, dto);
        }
        return this.service.createQuai(user.companyId, dto);
    }
    updateQuai(user, id, dto) {
        if (user.role === role_enum_1.Role.FILIERE_ADMIN) {
            return this.service.updateQuaiForFiliere(user.sub, id, dto);
        }
        if (user.role === role_enum_1.Role.MAGASINIER) {
            return this.service.updateQuaiForFiliere(user.sub, id, {});
        }
        return this.service.updateQuai(user.companyId, id, dto);
    }
    deleteQuai(user, id) {
        if (user.role === role_enum_1.Role.FILIERE_ADMIN) {
            return this.service.deleteQuaiForFiliere(user.sub, id);
        }
        return this.service.deleteQuai(user.companyId, id);
    }
};
exports.ExpediteursPortalController = ExpediteursPortalController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ExpediteursPortalController.prototype, "dashboard", null);
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ExpediteursPortalController.prototype, "getMySociete", null);
__decorate([
    (0, common_1.Put)('me'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EXPEDITEUR_ADMIN, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ExpediteursPortalController.prototype, "updateMySociete", null);
__decorate([
    (0, common_1.Get)('magasin/dashboard'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.MAGASINIER, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ExpediteursPortalController.prototype, "getMagasinierDashboard", null);
__decorate([
    (0, common_1.Get)('planning'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EXPEDITEUR_ADMIN, role_enum_1.Role.FILIERE_ADMIN, role_enum_1.Role.MAGASINIER, role_enum_1.Role.SECURITE, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ExpediteursPortalController.prototype, "getMyPlanning", null);
__decorate([
    (0, common_1.Get)('profile'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.FILIERE_ADMIN, role_enum_1.Role.MAGASINIER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ExpediteursPortalController.prototype, "getMyProfile", null);
__decorate([
    (0, common_1.Put)('profile'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.FILIERE_ADMIN, role_enum_1.Role.MAGASINIER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ExpediteursPortalController.prototype, "updateMyProfile", null);
__decorate([
    (0, common_1.Get)('bls'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EXPEDITEUR_ADMIN, role_enum_1.Role.FILIERE_ADMIN, role_enum_1.Role.MAGASINIER, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ExpediteursPortalController.prototype, "getMyBls", null);
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ExpediteursPortalController.prototype, "getMyUsers", null);
__decorate([
    (0, common_1.Patch)('users/:id/toggle-active'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EXPEDITEUR_ADMIN, role_enum_1.Role.FILIERE_ADMIN, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ExpediteursPortalController.prototype, "toggleUserActive", null);
__decorate([
    (0, common_1.Delete)('users/:id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EXPEDITEUR_ADMIN, role_enum_1.Role.FILIERE_ADMIN, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ExpediteursPortalController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.Get)('quais'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EXPEDITEUR_ADMIN, role_enum_1.Role.FILIERE_ADMIN, role_enum_1.Role.MAGASINIER, role_enum_1.Role.SECURITE, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ExpediteursPortalController.prototype, "getMyQuais", null);
__decorate([
    (0, common_1.Get)('logistique'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EXPEDITEUR_ADMIN, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ExpediteursPortalController.prototype, "getMyLogistique", null);
__decorate([
    (0, common_1.Post)('logistique'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EXPEDITEUR_ADMIN, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ExpediteursPortalController.prototype, "setupLogistique", null);
__decorate([
    (0, common_1.Post)('logistique/resend-invitation'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EXPEDITEUR_ADMIN, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ExpediteursPortalController.prototype, "resendLogistiqueInvitation", null);
__decorate([
    (0, common_1.Post)('filieres'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EXPEDITEUR_ADMIN, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ExpediteursPortalController.prototype, "createFiliere", null);
__decorate([
    (0, common_1.Put)('filieres/:id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EXPEDITEUR_ADMIN, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ExpediteursPortalController.prototype, "updateFiliere", null);
__decorate([
    (0, common_1.Delete)('filieres/:id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EXPEDITEUR_ADMIN, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ExpediteursPortalController.prototype, "deleteFiliere", null);
__decorate([
    (0, common_1.Post)('quais'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EXPEDITEUR_ADMIN, role_enum_1.Role.FILIERE_ADMIN, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ExpediteursPortalController.prototype, "createQuai", null);
__decorate([
    (0, common_1.Put)('quais/:id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EXPEDITEUR_ADMIN, role_enum_1.Role.FILIERE_ADMIN, role_enum_1.Role.MAGASINIER, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ExpediteursPortalController.prototype, "updateQuai", null);
__decorate([
    (0, common_1.Delete)('quais/:id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EXPEDITEUR_ADMIN, role_enum_1.Role.FILIERE_ADMIN, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ExpediteursPortalController.prototype, "deleteQuai", null);
exports.ExpediteursPortalController = ExpediteursPortalController = __decorate([
    (0, swagger_1.ApiTags)('Portail Expéditeur'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EXPEDITEUR_ADMIN, role_enum_1.Role.FILIERE_ADMIN, role_enum_1.Role.SUPER_ADMIN),
    (0, common_1.Controller)('expediteur-portal'),
    __metadata("design:paramtypes", [expediteur_portal_service_1.ExpediteursPortalService])
], ExpediteursPortalController);
//# sourceMappingURL=expediteur-portal.controller.js.map