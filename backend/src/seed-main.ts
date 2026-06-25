/**
 * seed-main.ts -- Seed principal TMS
 * ==========================================================================
 * Lance : npm run seed:main
 *
 * Comptes (mot de passe : Test1234!) :
 *   SUPER_ADMIN         admin@tms.tn
 *   LOGISTIC_ADMIN      logistique@transfood.tn
 *   EXPEDITEUR_ADMIN    admin@roseblanche.tn
 *   FILIERE_ADMIN AMT   amt@roseblanche.tn
 *   FILIERE_ADMIN MCSR  mcsr@roseblanche.tn
 *   FILIERE_ADMIN PW    pw@roseblanche.tn
 *   MAGASINIER 1        mag1@roseblanche.tn  (AMT + MCSR)
 *   MAGASINIER 2        mag2@roseblanche.tn  (PW)
 *   SECURITE 1          sec1@roseblanche.tn  (AMT + MCSR)
 *   SECURITE 2          sec2@roseblanche.tn  (PW)
 *
 * Donnees :
 *   2 societes | 10 utilisateurs | 3 filieres | 9 quais
 *   8 camions  | 4 jours de disponibilites
 *   72 BLs (15 DRAFT | 32 VALIDATED | 19 LOADED | 6 DELIVERED)
 *   9 plans de chargement
 *
 * Scenarios SECURITE (entrees/sorties camions) :
 *   DONE/EXITED  il y a 2j  LP-TF-003 PW     (historique)
 *   DONE/EXITED  hier       LP-TF-001 AMT     (historique)
 *   DONE/EXITED  hier       LP-TF-002 MCSR    (historique)
 *   IN_PROGRESS/ENTERED aujourd'hui LP-TF-004 AMT  (camion dans l'usine)
 *   WAITING/CALLED      aujourd'hui LP-TF-005 MCSR (camion a la grille)
 *   WAITING/CALLED      aujourd'hui LP-TF-006 PW   (2e camion a la grille)
 *   WAITING/IDLE valide aujourd'hui LP-TF-007 MCSR (attendu, pas encore appele)
 *   WAITING/IDLE valide demain      LP-TF-008 AMT  (programme demain)
 *   WAITING/IDLE brouillon j+2     LP-TF-009 PW   (non valide)
 *
 * Scenarios MAGASINIER (gestion des BLs) :
 *   27 BLs VALIDATED libres  (9 AMT + 9 MCSR + 9 PW) disponibles pour planning
 *    3 BLs LOADED dans LP-TF-004 (chargement en cours)
 *    6 BLs VALIDATED dans plans CALLED (LP-TF-005, LP-TF-006) prets a charger
 *    6 BLs VALIDATED dans plans IDLE (LP-TF-007, LP-TF-008, LP-TF-009)
 *    9 BLs LOADED dans plans DONE (LP-TF-001, LP-TF-002, LP-TF-003)
 *    Mix VRAC/PALETTE/FRIGO/CITERNE avec ordreChargement, tonnages varies
 * ==========================================================================
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import dayjs from 'dayjs';
import * as dotenv from 'dotenv';

import { Company } from './companies/company.entity';
import { User } from './users/user.entity';
import { SocieteExpeditrice } from './expediteurs/societe-expeditrice.entity';
import { Filiere } from './expediteurs/filiere.entity';
import { Quai } from './quais/quai.entity';
import { DeliveryCompany } from './delivery-companies/delivery-company.entity';
import { Truck } from './trucks/truck.entity';
import { TruckAvailability } from './truck-availability/truck-availability.entity';
import { BonLivraison, TypeChargement } from './bons-livraison/bon-livraison.entity';
import { LoadingPlan } from './loading-plans/loading-plan.entity';
import { Role } from './common/enums/role.enum';
import { CompanyType } from './common/enums/company-type.enum';
import { BlStatus } from './common/enums/bl-status.enum';

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------
const PWD  = 'Test1234!';
const D_2  = dayjs().subtract(2, 'day').format('YYYY-MM-DD'); // avant-hier
const D_1  = dayjs().subtract(1, 'day').format('YYYY-MM-DD'); // hier
const D0   = dayjs().format('YYYY-MM-DD');                    // aujourd'hui
const D1   = dayjs().add(1, 'day').format('YYYY-MM-DD');      // demain
const D2   = dayjs().add(2, 'day').format('YYYY-MM-DD');      // apres-demain
const D3   = dayjs().add(3, 'day').format('YYYY-MM-DD');

// ---------------------------------------------------------------------------
// Donnees de reference
// ---------------------------------------------------------------------------
const ORIGINES = ['Tunis', 'Sfax', 'Sousse', 'Kairouan', 'Bizerte', 'Tunis', 'Tunis'];

const VILLES = [
  'Sfax', 'Sousse', 'Bizerte', 'Nabeul', 'Kairouan', 'Gabes',
  'Medenine', 'Monastir', 'Jendouba', 'Le Kef', 'Mahdia',
  'Gafsa', 'Tozeur', 'Kebili', 'Siliana',
];

const CLIENTS = [
  'Ste El Amal Distribution',   'Ets Ben Salah et Fils',
  'Agro Market SARL',            'Cooperative El Wafa',
  'Distribution Nord SARL',      'Ste El Baraka Commerce',
  'Transag SARL',                'Market Plus Tunisie',
  'Ets Trabelsi et Cie',         'Cooperative de Sfax',
  'El Fateh Commerce',           'Dist Sud SARL',
  'Ste Alimentaire Centrale',    'El Jadida SARL',
  'Hyper Marche Sfax',
];

const NOTES_POOL = [
  '',
  'Livraison avant 10h - appeler avant',
  'Produits fragiles - manutention soigneuse',
  '',
  'Urgent - priorite haute',
  'Temperature 2-4 C requise',
  '',
  'Certificat de conformite requis',
  'Palette filmee obligatoire',
  '',
];

// Cycle de types de chargement par filiere (pour varier)
const TC_AMT:  TypeChargement[] = [
  TypeChargement.VRAC,    TypeChargement.VRAC,    TypeChargement.PALETTE,
  TypeChargement.VRAC,    TypeChargement.VRAC,    TypeChargement.PALETTE,
  TypeChargement.VRAC,    TypeChargement.FRIGO,   TypeChargement.VRAC,
  TypeChargement.PALETTE, TypeChargement.VRAC,    TypeChargement.VRAC,
];
const TC_MCR: TypeChargement[] = [
  TypeChargement.VRAC,    TypeChargement.PALETTE, TypeChargement.VRAC,
  TypeChargement.FRIGO,   TypeChargement.VRAC,    TypeChargement.PALETTE,
  TypeChargement.VRAC,    TypeChargement.VRAC,    TypeChargement.PALETTE,
  TypeChargement.FRIGO,   TypeChargement.VRAC,    TypeChargement.CITERNE,
];
const TC_PW: TypeChargement[] = [
  TypeChargement.VRAC,    TypeChargement.VRAC,    TypeChargement.PALETTE,
  TypeChargement.VRAC,    TypeChargement.FRIGO,   TypeChargement.VRAC,
  TypeChargement.CITERNE, TypeChargement.VRAC,    TypeChargement.PALETTE,
  TypeChargement.VRAC,    TypeChargement.VRAC,    TypeChargement.PALETTE,
];

// ---------------------------------------------------------------------------
// Reset schema PostgreSQL (evite les conflits d'enum TypeORM synchronize)
// ---------------------------------------------------------------------------
async function resetSchema() {
  dotenv.config();
  const pool = new Pool({
    host:     process.env.DB_HOST     ?? 'localhost',
    port:     Number(process.env.DB_PORT ?? 5432),
    user:     process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'sana',
    database: process.env.DB_NAME     ?? 'tms_db_new',
  });
  console.log('[seed] Reset du schema PostgreSQL...');
  await pool.query('DROP SCHEMA public CASCADE');
  await pool.query('CREATE SCHEMA public');
  await pool.query('GRANT ALL ON SCHEMA public TO postgres');
  await pool.query('GRANT ALL ON SCHEMA public TO public');
  await pool.end();
  console.log('[seed] OK - Schema remis a zero, TypeORM va reconstruire les tables');
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
async function bootstrap() {
  await resetSchema();

  console.log('[seed] Initialisation NestJS...');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  console.log('[seed] OK');

  const companyRepo = app.get<Repository<Company>>(getRepositoryToken(Company));
  const userRepo    = app.get<Repository<User>>(getRepositoryToken(User));
  const societeRepo = app.get<Repository<SocieteExpeditrice>>(getRepositoryToken(SocieteExpeditrice));
  const filRepo     = app.get<Repository<Filiere>>(getRepositoryToken(Filiere));
  const quaiRepo    = app.get<Repository<Quai>>(getRepositoryToken(Quai));
  const dcRepo      = app.get<Repository<DeliveryCompany>>(getRepositoryToken(DeliveryCompany));
  const truckRepo   = app.get<Repository<Truck>>(getRepositoryToken(Truck));
  const taRepo      = app.get<Repository<TruckAvailability>>(getRepositoryToken(TruckAvailability));
  const blRepo      = app.get<Repository<BonLivraison>>(getRepositoryToken(BonLivraison));
  const lpRepo      = app.get<Repository<LoadingPlan>>(getRepositoryToken(LoadingPlan));

  // =========================================================================
  // 1. SOCIETES
  // =========================================================================
  console.log('[seed] Societes...');
  const transfood = await companyRepo.save(companyRepo.create({
    nom: 'TransFood', type: CompanyType.LOGISTIQUE,
    couleur: '#1890ff', code: 'TF', isActive: true,
  }));
  const rbCompany = await companyRepo.save(companyRepo.create({
    nom: 'Rose Blanche', type: CompanyType.EXPEDITEUR,
    couleur: '#eb2f96', code: 'RB', isActive: true,
  }));
  console.log('[seed] OK - TransFood + Rose Blanche');

  // =========================================================================
  // 2. UTILISATEURS
  // =========================================================================
  console.log('[seed] Utilisateurs...');
  const pwd = await bcrypt.hash(PWD, 10);

  const mkUser = (email: string, prenom: string, nom: string, role: Role, co: Company) =>
    userRepo.save(userRepo.create({ email, prenom, nom, password: pwd, role, isActive: true, company: co }));

  const respLogist = await mkUser('logistique@transfood.tn', 'Responsable', 'Logistique',   Role.LOGISTIC_ADMIN,   transfood);
  await mkUser('admin@tms.tn',            'Super',      'Admin',         Role.SUPER_ADMIN,      transfood);
  await mkUser('admin@roseblanche.tn',    'Admin',      'Rose Blanche',  Role.EXPEDITEUR_ADMIN, rbCompany);

  const uAMT  = await mkUser('amt@roseblanche.tn',  'Responsable', 'Filiere AMT',  Role.FILIERE_ADMIN, rbCompany);
  const uMCSR = await mkUser('mcsr@roseblanche.tn', 'Responsable', 'Filiere MCSR', Role.FILIERE_ADMIN, rbCompany);
  const uPW   = await mkUser('pw@roseblanche.tn',   'Responsable', 'Filiere PW',   Role.FILIERE_ADMIN, rbCompany);
  const mag1  = await mkUser('mag1@roseblanche.tn', 'Magasinier',  'Un',           Role.MAGASINIER,    rbCompany);
  const mag2  = await mkUser('mag2@roseblanche.tn', 'Magasinier',  'Deux',         Role.MAGASINIER,    rbCompany);
  const sec1  = await mkUser('sec1@roseblanche.tn', 'Agent',       'Securite-1',   Role.SECURITE,      rbCompany);
  const sec2  = await mkUser('sec2@roseblanche.tn', 'Agent',       'Securite-2',   Role.SECURITE,      rbCompany);
  console.log('[seed] OK - 10 comptes (Test1234!)');

  // =========================================================================
  // 3. SOCIETE EXPEDITRICE + FILIERES + QUAIS
  // =========================================================================
  console.log('[seed] Rose Blanche   - filieres et quais...');
  const rbSA = await societeRepo.save(societeRepo.create({
    nom: 'Rose Blanche  ', code: 'RB', couleur: '#eb2f96',
    adresse: 'Zone Industrielle El Agba, Tunis 2086',
    telephone: '+216 71 555 666',
    company: transfood,
    expediteurCompany: rbCompany,
  }));

  const saRef  = { id: rbSA.id } as SocieteExpeditrice;
  const filAMT = await filRepo.save(filRepo.create({ nom: 'AMT',        code: 'AMT',  societeExpeditrice: saRef }));
  const filMCR = await filRepo.save(filRepo.create({ nom: 'MCSR',       code: 'MCSR', societeExpeditrice: saRef }));
  const filPW  = await filRepo.save(filRepo.create({ nom: 'Pate Warda', code: 'PW',   societeExpeditrice: saRef }));

  for (const [fil, prefix] of [[filAMT,'AMT'],[filMCR,'MCSR'],[filPW,'PW']] as [Filiere,string][]) {
    for (let i = 1; i <= 3; i++) {
      await quaiRepo.save(quaiRepo.create({
        nom: `${prefix}-${i}`, isActive: true,
        company: transfood, societeExpeditrice: rbSA, filiere: fil,
      }));
    }
  }

  await userRepo.save({ ...uAMT,  filieres: [filAMT] });
  await userRepo.save({ ...uMCSR, filieres: [filMCR] });
  await userRepo.save({ ...uPW,   filieres: [filPW] });
  await userRepo.save({ ...mag1,  filieres: [filAMT, filMCR] });
  await userRepo.save({ ...mag2,  filieres: [filPW] });
  await userRepo.save({ ...sec1,  filieres: [filAMT, filMCR] });
  await userRepo.save({ ...sec2,  filieres: [filPW] });
  console.log('[seed] OK - 3 filieres / 9 quais / affectations');

  // =========================================================================
  // 4. PARTENARIAT
  // =========================================================================
  await companyRepo.update(rbCompany.id, { logistiqueCompany: { id: transfood.id } } as any);
  console.log('[seed] OK - Rose Blanche → TransFood');

  // =========================================================================
  // 5. PARC DE CAMIONS (8 camions)
  // =========================================================================
  console.log('[seed] Parc de camions...');
  const flotte = await dcRepo.save(dcRepo.create({
    nom: 'Flotte TransFood', adresse: 'Depot Central, Route de Tunis, Ariana',
    telephone: '+216 71 000 001', isActive: true, company: transfood,
  }));

  const truckDefs = [
    // T0 - T1 : Standard (vrac et mixte)
    { matricule: '123TU4567', type: 'Standard',  capaciteTonnage: 20, capacitePalettes: 0  },
    { matricule: '234TU5678', type: 'Standard',  capaciteTonnage: 15, capacitePalettes: 0  },
    // T2 - T3 : Palette (produits emballes)
    { matricule: '345TU6789', type: 'Palette',   capaciteTonnage: 18, capacitePalettes: 24 },
    { matricule: '456TU7890', type: 'Palette',   capaciteTonnage: 12, capacitePalettes: 16 },
    // T4 - T5 : Frigo (produits refrigeres)
    { matricule: '567TU8901', type: 'Frigo',     capaciteTonnage: 8,  capacitePalettes: 0  },
    { matricule: '678TU9012', type: 'Frigo',     capaciteTonnage: 10, capacitePalettes: 0  },
    // T6 : Standard grand volume
    { matricule: '789TU0123', type: 'Standard',  capaciteTonnage: 22, capacitePalettes: 0  },
    // T7 : Citerne (huiles, liquides)
    { matricule: '890TU1234', type: 'Citerne',   capaciteTonnage: 25, capacitePalettes: 0  },
  ];

  const trucks = await Promise.all(
    truckDefs.map((d) => truckRepo.save(truckRepo.create({ ...d, isActive: true, deliveryCompany: flotte }))),
  );

  // Disponibilites sur 6 jours glissants
  for (const truck of trucks) {
    for (const date of [D_2, D_1, D0, D1, D2, D3]) {
      await taRepo.save(taRepo.create({ truck, date }));
    }
  }
  console.log(`[seed] OK - ${trucks.length} camions / disponibilites 6 jours`);

  // =========================================================================
  // 6. BONS DE LIVRAISON (72 BLs)
  //
  // Statuts a la creation selon leur destination :
  //   DRAFT     → BLs libres en attente de validation
  //   VALIDATED → BLs valides, libres OU dans un plan CALLED/IDLE
  //   LOADED    → BLs assignes a un plan IN_PROGRESS ou DONE
  //   DELIVERED → BLs dont la livraison a ete confirmee (plan DONE ancien)
  // =========================================================================
  console.log('[seed] Generation des BLs...');

  const mkBL = async (
    numeroBl:   string,
    filiere:    Filiere,
    statut:     BlStatus,
    idx:        number,
    tcArr:      TypeChargement[],
    extras:     Partial<{ erpReference: string; notes: string; origine: string }> = {},
  ): Promise<BonLivraison> => {
    const ville    = VILLES[idx % VILLES.length];
    const client   = CLIENTS[idx % CLIENTS.length];
    const tc       = tcArr[idx % tcArr.length];
    const tonnage  = 4 + (idx % 18);  // 4T a 21T
    const palettes = tc === TypeChargement.PALETTE ? 4 + (idx % 12) : 0;
    const note     = extras.notes ?? NOTES_POOL[idx % NOTES_POOL.length];
    const origine  = extras.origine ?? ORIGINES[idx % ORIGINES.length];
    const erp      = extras.erpReference ?? (idx % 3 === 0 ? `ERP-${10000 + idx}` : undefined as any);
    const delivery = new Date(dayjs().add(3 + (idx % 12), 'day').toISOString());

    return blRepo.save(blRepo.create({
      numeroBl, clientNom: client, clientAdresse: `Zone Industrielle, ${ville}`,
      origine, destination: ville, typeChargement: tc,
      tonnageTotal: tonnage, nombrePalettes: palettes,
      statut, datelivraison: delivery, erpReference: erp, notes: note,
      company: transfood, societeExpeditrice: rbSA, filiere,
    }));
  };

  // ── AMT (24 BLs) ────────────────────────────────────────────────────────
  // [0-4]   DRAFT   (libres, pas encore valides)
  // [5-13]  VALIDATED libres (pool disponible pour nouveau planning)
  // [14-16] VALIDATED dans LP-TF-008 (IDLE demain)
  // [17-19] LOADED   dans LP-TF-004 (IN_PROGRESS aujourd'hui)
  // [20-22] LOADED   dans LP-TF-001 (DONE hier)
  // [23]    DELIVERED (livraison confirmee, plan termine il y a 2j)
  const amtBls: BonLivraison[] = [];
  for (let i = 1;  i <= 5;  i++) amtBls.push(await mkBL(`BL-AMT-${pad(i)}`,  filAMT, BlStatus.DRAFT,     i,    TC_AMT));
  for (let i = 6;  i <= 14; i++) amtBls.push(await mkBL(`BL-AMT-${pad(i)}`,  filAMT, BlStatus.VALIDATED, i,    TC_AMT));
  for (let i = 15; i <= 17; i++) amtBls.push(await mkBL(`BL-AMT-${pad(i)}`,  filAMT, BlStatus.VALIDATED, i,    TC_AMT, { origine: 'Bizerte' }));
  for (let i = 18; i <= 20; i++) amtBls.push(await mkBL(`BL-AMT-${pad(i)}`,  filAMT, BlStatus.LOADED,    i,    TC_AMT, { erpReference: `ERP-AMT-${i}` }));
  for (let i = 21; i <= 23; i++) amtBls.push(await mkBL(`BL-AMT-${pad(i)}`,  filAMT, BlStatus.LOADED,    i,    TC_AMT, { erpReference: `ERP-AMT-${i}` }));
  amtBls.push(await mkBL('BL-AMT-024', filAMT, BlStatus.DELIVERED, 24, TC_AMT, { notes: 'Livraison confirmee par le client' }));

  // ── MCSR (24 BLs) ───────────────────────────────────────────────────────
  // [0-4]   DRAFT   libres
  // [5-13]  VALIDATED libres
  // [14-16] VALIDATED dans LP-TF-007 (IDLE valide, aujourd'hui, pas encore appele)
  // [17-19] VALIDATED dans LP-TF-005 (WAITING/CALLED aujourd'hui)
  // [20-22] LOADED   dans LP-TF-002 (DONE hier)
  // [23]    DELIVERED
  const mcrBls: BonLivraison[] = [];
  for (let i = 1;  i <= 5;  i++) mcrBls.push(await mkBL(`BL-MCSR-${pad(i)}`,  filMCR, BlStatus.DRAFT,     i+24, TC_MCR));
  for (let i = 6;  i <= 14; i++) mcrBls.push(await mkBL(`BL-MCSR-${pad(i)}`,  filMCR, BlStatus.VALIDATED, i+24, TC_MCR));
  for (let i = 15; i <= 17; i++) mcrBls.push(await mkBL(`BL-MCSR-${pad(i)}`,  filMCR, BlStatus.VALIDATED, i+24, TC_MCR, { origine: 'Kairouan' }));
  for (let i = 18; i <= 20; i++) mcrBls.push(await mkBL(`BL-MCSR-${pad(i)}`,  filMCR, BlStatus.VALIDATED, i+24, TC_MCR, { notes: 'Urgent - priorite haute' }));
  for (let i = 21; i <= 23; i++) mcrBls.push(await mkBL(`BL-MCSR-${pad(i)}`,  filMCR, BlStatus.LOADED,    i+24, TC_MCR, { erpReference: `ERP-MCSR-${i}` }));
  mcrBls.push(await mkBL('BL-MCSR-024', filMCR, BlStatus.DELIVERED, 48, TC_MCR, { notes: 'Livraison confirmee' }));

  // ── PW (24 BLs) ─────────────────────────────────────────────────────────
  // [0-4]   DRAFT   libres
  // [5-12]  VALIDATED libres  (8 BLs)
  // [13-15] VALIDATED dans LP-TF-009 (brouillon j+2, non valide)
  // [16-18] VALIDATED dans LP-TF-006 (WAITING/CALLED aujourd'hui)
  // [19-21] LOADED   dans LP-TF-003 (DONE avant-hier)
  // [22-23] DELIVERED
  const pwBls: BonLivraison[] = [];
  for (let i = 1;  i <= 5;  i++) pwBls.push(await mkBL(`BL-PW-${pad(i)}`,   filPW, BlStatus.DRAFT,     i+48, TC_PW));
  for (let i = 6;  i <= 13; i++) pwBls.push(await mkBL(`BL-PW-${pad(i)}`,   filPW, BlStatus.VALIDATED, i+48, TC_PW));
  for (let i = 14; i <= 16; i++) pwBls.push(await mkBL(`BL-PW-${pad(i)}`,   filPW, BlStatus.VALIDATED, i+48, TC_PW, { origine: 'Sfax' }));
  for (let i = 17; i <= 19; i++) pwBls.push(await mkBL(`BL-PW-${pad(i)}`,   filPW, BlStatus.VALIDATED, i+48, TC_PW, { notes: 'Temperature 2-4 C requise' }));
  for (let i = 20; i <= 22; i++) pwBls.push(await mkBL(`BL-PW-${pad(i)}`,   filPW, BlStatus.LOADED,    i+48, TC_PW, { erpReference: `ERP-PW-${i}` }));
  pwBls.push(await mkBL('BL-PW-023', filPW, BlStatus.DELIVERED, 71, TC_PW));
  pwBls.push(await mkBL('BL-PW-024', filPW, BlStatus.DELIVERED, 72, TC_PW, { notes: 'Livre - bon de reception signe' }));

  console.log('[seed] OK - 72 BLs (15 DRAFT / 32 VALIDATED / 19 LOADED / 6 DELIVERED)');

  // =========================================================================
  // 7. PLANS DE CHARGEMENT (9 plans)
  // =========================================================================
  console.log('[seed] Plans de chargement...');

  type PlanConfig = {
    reference:     string;
    truck:         Truck;
    date:          string;
    bls:           BonLivraison[];
    isValidated:   boolean;
    loadingStatus: string;
    entryStatus:   string;
    quai:          string | null;
    station:       string;
    elapsedSecs:   number;
    heureArrivee:  string | null;
  };

  const mkPlan = async (cfg: PlanConfig) => {
    const tonnage  = cfg.bls.reduce((s, b) => s + Number(b.tonnageTotal), 0);
    const palettes = cfg.bls.reduce((s, b) => s + Number(b.nombrePalettes), 0);

    const plan = await lpRepo.save(lpRepo.create({
      reference:             cfg.reference,
      dateLivraison:         new Date(cfg.date),
      tonnageCharge:         tonnage,
      palettesChargees:      palettes,
      isValidated:           cfg.isValidated,
      loadingStatus:         cfg.loadingStatus,
      entryStatus:           cfg.entryStatus,
      quai:                  cfg.quai ?? (undefined as any),
      heureArrivee:          cfg.heureArrivee ?? (undefined as any),
      stationsSequence:      [cfg.station],
      currentStation:        cfg.station,
      currentStationIdx:     0,
      loadingStartedAt:      cfg.loadingStatus === 'IN_PROGRESS' ? new Date() : (undefined as any),
      loadingElapsedSeconds: cfg.elapsedSecs,
      logistiqueCompanyId:   transfood.id,
      truck:                 cfg.truck,
      validatedBy:           cfg.isValidated ? respLogist : (undefined as any),
    }));

    // Lier les BLs et definir l'ordre de chargement
    await Promise.all(
      cfg.bls.map((bl, i) =>
        blRepo.update({ id: bl.id }, {
          loadingPlan:      { id: plan.id },
          ordreChargement:  i + 1,
        }),
      ),
    );

    console.log(`[seed]   ${cfg.reference}  ${cfg.loadingStatus}/${cfg.entryStatus}  ${cfg.date}  ${cfg.bls.length} BLs  ${cfg.truck.matricule}`);
    return plan;
  };

  // ── LP-TF-003 : PW, DONE il y a 2 jours (historique) ───────────────────
  // Scenario SECURITE : camion sorti depuis longtemps, juste en historique
  // Scenario MAGASINIER : BLs LOADED, chargement confirme
  await mkPlan({
    reference: 'LP-TF-003', truck: trucks[5], date: D_2,
    bls: [pwBls[19], pwBls[20], pwBls[21]],
    isValidated: true, loadingStatus: 'DONE', entryStatus: 'EXITED',
    quai: 'PW-3', station: 'PW', elapsedSecs: 5400, heureArrivee: '07:30',
  });

  // ── LP-TF-001 : AMT, DONE hier ──────────────────────────────────────────
  // Scenario SECURITE : camion sorti hier matin (historique recente)
  await mkPlan({
    reference: 'LP-TF-001', truck: trucks[0], date: D_1,
    bls: [amtBls[20], amtBls[21], amtBls[22]],
    isValidated: true, loadingStatus: 'DONE', entryStatus: 'EXITED',
    quai: 'AMT-1', station: 'AMT', elapsedSecs: 4800, heureArrivee: '08:15',
  });

  // ── LP-TF-002 : MCSR, DONE hier ─────────────────────────────────────────
  // Scenario SECURITE : 2e camion sorti hier (multi-livraisons)
  await mkPlan({
    reference: 'LP-TF-002', truck: trucks[1], date: D_1,
    bls: [mcrBls[20], mcrBls[21], mcrBls[22]],
    isValidated: true, loadingStatus: 'DONE', entryStatus: 'EXITED',
    quai: 'MCSR-1', station: 'MCSR', elapsedSecs: 3600, heureArrivee: '09:00',
  });

  // ── LP-TF-004 : AMT, IN_PROGRESS / ENTERED aujourd'hui ──────────────────
  // Scenario SECURITE : camion actuellement dans l'usine (chargement en cours)
  // Scenario MAGASINIER : activer le suivi de chargement, BLs en cours
  await mkPlan({
    reference: 'LP-TF-004', truck: trucks[2], date: D0,
    bls: [amtBls[17], amtBls[18], amtBls[19]],
    isValidated: true, loadingStatus: 'IN_PROGRESS', entryStatus: 'ENTERED',
    quai: 'AMT-2', station: 'AMT', elapsedSecs: 2347, heureArrivee: '10:30',
  });

  // ── LP-TF-005 : MCSR, WAITING / CALLED aujourd'hui ──────────────────────
  // Scenario SECURITE : camion appele, en route vers la grille → doit entrer
  // Scenario MAGASINIER : BLs prets (VALIDATED), chargement commence a l'entree
  await mkPlan({
    reference: 'LP-TF-005', truck: trucks[3], date: D0,
    bls: [mcrBls[17], mcrBls[18], mcrBls[19]],
    isValidated: true, loadingStatus: 'WAITING', entryStatus: 'CALLED',
    quai: 'MCSR-2', station: 'MCSR', elapsedSecs: 0, heureArrivee: null,
  });

  // ── LP-TF-006 : PW, WAITING / CALLED aujourd'hui ────────────────────────
  // Scenario SECURITE : 2e camion appele en meme temps (file d'attente)
  // Scenario MAGASINIER : BLs frigo prets (Temperature requise)
  await mkPlan({
    reference: 'LP-TF-006', truck: trucks[4], date: D0,
    bls: [pwBls[16], pwBls[17], pwBls[18]],
    isValidated: true, loadingStatus: 'WAITING', entryStatus: 'CALLED',
    quai: 'PW-1', station: 'PW', elapsedSecs: 0, heureArrivee: null,
  });

  // ── LP-TF-007 : MCSR, WAITING / IDLE valide aujourd'hui ─────────────────
  // Scenario SECURITE : plan valide pour aujourd'hui, camion pas encore appele
  //   → securite peut l'appeler via le systeme
  // Scenario MAGASINIER : BLs Urgent pre-assignes, attente appel camion
  await mkPlan({
    reference: 'LP-TF-007', truck: trucks[6], date: D0,
    bls: [mcrBls[14], mcrBls[15], mcrBls[16]],
    isValidated: true, loadingStatus: 'WAITING', entryStatus: 'IDLE',
    quai: 'MCSR-3', station: 'MCSR', elapsedSecs: 0, heureArrivee: null,
  });

  // ── LP-TF-008 : AMT, WAITING / IDLE valide demain ───────────────────────
  // Scenario SECURITE : plan programme pour demain (planning previsionnel)
  // Scenario MAGASINIER : BLs pre-reserves, tonnage verifie
  await mkPlan({
    reference: 'LP-TF-008', truck: trucks[7], date: D1,
    bls: [amtBls[14], amtBls[15], amtBls[16]],
    isValidated: true, loadingStatus: 'WAITING', entryStatus: 'IDLE',
    quai: 'AMT-3', station: 'AMT', elapsedSecs: 0, heureArrivee: null,
  });

  // ── LP-TF-009 : PW, brouillon non valide j+2 ────────────────────────────
  // Scenario MAGASINIER : plan en cours de creation, pas encore valide
  //   → respLogist doit valider avant que la securite puisse appeler le camion
  await mkPlan({
    reference: 'LP-TF-009', truck: trucks[0], date: D2,
    bls: [pwBls[13], pwBls[14], pwBls[15]],
    isValidated: false, loadingStatus: 'WAITING', entryStatus: 'IDLE',
    quai: null, station: 'PW', elapsedSecs: 0, heureArrivee: null,
  });

  // =========================================================================
  // 8. SOCIETES DE TRANSPORT SUPPLEMENTAIRES (Feature 11 — 4 societes total)
  // =========================================================================
  console.log('[seed] Societes de transport supplementaires...');

  const bejaoui  = await dcRepo.save(dcRepo.create({
    nom: 'Transport Bejaoui', adresse: 'Route Nationale 1, Mhamdia, Ben Arous',
    telephone: '+216 71 000 100', isActive: true, company: transfood,
  }));
  const logisfax = await dcRepo.save(dcRepo.create({
    nom: 'Logistrans Sfax', adresse: 'Zone Industrielle Thyna, Sfax 3001',
    telephone: '+216 74 000 200', isActive: true, company: transfood,
  }));
  const transNord = await dcRepo.save(dcRepo.create({
    nom: 'Trans Rapide Nord', adresse: 'Avenue Mongi Slim, Bizerte 7000',
    telephone: '+216 72 000 300', isActive: true, company: transfood,
  }));

  type TruckDef = { matricule: string; type: string; capaciteTonnage: number; capacitePalettes: number };
  const extTruckDefs: { dc: DeliveryCompany; defs: TruckDef[] }[] = [
    { dc: bejaoui,   defs: [
      { matricule: '910TU2345', type: 'Standard', capaciteTonnage: 18, capacitePalettes: 0  },
      { matricule: '101TU3456', type: 'Palette',  capaciteTonnage: 15, capacitePalettes: 20 },
      { matricule: '112TU4567', type: 'Frigo',    capaciteTonnage: 9,  capacitePalettes: 0  },
    ]},
    { dc: logisfax,  defs: [
      { matricule: '223TU5678', type: 'Citerne',  capaciteTonnage: 28, capacitePalettes: 0  },
      { matricule: '334TU6789', type: 'Standard', capaciteTonnage: 20, capacitePalettes: 0  },
      { matricule: '445TU7890', type: 'Benne',    capaciteTonnage: 22, capacitePalettes: 0  },
    ]},
    { dc: transNord, defs: [
      { matricule: '556TU8901', type: 'Standard', capaciteTonnage: 16, capacitePalettes: 0  },
      { matricule: '667TU9012', type: 'Frigo',    capaciteTonnage: 11, capacitePalettes: 0  },
    ]},
  ];

  const extTrucks: Truck[] = [];
  for (const { dc, defs } of extTruckDefs) {
    for (const d of defs) {
      const t = await truckRepo.save(truckRepo.create({ ...d, isActive: true, deliveryCompany: dc })) as Truck;
      extTrucks.push(t);
      for (const date of [D_2, D_1, D0, D1, D2, D3]) {
        await taRepo.save(taRepo.create({ truck: t, date }));
      }
    }
  }
  console.log(`[seed] OK - ${extTrucks.length} camions supplementaires (Bejaoui/Logisfax/TransNord)`);

  // =========================================================================
  // 9. DEUXIEME SOCIETE EXPEDITRICE — Poulina Group (Feature 12)
  // =========================================================================
  console.log('[seed] Poulina Group - 2eme expediteur...');

  const poulinaCompany = await companyRepo.save(companyRepo.create({
    nom: 'Poulina Group', type: CompanyType.EXPEDITEUR,
    couleur: '#fa8c16', code: 'PG', isActive: true,
  }));

  await mkUser('admin@poulina.tn',    'Admin',       'Poulina',  Role.EXPEDITEUR_ADMIN, poulinaCompany);
  const uHuile    = await mkUser('huile@poulina.tn',    'Responsable', 'Huile',    Role.FILIERE_ADMIN, poulinaCompany);
  const uCereales = await mkUser('cereales@poulina.tn', 'Responsable', 'Cereales', Role.FILIERE_ADMIN, poulinaCompany);
  const magPou    = await mkUser('mag@poulina.tn',      'Magasinier',  'Poulina',  Role.MAGASINIER,    poulinaCompany);
  const secPou    = await mkUser('sec@poulina.tn',      'Agent',       'Securite', Role.SECURITE,      poulinaCompany);

  const poulinaSA = await societeRepo.save(societeRepo.create({
    nom: 'Poulina Group Alimentaire', code: 'PG', couleur: '#fa8c16',
    adresse: 'Zone Industrielle Sidi Fathallah, Ariana 2094',
    telephone: '+216 71 700 800',
    company: transfood,
    expediteurCompany: poulinaCompany,
  }));

  const filHuile    = await filRepo.save(filRepo.create({
    nom: 'Huile Vegetale', code: 'HV',
    societeExpeditrice: { id: poulinaSA.id } as SocieteExpeditrice,
  }));
  const filCereales = await filRepo.save(filRepo.create({
    nom: 'Cereales & Legumineuses', code: 'CL',
    societeExpeditrice: { id: poulinaSA.id } as SocieteExpeditrice,
  }));

  for (const [fil, prefix] of [[filHuile,'HV'],[filCereales,'CL']] as [Filiere,string][]) {
    for (let i = 1; i <= 2; i++) {
      await quaiRepo.save(quaiRepo.create({
        nom: `${prefix}-${i}`, isActive: true,
        company: transfood, societeExpeditrice: poulinaSA, filiere: fil,
      }));
    }
  }

  await userRepo.save({ ...uHuile,    filieres: [filHuile] });
  await userRepo.save({ ...uCereales, filieres: [filCereales] });
  await userRepo.save({ ...magPou,    filieres: [filHuile, filCereales] });
  await userRepo.save({ ...secPou,    filieres: [filHuile, filCereales] });

  await companyRepo.update(poulinaCompany.id, { logistiqueCompany: { id: transfood.id } } as any);

  // Poulina BLs (20 BLs supplementaires)
  const TC_HV: TypeChargement[] = [TypeChargement.CITERNE, TypeChargement.CITERNE, TypeChargement.VRAC,  TypeChargement.CITERNE, TypeChargement.PALETTE, TypeChargement.CITERNE];
  const TC_CL: TypeChargement[] = [TypeChargement.VRAC,    TypeChargement.PALETTE, TypeChargement.VRAC,  TypeChargement.VRAC,    TypeChargement.PALETTE, TypeChargement.VRAC   ];

  const mkBLPou = async (numeroBl: string, filiere: Filiere, statut: BlStatus, idx: number, tcArr: TypeChargement[]) => {
    const ville   = VILLES[idx % VILLES.length];
    const tc      = tcArr[idx % tcArr.length];
    const tonnage = 8 + (idx % 20);
    return blRepo.save(blRepo.create({
      numeroBl, clientNom: CLIENTS[idx % CLIENTS.length],
      clientAdresse: `Zone Industrielle, ${ville}`,
      origine: ORIGINES[idx % ORIGINES.length], destination: ville,
      typeChargement: tc, tonnageTotal: tonnage,
      nombrePalettes: tc === TypeChargement.PALETTE ? 8 + (idx % 8) : 0,
      statut, datelivraison: new Date(dayjs().add(3 + (idx % 10), 'day').toISOString()),
      company: transfood, societeExpeditrice: poulinaSA, filiere,
    }));
  };

  const hvBls: BonLivraison[] = [];
  const clBls: BonLivraison[] = [];
  for (let i = 1; i <= 3; i++) hvBls.push(await mkBLPou(`BL-HV-${pad(i)}`, filHuile, BlStatus.DRAFT,      i + 80, TC_HV));
  for (let i = 4; i <= 8; i++) hvBls.push(await mkBLPou(`BL-HV-${pad(i)}`, filHuile, BlStatus.VALIDATED,  i + 80, TC_HV));
  for (let i = 9; i <= 10; i++) hvBls.push(await mkBLPou(`BL-HV-${pad(i)}`, filHuile, BlStatus.LOADED,    i + 80, TC_HV));

  for (let i = 1; i <= 3; i++) clBls.push(await mkBLPou(`BL-CL-${pad(i)}`, filCereales, BlStatus.DRAFT,     i + 90, TC_CL));
  for (let i = 4; i <= 8; i++) clBls.push(await mkBLPou(`BL-CL-${pad(i)}`, filCereales, BlStatus.VALIDATED, i + 90, TC_CL));
  for (let i = 9; i <= 10; i++) clBls.push(await mkBLPou(`BL-CL-${pad(i)}`, filCereales, BlStatus.LOADED,   i + 90, TC_CL));

  // 2 plans Poulina
  await mkPlan({
    reference: 'LP-PG-001', truck: extTrucks[3] /* Citerne Logisfax */, date: D0,
    bls: [hvBls[8], hvBls[9]],
    isValidated: true, loadingStatus: 'IN_PROGRESS', entryStatus: 'ENTERED',
    quai: 'HV-1', station: 'HV', elapsedSecs: 1200, heureArrivee: '11:00',
  });
  await mkPlan({
    reference: 'LP-PG-002', truck: extTrucks[0] /* Standard Bejaoui */, date: D1,
    bls: [clBls[8], clBls[9]],
    isValidated: true, loadingStatus: 'WAITING', entryStatus: 'IDLE',
    quai: 'CL-1', station: 'CL', elapsedSecs: 0, heureArrivee: null,
  });

  console.log('[seed] OK - Poulina: 2 filieres / 4 quais / 20 BLs / 2 plans');

  // =========================================================================
  // RESUME
  // =========================================================================
  console.log('');
  console.log('==============================================================');
  console.log('  SEED TERMINE AVEC SUCCES');
  console.log('==============================================================');
  console.log('  Mot de passe : Test1234!');
  console.log('');
  console.log('  admin@tms.tn             SUPER_ADMIN');
  console.log('  logistique@transfood.tn  LOGISTIC_ADMIN');
  console.log('  admin@roseblanche.tn     EXPEDITEUR_ADMIN');
  console.log('  amt@roseblanche.tn       FILIERE_ADMIN (AMT)');
  console.log('  mcsr@roseblanche.tn      FILIERE_ADMIN (MCSR)');
  console.log('  pw@roseblanche.tn        FILIERE_ADMIN (PW)');
  console.log('  mag1@roseblanche.tn      MAGASINIER    (AMT + MCSR)');
  console.log('  mag2@roseblanche.tn      MAGASINIER    (PW)');
  console.log('  sec1@roseblanche.tn      SECURITE      (AMT + MCSR)');
  console.log('  sec2@roseblanche.tn      SECURITE      (PW)');
  console.log('');
  console.log('  --- Poulina Group ---');
  console.log('  admin@poulina.tn         EXPEDITEUR_ADMIN');
  console.log('  huile@poulina.tn         FILIERE_ADMIN (Huile Vegetale)');
  console.log('  cereales@poulina.tn      FILIERE_ADMIN (Cereales)');
  console.log('  mag@poulina.tn           MAGASINIER');
  console.log('  sec@poulina.tn           SECURITE');
  console.log('');
  console.log('  72 BLs Rose Blanche + 20 BLs Poulina = 92 BLs au total');
  console.log('  11 plans  /  16 camions (4 societes de transport)');
  console.log('==============================================================');

  await app.close();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function pad(n: number) { return String(n).padStart(3, '0'); }

bootstrap().catch((err) => {
  console.error('[seed] ECHEC :', err?.message ?? String(err));
  if (err?.stack) console.error(err.stack);
  process.exit(1);
});
