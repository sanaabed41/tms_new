"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadingPlansModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const loading_plan_entity_1 = require("./loading-plan.entity");
const bon_livraison_entity_1 = require("../bons-livraison/bon-livraison.entity");
const truck_entity_1 = require("../trucks/truck.entity");
const loading_plans_service_1 = require("./loading-plans.service");
const loading_plans_controller_1 = require("./loading-plans.controller");
let LoadingPlansModule = class LoadingPlansModule {
};
exports.LoadingPlansModule = LoadingPlansModule;
exports.LoadingPlansModule = LoadingPlansModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([loading_plan_entity_1.LoadingPlan, bon_livraison_entity_1.BonLivraison, truck_entity_1.Truck])],
        providers: [loading_plans_service_1.LoadingPlansService],
        controllers: [loading_plans_controller_1.LoadingPlansController],
        exports: [loading_plans_service_1.LoadingPlansService],
    })
], LoadingPlansModule);
//# sourceMappingURL=loading-plans.module.js.map