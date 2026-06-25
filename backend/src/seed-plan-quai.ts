/**
 * Seeder — Démo Gestion du Quai (magasiniers)
 * ============================================
 * Crée des plans de chargement pour démontrer TOUS lesétats de
 * la page "Gestion du Quai" visible par les magasiniers :
 *
 *   Vue mag1 (MCSR + AMT) :
 *     Q-MCSR-1  ● En cours   (truck IN_PROGRESS, BL MCSR)
 *     Q-MCSR-2  ○ Occupé     (truck CALLED,      BL MCSR)
 *     Q-MCSR-3  ✓ Libre      (aucun plan actif)
 *     Q-AMT-1  ● En cours   (truck IN_PROGRESS, BL AMT)
 *     Q-AMT-2  ≈ Occupé     (truck PAUSED,      BL AMT)
 *     Q-AMT-3  ✗ Bloqué     (isActive = false)
 *
 *   Vue mag2 (PW) :
 *     Q-PW-1   ● En cours   (truck IN_PROGRESS, BL PW)
 *     Q-PW-2   ✓ Libre      (aucun plan actif)
 *
 *   Panel camions (tous) :
 *     En attente  × 3  (IDLE/WAITING, pas encore de quai)
 *     Appelé      × 2  (CALLED)
 *     En chargement × 3 (IN_PROGRESS ou PAUSED)
 *     Terminé     × 2  (EXITED/DONE)
 *
 * Pré-requis : seed:rb-complet doit avoirété exécuté.
 * Lancer     : cd backend && npm run seed:plan-quai
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ObjectLiteral } from 'typeorm';
import { Company } from './companies/company.entity';
import { User } from './users/user.entity';
import { SocieteExpeditrice } from './expediteurs/societe-expeditrice.entity';
import { Filiere } from './expediteurs/filiere.entity';
import { Quai } from './quais/quai.entity';
import { BonLivraison, TypeChargement } from './bons-livraison/bon-livraison.entity';
import { LoadingPlan } from './loading-plans/loading-plan.entity';
import { Truck } from './trucks/truck.entity';
import { BlStatus } from './common/enums/bl-status.enum';

// ── helpers ───────────────────────────────────────────────────────────────────

function today(): string {
  return '2026-06-12';
}

async function findOrFail<T extends ObjectLiteral>(
  repo: Repository<T>,
  where: Partial<T>,
  label: string,
): Promise<T> {
  const e = await repo.findOne({ where: where as any });
  if (!e) throw new Error(`${label} introuvable — lancez d'abord seed:rb-complet`);
  return e;
}

async function upsertBl(
  blRepo: Repository<BonLivraison>,
  numeroBl: string,
  data: Partial<BonLivraison>,
): Promise<BonLivraison> {
  const existing = await blRepo.findOne({ where: { numeroBl } as any });
  if (existing) {
    Object.assign(existing, data);
    return blRepo.save(existing) as unknown as BonLivraison;
  }
  return blRepo.save(blRepo.create({ numeroBl, ...data } as any)) as unknown as BonLivraison;
}

async function upsertPlan(
  planRepo: Repository<LoadingPlan>,
  reference: string,
  data: Partial<LoadingPlan>,
): Promise<LoadingPlan> {
  const existing = await planRepo.findOne({ where: { reference } as any });
  if (existing) {
    Object.assign(existing, data);
    return planRepo.save(existing) as unknown as LoadingPlan;
  }
  return planRepo.save(planRepo.create({ reference, ...data } as any)) as unknown as LoadingPlan;
}

// ── bootstrap ─────────────────────────────────────────────────────────────────

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });

  const companyRepo  = app.get<Repository<Company>>(getRepositoryToken(Company));
  const userRepo     = app.get<Repository<User>>(getRepositoryToken(User));
  const societeRepo  = app.get<Repository<SocieteExpeditrice>>(getRepositoryToken(SocieteExpeditrice));
  const filiereRepo  = app.get<Repository<Filiere>>(getRepositoryToken(Filiere));
  const quaiRepo     = app.get<Repository<Quai>>(getRepositoryToken(Quai));
  const blRepo       = app.get<Repository<BonLivraison>>(getRepositoryToken(BonLivraison));
  const planRepo     = app.get<Repository<LoadingPlan>>(getRepositoryToken(LoadingPlan));
  const truckRepo    = app.get<Repository<Truck>>(getRepositoryToken(Truck));

  // ── Récupération des données existantes ───────────────────────────────────

  console.log('\n[1/4] Récupération des entités de base…');

  const transfood = await findOrFail(companyRepo, { nom: 'TransFood ' } as any, 'TransFood ');
  const companyAdmin = await findOrFail(userRepo, { email: 'logistique@transfood.tn' } as any, 'COMPANY_ADMIN');
  const societe   = await findOrFail(societeRepo, { nom: 'Rose Blanche' } as any, 'Société Rose Blanche');
  const filMCR    = await findOrFail(filiereRepo, { code: 'MCSR' } as any, 'Filière MCSR');
  const filAMT    = await findOrFail(filiereRepo, { code: 'AMT' } as any, 'Filière AMT');
  const filPW     = await findOrFail(filiereRepo, { code: 'PW' }  as any, 'Filière PW');

  // Quais
  const qMCR1 = await findOrFail(quaiRepo, { nom: 'Q-MCSR-1' } as any, 'Q-MCSR-1');
  const qMCR2 = await findOrFail(quaiRepo, { nom: 'Q-MCSR-2' } as any, 'Q-MCSR-2');
  const qMCR3 = await findOrFail(quaiRepo, { nom: 'Q-MCSR-3' } as any, 'Q-MCSR-3');
  const qAMT1 = await findOrFail(quaiRepo, { nom: 'Q-AMT-1' } as any, 'Q-AMT-1');
  const qAMT2 = await findOrFail(quaiRepo, { nom: 'Q-AMT-2' } as any, 'Q-AMT-2');
  const qAMT3 = await findOrFail(quaiRepo, { nom: 'Q-AMT-3' } as any, 'Q-AMT-3');
  const qPW1  = await findOrFail(quaiRepo, { nom: 'Q-PW-1' }  as any, 'Q-PW-1');
  // Q-PW-2 → Bloqué : on le désactive

  // Camions (on prend les 10 premiers par matricule)
  const trucks = await truckRepo.find({ order: { matricule: 'ASC' }, take: 10 });
  if (trucks.length < 10) throw new Error('Pas assez de camions — lancez seed:rb-complet');

  const DATE = today();

  // ── Q-AMT-3 : Bloqué ─────────────────────────────────────────────────────

  console.log('\n[2/4] Configuration quai bloqué…');
  qAMT3.isActive = false;
  await quaiRepo.save(qAMT3);
  console.log('  ✓ Q-AMT-3 → isActive = false (Bloqué)');

  // ── Plans créés EN PREMIER (les BLs y font référence via loadingPlan) ─────

  console.log('\n[3/4] Plans de chargement…');

  const planBase = {
    dateLivraison:       DATE as any,
    isValidated:         true,
    palettesChargees:    0,
    validatedBy:         companyAdmin,
    logistiqueCompanyId: transfood.id,
    signature:           'sig_quai_demo',
  };

  const p1  = await upsertPlan(planRepo, 'PQ-MCSR-IP',   { ...planBase, truck: trucks[0], heureArrivee: '06:30', quai: qMCR1.nom, entryStatus: 'ENTERED',  loadingStatus: 'IN_PROGRESS', tonnageCharge: 18.5, loadingStartedAt: new Date(new Date().setHours(new Date().getHours() - 1)) as any, loadingElapsedSeconds: 3600 } as any);
  const p2  = await upsertPlan(planRepo, 'PQ-MCSR-CL',   { ...planBase, truck: trucks[1], heureArrivee: '08:00', quai: qMCR2.nom, entryStatus: 'CALLED',   loadingStatus: 'WAITING',     tonnageCharge: 0 } as any);
  const p3  = await upsertPlan(planRepo, 'PQ-AMT-IP',   { ...planBase, truck: trucks[2], heureArrivee: '05:45', quai: qAMT1.nom, entryStatus: 'ENTERED',  loadingStatus: 'IN_PROGRESS', tonnageCharge: 38.0, loadingStartedAt: new Date(new Date().setHours(new Date().getHours() - 2)) as any, loadingElapsedSeconds: 7200 } as any);
  const p4  = await upsertPlan(planRepo, 'PQ-AMT-PA',   { ...planBase, truck: trucks[3], heureArrivee: '07:00', quai: qAMT2.nom, entryStatus: 'ENTERED',  loadingStatus: 'PAUSED',      tonnageCharge: 12.0, loadingStartedAt: new Date(new Date().setHours(new Date().getHours() - 1)) as any, loadingElapsedSeconds: 1800 } as any);
  const p5  = await upsertPlan(planRepo, 'PQ-PW-IP',    { ...planBase, truck: trucks[4], heureArrivee: '06:00', quai: qPW1.nom,  entryStatus: 'ENTERED',  loadingStatus: 'IN_PROGRESS', tonnageCharge: 28.0, loadingStartedAt: new Date(new Date().setHours(new Date().getHours() - 1)) as any, loadingElapsedSeconds: 2700 } as any);
  const p6  = await upsertPlan(planRepo, 'PQ-IDLE-1',   { ...planBase, truck: trucks[5], heureArrivee: '09:00', quai: null,       entryStatus: 'IDLE',     loadingStatus: 'WAITING',     tonnageCharge: 0 } as any);
  const p7  = await upsertPlan(planRepo, 'PQ-IDLE-2',   { ...planBase, truck: trucks[6], heureArrivee: '09:30', quai: null,       entryStatus: 'IDLE',     loadingStatus: 'WAITING',     tonnageCharge: 0 } as any);
  const p8  = await upsertPlan(planRepo, 'PQ-IDLE-3',   { ...planBase, truck: trucks[7], heureArrivee: '10:00', quai: null,       entryStatus: 'IDLE',     loadingStatus: 'WAITING',     tonnageCharge: 0 } as any);
  const p9  = await upsertPlan(planRepo, 'PQ-DONE-1',   { ...planBase, truck: trucks[8], heureArrivee: '04:00', quai: qMCR3.nom, entryStatus: 'EXITED',   loadingStatus: 'DONE',        tonnageCharge: 20.0 } as any);
  const p10 = await upsertPlan(planRepo, 'PQ-DONE-2',   { ...planBase, truck: trucks[9], heureArrivee: '04:30', quai: null,       entryStatus: 'EXITED',   loadingStatus: 'DONE',        tonnageCharge: 24.0 } as any);

  console.log('  ✓ 10 plans');

  // ── BLs créés avec loadingPlan déjà référencé ────────────────────────────

  console.log('\n[4/4] Bons de livraison…');

  const base = {
    societeExpeditrice: societe,
    company:            transfood,
    datelivraison:      DATE as any,
    origine:            'Béja',
  };

  // p1 — Q-MCSR-1 IN_PROGRESS (3 BLs MCSR)
  await upsertBl(blRepo, 'BL-Q-MCSR-IP1', { ...base, loadingPlan: p1, filiere: filMCR, clientNom: 'SAPD Distribution',      destination: 'Tunis',    typeChargement: TypeChargement.FRIGO,   tonnageTotal: 14, nombrePalettes: 0,  statut: BlStatus.LOADED,    ordreChargement: 1 });
  await upsertBl(blRepo, 'BL-Q-MCSR-IP2', { ...base, loadingPlan: p1, filiere: filMCR, clientNom: 'Cotupha  ',              destination: 'Sousse',   typeChargement: TypeChargement.FRIGO,   tonnageTotal: 9,  nombrePalettes: 0,  statut: BlStatus.LOADED,    ordreChargement: 2 });
  await upsertBl(blRepo, 'BL-Q-MCSR-IP3', { ...base, loadingPlan: p1, filiere: filMCR, clientNom: 'Monastir Trade',          destination: 'Monastir', typeChargement: TypeChargement.PALETTE, tonnageTotal: 11, nombrePalettes: 14, statut: BlStatus.LOADED,    ordreChargement: 3 });
  // p2 — Q-MCSR-2 CALLED (2 BLs MCSR)
  await upsertBl(blRepo, 'BL-Q-MCSR-CL1', { ...base, loadingPlan: p2, filiere: filMCR, clientNom: 'Béja Négoce',            destination: 'Béja',     typeChargement: TypeChargement.FRIGO,   tonnageTotal: 12, nombrePalettes: 0,  statut: BlStatus.LOADED,    ordreChargement: 1 });
  await upsertBl(blRepo, 'BL-Q-MCSR-CL2', { ...base, loadingPlan: p2, filiere: filMCR, clientNom: 'Kairouan Distribution',  destination: 'Kairouan', typeChargement: TypeChargement.FRIGO,   tonnageTotal: 8,  nombrePalettes: 0,  statut: BlStatus.LOADED,    ordreChargement: 2 });
  // p3 — Q-AMT-1 IN_PROGRESS (2 BLs AMT)
  await upsertBl(blRepo, 'BL-Q-AMT-IP1', { ...base, loadingPlan: p3, filiere: filAMT, clientNom: 'Maghrébine Aliments',    destination: 'Sfax',     typeChargement: TypeChargement.VRAC,    tonnageTotal: 25, nombrePalettes: 0,  statut: BlStatus.LOADED,    ordreChargement: 1 });
  await upsertBl(blRepo, 'BL-Q-AMT-IP2', { ...base, loadingPlan: p3, filiere: filAMT, clientNom: 'Sud Alimentaire',        destination: 'Gafsa',    typeChargement: TypeChargement.CITERNE, tonnageTotal: 30, nombrePalettes: 0,  statut: BlStatus.LOADED,    ordreChargement: 2 });
  // p4 — Q-AMT-2 PAUSED (1 BL AMT)
  await upsertBl(blRepo, 'BL-Q-AMT-PA1', { ...base, loadingPlan: p4, filiere: filAMT, clientNom: 'Société Nabeulienne',    destination: 'Nabeul',   typeChargement: TypeChargement.VRAC,    tonnageTotal: 28, nombrePalettes: 0,  statut: BlStatus.LOADED,    ordreChargement: 1 });
  // p5 — Q-PW-1 IN_PROGRESS (2 BLs PW)
  await upsertBl(blRepo, 'BL-Q-PW-IP1',  { ...base, loadingPlan: p5, filiere: filPW,  clientNom: 'Distributeur Côtier',   destination: 'Bizerte',  typeChargement: TypeChargement.PALETTE, tonnageTotal: 18, nombrePalettes: 18, statut: BlStatus.LOADED,    ordreChargement: 1 });
  await upsertBl(blRepo, 'BL-Q-PW-IP2',  { ...base, loadingPlan: p5, filiere: filPW,  clientNom: 'Grande Distribution',   destination: 'Gabes',    typeChargement: TypeChargement.VRAC,    tonnageTotal: 22, nombrePalettes: 0,  statut: BlStatus.LOADED,    ordreChargement: 2 });
  // p6 — IDLE camion 1 (MCSR + AMT + PW)
  await upsertBl(blRepo, 'BL-Q-MCSR-W1',  { ...base, loadingPlan: p6, filiere: filMCR, clientNom: 'SAPD Distribution',     destination: 'Tunis',    typeChargement: TypeChargement.FRIGO,   tonnageTotal: 16, nombrePalettes: 0,  statut: BlStatus.VALIDATED, ordreChargement: 1 });
  await upsertBl(blRepo, 'BL-Q-AMT-W1',  { ...base, loadingPlan: p6, filiere: filAMT, clientNom: 'Cotupha  ',            destination: 'Sousse',   typeChargement: TypeChargement.VRAC,    tonnageTotal: 20, nombrePalettes: 0,  statut: BlStatus.VALIDATED, ordreChargement: 2 });
  await upsertBl(blRepo, 'BL-Q-PW-W1',   { ...base, loadingPlan: p6, filiere: filPW,  clientNom: 'Monastir Trade',        destination: 'Monastir', typeChargement: TypeChargement.PALETTE, tonnageTotal: 15, nombrePalettes: 15, statut: BlStatus.VALIDATED, ordreChargement: 3 });
  // p7 — IDLE camion 2 (MCSR + PW)
  await upsertBl(blRepo, 'BL-Q-MCSR-W2',  { ...base, loadingPlan: p7, filiere: filMCR, clientNom: 'Maghrébine Aliments',   destination: 'Sfax',     typeChargement: TypeChargement.FRIGO,   tonnageTotal: 10, nombrePalettes: 0,  statut: BlStatus.VALIDATED, ordreChargement: 1 });
  await upsertBl(blRepo, 'BL-Q-PW-W2',   { ...base, loadingPlan: p7, filiere: filPW,  clientNom: 'Grande Distribution',   destination: 'Gabes',    typeChargement: TypeChargement.VRAC,    tonnageTotal: 22, nombrePalettes: 0,  statut: BlStatus.VALIDATED, ordreChargement: 2 });
  // p8 — IDLE camion 3 (AMT)
  await upsertBl(blRepo, 'BL-Q-AMT-W2',  { ...base, loadingPlan: p8, filiere: filAMT, clientNom: 'Béja Négoce',          destination: 'Béja',     typeChargement: TypeChargement.CITERNE, tonnageTotal: 32, nombrePalettes: 0,  statut: BlStatus.VALIDATED, ordreChargement: 1 });
  // p9 — DONE/EXITED Q-MCSR-3 (MCSR livré)
  await upsertBl(blRepo, 'BL-Q-MCSR-D1',  { ...base, loadingPlan: p9, filiere: filMCR, clientNom: 'Société Nabeulienne',   destination: 'Nabeul',   typeChargement: TypeChargement.FRIGO,   tonnageTotal: 20, nombrePalettes: 0,  statut: BlStatus.DELIVERED });
  // p10 — DONE/EXITED sans quai (AMT livré)
  await upsertBl(blRepo, 'BL-Q-AMT-D1',  { ...base, loadingPlan: p10, filiere: filAMT, clientNom: 'Distributeur Côtier', destination: 'Bizerte',  typeChargement: TypeChargement.VRAC,    tonnageTotal: 24, nombrePalettes: 0,  statut: BlStatus.DELIVERED });

  // ── Résumé ────────────────────────────────────────────────────────────────

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
