/**
 * Seeder — Test Contrôle des Entrées (interface sécurité)
 * =========================================================
 * Couvre TOUS lesétats de la nouvelle page Contrôle des Entrées.
 *
 *  Comptes test (mot de passe : Demo123!) — créés par seed:rb-complet :
 *    sec1@roseblanche.tn  (SECURITE, Rose Blanche  , filières MCSR + AMT)
 *    sec2@roseblanche.tn  (SECURITE, Rose Blanche  , filière PW)
 *
 *  Architecture :
 *    SECURITE appartient à la société expéditrice (Rose Blanche  ),
 *    pas au responsable logistique (TransFood  ).
 *    La page utilise expediteurPortalAPI.getMyPlanning() qui filtre
 *    par les filières de l'agent → sec1 voit les plans MCSR/AMT,
 *    sec2 voit les plans PW.
 *
 *  ── Légende statuts sécurité ──────────────────────────────────────────
 *  "En attente" = IDLE ou CALLED + WAITING  (camion pas encore ENTERED)
 *  "Appelé"     = ENTERED + WAITING         (glissé dans quai, Démarrer pas cliqué)
 *  "Entré"      = ENTERED + IN_PROGRESS/PAUSED (Démarrer cliqué)
 *  "Terminé"    = EXITED + DONE             (sorti)
 *
 *  ── Plans créés (12 total, tous visibles par sec1 via filières MCSR/AMT) ──
 *  EN ATTENTE
 *    CE-ATT-1  TN-111-1001  IDLE/WAITING    07:30  BLs MCSR+AMT
 *    CE-ATT-2  TN-222-2002  IDLE/WAITING    08:00  BL AMT
 *    CE-ATT-3  TN-333-3003  CALLED/WAITING  08:30  BL MCSR
 *
 *  APPELÉS
 *    CE-APP-1  TN-444-4004  ENTERED+WAITING  Q-MCSR-1  07:00  MCSR+AMT
 *    CE-APP-2  TN-555-5005  ENTERED+WAITING  Q-MCSR-2  06:30  MCSR
 *    CE-APP-3  TN-666-6006  ENTERED+WAITING  Q-AMT-1  07:15  AMT
 *
 *  ENTRÉS
 *    CE-ENT-1  TN-777-7007  ENTERED+IN_PROGRESS  Q-MCSR-3  30 min   MCSR
 *    CE-ENT-2  TN-888-8008  ENTERED+IN_PROGRESS  Q-AMT-2  1h30     AMT
 *    CE-ENT-3  TN-999-9009  ENTERED+PAUSED       Q-PW-1   45 min   MCSR+AMT
 *
 *  TERMINÉS
 *    CE-TER-1  TN-010-1010  EXITED+DONE  1h15    MCSR
 *    CE-TER-2  TN-011-1111  EXITED+DONE  50 min  AMT+MCSR
 *    CE-TER-3  TN-012-1212  EXITED+DONE  2h05    AMT
 *
 * Pré-requis : npm run seed:rb-complet
 * Lancer     : cd backend && npm run seed:controle-entrees
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ObjectLiteral } from 'typeorm';
import { Company }             from './companies/company.entity';
import { SocieteExpeditrice }  from './expediteurs/societe-expeditrice.entity';
import { Filiere }             from './expediteurs/filiere.entity';
import { Quai }                from './quais/quai.entity';
import { BonLivraison, TypeChargement } from './bons-livraison/bon-livraison.entity';
import { LoadingPlan }         from './loading-plans/loading-plan.entity';
import { Truck }               from './trucks/truck.entity';
import { BlStatus }            from './common/enums/bl-status.enum';
import { User }               from './users/user.entity';

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

  // ── [1/4] Entités de base ─────────────────────────────────────────────────

  console.log('\n[1/4] Entités de base…');

  const transfood    = await findOrFail(companyRepo,  { nom: 'TransFood  ' } as any,      'TransFood  ');
  const companyAdmin = await userRepo.findOne({ where: { email: 'logistique@transfood.tn' } });
  if (!companyAdmin) throw new Error('logistique@transfood.tn introuvable — lancez seed:rb-complet');
  const societe      = await findOrFail(societeRepo,  { nom: 'Rose Blanche' } as any,       'Société Rose Blanche');
  const filMCR       = await findOrFail(filiereRepo,  { code: 'MCSR' } as any,               'Filière MCSR');
  const filAMT       = await findOrFail(filiereRepo,  { code: 'AMT' } as any,               'Filière AMT');

  const qMCR1 = await findOrFail(quaiRepo, { nom: 'Q-MCSR-1' } as any, 'Q-MCSR-1');
  const qMCR2 = await findOrFail(quaiRepo, { nom: 'Q-MCSR-2' } as any, 'Q-MCSR-2');
  const qMCR3 = await findOrFail(quaiRepo, { nom: 'Q-MCSR-3' } as any, 'Q-MCSR-3');
  const qAMT1 = await findOrFail(quaiRepo, { nom: 'Q-AMT-1' } as any, 'Q-AMT-1');
  const qAMT2 = await findOrFail(quaiRepo, { nom: 'Q-AMT-2' } as any, 'Q-AMT-2');
  const qPW1  = await findOrFail(quaiRepo, { nom: 'Q-PW-1'  } as any, 'Q-PW-1');

  const trucks = await truckRepo.find({ order: { matricule: 'ASC' }, take: 12 });
  if (trucks.length < 12) throw new Error('Pas assez de camions (besoin de 12) — lancez seed:rb-complet');

  console.log('  ✓ TransFood   + Rose Blanche + filières MCSR / AMT');
  console.log(`  ✓ ${trucks.length} camions  |  6 quais`);
  console.log('  ℹ  Comptes test : sec1@roseblanche.tn (MCSR+AMT)  sec2@roseblanche.tn (PW)');

  // ── [2/4] Nettoyage des quais cibles ─────────────────────────────────────

  console.log('\n[2/4] Nettoyage des quais cibles…');

  const targetQuais = [qMCR1.nom, qMCR2.nom, qMCR3.nom, qAMT1.nom, qAMT2.nom, qPW1.nom];
  const conflicts = await planRepo
    .createQueryBuilder('lp')
    .where('lp.reference LIKE :pref', { pref: 'CE-%' })
    .andWhere("lp.entryStatus NOT IN ('EXITED')")
    .andWhere("lp.loadingStatus NOT IN ('DONE')")
    .getMany();

  // also free non-CE plans occupying target quais
  const quaiConflicts = await planRepo
    .createQueryBuilder('lp')
    .where('lp.quai IN (:...quais)', { quais: targetQuais })
    .andWhere("lp.entryStatus NOT IN ('EXITED')")
    .andWhere("lp.loadingStatus NOT IN ('DONE')")
    .andWhere('lp.reference NOT LIKE :pref', { pref: 'CE-%' })
    .getMany();

  for (const plan of [...conflicts, ...quaiConflicts]) {
    await planRepo.update(plan.id, {
      quai:                 undefined,
      entryStatus:          'IDLE'    as any,
      loadingStatus:        'WAITING' as any,
      loadingStartedAt:     undefined as any,
      loadingElapsedSeconds: 0,
    });
  }
  console.log(`  ✓ ${conflicts.length + quaiConflicts.length} plan(s) conflictuel(s) réinitialisé(s)`);

  // activer tous les quais utilisés
  for (const q of [qMCR1, qMCR2, qMCR3, qAMT1, qAMT2, qPW1]) {
    await quaiRepo.update(q.id, { isActive: true });
  }

  // ── [3/4] Plans de chargement ─────────────────────────────────────────────

  const DATE = today();
  console.log(`\n[3/4] Plans de chargement pour le ${DATE}…`);

  const base = {
    dateLivraison:       DATE as any,
    isValidated:         true,
    validatedBy:         companyAdmin,
    logistiqueCompanyId: transfood.id,
    signature:           'sig_ce_demo',
  };

  // ══════════════════════════════════════════════
  //  EN ATTENTE — pas encore ENTERED
  // ══════════════════════════════════════════════

  // IDLE + WAITING — camion pas encore arrivé
  const pAtt1 = await upsertPlan(planRepo, 'CE-ATT-1', {
    ...base, truck: trucks[0], heureArrivee: '07:30',
    entryStatus: 'IDLE', loadingStatus: 'WAITING',
    quai: null as any, tonnageCharge: 0, palettesChargees: 0,
  } as any);

  const pAtt2 = await upsertPlan(planRepo, 'CE-ATT-2', {
    ...base, truck: trucks[1], heureArrivee: '08:00',
    entryStatus: 'IDLE', loadingStatus: 'WAITING',
    quai: null as any, tonnageCharge: 0, palettesChargees: 0,
  } as any);

  // CALLED + WAITING — appelé mais pas encore entré
  const pAtt3 = await upsertPlan(planRepo, 'CE-ATT-3', {
    ...base, truck: trucks[2], heureArrivee: '08:30',
    entryStatus: 'CALLED', loadingStatus: 'WAITING',
    quai: null as any, tonnageCharge: 0, palettesChargees: 0,
  } as any);

  // ══════════════════════════════════════════════
  //  APPELÉS — ENTERED + WAITING
  //  (glissé dans quai par magasinier, Démarrer PAS encore cliqué)
  // ══════════════════════════════════════════════

  const pApp1 = await upsertPlan(planRepo, 'CE-APP-1', {
    ...base, truck: trucks[3], heureArrivee: '07:00',
    entryStatus: 'ENTERED', loadingStatus: 'WAITING',
    quai: qMCR1.nom, tonnageCharge: 0, palettesChargees: 20,
  } as any);

  const pApp2 = await upsertPlan(planRepo, 'CE-APP-2', {
    ...base, truck: trucks[4], heureArrivee: '06:30',
    entryStatus: 'ENTERED', loadingStatus: 'WAITING',
    quai: qMCR2.nom, tonnageCharge: 0, palettesChargees: 16,
  } as any);

  const pApp3 = await upsertPlan(planRepo, 'CE-APP-3', {
    ...base, truck: trucks[5], heureArrivee: '07:15',
    entryStatus: 'ENTERED', loadingStatus: 'WAITING',
    quai: qAMT1.nom, tonnageCharge: 0, palettesChargees: 0,
  } as any);

  // ══════════════════════════════════════════════
  //  ENTRÉS — ENTERED + IN_PROGRESS / PAUSED
  //  (Démarrer cliqué)
  // ══════════════════════════════════════════════

  // IN_PROGRESS depuis 30 min
  const pEnt1 = await upsertPlan(planRepo, 'CE-ENT-1', {
    ...base, truck: trucks[6], heureArrivee: '05:30',
    entryStatus: 'ENTERED', loadingStatus: 'IN_PROGRESS',
    quai: qMCR3.nom, tonnageCharge: 12.5, palettesChargees: 10,
    loadingStartedAt: minutesAgo(30) as any,
    loadingElapsedSeconds: 0,
  } as any);

  // IN_PROGRESS depuis 1h30
  const pEnt2 = await upsertPlan(planRepo, 'CE-ENT-2', {
    ...base, truck: trucks[7], heureArrivee: '04:00',
    entryStatus: 'ENTERED', loadingStatus: 'IN_PROGRESS',
    quai: qAMT2.nom, tonnageCharge: 26.0, palettesChargees: 0,
    loadingStartedAt: hoursAgo(1.5) as any,
    loadingElapsedSeconds: 0,
  } as any);

  // PAUSED après 45 min — timer figé
  const pEnt3 = await upsertPlan(planRepo, 'CE-ENT-3', {
    ...base, truck: trucks[8], heureArrivee: '05:00',
    entryStatus: 'ENTERED', loadingStatus: 'PAUSED',
    quai: qPW1.nom, tonnageCharge: 18.0, palettesChargees: 14,
    loadingStartedAt: null as any,
    loadingElapsedSeconds: 2700, // 45 min figé
  } as any);

  // ══════════════════════════════════════════════
  //  TERMINÉS — EXITED + DONE
  // ══════════════════════════════════════════════

  // sorti il y a 2h (durée 1h15)
  const pTer1 = await upsertPlan(planRepo, 'CE-TER-1', {
    ...base, truck: trucks[9], heureArrivee: '03:00',
    entryStatus: 'EXITED', loadingStatus: 'DONE',
    quai: null as any, tonnageCharge: 22.0, palettesChargees: 0,
    loadingStartedAt: null as any,
    loadingElapsedSeconds: 4500, // 1h15
  } as any);

  // sorti il y a 1h (durée 50 min)
  const pTer2 = await upsertPlan(planRepo, 'CE-TER-2', {
    ...base, truck: trucks[10], heureArrivee: '03:30',
    entryStatus: 'EXITED', loadingStatus: 'DONE',
    quai: null as any, tonnageCharge: 28.5, palettesChargees: 0,
    loadingStartedAt: null as any,
    loadingElapsedSeconds: 3000, // 50 min
  } as any);

  // sorti ce matin tôt (durée 2h05)
  const pTer3 = await upsertPlan(planRepo, 'CE-TER-3', {
    ...base, truck: trucks[11], heureArrivee: '01:30',
    entryStatus: 'EXITED', loadingStatus: 'DONE',
    quai: null as any, tonnageCharge: 32.0, palettesChargees: 20,
    loadingStartedAt: null as any,
    loadingElapsedSeconds: 7500, // 2h05
  } as any);

  console.log('  ✓ 12 plans créés / mis à jour');

  // ── [4/4] Bons de livraison ───────────────────────────────────────────────

  console.log('\n[4/4] Bons de livraison…');

  const blBase = {
    societeExpeditrice: societe,
    company:            transfood,
    datelivraison:      DATE as any,
    origine:            'Béja',
  };

  // ─── En attente ───────────────────────────────────────────────
  await upsertBl(blRepo, 'BL-CE-ATT-1A', {
    ...blBase, loadingPlan: pAtt1, filiere: filMCR,
    clientNom: 'SAPD Distribution', destination: 'Tunis',
    typeChargement: TypeChargement.FRIGO, tonnageTotal: 14, nombrePalettes: 0,
    statut: BlStatus.VALIDATED, ordreChargement: 1,
  });
  await upsertBl(blRepo, 'BL-CE-ATT-1B', {
    ...blBase, loadingPlan: pAtt1, filiere: filAMT,
    clientNom: 'Sfax Négoce', destination: 'Sfax',
    typeChargement: TypeChargement.VRAC, tonnageTotal: 18, nombrePalettes: 0,
    statut: BlStatus.VALIDATED, ordreChargement: 2,
  });

  await upsertBl(blRepo, 'BL-CE-ATT-2', {
    ...blBase, loadingPlan: pAtt2, filiere: filAMT,
    clientNom: 'Grande Distribution', destination: 'Sousse',
    typeChargement: TypeChargement.CITERNE, tonnageTotal: 30, nombrePalettes: 0,
    statut: BlStatus.VALIDATED, ordreChargement: 1,
  });

  await upsertBl(blRepo, 'BL-CE-ATT-3', {
    ...blBase, loadingPlan: pAtt3, filiere: filMCR,
    clientNom: 'Cotupha  ', destination: 'Monastir',
    typeChargement: TypeChargement.FRIGO, tonnageTotal: 18, nombrePalettes: 0,
    statut: BlStatus.VALIDATED, ordreChargement: 1,
  });

  // ─── Appelés ──────────────────────────────────────────────────
  await upsertBl(blRepo, 'BL-CE-APP-1A', {
    ...blBase, loadingPlan: pApp1, filiere: filMCR,
    clientNom: 'Béja Négoce', destination: 'Béja',
    typeChargement: TypeChargement.FRIGO, tonnageTotal: 12, nombrePalettes: 12,
    statut: BlStatus.LOADED, ordreChargement: 1,
  });
  await upsertBl(blRepo, 'BL-CE-APP-1B', {
    ...blBase, loadingPlan: pApp1, filiere: filAMT,
    clientNom: 'Nabeul Trade', destination: 'Nabeul',
    typeChargement: TypeChargement.VRAC, tonnageTotal: 16, nombrePalettes: 8,
    statut: BlStatus.LOADED, ordreChargement: 2,
  });

  await upsertBl(blRepo, 'BL-CE-APP-2', {
    ...blBase, loadingPlan: pApp2, filiere: filMCR,
    clientNom: 'Kairouan Distribution', destination: 'Kairouan',
    typeChargement: TypeChargement.PALETTE, tonnageTotal: 22, nombrePalettes: 16,
    statut: BlStatus.LOADED, ordreChargement: 1,
  });

  await upsertBl(blRepo, 'BL-CE-APP-3', {
    ...blBase, loadingPlan: pApp3, filiere: filAMT,
    clientNom: 'Maghrébine Aliments', destination: 'Gabès',
    typeChargement: TypeChargement.VRAC, tonnageTotal: 28, nombrePalettes: 0,
    statut: BlStatus.LOADED, ordreChargement: 1,
  });

  // ─── Entrés ───────────────────────────────────────────────────
  await upsertBl(blRepo, 'BL-CE-ENT-1A', {
    ...blBase, loadingPlan: pEnt1, filiere: filMCR,
    clientNom: 'Monastir Trade', destination: 'Monastir',
    typeChargement: TypeChargement.FRIGO, tonnageTotal: 8, nombrePalettes: 6,
    statut: BlStatus.LOADED, ordreChargement: 1,
  });
  await upsertBl(blRepo, 'BL-CE-ENT-1B', {
    ...blBase, loadingPlan: pEnt1, filiere: filMCR,
    clientNom: 'Kef Alimentaire', destination: 'Le Kef',
    typeChargement: TypeChargement.FRIGO, tonnageTotal: 4.5, nombrePalettes: 4,
    statut: BlStatus.LOADED, ordreChargement: 2,
  });

  await upsertBl(blRepo, 'BL-CE-ENT-2A', {
    ...blBase, loadingPlan: pEnt2, filiere: filAMT,
    clientNom: 'Distributeur Côtier', destination: 'Jerba',
    typeChargement: TypeChargement.CITERNE, tonnageTotal: 15, nombrePalettes: 0,
    statut: BlStatus.LOADED, ordreChargement: 1,
  });
  await upsertBl(blRepo, 'BL-CE-ENT-2B', {
    ...blBase, loadingPlan: pEnt2, filiere: filAMT,
    clientNom: 'Sud Alimentaire', destination: 'Gafsa',
    typeChargement: TypeChargement.VRAC, tonnageTotal: 11, nombrePalettes: 0,
    statut: BlStatus.LOADED, ordreChargement: 2,
  });

  await upsertBl(blRepo, 'BL-CE-ENT-3A', {
    ...blBase, loadingPlan: pEnt3, filiere: filMCR,
    clientNom: 'Nord Négoce', destination: 'Bizerte',
    typeChargement: TypeChargement.PALETTE, tonnageTotal: 10, nombrePalettes: 8,
    statut: BlStatus.LOADED, ordreChargement: 1,
  });
  await upsertBl(blRepo, 'BL-CE-ENT-3B', {
    ...blBase, loadingPlan: pEnt3, filiere: filAMT,
    clientNom: 'Société Nabeulienne', destination: 'Nabeul',
    typeChargement: TypeChargement.PALETTE, tonnageTotal: 8, nombrePalettes: 6,
    statut: BlStatus.LOADED, ordreChargement: 2,
  });

  // ─── Terminés ─────────────────────────────────────────────────
  await upsertBl(blRepo, 'BL-CE-TER-1', {
    ...blBase, loadingPlan: pTer1, filiere: filMCR,
    clientNom: 'SAPD Distribution', destination: 'Tunis',
    typeChargement: TypeChargement.FRIGO, tonnageTotal: 22, nombrePalettes: 0,
    statut: BlStatus.DELIVERED, ordreChargement: 1,
  });

  await upsertBl(blRepo, 'BL-CE-TER-2A', {
    ...blBase, loadingPlan: pTer2, filiere: filAMT,
    clientNom: 'Cotupha  ', destination: 'Sousse',
    typeChargement: TypeChargement.VRAC, tonnageTotal: 16, nombrePalettes: 0,
    statut: BlStatus.DELIVERED, ordreChargement: 1,
  });
  await upsertBl(blRepo, 'BL-CE-TER-2B', {
    ...blBase, loadingPlan: pTer2, filiere: filMCR,
    clientNom: 'Kairouan Distribution', destination: 'Kairouan',
    typeChargement: TypeChargement.FRIGO, tonnageTotal: 12.5, nombrePalettes: 0,
    statut: BlStatus.DELIVERED, ordreChargement: 2,
  });

  await upsertBl(blRepo, 'BL-CE-TER-3A', {
    ...blBase, loadingPlan: pTer3, filiere: filAMT,
    clientNom: 'Grande Distribution', destination: 'Sfax',
    typeChargement: TypeChargement.VRAC, tonnageTotal: 20, nombrePalettes: 12,
    statut: BlStatus.DELIVERED, ordreChargement: 1,
  });
  await upsertBl(blRepo, 'BL-CE-TER-3B', {
    ...blBase, loadingPlan: pTer3, filiere: filAMT,
    clientNom: 'Béja Négoce', destination: 'Béja',
    typeChargement: TypeChargement.PALETTE, tonnageTotal: 12, nombrePalettes: 8,
    statut: BlStatus.DELIVERED, ordreChargement: 2,
  });

  console.log('  ✓ 19 BLs créés / mis à jour');

  // ── Résumé ────────────────────────────────────────────────────────────────

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
