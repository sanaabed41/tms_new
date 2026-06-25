"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const typeorm_1 = require("@nestjs/typeorm");
const company_entity_1 = require("./companies/company.entity");
const user_entity_1 = require("./users/user.entity");
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
async function findOrFail(repo, where, label) {
    const e = await repo.findOne({ where: where });
    if (!e)
        throw new Error(`${label} introuvable — lancez d'abord: npm run seed:rb-complet`);
    return e;
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
        return repo.save(found);
    }
    return repo.save(repo.create({ numeroBl, ...data }));
}
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, { logger: false });
    const companyRepo = app.get((0, typeorm_1.getRepositoryToken)(company_entity_1.Company));
    const userRepo = app.get((0, typeorm_1.getRepositoryToken)(user_entity_1.User));
    const societeRepo = app.get((0, typeorm_1.getRepositoryToken)(societe_expeditrice_entity_1.SocieteExpeditrice));
    const filiereRepo = app.get((0, typeorm_1.getRepositoryToken)(filiere_entity_1.Filiere));
    const quaiRepo = app.get((0, typeorm_1.getRepositoryToken)(quai_entity_1.Quai));
    const blRepo = app.get((0, typeorm_1.getRepositoryToken)(bon_livraison_entity_1.BonLivraison));
    const planRepo = app.get((0, typeorm_1.getRepositoryToken)(loading_plan_entity_1.LoadingPlan));
    const truckRepo = app.get((0, typeorm_1.getRepositoryToken)(truck_entity_1.Truck));
    console.log('\n[1/5] Entités de base…');
    const transfood = await findOrFail(companyRepo, { nom: 'TransFood  ' }, 'TransFood  ');
    const companyAdmin = await findOrFail(userRepo, { email: 'logistique@transfood.tn' }, 'logistique@transfood.tn');
    const societe = await findOrFail(societeRepo, { nom: 'Rose Blanche' }, 'Société Rose Blanche');
    const filMCR = await findOrFail(filiereRepo, { code: 'MCSR' }, 'Filière MCSR');
    const filAMT = await findOrFail(filiereRepo, { code: 'AMT' }, 'Filière AMT');
    const filPW = await findOrFail(filiereRepo, { code: 'PW' }, 'Filière PW');
    const qMCR1 = await findOrFail(quaiRepo, { nom: 'Q-MCSR-1' }, 'Q-MCSR-1');
    const qMCR2 = await findOrFail(quaiRepo, { nom: 'Q-MCSR-2' }, 'Q-MCSR-2');
    const qMCR3 = await findOrFail(quaiRepo, { nom: 'Q-MCSR-3' }, 'Q-MCSR-3');
    const qAMT1 = await findOrFail(quaiRepo, { nom: 'Q-AMT-1' }, 'Q-AMT-1');
    const qAMT2 = await findOrFail(quaiRepo, { nom: 'Q-AMT-2' }, 'Q-AMT-2');
    const qAMT3 = await findOrFail(quaiRepo, { nom: 'Q-AMT-3' }, 'Q-AMT-3');
    const qPW1 = await findOrFail(quaiRepo, { nom: 'Q-PW-1' }, 'Q-PW-1');
    const qPW2 = await findOrFail(quaiRepo, { nom: 'Q-PW-2' }, 'Q-PW-2');
    const trucks = await truckRepo.find({ order: { matricule: 'ASC' }, take: 12 });
    if (trucks.length < 12)
        throw new Error('Pas assez de camions (besoin de 12) — lancez seed:rb-complet');
    console.log('  ✓ Filières MCSR / AMT / PW');
    console.log(`  ✓ ${trucks.length} camions trouvés`);
    console.log('  ✓ 8 quais trouvés');
    console.log('\n[2/5] Nettoyage des quais cibles…');
    const quaisTarget = [qMCR1.nom, qMCR2.nom, qMCR3.nom, qAMT1.nom, qAMT2.nom, qPW1.nom, qPW2.nom];
    const conflicts = await planRepo
        .createQueryBuilder('lp')
        .where('lp.quai IN (:...quais)', { quais: quaisTarget })
        .andWhere("lp.entryStatus NOT IN ('EXITED')")
        .andWhere("lp.loadingStatus NOT IN ('DONE')")
        .getMany();
    for (const plan of conflicts) {
        await planRepo.update(plan.id, {
            quai: undefined,
            entryStatus: 'IDLE',
            loadingStatus: 'WAITING',
            loadingStartedAt: undefined,
            loadingElapsedSeconds: 0,
        });
    }
    console.log(`  ✓ ${conflicts.length} plan(s) conflictuel(s) réinitialisé(s)`);
    await quaiRepo.update(qAMT3.id, { isActive: false });
    for (const q of [qMCR1, qMCR2, qMCR3, qAMT1, qAMT2, qPW1, qPW2]) {
        await quaiRepo.update(q.id, { isActive: true });
    }
    console.log('  ✓ Q-AMT-3 → Bloqué  |  autres quais → Actifs');
    const DATE = today();
    console.log(`\n[3/5] Plans de chargement pour le ${DATE}…`);
    const base = {
        dateLivraison: DATE,
        isValidated: true,
        validatedBy: companyAdmin,
        logistiqueCompanyId: transfood.id,
        signature: 'sig_gq_demo',
    };
    const p1 = await upsertPlan(planRepo, 'GQ-MULTI-W', {
        ...base, truck: trucks[0], heureArrivee: '08:30',
        entryStatus: 'IDLE', loadingStatus: 'WAITING',
        quai: null, tonnageCharge: 0, palettesChargees: 0,
    });
    const p2 = await upsertPlan(planRepo, 'GQ-MCSR-CL', {
        ...base, truck: trucks[1], heureArrivee: '09:00',
        entryStatus: 'CALLED', loadingStatus: 'WAITING',
        quai: null, tonnageCharge: 0, palettesChargees: 0,
    });
    const p3 = await upsertPlan(planRepo, 'GQ-AMT-W', {
        ...base, truck: trucks[2], heureArrivee: '09:30',
        entryStatus: 'IDLE', loadingStatus: 'WAITING',
        quai: null, tonnageCharge: 0, palettesChargees: 0,
    });
    const p4 = await upsertPlan(planRepo, 'GQ-MCSR-AU', {
        ...base, truck: trucks[3], heureArrivee: '07:30',
        entryStatus: 'ENTERED', loadingStatus: 'WAITING',
        quai: qMCR2.nom, tonnageCharge: 0, palettesChargees: 18,
    });
    const p5 = await upsertPlan(planRepo, 'GQ-MCSR-IP', {
        ...base, truck: trucks[4], heureArrivee: '06:15',
        entryStatus: 'ENTERED', loadingStatus: 'IN_PROGRESS',
        quai: qMCR3.nom, tonnageCharge: 18.5, palettesChargees: 22,
        loadingStartedAt: minutesAgo(45),
        loadingElapsedSeconds: 0,
    });
    const p6 = await upsertPlan(planRepo, 'GQ-AMT-IP', {
        ...base, truck: trucks[5], heureArrivee: '04:00',
        entryStatus: 'ENTERED', loadingStatus: 'IN_PROGRESS',
        quai: qAMT1.nom, tonnageCharge: 38.0, palettesChargees: 0,
        loadingStartedAt: hoursAgo(2),
        loadingElapsedSeconds: 0,
    });
    const p7 = await upsertPlan(planRepo, 'GQ-AMT-PA', {
        ...base, truck: trucks[6], heureArrivee: '05:00',
        entryStatus: 'ENTERED', loadingStatus: 'PAUSED',
        quai: qAMT2.nom, tonnageCharge: 12.0, palettesChargees: 0,
        loadingStartedAt: null,
        loadingElapsedSeconds: 1800,
    });
    const p8 = await upsertPlan(planRepo, 'GQ-MCSR-DO', {
        ...base, truck: trucks[7], heureArrivee: '03:00',
        entryStatus: 'EXITED', loadingStatus: 'DONE',
        quai: null, tonnageCharge: 22.0, palettesChargees: 0,
        loadingStartedAt: null,
        loadingElapsedSeconds: 4800,
    });
    const p9 = await upsertPlan(planRepo, 'GQ-AMT-DO', {
        ...base, truck: trucks[8], heureArrivee: '03:30',
        entryStatus: 'EXITED', loadingStatus: 'DONE',
        quai: null, tonnageCharge: 30.5, palettesChargees: 0,
        loadingStartedAt: null,
        loadingElapsedSeconds: 2700,
    });
    const p10 = await upsertPlan(planRepo, 'GQ-PW-IP', {
        ...base, truck: trucks[9], heureArrivee: '05:30',
        entryStatus: 'ENTERED', loadingStatus: 'IN_PROGRESS',
        quai: qPW1.nom, tonnageCharge: 28.0, palettesChargees: 24,
        loadingStartedAt: hoursAgo(1),
        loadingElapsedSeconds: 0,
    });
    const p11 = await upsertPlan(planRepo, 'GQ-PW-W', {
        ...base, truck: trucks[10], heureArrivee: '10:00',
        entryStatus: 'IDLE', loadingStatus: 'WAITING',
        quai: null, tonnageCharge: 0, palettesChargees: 0,
    });
    const p12 = await upsertPlan(planRepo, 'GQ-PW-DO', {
        ...base, truck: trucks[11], heureArrivee: '04:15',
        entryStatus: 'EXITED', loadingStatus: 'DONE',
        quai: null, tonnageCharge: 15.5, palettesChargees: 16,
        loadingStartedAt: null,
        loadingElapsedSeconds: 2100,
    });
    console.log('  ✓ 12 plans créés / mis à jour');
    console.log('\n[4/5] Bons de livraison…');
    const blBase = {
        societeExpeditrice: societe,
        company: transfood,
        datelivraison: DATE,
        origine: 'Béja',
    };
    await upsertBl(blRepo, 'BL-GQ-MULTI-MCSR', {
        ...blBase, loadingPlan: p1, filiere: filMCR,
        clientNom: 'SAPD Distribution', destination: 'Tunis',
        typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, tonnageTotal: 12, nombrePalettes: 0,
        statut: bl_status_enum_1.BlStatus.VALIDATED, ordreChargement: 1,
    });
    await upsertBl(blRepo, 'BL-GQ-MULTI-AMT', {
        ...blBase, loadingPlan: p1, filiere: filAMT,
        clientNom: 'Maghrébine Aliments', destination: 'Sfax',
        typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, tonnageTotal: 20, nombrePalettes: 0,
        statut: bl_status_enum_1.BlStatus.VALIDATED, ordreChargement: 2,
    });
    await upsertBl(blRepo, 'BL-GQ-MCSR-CL', {
        ...blBase, loadingPlan: p2, filiere: filMCR,
        clientNom: 'Cotupha  ', destination: 'Sousse',
        typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, tonnageTotal: 18, nombrePalettes: 0,
        statut: bl_status_enum_1.BlStatus.VALIDATED, ordreChargement: 1,
    });
    await upsertBl(blRepo, 'BL-GQ-AMT-W', {
        ...blBase, loadingPlan: p3, filiere: filAMT,
        clientNom: 'Sud Alimentaire', destination: 'Gafsa',
        typeChargement: bon_livraison_entity_1.TypeChargement.CITERNE, tonnageTotal: 32, nombrePalettes: 0,
        statut: bl_status_enum_1.BlStatus.VALIDATED, ordreChargement: 1,
    });
    await upsertBl(blRepo, 'BL-GQ-AU-MCSR', {
        ...blBase, loadingPlan: p4, filiere: filMCR,
        clientNom: 'Béja Négoce', destination: 'Béja',
        typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, tonnageTotal: 10, nombrePalettes: 10,
        statut: bl_status_enum_1.BlStatus.LOADED, ordreChargement: 1,
    });
    await upsertBl(blRepo, 'BL-GQ-AU-AMT', {
        ...blBase, loadingPlan: p4, filiere: filAMT,
        clientNom: 'Société Nabeulienne', destination: 'Nabeul',
        typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, tonnageTotal: 14, nombrePalettes: 8,
        statut: bl_status_enum_1.BlStatus.LOADED, ordreChargement: 2,
    });
    await upsertBl(blRepo, 'BL-GQ-MCSR-IP1', {
        ...blBase, loadingPlan: p5, filiere: filMCR,
        clientNom: 'Kairouan Distribution', destination: 'Kairouan',
        typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, tonnageTotal: 10, nombrePalettes: 12,
        statut: bl_status_enum_1.BlStatus.LOADED, ordreChargement: 1,
    });
    await upsertBl(blRepo, 'BL-GQ-MCSR-IP2', {
        ...blBase, loadingPlan: p5, filiere: filMCR,
        clientNom: 'Monastir Trade', destination: 'Monastir',
        typeChargement: bon_livraison_entity_1.TypeChargement.PALETTE, tonnageTotal: 8.5, nombrePalettes: 10,
        statut: bl_status_enum_1.BlStatus.LOADED, ordreChargement: 2,
    });
    await upsertBl(blRepo, 'BL-GQ-AMT-IP1', {
        ...blBase, loadingPlan: p6, filiere: filAMT,
        clientNom: 'Maghrébine Aliments', destination: 'Sfax',
        typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, tonnageTotal: 22, nombrePalettes: 0,
        statut: bl_status_enum_1.BlStatus.LOADED, ordreChargement: 1,
    });
    await upsertBl(blRepo, 'BL-GQ-AMT-IP2', {
        ...blBase, loadingPlan: p6, filiere: filAMT,
        clientNom: 'Distributeur Côtier', destination: 'Gabès',
        typeChargement: bon_livraison_entity_1.TypeChargement.CITERNE, tonnageTotal: 16, nombrePalettes: 0,
        statut: bl_status_enum_1.BlStatus.LOADED, ordreChargement: 2,
    });
    await upsertBl(blRepo, 'BL-GQ-AMT-PA', {
        ...blBase, loadingPlan: p7, filiere: filAMT,
        clientNom: 'Grande Distribution', destination: 'Sousse',
        typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, tonnageTotal: 28, nombrePalettes: 0,
        statut: bl_status_enum_1.BlStatus.LOADED, ordreChargement: 1,
    });
    await upsertBl(blRepo, 'BL-GQ-MCSR-DO', {
        ...blBase, loadingPlan: p8, filiere: filMCR,
        clientNom: 'SAPD Distribution', destination: 'Tunis',
        typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, tonnageTotal: 22, nombrePalettes: 0,
        statut: bl_status_enum_1.BlStatus.DELIVERED, ordreChargement: 1,
    });
    await upsertBl(blRepo, 'BL-GQ-AMT-DO', {
        ...blBase, loadingPlan: p9, filiere: filAMT,
        clientNom: 'Cotupha  ', destination: 'Sousse',
        typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, tonnageTotal: 30.5, nombrePalettes: 0,
        statut: bl_status_enum_1.BlStatus.DELIVERED, ordreChargement: 1,
    });
    await upsertBl(blRepo, 'BL-GQ-PW-IP1', {
        ...blBase, loadingPlan: p10, filiere: filPW,
        clientNom: 'Nord Négoce', destination: 'Bizerte',
        typeChargement: bon_livraison_entity_1.TypeChargement.PALETTE, tonnageTotal: 16, nombrePalettes: 14,
        statut: bl_status_enum_1.BlStatus.LOADED, ordreChargement: 1,
    });
    await upsertBl(blRepo, 'BL-GQ-PW-IP2', {
        ...blBase, loadingPlan: p10, filiere: filPW,
        clientNom: 'Société Nabeulienne', destination: 'Nabeul',
        typeChargement: bon_livraison_entity_1.TypeChargement.PALETTE, tonnageTotal: 12, nombrePalettes: 10,
        statut: bl_status_enum_1.BlStatus.LOADED, ordreChargement: 2,
    });
    await upsertBl(blRepo, 'BL-GQ-PW-W', {
        ...blBase, loadingPlan: p11, filiere: filPW,
        clientNom: 'Grande Distribution', destination: 'Sfax',
        typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, tonnageTotal: 24, nombrePalettes: 0,
        statut: bl_status_enum_1.BlStatus.VALIDATED, ordreChargement: 1,
    });
    await upsertBl(blRepo, 'BL-GQ-PW-DO', {
        ...blBase, loadingPlan: p12, filiere: filPW,
        clientNom: 'Béja Négoce', destination: 'Béja',
        typeChargement: bon_livraison_entity_1.TypeChargement.PALETTE, tonnageTotal: 15.5, nombrePalettes: 16,
        statut: bl_status_enum_1.BlStatus.DELIVERED, ordreChargement: 1,
    });
    console.log('  ✓ 16 BLs créés / mis à jour');
    console.log('\n[5/5] Résumé…');
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║         ✅  Seeder Gestion des Quais — OK                   ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log(`║  Date : ${DATE.padEnd(53)}║`);
    console.log('╠════════════════════════╦═════════════════════════════════════╣');
    console.log('║  mag1@roseblanche.tn   ║  Q-MCSR-1  ○  LIBRE (drop zone)     ║');
    console.log('║  (MCSR + AMT)           ║  Q-MCSR-2  ○  Occupé  → Démarrer    ║');
    console.log('║                        ║  Q-MCSR-3  ●  En cours (45 min)     ║');
    console.log('║                        ║  Q-AMT-1  ●  En cours (2h)         ║');
    console.log('║                        ║  Q-AMT-2  ≈  Pause (30 min figé)   ║');
    console.log('║                        ║  Q-AMT-3  ✗  Bloqué                ║');
    console.log('╠════════════════════════╬═════════════════════════════════════╣');
    console.log('║  mag2@roseblanche.tn   ║  Q-PW-1   ●  En cours (1h)         ║');
    console.log('║  (PW)                  ║  Q-PW-2   ○  LIBRE (drop zone)     ║');
    console.log('╠════════════════════════╩═════════════════════════════════════╣');
    console.log('║  Panel camions mag1 :                                        ║');
    console.log(`║   Draggables  : multi-filière (${trucks[0].matricule}), appelé MCSR (${trucks[1].matricule})  ║`);
    console.log(`║                 AMT incompatible (${trucks[2].matricule})                    ║`);
    console.log(`║   Au quai     : ${trucks[3].matricule} → Q-MCSR-2 Démarrer               ║`);
    console.log(`║   En cours    : ${trucks[4].matricule} → Q-MCSR-3 (45min)                ║`);
    console.log(`║                 ${trucks[5].matricule} → Q-AMT-1 (2h)                   ║`);
    console.log(`║   En pause    : ${trucks[6].matricule} → Q-AMT-2 (30min figé)           ║`);
    console.log(`║   Terminés    : ${trucks[7].matricule} (1h20)  ${trucks[8].matricule} (45min) ║`);
    console.log('║  Panel camions mag2 :                                        ║');
    console.log(`║   En cours    : ${trucks[9].matricule} → Q-PW-1 (1h)                    ║`);
    console.log(`║   Draggable   : ${trucks[10].matricule} → vers Q-PW-2                    ║`);
    console.log(`║   Terminé     : ${trucks[11].matricule} (35min)                           ║`);
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log('║  Tests drag & drop :                                         ║');
    console.log('║  1. Drag truck #1 (MCSR+AMT) → Q-MCSR-1  → compatible ✓      ║');
    console.log('║  2. Drag truck #2 (MCSR)     → Q-MCSR-1  → compatible ✓      ║');
    console.log('║  3. Drag truck #3 (AMT)     → Q-MCSR-1  → INCOMPATIBLE ✗    ║');
    console.log('║  4. Drag truck #3 (AMT)     → quai AMT libre → aucun dispo  ║');
    console.log('║  5. mag2 : Drag truck #11   → Q-PW-2   → compatible ✓      ║');
    console.log('║  6. mag2 : Drag truck #11   → Q-MCSR-1  → INCOMPATIBLE ✗    ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');
    await app.close();
}
bootstrap().catch((e) => {
    console.error('\n❌ Erreur :', e.message);
    process.exit(1);
});
//# sourceMappingURL=seed-gestion-quais.js.map