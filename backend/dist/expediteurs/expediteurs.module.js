"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpediteursModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const societe_expeditrice_entity_1 = require("./societe-expeditrice.entity");
const filiere_entity_1 = require("./filiere.entity");
const expediteurs_service_1 = require("./expediteurs.service");
const expediteurs_controller_1 = require("./expediteurs.controller");
let ExpediteursModule = class ExpediteursModule {
};
exports.ExpediteursModule = ExpediteursModule;
exports.ExpediteursModule = ExpediteursModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([societe_expeditrice_entity_1.SocieteExpeditrice, filiere_entity_1.Filiere])],
        providers: [expediteurs_service_1.ExpediteursService],
        controllers: [expediteurs_controller_1.ExpediteursController],
        exports: [expediteurs_service_1.ExpediteursService],
    })
], ExpediteursModule);
//# sourceMappingURL=expediteurs.module.js.map