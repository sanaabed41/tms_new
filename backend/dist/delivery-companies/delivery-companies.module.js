"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryCompaniesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const delivery_company_entity_1 = require("./delivery-company.entity");
const delivery_companies_service_1 = require("./delivery-companies.service");
const delivery_companies_controller_1 = require("./delivery-companies.controller");
let DeliveryCompaniesModule = class DeliveryCompaniesModule {
};
exports.DeliveryCompaniesModule = DeliveryCompaniesModule;
exports.DeliveryCompaniesModule = DeliveryCompaniesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([delivery_company_entity_1.DeliveryCompany])],
        providers: [delivery_companies_service_1.DeliveryCompaniesService],
        controllers: [delivery_companies_controller_1.DeliveryCompaniesController],
        exports: [delivery_companies_service_1.DeliveryCompaniesService],
    })
], DeliveryCompaniesModule);
//# sourceMappingURL=delivery-companies.module.js.map