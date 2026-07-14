"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("./auth/auth.module");
const companies_module_1 = require("./companies/companies.module");
const users_module_1 = require("./users/users.module");
const delivery_companies_module_1 = require("./delivery-companies/delivery-companies.module");
const trucks_module_1 = require("./trucks/trucks.module");
const articles_module_1 = require("./articles/articles.module");
const bons_livraison_module_1 = require("./bons-livraison/bons-livraison.module");
const loading_plans_module_1 = require("./loading-plans/loading-plans.module");
const invitations_module_1 = require("./invitations/invitations.module");
const mail_module_1 = require("./mail/mail.module");
const expediteurs_module_1 = require("./expediteurs/expediteurs.module");
const truck_availability_module_1 = require("./truck-availability/truck-availability.module");
const erp_module_1 = require("./erp/erp.module");
const audit_logs_module_1 = require("./audit-logs/audit-logs.module");
const quais_module_1 = require("./quais/quais.module");
const expediteur_portal_module_1 = require("./expediteur-portal/expediteur-portal.module");
const chauffeurs_module_1 = require("./chauffeurs/chauffeurs.module");
const transport_portal_module_1 = require("./transport-portal/transport-portal.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    const url = config.get('DATABASE_URL');
                    if (url) {
                        return {
                            type: 'postgres',
                            url,
                            entities: [__dirname + '/**/*.entity{.ts,.js}'],
                            synchronize: true,
                            logging: false,
                            ssl: { rejectUnauthorized: false },
                        };
                    }
                    return {
                        type: 'postgres',
                        host: config.get('DB_HOST'),
                        port: +config.get('DB_PORT'),
                        username: config.get('DB_USERNAME'),
                        password: config.get('DB_PASSWORD'),
                        database: config.get('DB_NAME'),
                        entities: [__dirname + '/**/*.entity{.ts,.js}'],
                        synchronize: true,
                        logging: false,
                    };
                },
            }),
            mail_module_1.MailModule,
            auth_module_1.AuthModule,
            companies_module_1.CompaniesModule,
            users_module_1.UsersModule,
            delivery_companies_module_1.DeliveryCompaniesModule,
            trucks_module_1.TrucksModule,
            articles_module_1.ArticlesModule,
            bons_livraison_module_1.BonsLivraisonModule,
            loading_plans_module_1.LoadingPlansModule,
            invitations_module_1.InvitationsModule,
            expediteurs_module_1.ExpediteursModule,
            truck_availability_module_1.TruckAvailabilityModule,
            erp_module_1.ErpModule,
            audit_logs_module_1.AuditLogsModule,
            quais_module_1.QuaisModule,
            expediteur_portal_module_1.ExpediteursPortalModule,
            chauffeurs_module_1.ChauffeursModule,
            transport_portal_module_1.TransportPortalModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map