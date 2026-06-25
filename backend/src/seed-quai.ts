/**
 * Seeder — Gestion du Quai (50 plans, date du jour)
 * 40 IDLE/WAITING + 2 CALLED + 2 ENTERED + 3 IN_PROGRESS + 3 PAUSED = 50 plans
 * Filières : AMT | MCSR | PW (Pâte Warda)
 * ordreChargement sur chaque BL, stationsSequence sur plans actifs.
 * Lancer : npm run seed:quai
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './companies/company.entity';
import { DeliveryCompany } from './delivery-companies/delivery-company.entity';
import { Truck } from './trucks/truck.entity';
import { BonLivraison, TypeChargement } from './bons-livraison/bon-livraison.entity';
import { LoadingPlan } from './loading-plans/loading-plan.entity';
import { SocieteExpeditrice } from './expediteurs/societe-expeditrice.entity';
import { Filiere } from './expediteurs/filiere.entity';
import { BlStatus } from './common/enums/bl-status.enum';
import { User } from './users/user.entity';

const SEED_DATE = new Date().toISOString().split('T')[0];

const DESTINATIONS = [
  'Tunis', 'Ben Arous', 'Ariana', 'Sousse', 'Sfax', 'Nabeul', 'Bizerte',
  'Monastir', 'Mahdia', 'Gabès', 'Béja', 'Zaghouan', 'Jendouba', 'Siliana',
  'Kairouan', 'Sidi Bouzid', 'Kasserine', 'Gafsa', 'Tozeur', 'Médenine',
];
const CLIENTS = [
  'Supermarché Carrefour', 'Magasin Général', 'Grossiste Central', 'Distribution Plus',
  'Champion Hyper', 'Monoprix', 'Jumbo Market', 'Maxi Distribution', 'Coopérative',
  'Centre Commercial', 'Entrepôt Régional', 'Gros Marché', 'Distributeur Local',
  'Alimentation Générale', 'Épicerie du Nord', 'Commerce El Amal',
];
const TRUCK_TYPES = ['Semi-remorque', 'Plateau', 'Fourgon', 'Citerne', 'Frigorifique', 'Benne'];
const TONNAGES    = [10, 12, 15, 18, 20, 22, 24, 26, 28, 30, 32];
const PALETTES    = [0, 12, 14, 16, 18, 20, 22, 24, 28, 33];

const TIMES: string[] = [];
for (let h = 6; h <= 16; h++) {
  for (let m = 0; m < 60; m += 10) {
    if (h === 16 && m > 50) break;
    TIMES.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}

// Filière codes (indices)
const FIL = { AMT: 0, MCSR: 1, PW: 2 };

interface BLSpec { filiereIdx: number; ordre: number }

type LoadStatus  = 'WAITING' | 'IN_PROGRESS' | 'PAUSED';
type EntryStatus = 'IDLE' | 'CALLED' | 'ENTERED';

interface Scenario {
  idx:              number;
  loadingStatus:    LoadStatus;
  entryStatus:      EntryStatus;
  elapsed:          number;
  quai?:            string;
  startedSecsAgo?:  number;
  bls:              BLSpec[];
  stationsSequence?: string[];
  currentStation?:  string;
  currentStationIdx?: number;
}

// ── Plans IDLE (40 camions, pas encore appelés) ────────────────────────────
// Combinaisons de filières variées pour représenter toutes les configurations
const IDLE_BL_COMBOS: BLSpec[][] = [
  [{ filiereIdx: FIL.AMT,  ordre: 1 }, { filiereIdx: FIL.MCSR, ordre: 2 }],
  [{ filiereIdx: FIL.MCSR, ordre: 1 }, { filiereIdx: FIL.PW,   ordre: 2 }],
  [{ filiereIdx: FIL.AMT,  ordre: 1 }, { filiereIdx: FIL.PW,   ordre: 2 }],
  [{ filiereIdx: FIL.PW,   ordre: 1 }, { filiereIdx: FIL.AMT,  ordre: 2 }],
  [{ filiereIdx: FIL.AMT,  ordre: 1 }, { filiereIdx: FIL.MCSR, ordre: 2 }, { filiereIdx: FIL.PW,   ordre: 3 }],
  [{ filiereIdx: FIL.MCSR, ordre: 1 }, { filiereIdx: FIL.AMT,  ordre: 2 }],
  [{ filiereIdx: FIL.PW,   ordre: 1 }, { filiereIdx: FIL.MCSR, ordre: 2 }],
  [{ filiereIdx: FIL.AMT,  ordre: 1 }, { filiereIdx: FIL.PW,   ordre: 2 }, { filiereIdx: FIL.MCSR, ordre: 3 }],
];

const IDLE_SCENARIOS: Scenario[] = Array.from({ length: 40 }, (_, i) => ({
  idx:          i,
  loadingStatus: 'WAITING',
  entryStatus:  'IDLE',
  elapsed:      0,
  bls:          IDLE_BL_COMBOS[i % IDLE_BL_COMBOS.length],
}));

// ── Plans actifs (10 camions avec quais et séquences) ─────────────────────
const ACTIVE_SCENARIOS: Scenario[] = [
  // CALLED — camion arrive, attend autorisation sécurité à l'entrée
  {
    idx: 40, loadingStatus: 'WAITING', entryStatus: 'CALLED', elapsed: 0, quai: 'Entrée',
    bls: [{ filiereIdx: FIL.AMT, ordre: 1 }, { filiereIdx: FIL.PW, ordre: 2 }],
    stationsSequence: ['AMT', 'PW'], currentStation: 'AMT', currentStationIdx: 0,
  },
  {
    idx: 41, loadingStatus: 'WAITING', entryStatus: 'CALLED', elapsed: 0, quai: 'Entrée',
    bls: [{ filiereIdx: FIL.MCSR, ordre: 1 }, { filiereIdx: FIL.PW, ordre: 2 }],
    stationsSequence: ['MCSR', 'PW'], currentStation: 'MCSR', currentStationIdx: 0,
  },

  // ENTERED / WAITING — autorisé, en attente de début de chargement à la 1ère station
  {
    idx: 42, loadingStatus: 'WAITING', entryStatus: 'ENTERED', elapsed: 0, quai: 'AMT-1',
    bls: [{ filiereIdx: FIL.AMT, ordre: 1 }, { filiereIdx: FIL.MCSR, ordre: 2 }],
    stationsSequence: ['AMT', 'MCSR'], currentStation: 'AMT', currentStationIdx: 0,
  },
  {
    idx: 43, loadingStatus: 'WAITING', entryStatus: 'ENTERED', elapsed: 0, quai: 'PW-1',
    bls: [{ filiereIdx: FIL.PW, ordre: 1 }, { filiereIdx: FIL.AMT, ordre: 2 }],
    stationsSequence: ['PW', 'AMT'], currentStation: 'PW', currentStationIdx: 0,
  },

  // IN_PROGRESS — chargement en cours (chrono actif) à la station courante
  {
    idx: 44, loadingStatus: 'IN_PROGRESS', entryStatus: 'ENTERED', elapsed: 0,
    quai: 'AMT-2', startedSecsAgo: 600,
    bls: [
      { filiereIdx: FIL.AMT,  ordre: 1 },
      { filiereIdx: FIL.PW,   ordre: 2 },
      { filiereIdx: FIL.MCSR, ordre: 3 },
    ],
    stationsSequence: ['AMT', 'PW', 'MCSR'], currentStation: 'AMT', currentStationIdx: 0,
  },
  {
    idx: 45, loadingStatus: 'IN_PROGRESS', entryStatus: 'ENTERED', elapsed: 0,
    quai: 'MCSR-1', startedSecsAgo: 1800,
    bls: [{ filiereIdx: FIL.MCSR, ordre: 1 }, { filiereIdx: FIL.PW, ordre: 2 }],
    stationsSequence: ['MCSR', 'PW'], currentStation: 'MCSR', currentStationIdx: 0,
  },
  {
    // Déjà passé à la 2ème station (station index 1)
    idx: 46, loadingStatus: 'IN_PROGRESS', entryStatus: 'ENTERED', elapsed: 900,
    quai: 'PW-2', startedSecsAgo: 3300,
    bls: [{ filiereIdx: FIL.AMT, ordre: 1 }, { filiereIdx: FIL.PW, ordre: 2 }],
    stationsSequence: ['AMT', 'PW'], currentStation: 'PW', currentStationIdx: 1,
  },

  // PAUSED — en pause (temps accumulé, pas de chrono actif)
  {
    idx: 47, loadingStatus: 'PAUSED', entryStatus: 'ENTERED', elapsed: 900,
    quai: 'PW-3',
    bls: [{ filiereIdx: FIL.PW, ordre: 1 }, { filiereIdx: FIL.AMT, ordre: 2 }],
    stationsSequence: ['PW', 'AMT'], currentStation: 'PW', currentStationIdx: 0,
  },
  {
    idx: 48, loadingStatus: 'PAUSED', entryStatus: 'ENTERED', elapsed: 2100,
    quai: 'MCSR-2',
    bls: [
      { filiereIdx: FIL.MCSR, ordre: 1 },
      { filiereIdx: FIL.AMT,  ordre: 2 },
      { filiereIdx: FIL.PW,   ordre: 3 },
    ],
    stationsSequence: ['MCSR', 'AMT', 'PW'], currentStation: 'MCSR', currentStationIdx: 0,
  },
  {
    // Déjà à la station 2 (AMT), en pause
    idx: 49, loadingStatus: 'PAUSED', entryStatus: 'ENTERED', elapsed: 3600,
    quai: 'AMT-3',
    bls: [{ filiereIdx: FIL.PW, ordre: 1 }, { filiereIdx: FIL.AMT, ordre: 2 }],
    stationsSequence: ['PW', 'AMT'], currentStation: 'AMT', currentStationIdx: 1,
  },
];

const SCENARIOS: Scenario[] = [...IDLE_SCENARIOS, ...ACTIVE_SCENARIOS];

function pick<T>(arr: T[], i: number): T { return arr[i % arr.length]; }

async function upsert<T extends object>(
  repo: Repository<T>,
  where: object,
  creator: () => T,
): Promise<T> {
  const found = await (repo as any).findOne({ where });
  return found ?? repo.save(creator());
}

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });

  const companyRepo = app.get<Repository<Company>>(getRepositoryToken(Company));
  const dcRepo      = app.get<Repository<DeliveryCompany>>(getRepositoryToken(DeliveryCompany));
  const truckRepo   = app.get<Repository<Truck>>(getRepositoryToken(Truck));
  const blRepo      = app.get<Repository<BonLivraison>>(getRepositoryToken(BonLivraison));
  const planRepo    = app.get<Repository<LoadingPlan>>(getRepositoryToken(LoadingPlan));
  const seRepo      = app.get<Repository<SocieteExpeditrice>>(getRepositoryToken(SocieteExpeditrice));
  const filRepo     = app.get<Repository<Filiere>>(getRepositoryToken(Filiere));
  const userRepo    = app.get<Repository<User>>(getRepositoryToken(User));

  console.log(`\n🏗️   Seeder Quai — 50 plans pour ${SEED_DATE}\n`);

  // ── Société ────────────────────────────────────────────────────────────────
  const company = await companyRepo.findOne({ where: { nom: 'TransFood' } });
  if (!company) {
    console.error('❌  Société "TransFood" introuvable. Lance npm run seed en premier.');
    await app.close(); process.exit(1);
  }
  console.log(`✅  Société : ${company.nom}`);

  // ── Sociétés de livraison ──────────────────────────────────────────────────
  const dcA = await upsert(dcRepo, { nom: 'SAFRAT Transport' },
    () => dcRepo.create({ nom: 'SAFRAT Transport', adresse: 'Sfax', telephone: '+216 74 111 222', company }));
  const dcB = await upsert(dcRepo, { nom: 'TunisExpress Logistique' },
    () => dcRepo.create({ nom: 'TunisExpress Logistique', adresse: 'Sousse', telephone: '+216 73 333 444', company }));
  const dcC = await upsert(dcRepo, { nom: 'Maghreb Transit' },
    () => dcRepo.create({ nom: 'Maghreb Transit', adresse: 'Tunis', telephone: '+216 71 222 333', company }));
  const dcs = [dcA, dcB, dcC];
  console.log('✅  3 sociétés de livraison');

  // ── Expéditeur Rose Blanche + 3 filières AMT / MCSR / PW ──────────────────
  const se = await upsert(seRepo, { nom: 'Rose Blanche' },
    () => seRepo.create({
      nom: 'Rose Blanche', code: 'RB', couleur: '#e83e8c',
      adresse: 'Zone Industrielle El Agba, Tunis',
      telephone: '+216 71 555 666', company,
    }));

  const filiereDefs = [
    { nom: 'AMT',        code: 'AMT'  },
    { nom: 'MCSR',       code: 'MCSR' },
    { nom: 'Pâte Warda', code: 'PW'   },
  ];
  const filieres: Filiere[] = [];
  for (const f of filiereDefs) {
    filieres.push(await upsert(filRepo,
      { code: f.code, societeExpeditrice: { id: se.id } },
      () => filRepo.create({ ...f, societeExpeditrice: se }),
    ));
  }
  console.log('✅  Rose Blanche + filières : AMT | MCSR | PW\n');

  // ── Validateur ─────────────────────────────────────────────────────────────
  const validator = await userRepo.findOne({ where: { email: 'logistique@tms.com' } }) ?? undefined;

  // ── 50 Camions QT-TUN-001 … QT-TUN-050 ────────────────────────────────────
  const trucks: Truck[] = [];
  for (let i = 0; i < 50; i++) {
    const matricule = `QT-TUN-${String(i + 1).padStart(3, '0')}`;
    trucks.push(await upsert(truckRepo, { matricule },
      () => truckRepo.create({
        matricule,
        type:             pick(TRUCK_TYPES, i),
        capaciteTonnage:  pick(TONNAGES, i),
        capacitePalettes: pick(PALETTES, i),
        isActive:         true,
        deliveryCompany:  pick(dcs, i),
      })));
  }
  console.log(`✅  ${trucks.length} camions QT-TUN-xxx\n`);

  // ── 50 Plans ───────────────────────────────────────────────────────────────
  let created = 0;
  let skipped = 0;

  for (const sc of SCENARIOS) {
    const truck = trucks[sc.idx];

    const exists = await planRepo
      .createQueryBuilder('p')
      .where('p.truckId = :tid', { tid: truck.id })
      .andWhere('CAST(p.dateLivraison AS date) = :d', { d: SEED_DATE })
      .andWhere('p.reference LIKE :ref', { ref: 'QT-%' })
      .getOne();

    if (exists) { skipped++; continue; }

    const isActive   = sc.entryStatus !== 'IDLE';
    const blStat     = BlStatus.LOADED;
    const ref        = `QT-${SEED_DATE.replace(/-/g, '')}-${String(sc.idx + 1).padStart(3, '0')}`;

    // ── Créer les BLs avec ordreChargement ───────────────────────────────────
    const createdBLs: BonLivraison[] = [];
    for (const blSpec of sc.bls) {
      const ordre  = blSpec.ordre;
      const blNum  = `QT-BL-${String(sc.idx * 4 + ordre).padStart(4, '0')}`;
      const dest   = pick(DESTINATIONS, sc.idx + ordre);
      const client = pick(CLIENTS, sc.idx + ordre);
      const fil    = filieres[blSpec.filiereIdx];

      const bl = await upsert(blRepo, { numeroBl: blNum },
        () => blRepo.create({
          numeroBl:         blNum,
          clientNom:        `${client} ${dest}`,
          clientAdresse:    `Avenue Principale, ${dest}`,
          origine:          'Tunis — El Agba',
          destination:      dest,
          typeChargement:   TypeChargement.PALETTE,
          tonnageTotal:     pick([1.5, 2.0, 2.5, 3.0, 3.5, 4.0], sc.idx + ordre),
          nombrePalettes:   pick([3, 4, 5, 6, 7, 8], sc.idx + ordre),
          statut:           blStat,
          datelivraison:    new Date(SEED_DATE),
          ordreChargement:  ordre,
          company,
          societeExpeditrice: se,
          filiere:          fil,
        }));
      createdBLs.push(bl);
    }

    const tonnage  = createdBLs.reduce((s, b) => s + Number(b.tonnageTotal), 0);
    const palettes = createdBLs.reduce((s, b) => s + (b.nombrePalettes || 0), 0);

    let loadingStartedAt: Date | undefined;
    if (sc.loadingStatus === 'IN_PROGRESS' && sc.startedSecsAgo) {
      loadingStartedAt = new Date(Date.now() - sc.startedSecsAgo * 1000);
    }

    const planData: any = {
      reference:             ref,
      dateLivraison:         new Date(SEED_DATE),
      tonnageCharge:         Math.round(tonnage * 100) / 100,
      palettesChargees:      palettes,
      isValidated:           true,
      heureArrivee:          pick(TIMES, sc.idx),
      loadingStatus:         sc.loadingStatus,
      entryStatus:           sc.entryStatus,
      loadingElapsedSeconds: sc.elapsed,
      loadingStartedAt:      loadingStartedAt ?? null,
      quai:                  sc.quai ?? null,
      truck,
      validatedBy:           validator,
    };

    if (isActive && sc.stationsSequence) {
      planData.stationsSequence  = sc.stationsSequence;
      planData.currentStation    = sc.currentStation ?? null;
      planData.currentStationIdx = sc.currentStationIdx ?? 0;
    }

    const plan = await planRepo.save(planRepo.create(planData)) as unknown as LoadingPlan;

    // Lier les BLs au plan
    for (const bl of createdBLs) {
      await blRepo.update(bl.id, { loadingPlan: plan } as any);
    }

    const icon      = { IDLE: '⏳', CALLED: '📞', ENTERED: '✅' }[sc.entryStatus] ?? '•';
    const quaiLabel = sc.quai ? ` → ${sc.quai}` : '';
    const seqLabel  = sc.stationsSequence ? ` [${sc.stationsSequence.join('→')}]` : '';
    console.log(`  ${icon}  ${ref}  [${pick(TIMES, sc.idx)}]  ${truck.matricule}${quaiLabel}${seqLabel}  (${sc.loadingStatus})`);
    created++;
  }

  console.log(`\n✅  ${created} plan(s) créé(s), ${skipped} ignoré(s) — date : ${SEED_DATE}`);
  console.log('\n   magasinier@tms.com / Magasin123!  → http://localhost:3000/magasin');
  console.log('   securite@tms.com  / Securite123!  → http://localhost:3000/securite\n');

  await app.close();
}

seed().catch((err) => {
  console.error('❌', err);
  process.exit(1);
});
