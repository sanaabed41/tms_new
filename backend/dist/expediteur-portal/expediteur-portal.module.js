"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpediteursPortalModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const societe_expeditrice_entity_1 = require("../expediteurs/societe-expeditrice.entity");
const filiere_entity_1 = require("../expediteurs/filiere.entity");
const bon_livraison_entity_1 = require("../bons-livraison/bon-livraison.entity");
const user_entity_1 = require("../users/user.entity");
const quai_entity_1 = require("../quais/quai.entity");
const loading_plan_entity_1 = require("../loading-plans/loading-plan.entity");
const company_entity_1 = require("../companies/company.entity");
const invitation_entity_1 = require("../invitations/invitation.entity");
const expediteur_portal_service_1 = require("./expediteur-portal.service");
const expediteur_portal_controller_1 = require("./expediteur-portal.controller");
let ExpediteursPortalModule = class ExpediteursPortalModule {
};
exports.ExpediteursPortalModule = ExpediteursPortalModule;
exports.ExpediteursPortalModule = ExpediteursPortalModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([societe_expeditrice_entity_1.SocieteExpeditrice, filiere_entity_1.Filiere, bon_livraison_entity_1.BonLivraison, user_entity_1.User, quai_entity_1.Quai, loading_plan_entity_1.LoadingPlan, company_entity_1.Company, invitation_entity_1.Invitation])],
        providers: [expediteur_portal_service_1.ExpediteursPortalService],
        controllers: [expediteur_portal_controller_1.ExpediteursPortalController],
    })
], ExpediteursPortalModule);
//# sourceMappingURL=expediteur-portal.module.js.map