"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TruckAvailabilityModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const truck_availability_entity_1 = require("./truck-availability.entity");
const truck_entity_1 = require("../trucks/truck.entity");
const truck_availability_service_1 = require("./truck-availability.service");
const truck_availability_controller_1 = require("./truck-availability.controller");
let TruckAvailabilityModule = class TruckAvailabilityModule {
};
exports.TruckAvailabilityModule = TruckAvailabilityModule;
exports.TruckAvailabilityModule = TruckAvailabilityModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([truck_availability_entity_1.TruckAvailability, truck_entity_1.Truck])],
        providers: [truck_availability_service_1.TruckAvailabilityService],
        controllers: [truck_availability_controller_1.TruckAvailabilityController],
    })
], TruckAvailabilityModule);
//# sourceMappingURL=truck-availability.module.js.map