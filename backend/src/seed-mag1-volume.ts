/**
 * Seeder — Volume : 54 camions + 35 plans pour mag1@roseblanche.tn
 * =================================================================
 * Crée 6 nouvelles sociétés de livraison (9 camions chacune = 54 total),
 * puis 35 plans de chargement pour aujourd'hui, tous visibles par
 * mag1@roseblanche.tn (filières MCSR + AMT).
 *
 * Distribution des états :
 *   IDLE/WAITING   × 15  → draggables dans le panneau gauche
 *   CALLED         × 5   → "Appelé", draggables
 *   ENTERED/WAITING× 3   → au quai, bouton Démarrer
 *   ENTERED/IP     × 5   → au quai, timer en cours
 *   ENTERED/PAUSED × 2   → au quai, timer figé
 *   EXITED/DONE    × 5   → terminés (historique du jour)
 *                 Total : 35 plans, 35 camions utilisés
 *
 * Pré-requis : npm run seed:rb-complet  (TransFood + Rose Blanche + MCSR/AMT/PW)
 *              npm run seed:gestion-quais (ou seed:plan-quai) pour les quais
 * Lancer     : npm run seed:mag1-volume
 * Compte     : mag1@roseblanche.tn  /  Demo123!
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ObjectLiteral } from 'typeorm';
import { Company }             from './companies/company.entity';
import { User }                from './users/user.entity';
import { DeliveryCompany }     from './delivery-companies/delivery-company.entity';
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

function pad(n: number): string {
  return String(n).padStart(3, '0');
}

async function findOrFail<T extends ObjectLiteral>(
  repo: Repository<T>,
  where: Partial<T>,
  label: string,
): Promise<T> {
  const e = await repo.findOne({ where: where as any });
  if (!e) throw new Error(`${label} introuvable. Lancez d'abord: npm run seed:rb-complet`);
  return e;
}

async function upsertDC(
  repo: Repository<DeliveryCompany>,
  nom: string,
  adresse: string,
  telephone: string,
  company: Company,
): Promise<DeliveryCompany> {
  const existing = await repo.findOne({ where: { nom } });
  if (existing) return existing;
  return repo.save(repo.create({ nom, adresse, telephone, isActive: true, company }));
}

async function upsertTruck(
  repo: Repository<Truck>,
  matricule: string,
  capaciteTonnage: number,
  capacitePalettes: number,
  type: string,
  dc: DeliveryCompany,
): Promise<Truck> {
  const existing = await repo.findOne({ where: { matricule } });
  if (existing) return existing;
  return repo.save(repo.create({
    matricule, capaciteTonnage, capacitePalettes, type, isActive: true, deliveryCompany: dc,
  }));
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
): Promise<void> {
  const found = await repo.findOne({ where: { numeroBl } as any });
  if (found) {
    Object.assign(found, data);
    await repo.save(found);
    return;
  }
  await repo.save(repo.create({ numeroBl, ...data } as any));
}

// ── Données ───────────────────────────────────────────────────────────────────

const DELIVERY_COMPANIES = [
  {
    nom: 'Tunis Cargo Express',
    adresse: 'Avenue Habib Bourguiba km 3, Tunis',
    tel: '+216 71 200 100',
    prefix: 'TCX',
    trucks: [
      { t: 24, p: 20, type: 'FRIGO' }, { t: 18, p: 16, type: 'FRIGO' },
      { t: 30, p: 0,  type: 'VRAC'  }, { t: 20, p: 18, type: 'PALETTE' },
      { t: 28, p: 0,  type: 'CITERNE'}, { t: 22, p: 20, type: 'PALETTE' },
      { t: 16, p: 14, type: 'FRIGO' }, { t: 26, p: 0,  type: 'VRAC' },
      { t: 12, p: 10, type: 'FRIGO' },
    ],
  },
  {
    nom: 'Sahel Transport SARL',
    adresse: 'Zone Industrielle Sousse Nord',
    tel: '+216 73 300 200',
    prefix: 'SHT',
    trucks: [
      { t: 32, p: 0,  type: 'CITERNE'}, { t: 24, p: 0,  type: 'VRAC' },
      { t: 20, p: 18, type: 'PALETTE' }, { t: 18, p: 16, type: 'FRIGO' },
      { t: 28, p: 0,  type: 'VRAC'  }, { t: 15, p: 12, type: 'FRIGO' },
      { t: 22, p: 0,  type: 'CITERNE'}, { t: 26, p: 22, type: 'PALETTE' },
      { t: 14, p: 12, type: 'FRIGO' },
    ],
  },
  {
    nom: 'Beja Logistique',
    adresse: 'Route de Tunis km 8, Beja',
    tel: '+216 78 450 300',
    prefix: 'BJL',
    trucks: [
      { t: 20, p: 18, type: 'FRIGO' }, { t: 24, p: 0,  type: 'VRAC' },
      { t: 18, p: 16, type: 'PALETTE' }, { t: 30, p: 0,  type: 'CITERNE'},
      { t: 16, p: 14, type: 'FRIGO' }, { t: 22, p: 20, type: 'PALETTE' },
      { t: 28, p: 0,  type: 'VRAC'  }, { t: 12, p: 10, type: 'FRIGO' },
      { t: 24, p: 0,  type: 'CITERNE'},
    ],
  },
  {
    nom: 'Sfax Distribution',
    adresse: 'Route de Gabes km 5, Sfax',
    tel: '+216 74 600 400',
    prefix: 'SFX',
    trucks: [
      { t: 26, p: 22, type: 'PALETTE' }, { t: 30, p: 0,  type: 'VRAC' },
      { t: 20, p: 0,  type: 'CITERNE'}, { t: 18, p: 16, type: 'FRIGO' },
      { t: 24, p: 20, type: 'PALETTE' }, { t: 16, p: 0,  type: 'VRAC' },
      { t: 22, p: 18, type: 'FRIGO' }, { t: 28, p: 0,  type: 'CITERNE'},
      { t: 14, p: 12, type: 'PALETTE' },
    ],
  },
  {
    nom: 'Nord Express TN',
    adresse: 'Zone Franche Bizerte',
    tel: '+216 72 700 500',
    prefix: 'NEX',
    trucks: [
      { t: 22, p: 20, type: 'FRIGO' }, { t: 18, p: 0,  type: 'VRAC' },
      { t: 28, p: 24, type: 'PALETTE' }, { t: 32, p: 0,  type: 'CITERNE'},
      { t: 20, p: 18, type: 'FRIGO' }, { t: 16, p: 14, type: 'PALETTE' },
      { t: 24, p: 0,  type: 'VRAC'  }, { t: 18, p: 16, type: 'FRIGO' },
      { t: 12, p: 0,  type: 'CITERNE'},
    ],
  },
  {
    nom: 'Côtier Freight',
    adresse: 'Port de Rades, Ben Arous',
    tel: '+216 71 800 600',
    prefix: 'CTF',
    trucks: [
      { t: 28, p: 0,  type: 'VRAC'  }, { t: 20, p: 18, type: 'FRIGO' },
      { t: 24, p: 22, type: 'PALETTE' }, { t: 18, p: 0,  type: 'CITERNE'},
      { t: 22, p: 20, type: 'FRIGO' }, { t: 30, p: 0,  type: 'VRAC' },
      { t: 16, p: 14, type: 'PALETTE' }, { t: 26, p: 0,  type: 'CITERNE'},
      { t: 14, p: 12, type: 'FRIGO' },
    ],
  },
];

const CLIENTS = [
  'Carrefour Market', 'Magasin Général', 'Géant Casino', 'Monoprix TN', 'MG Hyper',
  'Aziza Supermarché', 'Saber Distributions', 'Coop Tunis', 'Champion Market',
  'Maxula Distrib.', 'HyperOne', 'Express Market', 'TFM Distribution',
  'Hatem Market', 'Centrex Distrib.', 'Hypercoop', 'Bidali Market',
];

const DESTINATIONS = [
  'Tunis Centre', 'La Marsa', 'Ariana', 'Ben Arous', 'Manouba',
  'Sfax Centre', 'Sfax Sud', 'Sousse', 'Monastir', 'Mahdia',
  'Nabeul', 'Hammamet', 'Bizerte', 'Kairouan', 'Sidi Bouzid',
  'Gabès', 'Médenine', 'Gafsa', 'Jendouba', 'El Kef',
];

function pick<T>(arr: T[], idx: number): T {
  return arr[idx % arr.length];
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });

  const companyRepo  = app.get<Repository<Company>>(getRepositoryToken(Company));
  const userRepo     = app.get<Repository<User>>(getRepositoryToken(User));
  const dcRepo       = app.get<Repository<DeliveryCompany>>(getRepositoryToken(DeliveryCompany));
  const societeRepo  = app.get<Repository<SocieteExpeditrice>>(getRepositoryToken(SocieteExpeditrice));
  const filiereRepo  = app.get<Repository<Filiere>>(getRepositoryToken(Filiere));
  const quaiRepo     = app.get<Repository<Quai>>(getRepositoryToken(Quai));
  const blRepo       = app.get<Repository<BonLivraison>>(getRepositoryToken(BonLivraison));
  const planRepo     = app.get<Repository<LoadingPlan>>(getRepositoryToken(LoadingPlan));
  const truckRepo    = app.get<Repository<Truck>>(getRepositoryToken(Truck));

  console.log('\n[1/5] Entités de base...');

  const transfood    = await findOrFail(companyRepo,  { code: 'TF' } as any,                     'TransFood (code TF)');
  const adminUser    = await findOrFail(userRepo,     { email: 'logistique@transfood.tn' } as any, 'logistique@transfood.tn');
  const societe      = await findOrFail(societeRepo,  { nom: 'Rose Blanche' } as any,              'Société Rose Blanche');
  const filMCSR      = await findOrFail(filiereRepo,  { code: 'MCSR' } as any,                    'Filière MCSR');
  const filAMT       = await findOrFail(filiereRepo,  { code: 'AMT'  } as any,                    'Filière AMT');

  // Quais (optionnels — on ne plante pas si absents)
  const qMCSR1 = await quaiRepo.findOne({ where: { nom: 'Q-MCSR-1' } });
  const qMCSR2 = await quaiRepo.findOne({ where: { nom: 'Q-MCSR-2' } });
  const qMCSR3 = await quaiRepo.findOne({ where: { nom: 'Q-MCSR-3' } });
  const qAMT1  = await quaiRepo.findOne({ where: { nom: 'Q-AMT-1' } });
  const qAMT2  = await quaiRepo.findOne({ where: { nom: 'Q-AMT-2' } });

  if (!qMCSR1 || !qMCSR2 || !qMCSR3 || !qAMT1 || !qAMT2) {
    console.warn('  ⚠️  Certains quais absents — lancez seed:gestion-quais en premier');
    console.warn('  ⚠️  Les plans ENTERED seront créés sans quai assigné');
  }

  console.log('  ✓ TransFood, Rose Blanche, MCSR, AMT');

  // ── Camions ───────────────────────────────────────────────────────────────

  console.log('\n[2/5] Création des sociétés de livraison et camions...');

  const allTrucks: Truck[] = [];

  for (const dcDef of DELIVERY_COMPANIES) {
    const dc = await upsertDC(dcRepo, dcDef.nom, dcDef.adresse, dcDef.tel, transfood);
    let created = 0;
    for (let i = 0; i < dcDef.trucks.length; i++) {
      const { t, p, type } = dcDef.trucks[i];
      const matricule = `${dcDef.prefix}-${pad(i + 1)}-V${new Date().getFullYear().toString().slice(2)}`;
      const truck = await upsertTruck(truckRepo, matricule, t, p, type, dc);
      allTrucks.push(truck);
      created++;
    }
    console.log(`  ✓ ${dcDef.nom.padEnd(26)} — ${created} camions`);
  }

  console.log(`\n  → ${allTrucks.length} camions disponibles au total`);

  // ── Nettoyage des quais ───────────────────────────────────────────────────

  console.log('\n[3/5] Nettoyage des conflits de quai...');

  const quaiNames = [qMCSR1, qMCSR2, qMCSR3, qAMT1, qAMT2]
    .filter(Boolean)
    .map((q) => q!.nom);

  if (quaiNames.length > 0) {
    const conflicts = await planRepo
      .createQueryBuilder('lp')
      .where('lp.quai IN (:...quais)', { quais: quaiNames })
      .andWhere("lp.entryStatus NOT IN ('EXITED')")
      .andWhere("lp.loadingStatus NOT IN ('DONE')")
      .getMany();
    for (const p of conflicts) {
      await planRepo.update(p.id, {
        quai: undefined, entryStatus: 'IDLE' as any,
        loadingStatus: 'WAITING' as any, loadingStartedAt: undefined as any,
        loadingElapsedSeconds: 0,
      });
    }
    console.log(`  ✓ ${conflicts.length} plan(s) conflictuel(s) remis à zéro`);
  }

  // ── Plans de chargement ───────────────────────────────────────────────────

  const DATE  = today();
  const base  = {
    dateLivraison:       DATE as any,
    isValidated:         true,
    validatedBy:         adminUser,
    logistiqueCompanyId: transfood.id,
    signature:           'sig_vol_mag1',
  };

  let truckIdx = 0;
  let blSeq    = 1;
  let planCount = 0;

  function nextTruck(): Truck {
    if (truckIdx >= allTrucks.length) truckIdx = 0;
    return allTrucks[truckIdx++];
  }

  function blNom(): string { return `BL-VOL-${pad(blSeq++)}`; }

  function heureArrivee(hh: number, mm = 0): string {
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }

  console.log(`\n[4/5] Plans de chargement pour le ${DATE}...`);

  // ─── 15 IDLE/WAITING — draggables ──────────────────────────────────────────

  console.log('  → 15 plans IDLE/WAITING (draggables)...');
  for (let i = 0; i < 15; i++) {
    const ref  = `VM1-IDLE-${pad(i + 1)}`;
    const fil  = i % 2 === 0 ? filMCSR : filAMT;
    const plan = await upsertPlan(planRepo, ref, {
      ...base, truck: nextTruck(),
      heureArrivee:  heureArrivee(8 + Math.floor(i / 3), (i % 3) * 15),
      entryStatus:   'IDLE'    as any,
      loadingStatus: 'WAITING' as any,
      quai:          null as any,
      tonnageCharge: 0, palettesChargees: 0,
    } as any);
    const type = [TypeChargement.FRIGO, TypeChargement.PALETTE, TypeChargement.VRAC][i % 3];
    await upsertBl(blRepo, blNom(), {
      loadingPlan: plan, filiere: fil, societeExpeditrice: societe,
      company: transfood, datelivraison: DATE as any,
      clientNom: pick(CLIENTS, i), destination: pick(DESTINATIONS, i),
      origine: 'Depôt Béja', typeChargement: type,
      tonnageTotal: 12 + (i % 5) * 4, nombrePalettes: type === TypeChargement.FRIGO ? 0 : 10 + i % 8,
      statut: BlStatus.VALIDATED, ordreChargement: 1,
    });
    if (i % 3 === 0) {
      await upsertBl(blRepo, blNom(), {
        loadingPlan: plan, filiere: i % 4 === 0 ? filAMT : filMCSR,
        societeExpeditrice: societe, company: transfood,
        datelivraison: DATE as any,
        clientNom: pick(CLIENTS, i + 5), destination: pick(DESTINATIONS, i + 8),
        origine: 'Entrepôt Charguia', typeChargement: TypeChargement.VRAC,
        tonnageTotal: 18 + i % 6, nombrePalettes: 0,
        statut: BlStatus.VALIDATED, ordreChargement: 2,
      });
    }
    planCount++;
  }

  // ─── 5 CALLED — appelés ────────────────────────────────────────────────────

  console.log('  → 5 plans CALLED (appelés)...');
  for (let i = 0; i < 5; i++) {
    const ref  = `VM1-CALL-${pad(i + 1)}`;
    const fil  = i % 2 === 0 ? filMCSR : filAMT;
    const plan = await upsertPlan(planRepo, ref, {
      ...base, truck: nextTruck(),
      heureArrivee:  heureArrivee(7, i * 12),
      entryStatus:   'CALLED'  as any,
      loadingStatus: 'WAITING' as any,
      quai:          null as any,
      tonnageCharge: 0, palettesChargees: 0,
    } as any);
    await upsertBl(blRepo, blNom(), {
      loadingPlan: plan, filiere: fil, societeExpeditrice: societe,
      company: transfood, datelivraison: DATE as any,
      clientNom: pick(CLIENTS, i + 2), destination: pick(DESTINATIONS, i + 3),
      origine: 'Usine Bir El Bey', typeChargement: TypeChargement.FRIGO,
      tonnageTotal: 20 + i * 2, nombrePalettes: 0,
      statut: BlStatus.VALIDATED, ordreChargement: 1,
    });
    planCount++;
  }

  // ─── 3 ENTERED/WAITING — au quai, Démarrer ─────────────────────────────────

  console.log('  → 3 plans ENTERED/WAITING (au quai)...');
  const waitingQuais = [qMCSR1, qMCSR2, qAMT1].filter(Boolean) as Quai[];
  for (let i = 0; i < 3; i++) {
    const ref    = `VM1-ENT-W-${pad(i + 1)}`;
    const fil    = waitingQuais[i]?.nom.startsWith('Q-AMT') ? filAMT : filMCSR;
    const quaiNom = waitingQuais[i]?.nom ?? null;
    const plan   = await upsertPlan(planRepo, ref, {
      ...base, truck: nextTruck(),
      heureArrivee:  heureArrivee(6, i * 20),
      entryStatus:   'ENTERED' as any,
      loadingStatus: 'WAITING' as any,
      quai:          quaiNom as any,
      tonnageCharge: 0, palettesChargees: i * 8,
    } as any);
    await upsertBl(blRepo, blNom(), {
      loadingPlan: plan, filiere: fil, societeExpeditrice: societe,
      company: transfood, datelivraison: DATE as any,
      clientNom: pick(CLIENTS, i + 7), destination: pick(DESTINATIONS, i + 12),
      origine: 'Dépôt Mégrine', typeChargement: TypeChargement.PALETTE,
      tonnageTotal: 14 + i * 3, nombrePalettes: 12 + i * 4,
      statut: BlStatus.VALIDATED, ordreChargement: 1,
    });
    planCount++;
  }

  // ─── 5 ENTERED/IN_PROGRESS — chargement actif ──────────────────────────────

  console.log('  → 5 plans ENTERED/IN_PROGRESS (timer actif)...');
  const ipQuais = [qMCSR3, qAMT2, qMCSR1, qAMT1, qMCSR2].filter(Boolean) as Quai[];
  const ipDurations = [25, 55, 90, 110, 35]; // minutes écoulées
  for (let i = 0; i < 5; i++) {
    const ref     = `VM1-ENT-IP-${pad(i + 1)}`;
    const fil     = ipQuais[i]?.nom.startsWith('Q-AMT') ? filAMT : filMCSR;
    const quaiNom = ipQuais[i]?.nom ?? null;
    const mins    = ipDurations[i];
    const plan    = await upsertPlan(planRepo, ref, {
      ...base, truck: nextTruck(),
      heureArrivee:  heureArrivee(4 + i, 30),
      entryStatus:   'ENTERED'     as any,
      loadingStatus: 'IN_PROGRESS' as any,
      quai:          quaiNom as any,
      tonnageCharge: 10 + i * 5, palettesChargees: i * 6,
      loadingStartedAt:     minutesAgo(mins) as any,
      loadingElapsedSeconds: 0,
    } as any);
    await upsertBl(blRepo, blNom(), {
      loadingPlan: plan, filiere: fil, societeExpeditrice: societe,
      company: transfood, datelivraison: DATE as any,
      clientNom: pick(CLIENTS, i + 4), destination: pick(DESTINATIONS, i + 6),
      origine: 'Dépôt Charguia', typeChargement: TypeChargement.FRIGO,
      tonnageTotal: 16 + i * 4, nombrePalettes: 0,
      statut: BlStatus.LOADED, ordreChargement: 1,
    });
    await upsertBl(blRepo, blNom(), {
      loadingPlan: plan, filiere: fil, societeExpeditrice: societe,
      company: transfood, datelivraison: DATE as any,
      clientNom: pick(CLIENTS, i + 9), destination: pick(DESTINATIONS, i + 14),
      origine: 'Dépôt Charguia', typeChargement: TypeChargement.VRAC,
      tonnageTotal: 12 + i * 3, nombrePalettes: 0,
      statut: BlStatus.LOADED, ordreChargement: 2,
    });
    planCount++;
  }

  // ─── 2 ENTERED/PAUSED — en pause ───────────────────────────────────────────

  console.log('  → 2 plans ENTERED/PAUSED (en pause)...');
  const pauseQuais = [qAMT2, qMCSR3].filter(Boolean) as Quai[];
  const pauseSecs  = [1800, 2700]; // 30 min, 45 min
  for (let i = 0; i < 2; i++) {
    const ref     = `VM1-ENT-PA-${pad(i + 1)}`;
    const fil     = pauseQuais[i]?.nom.startsWith('Q-AMT') ? filAMT : filMCSR;
    const quaiNom = pauseQuais[i]?.nom ?? null;
    const plan    = await upsertPlan(planRepo, ref, {
      ...base, truck: nextTruck(),
      heureArrivee:  heureArrivee(5, i * 30),
      entryStatus:   'ENTERED' as any,
      loadingStatus: 'PAUSED'  as any,
      quai:          quaiNom as any,
      tonnageCharge: 15 + i * 8, palettesChargees: 0,
      loadingStartedAt:      null as any,
      loadingElapsedSeconds: pauseSecs[i],
    } as any);
    await upsertBl(blRepo, blNom(), {
      loadingPlan: plan, filiere: fil, societeExpeditrice: societe,
      company: transfood, datelivraison: DATE as any,
      clientNom: pick(CLIENTS, i + 6), destination: pick(DESTINATIONS, i + 10),
      origine: 'Entrepôt Borj Louzir', typeChargement: TypeChargement.CITERNE,
      tonnageTotal: 28 + i * 6, nombrePalettes: 0,
      statut: BlStatus.LOADED, ordreChargement: 1,
    });
    planCount++;
  }

  // ─── 5 EXITED/DONE — terminés ──────────────────────────────────────────────

  console.log('  → 5 plans EXITED/DONE (terminés)...');
  const doneDurations = [4800, 3600, 2400, 5400, 1800]; // secondes
  for (let i = 0; i < 5; i++) {
    const ref  = `VM1-DONE-${pad(i + 1)}`;
    const fil  = i % 2 === 0 ? filMCSR : filAMT;
    const plan = await upsertPlan(planRepo, ref, {
      ...base, truck: nextTruck(),
      heureArrivee:  heureArrivee(2 + i, 0),
      entryStatus:   'EXITED'  as any,
      loadingStatus: 'DONE'    as any,
      quai:          null as any,
      tonnageCharge: 20 + i * 5, palettesChargees: i * 10,
      loadingStartedAt:      null as any,
      loadingElapsedSeconds: doneDurations[i],
    } as any);
    await upsertBl(blRepo, blNom(), {
      loadingPlan: plan, filiere: fil, societeExpeditrice: societe,
      company: transfood, datelivraison: DATE as any,
      clientNom: pick(CLIENTS, i + 10), destination: pick(DESTINATIONS, i + 15),
      origine: 'Usine Bir El Bey', typeChargement: TypeChargement.PALETTE,
      tonnageTotal: 18 + i * 3, nombrePalettes: 14 + i * 2,
      statut: BlStatus.DELIVERED, ordreChargement: 1,
    });
    planCount++;
  }

  // ── Résumé ────────────────────────────────────────────────────────────────

  console.log('\n[5/5] Résumé...');
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║     ✅  Seeder Volume mag1@roseblanche.tn — OK                 ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log(`║  Date    : ${DATE.padEnd(55)}║`);
  console.log(`║  Camions : ${String(allTrucks.length).padEnd(3)} créés (6 sociétés × 9 camions)           ║`);
  console.log(`║  Plans   : ${String(planCount).padEnd(3)} créés pour aujourd'hui                   ║`);
  console.log(`║  BLs     : ${String(blSeq - 1).padEnd(3)} bons de livraison                         ║`);
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log('║  Répartition des états :                                        ║');
  console.log('║   IDLE/WAITING   × 15  → draggables (panel gauche)             ║');
  console.log('║   CALLED         × 5   → "Appelé"  (panel gauche)              ║');
  console.log('║   ENTERED/WAIT   × 3   → au quai, bouton Démarrer              ║');
  console.log('║   ENTERED/IP     × 5   → au quai, timer en cours               ║');
  console.log('║   ENTERED/PAUSED × 2   → au quai, timer figé                   ║');
  console.log('║   EXITED/DONE    × 5   → terminés (historique)                 ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log('║  Sociétés de livraison créées :                                 ║');
  for (const dc of DELIVERY_COMPANIES) {
    console.log(`║   ${(dc.prefix + ' — ' + dc.nom).padEnd(60)} ║`);
  }
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log('║  Compte : mag1@roseblanche.tn  /  Demo123!                     ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('');

  await app.close();
}

bootstrap().catch((e) => {
  console.error('\n❌ Erreur :', e.message);
  process.exit(1);
});
