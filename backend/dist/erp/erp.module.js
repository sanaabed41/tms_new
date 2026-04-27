"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErpModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const article_entity_1 = require("../articles/article.entity");
const bon_livraison_entity_1 = require("../bons-livraison/bon-livraison.entity");
const bl_article_entity_1 = require("../bons-livraison/bl-article.entity");
const erp_service_1 = require("./erp.service");
const erp_controller_1 = require("./erp.controller");
let ErpModule = class ErpModule {
};
exports.ErpModule = ErpModule;
exports.ErpModule = ErpModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([article_entity_1.Article, bon_livraison_entity_1.BonLivraison, bl_article_entity_1.BlArticle])],
        providers: [erp_service_1.ErpService],
        controllers: [erp_controller_1.ErpController],
    })
], ErpModule);
//# sourceMappingURL=erp.module.js.map