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
const company_entity_1 = require("./companies/company.entity");
const user_entity_1 = require("./users/user.entity");
const societe_expeditrice_entity_1 = require("./expediteurs/societe-expeditrice.entity");
const filiere_entity_1 = require("./expediteurs/filiere.entity");
const role_enum_1 = require("./common/enums/role.enum");
const company_type_enum_1 = require("./common/enums/company-type.enum");
const bcrypt = __importStar(require("bcryptjs"));
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, { logger: false });
    const companyRepo = app.get((0, typeorm_1.getRepositoryToken)(company_entity_1.Company));
    const userRepo = app.get((0, typeorm_1.getRepositoryToken)(user_entity_1.User));
    const societeRepo = app.get((0, typeorm_1.getRepositoryToken)(societe_expeditrice_entity_1.SocieteExpeditrice));
    const filiereRepo = app.get((0, typeorm_1.getRepositoryToken)(filiere_entity_1.Filiere));
    const transfood = await companyRepo.findOne({
        where: { nom: 'TransFood' },
    });
    if (!transfood) {
        console.log('❌  TransFood introuvable — lancez d\'abord : npm run seed && npm run seed:pb');
        await app.close();
        return;
    }
    console.log(`✅  Société logistique : ${transfood.nom}`);
    const roseBlanche = await societeRepo.findOne({
        where: { nom: 'Rose Blanche' },
        relations: ['filieres'],
    });
    if (!roseBlanche) {
        console.log('❌  "Rose Blanche" introuvable — lancez d\'abord npm run seed:pb');
        await app.close();
        return;
    }
    console.log(`✅  Société expéditrice : ${roseBlanche.nom} (${roseBlanche.filieres.length} filières)`);
    const filAMT = roseBlanche.filieres.find((f) => f.code === 'AMT')
        ?? await filiereRepo.findOne({ where: { code: 'AMT' } });
    const filMCSR = roseBlanche.filieres.find((f) => f.code === 'MCSR')
        ?? await filiereRepo.findOne({ where: { code: 'MCSR' } });
    const filPW = roseBlanche.filieres.find((f) => f.code === 'PW')
        ?? await filiereRepo.findOne({ where: { code: 'PW' } });
    if (!filAMT || !filMCSR || !filPW) {
        console.log('❌  Filières AMT/MCSR/PW introuvables — lancez npm run seed:full');
        await app.close();
        return;
    }
    console.log(`✅  Filières : AMT ✓  MCSR ✓  PW ✓`);
    let rbPortail = await companyRepo.findOne({
        where: { nom: 'Rose Blanche Portail' },
    });
    if (!rbPortail) {
        rbPortail = await companyRepo.save(companyRepo.create({
            nom: 'Rose Blanche Portail',
            type: company_type_enum_1.CompanyType.EXPEDITEUR,
            code: 'RB',
            couleur: '#d4380d',
            isActive: true,
        }));
        console.log(`  ✚  Company EXPEDITEUR créée : ${rbPortail.nom}`);
    }
    else {
        await companyRepo.update(rbPortail.id, {
            type: company_type_enum_1.CompanyType.EXPEDITEUR,
            code: 'RB',
            couleur: '#d4380d',
        });
        console.log(`  ✓  Company EXPEDITEUR existante : ${rbPortail.nom}`);
    }
    if (roseBlanche.expediteurCompany?.id !== rbPortail.id) {
        await societeRepo.update(roseBlanche.id, { expediteurCompany: { id: rbPortail.id } });
        console.log(`  ✚  Lien SocieteExpeditrice → expediteurCompanyétabli`);
    }
    else {
        console.log(`  ✓  Lien SocieteExpeditrice → expediteurCompany déjàétabli`);
    }
    await companyRepo.update(rbPortail.id, { logistiqueCompany: { id: transfood.id } });
    console.log(`  ✓  Rose Blanche Portail → TransFood`);
    const hashed = await bcrypt.hash('Password123!', 10);
    const accounts = [
        {
            prenom: 'Admin', nom: 'Rose Blanche',
            email: 'admin@roseblanche.tn',
            role: role_enum_1.Role.EXPEDITEUR_ADMIN,
            filieres: [],
            label: 'EXPEDITEUR_ADMIN',
        },
        {
            prenom: 'Magasinier', nom: 'RB1',
            email: 'magasinier.rb1@roseblanche.tn',
            role: role_enum_1.Role.MAGASINIER,
            filieres: [filAMT, filMCSR],
            label: 'MAGASINIER (AMT + MCSR)',
        },
        {
            prenom: 'Magasinier', nom: 'RB2',
            email: 'magasinier.rb2@roseblanche.tn',
            role: role_enum_1.Role.MAGASINIER,
            filieres: [filPW],
            label: 'MAGASINIER (PW)',
        },
        {
            prenom: 'Sécurité', nom: 'RB1',
            email: 'securite.rb1@roseblanche.tn',
            role: role_enum_1.Role.SECURITE,
            filieres: [filAMT, filPW],
            label: 'SECURITE (AMT + PW)',
        },
        {
            prenom: 'Sécurité', nom: 'RB2',
            email: 'securite.rb2@roseblanche.tn',
            role: role_enum_1.Role.SECURITE,
            filieres: [filMCSR],
            label: 'SECURITE (MCSR)',
        },
        {
            prenom: 'Admin', nom: 'FiliereTest',
            email: 'filiere.admin@roseblanche.tn',
            role: role_enum_1.Role.FILIERE_ADMIN,
            filieres: [filAMT],
            label: 'FILIERE_ADMIN (AMT)',
        },
    ];
    for (const acc of accounts) {
        let user = await userRepo.findOne({ where: { email: acc.email }, relations: ['filieres'] });
        if (!user) {
            user = userRepo.create({
                prenom: acc.prenom,
                nom: acc.nom,
                email: acc.email,
                password: hashed,
                role: acc.role,
                isActive: true,
                company: { id: rbPortail.id },
                filieres: acc.filieres,
            });
            await userRepo.save(user);
            console.log(`  ✚  ${acc.label} créé : ${acc.email}`);
        }
        else {
            user.filieres = acc.filieres;
            await userRepo.save(user);
            console.log(`  ✓  ${acc.label} mis à jour : ${acc.email}`);
        }
    }
    console.log(`\n🎉  Seeder expéditeur terminé — portail Rose Blanche opérationnel`);
    console.log(`\nComptes (mot de passe : Password123!) :`);
    console.log(`  EXPEDITEUR_ADMIN : admin@roseblanche.tn`);
    console.log(`  FILIERE_ADMIN    : filiere.admin@roseblanche.tn  (AMT)`);
    console.log(`  MAGASINIER       : magasinier.rb1@roseblanche.tn  |  magasinier.rb2@roseblanche.tn`);
    console.log(`  SECURITE         : securite.rb1@roseblanche.tn    |  securite.rb2@roseblanche.tn`);
    await app.close();
}
bootstrap().catch((e) => { console.error(e); process.exit(1); });
//# sourceMappingURL=seed-expediteur.js.map