"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const typeorm_1 = require("@nestjs/typeorm");
const company_entity_1 = require("./companies/company.entity");
const societe_expeditrice_entity_1 = require("./expediteurs/societe-expeditrice.entity");
const filiere_entity_1 = require("./expediteurs/filiere.entity");
const quai_entity_1 = require("./quais/quai.entity");
const bon_livraison_entity_1 = require("./bons-livraison/bon-livraison.entity");
const loading_plan_entity_1 = require("./loading-plans/loading-plan.entity");
const truck_entity_1 = require("./trucks/truck.entity");
const bl_status_enum_1 = require("./common/enums/bl-status.enum");
const user_entity_1 = require("./users/user.entity");
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
    console.log('\n[1/4] Entités de base…');
    const transfood = await findOrFail(companyRepo, { nom: 'TransFood  ' }, 'TransFood  ');
    const companyAdmin = await userRepo.findOne({ where: { email: 'logistique@transfood.tn' } });
    if (!companyAdmin)
        throw new Error('logistique@transfood.tn introuvable — lancez seed:rb-complet');
    const societe = await findOrFail(societeRepo, { nom: 'Rose Blanche' }, 'Société Rose Blanche');
    const filMCR = await findOrFail(filiereRepo, { code: 'MCSR' }, 'Filière MCSR');
    const filAMT = await findOrFail(filiereRepo, { code: 'AMT' }, 'Filière AMT');
    const qMCR1 = await findOrFail(quaiRepo, { nom: 'Q-MCSR-1' }, 'Q-MCSR-1');
    const qMCR2 = await findOrFail(quaiRepo, { nom: 'Q-MCSR-2' }, 'Q-MCSR-2');
    const qMCR3 = await findOrFail(quaiRepo, { nom: 'Q-MCSR-3' }, 'Q-MCSR-3');
    const qAMT1 = await findOrFail(quaiRepo, { nom: 'Q-AMT-1' }, 'Q-AMT-1');
    const qAMT2 = await findOrFail(quaiRepo, { nom: 'Q-AMT-2' }, 'Q-AMT-2');
    const qPW1 = await findOrFail(quaiRepo, { nom: 'Q-PW-1' }, 'Q-PW-1');
    const trucks = await truckRepo.find({ order: { matricule: 'ASC' }, take: 12 });
    if (trucks.length < 12)
        throw new Error('Pas assez de camions (besoin de 12) — lancez seed:rb-complet');
    console.log('  ✓ TransFood   + Rose Blanche + filières MCSR / AMT');
    console.log(`  ✓ ${trucks.length} camions  |  6 quais`);
    console.log('  ℹ  Comptes test : sec1@roseblanche.tn (MCSR+AMT)  sec2@roseblanche.tn (PW)');
    console.log('\n[2/4] Nettoyage des quais cibles…');
    const targetQuais = [qMCR1.nom, qMCR2.nom, qMCR3.nom, qAMT1.nom, qAMT2.nom, qPW1.nom];
    const conflicts = await planRepo
        .createQueryBuilder('lp')
        .where('lp.reference LIKE :pref', { pref: 'CE-%' })
        .andWhere("lp.entryStatus NOT IN ('EXITED')")
        .andWhere("lp.loadingStatus NOT IN ('DONE')")
        .getMany();
    const quaiConflicts = await planRepo
        .createQueryBuilder('lp')
        .where('lp.quai IN (:...quais)', { quais: targetQuais })
        .andWhere("lp.entryStatus NOT IN ('EXITED')")
        .andWhere("lp.loadingStatus NOT IN ('DONE')")
        .andWhere('lp.reference NOT LIKE :pref', { pref: 'CE-%' })
        .getMany();
    for (const plan of [...conflicts, ...quaiConflicts]) {
        await planRepo.update(plan.id, {
            quai: undefined,
            entryStatus: 'IDLE',
            loadingStatus: 'WAITING',
            loadingStartedAt: undefined,
            loadingElapsedSeconds: 0,
        });
    }
    console.log(`  ✓ ${conflicts.length + quaiConflicts.length} plan(s) conflictuel(s) réinitialisé(s)`);
    for (const q of [qMCR1, qMCR2, qMCR3, qAMT1, qAMT2, qPW1]) {
        await quaiRepo.update(q.id, { isActive: true });
    }
    const DATE = today();
    console.log(`\n[3/4] Plans de chargement pour le ${DATE}…`);
    const base = {
        dateLivraison: DATE,
        isValidated: true,
        validatedBy: companyAdmin,
        logistiqueCompanyId: transfood.id,
        signature: 'sig_ce_demo',
    };
    const pAtt1 = await upsertPlan(planRepo, 'CE-ATT-1', {
        ...base, truck: trucks[0], heureArrivee: '07:30',
        entryStatus: 'IDLE', loadingStatus: 'WAITING',
        quai: null, tonnageCharge: 0, palettesChargees: 0,
    });
    const pAtt2 = await upsertPlan(planRepo, 'CE-ATT-2', {
        ...base, truck: trucks[1], heureArrivee: '08:00',
        entryStatus: 'IDLE', loadingStatus: 'WAITING',
        quai: null, tonnageCharge: 0, palettesChargees: 0,
    });
    const pAtt3 = await upsertPlan(planRepo, 'CE-ATT-3', {
        ...base, truck: trucks[2], heureArrivee: '08:30',
        entryStatus: 'CALLED', loadingStatus: 'WAITING',
        quai: null, tonnageCharge: 0, palettesChargees: 0,
    });
    const pApp1 = await upsertPlan(planRepo, 'CE-APP-1', {
        ...base, truck: trucks[3], heureArrivee: '07:00',
        entryStatus: 'ENTERED', loadingStatus: 'WAITING',
        quai: qMCR1.nom, tonnageCharge: 0, palettesChargees: 20,
    });
    const pApp2 = await upsertPlan(planRepo, 'CE-APP-2', {
        ...base, truck: trucks[4], heureArrivee: '06:30',
        entryStatus: 'ENTERED', loadingStatus: 'WAITING',
        quai: qMCR2.nom, tonnageCharge: 0, palettesChargees: 16,
    });
    const pApp3 = await upsertPlan(planRepo, 'CE-APP-3', {
        ...base, truck: trucks[5], heureArrivee: '07:15',
        entryStatus: 'ENTERED', loadingStatus: 'WAITING',
        quai: qAMT1.nom, tonnageCharge: 0, palettesChargees: 0,
    });
    const pEnt1 = await upsertPlan(planRepo, 'CE-ENT-1', {
        ...base, truck: trucks[6], heureArrivee: '05:30',
        entryStatus: 'ENTERED', loadingStatus: 'IN_PROGRESS',
        quai: qMCR3.nom, tonnageCharge: 12.5, palettesChargees: 10,
        loadingStartedAt: minutesAgo(30),
        loadingElapsedSeconds: 0,
    });
    const pEnt2 = await upsertPlan(planRepo, 'CE-ENT-2', {
        ...base, truck: trucks[7], heureArrivee: '04:00',
        entryStatus: 'ENTERED', loadingStatus: 'IN_PROGRESS',
        quai: qAMT2.nom, tonnageCharge: 26.0, palettesChargees: 0,
        loadingStartedAt: hoursAgo(1.5),
        loadingElapsedSeconds: 0,
    });
    const pEnt3 = await upsertPlan(planRepo, 'CE-ENT-3', {
        ...base, truck: trucks[8], heureArrivee: '05:00',
        entryStatus: 'ENTERED', loadingStatus: 'PAUSED',
        quai: qPW1.nom, tonnageCharge: 18.0, palettesChargees: 14,
        loadingStartedAt: null,
        loadingElapsedSeconds: 2700,
    });
    const pTer1 = await upsertPlan(planRepo, 'CE-TER-1', {
        ...base, truck: trucks[9], heureArrivee: '03:00',
        entryStatus: 'EXITED', loadingStatus: 'DONE',
        quai: null, tonnageCharge: 22.0, palettesChargees: 0,
        loadingStartedAt: null,
        loadingElapsedSeconds: 4500,
    });
    const pTer2 = await upsertPlan(planRepo, 'CE-TER-2', {
        ...base, truck: trucks[10], heureArrivee: '03:30',
        entryStatus: 'EXITED', loadingStatus: 'DONE',
        quai: null, tonnageCharge: 28.5, palettesChargees: 0,
        loadingStartedAt: null,
        loadingElapsedSeconds: 3000,
    });
    const pTer3 = await upsertPlan(planRepo, 'CE-TER-3', {
        ...base, truck: trucks[11], heureArrivee: '01:30',
        entryStatus: 'EXITED', loadingStatus: 'DONE',
        quai: null, tonnageCharge: 32.0, palettesChargees: 20,
        loadingStartedAt: null,
        loadingElapsedSeconds: 7500,
    });
    console.log('  ✓ 12 plans créés / mis à jour');
    console.log('\n[4/4] Bons de livraison…');
    const blBase = {
        societeExpeditrice: societe,
        company: transfood,
        datelivraison: DATE,
        origine: 'Béja',
    };
    await upsertBl(blRepo, 'BL-CE-ATT-1A', {
        ...blBase, loadingPlan: pAtt1, filiere: filMCR,
        clientNom: 'SAPD Distribution', destination: 'Tunis',
        typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, tonnageTotal: 14, nombrePalettes: 0,
        statut: bl_status_enum_1.BlStatus.VALIDATED, ordreChargement: 1,
    });
    await upsertBl(blRepo, 'BL-CE-ATT-1B', {
        ...blBase, loadingPlan: pAtt1, filiere: filAMT,
        clientNom: 'Sfax Négoce', destination: 'Sfax',
        typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, tonnageTotal: 18, nombrePalettes: 0,
        statut: bl_status_enum_1.BlStatus.VALIDATED, ordreChargement: 2,
    });
    await upsertBl(blRepo, 'BL-CE-ATT-2', {
        ...blBase, loadingPlan: pAtt2, filiere: filAMT,
        clientNom: 'Grande Distribution', destination: 'Sousse',
        typeChargement: bon_livraison_entity_1.TypeChargement.CITERNE, tonnageTotal: 30, nombrePalettes: 0,
        statut: bl_status_enum_1.BlStatus.VALIDATED, ordreChargement: 1,
    });
    await upsertBl(blRepo, 'BL-CE-ATT-3', {
        ...blBase, loadingPlan: pAtt3, filiere: filMCR,
        clientNom: 'Cotupha  ', destination: 'Monastir',
        typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, tonnageTotal: 18, nombrePalettes: 0,
        statut: bl_status_enum_1.BlStatus.VALIDATED, ordreChargement: 1,
    });
    await upsertBl(blRepo, 'BL-CE-APP-1A', {
        ...blBase, loadingPlan: pApp1, filiere: filMCR,
        clientNom: 'Béja Négoce', destination: 'Béja',
        typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, tonnageTotal: 12, nombrePalettes: 12,
        statut: bl_status_enum_1.BlStatus.LOADED, ordreChargement: 1,
    });
    await upsertBl(blRepo, 'BL-CE-APP-1B', {
        ...blBase, loadingPlan: pApp1, filiere: filAMT,
        clientNom: 'Nabeul Trade', destination: 'Nabeul',
        typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, tonnageTotal: 16, nombrePalettes: 8,
        statut: bl_status_enum_1.BlStatus.LOADED, ordreChargement: 2,
    });
    await upsertBl(blRepo, 'BL-CE-APP-2', {
        ...blBase, loadingPlan: pApp2, filiere: filMCR,
        clientNom: 'Kairouan Distribution', destination: 'Kairouan',
        typeChargement: bon_livraison_entity_1.TypeChargement.PALETTE, tonnageTotal: 22, nombrePalettes: 16,
        statut: bl_status_enum_1.BlStatus.LOADED, ordreChargement: 1,
    });
    await upsertBl(blRepo, 'BL-CE-APP-3', {
        ...blBase, loadingPlan: pApp3, filiere: filAMT,
        clientNom: 'Maghrébine Aliments', destination: 'Gabès',
        typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, tonnageTotal: 28, nombrePalettes: 0,
        statut: bl_status_enum_1.BlStatus.LOADED, ordreChargement: 1,
    });
    await upsertBl(blRepo, 'BL-CE-ENT-1A', {
        ...blBase, loadingPlan: pEnt1, filiere: filMCR,
        clientNom: 'Monastir Trade', destination: 'Monastir',
        typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, tonnageTotal: 8, nombrePalettes: 6,
        statut: bl_status_enum_1.BlStatus.LOADED, ordreChargement: 1,
    });
    await upsertBl(blRepo, 'BL-CE-ENT-1B', {
        ...blBase, loadingPlan: pEnt1, filiere: filMCR,
        clientNom: 'Kef Alimentaire', destination: 'Le Kef',
        typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, tonnageTotal: 4.5, nombrePalettes: 4,
        statut: bl_status_enum_1.BlStatus.LOADED, ordreChargement: 2,
    });
    await upsertBl(blRepo, 'BL-CE-ENT-2A', {
        ...blBase, loadingPlan: pEnt2, filiere: filAMT,
        clientNom: 'Distributeur Côtier', destination: 'Jerba',
        typeChargement: bon_livraison_entity_1.TypeChargement.CITERNE, tonnageTotal: 15, nombrePalettes: 0,
        statut: bl_status_enum_1.BlStatus.LOADED, ordreChargement: 1,
    });
    await upsertBl(blRepo, 'BL-CE-ENT-2B', {
        ...blBase, loadingPlan: pEnt2, filiere: filAMT,
        clientNom: 'Sud Alimentaire', destination: 'Gafsa',
        typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, tonnageTotal: 11, nombrePalettes: 0,
        statut: bl_status_enum_1.BlStatus.LOADED, ordreChargement: 2,
    });
    await upsertBl(blRepo, 'BL-CE-ENT-3A', {
        ...blBase, loadingPlan: pEnt3, filiere: filMCR,
        clientNom: 'Nord Négoce', destination: 'Bizerte',
        typeChargement: bon_livraison_entity_1.TypeChargement.PALETTE, tonnageTotal: 10, nombrePalettes: 8,
        statut: bl_status_enum_1.BlStatus.LOADED, ordreChargement: 1,
    });
    await upsertBl(blRepo, 'BL-CE-ENT-3B', {
        ...blBase, loadingPlan: pEnt3, filiere: filAMT,
        clientNom: 'Société Nabeulienne', destination: 'Nabeul',
        typeChargement: bon_livraison_entity_1.TypeChargement.PALETTE, tonnageTotal: 8, nombrePalettes: 6,
        statut: bl_status_enum_1.BlStatus.LOADED, ordreChargement: 2,
    });
    await upsertBl(blRepo, 'BL-CE-TER-1', {
        ...blBase, loadingPlan: pTer1, filiere: filMCR,
        clientNom: 'SAPD Distribution', destination: 'Tunis',
        typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, tonnageTotal: 22, nombrePalettes: 0,
        statut: bl_status_enum_1.BlStatus.DELIVERED, ordreChargement: 1,
    });
    await upsertBl(blRepo, 'BL-CE-TER-2A', {
        ...blBase, loadingPlan: pTer2, filiere: filAMT,
        clientNom: 'Cotupha  ', destination: 'Sousse',
        typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, tonnageTotal: 16, nombrePalettes: 0,
        statut: bl_status_enum_1.BlStatus.DELIVERED, ordreChargement: 1,
    });
    await upsertBl(blRepo, 'BL-CE-TER-2B', {
        ...blBase, loadingPlan: pTer2, filiere: filMCR,
        clientNom: 'Kairouan Distribution', destination: 'Kairouan',
        typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, tonnageTotal: 12.5, nombrePalettes: 0,
        statut: bl_status_enum_1.BlStatus.DELIVERED, ordreChargement: 2,
    });
    await upsertBl(blRepo, 'BL-CE-TER-3A', {
        ...blBase, loadingPlan: pTer3, filiere: filAMT,
        clientNom: 'Grande Distribution', destination: 'Sfax',
        typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, tonnageTotal: 20, nombrePalettes: 12,
        statut: bl_status_enum_1.BlStatus.DELIVERED, ordreChargement: 1,
    });
    await upsertBl(blRepo, 'BL-CE-TER-3B', {
        ...blBase, loadingPlan: pTer3, filiere: filAMT,
        clientNom: 'Béja Négoce', destination: 'Béja',
        typeChargement: bon_livraison_entity_1.TypeChargement.PALETTE, tonnageTotal: 12, nombrePalettes: 8,
        statut: bl_status_enum_1.BlStatus.DELIVERED, ordreChargement: 2,
    });
    console.log('  ✓ 19 BLs créés / mis à jour');
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════════════╗');
    console.log('║      ✅  Seeder Contrôle des Entrées — OK                           ║');
    console.log('╠══════════════════════════════════════════════════════════════════════╣');
    console.log(`║  Date     : ${DATE.padEnd(57)}║`);
    console.log('╠══════════════════════════════╦═══════════════════════════════════════╣');
    console.log('║  Compte de test              ║  Email / Mot de passe                 ║');
    console.log('║  ──────────────────────────  ║  ───────────────────────────────────  ║');
    console.log('║  Agent Sécu (MCSR+AMT)        ║  sec1@roseblanche.tn  / Demo123!      ║');
    console.log('║  Agent Sécu (PW)             ║  sec2@roseblanche.tn  / Demo123!      ║');
    console.log('╠══════════════════════════════╩═══════════════════════════════════════╣');
    console.log('║  URL : http://localhost:5173/securite                                ║');
    console.log('╠══════════════════════════════════════════════════════════════════════╣');
    console.log('║                                                                      ║');
    console.log('║  ● PANNEAU GAUCHE — Liste complète (12 camions)                     ║');
    console.log(`║      ${trucks[0].matricule} · ${trucks[1].matricule} · ${trucks[2].matricule} (APPELÉ tel)                        ║`);
    console.log(`║      ${trucks[3].matricule} · ${trucks[4].matricule} · ${trucks[5].matricule} (violet)                      ║`);
    console.log(`║      ${trucks[6].matricule} · ${trucks[7].matricule} · ${trucks[8].matricule} (vert)                       ║`);
    console.log(`║      ${trucks[9].matricule} · ${trucks[10].matricule} · ${trucks[11].matricule} (terminés)                  ║`);
    console.log('║                                                                      ║');
    console.log('║  ◆ PANNEAU MILIEU (violet) — APPELÉS (3)                            ║');
    console.log(`║      ${trucks[3].matricule} → Q-MCSR-1  MCSR+AMT  20 pal.                         ║`);
    console.log(`║      ${trucks[4].matricule} → Q-MCSR-2  MCSR  16 pal.                              ║`);
    console.log(`║      ${trucks[5].matricule} → Q-AMT-1  AMT  vrac                                 ║`);
    console.log('║      (Démarrer pas encore cliqué = attente de démarrage)            ║');
    console.log('║                                                                      ║');
    console.log('║  ◆ PANNEAU DROITE (vert) — ENTRÉS (3)                               ║');
    console.log(`║      ${trucks[6].matricule} → Q-MCSR-3  ▶ En chargement (30 min)                 ║`);
    console.log(`║      ${trucks[7].matricule} → Q-AMT-2  ▶ En chargement (1h30)                   ║`);
    console.log(`║      ${trucks[8].matricule} → Q-PW-1   ⏸ En pause (45 min figé)                 ║`);
    console.log('║      + Section terminés : 3 matricules compacts en bas              ║');
    console.log('║                                                                      ║');
    console.log('╠══════════════════════════════════════════════════════════════════════╣');
    console.log('║  Barre stats attendue : Total 12 · En attente 3 · Appelés 3        ║');
    console.log('║                         Entrés 3 · Terminés 3                       ║');
    console.log('╚══════════════════════════════════════════════════════════════════════╝');
    console.log('');
    await app.close();
}
bootstrap().catch((e) => {
    console.error('\n❌ Erreur :', e.message);
    process.exit(1);
});
//# sourceMappingURL=seed-controle-entrees.js.map