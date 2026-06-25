"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const typeorm_1 = require("@nestjs/typeorm");
const bcrypt = __importStar(require("bcryptjs"));
const company_entity_1 = require("./companies/company.entity");
const delivery_company_entity_1 = require("./delivery-companies/delivery-company.entity");
const truck_entity_1 = require("./trucks/truck.entity");
const user_entity_1 = require("./users/user.entity");
const role_enum_1 = require("./common/enums/role.enum");
async function seed() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, { logger: ['error'] });
    const companyRepo = app.get((0, typeorm_1.getRepositoryToken)(company_entity_1.Company));
    const deliveryCompanyRepo = app.get((0, typeorm_1.getRepositoryToken)(delivery_company_entity_1.DeliveryCompany));
    const truckRepo = app.get((0, typeorm_1.getRepositoryToken)(truck_entity_1.Truck));
    const userRepo = app.get((0, typeorm_1.getRepositoryToken)(user_entity_1.User));
    console.log('\n🚛  Seeder Admin Transport — démarrage...\n');
    const company = await companyRepo.findOne({ where: { nom: 'TransFood' } });
    if (!company) {
        console.error('❌  Société "TransFood" introuvable. Lance npm run seed en premier.');
        await app.close();
        process.exit(1);
    }
    console.log(`✅  Société logistique : ${company.nom}`);
    let deliveryCompany = await deliveryCompanyRepo.findOne({
        where: { nom: 'Rapid Fret SARL' },
    });
    if (deliveryCompany) {
        console.log(`ℹ️   Société de transport "Rapid Fret SARL" existe déjà — réutilisée.`);
    }
    else {
        deliveryCompany = await deliveryCompanyRepo.save(deliveryCompanyRepo.create({
            nom: 'Rapid Fret SARL',
            adresse: 'Zone Industrielle Ben Arous, Tunis',
            telephone: '+216 71 456 789',
            company: { id: company.id },
        }));
        console.log(`✅  Société de transport créée : ${deliveryCompany.nom}`);
    }
    const trucks = [
        { matricule: '100TUN01', capaciteTonnage: 10, capacitePalettes: 20, type: 'Plateau' },
        { matricule: '200TUN01', capaciteTonnage: 5, capacitePalettes: 10, type: 'Frigorifique' },
        { matricule: '300TUN01', capaciteTonnage: 20, capacitePalettes: 40, type: 'Semi-remorque' },
    ];
    let trucksCreated = 0;
    for (const t of trucks) {
        const exists = await truckRepo.findOne({ where: { matricule: t.matricule } });
        if (exists) {
            console.log(`ℹ️   Camion ${t.matricule} existe déjà — ignoré.`);
            continue;
        }
        await truckRepo.save(truckRepo.create({ ...t, deliveryCompany: { id: deliveryCompany.id } }));
        console.log(`✅  Camion créé : ${t.matricule} (${t.capaciteTonnage}T — ${t.type})`);
        trucksCreated++;
    }
    if (trucksCreated === 0)
        console.log('ℹ️   Tous les camions existent déjà.');
    const email = 'transport@tms.com';
    const existingUser = await userRepo.findOne({ where: { email } });
    if (existingUser) {
        console.log(`ℹ️   Compte ${email} existe déjà — ignoré.`);
    }
    else {
        const hashed = await bcrypt.hash('Transport123!', 10);
        await userRepo.save(userRepo.create({
            nom: 'Chaabane',
            prenom: 'Sami',
            email,
            password: hashed,
            role: role_enum_1.Role.TRANSPORT_ADMIN,
            isActive: true,
            company: { id: company.id },
            deliveryCompany: { id: deliveryCompany.id },
        }));
        console.log(`✅  Admin Transport créé : ${email}`);
    }
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║          ADMIN TRANSPORT — RÉSUMÉ           ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║  Email    : transport@tms.com               ║`);
    console.log(`║  Password : Transport123!                   ║`);
    console.log(`║  Société  : Rapid Fret SARL                 ║`);
    console.log(`║  Camions  : 3 (Plateau, Frigo, Semi)        ║`);
    console.log('╚══════════════════════════════════════════════╝\n');
    await app.close();
}
seed().catch((err) => {
    console.error('❌  Erreur :', err);
    process.exit(1);
});
//# sourceMappingURL=seed-transport-admin.js.map