"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvitationsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const invitation_entity_1 = require("./invitation.entity");
const user_entity_1 = require("../users/user.entity");
const filiere_entity_1 = require("../expediteurs/filiere.entity");
const delivery_company_entity_1 = require("../delivery-companies/delivery-company.entity");
const invitations_service_1 = require("./invitations.service");
const invitations_controller_1 = require("./invitations.controller");
let InvitationsModule = class InvitationsModule {
};
exports.InvitationsModule = InvitationsModule;
exports.InvitationsModule = InvitationsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([invitation_entity_1.Invitation, user_entity_1.User, filiere_entity_1.Filiere, delivery_company_entity_1.DeliveryCompany])],
        providers: [invitations_service_1.InvitationsService],
        controllers: [invitations_controller_1.InvitationsController],
        exports: [invitations_service_1.InvitationsService],
    })
], InvitationsModule);
//# sourceMappingURL=invitations.module.js.map