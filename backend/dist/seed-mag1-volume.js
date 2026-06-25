"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const typeorm_1 = require("@nestjs/typeorm");
const company_entity_1 = require("./companies/company.entity");
const user_entity_1 = require("./users/user.entity");
const delivery_company_entity_1 = require("./delivery-companies/delivery-company.entity");
const societe_expeditrice_entity_1 = require("./expediteurs/societe-expeditrice.entity");
const filiere_entity_1 = require("./expediteurs/filiere.entity");
const quai_entity_1 = require("./quais/quai.entity");
const bon_livraison_entity_1 = require("./bons-livraison/bon-livraison.entity");
const loading_plan_entity_1 = require("./loading-plans/loading-plan.entity");
const truck_entity_1 = require("./trucks/truck.entity");
const bl_status_enum_1 = require("./common/enums/bl-status.enum");
function today() {
    return new Date().toISOString().split('T')[0];
}
function minutesAgo(n) {
    return new Date(Date.now() - n * 60 * 1000);
}
function hoursAgo(n) {
    return new Date(Date.now() - n * 60 * 60 * 1000);
}
function pad(n) {
    return String(n).padStart(3, '0');
}
async function findOrFail(repo, where, label) {
    const e = await repo.findOne({ where: where });
    if (!e)
        throw new Error(`${label} introuvable. Lancez d'abord: npm run seed:rb-complet`);
    return e;
}
async function upsertDC(repo, nom, adresse, telephone, company) {
    const existing = await repo.findOne({ where: { nom } });
    if (existing)
        return existing;
    return repo.save(repo.create({ nom, adresse, telephone, isActive: true, company }));
}
async function upsertTruck(repo, matricule, capaciteTonnage, capacitePalettes, type, dc) {
    const existing = await repo.findOne({ where: { matricule } });
    if (existing)
        return existing;
    return repo.save(repo.create({
        matricule, capaciteTonnage, capacitePalettes, type, isActive: true, deliveryCompany: dc,
    }));
}
async function upsertPlan(repo, reference, data) {
    const found = await repo.findOne({ where: { reference } });
    if (found) {
        Object.assign(found, data);
        return repo.save(found);
    }
    return repo.save(repo.create({ reference, ...data }));
}
async function upsertBl(repo, numeroBl, data) {
    const found = await repo.findOne({ where: { numeroBl } });
    if (found) {
        Object.assign(found, data);
        await repo.save(found);
        return;
    }
    await repo.save(repo.create({ numeroBl, ...data }));
}
const DELIVERY_COMPANIES = [
    {
        nom: 'Tunis Cargo Express',
        adresse: 'Avenue Habib Bourguiba km 3, Tunis',
        tel: '+216 71 200 100',
        prefix: 'TCX',
        trucks: [
            { t: 24, p: 20, type: 'FRIGO' }, { t: 18, p: 16, type: 'FRIGO' },
            { t: 30, p: 0, type: 'VRAC' }, { t: 20, p: 18, type: 'PALETTE' },
            { t: 28, p: 0, type: 'CITERNE' }, { t: 22, p: 20, type: 'PALETTE' },
            { t: 16, p: 14, type: 'FRIGO' }, { t: 26, p: 0, type: 'VRAC' },
            { t: 12, p: 10, type: 'FRIGO' },
        ],
    },
    {
        nom: 'Sahel Transport SARL',
        adresse: 'Zone Industrielle Sousse Nord',
        tel: '+216 73 300 200',
        prefix: 'SHT',
        trucks: [
            { t: 32, p: 0, type: 'CITERNE' }, { t: 24, p: 0, type: 'VRAC' },
            { t: 20, p: 18, type: 'PALETTE' }, { t: 18, p: 16, type: 'FRIGO' },
            { t: 28, p: 0, type: 'VRAC' }, { t: 15, p: 12, type: 'FRIGO' },
            { t: 22, p: 0, type: 'CITERNE' }, { t: 26, p: 22, type: 'PALETTE' },
            { t: 14, p: 12, type: 'FRIGO' },
        ],
    },
    {
        nom: 'Beja Logistique',
        adresse: 'Route de Tunis km 8, Beja',
        tel: '+216 78 450 300',
        prefix: 'BJL',
        trucks: [
            { t: 20, p: 18, type: 'FRIGO' }, { t: 24, p: 0, type: 'VRAC' },
            { t: 18, p: 16, type: 'PALETTE' }, { t: 30, p: 0, type: 'CITERNE' },
            { t: 16, p: 14, type: 'FRIGO' }, { t: 22, p: 20, type: 'PALETTE' },
            { t: 28, p: 0, type: 'VRAC' }, { t: 12, p: 10, type: 'FRIGO' },
            { t: 24, p: 0, type: 'CITERNE' },
        ],
    },
    {
        nom: 'Sfax Distribution',
        adresse: 'Route de Gabes km 5, Sfax',
        tel: '+216 74 600 400',
        prefix: 'SFX',
        trucks: [
            { t: 26, p: 22, type: 'PALETTE' }, { t: 30, p: 0, type: 'VRAC' },
            { t: 20, p: 0, type: 'CITERNE' }, { t: 18, p: 16, type: 'FRIGO' },
            { t: 24, p: 20, type: 'PALETTE' }, { t: 16, p: 0, type: 'VRAC' },
            { t: 22, p: 18, type: 'FRIGO' }, { t: 28, p: 0, type: 'CITERNE' },
            { t: 14, p: 12, type: 'PALETTE' },
        ],
    },
    {
        nom: 'Nord Express TN',
        adresse: 'Zone Franche Bizerte',
        tel: '+216 72 700 500',
        prefix: 'NEX',
        trucks: [
            { t: 22, p: 20, type: 'FRIGO' }, { t: 18, p: 0, type: 'VRAC' },
            { t: 28, p: 24, type: 'PALETTE' }, { t: 32, p: 0, type: 'CITERNE' },
            { t: 20, p: 18, type: 'FRIGO' }, { t: 16, p: 14, type: 'PALETTE' },
            { t: 24, p: 0, type: 'VRAC' }, { t: 18, p: 16, type: 'FRIGO' },
            { t: 12, p: 0, type: 'CITERNE' },
        ],
    },
    {
        nom: 'Côtier Freight',
        adresse: 'Port de Rades, Ben Arous',
        tel: '+216 71 800 600',
        prefix: 'CTF',
        trucks: [
            { t: 28, p: 0, type: 'VRAC' }, { t: 20, p: 18, type: 'FRIGO' },
            { t: 24, p: 22, type: 'PALETTE' }, { t: 18, p: 0, type: 'CITERNE' },
            { t: 22, p: 20, type: 'FRIGO' }, { t: 30, p: 0, type: 'VRAC' },
            { t: 16, p: 14, type: 'PALETTE' }, { t: 26, p: 0, type: 'CITERNE' },
            { t: 14, p: 12, type: 'FRIGO' },
        ],
    },
];
const CLIENTS = [
    'Carrefour Market', 'Magasin Général', 'Géant Casino', 'Monoprix TN', 'MG Hyper',
    'Aziza Supermarché', 'Saber Distributions', 'Coop Tunis', 'Champion Market',
    'Maxula Distrib.', 'HyperOne', 'Express Market', 'TFM Distribution',
    'Hatem Market', 'Centrex Distrib.', 'Hypercoop', 'Bidali Market',
];
const DESTINATIONS = [
    'Tunis Centre', 'La Marsa', 'Ariana', 'Ben Arous', 'Manouba',
    'Sfax Centre', 'Sfax Sud', 'Sousse', 'Monastir', 'Mahdia',
    'Nabeul', 'Hammamet', 'Bizerte', 'Kairouan', 'Sidi Bouzid',
    'Gabès', 'Médenine', 'Gafsa', 'Jendouba', 'El Kef',
];
function pick(arr, idx) {
    return arr[idx % arr.length];
}
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, { logger: false });
    const companyRepo = app.get((0, typeorm_1.getRepositoryToken)(company_entity_1.Company));
    const userRepo = app.get((0, typeorm_1.getRepositoryToken)(user_entity_1.User));
    const dcRepo = app.get((0, typeorm_1.getRepositoryToken)(delivery_company_entity_1.DeliveryCompany));
    const societeRepo = app.get((0, typeorm_1.getRepositoryToken)(societe_expeditrice_entity_1.SocieteExpeditrice));
    const filiereRepo = app.get((0, typeorm_1.getRepositoryToken)(filiere_entity_1.Filiere));
    const quaiRepo = app.get((0, typeorm_1.getRepositoryToken)(quai_entity_1.Quai));
    const blRepo = app.get((0, typeorm_1.getRepositoryToken)(bon_livraison_entity_1.BonLivraison));
    const planRepo = app.get((0, typeorm_1.getRepositoryToken)(loading_plan_entity_1.LoadingPlan));
    const truckRepo = app.get((0, typeorm_1.getRepositoryToken)(truck_entity_1.Truck));
    console.log('\n[1/5] Entités de base...');
    const transfood = await findOrFail(companyRepo, { code: 'TF' }, 'TransFood (code TF)');
    const adminUser = await findOrFail(userRepo, { email: 'logistique@transfood.tn' }, 'logistique@transfood.tn');
    const societe = await findOrFail(societeRepo, { nom: 'Rose Blanche' }, 'Société Rose Blanche');
    const filMCSR = await findOrFail(filiereRepo, { code: 'MCSR' }, 'Filière MCSR');
    const filAMT = await findOrFail(filiereRepo, { code: 'AMT' }, 'Filière AMT');
    const qMCSR1 = await quaiRepo.findOne({ where: { nom: 'Q-MCSR-1' } });
    const qMCSR2 = await quaiRepo.findOne({ where: { nom: 'Q-MCSR-2' } });
    const qMCSR3 = await quaiRepo.findOne({ where: { nom: 'Q-MCSR-3' } });
    const qAMT1 = await quaiRepo.findOne({ where: { nom: 'Q-AMT-1' } });
    const qAMT2 = await quaiRepo.findOne({ where: { nom: 'Q-AMT-2' } });
    if (!qMCSR1 || !qMCSR2 || !qMCSR3 || !qAMT1 || !qAMT2) {
        console.warn('  ⚠️  Certains quais absents — lancez seed:gestion-quais en premier');
        console.warn('  ⚠️  Les plans ENTERED seront créés sans quai assigné');
    }
    console.log('  ✓ TransFood, Rose Blanche, MCSR, AMT');
    console.log('\n[2/5] Création des sociétés de livraison et camions...');
    const allTrucks = [];
    for (const dcDef of DELIVERY_COMPANIES) {
        const dc = await upsertDC(dcRepo, dcDef.nom, dcDef.adresse, dcDef.tel, transfood);
        let created = 0;
        for (let i = 0; i < dcDef.trucks.length; i++) {
            const { t, p, type } = dcDef.trucks[i];
            const matricule = `${dcDef.prefix}-${pad(i + 1)}-V${new Date().getFullYear().toString().slice(2)}`;
            const truck = await upsertTruck(truckRepo, matricule, t, p, type, dc);
            allTrucks.push(truck);
            created++;
        }
        console.log(`  ✓ ${dcDef.nom.padEnd(26)} — ${created} camions`);
    }
    console.log(`\n  → ${allTrucks.length} camions disponibles au total`);
    console.log('\n[3/5] Nettoyage des conflits de quai...');
    const quaiNames = [qMCSR1, qMCSR2, qMCSR3, qAMT1, qAMT2]
        .filter(Boolean)
        .map((q) => q.nom);
    if (quaiNames.length > 0) {
        const conflicts = await planRepo
            .createQueryBuilder('lp')
            .where('lp.quai IN (:...quais)', { quais: quaiNames })
            .andWhere("lp.entryStatus NOT IN ('EXITED')")
            .andWhere("lp.loadingStatus NOT IN ('DONE')")
            .getMany();
        for (const p of conflicts) {
            await planRepo.update(p.id, {
                quai: undefined, entryStatus: 'IDLE',
                loadingStatus: 'WAITING', loadingStartedAt: undefined,
                loadingElapsedSeconds: 0,
            });
        }
        console.log(`  ✓ ${conflicts.length} plan(s) conflictuel(s) remis à zéro`);
    }
    const DATE = today();
    const base = {
        dateLivraison: DATE,
        isValidated: true,
        validatedBy: adminUser,
        logistiqueCompanyId: transfood.id,
        signature: 'sig_vol_mag1',
    };
    let truckIdx = 0;
    let blSeq = 1;
    let planCount = 0;
    function nextTruck() {
        if (truckIdx >= allTrucks.length)
            truckIdx = 0;
        return allTrucks[truckIdx++];
    }
    function blNom() { return `BL-VOL-${pad(blSeq++)}`; }
    function heureArrivee(hh, mm = 0) {
        return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    }
    console.log(`\n[4/5] Plans de chargement pour le ${DATE}...`);
    console.log('  → 15 plans IDLE/WAITING (draggables)...');
    for (let i = 0; i < 15; i++) {
        const ref = `VM1-IDLE-${pad(i + 1)}`;
        const fil = i % 2 === 0 ? filMCSR : filAMT;
        const plan = await upsertPlan(planRepo, ref, {
            ...base, truck: nextTruck(),
            heureArrivee: heureArrivee(8 + Math.floor(i / 3), (i % 3) * 15),
            entryStatus: 'IDLE',
            loadingStatus: 'WAITING',
            quai: null,
            tonnageCharge: 0, palettesChargees: 0,
        });
        const type = [bon_livraison_entity_1.TypeChargement.FRIGO, bon_livraison_entity_1.TypeChargement.PALETTE, bon_livraison_entity_1.TypeChargement.VRAC][i % 3];
        await upsertBl(blRepo, blNom(), {
            loadingPlan: plan, filiere: fil, societeExpeditrice: societe,
            company: transfood, datelivraison: DATE,
            clientNom: pick(CLIENTS, i), destination: pick(DESTINATIONS, i),
            origine: 'Depôt Béja', typeChargement: type,
            tonnageTotal: 12 + (i % 5) * 4, nombrePalettes: type === bon_livraison_entity_1.TypeChargement.FRIGO ? 0 : 10 + i % 8,
            statut: bl_status_enum_1.BlStatus.VALIDATED, ordreChargement: 1,
        });
        if (i % 3 === 0) {
            await upsertBl(blRepo, blNom(), {
                loadingPlan: plan, filiere: i % 4 === 0 ? filAMT : filMCSR,
                societeExpeditrice: societe, company: transfood,
                datelivraison: DATE,
                clientNom: pick(CLIENTS, i + 5), destination: pick(DESTINATIONS, i + 8),
                origine: 'Entrepôt Charguia', typeChargement: bon_livraison_entity_1.TypeChargement.VRAC,
                tonnageTotal: 18 + i % 6, nombrePalettes: 0,
                statut: bl_status_enum_1.BlStatus.VALIDATED, ordreChargement: 2,
            });
        }
        planCount++;
    }
    console.log('  → 5 plans CALLED (appelés)...');
    for (let i = 0; i < 5; i++) {
        const ref = `VM1-CALL-${pad(i + 1)}`;
        const fil = i % 2 === 0 ? filMCSR : filAMT;
        const plan = await upsertPlan(planRepo, ref, {
            ...base, truck: nextTruck(),
            heureArrivee: heureArrivee(7, i * 12),
            entryStatus: 'CALLED',
            loadingStatus: 'WAITING',
            quai: null,
            tonnageCharge: 0, palettesChargees: 0,
        });
        await upsertBl(blRepo, blNom(), {
            loadingPlan: plan, filiere: fil, societeExpeditrice: societe,
            company: transfood, datelivraison: DATE,
            clientNom: pick(CLIENTS, i + 2), destination: pick(DESTINATIONS, i + 3),
            origine: 'Usine Bir El Bey', typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO,
            tonnageTotal: 20 + i * 2, nombrePalettes: 0,
            statut: bl_status_enum_1.BlStatus.VALIDATED, ordreChargement: 1,
        });
        planCount++;
    }
    console.log('  → 3 plans ENTERED/WAITING (au quai)...');
    const waitingQuais = [qMCSR1, qMCSR2, qAMT1].filter(Boolean);
    for (let i = 0; i < 3; i++) {
        const ref = `VM1-ENT-W-${pad(i + 1)}`;
        const fil = waitingQuais[i]?.nom.startsWith('Q-AMT') ? filAMT : filMCSR;
        const quaiNom = waitingQuais[i]?.nom ?? null;
        const plan = await upsertPlan(planRepo, ref, {
            ...base, truck: nextTruck(),
            heureArrivee: heureArrivee(6, i * 20),
            entryStatus: 'ENTERED',
            loadingStatus: 'WAITING',
            quai: quaiNom,
            tonnageCharge: 0, palettesChargees: i * 8,
        });
        await upsertBl(blRepo, blNom(), {
            loadingPlan: plan, filiere: fil, societeExpeditrice: societe,
            company: transfood, datelivraison: DATE,
            clientNom: pick(CLIENTS, i + 7), destination: pick(DESTINATIONS, i + 12),
            origine: 'Dépôt Mégrine', typeChargement: bon_livraison_entity_1.TypeChargement.PALETTE,
            tonnageTotal: 14 + i * 3, nombrePalettes: 12 + i * 4,
            statut: bl_status_enum_1.BlStatus.VALIDATED, ordreChargement: 1,
        });
        planCount++;
    }
    console.log('  → 5 plans ENTERED/IN_PROGRESS (timer actif)...');
    const ipQuais = [qMCSR3, qAMT2, qMCSR1, qAMT1, qMCSR2].filter(Boolean);
    const ipDurations = [25, 55, 90, 110, 35];
    for (let i = 0; i < 5; i++) {
        const ref = `VM1-ENT-IP-${pad(i + 1)}`;
        const fil = ipQuais[i]?.nom.startsWith('Q-AMT') ? filAMT : filMCSR;
        const quaiNom = ipQuais[i]?.nom ?? null;
        const mins = ipDurations[i];
        const plan = await upsertPlan(planRepo, ref, {
            ...base, truck: nextTruck(),
            heureArrivee: heureArrivee(4 + i, 30),
            entryStatus: 'ENTERED',
            loadingStatus: 'IN_PROGRESS',
            quai: quaiNom,
            tonnageCharge: 10 + i * 5, palettesChargees: i * 6,
            loadingStartedAt: minutesAgo(mins),
            loadingElapsedSeconds: 0,
        });
        await upsertBl(blRepo, blNom(), {
            loadingPlan: plan, filiere: fil, societeExpeditrice: societe,
            company: transfood, datelivraison: DATE,
            clientNom: pick(CLIENTS, i + 4), destination: pick(DESTINATIONS, i + 6),
            origine: 'Dépôt Charguia', typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO,
            tonnageTotal: 16 + i * 4, nombrePalettes: 0,
            statut: bl_status_enum_1.BlStatus.LOADED, ordreChargement: 1,
        });
        await upsertBl(blRepo, blNom(), {
            loadingPlan: plan, filiere: fil, societeExpeditrice: societe,
            company: transfood, datelivraison: DATE,
            clientNom: pick(CLIENTS, i + 9), destination: pick(DESTINATIONS, i + 14),
            origine: 'Dépôt Charguia', typeChargement: bon_livraison_entity_1.TypeChargement.VRAC,
            tonnageTotal: 12 + i * 3, nombrePalettes: 0,
            statut: bl_status_enum_1.BlStatus.LOADED, ordreChargement: 2,
        });
        planCount++;
    }
    console.log('  → 2 plans ENTERED/PAUSED (en pause)...');
    const pauseQuais = [qAMT2, qMCSR3].filter(Boolean);
    const pauseSecs = [1800, 2700];
    for (let i = 0; i < 2; i++) {
        const ref = `VM1-ENT-PA-${pad(i + 1)}`;
        const fil = pauseQuais[i]?.nom.startsWith('Q-AMT') ? filAMT : filMCSR;
        const quaiNom = pauseQuais[i]?.nom ?? null;
        const plan = await upsertPlan(planRepo, ref, {
            ...base, truck: nextTruck(),
            heureArrivee: heureArrivee(5, i * 30),
            entryStatus: 'ENTERED',
            loadingStatus: 'PAUSED',
            quai: quaiNom,
            tonnageCharge: 15 + i * 8, palettesChargees: 0,
            loadingStartedAt: null,
            loadingElapsedSeconds: pauseSecs[i],
        });
        await upsertBl(blRepo, blNom(), {
            loadingPlan: plan, filiere: fil, societeExpeditrice: societe,
            company: transfood, datelivraison: DATE,
            clientNom: pick(CLIENTS, i + 6), destination: pick(DESTINATIONS, i + 10),
            origine: 'Entrepôt Borj Louzir', typeChargement: bon_livraison_entity_1.TypeChargement.CITERNE,
            tonnageTotal: 28 + i * 6, nombrePalettes: 0,
            statut: bl_status_enum_1.BlStatus.LOADED, ordreChargement: 1,
        });
        planCount++;
    }
    console.log('  → 5 plans EXITED/DONE (terminés)...');
    const doneDurations = [4800, 3600, 2400, 5400, 1800];
    for (let i = 0; i < 5; i++) {
        const ref = `VM1-DONE-${pad(i + 1)}`;
        const fil = i % 2 === 0 ? filMCSR : filAMT;
        const plan = await upsertPlan(planRepo, ref, {
            ...base, truck: nextTruck(),
            heureArrivee: heureArrivee(2 + i, 0),
            entryStatus: 'EXITED',
            loadingStatus: 'DONE',
            quai: null,
            tonnageCharge: 20 + i * 5, palettesChargees: i * 10,
            loadingStartedAt: null,
            loadingElapsedSeconds: doneDurations[i],
        });
        await upsertBl(blRepo, blNom(), {
            loadingPlan: plan, filiere: fil, societeExpeditrice: societe,
            company: transfood, datelivraison: DATE,
            clientNom: pick(CLIENTS, i + 10), destination: pick(DESTINATIONS, i + 15),
            origine: 'Usine Bir El Bey', typeChargement: bon_livraison_entity_1.TypeChargement.PALETTE,
            tonnageTotal: 18 + i * 3, nombrePalettes: 14 + i * 2,
            statut: bl_status_enum_1.BlStatus.DELIVERED, ordreChargement: 1,
        });
        planCount++;
    }
    console.log('\n[5/5] Résumé...');
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║     ✅  Seeder Volume mag1@roseblanche.tn — OK                 ║');
    console.log('╠══════════════════════════════════════════════════════════════════╣');
    console.log(`║  Date    : ${DATE.padEnd(55)}║`);
    console.log(`║  Camions : ${String(allTrucks.length).padEnd(3)} créés (6 sociétés × 9 camions)           ║`);
    console.log(`║  Plans   : ${String(planCount).padEnd(3)} créés pour aujourd'hui                   ║`);
    console.log(`║  BLs     : ${String(blSeq - 1).padEnd(3)} bons de livraison                         ║`);
    console.log('╠══════════════════════════════════════════════════════════════════╣');
    console.log('║  Répartition des états :                                        ║');
    console.log('║   IDLE/WAITING   × 15  → draggables (panel gauche)             ║');
    console.log('║   CALLED         × 5   → "Appelé"  (panel gauche)              ║');
    console.log('║   ENTERED/WAIT   × 3   → au quai, bouton Démarrer              ║');
    console.log('║   ENTERED/IP     × 5   → au quai, timer en cours               ║');
    console.log('║   ENTERED/PAUSED × 2   → au quai, timer figé                   ║');
    console.log('║   EXITED/DONE    × 5   → terminés (historique)                 ║');
    console.log('╠══════════════════════════════════════════════════════════════════╣');
    console.log('║  Sociétés de livraison créées :                                 ║');
    for (const dc of DELIVERY_COMPANIES) {
        console.log(`║   ${(dc.prefix + ' — ' + dc.nom).padEnd(60)} ║`);
    }
    console.log('╠══════════════════════════════════════════════════════════════════╣');
    console.log('║  Compte : mag1@roseblanche.tn  /  Demo123!                     ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log('');
    await app.close();
}
bootstrap().catch((e) => {
    console.error('\n❌ Erreur :', e.message);
    process.exit(1);
});
//# sourceMappingURL=seed-mag1-volume.js.map