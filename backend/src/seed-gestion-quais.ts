/**
 * Seeder — Test Gestion des Quais (interface magasinier)
 * =======================================================
 * Couvre TOUS lesétats testables de la page interactive.
 *
 *  mag1@roseblanche.tn (filières MCSR + AMT)
 *  ─────────────────────────────────────────
 *  Q-MCSR-1  ○ LIBRE        → zone de dépôt (drag MCSR ou multi-filière ici)
 *  Q-MCSR-2  ○ Occupé       → truck ENTERED + WAITING  → bouton "Démarrer"
 *  Q-MCSR-3  ● En cours     → truck ENTERED + IN_PROGRESS → timer 45 min + Pause + Terminer
 *  Q-AMT-1  ● En cours     → truck ENTERED + IN_PROGRESS → timer 2h + Pause + Terminer
 *  Q-AMT-2  ≈ En pause     → truck ENTERED + PAUSED   → timer figé 30 min + Reprendre + Terminer
 *  Q-AMT-3  ✗ Bloqué       → isActive = false
 *
 *  Panel camions mag1 (liste gauche, 9 trucks) :
 *    #1  multi-filière MCSR+AMT  IDLE/WAITING  → draggable → Q-MCSR-1 ✓  Q-AMT (bloqué/occupé)
 *    #2  MCSR seule              CALLED/WAITING → draggable (statut "Appelé") → Q-MCSR-1 ✓
 *    #3  AMT seule              IDLE/WAITING  → draggable → Q-MCSR-1 "Filière incompatible" ✗
 *    #4  MCSR+AMT                ENTERED/WAITING  at Q-MCSR-2 → "Au quai" → Démarrer
 *    #5  MCSR                    ENTERED/IN_PROGRESS at Q-MCSR-3 → timer 45 min
 *    #6  AMT                    ENTERED/IN_PROGRESS at Q-AMT-1 → timer 2h
 *    #7  AMT                    ENTERED/PAUSED at Q-AMT-2 → timer figé 30 min
 *    #8  MCSR                    EXITED/DONE   → durée finale 1h20 affichée
 *    #9  AMT                    EXITED/DONE   → durée finale 45 min affichée
 *
 *  mag2@roseblanche.tn (filière PW)
 *  ──────────────────────────────────
 *  Q-PW-1   ● En cours     → truck ENTERED + IN_PROGRESS → timer 1h
 *  Q-PW-2   ○ LIBRE        → zone de dépôt (drag PW ici)
 *
 *  Panel camions mag2 (3 trucks) :
 *    #10 PW  ENTERED/IN_PROGRESS at Q-PW-1 → timer 1h
 *    #11 PW  IDLE/WAITING       → draggable → Q-PW-2 ✓  Q-MCSR-1 "Filière incompatible" ✗
 *    #12 PW  EXITED/DONE        → durée finale 35 min affichée
 *
 * Pré-requis : npm run seed:rb-complet
 * Lancer     : cd backend && npm run seed:gestion-quais
 *
 * Comptes (mot de passe : Demo123!) :
 *   mag1@roseblanche.tn  (MCSR + AMT)
 *   mag2@roseblanche.tn  (PW)
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ObjectLiteral } from 'typeorm';
import { Company }             from './companies/company.entity';
import { User }                from './users/user.entity';
import { SocieteExpeditrice }  from './expediteurs/societe-expeditrice.entity';
import { Filiere }             from './expediteurs/filiere.entity';
import { Quai }                from './quais/quai.entity';
import { BonLivraison, TypeChargement } from './bons-livraison/bon-livraison.entity';
import { LoadingPlan }         from './loading-plans/loading-plan.entity';
import { Truck }               from './trucks/truck.entity';
import { BlStatus }            from './common/enums/bl-status.enum';

// ── Helpers ───────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().split('T')[0];
}
function minutesAgo(n: number): Date {
  return new Date(Date.now() - n * 60 * 1000);
}
function hoursAgo(n: number): Date {
  return new Date(Date.now() - n * 60 * 60 * 1000);
}

async function findOrFail<T extends ObjectLiteral>(
  repo: Repository<T>,
  where: Partial<T>,
  label: string,
): Promise<T> {
  const e = await repo.findOne({ where: where as any });
  if (!e) throw new Error(`${label} introuvable — lancez d'abord: npm run seed:rb-complet`);
  return e;
}

async function upsertPlan(
  repo: Repository<LoadingPlan>,
  reference: string,
  data: Partial<LoadingPlan>,
): Promise<LoadingPlan> {
  const found = await repo.findOne({ where: { reference } as any });
  if (found) {
    Object.assign(found, data);
    return repo.save(found) as unknown as LoadingPlan;
  }
  return repo.save(repo.create({ reference, ...data } as any)) as unknown as LoadingPlan;
}

async function upsertBl(
  repo: Repository<BonLivraison>,
  numeroBl: string,
  data: Partial<BonLivraison>,
): Promise<BonLivraison> {
  const found = await repo.findOne({ where: { numeroBl } as any });
  if (found) {
    Object.assign(found, data);
    return repo.save(found) as unknown as BonLivraison;
  }
  return repo.save(repo.create({ numeroBl, ...data } as any)) as unknown as BonLivraison;
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });

  const companyRepo = app.get<Repository<Company>>(getRepositoryToken(Company));
  const userRepo    = app.get<Repository<User>>(getRepositoryToken(User));
  const societeRepo = app.get<Repository<SocieteExpeditrice>>(getRepositoryToken(SocieteExpeditrice));
  const filiereRepo = app.get<Repository<Filiere>>(getRepositoryToken(Filiere));
  const quaiRepo    = app.get<Repository<Quai>>(getRepositoryToken(Quai));
  const blRepo      = app.get<Repository<BonLivraison>>(getRepositoryToken(BonLivraison));
  const planRepo    = app.get<Repository<LoadingPlan>>(getRepositoryToken(LoadingPlan));
  const truckRepo   = app.get<Repository<Truck>>(getRepositoryToken(Truck));

  // ── Entités de base ───────────────────────────────────────────────────────

  console.log('\n[1/5] Entités de base…');

  const transfood   = await findOrFail(companyRepo,  { nom: 'TransFood  ' } as any,      'TransFood  ');
  const companyAdmin = await findOrFail(userRepo,    { email: 'logistique@transfood.tn' } as any, 'logistique@transfood.tn');
  const societe     = await findOrFail(societeRepo,  { nom: 'Rose Blanche' } as any,       'Société Rose Blanche');
  const filMCR      = await findOrFail(filiereRepo,  { code: 'MCSR' } as any,               'Filière MCSR');
  const filAMT      = await findOrFail(filiereRepo,  { code: 'AMT' } as any,               'Filière AMT');
  const filPW       = await findOrFail(filiereRepo,  { code: 'PW'  } as any,               'Filière PW');

  const qMCR1 = await findOrFail(quaiRepo, { nom: 'Q-MCSR-1' } as any, 'Q-MCSR-1');
  const qMCR2 = await findOrFail(quaiRepo, { nom: 'Q-MCSR-2' } as any, 'Q-MCSR-2');
  const qMCR3 = await findOrFail(quaiRepo, { nom: 'Q-MCSR-3' } as any, 'Q-MCSR-3');
  const qAMT1 = await findOrFail(quaiRepo, { nom: 'Q-AMT-1' } as any, 'Q-AMT-1');
  const qAMT2 = await findOrFail(quaiRepo, { nom: 'Q-AMT-2' } as any, 'Q-AMT-2');
  const qAMT3 = await findOrFail(quaiRepo, { nom: 'Q-AMT-3' } as any, 'Q-AMT-3');
  const qPW1  = await findOrFail(quaiRepo, { nom: 'Q-PW-1'  } as any, 'Q-PW-1');
  const qPW2  = await findOrFail(quaiRepo, { nom: 'Q-PW-2'  } as any, 'Q-PW-2');

  const trucks = await truckRepo.find({ order: { matricule: 'ASC' }, take: 12 });
  if (trucks.length < 12) throw new Error('Pas assez de camions (besoin de 12) — lancez seed:rb-complet');

  console.log('  ✓ Filières MCSR / AMT / PW');
  console.log(`  ✓ ${trucks.length} camions trouvés`);
  console.log('  ✓ 8 quais trouvés');

  // ── Reset : libérer les quais de conflitséventuels ───────────────────────

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
      quai:                undefined,
      entryStatus:         'IDLE'    as any,
      loadingStatus:       'WAITING' as any,
      loadingStartedAt:    undefined as any,
      loadingElapsedSeconds: 0,
    });
  }
  console.log(`  ✓ ${conflicts.length} plan(s) conflictuel(s) réinitialisé(s)`);

  // Q-AMT-3 → Bloqué ; tous les autres → actifs
  await quaiRepo.update(qAMT3.id, { isActive: false });
  for (const q of [qMCR1, qMCR2, qMCR3, qAMT1, qAMT2, qPW1, qPW2]) {
    await quaiRepo.update(q.id, { isActive: true });
  }
  console.log('  ✓ Q-AMT-3 → Bloqué  |  autres quais → Actifs');

  // ── Plans de chargement ───────────────────────────────────────────────────

  const DATE = today();
  console.log(`\n[3/5] Plans de chargement pour le ${DATE}…`);

  const base = {
    dateLivraison:       DATE as any,
    isValidated:         true,
    validatedBy:         companyAdmin,
    logistiqueCompanyId: transfood.id,
    signature:           'sig_gq_demo',
  };

  // ──────────── Camions draggables (panneau gauche) ─────────────────────────

  // #1 : Multi-filière MCSR+AMT — IDLE/WAITING → draggable, compatible Q-MCSR-1 ET tout AMT libre
  const p1 = await upsertPlan(planRepo, 'GQ-MULTI-W', {
    ...base, truck: trucks[0], heureArrivee: '08:30',
    entryStatus: 'IDLE', loadingStatus: 'WAITING',
    quai: null as any, tonnageCharge: 0, palettesChargees: 0,
  } as any);

  // #2 : MCSR seule — CALLED/WAITING → draggable (statut "Appelé"), compatible Q-MCSR-1 uniquement
  const p2 = await upsertPlan(planRepo, 'GQ-MCSR-CL', {
    ...base, truck: trucks[1], heureArrivee: '09:00',
    entryStatus: 'CALLED', loadingStatus: 'WAITING',
    quai: null as any, tonnageCharge: 0, palettesChargees: 0,
  } as any);

  // #3 : AMT seule — IDLE/WAITING → draggable MAIS incompatible avec Q-MCSR-1 (test filière ✗)
  const p3 = await upsertPlan(planRepo, 'GQ-AMT-W', {
    ...base, truck: trucks[2], heureArrivee: '09:30',
    entryStatus: 'IDLE', loadingStatus: 'WAITING',
    quai: null as any, tonnageCharge: 0, palettesChargees: 0,
  } as any);

  // ──────────── Camions au quai (pas draggables) ────────────────────────────

  // #4 : MCSR+AMT — ENTERED/WAITING at Q-MCSR-2 → bouton "Démarrer"
  const p4 = await upsertPlan(planRepo, 'GQ-MCSR-AU', {
    ...base, truck: trucks[3], heureArrivee: '07:30',
    entryStatus: 'ENTERED', loadingStatus: 'WAITING',
    quai: qMCR2.nom, tonnageCharge: 0, palettesChargees: 18,
  } as any);

  // #5 : MCSR — ENTERED/IN_PROGRESS at Q-MCSR-3 → timer 45 min + Pause + Terminer
  const p5 = await upsertPlan(planRepo, 'GQ-MCSR-IP', {
    ...base, truck: trucks[4], heureArrivee: '06:15',
    entryStatus: 'ENTERED', loadingStatus: 'IN_PROGRESS',
    quai: qMCR3.nom, tonnageCharge: 18.5, palettesChargees: 22,
    loadingStartedAt: minutesAgo(45) as any,
    loadingElapsedSeconds: 0,
  } as any);

  // #6 : AMT — ENTERED/IN_PROGRESS at Q-AMT-1 → timer 2h + Pause + Terminer
  const p6 = await upsertPlan(planRepo, 'GQ-AMT-IP', {
    ...base, truck: trucks[5], heureArrivee: '04:00',
    entryStatus: 'ENTERED', loadingStatus: 'IN_PROGRESS',
    quai: qAMT1.nom, tonnageCharge: 38.0, palettesChargees: 0,
    loadingStartedAt: hoursAgo(2) as any,
    loadingElapsedSeconds: 0,
  } as any);

  // #7 : AMT — ENTERED/PAUSED at Q-AMT-2 → timer figé 30 min + Reprendre + Terminer
  const p7 = await upsertPlan(planRepo, 'GQ-AMT-PA', {
    ...base, truck: trucks[6], heureArrivee: '05:00',
    entryStatus: 'ENTERED', loadingStatus: 'PAUSED',
    quai: qAMT2.nom, tonnageCharge: 12.0, palettesChargees: 0,
    loadingStartedAt: null as any,
    loadingElapsedSeconds: 1800, // 30 min
  } as any);

  // ──────────── Camions terminés ────────────────────────────────────────────

  // #8 : MCSR — EXITED/DONE → durée finale 1h20 (4800s) affichée
  const p8 = await upsertPlan(planRepo, 'GQ-MCSR-DO', {
    ...base, truck: trucks[7], heureArrivee: '03:00',
    entryStatus: 'EXITED', loadingStatus: 'DONE',
    quai: null as any, tonnageCharge: 22.0, palettesChargees: 0,
    loadingStartedAt: null as any,
    loadingElapsedSeconds: 4800, // 1h 20min
  } as any);

  // #9 : AMT — EXITED/DONE → durée finale 45 min (2700s) affichée
  const p9 = await upsertPlan(planRepo, 'GQ-AMT-DO', {
    ...base, truck: trucks[8], heureArrivee: '03:30',
    entryStatus: 'EXITED', loadingStatus: 'DONE',
    quai: null as any, tonnageCharge: 30.5, palettesChargees: 0,
    loadingStartedAt: null as any,
    loadingElapsedSeconds: 2700, // 45 min
  } as any);

  // ──────────── Plans visibles par mag2 (PW) ────────────────────────────────

  // #10 : PW — ENTERED/IN_PROGRESS at Q-PW-1 → timer 1h
  const p10 = await upsertPlan(planRepo, 'GQ-PW-IP', {
    ...base, truck: trucks[9], heureArrivee: '05:30',
    entryStatus: 'ENTERED', loadingStatus: 'IN_PROGRESS',
    quai: qPW1.nom, tonnageCharge: 28.0, palettesChargees: 24,
    loadingStartedAt: hoursAgo(1) as any,
    loadingElapsedSeconds: 0,
  } as any);

  // #11 : PW — IDLE/WAITING → draggable → Q-PW-2 ✓ / Q-MCSR-1 "Filière incompatible" ✗
  const p11 = await upsertPlan(planRepo, 'GQ-PW-W', {
    ...base, truck: trucks[10], heureArrivee: '10:00',
    entryStatus: 'IDLE', loadingStatus: 'WAITING',
    quai: null as any, tonnageCharge: 0, palettesChargees: 0,
  } as any);

  // #12 : PW — EXITED/DONE → durée finale 35 min (2100s) affichée
  const p12 = await upsertPlan(planRepo, 'GQ-PW-DO', {
    ...base, truck: trucks[11], heureArrivee: '04:15',
    entryStatus: 'EXITED', loadingStatus: 'DONE',
    quai: null as any, tonnageCharge: 15.5, palettesChargees: 16,
    loadingStartedAt: null as any,
    loadingElapsedSeconds: 2100, // 35 min
  } as any);

  console.log('  ✓ 12 plans créés / mis à jour');

  // ── Bons de livraison ─────────────────────────────────────────────────────

  console.log('\n[4/5] Bons de livraison…');

  const blBase = {
    societeExpeditrice: societe,
    company:            transfood,
    datelivraison:      DATE as any,
    origine:            'Béja',
  };

  // ─── p1 : multi-filière MCSR + AMT (test drag vers quai MCSR ou AMT)
  await upsertBl(blRepo, 'BL-GQ-MULTI-MCSR', {
    ...blBase, loadingPlan: p1, filiere: filMCR,
    clientNom: 'SAPD Distribution', destination: 'Tunis',
    typeChargement: TypeChargement.FRIGO, tonnageTotal: 12, nombrePalettes: 0,
    statut: BlStatus.VALIDATED, ordreChargement: 1,
  });
  await upsertBl(blRepo, 'BL-GQ-MULTI-AMT', {
    ...blBase, loadingPlan: p1, filiere: filAMT,
    clientNom: 'Maghrébine Aliments', destination: 'Sfax',
    typeChargement: TypeChargement.VRAC, tonnageTotal: 20, nombrePalettes: 0,
    statut: BlStatus.VALIDATED, ordreChargement: 2,
  });

  // ─── p2 : MCSR seule (CALLED)
  await upsertBl(blRepo, 'BL-GQ-MCSR-CL', {
    ...blBase, loadingPlan: p2, filiere: filMCR,
    clientNom: 'Cotupha  ', destination: 'Sousse',
    typeChargement: TypeChargement.FRIGO, tonnageTotal: 18, nombrePalettes: 0,
    statut: BlStatus.VALIDATED, ordreChargement: 1,
  });

  // ─── p3 : AMT seule (test incompatibilité filière avec quais MCSR)
  await upsertBl(blRepo, 'BL-GQ-AMT-W', {
    ...blBase, loadingPlan: p3, filiere: filAMT,
    clientNom: 'Sud Alimentaire', destination: 'Gafsa',
    typeChargement: TypeChargement.CITERNE, tonnageTotal: 32, nombrePalettes: 0,
    statut: BlStatus.VALIDATED, ordreChargement: 1,
  });

  // ─── p4 : MCSR+AMT → ENTERED/WAITING at Q-MCSR-2 (Démarrer)
  await upsertBl(blRepo, 'BL-GQ-AU-MCSR', {
    ...blBase, loadingPlan: p4, filiere: filMCR,
    clientNom: 'Béja Négoce', destination: 'Béja',
    typeChargement: TypeChargement.FRIGO, tonnageTotal: 10, nombrePalettes: 10,
    statut: BlStatus.LOADED, ordreChargement: 1,
  });
  await upsertBl(blRepo, 'BL-GQ-AU-AMT', {
    ...blBase, loadingPlan: p4, filiere: filAMT,
    clientNom: 'Société Nabeulienne', destination: 'Nabeul',
    typeChargement: TypeChargement.VRAC, tonnageTotal: 14, nombrePalettes: 8,
    statut: BlStatus.LOADED, ordreChargement: 2,
  });

  // ─── p5 : MCSR → IN_PROGRESS at Q-MCSR-3 (timer 45 min)
  await upsertBl(blRepo, 'BL-GQ-MCSR-IP1', {
    ...blBase, loadingPlan: p5, filiere: filMCR,
    clientNom: 'Kairouan Distribution', destination: 'Kairouan',
    typeChargement: TypeChargement.FRIGO, tonnageTotal: 10, nombrePalettes: 12,
    statut: BlStatus.LOADED, ordreChargement: 1,
  });
  await upsertBl(blRepo, 'BL-GQ-MCSR-IP2', {
    ...blBase, loadingPlan: p5, filiere: filMCR,
    clientNom: 'Monastir Trade', destination: 'Monastir',
    typeChargement: TypeChargement.PALETTE, tonnageTotal: 8.5, nombrePalettes: 10,
    statut: BlStatus.LOADED, ordreChargement: 2,
  });

  // ─── p6 : AMT → IN_PROGRESS at Q-AMT-1 (timer 2h)
  await upsertBl(blRepo, 'BL-GQ-AMT-IP1', {
    ...blBase, loadingPlan: p6, filiere: filAMT,
    clientNom: 'Maghrébine Aliments', destination: 'Sfax',
    typeChargement: TypeChargement.VRAC, tonnageTotal: 22, nombrePalettes: 0,
    statut: BlStatus.LOADED, ordreChargement: 1,
  });
  await upsertBl(blRepo, 'BL-GQ-AMT-IP2', {
    ...blBase, loadingPlan: p6, filiere: filAMT,
    clientNom: 'Distributeur Côtier', destination: 'Gabès',
    typeChargement: TypeChargement.CITERNE, tonnageTotal: 16, nombrePalettes: 0,
    statut: BlStatus.LOADED, ordreChargement: 2,
  });

  // ─── p7 : AMT → PAUSED at Q-AMT-2 (timer figé 30 min)
  await upsertBl(blRepo, 'BL-GQ-AMT-PA', {
    ...blBase, loadingPlan: p7, filiere: filAMT,
    clientNom: 'Grande Distribution', destination: 'Sousse',
    typeChargement: TypeChargement.VRAC, tonnageTotal: 28, nombrePalettes: 0,
    statut: BlStatus.LOADED, ordreChargement: 1,
  });

  // ─── p8 : MCSR → DONE (durée 1h20)
  await upsertBl(blRepo, 'BL-GQ-MCSR-DO', {
    ...blBase, loadingPlan: p8, filiere: filMCR,
    clientNom: 'SAPD Distribution', destination: 'Tunis',
    typeChargement: TypeChargement.FRIGO, tonnageTotal: 22, nombrePalettes: 0,
    statut: BlStatus.DELIVERED, ordreChargement: 1,
  });

  // ─── p9 : AMT → DONE (durée 45 min)
  await upsertBl(blRepo, 'BL-GQ-AMT-DO', {
    ...blBase, loadingPlan: p9, filiere: filAMT,
    clientNom: 'Cotupha  ', destination: 'Sousse',
    typeChargement: TypeChargement.VRAC, tonnageTotal: 30.5, nombrePalettes: 0,
    statut: BlStatus.DELIVERED, ordreChargement: 1,
  });

  // ─── p10 : PW → IN_PROGRESS at Q-PW-1 (timer 1h)
  await upsertBl(blRepo, 'BL-GQ-PW-IP1', {
    ...blBase, loadingPlan: p10, filiere: filPW,
    clientNom: 'Nord Négoce', destination: 'Bizerte',
    typeChargement: TypeChargement.PALETTE, tonnageTotal: 16, nombrePalettes: 14,
    statut: BlStatus.LOADED, ordreChargement: 1,
  });
  await upsertBl(blRepo, 'BL-GQ-PW-IP2', {
    ...blBase, loadingPlan: p10, filiere: filPW,
    clientNom: 'Société Nabeulienne', destination: 'Nabeul',
    typeChargement: TypeChargement.PALETTE, tonnageTotal: 12, nombrePalettes: 10,
    statut: BlStatus.LOADED, ordreChargement: 2,
  });

  // ─── p11 : PW → IDLE/WAITING (draggable vers Q-PW-2)
  await upsertBl(blRepo, 'BL-GQ-PW-W', {
    ...blBase, loadingPlan: p11, filiere: filPW,
    clientNom: 'Grande Distribution', destination: 'Sfax',
    typeChargement: TypeChargement.VRAC, tonnageTotal: 24, nombrePalettes: 0,
    statut: BlStatus.VALIDATED, ordreChargement: 1,
  });

  // ─── p12 : PW → DONE (durée 35 min)
  await upsertBl(blRepo, 'BL-GQ-PW-DO', {
    ...blBase, loadingPlan: p12, filiere: filPW,
    clientNom: 'Béja Négoce', destination: 'Béja',
    typeChargement: TypeChargement.PALETTE, tonnageTotal: 15.5, nombrePalettes: 16,
    statut: BlStatus.DELIVERED, ordreChargement: 1,
  });

  console.log('  ✓ 16 BLs créés / mis à jour');

  // ── Résumé ────────────────────────────────────────────────────────────────

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
