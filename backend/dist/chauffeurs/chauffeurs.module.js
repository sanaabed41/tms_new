"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChauffeursModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const chauffeur_entity_1 = require("./chauffeur.entity");
const chauffeurs_service_1 = require("./chauffeurs.service");
const chauffeurs_controller_1 = require("./chauffeurs.controller");
let ChauffeursModule = class ChauffeursModule {
};
exports.ChauffeursModule = ChauffeursModule;
exports.ChauffeursModule = ChauffeursModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([chauffeur_entity_1.Chauffeur])],
        providers: [chauffeurs_service_1.ChauffeursService],
        controllers: [chauffeurs_controller_1.ChauffeursController],
        exports: [chauffeurs_service_1.ChauffeursService],
    })
], ChauffeursModule);
//# sourceMappingURL=chauffeurs.module.js.map