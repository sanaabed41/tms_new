"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransportPortalModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const transport_portal_controller_1 = require("./transport-portal.controller");
const transport_portal_service_1 = require("./transport-portal.service");
const transport_declaration_entity_1 = require("./transport-declaration.entity");
const truck_entity_1 = require("../trucks/truck.entity");
let TransportPortalModule = class TransportPortalModule {
};
exports.TransportPortalModule = TransportPortalModule;
exports.TransportPortalModule = TransportPortalModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([transport_declaration_entity_1.TransportDeclaration, truck_entity_1.Truck])],
        controllers: [transport_portal_controller_1.TransportPortalController],
        providers: [transport_portal_service_1.TransportPortalService],
    })
], TransportPortalModule);
//# sourceMappingURL=transport-portal.module.js.map