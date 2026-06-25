/**
 * seed-volume.ts — Données volumineuses pour les tests
 * =====================================================
 * Ajoute sur les données existantes (seed:rb-complet requis) :
 *   · 12 camions supplémentaires  (TN-V01 … TN-V12)
 *   · 72 bons de livraison        (J-4 → J+4 + pré-commandes)
 *   · 18 plans de chargement      (3 par jour de J-3 à J+3)
 *
 * NE crée PAS de nouveaux comptes utilisateurs.
 * Idempotent (upsert) : relançable sans duplication.
 *
 * Lancer : cd backend && npm run seed:volume
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './companies/company.entity';
import { SocieteExpeditrice } from './expediteurs/societe-expeditrice.entity';
import { Filiere } from './expediteurs/filiere.entity';
import { User } from './users/user.entity';
import { BonLivraison, TypeChargement } from './bons-livraison/bon-livraison.entity';
import { LoadingPlan } from './loading-plans/loading-plan.entity';
import { DeliveryCompany } from './delivery-companies/delivery-company.entity';
import { Truck } from './trucks/truck.entity';
import { BlStatus } from './common/enums/bl-status.enum';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function upsert<T extends object>(
  repo: Repository<T>,
  where: Partial<T>,
  data: Partial<T>,
): Promise<T> {
  const existing = await repo.findOne({ where: where as any });
  if (existing) {
    Object.assign(existing, data);
    return repo.save(existing as any) as unknown as T;
  }
  return repo.save(repo.create({ ...where, ...data } as any)) as unknown as T;
}

function d(offsetDays: number): string {
  const dt = new Date();
  dt.setDate(dt.getDate() + offsetDays);
  return dt.toISOString().split('T')[0];
}

const CLIENTS = [
  'SAPD Distribution',        'Grande Distribution Sud', 'Société Nabeulienne',
  'Maghrébine Aliments',      'Distributeur Côtier',     'Monastir Trade',
  'Kairouan Distribution',    'Sud Alimentaire',          'Béja Négoce',
  'Cotupha',                  'Tunisie Agro-Aliments',   'Sfax Commerce',
  'Sahel Distribution',       'Cap Nord Négoce',          'Medina Markets',
];
const DESTINATIONS = [
  'Tunis', 'Sfax', 'Sousse', 'Bizerte', 'Nabeul', 'Monastir',
  'Kairouan', 'Gabes', 'Gafsa', 'Béja', 'Jendouba', 'Le Kef',
  'Ariana', 'Manouba', 'Médenine',
];
const TYPES: TypeChargement[] = [
  TypeChargement.VRAC, TypeChargement.PALETTE, TypeChargement.FRIGO, TypeChargement.CITERNE,
];

function pick<T>(arr: T[], i: number): T { return arr[i % arr.length]; }

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });

  const companyRepo    = app.get<Repository<Company>>(getRepositoryToken(Company));
  const societeRepo    = app.get<Repository<SocieteExpeditrice>>(getRepositoryToken(SocieteExpeditrice));
  const filiereRepo    = app.get<Repository<Filiere>>(getRepositoryToken(Filiere));
  const userRepo       = app.get<Repository<User>>(getRepositoryToken(User));
  const blRepo         = app.get<Repository<BonLivraison>>(getRepositoryToken(BonLivraison));
  const planRepo       = app.get<Repository<LoadingPlan>>(getRepositoryToken(LoadingPlan));
  const dcRepo         = app.get<Repository<DeliveryCompany>>(getRepositoryToken(DeliveryCompany));
  const truckRepo      = app.get<Repository<Truck>>(getRepositoryToken(Truck));

  // ════════════════════════════════════════════════════════════════
  // 1. VÉRIFICATION DES PRÉREQUIS
  // ════════════════════════════════════════════════════════════════
  console.log('\n[1/5] Vérification des prérequis…');

  const transfood = await companyRepo.findOne({ where: { code: 'TF' } as any });
  if (!transfood) {
    console.error('❌  TransFood (code TF) introuvable. Lancez d\'abord : npm run seed:rb-complet');
    await app.close(); return;
  }

  const societe = await societeRepo.findOne({ where: { code: 'RB' } as any });
  if (!societe) {
    console.error('❌  Société expéditrice RB introuvable. Lancez d\'abord : npm run seed:rb-complet');
    await app.close(); return;
  }

  const [filAMT, filMCSR, filPW] = await Promise.all([
    filiereRepo.findOne({ where: { code: 'AMT' } }),
    filiereRepo.findOne({ where: { code: 'MCSR' } }),
    filiereRepo.findOne({ where: { code: 'PW' } }),
  ]);
  if (!filAMT || !filMCSR || !filPW) {
    console.error('❌  Filières manquantes. Lancez d\'abord : npm run seed:rb-complet');
    await app.close(); return;
  }

  const companyAdmin = await userRepo.findOne({ where: { email: 'logistique@transfood.tn' } });
  if (!companyAdmin) {
    console.error('❌  Compte logistique@transfood.tn introuvable.');
    await app.close(); return;
  }

  const dc = await dcRepo.findOne({ where: { nom: 'Rapid Transport SARL' } });
  if (!dc) {
    console.error('❌  Société de livraison introuvable.');
    await app.close(); return;
  }

  const filieres = [filAMT, filMCSR, filPW];
  console.log('  ✓ TransFood · Rose Blanche · 3 filières · logistique@transfood.tn · Rapid Transport SARL');

  // ════════════════════════════════════════════════════════════════
  // 2. CAMIONS SUPPLÉMENTAIRES (+12)
  // ════════════════════════════════════════════════════════════════
  console.log('\n[2/5] Camions supplémentaires…');

  const extraTruckDefs = [
    { matricule: 'TN-V01-2001', capaciteTonnage: 26, capacitePalettes: 22, type: 'FRIGO' },
    { matricule: 'TN-V02-2002', capaciteTonnage: 32, capacitePalettes: 0,  type: 'CITERNE' },
    { matricule: 'TN-V03-2003', capaciteTonnage: 18, capacitePalettes: 16, type: 'PALETTE' },
    { matricule: 'TN-V04-2004', capaciteTonnage: 28, capacitePalettes: 0,  type: 'VRAC' },
    { matricule: 'TN-V05-2005', capaciteTonnage: 20, capacitePalettes: 18, type: 'FRIGO' },
    { matricule: 'TN-V06-2006', capaciteTonnage: 24, capacitePalettes: 20, type: 'PALETTE' },
    { matricule: 'TN-V07-2007', capaciteTonnage: 30, capacitePalettes: 0,  type: 'VRAC' },
    { matricule: 'TN-V08-2008', capaciteTonnage: 36, capacitePalettes: 0,  type: 'CITERNE' },
    { matricule: 'TN-V09-2009', capaciteTonnage: 22, capacitePalettes: 20, type: 'FRIGO' },
    { matricule: 'TN-V10-2010', capaciteTonnage: 16, capacitePalettes: 14, type: 'PALETTE' },
    { matricule: 'TN-V11-2011', capaciteTonnage: 28, capacitePalettes: 0,  type: 'VRAC' },
    { matricule: 'TN-V12-2012', capaciteTonnage: 20, capacitePalettes: 18, type: 'FRIGO' },
  ];

  const extraTrucks: Truck[] = [];
  for (const td of extraTruckDefs) {
    const t = await upsert(truckRepo,
      { matricule: td.matricule } as any,
      { capaciteTonnage: td.capaciteTonnage, capacitePalettes: td.capacitePalettes, type: td.type, isActive: true, deliveryCompany: dc } as any,
    );
    extraTrucks.push(t);
  }
  console.log(`  ✓ ${extraTrucks.length} camions ajoutés (TN-V01 … TN-V12)`);

  // ════════════════════════════════════════════════════════════════
  // 3. PLANS DE CHARGEMENT (18 — J-3 à J+3, 3 par jour)
  // ════════════════════════════════════════════════════════════════
  console.log('\n[3/5] Plans de chargement (J-3 → J+3)…');

  type PlanSpec = {
    ref: string; date: string; truck: Truck;
    loadingStatus: string; entryStatus: string;
    quai?: string; tonnageCharge: number;
    calledAt?: Date; enteredAt?: Date;
  };

  const planSpecs: PlanSpec[] = [
    // ── J-3 : tous DONE / EXITED ─────────────────────────────────
    { ref: 'PL-VOL-J3-01', date: d(-3), truck: extraTrucks[0],  loadingStatus: 'DONE', entryStatus: 'EXITED', quai: 'Q-MCSR-1', tonnageCharge: 48.0 },
    { ref: 'PL-VOL-J3-02', date: d(-3), truck: extraTrucks[1],  loadingStatus: 'DONE', entryStatus: 'EXITED', quai: 'Q-AMT-2',  tonnageCharge: 55.0 },
    { ref: 'PL-VOL-J3-03', date: d(-3), truck: extraTrucks[2],  loadingStatus: 'DONE', entryStatus: 'EXITED', quai: 'Q-PW-1',   tonnageCharge: 36.0 },
    // ── J-2 : tous DONE / EXITED ─────────────────────────────────
    { ref: 'PL-VOL-J2-01', date: d(-2), truck: extraTrucks[3],  loadingStatus: 'DONE', entryStatus: 'EXITED', quai: 'Q-AMT-1',  tonnageCharge: 52.0 },
    { ref: 'PL-VOL-J2-02', date: d(-2), truck: extraTrucks[4],  loadingStatus: 'DONE', entryStatus: 'EXITED', quai: 'Q-MCSR-2', tonnageCharge: 44.0 },
    { ref: 'PL-VOL-J2-03', date: d(-2), truck: extraTrucks[5],  loadingStatus: 'DONE', entryStatus: 'EXITED', quai: 'Q-PW-2',   tonnageCharge: 38.0 },
    // ── J-1 : tous DONE / EXITED ─────────────────────────────────
    { ref: 'PL-VOL-J1-01', date: d(-1), truck: extraTrucks[6],  loadingStatus: 'DONE', entryStatus: 'EXITED', quai: 'Q-MCSR-3', tonnageCharge: 60.0 },
    { ref: 'PL-VOL-J1-02', date: d(-1), truck: extraTrucks[7],  loadingStatus: 'DONE', entryStatus: 'EXITED', quai: 'Q-AMT-3',  tonnageCharge: 42.0 },
    { ref: 'PL-VOL-J1-03', date: d(-1), truck: extraTrucks[8],  loadingStatus: 'DONE', entryStatus: 'EXITED', quai: 'Q-PW-1',   tonnageCharge: 34.0 },
    // ── J+1 (demain) : IDLE / WAITING ────────────────────────────
    { ref: 'PL-VOL-P1-01', date: d(+1), truck: extraTrucks[9],  loadingStatus: 'WAITING', entryStatus: 'IDLE', tonnageCharge: 0 },
    { ref: 'PL-VOL-P1-02', date: d(+1), truck: extraTrucks[10], loadingStatus: 'WAITING', entryStatus: 'IDLE', tonnageCharge: 0 },
    { ref: 'PL-VOL-P1-03', date: d(+1), truck: extraTrucks[11], loadingStatus: 'WAITING', entryStatus: 'IDLE', tonnageCharge: 0 },
    // ── J+2 : IDLE / WAITING ─────────────────────────────────────
    { ref: 'PL-VOL-P2-01', date: d(+2), truck: extraTrucks[0],  loadingStatus: 'WAITING', entryStatus: 'IDLE', tonnageCharge: 0 },
    { ref: 'PL-VOL-P2-02', date: d(+2), truck: extraTrucks[1],  loadingStatus: 'WAITING', entryStatus: 'IDLE', tonnageCharge: 0 },
    { ref: 'PL-VOL-P2-03', date: d(+2), truck: extraTrucks[2],  loadingStatus: 'WAITING', entryStatus: 'IDLE', tonnageCharge: 0 },
    // ── J+3 : IDLE / WAITING ─────────────────────────────────────
    { ref: 'PL-VOL-P3-01', date: d(+3), truck: extraTrucks[3],  loadingStatus: 'WAITING', entryStatus: 'IDLE', tonnageCharge: 0 },
    { ref: 'PL-VOL-P3-02', date: d(+3), truck: extraTrucks[4],  loadingStatus: 'WAITING', entryStatus: 'IDLE', tonnageCharge: 0 },
    { ref: 'PL-VOL-P3-03', date: d(+3), truck: extraTrucks[5],  loadingStatus: 'WAITING', entryStatus: 'IDLE', tonnageCharge: 0 },
  ];

  const plans: Record<string, LoadingPlan> = {};
  for (const ps of planSpecs) {
    const plan = await upsert(planRepo,
      { reference: ps.ref } as any,
      {
        dateLivraison:    ps.date as any,
        isValidated:      true,
        loadingStatus:    ps.loadingStatus,
        entryStatus:      ps.entryStatus,
        heureArrivee:     ps.entryStatus === 'EXITED' ? '06:00' : '08:00',
        quai:             ps.quai ?? null,
        tonnageCharge:    ps.tonnageCharge,
        palettesChargees: 0,
        truck:            ps.truck,
        validatedBy:      companyAdmin,
        logistiqueCompanyId: transfood.id,
        signature:        'sig_vol',
        calledAt:         ps.entryStatus === 'EXITED' ? new Date(new Date(ps.date).setHours(6, 0)) : null,
        enteredAt:        ps.entryStatus === 'EXITED' ? new Date(new Date(ps.date).setHours(6, 15)) : null,
      } as any,
    );
    plans[ps.ref] = plan;
  }
  console.log(`  ✓ ${planSpecs.length} plans (9 DONE·passés + 9 IDLE·futurs)`);

  // ════════════════════════════════════════════════════════════════
  // 4. BONS DE LIVRAISON (+72)
  // ════════════════════════════════════════════════════════════════
  console.log('\n[4/5] Bons de livraison supplémentaires…');

  type BlSpec = {
    num: string; clientNom: string; destination: string;
    tonnage: number; palettes: number; type: TypeChargement;
    statut: BlStatus; date: string;
    filiere: Filiere; ordre?: number; plan?: LoadingPlan; notes?: string;
  };

  const blSpecs: BlSpec[] = [];
  let idx = 0;

  // ── Jours passés J-4, J-3, J-2, J-1 : BLs DELIVERED sans plan (historique) ──
  for (const offset of [-4, -3, -2, -1]) {
    const tag = offset < 0 ? `M${Math.abs(offset)}` : `P${offset}`;
    // 3 BLs par filière = 9 BLs par jour
    const filiereSets = [
      { fil: filAMT,  prefix: 'AMT',  types: [TypeChargement.VRAC,    TypeChargement.CITERNE, TypeChargement.VRAC   ] },
      { fil: filMCSR, prefix: 'MCSR', types: [TypeChargement.FRIGO,   TypeChargement.FRIGO,   TypeChargement.PALETTE] },
      { fil: filPW,   prefix: 'PW',   types: [TypeChargement.PALETTE, TypeChargement.VRAC,    TypeChargement.PALETTE] },
    ];

    let planIdx = 0;
    for (const fs of filiereSets) {
      for (let i = 0; i < 3; i++) {
        const planRef = offset < 0 && offset >= -3
          ? `PL-VOL-J${Math.abs(offset)}-0${planIdx + 1}`
          : undefined;
        const plan = planRef ? plans[planRef] : undefined;
        blSpecs.push({
          num:         `BL-VOL-${fs.prefix}-${tag}-${String(i + 1).padStart(2, '0')}`,
          clientNom:   pick(CLIENTS, idx),
          destination: pick(DESTINATIONS, idx + 3),
          tonnage:     10 + (idx % 20) * 1.5,
          palettes:    fs.types[i] === TypeChargement.PALETTE ? 10 + (idx % 10) : 0,
          type:        fs.types[i],
          statut:      BlStatus.DELIVERED,
          date:        d(offset),
          filiere:     fs.fil,
          ordre:       plan ? (i + 1) : undefined,
          plan:        plan,
        });
        idx++;
      }
      if (offset >= -3) planIdx++;
    }
  }

  // ── Jours futurs J+1, J+2, J+3 : BLs VALIDATED avec plans ──────────────────
  for (const offset of [1, 2, 3]) {
    const tag = `P${offset}`;
    const filiereSets = [
      { fil: filAMT,  prefix: 'AMT',  types: [TypeChargement.VRAC,    TypeChargement.CITERNE, TypeChargement.VRAC   ] },
      { fil: filMCSR, prefix: 'MCSR', types: [TypeChargement.FRIGO,   TypeChargement.PALETTE, TypeChargement.FRIGO  ] },
      { fil: filPW,   prefix: 'PW',   types: [TypeChargement.PALETTE, TypeChargement.VRAC,    TypeChargement.PALETTE] },
    ];

    let planIdx = 1;
    for (const fs of filiereSets) {
      const planRef = `PL-VOL-P${offset}-0${planIdx}`;
      const plan = plans[planRef];
      for (let i = 0; i < 3; i++) {
        blSpecs.push({
          num:         `BL-VOL-${fs.prefix}-${tag}-${String(i + 1).padStart(2, '0')}`,
          clientNom:   pick(CLIENTS, idx),
          destination: pick(DESTINATIONS, idx + 5),
          tonnage:     12 + (idx % 18) * 1.2,
          palettes:    fs.types[i] === TypeChargement.PALETTE ? 12 + (idx % 8) : 0,
          type:        fs.types[i],
          statut:      BlStatus.VALIDATED,
          date:        d(offset),
          filiere:     fs.fil,
          ordre:       i + 1,
          plan:        plan,
        });
        idx++;
      }
      planIdx++;
    }
  }

  // ── J+4 et J+5 : VALIDATED sans plan (à planifier) ──────────────────────────
  for (const offset of [4, 5]) {
    const tag = `P${offset}`;
    const mixed = [
      { fil: filAMT,  prefix: 'AMT',  type: TypeChargement.VRAC    },
      { fil: filMCSR, prefix: 'MCSR', type: TypeChargement.FRIGO   },
      { fil: filPW,   prefix: 'PW',   type: TypeChargement.PALETTE },
      { fil: filAMT,  prefix: 'AMT',  type: TypeChargement.CITERNE },
      { fil: filMCSR, prefix: 'MCSR', type: TypeChargement.FRIGO   },
    ];
    mixed.forEach((m, i) => {
      blSpecs.push({
        num:         `BL-VOL-${m.prefix}-${tag}-${String(i + 1).padStart(2, '0')}`,
        clientNom:   pick(CLIENTS, idx),
        destination: pick(DESTINATIONS, idx + 2),
        tonnage:     14 + i * 3,
        palettes:    m.type === TypeChargement.PALETTE ? 14 : 0,
        type:        m.type,
        statut:      BlStatus.VALIDATED,
        date:        d(offset),
        filiere:     m.fil,
        notes:       'À planifier',
      });
      idx++;
    });
  }

  // ── J+6 à J+10 : DRAFT (pré-commandes) ──────────────────────────────────────
  for (let offset = 6; offset <= 10; offset++) {
    const tag = `P${offset}`;
    const mixed = [
      { fil: filAMT,  prefix: 'AMT',  type: TypeChargement.VRAC    },
      { fil: filMCSR, prefix: 'MCSR', type: TypeChargement.FRIGO   },
      { fil: filPW,   prefix: 'PW',   type: TypeChargement.PALETTE },
    ];
    mixed.forEach((m, i) => {
      blSpecs.push({
        num:         `BL-VOL-${m.prefix}-${tag}-${String(i + 1).padStart(2, '0')}`,
        clientNom:   pick(CLIENTS, idx),
        destination: pick(DESTINATIONS, idx + 1),
        tonnage:     8 + i * 4,
        palettes:    m.type === TypeChargement.PALETTE ? 10 : 0,
        type:        m.type,
        statut:      BlStatus.DRAFT,
        date:        d(offset),
        filiere:     m.fil,
        notes:       'Pré-commande — en cours de validation',
      });
      idx++;
    });
  }

  // ── 10 BLs VALIDATED supplémentaires sans plan (pool disponible) ─────────────
  const bonusPool = [
    { fil: filAMT,  prefix: 'AMT',  type: TypeChargement.VRAC    },
    { fil: filMCSR, prefix: 'MCSR', type: TypeChargement.FRIGO   },
    { fil: filPW,   prefix: 'PW',   type: TypeChargement.PALETTE },
    { fil: filAMT,  prefix: 'AMT',  type: TypeChargement.CITERNE },
    { fil: filMCSR, prefix: 'MCSR', type: TypeChargement.FRIGO   },
    { fil: filPW,   prefix: 'PW',   type: TypeChargement.VRAC    },
    { fil: filAMT,  prefix: 'AMT',  type: TypeChargement.PALETTE },
    { fil: filMCSR, prefix: 'MCSR', type: TypeChargement.FRIGO   },
    { fil: filPW,   prefix: 'PW',   type: TypeChargement.PALETTE },
    { fil: filAMT,  prefix: 'AMT',  type: TypeChargement.VRAC    },
  ];
  bonusPool.forEach((m, i) => {
    blSpecs.push({
      num:         `BL-VOL-${m.prefix}-POOL-${String(i + 1).padStart(2, '0')}`,
      clientNom:   pick(CLIENTS, idx),
      destination: pick(DESTINATIONS, idx + 4),
      tonnage:     10 + i * 2,
      palettes:    m.type === TypeChargement.PALETTE ? 12 : 0,
      type:        m.type,
      statut:      BlStatus.VALIDATED,
      date:        d(1),
      filiere:     m.fil,
      notes:       'Disponible — en attente d\'un plan',
    });
    idx++;
  });

  let blCount = 0;
  for (const bs of blSpecs) {
    await upsert(blRepo,
      { numeroBl: bs.num } as any,
      {
        clientNom:          bs.clientNom,
        clientAdresse:      bs.destination,
        destination:        bs.destination,
        origine:            'Béja',
        typeChargement:     bs.type,
        tonnageTotal:       bs.tonnage,
        nombrePalettes:     bs.palettes,
        statut:             bs.statut,
        datelivraison:      bs.date as any,
        filiere:            bs.filiere,
        societeExpeditrice: societe,
        company:            transfood,
        loadingPlan:        bs.plan ?? null,
        ordreChargement:    bs.ordre ?? null,
        notes:              bs.notes ?? null,
        erpReference:       `ERP-${bs.num}`,
      } as any,
    );
    blCount++;
  }
  console.log(`  ✓ ${blCount} bons de livraison ajoutés`);

  // ════════════════════════════════════════════════════════════════
  // 5. RÉCAPITULATIF
  // ════════════════════════════════════════════════════════════════
  const totalBls  = await blRepo.count();
  const totalTrucks = await truckRepo.count();
  const totalPlans  = await planRepo.count();

  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('  RÉSULTAT GLOBAL EN BASE');
  console.log('════════════════════════════════════════════════════════════════');
  console.log(`  Total BLs           : ${totalBls}`);
  console.log(`  Total Camions       : ${totalTrucks}`);
  console.log(`  Total Plans         : ${totalPlans}`);
  console.log('════════════════════════════════════════════════════════════════');
  console.log('\n  Comptes (mot de passe : Demo123!) :');
  console.log('  SUPER_ADMIN      : admin@tms.com');
  console.log('  LOGISTIC_ADMIN   : logistique@transfood.tn');
  console.log('  EXPEDITEUR_ADMIN : admin@roseblanche.tn');
  console.log('  FILIERE_ADMIN    : admin.amt@roseblanche.tn  /  admin.mcr@roseblanche.tn  /  admin.pw@roseblanche.tn');
  console.log('  MAGASINIER       : mag1@roseblanche.tn  /  mag2@roseblanche.tn');
  console.log('  SECURITE         : sec1@roseblanche.tn  /  sec2@roseblanche.tn');
  console.log('\n✅  Terminé.\n');

  await app.close();
}

bootstrap().catch((e) => { console.error(e); process.exit(1); });
