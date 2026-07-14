/**
 * Seeder Demo — Aujourd'hui & Demain
 * ====================================
 * 56 BLs · 14 plans de chargement · 15 camions · TruckAvailability
 *
 * Couvre TOUS les cas :
 *   Statuts BL   : DRAFT · VALIDATED · LOADED · DELIVERED
 *   Types chargem.: FRIGO · VRAC · PALETTE · CITERNE
 *   Statuts plan : WAITING/IDLE · WAITING/CALLED · IN_PROGRESS/ENTERED
 *                  PAUSED/ENTERED · DONE/EXITED · non-validé
 *   Filières     : MCSR · AMT · PW
 *   Dates        : TODAY · TOMORROW · historique (hier)
 *
 * Prérequis : npm run seed:rb-complet (crée les sociétés / users / filières / quais)
 * Lancer    : cd backend && npm run seed:today
 *
 * Comptes (Demo123!) :
 *   admin@tms.com · logistique@transfood.tn · admin@roseblanche.tn
 *   admin.mcr@roseblanche.tn · admin.amt@roseblanche.tn · admin.pw@roseblanche.tn
 *   mag1@roseblanche.tn · mag2@roseblanche.tn
 *   sec1@roseblanche.tn · sec2@roseblanche.tn
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './companies/company.entity';
import { User } from './users/user.entity';
import { SocieteExpeditrice } from './expediteurs/societe-expeditrice.entity';
import { Filiere } from './expediteurs/filiere.entity';
import { Quai } from './quais/quai.entity';
import { BonLivraison, TypeChargement } from './bons-livraison/bon-livraison.entity';
import { LoadingPlan } from './loading-plans/loading-plan.entity';
import { DeliveryCompany } from './delivery-companies/delivery-company.entity';
import { Truck } from './trucks/truck.entity';
import { TruckAvailability } from './truck-availability/truck-availability.entity';
import { BlStatus } from './common/enums/bl-status.enum';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function upsert<T extends object>(
  repo: Repository<T>,
  where: Partial<T>,
  defaults: Partial<T>,
): Promise<T> {
  const existing = await repo.findOne({ where: where as any });
  if (existing) {
    Object.assign(existing, defaults);
    return repo.save(existing as any) as unknown as T;
  }
  return repo.save(repo.create({ ...where, ...defaults } as any)) as unknown as T;
}

async function findOrFail<T extends object>(
  repo: Repository<T>,
  where: Partial<T>,
  label: string,
): Promise<T> {
  const item = await repo.findOne({ where: where as any });
  if (!item) throw new Error(`${label} introuvable — lancez d'abord npm run seed:rb-complet`);
  return item;
}

function dateStr(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

const TODAY     = dateStr(0);
const TOMORROW  = dateStr(+1);
const YESTERDAY = dateStr(-1);

// ── Bootstrap ─────────────────────────────────────────────────────────────────

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });

  const companyRepo      = app.get<Repository<Company>>(getRepositoryToken(Company));
  const userRepo         = app.get<Repository<User>>(getRepositoryToken(User));
  const societeRepo      = app.get<Repository<SocieteExpeditrice>>(getRepositoryToken(SocieteExpeditrice));
  const filiereRepo      = app.get<Repository<Filiere>>(getRepositoryToken(Filiere));
  const blRepo           = app.get<Repository<BonLivraison>>(getRepositoryToken(BonLivraison));
  const planRepo         = app.get<Repository<LoadingPlan>>(getRepositoryToken(LoadingPlan));
  const deliveryCoRepo   = app.get<Repository<DeliveryCompany>>(getRepositoryToken(DeliveryCompany));
  const truckRepo        = app.get<Repository<Truck>>(getRepositoryToken(Truck));
  const availRepo        = app.get<Repository<TruckAvailability>>(getRepositoryToken(TruckAvailability));

  console.log(`\n🗓  Dates : TODAY=${TODAY}  TOMORROW=${TOMORROW}\n`);

  // ════════════════════════════════════════════════════════════════
  // 1. RÉCUPÉRATION DES DONNÉES EXISTANTES
  // ════════════════════════════════════════════════════════════════
  console.log('[1/6] Récupération des données existantes…');

  const transfood = await findOrFail(companyRepo, { nom: 'TransFood' } as any, 'TransFood');
  const companyAdmin = await findOrFail(userRepo, { email: 'logistique@transfood.tn' } as any, 'logistique@transfood.tn');
  const societe = await findOrFail(societeRepo, { nom: 'Rose Blanche' } as any, 'SocieteExpeditrice Rose Blanche');
  const filMCR = await findOrFail(filiereRepo, { code: 'MCSR' } as any, 'Filiere MCSR');
  const filAMT = await findOrFail(filiereRepo, { code: 'AMT' } as any, 'Filiere AMT');
  const filPW  = await findOrFail(filiereRepo, { code: 'PW' } as any, 'Filiere PW');

  const quaiMCSR1 = await findOrFail<Quai>(app.get<Repository<Quai>>(getRepositoryToken(Quai)), { nom: 'Q-MCSR-1' } as any, 'Q-MCSR-1');
  const quaiMCSR2 = await findOrFail<Quai>(app.get<Repository<Quai>>(getRepositoryToken(Quai)), { nom: 'Q-MCSR-2' } as any, 'Q-MCSR-2');
  const quaiMCSR3 = await findOrFail<Quai>(app.get<Repository<Quai>>(getRepositoryToken(Quai)), { nom: 'Q-MCSR-3' } as any, 'Q-MCSR-3');
  const quaiAMT1  = await findOrFail<Quai>(app.get<Repository<Quai>>(getRepositoryToken(Quai)), { nom: 'Q-AMT-1' } as any, 'Q-AMT-1');
  const quaiAMT2  = await findOrFail<Quai>(app.get<Repository<Quai>>(getRepositoryToken(Quai)), { nom: 'Q-AMT-2' } as any, 'Q-AMT-2');
  const quaiAMT3  = await findOrFail<Quai>(app.get<Repository<Quai>>(getRepositoryToken(Quai)), { nom: 'Q-AMT-3' } as any, 'Q-AMT-3');
  const quaiPW1   = await findOrFail<Quai>(app.get<Repository<Quai>>(getRepositoryToken(Quai)), { nom: 'Q-PW-1' } as any, 'Q-PW-1');
  const quaiPW2   = await findOrFail<Quai>(app.get<Repository<Quai>>(getRepositoryToken(Quai)), { nom: 'Q-PW-2' } as any, 'Q-PW-2');

  console.log('  ✓ TransFood · Rose Blanche · filières MCSR/AMT/PW · 8 quais');

  // ════════════════════════════════════════════════════════════════
  // 2. CAMIONS (15 au total — on ajoute 3 si absents)
  // ════════════════════════════════════════════════════════════════
  console.log('\n[2/6] Camions…');

  const dc = await findOrFail(deliveryCoRepo, { nom: 'Rapid Transport SARL' } as any, 'Rapid Transport SARL');

  const truckDefs = [
    // 12 existants (déjà créés par seed:rb-complet)
    { matricule: 'TN-111-1001', capaciteTonnage: 24, capacitePalettes: 20, type: 'FRIGO' },
    { matricule: 'TN-222-2002', capaciteTonnage: 30, capacitePalettes: 0,  type: 'CITERNE' },
    { matricule: 'TN-333-3003', capaciteTonnage: 20, capacitePalettes: 18, type: 'PALETTE' },
    { matricule: 'TN-444-4004', capaciteTonnage: 28, capacitePalettes: 0,  type: 'VRAC' },
    { matricule: 'TN-555-5005', capaciteTonnage: 18, capacitePalettes: 16, type: 'FRIGO' },
    { matricule: 'TN-666-6006', capaciteTonnage: 22, capacitePalettes: 20, type: 'PALETTE' },
    { matricule: 'TN-777-7007', capaciteTonnage: 25, capacitePalettes: 0,  type: 'VRAC' },
    { matricule: 'TN-888-8008', capaciteTonnage: 32, capacitePalettes: 0,  type: 'CITERNE' },
    { matricule: 'TN-999-9009', capaciteTonnage: 20, capacitePalettes: 18, type: 'FRIGO' },
    { matricule: 'TN-010-1010', capaciteTonnage: 18, capacitePalettes: 16, type: 'PALETTE' },
    { matricule: 'TN-011-1111', capaciteTonnage: 26, capacitePalettes: 0,  type: 'VRAC' },
    { matricule: 'TN-012-1212', capaciteTonnage: 24, capacitePalettes: 20, type: 'FRIGO' },
    // 3 nouveaux
    { matricule: 'TN-013-1313', capaciteTonnage: 28, capacitePalettes: 0,  type: 'VRAC' },
    { matricule: 'TN-014-1414', capaciteTonnage: 22, capacitePalettes: 18, type: 'PALETTE' },
    { matricule: 'TN-015-1515', capaciteTonnage: 30, capacitePalettes: 0,  type: 'CITERNE' },
  ];

  const trucks: Truck[] = [];
  for (const td of truckDefs) {
    const t = await upsert(truckRepo,
      { matricule: td.matricule },
      { capaciteTonnage: td.capaciteTonnage, capacitePalettes: td.capacitePalettes, type: td.type, isActive: true, deliveryCompany: dc },
    );
    trucks.push(t);
  }
  console.log(`  ✓ ${trucks.length} camions (FRIGO x4 · CITERNE x4 · PALETTE x4 · VRAC x3)`);

  // ════════════════════════════════════════════════════════════════
  // 3. TRUCK AVAILABILITY (today + tomorrow pour tous les camions)
  // ════════════════════════════════════════════════════════════════
  console.log('\n[3/6] Disponibilité camions…');

  let availCount = 0;
  for (const truck of trucks) {
    for (const date of [TODAY, TOMORROW]) {
      const existing = await availRepo.findOne({
        where: { truck: { id: truck.id }, date } as any,
        relations: ['truck'],
      });
      if (!existing) {
        await availRepo.save(
          availRepo.create({ truck, date, company: transfood } as any),
        );
        availCount++;
      }
    }
  }
  console.log(`  ✓ ${availCount} nouvelles disponibilités (today + tomorrow)`);

  // ════════════════════════════════════════════════════════════════
  // 4. PLANS DE CHARGEMENT (14)
  // ════════════════════════════════════════════════════════════════
  console.log('\n[4/6] Plans de chargement…');

  type PlanDef = {
    ref: string;
    date: string;
    truck: Truck;
    isValidated: boolean;
    loadingStatus: string;
    entryStatus: string;
    heureArrivee?: string;
    quai?: string;
    tonnageCharge?: number;
    loadingStartedAt?: Date;
    loadingElapsedSeconds?: number;
    stationsSequence?: string[];
    currentStation?: string | null;
    currentStationIdx?: number;
  };

  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const oneHourAgo  = new Date(now.getTime() - 1 * 60 * 60 * 1000);

  const planDefs: PlanDef[] = [
    // ── TODAY · IDLE · non encore arrivé ──────────────────────────
    {
      ref: 'PL-DM-T01', date: TODAY, truck: trucks[0],
      isValidated: true,  loadingStatus: 'WAITING', entryStatus: 'IDLE',
      heureArrivee: '08:00', tonnageCharge: 0,
      stationsSequence: ['MCSR', 'AMT', 'PW'], currentStation: null, currentStationIdx: 0,
    },
    {
      ref: 'PL-DM-T02', date: TODAY, truck: trucks[1],
      isValidated: true,  loadingStatus: 'WAITING', entryStatus: 'IDLE',
      heureArrivee: '09:00', tonnageCharge: 0,
      stationsSequence: ['AMT', 'PW'], currentStation: null, currentStationIdx: 0,
    },
    {
      ref: 'PL-DM-T03', date: TODAY, truck: trucks[2],
      isValidated: false, loadingStatus: 'WAITING', entryStatus: 'IDLE',
      heureArrivee: '10:00', tonnageCharge: 0,
      stationsSequence: ['PW', 'MCSR'], currentStation: null, currentStationIdx: 0,
    },
    // ── TODAY · CALLED · camion appelé à la barrière ──────────────
    {
      ref: 'PL-DM-T04', date: TODAY, truck: trucks[3],
      isValidated: true,  loadingStatus: 'WAITING', entryStatus: 'CALLED',
      heureArrivee: '07:30', quai: quaiMCSR1.nom, tonnageCharge: 0,
      stationsSequence: ['MCSR', 'AMT'], currentStation: 'MCSR', currentStationIdx: 0,
    },
    {
      ref: 'PL-DM-T05', date: TODAY, truck: trucks[4],
      isValidated: true,  loadingStatus: 'WAITING', entryStatus: 'CALLED',
      heureArrivee: '07:45', quai: quaiAMT1.nom, tonnageCharge: 0,
      stationsSequence: ['AMT', 'PW'], currentStation: 'AMT', currentStationIdx: 0,
    },
    // ── TODAY · ENTERED · IN_PROGRESS · chargement en cours ───────
    {
      ref: 'PL-DM-T06', date: TODAY, truck: trucks[5],
      isValidated: true,  loadingStatus: 'IN_PROGRESS', entryStatus: 'ENTERED',
      heureArrivee: '06:00', quai: quaiMCSR2.nom, tonnageCharge: 32.5,
      loadingStartedAt: twoHoursAgo, loadingElapsedSeconds: 7200,
      stationsSequence: ['MCSR', 'AMT', 'PW'], currentStation: 'AMT', currentStationIdx: 1,
    },
    {
      ref: 'PL-DM-T07', date: TODAY, truck: trucks[6],
      isValidated: true,  loadingStatus: 'IN_PROGRESS', entryStatus: 'ENTERED',
      heureArrivee: '06:30', quai: quaiAMT2.nom, tonnageCharge: 18.0,
      loadingStartedAt: oneHourAgo,  loadingElapsedSeconds: 3600,
      stationsSequence: ['AMT', 'PW'], currentStation: 'PW', currentStationIdx: 1,
    },
    // ── TODAY · ENTERED · PAUSED · chargement en pause ────────────
    {
      ref: 'PL-DM-T08', date: TODAY, truck: trucks[7],
      isValidated: true,  loadingStatus: 'PAUSED', entryStatus: 'ENTERED',
      heureArrivee: '05:30', quai: quaiPW1.nom, tonnageCharge: 18.0,
      loadingStartedAt: twoHoursAgo, loadingElapsedSeconds: 5400,
      stationsSequence: ['PW', 'MCSR'], currentStation: 'PW', currentStationIdx: 0,
    },
    {
      ref: 'PL-DM-T09', date: TODAY, truck: trucks[8],
      isValidated: true,  loadingStatus: 'PAUSED', entryStatus: 'ENTERED',
      heureArrivee: '05:00', quai: quaiMCSR3.nom, tonnageCharge: 12.0,
      loadingStartedAt: twoHoursAgo, loadingElapsedSeconds: 3000,
      stationsSequence: ['MCSR'], currentStation: 'MCSR', currentStationIdx: 0,
    },
    // ── TODAY · EXITED · DONE · chargement terminé ────────────────
    {
      ref: 'PL-DM-T10', date: TODAY, truck: trucks[9],
      isValidated: true,  loadingStatus: 'DONE', entryStatus: 'EXITED',
      heureArrivee: '04:00', quai: quaiAMT3.nom, tonnageCharge: 45.0,
      loadingElapsedSeconds: 10800,
      stationsSequence: ['MCSR', 'AMT', 'PW'], currentStation: null, currentStationIdx: 3,
    },
    {
      ref: 'PL-DM-T11', date: TODAY, truck: trucks[10],
      isValidated: true,  loadingStatus: 'DONE', entryStatus: 'EXITED',
      heureArrivee: '04:30', quai: quaiPW2.nom, tonnageCharge: 38.5,
      loadingElapsedSeconds: 9000,
      stationsSequence: ['PW', 'AMT'], currentStation: null, currentStationIdx: 2,
    },
    // ── TOMORROW · IDLE · planifié demain ─────────────────────────
    {
      ref: 'PL-DM-TM01', date: TOMORROW, truck: trucks[11],
      isValidated: true,  loadingStatus: 'WAITING', entryStatus: 'IDLE',
      heureArrivee: '07:00', tonnageCharge: 0,
      stationsSequence: ['MCSR', 'AMT', 'PW'], currentStation: null, currentStationIdx: 0,
    },
    {
      ref: 'PL-DM-TM02', date: TOMORROW, truck: trucks[12],
      isValidated: true,  loadingStatus: 'WAITING', entryStatus: 'IDLE',
      heureArrivee: '08:00', tonnageCharge: 0,
      stationsSequence: ['AMT', 'PW'], currentStation: null, currentStationIdx: 0,
    },
    {
      ref: 'PL-DM-TM03', date: TOMORROW, truck: trucks[13],
      isValidated: false, loadingStatus: 'WAITING', entryStatus: 'IDLE',
      heureArrivee: '09:00', tonnageCharge: 0,
      stationsSequence: ['PW'], currentStation: null, currentStationIdx: 0,
    },
  ];

  const plans: Record<string, LoadingPlan> = {};
  for (const pd of planDefs) {
    const plan = await upsert(planRepo,
      { reference: pd.ref } as any,
      {
        dateLivraison:         pd.date as any,
        isValidated:           pd.isValidated,
        loadingStatus:         pd.loadingStatus,
        entryStatus:           pd.entryStatus,
        heureArrivee:          pd.heureArrivee ?? null,
        quai:                  pd.quai ?? null,
        tonnageCharge:         pd.tonnageCharge ?? 0,
        palettesChargees:      0,
        loadingStartedAt:      pd.loadingStartedAt ?? null,
        loadingElapsedSeconds: pd.loadingElapsedSeconds ?? 0,
        stationsSequence:      pd.stationsSequence ?? null,
        currentStation:        pd.currentStation ?? null,
        currentStationIdx:     pd.currentStationIdx ?? 0,
        truck:                 pd.truck,
        validatedBy:           pd.isValidated ? companyAdmin : null,
        logistiqueCompanyId:   transfood.id,
        signature:             pd.isValidated ? 'demo-sig' : null,
      } as any,
    );
    plans[pd.ref] = plan;
  }
  console.log([
    `  ✓ ${planDefs.length} plans :`,
    `TODAY   → 3×IDLE (dont 1 non-validé) · 2×CALLED · 2×IN_PROGRESS · 2×PAUSED · 2×DONE`,
    `TOMORROW→ 2×IDLE (validés) · 1×IDLE (non-validé)`,
  ].join('\n     '));

  // ════════════════════════════════════════════════════════════════
  // 5. BONS DE LIVRAISON (56)
  // ════════════════════════════════════════════════════════════════
  console.log('\n[5/6] Bons de livraison…');

  type BlDef = {
    num: string;
    clientNom: string;
    destination: string;
    origine?: string;
    tonnageTotal: number;
    nombrePalettes?: number;
    type: TypeChargement;
    statut: BlStatus;
    date: string;
    filiere: Filiere;
    ordre?: number;
    plan?: LoadingPlan;
    notes?: string;
  };

  const clients = [
    'SAPD Distribution',       // 0
    'Cotupha',                  // 1
    'Maghrébine Aliments',      // 2
    'Grande Distribution Sud',  // 3
    'Société Nabeulienne',      // 4
    'Distributeur Côtier',      // 5
    'Monastir Trade',           // 6
    'Kairouan Distribution',    // 7
    'Sud Alimentaire',          // 8
    'Béja Négoce',              // 9
    'Gafsa Mining Supply',      // 10
    'Hypermarché Sfax Mall',    // 11
    'BioFrais Nabeul',          // 12
    'Centrale Bizerte',         // 13
  ];

  const blDefs: BlDef[] = [

    // ══════════════════════════════════════════════════════════════
    // TODAY — Plan PL-DM-T01 (WAITING/IDLE) — 3 BLs VALIDATED
    // ══════════════════════════════════════════════════════════════
    { num: 'BL-DM-T001', clientNom: clients[0],  destination: 'Tunis',    tonnageTotal: 12.0, type: TypeChargement.FRIGO,   statut: BlStatus.VALIDATED, date: TODAY, filiere: filMCR, ordre: 1, plan: plans['PL-DM-T01'] },
    { num: 'BL-DM-T002', clientNom: clients[1],  destination: 'Sousse',   tonnageTotal: 20.0, type: TypeChargement.VRAC,    statut: BlStatus.VALIDATED, date: TODAY, filiere: filAMT, ordre: 2, plan: plans['PL-DM-T01'] },
    { num: 'BL-DM-T003', clientNom: clients[2],  destination: 'Sfax',     tonnageTotal: 15.0, nombrePalettes: 19, type: TypeChargement.PALETTE, statut: BlStatus.VALIDATED, date: TODAY, filiere: filPW,  ordre: 3, plan: plans['PL-DM-T01'] },

    // ── Plan PL-DM-T02 (WAITING/IDLE) — 3 BLs VALIDATED ──────────
    { num: 'BL-DM-T004', clientNom: clients[3],  destination: 'Gabes',    tonnageTotal: 10.0, type: TypeChargement.FRIGO,   statut: BlStatus.VALIDATED, date: TODAY, filiere: filMCR, ordre: 1, plan: plans['PL-DM-T02'] },
    { num: 'BL-DM-T005', clientNom: clients[4],  destination: 'Nabeul',   tonnageTotal: 28.0, type: TypeChargement.CITERNE, statut: BlStatus.VALIDATED, date: TODAY, filiere: filAMT, ordre: 2, plan: plans['PL-DM-T02'] },
    { num: 'BL-DM-T006', clientNom: clients[5],  destination: 'Bizerte',  tonnageTotal: 18.0, nombrePalettes: 23, type: TypeChargement.PALETTE, statut: BlStatus.VALIDATED, date: TODAY, filiere: filPW,  ordre: 3, plan: plans['PL-DM-T02'] },

    // ── Plan PL-DM-T03 (WAITING/IDLE · non validé) — 2 BLs VALIDATED ──
    { num: 'BL-DM-T007', clientNom: clients[6],  destination: 'Monastir', tonnageTotal:  8.0, type: TypeChargement.FRIGO,   statut: BlStatus.VALIDATED, date: TODAY, filiere: filMCR, ordre: 1, plan: plans['PL-DM-T03'], notes: 'Plan non validé par logistique' },
    { num: 'BL-DM-T008', clientNom: clients[7],  destination: 'Kairouan', tonnageTotal: 22.0, type: TypeChargement.VRAC,    statut: BlStatus.VALIDATED, date: TODAY, filiere: filAMT, ordre: 2, plan: plans['PL-DM-T03'], notes: 'Plan non validé par logistique' },

    // ── Plan PL-DM-T04 (CALLED · Q-MCSR-1) — 2 BLs LOADED ────────
    { num: 'BL-DM-T009', clientNom: clients[8],  destination: 'Gafsa',    tonnageTotal: 10.0, type: TypeChargement.FRIGO,   statut: BlStatus.LOADED, date: TODAY, filiere: filMCR, ordre: 1, plan: plans['PL-DM-T04'] },
    { num: 'BL-DM-T010', clientNom: clients[9],  destination: 'Béja',     tonnageTotal: 25.0, type: TypeChargement.VRAC,    statut: BlStatus.LOADED, date: TODAY, filiere: filAMT, ordre: 2, plan: plans['PL-DM-T04'] },

    // ── Plan PL-DM-T05 (CALLED · Q-AMT-1) — 3 BLs LOADED ─────────
    { num: 'BL-DM-T011', clientNom: clients[10], destination: 'Tunis',    tonnageTotal: 22.0, nombrePalettes: 28, type: TypeChargement.PALETTE, statut: BlStatus.LOADED, date: TODAY, filiere: filPW,  ordre: 1, plan: plans['PL-DM-T05'] },
    { num: 'BL-DM-T012', clientNom: clients[11], destination: 'Sousse',   tonnageTotal: 26.0, type: TypeChargement.VRAC,    statut: BlStatus.LOADED, date: TODAY, filiere: filAMT, ordre: 2, plan: plans['PL-DM-T05'] },
    { num: 'BL-DM-T013', clientNom: clients[12], destination: 'Nabeul',   tonnageTotal: 14.0, type: TypeChargement.FRIGO,   statut: BlStatus.LOADED, date: TODAY, filiere: filMCR, ordre: 3, plan: plans['PL-DM-T05'] },

    // ── Plan PL-DM-T06 (IN_PROGRESS · Q-MCSR-2) — 3 BLs LOADED ──
    { num: 'BL-DM-T014', clientNom: clients[0],  destination: 'Sfax',     tonnageTotal: 20.0, type: TypeChargement.FRIGO,   statut: BlStatus.LOADED, date: TODAY, filiere: filMCR, ordre: 1, plan: plans['PL-DM-T06'] },
    { num: 'BL-DM-T015', clientNom: clients[1],  destination: 'Gabes',    tonnageTotal: 18.0, type: TypeChargement.CITERNE, statut: BlStatus.LOADED, date: TODAY, filiere: filAMT, ordre: 2, plan: plans['PL-DM-T06'] },
    { num: 'BL-DM-T016', clientNom: clients[2],  destination: 'Bizerte',  tonnageTotal: 15.0, nombrePalettes: 19, type: TypeChargement.PALETTE, statut: BlStatus.LOADED, date: TODAY, filiere: filPW,  ordre: 3, plan: plans['PL-DM-T06'] },

    // ── Plan PL-DM-T07 (IN_PROGRESS · Q-AMT-2) — 2 BLs LOADED ───
    { num: 'BL-DM-T017', clientNom: clients[3],  destination: 'Monastir', tonnageTotal: 12.0, nombrePalettes: 15, type: TypeChargement.PALETTE, statut: BlStatus.LOADED, date: TODAY, filiere: filMCR, ordre: 1, plan: plans['PL-DM-T07'] },
    { num: 'BL-DM-T018', clientNom: clients[4],  destination: 'Kairouan', tonnageTotal: 16.0, nombrePalettes: 20, type: TypeChargement.PALETTE, statut: BlStatus.LOADED, date: TODAY, filiere: filPW,  ordre: 2, plan: plans['PL-DM-T07'] },

    // ── Plan PL-DM-T08 (PAUSED · Q-PW-1) — 2 BLs LOADED ─────────
    { num: 'BL-DM-T019', clientNom: clients[5],  destination: 'Tunis',    tonnageTotal: 20.0, type: TypeChargement.VRAC,    statut: BlStatus.LOADED, date: TODAY, filiere: filAMT, ordre: 1, plan: plans['PL-DM-T08'] },
    { num: 'BL-DM-T020', clientNom: clients[6],  destination: 'Gafsa',    tonnageTotal:  9.0, type: TypeChargement.FRIGO,   statut: BlStatus.LOADED, date: TODAY, filiere: filMCR, ordre: 2, plan: plans['PL-DM-T08'] },

    // ── Plan PL-DM-T09 (PAUSED · Q-MCSR-3) — 2 BLs LOADED ───────
    { num: 'BL-DM-T021', clientNom: clients[7],  destination: 'Sousse',   tonnageTotal: 18.0, nombrePalettes: 23, type: TypeChargement.PALETTE, statut: BlStatus.LOADED, date: TODAY, filiere: filPW,  ordre: 1, plan: plans['PL-DM-T09'] },
    { num: 'BL-DM-T022', clientNom: clients[8],  destination: 'Sfax',     tonnageTotal: 28.0, type: TypeChargement.CITERNE, statut: BlStatus.LOADED, date: TODAY, filiere: filAMT, ordre: 2, plan: plans['PL-DM-T09'] },

    // ── Plan PL-DM-T10 (DONE/EXITED · Q-AMT-3) — 3 BLs DELIVERED ─
    { num: 'BL-DM-T023', clientNom: clients[9],  destination: 'Nabeul',   tonnageTotal: 18.0, type: TypeChargement.FRIGO,   statut: BlStatus.DELIVERED, date: TODAY, filiere: filMCR, ordre: 1, plan: plans['PL-DM-T10'] },
    { num: 'BL-DM-T024', clientNom: clients[10], destination: 'Bizerte',  tonnageTotal: 25.0, type: TypeChargement.VRAC,    statut: BlStatus.DELIVERED, date: TODAY, filiere: filAMT, ordre: 2, plan: plans['PL-DM-T10'] },
    { num: 'BL-DM-T025', clientNom: clients[11], destination: 'Monastir', tonnageTotal: 20.0, nombrePalettes: 25, type: TypeChargement.PALETTE, statut: BlStatus.DELIVERED, date: TODAY, filiere: filPW,  ordre: 3, plan: plans['PL-DM-T10'] },

    // ── Plan PL-DM-T11 (DONE/EXITED · Q-PW-2) — 3 BLs DELIVERED ──
    { num: 'BL-DM-T026', clientNom: clients[12], destination: 'Kairouan', tonnageTotal: 22.0, nombrePalettes: 28, type: TypeChargement.PALETTE, statut: BlStatus.DELIVERED, date: TODAY, filiere: filPW,  ordre: 1, plan: plans['PL-DM-T11'] },
    { num: 'BL-DM-T027', clientNom: clients[13], destination: 'Tunis',    tonnageTotal: 14.0, type: TypeChargement.FRIGO,   statut: BlStatus.DELIVERED, date: TODAY, filiere: filMCR, ordre: 2, plan: plans['PL-DM-T11'] },
    { num: 'BL-DM-T028', clientNom: clients[0],  destination: 'Sousse',   tonnageTotal: 30.0, type: TypeChargement.CITERNE, statut: BlStatus.DELIVERED, date: TODAY, filiere: filAMT, ordre: 3, plan: plans['PL-DM-T11'] },

    // ── TODAY · Sans plan · DRAFT (en attente de validation) ──────
    { num: 'BL-DM-T029', clientNom: clients[1],  destination: 'Sfax',     tonnageTotal:  9.5, type: TypeChargement.FRIGO,   statut: BlStatus.DRAFT, date: TODAY, filiere: filMCR, notes: 'En attente de validation' },
    { num: 'BL-DM-T030', clientNom: clients[2],  destination: 'Gabes',    tonnageTotal: 16.0, nombrePalettes: 20, type: TypeChargement.PALETTE, statut: BlStatus.DRAFT, date: TODAY, filiere: filAMT, notes: 'Commande urgente — à valider' },
    { num: 'BL-DM-T031', clientNom: clients[3],  destination: 'Gafsa',    tonnageTotal: 14.0, type: TypeChargement.VRAC,    statut: BlStatus.DRAFT, date: TODAY, filiere: filPW,  notes: 'BL créé manuellement' },
    { num: 'BL-DM-T032', clientNom: clients[4],  destination: 'Béja',     tonnageTotal: 22.0, type: TypeChargement.CITERNE, statut: BlStatus.DRAFT, date: TODAY, filiere: filAMT, notes: 'Nouveau client' },

    // ── TODAY · Sans plan · VALIDATED (planification en attente) ──
    { num: 'BL-DM-T033', clientNom: clients[5],  destination: 'Nabeul',   tonnageTotal: 11.0, type: TypeChargement.FRIGO,   statut: BlStatus.VALIDATED, date: TODAY, filiere: filMCR, notes: 'Validé — pas encore planifié' },
    { num: 'BL-DM-T034', clientNom: clients[6],  destination: 'Bizerte',  tonnageTotal: 30.0, type: TypeChargement.VRAC,    statut: BlStatus.VALIDATED, date: TODAY, filiere: filAMT, notes: 'Validé — pas encore planifié' },
    { num: 'BL-DM-T035', clientNom: clients[7],  destination: 'Monastir', tonnageTotal: 16.0, nombrePalettes: 20, type: TypeChargement.PALETTE, statut: BlStatus.VALIDATED, date: TODAY, filiere: filPW,  notes: 'Livraison urgente' },
    { num: 'BL-DM-T036', clientNom: clients[8],  destination: 'Kairouan', tonnageTotal: 18.0, type: TypeChargement.FRIGO,   statut: BlStatus.VALIDATED, date: TODAY, filiere: filMCR, notes: 'Deuxième passage' },

    // ══════════════════════════════════════════════════════════════
    // TOMORROW — Plan PL-DM-TM01 (validé) — 3 BLs VALIDATED
    // ══════════════════════════════════════════════════════════════
    { num: 'BL-DM-TM01', clientNom: clients[9],  destination: 'Tunis',    tonnageTotal: 14.0, type: TypeChargement.FRIGO,   statut: BlStatus.VALIDATED, date: TOMORROW, filiere: filMCR, ordre: 1, plan: plans['PL-DM-TM01'] },
    { num: 'BL-DM-TM02', clientNom: clients[10], destination: 'Sousse',   tonnageTotal: 22.0, type: TypeChargement.VRAC,    statut: BlStatus.VALIDATED, date: TOMORROW, filiere: filAMT, ordre: 2, plan: plans['PL-DM-TM01'] },
    { num: 'BL-DM-TM03', clientNom: clients[11], destination: 'Sfax',     tonnageTotal: 18.0, nombrePalettes: 23, type: TypeChargement.PALETTE, statut: BlStatus.VALIDATED, date: TOMORROW, filiere: filPW,  ordre: 3, plan: plans['PL-DM-TM01'] },

    // ── Plan PL-DM-TM02 (validé) — 2 BLs VALIDATED ───────────────
    { num: 'BL-DM-TM04', clientNom: clients[12], destination: 'Gabes',    tonnageTotal: 10.0, type: TypeChargement.FRIGO,   statut: BlStatus.VALIDATED, date: TOMORROW, filiere: filMCR, ordre: 1, plan: plans['PL-DM-TM02'] },
    { num: 'BL-DM-TM05', clientNom: clients[13], destination: 'Nabeul',   tonnageTotal: 26.0, type: TypeChargement.CITERNE, statut: BlStatus.VALIDATED, date: TOMORROW, filiere: filAMT, ordre: 2, plan: plans['PL-DM-TM02'] },

    // ── Plan PL-DM-TM03 (non validé) — 2 BLs VALIDATED ──────────
    { num: 'BL-DM-TM06', clientNom: clients[0],  destination: 'Bizerte',  tonnageTotal: 20.0, nombrePalettes: 25, type: TypeChargement.PALETTE, statut: BlStatus.VALIDATED, date: TOMORROW, filiere: filPW,  ordre: 1, plan: plans['PL-DM-TM03'], notes: 'Plan demain non encore validé' },
    { num: 'BL-DM-TM07', clientNom: clients[1],  destination: 'Monastir', tonnageTotal: 24.0, type: TypeChargement.VRAC,    statut: BlStatus.VALIDATED, date: TOMORROW, filiere: filAMT, ordre: 2, plan: plans['PL-DM-TM03'], notes: 'Plan demain non encore validé' },

    // ── TOMORROW · Sans plan · DRAFT ─────────────────────────────
    { num: 'BL-DM-TM08', clientNom: clients[2],  destination: 'Kairouan', tonnageTotal: 13.0, type: TypeChargement.FRIGO,   statut: BlStatus.DRAFT, date: TOMORROW, filiere: filMCR, notes: 'BL demain — pas encore planifié' },
    { num: 'BL-DM-TM09', clientNom: clients[3],  destination: 'Gafsa',    tonnageTotal: 17.0, nombrePalettes: 22, type: TypeChargement.PALETTE, statut: BlStatus.DRAFT, date: TOMORROW, filiere: filPW,  notes: 'BL demain — en cours de validation' },
    { num: 'BL-DM-TM10', clientNom: clients[4],  destination: 'Béja',     tonnageTotal: 28.0, type: TypeChargement.CITERNE, statut: BlStatus.DRAFT, date: TOMORROW, filiere: filAMT, notes: 'Nouveau client demain' },

    // ── TOMORROW · Sans plan · VALIDATED ─────────────────────────
    { num: 'BL-DM-TM11', clientNom: clients[5],  destination: 'Tunis',    tonnageTotal: 12.0, type: TypeChargement.FRIGO,   statut: BlStatus.VALIDATED, date: TOMORROW, filiere: filMCR, notes: 'Validé pour demain — à planifier' },
    { num: 'BL-DM-TM12', clientNom: clients[6],  destination: 'Sousse',   tonnageTotal: 32.0, type: TypeChargement.VRAC,    statut: BlStatus.VALIDATED, date: TOMORROW, filiere: filAMT, notes: 'Validé pour demain — à planifier' },
    { num: 'BL-DM-TM13', clientNom: clients[7],  destination: 'Sfax',     tonnageTotal: 15.0, nombrePalettes: 19, type: TypeChargement.PALETTE, statut: BlStatus.VALIDATED, date: TOMORROW, filiere: filPW,  notes: 'Commande régulière' },
    { num: 'BL-DM-TM14', clientNom: clients[8],  destination: 'Gabes',    tonnageTotal: 20.0, type: TypeChargement.FRIGO,   statut: BlStatus.VALIDATED, date: TOMORROW, filiere: filMCR, notes: 'Priorité haute' },

    // ══════════════════════════════════════════════════════════════
    // HISTORIQUE — Hier (pour les rapports et l'historique)
    // ══════════════════════════════════════════════════════════════
    { num: 'BL-DM-Y001', clientNom: clients[9],  destination: 'Nabeul',   tonnageTotal: 16.0, type: TypeChargement.FRIGO,   statut: BlStatus.DELIVERED, date: YESTERDAY, filiere: filMCR },
    { num: 'BL-DM-Y002', clientNom: clients[10], destination: 'Bizerte',  tonnageTotal: 26.0, type: TypeChargement.VRAC,    statut: BlStatus.DELIVERED, date: YESTERDAY, filiere: filAMT },
    { num: 'BL-DM-Y003', clientNom: clients[11], destination: 'Monastir', tonnageTotal: 18.0, nombrePalettes: 23, type: TypeChargement.PALETTE, statut: BlStatus.DELIVERED, date: YESTERDAY, filiere: filPW },
    { num: 'BL-DM-Y004', clientNom: clients[12], destination: 'Kairouan', tonnageTotal: 30.0, type: TypeChargement.CITERNE, statut: BlStatus.DELIVERED, date: YESTERDAY, filiere: filAMT },
    { num: 'BL-DM-Y005', clientNom: clients[13], destination: 'Gafsa',    tonnageTotal: 22.0, type: TypeChargement.VRAC,    statut: BlStatus.DELIVERED, date: YESTERDAY, filiere: filPW },
    { num: 'BL-DM-Y006', clientNom: clients[0],  destination: 'Tunis',    tonnageTotal: 14.0, type: TypeChargement.FRIGO,   statut: BlStatus.DELIVERED, date: YESTERDAY, filiere: filMCR },
  ];

  let blCount = 0;
  for (const bd of blDefs) {
    await upsert(blRepo,
      { numeroBl: bd.num } as any,
      {
        clientNom:          bd.clientNom,
        clientAdresse:      bd.destination,
        destination:        bd.destination,
        origine:            bd.origine ?? 'Béja',
        typeChargement:     bd.type,
        tonnageTotal:       bd.tonnageTotal,
        nombrePalettes:     bd.nombrePalettes ?? (bd.type === TypeChargement.PALETTE ? Math.ceil(bd.tonnageTotal / 0.8) : 0),
        statut:             bd.statut,
        datelivraison:      bd.date as any,
        filiere:            bd.filiere,
        societeExpeditrice: societe,
        company:            transfood,
        loadingPlan:        bd.plan ?? null,
        ordreChargement:    bd.ordre ?? null,
        notes:              bd.notes ?? null,
        erpReference:       `ERP-${bd.num}`,
        libelle:            bd.clientNom,
      } as any,
    );
    blCount++;
    if (blCount % 10 === 0) process.stdout.write(`  … ${blCount} BLs\n`);
  }
  console.log(`  ✓ ${blCount} bons de livraison créés`);

  // ════════════════════════════════════════════════════════════════
  // 6. RÉCAPITULATIF
  // ════════════════════════════════════════════════════════════════
  const todayBLs     = blDefs.filter((b) => b.date === TODAY);
  const tomorrowBLs  = blDefs.filter((b) => b.date === TOMORROW);
  const yesterdayBLs = blDefs.filter((b) => b.date === YESTERDAY);

  console.log('\n[6/6] ✅  Seeder terminé !');
  console.log('═'.repeat(64));
  console.log(`  📅  TODAY    (${TODAY}) : ${todayBLs.length} BLs`);
  console.log(`    DRAFT=${todayBLs.filter((b) => b.statut === BlStatus.DRAFT).length}  VALIDATED=${todayBLs.filter((b) => b.statut === BlStatus.VALIDATED).length}  LOADED=${todayBLs.filter((b) => b.statut === BlStatus.LOADED).length}  DELIVERED=${todayBLs.filter((b) => b.statut === BlStatus.DELIVERED).length}`);
  console.log(`  📅  TOMORROW (${TOMORROW}) : ${tomorrowBLs.length} BLs`);
  console.log(`    DRAFT=${tomorrowBLs.filter((b) => b.statut === BlStatus.DRAFT).length}  VALIDATED=${tomorrowBLs.filter((b) => b.statut === BlStatus.VALIDATED).length}  LOADED=0  DELIVERED=0`);
  console.log(`  📅  HIER     (${YESTERDAY}) : ${yesterdayBLs.length} BLs (DELIVERED)`);
  console.log('  ─'.repeat(32));
  console.log(`  TOTAL : ${blCount} BLs · ${planDefs.length} plans · ${trucks.length} camions`);
  console.log('═'.repeat(64));
  console.log('  PLANS TODAY  : 3×IDLE · 2×CALLED · 2×IN_PROGRESS · 2×PAUSED · 2×DONE');
  console.log('  PLANS DEMAIN : 2×IDLE-validés · 1×IDLE-non-validé');
  console.log('═'.repeat(64));
  console.log('  COMPTES  (mot de passe : Demo123!)');
  console.log('  admin@tms.com             → SUPER_ADMIN');
  console.log('  logistique@transfood.tn   → LOGISTIC_ADMIN');
  console.log('  admin@roseblanche.tn      → EXPEDITEUR_ADMIN');
  console.log('  admin.mcr@roseblanche.tn  → FILIERE_ADMIN (MCSR)');
  console.log('  admin.amt@roseblanche.tn  → FILIERE_ADMIN (AMT)');
  console.log('  admin.pw@roseblanche.tn   → FILIERE_ADMIN (PW)');
  console.log('  mag1@roseblanche.tn       → MAGASINIER (MCSR+AMT)');
  console.log('  mag2@roseblanche.tn       → MAGASINIER (PW)');
  console.log('  sec1@roseblanche.tn       → SECURITE (MCSR+AMT)');
  console.log('  sec2@roseblanche.tn       → SECURITE (PW)');
  console.log('═'.repeat(64));

  await app.close();
}

bootstrap().catch((e) => {
  console.error('❌ Erreur seeder :', e);
  process.exit(1);
});
