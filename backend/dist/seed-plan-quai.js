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
    return '2026-06-12';
}
async function findOrFail(repo, where, label) {
    const e = await repo.findOne({ where: where });
    if (!e)
        throw new Error(`${label} introuvable — lancez d'abord seed:rb-complet`);
    return e;
}
async function upsertBl(blRepo, numeroBl, data) {
    const existing = await blRepo.findOne({ where: { numeroBl } });
    if (existing) {
        Object.assign(existing, data);
        return blRepo.save(existing);
    }
    return blRepo.save(blRepo.create({ numeroBl, ...data }));
}
async function upsertPlan(planRepo, reference, data) {
    const existing = await planRepo.findOne({ where: { reference } });
    if (existing) {
        Object.assign(existing, data);
        return planRepo.save(existing);
    }
    return planRepo.save(planRepo.create({ reference, ...data }));
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
    console.log('\n[1/4] Récupération des entités de base…');
    const transfood = await findOrFail(companyRepo, { nom: 'TransFood ' }, 'TransFood ');
    const companyAdmin = await findOrFail(userRepo, { email: 'logistique@transfood.tn' }, 'COMPANY_ADMIN');
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
    const trucks = await truckRepo.find({ order: { matricule: 'ASC' }, take: 10 });
    if (trucks.length < 10)
        throw new Error('Pas assez de camions — lancez seed:rb-complet');
    const DATE = today();
    console.log('\n[2/4] Configuration quai bloqué…');
    qAMT3.isActive = false;
    await quaiRepo.save(qAMT3);
    console.log('  ✓ Q-AMT-3 → isActive = false (Bloqué)');
    console.log('\n[3/4] Plans de chargement…');
    const planBase = {
        dateLivraison: DATE,
        isValidated: true,
        palettesChargees: 0,
        validatedBy: companyAdmin,
        logistiqueCompanyId: transfood.id,
        signature: 'sig_quai_demo',
    };
    const p1 = await upsertPlan(planRepo, 'PQ-MCSR-IP', { ...planBase, truck: trucks[0], heureArrivee: '06:30', quai: qMCR1.nom, entryStatus: 'ENTERED', loadingStatus: 'IN_PROGRESS', tonnageCharge: 18.5, loadingStartedAt: new Date(new Date().setHours(new Date().getHours() - 1)), loadingElapsedSeconds: 3600 });
    const p2 = await upsertPlan(planRepo, 'PQ-MCSR-CL', { ...planBase, truck: trucks[1], heureArrivee: '08:00', quai: qMCR2.nom, entryStatus: 'CALLED', loadingStatus: 'WAITING', tonnageCharge: 0 });
    const p3 = await upsertPlan(planRepo, 'PQ-AMT-IP', { ...planBase, truck: trucks[2], heureArrivee: '05:45', quai: qAMT1.nom, entryStatus: 'ENTERED', loadingStatus: 'IN_PROGRESS', tonnageCharge: 38.0, loadingStartedAt: new Date(new Date().setHours(new Date().getHours() - 2)), loadingElapsedSeconds: 7200 });
    const p4 = await upsertPlan(planRepo, 'PQ-AMT-PA', { ...planBase, truck: trucks[3], heureArrivee: '07:00', quai: qAMT2.nom, entryStatus: 'ENTERED', loadingStatus: 'PAUSED', tonnageCharge: 12.0, loadingStartedAt: new Date(new Date().setHours(new Date().getHours() - 1)), loadingElapsedSeconds: 1800 });
    const p5 = await upsertPlan(planRepo, 'PQ-PW-IP', { ...planBase, truck: trucks[4], heureArrivee: '06:00', quai: qPW1.nom, entryStatus: 'ENTERED', loadingStatus: 'IN_PROGRESS', tonnageCharge: 28.0, loadingStartedAt: new Date(new Date().setHours(new Date().getHours() - 1)), loadingElapsedSeconds: 2700 });
    const p6 = await upsertPlan(planRepo, 'PQ-IDLE-1', { ...planBase, truck: trucks[5], heureArrivee: '09:00', quai: null, entryStatus: 'IDLE', loadingStatus: 'WAITING', tonnageCharge: 0 });
    const p7 = await upsertPlan(planRepo, 'PQ-IDLE-2', { ...planBase, truck: trucks[6], heureArrivee: '09:30', quai: null, entryStatus: 'IDLE', loadingStatus: 'WAITING', tonnageCharge: 0 });
    const p8 = await upsertPlan(planRepo, 'PQ-IDLE-3', { ...planBase, truck: trucks[7], heureArrivee: '10:00', quai: null, entryStatus: 'IDLE', loadingStatus: 'WAITING', tonnageCharge: 0 });
    const p9 = await upsertPlan(planRepo, 'PQ-DONE-1', { ...planBase, truck: trucks[8], heureArrivee: '04:00', quai: qMCR3.nom, entryStatus: 'EXITED', loadingStatus: 'DONE', tonnageCharge: 20.0 });
    const p10 = await upsertPlan(planRepo, 'PQ-DONE-2', { ...planBase, truck: trucks[9], heureArrivee: '04:30', quai: null, entryStatus: 'EXITED', loadingStatus: 'DONE', tonnageCharge: 24.0 });
    console.log('  ✓ 10 plans');
    console.log('\n[4/4] Bons de livraison…');
    const base = {
        societeExpeditrice: societe,
        company: transfood,
        datelivraison: DATE,
        origine: 'Béja',
    };
    await upsertBl(blRepo, 'BL-Q-MCSR-IP1', { ...base, loadingPlan: p1, filiere: filMCR, clientNom: 'SAPD Distribution', destination: 'Tunis', typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, tonnageTotal: 14, nombrePalettes: 0, statut: bl_status_enum_1.BlStatus.LOADED, ordreChargement: 1 });
    await upsertBl(blRepo, 'BL-Q-MCSR-IP2', { ...base, loadingPlan: p1, filiere: filMCR, clientNom: 'Cotupha  ', destination: 'Sousse', typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, tonnageTotal: 9, nombrePalettes: 0, statut: bl_status_enum_1.BlStatus.LOADED, ordreChargement: 2 });
    await upsertBl(blRepo, 'BL-Q-MCSR-IP3', { ...base, loadingPlan: p1, filiere: filMCR, clientNom: 'Monastir Trade', destination: 'Monastir', typeChargement: bon_livraison_entity_1.TypeChargement.PALETTE, tonnageTotal: 11, nombrePalettes: 14, statut: bl_status_enum_1.BlStatus.LOADED, ordreChargement: 3 });
    await upsertBl(blRepo, 'BL-Q-MCSR-CL1', { ...base, loadingPlan: p2, filiere: filMCR, clientNom: 'Béja Négoce', destination: 'Béja', typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, tonnageTotal: 12, nombrePalettes: 0, statut: bl_status_enum_1.BlStatus.LOADED, ordreChargement: 1 });
    await upsertBl(blRepo, 'BL-Q-MCSR-CL2', { ...base, loadingPlan: p2, filiere: filMCR, clientNom: 'Kairouan Distribution', destination: 'Kairouan', typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, tonnageTotal: 8, nombrePalettes: 0, statut: bl_status_enum_1.BlStatus.LOADED, ordreChargement: 2 });
    await upsertBl(blRepo, 'BL-Q-AMT-IP1', { ...base, loadingPlan: p3, filiere: filAMT, clientNom: 'Maghrébine Aliments', destination: 'Sfax', typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, tonnageTotal: 25, nombrePalettes: 0, statut: bl_status_enum_1.BlStatus.LOADED, ordreChargement: 1 });
    await upsertBl(blRepo, 'BL-Q-AMT-IP2', { ...base, loadingPlan: p3, filiere: filAMT, clientNom: 'Sud Alimentaire', destination: 'Gafsa', typeChargement: bon_livraison_entity_1.TypeChargement.CITERNE, tonnageTotal: 30, nombrePalettes: 0, statut: bl_status_enum_1.BlStatus.LOADED, ordreChargement: 2 });
    await upsertBl(blRepo, 'BL-Q-AMT-PA1', { ...base, loadingPlan: p4, filiere: filAMT, clientNom: 'Société Nabeulienne', destination: 'Nabeul', typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, tonnageTotal: 28, nombrePalettes: 0, statut: bl_status_enum_1.BlStatus.LOADED, ordreChargement: 1 });
    await upsertBl(blRepo, 'BL-Q-PW-IP1', { ...base, loadingPlan: p5, filiere: filPW, clientNom: 'Distributeur Côtier', destination: 'Bizerte', typeChargement: bon_livraison_entity_1.TypeChargement.PALETTE, tonnageTotal: 18, nombrePalettes: 18, statut: bl_status_enum_1.BlStatus.LOADED, ordreChargement: 1 });
    await upsertBl(blRepo, 'BL-Q-PW-IP2', { ...base, loadingPlan: p5, filiere: filPW, clientNom: 'Grande Distribution', destination: 'Gabes', typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, tonnageTotal: 22, nombrePalettes: 0, statut: bl_status_enum_1.BlStatus.LOADED, ordreChargement: 2 });
    await upsertBl(blRepo, 'BL-Q-MCSR-W1', { ...base, loadingPlan: p6, filiere: filMCR, clientNom: 'SAPD Distribution', destination: 'Tunis', typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, tonnageTotal: 16, nombrePalettes: 0, statut: bl_status_enum_1.BlStatus.VALIDATED, ordreChargement: 1 });
    await upsertBl(blRepo, 'BL-Q-AMT-W1', { ...base, loadingPlan: p6, filiere: filAMT, clientNom: 'Cotupha  ', destination: 'Sousse', typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, tonnageTotal: 20, nombrePalettes: 0, statut: bl_status_enum_1.BlStatus.VALIDATED, ordreChargement: 2 });
    await upsertBl(blRepo, 'BL-Q-PW-W1', { ...base, loadingPlan: p6, filiere: filPW, clientNom: 'Monastir Trade', destination: 'Monastir', typeChargement: bon_livraison_entity_1.TypeChargement.PALETTE, tonnageTotal: 15, nombrePalettes: 15, statut: bl_status_enum_1.BlStatus.VALIDATED, ordreChargement: 3 });
    await upsertBl(blRepo, 'BL-Q-MCSR-W2', { ...base, loadingPlan: p7, filiere: filMCR, clientNom: 'Maghrébine Aliments', destination: 'Sfax', typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, tonnageTotal: 10, nombrePalettes: 0, statut: bl_status_enum_1.BlStatus.VALIDATED, ordreChargement: 1 });
    await upsertBl(blRepo, 'BL-Q-PW-W2', { ...base, loadingPlan: p7, filiere: filPW, clientNom: 'Grande Distribution', destination: 'Gabes', typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, tonnageTotal: 22, nombrePalettes: 0, statut: bl_status_enum_1.BlStatus.VALIDATED, ordreChargement: 2 });
    await upsertBl(blRepo, 'BL-Q-AMT-W2', { ...base, loadingPlan: p8, filiere: filAMT, clientNom: 'Béja Négoce', destination: 'Béja', typeChargement: bon_livraison_entity_1.TypeChargement.CITERNE, tonnageTotal: 32, nombrePalettes: 0, statut: bl_status_enum_1.BlStatus.VALIDATED, ordreChargement: 1 });
    await upsertBl(blRepo, 'BL-Q-MCSR-D1', { ...base, loadingPlan: p9, filiere: filMCR, clientNom: 'Société Nabeulienne', destination: 'Nabeul', typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, tonnageTotal: 20, nombrePalettes: 0, statut: bl_status_enum_1.BlStatus.DELIVERED });
    await upsertBl(blRepo, 'BL-Q-AMT-D1', { ...base, loadingPlan: p10, filiere: filAMT, clientNom: 'Distributeur Côtier', destination: 'Bizerte', typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, tonnageTotal: 24, nombrePalettes: 0, statut: bl_status_enum_1.BlStatus.DELIVERED });
    console.log('\n✅ Démo gestion du quai prête !');
    console.log('─'.repeat(56));
    console.log('  Vue mag1 (mag1@roseblanche.tn — MCSR + AMT) :');
    console.log('    Q-MCSR-1  ● En cours   (truck ' + trucks[0].matricule + ')');
    console.log('    Q-MCSR-2  ○ Occupé     (truck ' + trucks[1].matricule + ' — appelé)');
    console.log('    Q-MCSR-3  ✓ Libre      (truck terminé et sorti)');
    console.log('    Q-AMT-1  ● En cours   (truck ' + trucks[2].matricule + ')');
    console.log('    Q-AMT-2  ≈ Occupé     (truck ' + trucks[3].matricule + ' — pause)');
    console.log('    Q-AMT-3  ✗ Bloqué     (isActive = false)');
    console.log('  Vue mag2 (mag2@roseblanche.tn — PW) :');
    console.log('    Q-PW-1   ● En cours   (truck ' + trucks[4].matricule + ')');
    console.log('    Q-PW-2   ✓ Libre      (aucun plan actif)');
    console.log('  Panel camions :');
    console.log('    En attente   × 3  (trucks 6/7/8)');
    console.log('    Appelé       × 1  (truck 2)');
    console.log('    En chargement× 3  (trucks 1/3/4/5)');
    console.log('    Terminé      × 2  (trucks 9/10)');
    console.log('─'.repeat(56));
    await app.close();
}
bootstrap().catch((e) => {
    console.error('❌ Erreur :', e.message);
    process.exit(1);
});
//# sourceMappingURL=seed-plan-quai.js.map