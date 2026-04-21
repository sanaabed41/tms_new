"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BonsLivraisonModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const bon_livraison_entity_1 = require("./bon-livraison.entity");
const bl_article_entity_1 = require("./bl-article.entity");
const bons_livraison_service_1 = require("./bons-livraison.service");
const bons_livraison_controller_1 = require("./bons-livraison.controller");
let BonsLivraisonModule = class BonsLivraisonModule {
};
exports.BonsLivraisonModule = BonsLivraisonModule;
exports.BonsLivraisonModule = BonsLivraisonModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([bon_livraison_entity_1.BonLivraison, bl_article_entity_1.BlArticle])],
        providers: [bons_livraison_service_1.BonsLivraisonService],
        controllers: [bons_livraison_controller_1.BonsLivraisonController],
        exports: [bons_livraison_service_1.BonsLivraisonService],
    })
], BonsLivraisonModule);
//# sourceMappingURL=bons-livraison.module.js.map