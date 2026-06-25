"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuaisModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const quai_entity_1 = require("./quai.entity");
const quais_service_1 = require("./quais.service");
const quais_controller_1 = require("./quais.controller");
let QuaisModule = class QuaisModule {
};
exports.QuaisModule = QuaisModule;
exports.QuaisModule = QuaisModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([quai_entity_1.Quai])],
        providers: [quais_service_1.QuaisService],
        controllers: [quais_controller_1.QuaisController],
        exports: [quais_service_1.QuaisService],
    })
], QuaisModule);
//# sourceMappingURL=quais.module.js.map