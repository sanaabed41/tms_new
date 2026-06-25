"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const typeorm_1 = require("@nestjs/typeorm");
const company_entity_1 = require("./companies/company.entity");
const truck_entity_1 = require("./trucks/truck.entity");
const article_entity_1 = require("./articles/article.entity");
const bon_livraison_entity_1 = require("./bons-livraison/bon-livraison.entity");
const bl_article_entity_1 = require("./bons-livraison/bl-article.entity");
const loading_plan_entity_1 = require("./loading-plans/loading-plan.entity");
const societe_expeditrice_entity_1 = require("./expediteurs/societe-expeditrice.entity");
const filiere_entity_1 = require("./expediteurs/filiere.entity");
const user_entity_1 = require("./users/user.entity");
const bl_status_enum_1 = require("./common/enums/bl-status.enum");
const TODAY = new Date().toISOString().split('T')[0];
let BL_SEQ = 900;
function nextBl() { return `BL-QT-${String(++BL_SEQ).padStart(4, '0')}`; }
function ref() { return `PC-QT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, { logger: false });
    const companyRepo = app.get((0, typeorm_1.getRepositoryToken)(company_entity_1.Company));
    const truckRepo = app.get((0, typeorm_1.getRepositoryToken)(truck_entity_1.Truck));
    const articleRepo = app.get((0, typeorm_1.getRepositoryToken)(article_entity_1.Article));
    const blRepo = app.get((0, typeorm_1.getRepositoryToken)(bon_livraison_entity_1.BonLivraison));
    const blArticleRepo = app.get((0, typeorm_1.getRepositoryToken)(bl_article_entity_1.BlArticle));
    const planRepo = app.get((0, typeorm_1.getRepositoryToken)(loading_plan_entity_1.LoadingPlan));
    const societeRepo = app.get((0, typeorm_1.getRepositoryToken)(societe_expeditrice_entity_1.SocieteExpeditrice));
    const filiereRepo = app.get((0, typeorm_1.getRepositoryToken)(filiere_entity_1.Filiere));
    const userRepo = app.get((0, typeorm_1.getRepositoryToken)(user_entity_1.User));
    const company = await companyRepo.findOne({ where: { nom: 'TransFood' } });
    if (!company) {
        console.error('❌ TransFood introuvable');
        await app.close();
        return;
    }
    const filAMT = await filiereRepo.findOne({ where: { code: 'AMT' } });
    const filMCSR = await filiereRepo.findOne({ where: { code: 'MCSR' } });
    const filPW = await filiereRepo.findOne({ where: { code: 'PW' } });
    if (!filAMT || !filMCSR || !filPW) {
        console.error('❌ Filières AMT/MCSR/PW introuvables — lancez npm run seed:pb');
        await app.close();
        return;
    }
    const roseBlanche = await societeRepo.findOne({ where: { nom: 'Rose Blanche' } });
    if (!roseBlanche) {
        console.error('❌ Rose Blanche introuvable');
        await app.close();
        return;
    }
    const trucksByMatricule = {};
    const allTrucks = await truckRepo.find();
    for (const t of allTrucks)
        trucksByMatricule[t.matricule] = t;
    const trucks = ['PB-SFR-001', 'PB-SFR-002', 'PB-SFR-003', 'PB-SFR-004',
        'PB-TEX-001', 'PB-TEX-002', 'PB-MGT-001', 'PB-MGT-002', 'PB-MGT-003']
        .map((m) => trucksByMatricule[m])
        .filter(Boolean);
    if (trucks.length === 0) {
        console.error('❌ Aucun camion trouvé — lancez npm run seed:pb');
        await app.close();
        return;
    }
    console.log(`✅ ${trucks.length} camions chargés`);
    const art = async (code) => articleRepo.findOne({ where: { code } });
    const artAMT = await art('AMT-SPG-500') || await art('AMT-MAC-500');
    const artMCSR = await art('MCSR-SG-1KG') || await art('MCSR-SF-1KG');
    const artPW = await art('PW-SPG-500') || await art('PW-MAC-500');
    const admin = await userRepo.findOne({ where: { email: 'admin@transfood.tn' } })
        ?? await userRepo.findOne({ where: { company: { id: company.id } } });
    const makeBl = async (params) => {
        const bl = blRepo.create({
            numeroBl: nextBl(),
            clientNom: params.client,
            clientAdresse: '',
            origine: 'Usine Rose Blanche',
            destination: params.dest,
            typeChargement: bon_livraison_entity_1.TypeChargement.PALETTE,
            tonnageTotal: params.tonnage,
            nombrePalettes: params.palettes,
            statut: bl_status_enum_1.BlStatus.VALIDATED,
            datelivraison: TODAY,
            societeExpeditrice: { id: roseBlanche.id },
            filiere: { id: params.filiere.id },
            company: { id: company.id },
            ordreChargement: params.ordre,
        });
        const saved = await blRepo.save(bl);
        if (params.article) {
            await blArticleRepo.save(blArticleRepo.create({
                bonLivraison: { id: saved.id },
                article: { id: params.article.id },
                quantite: Math.round(params.tonnage * 2000),
                poidsTotal: params.tonnage,
            }));
        }
        return saved;
    };
    const makePlan = async (params) => {
        const plan = planRepo.create({
            reference: ref(),
            dateLivraison: TODAY,
            truck: { id: params.truck.id },
            bonsLivraison: params.bls.map((b) => ({ id: b.id })),
            tonnageCharge: params.bls.reduce((s, b) => s + Number(b.tonnageTotal), 0),
            palettesChargees: params.bls.reduce((s, b) => s + (b.nombrePalettes ?? 0), 0),
            isValidated: params.isValidated ?? true,
            entryStatus: params.entryStatus,
            loadingStatus: params.loadingStatus,
            quai: params.quai ?? null,
            stationsSequence: params.stationsSequence ?? null,
            currentStation: params.currentStation ?? null,
            currentStationIdx: params.currentStationIdx ?? 0,
            loadingElapsedSeconds: params.elapsedSeconds ?? 0,
            loadingStartedAt: params.startedSecsAgo
                ? new Date(Date.now() - params.startedSecsAgo * 1000)
                : null,
            heureArrivee: params.heureArrivee ?? null,
            validatedBy: admin ? { id: admin.id } : undefined,
        });
        const saved = await planRepo.save(plan);
        await Promise.all(params.bls.map((bl) => blRepo.query(`UPDATE bons_livraison SET statut = $1, "loadingPlanId" = $2 WHERE id = $3`, [bl_status_enum_1.BlStatus.LOADED, saved.id, bl.id])));
        return saved;
    };
    const existing = await planRepo
        .createQueryBuilder('lp')
        .where('lp.reference LIKE :prefix', { prefix: 'PC-QT-%' })
        .andWhere('lp.dateLivraison = :date', { date: TODAY })
        .getMany();
    for (const lp of existing) {
        await blRepo.query(`UPDATE bons_livraison SET statut = $1, "loadingPlanId" = NULL, "ordreChargement" = NULL WHERE "loadingPlanId" = $2`, [bl_status_enum_1.BlStatus.VALIDATED, lp.id]);
        await planRepo.delete(lp.id);
    }
    if (existing.length)
        console.log(`  ↩  ${existing.length} ancien(s) plan(s) QT supprimés`);
    {
        const bl1 = await makeBl({ filiere: filAMT, dest: 'Sfax', client: 'Épicerie Sfax', tonnage: 6, palettes: 10, ordre: 1, article: artAMT });
        const bl2 = await makeBl({ filiere: filMCSR, dest: 'Sfax', client: 'Moulin Sfax', tonnage: 8, palettes: 0, ordre: 2, article: artMCSR });
        await makePlan({ truck: trucks[0], bls: [bl1, bl2], entryStatus: 'IDLE', loadingStatus: 'WAITING', heureArrivee: '07:00' });
        console.log('  ✚  Plan 1 — IDLE   AMT→MCSR  [truck 0]  heureArrivée 07:00');
    }
    {
        const bl1 = await makeBl({ filiere: filPW, dest: 'Sousse', client: 'Carrefour Sousse', tonnage: 5, palettes: 8, ordre: 1, article: artPW });
        const bl2 = await makeBl({ filiere: filAMT, dest: 'Nabeul', client: 'Grossiste Nabeul', tonnage: 4, palettes: 6, ordre: 2, article: artAMT });
        await makePlan({ truck: trucks[1], bls: [bl1, bl2], entryStatus: 'IDLE', loadingStatus: 'WAITING', heureArrivee: '07:30' });
        console.log('  ✚  Plan 2 — IDLE   PW→AMT    [truck 1]  heureArrivée 07:30');
    }
    {
        const bl1 = await makeBl({ filiere: filMCSR, dest: 'Monastir', client: 'Minoterie Monastir', tonnage: 10, palettes: 0, ordre: 1, article: artMCSR });
        const bl2 = await makeBl({ filiere: filMCSR, dest: 'Mahdia', client: 'Moulin Mahdia', tonnage: 8, palettes: 0, ordre: 2, article: artMCSR });
        await makePlan({ truck: trucks[2], bls: [bl1, bl2], entryStatus: 'IDLE', loadingStatus: 'WAITING', heureArrivee: '08:00' });
        console.log('  ✚  Plan 3 — IDLE   MCSR      [truck 2]  heureArrivée 08:00');
    }
    {
        const bl1 = await makeBl({ filiere: filAMT, dest: 'Bizerte', client: 'GMS Bizerte', tonnage: 4, palettes: 6, ordre: 1, article: artAMT });
        const bl2 = await makeBl({ filiere: filMCSR, dest: 'Béja', client: 'Silos Béja', tonnage: 6, palettes: 0, ordre: 2, article: artMCSR });
        const bl3 = await makeBl({ filiere: filPW, dest: 'Jendouba', client: 'Distrib Jendouba', tonnage: 3, palettes: 4, ordre: 3, article: artPW });
        await makePlan({ truck: trucks[3], bls: [bl1, bl2, bl3], entryStatus: 'IDLE', loadingStatus: 'WAITING', heureArrivee: '08:30' });
        console.log('  ✚  Plan 4 — IDLE   AMT→MCSR→PW [truck 3] heureArrivée 08:30');
    }
    {
        const bl1 = await makeBl({ filiere: filPW, dest: 'Tunis', client: 'Hypermarché Tunis', tonnage: 8, palettes: 12, ordre: 1, article: artPW });
        const bl2 = await makeBl({ filiere: filPW, dest: 'Ariana', client: 'Supermarché Ariana', tonnage: 4, palettes: 6, ordre: 2, article: artPW });
        await makePlan({
            truck: trucks[4], bls: [bl1, bl2],
            entryStatus: 'CALLED', loadingStatus: 'WAITING',
            quai: 'QPW1',
            stationsSequence: ['PW'], currentStation: 'PW', currentStationIdx: 0,
            heureArrivee: '07:00',
        });
        console.log('  ✚  Plan 5 — CALLED QPW1      [truck 4]  → attente autorisation sécu');
    }
    {
        const bl1 = await makeBl({ filiere: filAMT, dest: 'Kairouan', client: 'GMS Kairouan', tonnage: 9, palettes: 14, ordre: 1, article: artAMT });
        const bl2 = await makeBl({ filiere: filAMT, dest: 'Kasserine', client: 'Distrib Kasserine', tonnage: 5, palettes: 8, ordre: 2, article: artAMT });
        await makePlan({
            truck: trucks[5], bls: [bl1, bl2],
            entryStatus: 'CALLED', loadingStatus: 'WAITING',
            quai: 'QAMT1',
            stationsSequence: ['AMT'], currentStation: 'AMT', currentStationIdx: 0,
            heureArrivee: '07:15',
        });
        console.log('  ✚  Plan 6 — CALLED QAMT1     [truck 5]  → attente autorisation sécu');
    }
    {
        const bl1 = await makeBl({ filiere: filMCSR, dest: 'Gabès', client: 'Moulin Gabès', tonnage: 12, palettes: 0, ordre: 1, article: artMCSR });
        await makePlan({
            truck: trucks[6], bls: [bl1],
            entryStatus: 'CALLED', loadingStatus: 'WAITING',
            quai: 'Quai 1',
            stationsSequence: ['MCSR'], currentStation: 'MCSR', currentStationIdx: 0,
            heureArrivee: '07:30',
        });
        console.log('  ✚  Plan 7 — CALLED Quai 1    [truck 6]  → quai générique occupé');
    }
    {
        const bl1 = await makeBl({ filiere: filMCSR, dest: 'Médenine', client: 'Silo Médenine', tonnage: 10, palettes: 0, ordre: 1, article: artMCSR });
        const bl2 = await makeBl({ filiere: filMCSR, dest: 'Tataouine', client: 'Coop Tataouine', tonnage: 8, palettes: 0, ordre: 2, article: artMCSR });
        await makePlan({
            truck: trucks[7], bls: [bl1, bl2],
            entryStatus: 'ENTERED', loadingStatus: 'WAITING',
            quai: 'QMCSR1',
            stationsSequence: ['MCSR'], currentStation: 'MCSR', currentStationIdx: 0,
            heureArrivee: '06:45',
        });
        console.log('  ✚  Plan 8 — ENTERED/WAITING  QMCSR1     [truck 7] → prêt à démarrer');
    }
    {
        const bl1 = await makeBl({ filiere: filPW, dest: 'Le Kef', client: 'Grossiste Le Kef', tonnage: 6, palettes: 8, ordre: 1, article: artPW });
        const bl2 = await makeBl({ filiere: filAMT, dest: 'Siliana', client: 'Épicerie Siliana', tonnage: 4, palettes: 6, ordre: 2, article: artAMT });
        await makePlan({
            truck: trucks[0], bls: [bl1, bl2],
            entryStatus: 'ENTERED', loadingStatus: 'WAITING',
            quai: 'Quai 2',
            stationsSequence: ['PW', 'AMT'], currentStation: 'PW', currentStationIdx: 0,
            heureArrivee: '06:30',
        });
        console.log('  ✚  Plan 9 — ENTERED/WAITING  Quai 2     [truck 8] → prêt à démarrer (2 stations)');
    }
    {
        const bl1 = await makeBl({ filiere: filAMT, dest: 'Gafsa', client: 'GMS Gafsa', tonnage: 7, palettes: 10, ordre: 1, article: artAMT });
        const bl2 = await makeBl({ filiere: filAMT, dest: 'Tozeur', client: 'Coopérative Tozeur', tonnage: 5, palettes: 8, ordre: 2, article: artAMT });
        await makePlan({
            truck: trucks[1], bls: [bl1, bl2],
            entryStatus: 'ENTERED', loadingStatus: 'IN_PROGRESS',
            quai: 'QAMT2',
            stationsSequence: ['AMT'], currentStation: 'AMT', currentStationIdx: 0,
            elapsedSeconds: 120, startedSecsAgo: 360,
            heureArrivee: '06:00',
        });
        console.log('  ✚  Plan 10 — IN_PROGRESS     QAMT2      [truck 1] → chargement AMT en cours');
    }
    {
        const bl1 = await makeBl({ filiere: filPW, dest: 'Kébili', client: 'Épicerie Kébili', tonnage: 4, palettes: 6, ordre: 1, article: artPW });
        await makePlan({
            truck: trucks[2], bls: [bl1],
            entryStatus: 'ENTERED', loadingStatus: 'IN_PROGRESS',
            quai: 'QPW2',
            stationsSequence: ['PW'], currentStation: 'PW', currentStationIdx: 0,
            elapsedSeconds: 0, startedSecsAgo: 300,
            heureArrivee: '06:15',
        });
        console.log('  ✚  Plan 11 — IN_PROGRESS     QPW2       [truck 2] → chargement PW en cours');
    }
    {
        const bl1 = await makeBl({ filiere: filMCSR, dest: 'Zaghouan', client: 'Silo Zaghouan', tonnage: 9, palettes: 0, ordre: 1, article: artMCSR });
        await makePlan({
            truck: trucks[3], bls: [bl1],
            entryStatus: 'ENTERED', loadingStatus: 'PAUSED',
            quai: 'QMCSR2',
            stationsSequence: ['MCSR'], currentStation: 'MCSR', currentStationIdx: 0,
            elapsedSeconds: 720,
            heureArrivee: '05:30',
        });
        console.log('  ✚  Plan 12 — PAUSED          QMCSR2     [truck 3] → chargement en pause (12 min)');
    }
    {
        const bl1 = await makeBl({ filiere: filPW, dest: 'Tunis', client: 'Hypermarché Lac', tonnage: 6, palettes: 8, ordre: 1, article: artPW });
        const plan = planRepo.create({
            reference: ref(),
            dateLivraison: TODAY,
            truck: { id: trucks[4].id },
            bonsLivraison: [],
            tonnageCharge: 6,
            palettesChargees: 8,
            isValidated: true,
            entryStatus: 'EXITED',
            loadingStatus: 'DONE',
            quai: 'QPW3',
            stationsSequence: ['PW'],
            currentStation: null,
            currentStationIdx: 1,
            loadingElapsedSeconds: 1540,
            loadingStartedAt: null,
            heureArrivee: '05:00',
            validatedBy: admin ? { id: admin.id } : undefined,
        });
        const savedPlan = await planRepo.save(plan);
        await blRepo.query(`UPDATE bons_livraison SET statut = $1, "loadingPlanId" = $2 WHERE id = $3`, [bl_status_enum_1.BlStatus.LOADED, savedPlan.id, bl1.id]);
        console.log('  ✚  Plan 13 — DONE/EXITED     QPW3 libre [truck 4] → terminé (QPW3 libéré)');
    }
    {
        const bl1 = await makeBl({ filiere: filAMT, dest: 'Sousse', client: 'Magasin Général Sousse', tonnage: 5, palettes: 8, ordre: 1, article: artAMT });
        const plan = planRepo.create({
            reference: ref(),
            dateLivraison: TODAY,
            truck: { id: trucks[5].id },
            bonsLivraison: [],
            tonnageCharge: 5,
            palettesChargees: 8,
            isValidated: true,
            entryStatus: 'EXITED',
            loadingStatus: 'DONE',
            quai: 'Quai 3',
            stationsSequence: ['AMT'],
            currentStation: null,
            currentStationIdx: 1,
            loadingElapsedSeconds: 820,
            loadingStartedAt: null,
            heureArrivee: '05:15',
            validatedBy: admin ? { id: admin.id } : undefined,
        });
        const savedPlan = await planRepo.save(plan);
        await blRepo.query(`UPDATE bons_livraison SET statut = $1, "loadingPlanId" = $2 WHERE id = $3`, [bl_status_enum_1.BlStatus.LOADED, savedPlan.id, bl1.id]);
        console.log('  ✚  Plan 14 — DONE/EXITED     Quai 3 libre [truck 5] → terminé');
    }
    console.log(`
🎉  Seeder quais-test terminé — ${14} plans créés pour ${TODAY}

État des quais actuels :
  Dédiés occupés  : QPW1 (CALLED) · QAMT1 (CALLED) · QMCSR1 (ENTERED) · QAMT2 (IN_PROGRESS) · QPW2 (IN_PROGRESS) · QMCSR2 (PAUSED)
  Génériques occ. : Quai 1 (CALLED) · Quai 2 (ENTERED)
  Libres          : QAMT3 QAMT4 QPW3 QMCSR3 Quai 3..8
  Plans IDLE      : 4 camions en attente d'appel

Connexion pour tester :
  magasinier1@transfood.tn  → voit stations AMT + MCSR
  magasinier2@transfood.tn  → voit station PW
  securite1@transfood.tn    → voit quais AMT + PW
  securite2@transfood.tn    → voit quais MCSR
`);
    await app.close();
}
bootstrap().catch((e) => { console.error(e); process.exit(1); });
//# sourceMappingURL=seed-quais-test.js.map