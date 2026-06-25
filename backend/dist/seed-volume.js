"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const typeorm_1 = require("@nestjs/typeorm");
const company_entity_1 = require("./companies/company.entity");
const societe_expeditrice_entity_1 = require("./expediteurs/societe-expeditrice.entity");
const filiere_entity_1 = require("./expediteurs/filiere.entity");
const user_entity_1 = require("./users/user.entity");
const bon_livraison_entity_1 = require("./bons-livraison/bon-livraison.entity");
const loading_plan_entity_1 = require("./loading-plans/loading-plan.entity");
const delivery_company_entity_1 = require("./delivery-companies/delivery-company.entity");
const truck_entity_1 = require("./trucks/truck.entity");
const bl_status_enum_1 = require("./common/enums/bl-status.enum");
async function upsert(repo, where, data) {
    const existing = await repo.findOne({ where: where });
    if (existing) {
        Object.assign(existing, data);
        return repo.save(existing);
    }
    return repo.save(repo.create({ ...where, ...data }));
}
function d(offsetDays) {
    const dt = new Date();
    dt.setDate(dt.getDate() + offsetDays);
    return dt.toISOString().split('T')[0];
}
const CLIENTS = [
    'SAPD Distribution', 'Grande Distribution Sud', 'Société Nabeulienne',
    'Maghrébine Aliments', 'Distributeur Côtier', 'Monastir Trade',
    'Kairouan Distribution', 'Sud Alimentaire', 'Béja Négoce',
    'Cotupha', 'Tunisie Agro-Aliments', 'Sfax Commerce',
    'Sahel Distribution', 'Cap Nord Négoce', 'Medina Markets',
];
const DESTINATIONS = [
    'Tunis', 'Sfax', 'Sousse', 'Bizerte', 'Nabeul', 'Monastir',
    'Kairouan', 'Gabes', 'Gafsa', 'Béja', 'Jendouba', 'Le Kef',
    'Ariana', 'Manouba', 'Médenine',
];
const TYPES = [
    bon_livraison_entity_1.TypeChargement.VRAC, bon_livraison_entity_1.TypeChargement.PALETTE, bon_livraison_entity_1.TypeChargement.FRIGO, bon_livraison_entity_1.TypeChargement.CITERNE,
];
function pick(arr, i) { return arr[i % arr.length]; }
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, { logger: false });
    const companyRepo = app.get((0, typeorm_1.getRepositoryToken)(company_entity_1.Company));
    const societeRepo = app.get((0, typeorm_1.getRepositoryToken)(societe_expeditrice_entity_1.SocieteExpeditrice));
    const filiereRepo = app.get((0, typeorm_1.getRepositoryToken)(filiere_entity_1.Filiere));
    const userRepo = app.get((0, typeorm_1.getRepositoryToken)(user_entity_1.User));
    const blRepo = app.get((0, typeorm_1.getRepositoryToken)(bon_livraison_entity_1.BonLivraison));
    const planRepo = app.get((0, typeorm_1.getRepositoryToken)(loading_plan_entity_1.LoadingPlan));
    const dcRepo = app.get((0, typeorm_1.getRepositoryToken)(delivery_company_entity_1.DeliveryCompany));
    const truckRepo = app.get((0, typeorm_1.getRepositoryToken)(truck_entity_1.Truck));
    console.log('\n[1/5] Vérification des prérequis…');
    const transfood = await companyRepo.findOne({ where: { code: 'TF' } });
    if (!transfood) {
        console.error('❌  TransFood (code TF) introuvable. Lancez d\'abord : npm run seed:rb-complet');
        await app.close();
        return;
    }
    const societe = await societeRepo.findOne({ where: { code: 'RB' } });
    if (!societe) {
        console.error('❌  Société expéditrice RB introuvable. Lancez d\'abord : npm run seed:rb-complet');
        await app.close();
        return;
    }
    const [filAMT, filMCSR, filPW] = await Promise.all([
        filiereRepo.findOne({ where: { code: 'AMT' } }),
        filiereRepo.findOne({ where: { code: 'MCSR' } }),
        filiereRepo.findOne({ where: { code: 'PW' } }),
    ]);
    if (!filAMT || !filMCSR || !filPW) {
        console.error('❌  Filières manquantes. Lancez d\'abord : npm run seed:rb-complet');
        await app.close();
        return;
    }
    const companyAdmin = await userRepo.findOne({ where: { email: 'logistique@transfood.tn' } });
    if (!companyAdmin) {
        console.error('❌  Compte logistique@transfood.tn introuvable.');
        await app.close();
        return;
    }
    const dc = await dcRepo.findOne({ where: { nom: 'Rapid Transport SARL' } });
    if (!dc) {
        console.error('❌  Société de livraison introuvable.');
        await app.close();
        return;
    }
    const filieres = [filAMT, filMCSR, filPW];
    console.log('  ✓ TransFood · Rose Blanche · 3 filières · logistique@transfood.tn · Rapid Transport SARL');
    console.log('\n[2/5] Camions supplémentaires…');
    const extraTruckDefs = [
        { matricule: 'TN-V01-2001', capaciteTonnage: 26, capacitePalettes: 22, type: 'FRIGO' },
        { matricule: 'TN-V02-2002', capaciteTonnage: 32, capacitePalettes: 0, type: 'CITERNE' },
        { matricule: 'TN-V03-2003', capaciteTonnage: 18, capacitePalettes: 16, type: 'PALETTE' },
        { matricule: 'TN-V04-2004', capaciteTonnage: 28, capacitePalettes: 0, type: 'VRAC' },
        { matricule: 'TN-V05-2005', capaciteTonnage: 20, capacitePalettes: 18, type: 'FRIGO' },
        { matricule: 'TN-V06-2006', capaciteTonnage: 24, capacitePalettes: 20, type: 'PALETTE' },
        { matricule: 'TN-V07-2007', capaciteTonnage: 30, capacitePalettes: 0, type: 'VRAC' },
        { matricule: 'TN-V08-2008', capaciteTonnage: 36, capacitePalettes: 0, type: 'CITERNE' },
        { matricule: 'TN-V09-2009', capaciteTonnage: 22, capacitePalettes: 20, type: 'FRIGO' },
        { matricule: 'TN-V10-2010', capaciteTonnage: 16, capacitePalettes: 14, type: 'PALETTE' },
        { matricule: 'TN-V11-2011', capaciteTonnage: 28, capacitePalettes: 0, type: 'VRAC' },
        { matricule: 'TN-V12-2012', capaciteTonnage: 20, capacitePalettes: 18, type: 'FRIGO' },
    ];
    const extraTrucks = [];
    for (const td of extraTruckDefs) {
        const t = await upsert(truckRepo, { matricule: td.matricule }, { capaciteTonnage: td.capaciteTonnage, capacitePalettes: td.capacitePalettes, type: td.type, isActive: true, deliveryCompany: dc });
        extraTrucks.push(t);
    }
    console.log(`  ✓ ${extraTrucks.length} camions ajoutés (TN-V01 … TN-V12)`);
    console.log('\n[3/5] Plans de chargement (J-3 → J+3)…');
    const planSpecs = [
        { ref: 'PL-VOL-J3-01', date: d(-3), truck: extraTrucks[0], loadingStatus: 'DONE', entryStatus: 'EXITED', quai: 'Q-MCSR-1', tonnageCharge: 48.0 },
        { ref: 'PL-VOL-J3-02', date: d(-3), truck: extraTrucks[1], loadingStatus: 'DONE', entryStatus: 'EXITED', quai: 'Q-AMT-2', tonnageCharge: 55.0 },
        { ref: 'PL-VOL-J3-03', date: d(-3), truck: extraTrucks[2], loadingStatus: 'DONE', entryStatus: 'EXITED', quai: 'Q-PW-1', tonnageCharge: 36.0 },
        { ref: 'PL-VOL-J2-01', date: d(-2), truck: extraTrucks[3], loadingStatus: 'DONE', entryStatus: 'EXITED', quai: 'Q-AMT-1', tonnageCharge: 52.0 },
        { ref: 'PL-VOL-J2-02', date: d(-2), truck: extraTrucks[4], loadingStatus: 'DONE', entryStatus: 'EXITED', quai: 'Q-MCSR-2', tonnageCharge: 44.0 },
        { ref: 'PL-VOL-J2-03', date: d(-2), truck: extraTrucks[5], loadingStatus: 'DONE', entryStatus: 'EXITED', quai: 'Q-PW-2', tonnageCharge: 38.0 },
        { ref: 'PL-VOL-J1-01', date: d(-1), truck: extraTrucks[6], loadingStatus: 'DONE', entryStatus: 'EXITED', quai: 'Q-MCSR-3', tonnageCharge: 60.0 },
        { ref: 'PL-VOL-J1-02', date: d(-1), truck: extraTrucks[7], loadingStatus: 'DONE', entryStatus: 'EXITED', quai: 'Q-AMT-3', tonnageCharge: 42.0 },
        { ref: 'PL-VOL-J1-03', date: d(-1), truck: extraTrucks[8], loadingStatus: 'DONE', entryStatus: 'EXITED', quai: 'Q-PW-1', tonnageCharge: 34.0 },
        { ref: 'PL-VOL-P1-01', date: d(+1), truck: extraTrucks[9], loadingStatus: 'WAITING', entryStatus: 'IDLE', tonnageCharge: 0 },
        { ref: 'PL-VOL-P1-02', date: d(+1), truck: extraTrucks[10], loadingStatus: 'WAITING', entryStatus: 'IDLE', tonnageCharge: 0 },
        { ref: 'PL-VOL-P1-03', date: d(+1), truck: extraTrucks[11], loadingStatus: 'WAITING', entryStatus: 'IDLE', tonnageCharge: 0 },
        { ref: 'PL-VOL-P2-01', date: d(+2), truck: extraTrucks[0], loadingStatus: 'WAITING', entryStatus: 'IDLE', tonnageCharge: 0 },
        { ref: 'PL-VOL-P2-02', date: d(+2), truck: extraTrucks[1], loadingStatus: 'WAITING', entryStatus: 'IDLE', tonnageCharge: 0 },
        { ref: 'PL-VOL-P2-03', date: d(+2), truck: extraTrucks[2], loadingStatus: 'WAITING', entryStatus: 'IDLE', tonnageCharge: 0 },
        { ref: 'PL-VOL-P3-01', date: d(+3), truck: extraTrucks[3], loadingStatus: 'WAITING', entryStatus: 'IDLE', tonnageCharge: 0 },
        { ref: 'PL-VOL-P3-02', date: d(+3), truck: extraTrucks[4], loadingStatus: 'WAITING', entryStatus: 'IDLE', tonnageCharge: 0 },
        { ref: 'PL-VOL-P3-03', date: d(+3), truck: extraTrucks[5], loadingStatus: 'WAITING', entryStatus: 'IDLE', tonnageCharge: 0 },
    ];
    const plans = {};
    for (const ps of planSpecs) {
        const plan = await upsert(planRepo, { reference: ps.ref }, {
            dateLivraison: ps.date,
            isValidated: true,
            loadingStatus: ps.loadingStatus,
            entryStatus: ps.entryStatus,
            heureArrivee: ps.entryStatus === 'EXITED' ? '06:00' : '08:00',
            quai: ps.quai ?? null,
            tonnageCharge: ps.tonnageCharge,
            palettesChargees: 0,
            truck: ps.truck,
            validatedBy: companyAdmin,
            logistiqueCompanyId: transfood.id,
            signature: 'sig_vol',
            calledAt: ps.entryStatus === 'EXITED' ? new Date(new Date(ps.date).setHours(6, 0)) : null,
            enteredAt: ps.entryStatus === 'EXITED' ? new Date(new Date(ps.date).setHours(6, 15)) : null,
        });
        plans[ps.ref] = plan;
    }
    console.log(`  ✓ ${planSpecs.length} plans (9 DONE·passés + 9 IDLE·futurs)`);
    console.log('\n[4/5] Bons de livraison supplémentaires…');
    const blSpecs = [];
    let idx = 0;
    for (const offset of [-4, -3, -2, -1]) {
        const tag = offset < 0 ? `M${Math.abs(offset)}` : `P${offset}`;
        const filiereSets = [
            { fil: filAMT, prefix: 'AMT', types: [bon_livraison_entity_1.TypeChargement.VRAC, bon_livraison_entity_1.TypeChargement.CITERNE, bon_livraison_entity_1.TypeChargement.VRAC] },
            { fil: filMCSR, prefix: 'MCSR', types: [bon_livraison_entity_1.TypeChargement.FRIGO, bon_livraison_entity_1.TypeChargement.FRIGO, bon_livraison_entity_1.TypeChargement.PALETTE] },
            { fil: filPW, prefix: 'PW', types: [bon_livraison_entity_1.TypeChargement.PALETTE, bon_livraison_entity_1.TypeChargement.VRAC, bon_livraison_entity_1.TypeChargement.PALETTE] },
        ];
        let planIdx = 0;
        for (const fs of filiereSets) {
            for (let i = 0; i < 3; i++) {
                const planRef = offset < 0 && offset >= -3
                    ? `PL-VOL-J${Math.abs(offset)}-0${planIdx + 1}`
                    : undefined;
                const plan = planRef ? plans[planRef] : undefined;
                blSpecs.push({
                    num: `BL-VOL-${fs.prefix}-${tag}-${String(i + 1).padStart(2, '0')}`,
                    clientNom: pick(CLIENTS, idx),
                    destination: pick(DESTINATIONS, idx + 3),
                    tonnage: 10 + (idx % 20) * 1.5,
                    palettes: fs.types[i] === bon_livraison_entity_1.TypeChargement.PALETTE ? 10 + (idx % 10) : 0,
                    type: fs.types[i],
                    statut: bl_status_enum_1.BlStatus.DELIVERED,
                    date: d(offset),
                    filiere: fs.fil,
                    ordre: plan ? (i + 1) : undefined,
                    plan: plan,
                });
                idx++;
            }
            if (offset >= -3)
                planIdx++;
        }
    }
    for (const offset of [1, 2, 3]) {
        const tag = `P${offset}`;
        const filiereSets = [
            { fil: filAMT, prefix: 'AMT', types: [bon_livraison_entity_1.TypeChargement.VRAC, bon_livraison_entity_1.TypeChargement.CITERNE, bon_livraison_entity_1.TypeChargement.VRAC] },
            { fil: filMCSR, prefix: 'MCSR', types: [bon_livraison_entity_1.TypeChargement.FRIGO, bon_livraison_entity_1.TypeChargement.PALETTE, bon_livraison_entity_1.TypeChargement.FRIGO] },
            { fil: filPW, prefix: 'PW', types: [bon_livraison_entity_1.TypeChargement.PALETTE, bon_livraison_entity_1.TypeChargement.VRAC, bon_livraison_entity_1.TypeChargement.PALETTE] },
        ];
        let planIdx = 1;
        for (const fs of filiereSets) {
            const planRef = `PL-VOL-P${offset}-0${planIdx}`;
            const plan = plans[planRef];
            for (let i = 0; i < 3; i++) {
                blSpecs.push({
                    num: `BL-VOL-${fs.prefix}-${tag}-${String(i + 1).padStart(2, '0')}`,
                    clientNom: pick(CLIENTS, idx),
                    destination: pick(DESTINATIONS, idx + 5),
                    tonnage: 12 + (idx % 18) * 1.2,
                    palettes: fs.types[i] === bon_livraison_entity_1.TypeChargement.PALETTE ? 12 + (idx % 8) : 0,
                    type: fs.types[i],
                    statut: bl_status_enum_1.BlStatus.VALIDATED,
                    date: d(offset),
                    filiere: fs.fil,
                    ordre: i + 1,
                    plan: plan,
                });
                idx++;
            }
            planIdx++;
        }
    }
    for (const offset of [4, 5]) {
        const tag = `P${offset}`;
        const mixed = [
            { fil: filAMT, prefix: 'AMT', type: bon_livraison_entity_1.TypeChargement.VRAC },
            { fil: filMCSR, prefix: 'MCSR', type: bon_livraison_entity_1.TypeChargement.FRIGO },
            { fil: filPW, prefix: 'PW', type: bon_livraison_entity_1.TypeChargement.PALETTE },
            { fil: filAMT, prefix: 'AMT', type: bon_livraison_entity_1.TypeChargement.CITERNE },
            { fil: filMCSR, prefix: 'MCSR', type: bon_livraison_entity_1.TypeChargement.FRIGO },
        ];
        mixed.forEach((m, i) => {
            blSpecs.push({
                num: `BL-VOL-${m.prefix}-${tag}-${String(i + 1).padStart(2, '0')}`,
                clientNom: pick(CLIENTS, idx),
                destination: pick(DESTINATIONS, idx + 2),
                tonnage: 14 + i * 3,
                palettes: m.type === bon_livraison_entity_1.TypeChargement.PALETTE ? 14 : 0,
                type: m.type,
                statut: bl_status_enum_1.BlStatus.VALIDATED,
                date: d(offset),
                filiere: m.fil,
                notes: 'À planifier',
            });
            idx++;
        });
    }
    for (let offset = 6; offset <= 10; offset++) {
        const tag = `P${offset}`;
        const mixed = [
            { fil: filAMT, prefix: 'AMT', type: bon_livraison_entity_1.TypeChargement.VRAC },
            { fil: filMCSR, prefix: 'MCSR', type: bon_livraison_entity_1.TypeChargement.FRIGO },
            { fil: filPW, prefix: 'PW', type: bon_livraison_entity_1.TypeChargement.PALETTE },
        ];
        mixed.forEach((m, i) => {
            blSpecs.push({
                num: `BL-VOL-${m.prefix}-${tag}-${String(i + 1).padStart(2, '0')}`,
                clientNom: pick(CLIENTS, idx),
                destination: pick(DESTINATIONS, idx + 1),
                tonnage: 8 + i * 4,
                palettes: m.type === bon_livraison_entity_1.TypeChargement.PALETTE ? 10 : 0,
                type: m.type,
                statut: bl_status_enum_1.BlStatus.DRAFT,
                date: d(offset),
                filiere: m.fil,
                notes: 'Pré-commande — en cours de validation',
            });
            idx++;
        });
    }
    const bonusPool = [
        { fil: filAMT, prefix: 'AMT', type: bon_livraison_entity_1.TypeChargement.VRAC },
        { fil: filMCSR, prefix: 'MCSR', type: bon_livraison_entity_1.TypeChargement.FRIGO },
        { fil: filPW, prefix: 'PW', type: bon_livraison_entity_1.TypeChargement.PALETTE },
        { fil: filAMT, prefix: 'AMT', type: bon_livraison_entity_1.TypeChargement.CITERNE },
        { fil: filMCSR, prefix: 'MCSR', type: bon_livraison_entity_1.TypeChargement.FRIGO },
        { fil: filPW, prefix: 'PW', type: bon_livraison_entity_1.TypeChargement.VRAC },
        { fil: filAMT, prefix: 'AMT', type: bon_livraison_entity_1.TypeChargement.PALETTE },
        { fil: filMCSR, prefix: 'MCSR', type: bon_livraison_entity_1.TypeChargement.FRIGO },
        { fil: filPW, prefix: 'PW', type: bon_livraison_entity_1.TypeChargement.PALETTE },
        { fil: filAMT, prefix: 'AMT', type: bon_livraison_entity_1.TypeChargement.VRAC },
    ];
    bonusPool.forEach((m, i) => {
        blSpecs.push({
            num: `BL-VOL-${m.prefix}-POOL-${String(i + 1).padStart(2, '0')}`,
            clientNom: pick(CLIENTS, idx),
            destination: pick(DESTINATIONS, idx + 4),
            tonnage: 10 + i * 2,
            palettes: m.type === bon_livraison_entity_1.TypeChargement.PALETTE ? 12 : 0,
            type: m.type,
            statut: bl_status_enum_1.BlStatus.VALIDATED,
            date: d(1),
            filiere: m.fil,
            notes: 'Disponible — en attente d\'un plan',
        });
        idx++;
    });
    let blCount = 0;
    for (const bs of blSpecs) {
        await upsert(blRepo, { numeroBl: bs.num }, {
            clientNom: bs.clientNom,
            clientAdresse: bs.destination,
            destination: bs.destination,
            origine: 'Béja',
            typeChargement: bs.type,
            tonnageTotal: bs.tonnage,
            nombrePalettes: bs.palettes,
            statut: bs.statut,
            datelivraison: bs.date,
            filiere: bs.filiere,
            societeExpeditrice: societe,
            company: transfood,
            loadingPlan: bs.plan ?? null,
            ordreChargement: bs.ordre ?? null,
            notes: bs.notes ?? null,
            erpReference: `ERP-${bs.num}`,
        });
        blCount++;
    }
    console.log(`  ✓ ${blCount} bons de livraison ajoutés`);
    const totalBls = await blRepo.count();
    const totalTrucks = await truckRepo.count();
    const totalPlans = await planRepo.count();
    console.log('\n════════════════════════════════════════════════════════════════');
    console.log('  RÉSULTAT GLOBAL EN BASE');
    console.log('════════════════════════════════════════════════════════════════');
    console.log(`  Total BLs           : ${totalBls}`);
    console.log(`  Total Camions       : ${totalTrucks}`);
    console.log(`  Total Plans         : ${totalPlans}`);
    console.log('════════════════════════════════════════════════════════════════');
    console.log('\n  Comptes (mot de passe : Demo123!) :');
    console.log('  SUPER_ADMIN      : admin@tms.com');
    console.log('  LOGISTIC_ADMIN   : logistique@transfood.tn');
    console.log('  EXPEDITEUR_ADMIN : admin@roseblanche.tn');
    console.log('  FILIERE_ADMIN    : admin.amt@roseblanche.tn  /  admin.mcr@roseblanche.tn  /  admin.pw@roseblanche.tn');
    console.log('  MAGASINIER       : mag1@roseblanche.tn  /  mag2@roseblanche.tn');
    console.log('  SECURITE         : sec1@roseblanche.tn  /  sec2@roseblanche.tn');
    console.log('\n✅  Terminé.\n');
    await app.close();
}
bootstrap().catch((e) => { console.error(e); process.exit(1); });
//# sourceMappingURL=seed-volume.js.map