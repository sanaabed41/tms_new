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
const quai_entity_1 = require("./quais/quai.entity");
const role_enum_1 = require("./common/enums/role.enum");
const bcrypt = __importStar(require("bcryptjs"));
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, { logger: false });
    const companyRepo = app.get((0, typeorm_1.getRepositoryToken)(company_entity_1.Company));
    const userRepo = app.get((0, typeorm_1.getRepositoryToken)(user_entity_1.User));
    const societeRepo = app.get((0, typeorm_1.getRepositoryToken)(societe_expeditrice_entity_1.SocieteExpeditrice));
    const filiereRepo = app.get((0, typeorm_1.getRepositoryToken)(filiere_entity_1.Filiere));
    const quaiRepo = app.get((0, typeorm_1.getRepositoryToken)(quai_entity_1.Quai));
    let company = await companyRepo.findOne({ where: { nom: 'TransFood' } });
    if (!company) {
        console.log('❌  TransFood introuvable — lancez d\'abord npm run seed puis npm run seed:pb');
        await app.close();
        return;
    }
    console.log(`✅  Company: ${company.nom}`);
    const roseBlanche = await societeRepo.findOne({ where: { nom: 'Rose Blanche' } });
    if (!roseBlanche) {
        console.log('❌  "Rose Blanche" introuvable — lancez d\'abord npm run seed:pb');
        await app.close();
        return;
    }
    let filAMT = await filiereRepo.findOne({ where: { code: 'AMT' } });
    let filMCSR = await filiereRepo.findOne({ where: { code: 'MCSR' } });
    let filPW = await filiereRepo.findOne({ where: { code: 'PW' } });
    if (!filAMT) {
        filAMT = await filiereRepo.save(filiereRepo.create({ nom: 'Alimentation & Minoterie Tunisie', code: 'AMT', societeExpeditrice: { id: roseBlanche.id } }));
    }
    if (!filMCSR) {
        filMCSR = await filiereRepo.save(filiereRepo.create({ nom: 'Minoterie Centrale de Sfax et du Sahel', code: 'MCSR', societeExpeditrice: { id: roseBlanche.id } }));
    }
    if (!filPW) {
        filPW = await filiereRepo.save(filiereRepo.create({ nom: 'Pâtes et Whisky', code: 'PW', societeExpeditrice: { id: roseBlanche.id } }));
    }
    await filiereRepo.update(filAMT.id, { societeExpeditrice: { id: roseBlanche.id } });
    await filiereRepo.update(filMCSR.id, { societeExpeditrice: { id: roseBlanche.id } });
    await filiereRepo.update(filPW.id, { societeExpeditrice: { id: roseBlanche.id } });
    console.log(`✅  Rose Blanche filières: AMT=${!!filAMT} MCSR=${!!filMCSR} PW=${!!filPW}`);
    const dedicated = [
        { nom: 'QPW1', filiere: filPW },
        { nom: 'QPW2', filiere: filPW },
        { nom: 'QPW3', filiere: filPW },
        { nom: 'QAMT1', filiere: filAMT },
        { nom: 'QAMT2', filiere: filAMT },
        { nom: 'QAMT3', filiere: filAMT },
        { nom: 'QAMT4', filiere: filAMT },
        { nom: 'QMCSR1', filiere: filMCSR },
        { nom: 'QMCSR2', filiere: filMCSR },
        { nom: 'QMCSR3', filiere: filMCSR },
    ];
    for (const { nom, filiere } of dedicated) {
        const existing = await quaiRepo.findOne({ where: { nom, company: { id: company.id } } });
        if (!existing) {
            await quaiRepo.save(quaiRepo.create({
                nom,
                isActive: true,
                company: { id: company.id },
                societeExpeditrice: { id: roseBlanche.id },
                filiere: filiere ? { id: filiere.id } : null,
            }));
            console.log(`  ✚  Quai dédié créé: ${nom}`);
        }
        else {
            console.log(`  –  Quai dédié existant: ${nom}`);
        }
    }
    for (let i = 1; i <= 8; i++) {
        const nom = `Quai ${i}`;
        const existing = await quaiRepo.findOne({ where: { nom, company: { id: company.id } } });
        if (!existing) {
            await quaiRepo.save(quaiRepo.create({
                nom,
                isActive: true,
                company: { id: company.id },
                societeExpeditrice: null,
                filiere: null,
            }));
            console.log(`  ✚  Quai générique créé: ${nom}`);
        }
        else {
            console.log(`  –  Quai générique existant: ${nom}`);
        }
    }
    const hashed = await bcrypt.hash('Password123!', 10);
    const magasiniers = [
        {
            prenom: 'Magasinier',
            nom: '1',
            email: 'magasinier1@transfood.tn',
            filieres: [filAMT, filMCSR].filter(Boolean),
            label: 'AMT + MCSR',
        },
        {
            prenom: 'Magasinier',
            nom: '2',
            email: 'magasinier2@transfood.tn',
            filieres: [filPW].filter(Boolean),
            label: 'PW',
        },
    ];
    for (const m of magasiniers) {
        let user = await userRepo.findOne({ where: { email: m.email }, relations: ['filieres'] });
        if (!user) {
            user = userRepo.create({
                prenom: m.prenom,
                nom: m.nom,
                email: m.email,
                password: hashed,
                role: role_enum_1.Role.MAGASINIER,
                isActive: true,
                company: { id: company.id },
                filieres: m.filieres,
            });
            await userRepo.save(user);
            console.log(`  ✚  Magasinier créé: ${m.email} (${m.label})`);
        }
        else {
            user.filieres = m.filieres;
            await userRepo.save(user);
            console.log(`  ✓  Magasinier mis à jour: ${m.email} (${m.label})`);
        }
    }
    const securites = [
        {
            prenom: 'Sécurité',
            nom: '1',
            email: 'securite1@transfood.tn',
            filieres: [filAMT, filPW].filter(Boolean),
            label: 'AMT + PW',
        },
        {
            prenom: 'Sécurité',
            nom: '2',
            email: 'securite2@transfood.tn',
            filieres: [filMCSR].filter(Boolean),
            label: 'MCSR',
        },
    ];
    for (const s of securites) {
        let user = await userRepo.findOne({ where: { email: s.email }, relations: ['filieres'] });
        if (!user) {
            user = userRepo.create({
                prenom: s.prenom,
                nom: s.nom,
                email: s.email,
                password: hashed,
                role: role_enum_1.Role.SECURITE,
                isActive: true,
                company: { id: company.id },
                filieres: s.filieres,
            });
            await userRepo.save(user);
            console.log(`  ✚  Sécurité créé: ${s.email} (${s.label})`);
        }
        else {
            user.filieres = s.filieres;
            await userRepo.save(user);
            console.log(`  ✓  Sécurité mis à jour: ${s.email} (${s.label})`);
        }
    }
    const totalQuais = await quaiRepo.count({ where: { company: { id: company.id } } });
    console.log(`\n🎉  Seeder terminé — ${totalQuais} quais pour TransFood`);
    console.log(`\nComptes créés (mot de passe: Password123!) :`);
    console.log(`  magasiniers  : magasinier1@transfood.tn  |  magasinier2@transfood.tn`);
    console.log(`  sécurité     : securite1@transfood.tn    |  securite2@transfood.tn`);
    await app.close();
}
bootstrap().catch((e) => { console.error(e); process.exit(1); });
//# sourceMappingURL=seed-full.js.map