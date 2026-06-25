"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const typeorm_1 = require("@nestjs/typeorm");
const company_entity_1 = require("./companies/company.entity");
const societe_expeditrice_entity_1 = require("./expediteurs/societe-expeditrice.entity");
const bon_livraison_entity_1 = require("./bons-livraison/bon-livraison.entity");
const bl_status_enum_1 = require("./common/enums/bl-status.enum");
const truck_entity_1 = require("./trucks/truck.entity");
const loading_plan_entity_1 = require("./loading-plans/loading-plan.entity");
function dateStr(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
}
function pad(n) {
    return String(n).padStart(3, '0');
}
function pick(arr, idx) {
    return arr[idx % arr.length];
}
const CLIENTS = [
    'Carrefour Market',
    'Magasin Général',
    'Géant Casino',
    'Monoprix TN',
    'MG Hyper',
    'Aziza Supermarché',
    'Saber Distributions',
    'Coop Tunis',
    'Champion Market',
    'Maxula Distrib.',
    'HyperOne',
    'Express Market',
    'TFM Distribution',
    'Hatem Market',
    'Centrex Distrib.',
];
const DESTINATIONS = [
    'Tunis Centre', 'La Marsa', 'Ariana', 'Ben Arous', 'Manouba',
    'Sfax Centre', 'Sfax Sud', 'Sousse', 'Monastir', 'Mahdia',
    'Nabeul', 'Hammamet', 'Bizerte', 'Kairouan', 'Sidi Bouzid',
    'Gabès', 'Médenine', 'Gafsa', 'Jendouba', 'El Kef',
];
const ORIGINES = ['Dépôt Mégrine', 'Dépôt Charguia', 'Entrepôt Borj Louzir', 'Usine Bir El Bey'];
const TYPES = [
    bon_livraison_entity_1.TypeChargement.PALETTE,
    bon_livraison_entity_1.TypeChargement.PALETTE,
    bon_livraison_entity_1.TypeChargement.PALETTE,
    bon_livraison_entity_1.TypeChargement.VRAC,
    bon_livraison_entity_1.TypeChargement.FRIGO,
    bon_livraison_entity_1.TypeChargement.CITERNE,
];
const TONNAGES = [8, 10, 12, 14, 16, 18, 20, 22, 24];
const PALETTES = [8, 10, 12, 14, 16, 18, 20, 0];
async function seed() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, { logger: ['error'] });
    const companyRepo = app.get((0, typeorm_1.getRepositoryToken)(company_entity_1.Company));
    const societeRepo = app.get((0, typeorm_1.getRepositoryToken)(societe_expeditrice_entity_1.SocieteExpeditrice));
    const blRepo = app.get((0, typeorm_1.getRepositoryToken)(bon_livraison_entity_1.BonLivraison));
    const truckRepo = app.get((0, typeorm_1.getRepositoryToken)(truck_entity_1.Truck));
    const planRepo = app.get((0, typeorm_1.getRepositoryToken)(loading_plan_entity_1.LoadingPlan));
    console.log('\n📦  Seeder BLs Logistique — démarrage...\n');
    const transfood = await companyRepo.findOne({ where: { code: 'TF' } });
    if (!transfood) {
        console.error('❌  TransFood (code TF) introuvable. Lance npm run seed:rb-complet en premier.');
        await app.close();
        process.exit(1);
    }
    const societes = await societeRepo.find({ relations: ['filieres'] });
    const pairs = [];
    for (const s of societes) {
        for (const f of (s.filieres ?? [])) {
            pairs.push({ filiere: f, societe: s });
        }
    }
    if (pairs.length === 0) {
        console.warn('⚠️   Aucune filière trouvée. Les BLs seront créés sans filière ni société expéditrice.');
    }
    else {
        console.log(`✅  ${pairs.length} filière(s) trouvée(s) :`);
        pairs.forEach(({ filiere, societe }) => console.log(`     · ${filiere.code} – ${filiere.nom} (${societe.nom})`));
    }
    const trucks = await truckRepo.find({
        where: { isActive: true },
        relations: ['deliveryCompany'],
    });
    if (!trucks.length) {
        console.error('❌  Aucun camion trouvé. Lance npm run seed:camions en premier.');
        await app.close();
        process.exit(1);
    }
    console.log(`✅  ${trucks.length} camion(s) disponible(s)\n`);
    console.log('[1/2] Création des BLs DRAFT...');
    let blSeq = 1;
    let draftCreated = 0;
    for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
        const date = dateStr(dayOffset);
        const blsPerDay = dayOffset === 0 ? 16 : 11;
        for (let i = 0; i < blsPerDay; i++) {
            const num = `BL-LOG-2026-${pad(blSeq++)}`;
            const existing = await blRepo.findOne({ where: { numeroBl: num } });
            if (existing)
                continue;
            const pair = pairs.length > 0 ? pick(pairs, blSeq) : null;
            const bl = blRepo.create({
                numeroBl: num,
                clientNom: pick(CLIENTS, blSeq + i),
                clientAdresse: `${Math.floor(Math.random() * 200) + 1} Avenue Principale`,
                origine: pick(ORIGINES, i),
                destination: pick(DESTINATIONS, blSeq + i * 2),
                typeChargement: pick(TYPES, blSeq + i),
                tonnageTotal: pick(TONNAGES, blSeq + i),
                nombrePalettes: pick(PALETTES, blSeq + i),
                statut: bl_status_enum_1.BlStatus.DRAFT,
                datelivraison: date,
                company: transfood,
                societeExpeditrice: pair?.societe ?? null,
                filiere: pair?.filiere ?? null,
            });
            await blRepo.save(bl);
            draftCreated++;
        }
    }
    console.log(`  ✓ ${draftCreated} BL(s) DRAFT créés (BL-LOG-2026-001 → BL-LOG-2026-${pad(blSeq - 1)})\n`);
    console.log('[2/2] Création des plans de chargement pour aujourd\'hui...');
    const TODAY = dateStr(0);
    const filieresForPlans = pairs.length > 0
        ? [pick(pairs, 0), pick(pairs, 1), pick(pairs, 2)]
        : [null, null, null];
    const planSpecs = [
        { ref: 'PL-LOG-001', truckIdx: 0, loadingStatus: 'WAITING', entryStatus: 'IDLE', heureArrivee: '08:00', quai: null, tonnageCharge: 0, blCount: 3, filiereIdx: 0, statut: bl_status_enum_1.BlStatus.VALIDATED },
        { ref: 'PL-LOG-002', truckIdx: 1, loadingStatus: 'WAITING', entryStatus: 'IDLE', heureArrivee: '08:30', quai: null, tonnageCharge: 0, blCount: 2, filiereIdx: 1, statut: bl_status_enum_1.BlStatus.VALIDATED },
        { ref: 'PL-LOG-003', truckIdx: 2, loadingStatus: 'WAITING', entryStatus: 'CALLED', heureArrivee: '07:00', quai: null, tonnageCharge: 0, blCount: 3, filiereIdx: 2, statut: bl_status_enum_1.BlStatus.VALIDATED },
        { ref: 'PL-LOG-004', truckIdx: 3, loadingStatus: 'IN_PROGRESS', entryStatus: 'ENTERED', heureArrivee: '06:00', quai: 'Q-DEMO-1', tonnageCharge: 14.5, blCount: 2, filiereIdx: 0, statut: bl_status_enum_1.BlStatus.VALIDATED },
        { ref: 'PL-LOG-005', truckIdx: 4, loadingStatus: 'DONE', entryStatus: 'EXITED', heureArrivee: '05:00', quai: 'Q-DEMO-2', tonnageCharge: 24.0, blCount: 3, filiereIdx: 1, statut: bl_status_enum_1.BlStatus.VALIDATED },
    ];
    let planCreated = 0;
    let planBlSeq = blSeq;
    for (const spec of planSpecs) {
        const existingPlan = await planRepo.findOne({ where: { reference: spec.ref } });
        if (existingPlan) {
            console.log(`  ⏭   Plan ${spec.ref} déjà existant — ignoré`);
            continue;
        }
        const truck = trucks[spec.truckIdx % trucks.length];
        const pairForPlan = filieresForPlans[spec.filiereIdx];
        const planBls = [];
        for (let b = 0; b < spec.blCount; b++) {
            const num = `BL-LOG-PLAN-${pad(planBlSeq++)}`;
            const existingBl = await blRepo.findOne({ where: { numeroBl: num } });
            if (existingBl) {
                planBls.push(existingBl);
                continue;
            }
            const bl = blRepo.create({
                numeroBl: num,
                clientNom: pick(CLIENTS, b + spec.truckIdx),
                clientAdresse: `${Math.floor(Math.random() * 200) + 1} Rue du Commerce`,
                origine: pick(ORIGINES, b),
                destination: pick(DESTINATIONS, b + spec.truckIdx * 3),
                typeChargement: pick(TYPES, b + spec.truckIdx),
                tonnageTotal: pick(TONNAGES, b + spec.truckIdx),
                nombrePalettes: pick(PALETTES, b),
                statut: spec.statut,
                datelivraison: TODAY,
                company: transfood,
                societeExpeditrice: pairForPlan?.societe ?? null,
                filiere: pairForPlan?.filiere ?? null,
            });
            const saved = await blRepo.save(bl);
            planBls.push(saved);
        }
        const plan = planRepo.create({
            reference: spec.ref,
            dateLivraison: TODAY,
            isValidated: true,
            loadingStatus: spec.loadingStatus,
            entryStatus: spec.entryStatus,
            heureArrivee: spec.heureArrivee,
            quai: spec.quai ?? undefined,
            tonnageCharge: spec.tonnageCharge,
            palettesChargees: 0,
            logistiqueCompanyId: transfood.id,
            truck,
        });
        const savedPlan = await planRepo.save(plan);
        for (const bl of planBls) {
            bl.loadingPlan = savedPlan;
            await blRepo.save(bl);
        }
        planCreated++;
        const truckLabel = `${truck.matricule} (${truck.type})`;
        const fLabel = pairForPlan ? pairForPlan.filiere.code : 'Générique';
        console.log(`  ✓  ${spec.ref}  [${spec.entryStatus.padEnd(8)}]  ${truckLabel.padEnd(22)}  ${spec.blCount} BLs  filière: ${fLabel}`);
    }
    const totalBls = await blRepo.count();
    const draftCount = await blRepo.count({ where: { statut: bl_status_enum_1.BlStatus.DRAFT } });
    const valCount = await blRepo.count({ where: { statut: bl_status_enum_1.BlStatus.VALIDATED } });
    const totalPlans = await planRepo.count();
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`✅  Terminé !`);
    console.log(`   BLs DRAFT      : ${draftCount} (logistique à planifier)`);
    console.log(`   BLs VALIDATED  : ${valCount}  (dans des plans de chargement)`);
    console.log(`   Total BLs      : ${totalBls}`);
    console.log(`   Plans créés    : ${planCreated}/${planSpecs.length} (${totalPlans} total en base)`);
    console.log(`\n   👉  Lance le backend et connecte-toi en tant que :`);
    console.log(`        - LOGISTIC_ADMIN pour valider/assigner les BLs DRAFT`);
    console.log(`        - MAGASINIER     pour voir les 5 plans d'aujourd'hui`);
    console.log(`        - SECURITE       pour contrôler les entrées/sorties\n`);
    await app.close();
}
seed().catch((err) => {
    console.error('❌  Erreur :', err);
    process.exit(1);
});
//# sourceMappingURL=seed-bls-logistique.js.map