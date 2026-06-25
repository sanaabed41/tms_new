/**
 * Seeder — Test de la gestion des quais (dédiés + génériques)
 *
 * Démontre tous lesétats de la gestion des quais avec les nouveaux comptes :
 *   magasinier1@transfood.tn  (AMT + MCSR)
 *   magasinier2@transfood.tn  (PW)
 *   securite1@transfood.tn    (AMT + PW)
 *   securite2@transfood.tn    (MCSR)
 *
 * États créés :
 *   IDLE  — 4 plans prêts à appeler (dont 2 multi-stations)
 *   CALLED + quai dédié    — QPW1, QAMT1 occupés
 *   CALLED + quai générique — Quai 1 occupé
 *   ENTERED/WAITING        — QMCSR1, Quai 2 occupés
 *   ENTERED/IN_PROGRESS    — QAMT2, QPW2 occupés
 *   DONE/EXITED            — 2 plans terminés (libèrent leurs quais)
 *
 * Prérequis : npm run seed:pb && npm run seed:full
 * Lancer    : npm run seed:quais
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './companies/company.entity';
import { Truck } from './trucks/truck.entity';
import { Article } from './articles/article.entity';
import { BonLivraison, TypeChargement } from './bons-livraison/bon-livraison.entity';
import { BlArticle } from './bons-livraison/bl-article.entity';
import { LoadingPlan } from './loading-plans/loading-plan.entity';
import { SocieteExpeditrice } from './expediteurs/societe-expeditrice.entity';
import { Filiere } from './expediteurs/filiere.entity';
import { User } from './users/user.entity';
import { BlStatus } from './common/enums/bl-status.enum';

const TODAY = new Date().toISOString().split('T')[0];
let BL_SEQ = 900; // numéro de départ pouréviter les conflits

function nextBl() { return `BL-QT-${String(++BL_SEQ).padStart(4, '0')}`; }
function ref()     { return `PC-QT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });

  const companyRepo  = app.get<Repository<Company>>(getRepositoryToken(Company));
  const truckRepo    = app.get<Repository<Truck>>(getRepositoryToken(Truck));
  const articleRepo  = app.get<Repository<Article>>(getRepositoryToken(Article));
  const blRepo       = app.get<Repository<BonLivraison>>(getRepositoryToken(BonLivraison));
  const blArticleRepo= app.get<Repository<BlArticle>>(getRepositoryToken(BlArticle));
  const planRepo     = app.get<Repository<LoadingPlan>>(getRepositoryToken(LoadingPlan));
  const societeRepo  = app.get<Repository<SocieteExpeditrice>>(getRepositoryToken(SocieteExpeditrice));
  const filiereRepo  = app.get<Repository<Filiere>>(getRepositoryToken(Filiere));
  const userRepo     = app.get<Repository<User>>(getRepositoryToken(User));

  // ── 1. Lookup company ──────────────────────────────────────────────────────
  const company = await companyRepo.findOne({ where: { nom: 'TransFood' } });
  if (!company) { console.error('❌ TransFood introuvable'); await app.close(); return; }

  // ── 2. Lookup filières AMT / MCSR / PW ────────────────────────────────────
  const filAMT  = await filiereRepo.findOne({ where: { code: 'AMT'  } });
  const filMCSR = await filiereRepo.findOne({ where: { code: 'MCSR' } });
  const filPW   = await filiereRepo.findOne({ where: { code: 'PW'   } });
  if (!filAMT || !filMCSR || !filPW) {
    console.error('❌ Filières AMT/MCSR/PW introuvables — lancez npm run seed:pb');
    await app.close(); return;
  }

  // ── 3. Lookup société Rose Blanche ────────────────────────────────────────
  const roseBlanche = await societeRepo.findOne({ where: { nom: 'Rose Blanche' } });
  if (!roseBlanche) { console.error('❌ Rose Blanche introuvable'); await app.close(); return; }

  // ── 4. Lookup trucks (créés par seed:pb) ──────────────────────────────────
  const trucksByMatricule: Record<string, Truck> = {};
  const allTrucks = await truckRepo.find();
  for (const t of allTrucks) trucksByMatricule[t.matricule] = t;

  const trucks = ['PB-SFR-001','PB-SFR-002','PB-SFR-003','PB-SFR-004',
                  'PB-TEX-001','PB-TEX-002','PB-MGT-001','PB-MGT-002','PB-MGT-003']
    .map((m) => trucksByMatricule[m])
    .filter(Boolean);

  if (trucks.length === 0) {
    console.error('❌ Aucun camion trouvé — lancez npm run seed:pb');
    await app.close(); return;
  }
  console.log(`✅ ${trucks.length} camions chargés`);

  // ── 5. Lookup quelques articles par code ──────────────────────────────────
  const art = async (code: string) => articleRepo.findOne({ where: { code } });

  const artAMT  = await art('AMT-SPG-500') || await art('AMT-MAC-500');
  const artMCSR = await art('MCSR-SG-1KG')  || await art('MCSR-SF-1KG');
  const artPW   = await art('PW-SPG-500')  || await art('PW-MAC-500');

  // ── 6. Lookup validating user (company admin) ─────────────────────────────
  const admin = await userRepo.findOne({ where: { email: 'admin@transfood.tn' } })
    ?? await userRepo.findOne({ where: { company: { id: company.id } } });

  // ── Helpers ────────────────────────────────────────────────────────────────

  const makeBl = async (params: {
    filiere: Filiere;
    dest: string;
    client: string;
    tonnage: number;
    palettes: number;
    ordre: number;
    article?: Article | null;
  }) => {
    const bl = blRepo.create({
      numeroBl: nextBl(),
      clientNom: params.client,
      clientAdresse: '',
      origine: 'Usine Rose Blanche',
      destination: params.dest,
      typeChargement: TypeChargement.PALETTE,
      tonnageTotal: params.tonnage,
      nombrePalettes: params.palettes,
      statut: BlStatus.VALIDATED,
      datelivraison: TODAY,
      societeExpeditrice: { id: roseBlanche.id } as any,
      filiere: { id: params.filiere.id } as any,
      company: { id: company.id } as any,
      ordreChargement: params.ordre,
    });
    const saved = await blRepo.save(bl);
    if (params.article) {
      await blArticleRepo.save(blArticleRepo.create({
        bonLivraison: { id: saved.id } as any,
        article: { id: params.article.id } as any,
        quantite: Math.round(params.tonnage * 2000),
        poidsTotal: params.tonnage,
      }));
    }
    return saved;
  };

  const makePlan = async (params: {
    truck: Truck;
    bls: BonLivraison[];
    entryStatus: string;
    loadingStatus: string;
    quai?: string;
    stationsSequence?: string[];
    currentStation?: string;
    currentStationIdx?: number;
    elapsedSeconds?: number;
    startedSecsAgo?: number;
    heureArrivee?: string;
    isValidated?: boolean;
  }) => {
    const plan = planRepo.create({
      reference: ref(),
      dateLivraison: TODAY,
      truck: { id: params.truck.id } as any,
      bonsLivraison: params.bls.map((b) => ({ id: b.id })) as any,
      tonnageCharge: params.bls.reduce((s, b) => s + Number(b.tonnageTotal), 0),
      palettesChargees: params.bls.reduce((s, b) => s + (b.nombrePalettes ?? 0), 0),
      isValidated: params.isValidated ?? true,
      entryStatus: params.entryStatus as any,
      loadingStatus: params.loadingStatus as any,
      quai: params.quai ?? null,
      stationsSequence: params.stationsSequence ?? null,
      currentStation: params.currentStation ?? null,
      currentStationIdx: params.currentStationIdx ?? 0,
      loadingElapsedSeconds: params.elapsedSeconds ?? 0,
      loadingStartedAt: params.startedSecsAgo
        ? new Date(Date.now() - params.startedSecsAgo * 1000) as any
        : null,
      heureArrivee: params.heureArrivee ?? null,
      validatedBy: admin ? { id: admin.id } as any : undefined,
    } as any);

    const saved = await planRepo.save(plan) as unknown as LoadingPlan;

    // Lier les BLs au plan
    await Promise.all(params.bls.map((bl) =>
      blRepo.query(
        `UPDATE bons_livraison SET statut = $1, "loadingPlanId" = $2 WHERE id = $3`,
        [BlStatus.LOADED, saved.id, bl.id],
      ),
    ));

    return saved;
  };

  // ── 7. Purge plans QT de today pour idempotence ───────────────────────────
  const existing = await planRepo
    .createQueryBuilder('lp')
    .where('lp.reference LIKE :prefix', { prefix: 'PC-QT-%' })
    .andWhere('lp.dateLivraison = :date', { date: TODAY })
    .getMany();
  for (const lp of existing) {
    await blRepo.query(`UPDATE bons_livraison SET statut = $1, "loadingPlanId" = NULL, "ordreChargement" = NULL WHERE "loadingPlanId" = $2`,
      [BlStatus.VALIDATED, lp.id]);
    await planRepo.delete(lp.id);
  }
  if (existing.length) console.log(`  ↩  ${existing.length} ancien(s) plan(s) QT supprimés`);

  // ══════════════════════════════════════════════════════════════════════════
  // PLAN 1 — IDLE : AMT → MCSR (2 stations) — truck 0
  // Magasinier pourra le glisser et choisir QAMT ou quai générique
  // ══════════════════════════════════════════════════════════════════════════
  {
    const bl1 = await makeBl({ filiere: filAMT!,  dest: 'Sfax',    client: 'Épicerie Sfax',    tonnage: 6, palettes: 10, ordre: 1, article: artAMT });
    const bl2 = await makeBl({ filiere: filMCSR!, dest: 'Sfax',    client: 'Moulin Sfax',      tonnage: 8, palettes: 0,  ordre: 2, article: artMCSR });
    await makePlan({ truck: trucks[0], bls: [bl1, bl2], entryStatus: 'IDLE', loadingStatus: 'WAITING', heureArrivee: '07:00' });
    console.log('  ✚  Plan 1 — IDLE   AMT→MCSR  [truck 0]  heureArrivée 07:00');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PLAN 2 — IDLE : PW → AMT (2 stations) — truck 1
  // ══════════════════════════════════════════════════════════════════════════
  {
    const bl1 = await makeBl({ filiere: filPW!,   dest: 'Sousse',  client: 'Carrefour Sousse', tonnage: 5, palettes: 8,  ordre: 1, article: artPW   });
    const bl2 = await makeBl({ filiere: filAMT!,  dest: 'Nabeul',  client: 'Grossiste Nabeul', tonnage: 4, palettes: 6,  ordre: 2, article: artAMT  });
    await makePlan({ truck: trucks[1], bls: [bl1, bl2], entryStatus: 'IDLE', loadingStatus: 'WAITING', heureArrivee: '07:30' });
    console.log('  ✚  Plan 2 — IDLE   PW→AMT    [truck 1]  heureArrivée 07:30');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PLAN 3 — IDLE : MCSR uniquement — truck 2
  // ══════════════════════════════════════════════════════════════════════════
  {
    const bl1 = await makeBl({ filiere: filMCSR!, dest: 'Monastir', client: 'Minoterie Monastir', tonnage: 10, palettes: 0,  ordre: 1, article: artMCSR });
    const bl2 = await makeBl({ filiere: filMCSR!, dest: 'Mahdia',   client: 'Moulin Mahdia',      tonnage: 8,  palettes: 0,  ordre: 2, article: artMCSR });
    await makePlan({ truck: trucks[2], bls: [bl1, bl2], entryStatus: 'IDLE', loadingStatus: 'WAITING', heureArrivee: '08:00' });
    console.log('  ✚  Plan 3 — IDLE   MCSR      [truck 2]  heureArrivée 08:00');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PLAN 4 — IDLE : AMT → MCSR → PW (3 stations) — truck 3
  // ══════════════════════════════════════════════════════════════════════════
  {
    const bl1 = await makeBl({ filiere: filAMT!,  dest: 'Bizerte', client: 'GMS Bizerte',     tonnage: 4,  palettes: 6,  ordre: 1, article: artAMT  });
    const bl2 = await makeBl({ filiere: filMCSR!, dest: 'Béja',    client: 'Silos Béja',      tonnage: 6,  palettes: 0,  ordre: 2, article: artMCSR });
    const bl3 = await makeBl({ filiere: filPW!,   dest: 'Jendouba',client: 'Distrib Jendouba',tonnage: 3,  palettes: 4,  ordre: 3, article: artPW   });
    await makePlan({ truck: trucks[3], bls: [bl1, bl2, bl3], entryStatus: 'IDLE', loadingStatus: 'WAITING', heureArrivee: '08:30' });
    console.log('  ✚  Plan 4 — IDLE   AMT→MCSR→PW [truck 3] heureArrivée 08:30');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PLAN 5 — CALLED + quai dédié QPW1 (PW) — truck 4
  // Montre QPW1 occupé dans le modal de sélection
  // ══════════════════════════════════════════════════════════════════════════
  {
    const bl1 = await makeBl({ filiere: filPW!, dest: 'Tunis',  client: 'Hypermarché Tunis',  tonnage: 8, palettes: 12, ordre: 1, article: artPW });
    const bl2 = await makeBl({ filiere: filPW!, dest: 'Ariana', client: 'Supermarché Ariana', tonnage: 4, palettes: 6,  ordre: 2, article: artPW });
    await makePlan({
      truck: trucks[4], bls: [bl1, bl2],
      entryStatus: 'CALLED', loadingStatus: 'WAITING',
      quai: 'QPW1',
      stationsSequence: ['PW'], currentStation: 'PW', currentStationIdx: 0,
      heureArrivee: '07:00',
    });
    console.log('  ✚  Plan 5 — CALLED QPW1      [truck 4]  → attente autorisation sécu');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PLAN 6 — CALLED + quai dédié QAMT1 (AMT) — truck 5
  // ══════════════════════════════════════════════════════════════════════════
  {
    const bl1 = await makeBl({ filiere: filAMT!, dest: 'Kairouan', client: 'GMS Kairouan',    tonnage: 9, palettes: 14, ordre: 1, article: artAMT });
    const bl2 = await makeBl({ filiere: filAMT!, dest: 'Kasserine',client: 'Distrib Kasserine',tonnage: 5, palettes: 8, ordre: 2, article: artAMT });
    await makePlan({
      truck: trucks[5], bls: [bl1, bl2],
      entryStatus: 'CALLED', loadingStatus: 'WAITING',
      quai: 'QAMT1',
      stationsSequence: ['AMT'], currentStation: 'AMT', currentStationIdx: 0,
      heureArrivee: '07:15',
    });
    console.log('  ✚  Plan 6 — CALLED QAMT1     [truck 5]  → attente autorisation sécu');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PLAN 7 — CALLED + quai générique Quai 1 (société sans quais dédiés) — truck 6
  // ══════════════════════════════════════════════════════════════════════════
  {
    const bl1 = await makeBl({ filiere: filMCSR!, dest: 'Gabès', client: 'Moulin Gabès',  tonnage: 12, palettes: 0, ordre: 1, article: artMCSR });
    await makePlan({
      truck: trucks[6], bls: [bl1],
      entryStatus: 'CALLED', loadingStatus: 'WAITING',
      quai: 'Quai 1',
      stationsSequence: ['MCSR'], currentStation: 'MCSR', currentStationIdx: 0,
      heureArrivee: '07:30',
    });
    console.log('  ✚  Plan 7 — CALLED Quai 1    [truck 6]  → quai générique occupé');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PLAN 8 — ENTERED/WAITING + quai dédié QMCSR1 — truck 7
  // Sécu a autorisé l'entrée — magasinier peut démarrer
  // ══════════════════════════════════════════════════════════════════════════
  {
    const bl1 = await makeBl({ filiere: filMCSR!, dest: 'Médenine', client: 'Silo Médenine',  tonnage: 10, palettes: 0, ordre: 1, article: artMCSR });
    const bl2 = await makeBl({ filiere: filMCSR!, dest: 'Tataouine',client: 'Coop Tataouine', tonnage: 8,  palettes: 0, ordre: 2, article: artMCSR });
    await makePlan({
      truck: trucks[7], bls: [bl1, bl2],
      entryStatus: 'ENTERED', loadingStatus: 'WAITING',
      quai: 'QMCSR1',
      stationsSequence: ['MCSR'], currentStation: 'MCSR', currentStationIdx: 0,
      heureArrivee: '06:45',
    });
    console.log('  ✚  Plan 8 — ENTERED/WAITING  QMCSR1     [truck 7] → prêt à démarrer');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PLAN 9 — ENTERED/WAITING + quai générique Quai 2 — truck 8
  // ══════════════════════════════════════════════════════════════════════════
  {
    const bl1 = await makeBl({ filiere: filPW!, dest: 'Le Kef',  client: 'Grossiste Le Kef',  tonnage: 6, palettes: 8, ordre: 1, article: artPW });
    const bl2 = await makeBl({ filiere: filAMT!,dest: 'Siliana', client: 'Épicerie Siliana',  tonnage: 4, palettes: 6, ordre: 2, article: artAMT });
    await makePlan({
      truck: trucks[0], bls: [bl1, bl2],   // réutilise truck[0] truck différent slot
      entryStatus: 'ENTERED', loadingStatus: 'WAITING',
      quai: 'Quai 2',
      stationsSequence: ['PW', 'AMT'], currentStation: 'PW', currentStationIdx: 0,
      heureArrivee: '06:30',
    });
    console.log('  ✚  Plan 9 — ENTERED/WAITING  Quai 2     [truck 8] → prêt à démarrer (2 stations)');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PLAN 10 — IN_PROGRESS + quai dédié QAMT2 — truck 1 (2ème plan)
  // Chargement AMT en cours depuis 8 min
  // ══════════════════════════════════════════════════════════════════════════
  {
    const bl1 = await makeBl({ filiere: filAMT!, dest: 'Gafsa',  client: 'GMS Gafsa',         tonnage: 7,  palettes: 10, ordre: 1, article: artAMT });
    const bl2 = await makeBl({ filiere: filAMT!, dest: 'Tozeur', client: 'Coopérative Tozeur', tonnage: 5,  palettes: 8,  ordre: 2, article: artAMT });
    await makePlan({
      truck: trucks[1], bls: [bl1, bl2],
      entryStatus: 'ENTERED', loadingStatus: 'IN_PROGRESS',
      quai: 'QAMT2',
      stationsSequence: ['AMT'], currentStation: 'AMT', currentStationIdx: 0,
      elapsedSeconds: 120, startedSecsAgo: 360,   // 2 min sauvegardées + 6 min en cours
      heureArrivee: '06:00',
    });
    console.log('  ✚  Plan 10 — IN_PROGRESS     QAMT2      [truck 1] → chargement AMT en cours');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PLAN 11 — IN_PROGRESS + quai dédié QPW2 — truck 2 (2ème plan)
  // Chargement PW en cours depuis 5 min
  // ══════════════════════════════════════════════════════════════════════════
  {
    const bl1 = await makeBl({ filiere: filPW!, dest: 'Kébili', client: 'Épicerie Kébili',   tonnage: 4, palettes: 6, ordre: 1, article: artPW });
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

  // ══════════════════════════════════════════════════════════════════════════
  // PLAN 12 — PAUSED + quai dédié QMCSR2 — truck 3 (2ème plan)
  // ══════════════════════════════════════════════════════════════════════════
  {
    const bl1 = await makeBl({ filiere: filMCSR!, dest: 'Zaghouan', client: 'Silo Zaghouan', tonnage: 9, palettes: 0, ordre: 1, article: artMCSR });
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

  // ══════════════════════════════════════════════════════════════════════════
  // PLAN 13 — DONE/EXITED + quai libéré (QPW3était utilisé)
  // Le quai QPW3 est maintenant LIBRE (EXITED libère le quai)
  // ══════════════════════════════════════════════════════════════════════════
  {
    const bl1 = await makeBl({ filiere: filPW!, dest: 'Tunis', client: 'Hypermarché Lac',  tonnage: 6, palettes: 8, ordre: 1, article: artPW });
    const plan = planRepo.create({
      reference: ref(),
      dateLivraison: TODAY,
      truck: { id: trucks[4].id } as any,
      bonsLivraison: [],
      tonnageCharge: 6,
      palettesChargees: 8,
      isValidated: true,
      entryStatus: 'EXITED' as any,
      loadingStatus: 'DONE' as any,
      quai: 'QPW3',
      stationsSequence: ['PW'],
      currentStation: null as any,
      currentStationIdx: 1,
      loadingElapsedSeconds: 1540,
      loadingStartedAt: null as any,
      heureArrivee: '05:00',
      validatedBy: admin ? { id: admin.id } as any : undefined,
    } as any);
    const savedPlan = await planRepo.save(plan) as unknown as LoadingPlan;
    await blRepo.query(
      `UPDATE bons_livraison SET statut = $1, "loadingPlanId" = $2 WHERE id = $3`,
      [BlStatus.LOADED, savedPlan.id, bl1.id],
    );
    console.log('  ✚  Plan 13 — DONE/EXITED     QPW3 libre [truck 4] → terminé (QPW3 libéré)');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PLAN 14 — DONE/EXITED + Quai 3 libéré (générique)
  // ══════════════════════════════════════════════════════════════════════════
  {
    const bl1 = await makeBl({ filiere: filAMT!, dest: 'Sousse', client: 'Magasin Général Sousse', tonnage: 5, palettes: 8, ordre: 1, article: artAMT });
    const plan = planRepo.create({
      reference: ref(),
      dateLivraison: TODAY,
      truck: { id: trucks[5].id } as any,
      bonsLivraison: [],
      tonnageCharge: 5,
      palettesChargees: 8,
      isValidated: true,
      entryStatus: 'EXITED' as any,
      loadingStatus: 'DONE' as any,
      quai: 'Quai 3',
      stationsSequence: ['AMT'],
      currentStation: null as any,
      currentStationIdx: 1,
      loadingElapsedSeconds: 820,
      loadingStartedAt: null as any,
      heureArrivee: '05:15',
      validatedBy: admin ? { id: admin.id } as any : undefined,
    } as any);
    const savedPlan = await planRepo.save(plan) as unknown as LoadingPlan;
    await blRepo.query(
      `UPDATE bons_livraison SET statut = $1, "loadingPlanId" = $2 WHERE id = $3`,
      [BlStatus.LOADED, savedPlan.id, bl1.id],
    );
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
