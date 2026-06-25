/**
 * Seeder — 60 BLs en DRAFT pour le logistique + 15 plans de chargement actifs
 *
 * BLs DRAFT   : le logistique admin peut les valider, assigner des camions, planifier
 * Plans actifs: 5 plans pour aujourd'hui avec camions + BLs VALIDATED (magasinier)
 *
 * Prérequis :
 *   - npm run seed:rb-complet  (TransFood + Rose Blanche + filières MCSR/AMT/PW)
 *   - npm run seed:camions     (56 camions nouveaux)
 *
 * Lancer : npm run seed:bls-logistique
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './companies/company.entity';
import { SocieteExpeditrice } from './expediteurs/societe-expeditrice.entity';
import { Filiere } from './expediteurs/filiere.entity';
import { BonLivraison, TypeChargement } from './bons-livraison/bon-livraison.entity';
import { BlStatus } from './common/enums/bl-status.enum';
import { Truck } from './trucks/truck.entity';
import { LoadingPlan } from './loading-plans/loading-plan.entity';

// ── Helpers ──────────────────────────────────────────────────────────────────

function dateStr(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function pad(n: number): string {
  return String(n).padStart(3, '0');
}

// Round-robin pick from an array
function pick<T>(arr: T[], idx: number): T {
  return arr[idx % arr.length];
}

// ── Data tables ───────────────────────────────────────────────────────────────

const CLIENTS = [
  'Carrefour Market',
  'Magasin Général',
  'Géant Casino',
  'Monoprix TN',
  'MG Hyper',
  'Aziza Supermarché',
  'Saber Distributions',
  'Coop Tunis',
  'Champion Market',
  'Maxula Distrib.',
  'HyperOne',
  'Express Market',
  'TFM Distribution',
  'Hatem Market',
  'Centrex Distrib.',
];

const DESTINATIONS = [
  'Tunis Centre', 'La Marsa', 'Ariana', 'Ben Arous', 'Manouba',
  'Sfax Centre', 'Sfax Sud', 'Sousse', 'Monastir', 'Mahdia',
  'Nabeul', 'Hammamet', 'Bizerte', 'Kairouan', 'Sidi Bouzid',
  'Gabès', 'Médenine', 'Gafsa', 'Jendouba', 'El Kef',
];

const ORIGINES = ['Dépôt Mégrine', 'Dépôt Charguia', 'Entrepôt Borj Louzir', 'Usine Bir El Bey'];

const TYPES: TypeChargement[] = [
  TypeChargement.PALETTE,
  TypeChargement.PALETTE,
  TypeChargement.PALETTE,
  TypeChargement.VRAC,
  TypeChargement.FRIGO,
  TypeChargement.CITERNE,
];

const TONNAGES = [8, 10, 12, 14, 16, 18, 20, 22, 24];
const PALETTES = [8, 10, 12, 14, 16, 18, 20, 0];

// ── Main seeder ────────────────────────────────────────────────────────────────

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });

  const companyRepo = app.get<Repository<Company>>(getRepositoryToken(Company));
  const societeRepo = app.get<Repository<SocieteExpeditrice>>(getRepositoryToken(SocieteExpeditrice));
  const blRepo      = app.get<Repository<BonLivraison>>(getRepositoryToken(BonLivraison));
  const truckRepo   = app.get<Repository<Truck>>(getRepositoryToken(Truck));
  const planRepo    = app.get<Repository<LoadingPlan>>(getRepositoryToken(LoadingPlan));

  console.log('\n📦  Seeder BLs Logistique — démarrage...\n');

  // ── 1. TransFood ────────────────────────────────────────────────
  const transfood = await companyRepo.findOne({ where: { code: 'TF' } });
  if (!transfood) {
    console.error('❌  TransFood (code TF) introuvable. Lance npm run seed:rb-complet en premier.');
    await app.close(); process.exit(1);
  }

  // ── 2. Sociétés expéditrices et filières ────────────────────────
  const societes = await societeRepo.find({ relations: ['filieres'] });

  // Flat list of { filiere, societe } pairs
  const pairs: { filiere: Filiere; societe: SocieteExpeditrice }[] = [];
  for (const s of societes) {
    for (const f of (s.filieres ?? [])) {
      pairs.push({ filiere: f, societe: s });
    }
  }

  if (pairs.length === 0) {
    console.warn('⚠️   Aucune filière trouvée. Les BLs seront créés sans filière ni société expéditrice.');
  } else {
    console.log(`✅  ${pairs.length} filière(s) trouvée(s) :`);
    pairs.forEach(({ filiere, societe }) =>
      console.log(`     · ${filiere.code} – ${filiere.nom} (${societe.nom})`),
    );
  }

  // ── 3. Camions disponibles ──────────────────────────────────────
  const trucks = await truckRepo.find({
    where: { isActive: true },
    relations: ['deliveryCompany'],
  });
  if (!trucks.length) {
    console.error('❌  Aucun camion trouvé. Lance npm run seed:camions en premier.');
    await app.close(); process.exit(1);
  }
  console.log(`✅  ${trucks.length} camion(s) disponible(s)\n`);

  // ── 4. BLs DRAFT (60) — pour le logistique admin ───────────────
  console.log('[1/2] Création des BLs DRAFT...');

  let blSeq = 1;
  let draftCreated = 0;

  // 60 BLs répartis sur 5 jours (today → today+4)
  for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
    const date = dateStr(dayOffset);
    const blsPerDay = dayOffset === 0 ? 16 : 11; // plus de BLs aujourd'hui

    for (let i = 0; i < blsPerDay; i++) {
      const num = `BL-LOG-2026-${pad(blSeq++)}`;
      const existing = await blRepo.findOne({ where: { numeroBl: num } });
      if (existing) continue;

      const pair = pairs.length > 0 ? pick(pairs, blSeq) : null;

      const bl = blRepo.create({
        numeroBl:          num,
        clientNom:         pick(CLIENTS, blSeq + i),
        clientAdresse:     `${Math.floor(Math.random() * 200) + 1} Avenue Principale`,
        origine:           pick(ORIGINES, i),
        destination:       pick(DESTINATIONS, blSeq + i * 2),
        typeChargement:    pick(TYPES, blSeq + i),
        tonnageTotal:      pick(TONNAGES, blSeq + i),
        nombrePalettes:    pick(PALETTES, blSeq + i),
        statut:            BlStatus.DRAFT,
        datelivraison:     date as any,
        company:           transfood,
        societeExpeditrice: pair?.societe ?? null,
        filiere:            pair?.filiere ?? null,
      });
      await blRepo.save(bl);
      draftCreated++;
    }
  }
  console.log(`  ✓ ${draftCreated} BL(s) DRAFT créés (BL-LOG-2026-001 → BL-LOG-2026-${pad(blSeq - 1)})\n`);

  // ── 5. Plans de chargement actifs (5 plans × 3 BLs = 15 BLs VALIDATED) ──
  console.log('[2/2] Création des plans de chargement pour aujourd\'hui...');

  const TODAY = dateStr(0);
  const filieresForPlans = pairs.length > 0
    ? [pick(pairs, 0), pick(pairs, 1), pick(pairs, 2)]
    : [null, null, null];

  // 5 plans avec desétats variés pour tester le dashboard magasinier
  type PlanSpec = {
    ref: string;
    truckIdx: number;
    loadingStatus: string;
    entryStatus: string;
    heureArrivee: string;
    quai: string | null;
    tonnageCharge: number;
    blCount: number;
    filiereIdx: number;
    statut: BlStatus;
  };

  const planSpecs: PlanSpec[] = [
    // IDLE — camion pas encore arrivé
    { ref: 'PL-LOG-001', truckIdx: 0,  loadingStatus: 'WAITING',     entryStatus: 'IDLE',    heureArrivee: '08:00', quai: null,        tonnageCharge: 0,    blCount: 3, filiereIdx: 0, statut: BlStatus.VALIDATED },
    { ref: 'PL-LOG-002', truckIdx: 1,  loadingStatus: 'WAITING',     entryStatus: 'IDLE',    heureArrivee: '08:30', quai: null,        tonnageCharge: 0,    blCount: 2, filiereIdx: 1, statut: BlStatus.VALIDATED },
    // CALLED — appelé à l'entrée
    { ref: 'PL-LOG-003', truckIdx: 2,  loadingStatus: 'WAITING',     entryStatus: 'CALLED',  heureArrivee: '07:00', quai: null,        tonnageCharge: 0,    blCount: 3, filiereIdx: 2, statut: BlStatus.VALIDATED },
    // ENTERED — en cours de chargement
    { ref: 'PL-LOG-004', truckIdx: 3,  loadingStatus: 'IN_PROGRESS', entryStatus: 'ENTERED', heureArrivee: '06:00', quai: 'Q-DEMO-1',  tonnageCharge: 14.5, blCount: 2, filiereIdx: 0, statut: BlStatus.VALIDATED },
    // DONE/EXITED — terminé (données historiques du jour)
    { ref: 'PL-LOG-005', truckIdx: 4,  loadingStatus: 'DONE',        entryStatus: 'EXITED',  heureArrivee: '05:00', quai: 'Q-DEMO-2',  tonnageCharge: 24.0, blCount: 3, filiereIdx: 1, statut: BlStatus.VALIDATED },
  ];

  let planCreated = 0;
  let planBlSeq = blSeq;

  for (const spec of planSpecs) {
    // Éviter les doublons
    const existingPlan = await planRepo.findOne({ where: { reference: spec.ref } });
    if (existingPlan) {
      console.log(`  ⏭   Plan ${spec.ref} déjà existant — ignoré`);
      continue;
    }

    const truck = trucks[spec.truckIdx % trucks.length];
    const pairForPlan = filieresForPlans[spec.filiereIdx];

    // Créer les BLs VALIDATED pour ce plan
    const planBls: BonLivraison[] = [];
    for (let b = 0; b < spec.blCount; b++) {
      const num = `BL-LOG-PLAN-${pad(planBlSeq++)}`;
      const existingBl = await blRepo.findOne({ where: { numeroBl: num } });
      if (existingBl) { planBls.push(existingBl); continue; }

      const bl = blRepo.create({
        numeroBl:          num,
        clientNom:         pick(CLIENTS, b + spec.truckIdx),
        clientAdresse:     `${Math.floor(Math.random() * 200) + 1} Rue du Commerce`,
        origine:           pick(ORIGINES, b),
        destination:       pick(DESTINATIONS, b + spec.truckIdx * 3),
        typeChargement:    pick(TYPES, b + spec.truckIdx),
        tonnageTotal:      pick(TONNAGES, b + spec.truckIdx),
        nombrePalettes:    pick(PALETTES, b),
        statut:            spec.statut,
        datelivraison:     TODAY as any,
        company:           transfood,
        societeExpeditrice: pairForPlan?.societe ?? null,
        filiere:            pairForPlan?.filiere ?? null,
      });
      const saved = await blRepo.save(bl);
      planBls.push(saved);
    }

    // Créer le plan
    const plan = planRepo.create({
      reference:           spec.ref,
      dateLivraison:       TODAY as any,
      isValidated:         true,
      loadingStatus:       spec.loadingStatus,
      entryStatus:         spec.entryStatus,
      heureArrivee:        spec.heureArrivee,
      quai:                spec.quai ?? undefined,
      tonnageCharge:       spec.tonnageCharge,
      palettesChargees:    0,
      logistiqueCompanyId: transfood.id,
      truck,
    });
    const savedPlan = await planRepo.save(plan) as LoadingPlan;

    // Lier les BLs au plan
    for (const bl of planBls) {
      bl.loadingPlan = savedPlan;
      await blRepo.save(bl);
    }

    planCreated++;
    const truckLabel = `${truck.matricule} (${truck.type})`;
    const fLabel = pairForPlan ? pairForPlan.filiere.code : 'Générique';
    console.log(
      `  ✓  ${spec.ref}  [${spec.entryStatus.padEnd(8)}]  ${truckLabel.padEnd(22)}  ${spec.blCount} BLs  filière: ${fLabel}`,
    );
  }

  // ── Résumé ─────────────────────────────────────────────────────
  const totalBls   = await blRepo.count();
  const draftCount = await blRepo.count({ where: { statut: BlStatus.DRAFT } });
  const valCount   = await blRepo.count({ where: { statut: BlStatus.VALIDATED } });
  const totalPlans = await planRepo.count();

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`✅  Terminé !`);
  console.log(`   BLs DRAFT      : ${draftCount} (logistique à planifier)`);
  console.log(`   BLs VALIDATED  : ${valCount}  (dans des plans de chargement)`);
  console.log(`   Total BLs      : ${totalBls}`);
  console.log(`   Plans créés    : ${planCreated}/${planSpecs.length} (${totalPlans} total en base)`);
  console.log(`\n   👉  Lance le backend et connecte-toi en tant que :`);
  console.log(`        - LOGISTIC_ADMIN pour valider/assigner les BLs DRAFT`);
  console.log(`        - MAGASINIER     pour voir les 5 plans d'aujourd'hui`);
  console.log(`        - SECURITE       pour contrôler les entrées/sorties\n`);

  await app.close();
}

seed().catch((err) => {
  console.error('❌  Erreur :', err);
  process.exit(1);
});
