/**
 * Seeder Rose Blanche — Filières MCSR / AMT / PW
 * ================================================
 * 53 BLs · 18 plans de chargement · 12 camions · 10 chauffeurs
 * 8 quais · 12 articles · 12 comptes utilisateurs
 *
 * Couvre TOUTES les fonctionnalités de la plateforme (50+ cas).
 * Idempotent : peut être relancé sans dupliquer les données.
 *
 * Lancer : cd backend && npm run seed:rb-complet
 *
 * Comptes (mot de passe : Demo123!) :
 *   SUPER_ADMIN          : admin@tms.com
 *   COMPANY_ADMIN        : logistique@transfood.tn
 *   EXPEDITEUR_ADMIN     : admin@roseblanche.tn
 *   FILIERE_ADMIN MCSR    : admin.mcr@roseblanche.tn
 *   FILIERE_ADMIN AMT    : admin.amt@roseblanche.tn
 *   FILIERE_ADMIN PW     : admin.pw@roseblanche.tn
 *   MAGASINIER MCSR+AMT   : mag1@roseblanche.tn
 *   MAGASINIER PW        : mag2@roseblanche.tn
 *   SECURITE MCSR+AMT     : sec1@roseblanche.tn
 *   SECURITE PW          : sec2@roseblanche.tn
 *   TRANSPORT_ADMIN      : admin@rapidtransport.tn
 *   EXPLOITANT_TRANSPORT : exploit@rapidtransport.tn
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
import { Article } from './articles/article.entity';
import { DeliveryCompany } from './delivery-companies/delivery-company.entity';
import { Truck } from './trucks/truck.entity';
import { Chauffeur } from './chauffeurs/chauffeur.entity';
import { Role } from './common/enums/role.enum';
import { CompanyType } from './common/enums/company-type.enum';
import { BlStatus } from './common/enums/bl-status.enum';
import * as bcrypt from 'bcryptjs';

// ── Helpers ────────────────────────────────────────────────────────────────────

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

function dateStr(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

const TODAY      = dateStr(0);
const YESTERDAY  = dateStr(-1);
const TOMORROW   = dateStr(+1);
const NEXT_WEEK  = dateStr(+7);
const LAST_WEEK  = dateStr(-7);

// ── Bootstrap ─────────────────────────────────────────────────────────────────

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });

  const companyRepo       = app.get<Repository<Company>>(getRepositoryToken(Company));
  const userRepo          = app.get<Repository<User>>(getRepositoryToken(User));
  const societeRepo       = app.get<Repository<SocieteExpeditrice>>(getRepositoryToken(SocieteExpeditrice));
  const filiereRepo       = app.get<Repository<Filiere>>(getRepositoryToken(Filiere));
  const quaiRepo          = app.get<Repository<Quai>>(getRepositoryToken(Quai));
  const blRepo            = app.get<Repository<BonLivraison>>(getRepositoryToken(BonLivraison));
  const planRepo          = app.get<Repository<LoadingPlan>>(getRepositoryToken(LoadingPlan));
  const articleRepo       = app.get<Repository<Article>>(getRepositoryToken(Article));
  const deliveryCoRepo    = app.get<Repository<DeliveryCompany>>(getRepositoryToken(DeliveryCompany));
  const truckRepo         = app.get<Repository<Truck>>(getRepositoryToken(Truck));
  const chauffeurRepo     = app.get<Repository<Chauffeur>>(getRepositoryToken(Chauffeur));

  const PWD = await bcrypt.hash('Demo123!', 10);

  // ════════════════════════════════════════════════════════════════
  // 1. COMPANIES
  // ════════════════════════════════════════════════════════════════
  console.log('\n[1/9] Companies…');

  const transfood = await upsert(companyRepo,
    { code: 'TF' } as any,
    { nom: 'TransFood', type: CompanyType.LOGISTIQUE, couleur: '#1890ff', isActive: true },
  );

  const rbSA = await upsert(companyRepo,
    { code: 'RB' } as any,
    { nom: 'Rose Blanche', type: CompanyType.EXPEDITEUR, couleur: '#eb2f96', isActive: true },
  );


  // Rose Blanche appartient à TransFood
  await companyRepo.update(rbSA.id, { logistiqueCompany: { id: transfood.id } } as any);

  console.log(`  ✓ TransFood   · Rose Blanche   · Rapid Transport SARL`);

  // ════════════════════════════════════════════════════════════════
  // 2. USERS
  // ════════════════════════════════════════════════════════════════
  console.log('\n[2/9] Utilisateurs…');

  const superAdmin = await upsert(userRepo,
    { email: 'admin@tms.com' },
    { prenom: 'Super', nom: 'Admin', password: PWD, role: Role.SUPER_ADMIN, isActive: true, company: transfood },
  );

  const companyAdmin = await upsert(userRepo,
    { email: 'logistique@transfood.tn' },
    { prenom: 'Responsable', nom: 'Logistique', password: PWD, role: Role.LOGISTIC_ADMIN, isActive: true, company: transfood },
  );

  const expediteurAdmin = await upsert(userRepo,
    { email: 'admin@roseblanche.tn' },
    { prenom: 'Admin', nom: 'Rose Blanche', password: PWD, role: Role.EXPEDITEUR_ADMIN, isActive: true, company: rbSA },
  );

  console.log(`  ✓ SUPER_ADMIN · LOGISTIC_ADMIN · EXPEDITEUR_ADMIN`);

  // ════════════════════════════════════════════════════════════════
  // 3. SOCIETE EXPEDITRICE + FILIÈRES + QUAIS
  // ════════════════════════════════════════════════════════════════
  console.log('\n[3/9] Société expéditrice + filières + quais…');

  // SocieteExpeditrice
  const societe = await upsert(societeRepo,
    { nom: 'Rose Blanche' },
    {
      code: 'RB',
      couleur: '#eb2f96',
      company: transfood,
      expediteurCompany: rbSA,
    },
  );

  // Filières MCSR / AMT / PW
  const filMCR = await upsert(filiereRepo,
    { code: 'MCSR' },
    { nom: 'Matières Crèmeries', societeExpeditrice: societe },
  );

  const filAMT = await upsert(filiereRepo,
    { code: 'AMT' },
    { nom: 'AMT', societeExpeditrice: societe },
  );

  const filPW = await upsert(filiereRepo,
    { code: 'PW' },
    { nom: 'Pate Warda', societeExpeditrice: societe },
  );

  console.log(`  ✓ Filières : MCSR · AMT · PW`);

  // FILIERE_ADMIN (1 par filière)
  const faAdminMCR = await upsert(userRepo,
    { email: 'admin.mcr@roseblanche.tn' },
    { prenom: 'Admin', nom: 'MCSR', password: PWD, role: Role.FILIERE_ADMIN, isActive: true, company: rbSA, filieres: [filMCR] },
  );
  const faAdminAMT = await upsert(userRepo,
    { email: 'admin.amt@roseblanche.tn' },
    { prenom: 'Admin', nom: 'AMT', password: PWD, role: Role.FILIERE_ADMIN, isActive: true, company: rbSA, filieres: [filAMT] },
  );
  const faAdminPW = await upsert(userRepo,
    { email: 'admin.pw@roseblanche.tn' },
    { prenom: 'Admin', nom: 'PW', password: PWD, role: Role.FILIERE_ADMIN, isActive: true, company: rbSA, filieres: [filPW] },
  );

  // MAGASINIERS
  const mag1 = await upsert(userRepo,
    { email: 'mag1@roseblanche.tn' },
    { prenom: 'Magasinier', nom: 'MCSR-AMT', password: PWD, role: Role.MAGASINIER, isActive: true, company: rbSA, filieres: [filMCR, filAMT] },
  );
  const mag2 = await upsert(userRepo,
    { email: 'mag2@roseblanche.tn' },
    { prenom: 'Magasinier', nom: 'PW', password: PWD, role: Role.MAGASINIER, isActive: true, company: rbSA, filieres: [filPW] },
  );

  // SÉCURITÉ
  const sec1 = await upsert(userRepo,
    { email: 'sec1@roseblanche.tn' },
    { prenom: 'Agent', nom: 'Sécurité MCSR-AMT', password: PWD, role: Role.SECURITE, isActive: true, company: rbSA, filieres: [filMCR, filAMT] },
  );
  const sec2 = await upsert(userRepo,
    { email: 'sec2@roseblanche.tn' },
    { prenom: 'Agent', nom: 'Sécurité PW', password: PWD, role: Role.SECURITE, isActive: true, company: rbSA, filieres: [filPW] },
  );

  console.log(`  ✓ 3× FILIERE_ADMIN · 2× MAGASINIER · 2× SECURITE`);

  // Quais — 3 MCSR, 3 AMT, 2 PW
  const quais: Quai[] = [];
  const quaiDefs = [
    { nom: 'Q-MCSR-1', filiere: filMCR }, { nom: 'Q-MCSR-2', filiere: filMCR }, { nom: 'Q-MCSR-3', filiere: filMCR },
    { nom: 'Q-AMT-1', filiere: filAMT }, { nom: 'Q-AMT-2', filiere: filAMT }, { nom: 'Q-AMT-3', filiere: filAMT },
    { nom: 'Q-PW-1',  filiere: filPW  }, { nom: 'Q-PW-2',  filiere: filPW  },
  ];
  for (const qd of quaiDefs) {
    const q = await upsert(quaiRepo,
      { nom: qd.nom, societeExpeditrice: societe } as any,
      { filiere: qd.filiere, isActive: true, company: null } as any,
    );
    quais.push(q);
  }
  console.log(`  ✓ 8 quais (Q-MCSR-1..3 · Q-AMT-1..3 · Q-PW-1..2)`);

  // ════════════════════════════════════════════════════════════════
  // 4. DELIVERY COMPANY + CAMIONS + CHAUFFEURS
  // ════════════════════════════════════════════════════════════════
  console.log('\n[4/9] Transport…');

  const dc = await upsert(deliveryCoRepo,
    { nom: 'Rapid Transport SARL' },
    { adresse: 'Zone Industrielle Charguia, Tunis', telephone: '+216 71 800 200', isActive: true, company: transfood },
  );

  const truckDefs = [
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
  ];
  const trucks: Truck[] = [];
  for (const td of truckDefs) {
    const t = await upsert(truckRepo,
      { matricule: td.matricule },
      { capaciteTonnage: td.capaciteTonnage, capacitePalettes: td.capacitePalettes, type: td.type, isActive: true, deliveryCompany: dc },
    );
    trucks.push(t);
  }

  const chauffeurDefs = [
    { nom: 'Ben Ali',    prenom: 'Khaled',   cin: '12345678', telephone: '+216 20 111 001', permis: 'C' },
    { nom: 'Trabelsi',   prenom: 'Sami',     cin: '23456789', telephone: '+216 20 111 002', permis: 'C+E' },
    { nom: 'Mansouri',   prenom: 'Farouk',   cin: '34567890', telephone: '+216 20 111 003', permis: 'C' },
    { nom: 'Boughzala',  prenom: 'Mehdi',    cin: '45678901', telephone: '+216 20 111 004', permis: 'CE' },
    { nom: 'Jelassi',    prenom: 'Amine',    cin: '56789012', telephone: '+216 20 111 005', permis: 'C' },
    { nom: 'Chaabane',   prenom: 'Riadh',    cin: '67890123', telephone: '+216 20 111 006', permis: 'C+E' },
    { nom: 'Khedher',    prenom: 'Walid',    cin: '78901234', telephone: '+216 20 111 007', permis: 'C' },
    { nom: 'Zouaghi',    prenom: 'Nabil',    cin: '89012345', telephone: '+216 20 111 008', permis: 'CE' },
    { nom: 'Hamdi',      prenom: 'Slim',     cin: '90123456', telephone: '+216 20 111 009', permis: 'C' },
    { nom: 'Baccouche',  prenom: 'Tarek',    cin: '01234567', telephone: '+216 20 111 010', permis: 'C+E' },
  ];
  for (const cd of chauffeurDefs) {
    await upsert(chauffeurRepo,
      { cin: cd.cin },
      { nom: cd.nom, prenom: cd.prenom, telephone: cd.telephone, permis: cd.permis, isActive: true, deliveryCompany: dc },
    );
  }
  console.log(`  ✓ 12 camions · 10 chauffeurs`);

  // ════════════════════════════════════════════════════════════════
  // 5. ARTICLES
  // ════════════════════════════════════════════════════════════════
  console.log('\n[5/9] Articles…');
  const articleDefs = [
    // MCSR
    { code: 'MCSR-FRB-001', libelle: 'Fromage blanc 500g',   poidsUnitaire: 0.500, unite: 'pièce' },
    { code: 'MCSR-BEU-001', libelle: 'Beurre doux 250g',     poidsUnitaire: 0.250, unite: 'pièce' },
    { code: 'MCSR-CRE-001', libelle: 'Crème fraîche 1L',     poidsUnitaire: 1.000, unite: 'litre' },
    { code: 'MCSR-LAC-001', libelle: 'Lait concentré 400g',  poidsUnitaire: 0.400, unite: 'boîte' },
    // AMT
    { code: 'AMT-SEM-001', libelle: 'Semoule fine 5kg',     poidsUnitaire: 5.000, unite: 'sac' },
    { code: 'AMT-FAR-001', libelle: 'Farine type 55 50kg',  poidsUnitaire: 50.00, unite: 'sac' },
    { code: 'AMT-HUI-001', libelle: 'Huile tournesol 5L',   poidsUnitaire: 4.500, unite: 'bidon' },
    { code: 'AMT-SUC-001', libelle: 'Sucre blanc 50kg',     poidsUnitaire: 50.00, unite: 'sac' },
    // PW
    { code: 'PW-PAT-001',  libelle: 'Pâtes Warda courte 1kg',   poidsUnitaire: 1.000, unite: 'paquet' },
    { code: 'PW-PAT-002',  libelle: 'Pâtes Warda longue 1kg',   poidsUnitaire: 1.000, unite: 'paquet' },
    { code: 'PW-CUS-001',  libelle: 'Couscous fin 1kg',         poidsUnitaire: 1.000, unite: 'paquet' },
    { code: 'PW-CUS-002',  libelle: 'Couscous moyen 1kg',       poidsUnitaire: 1.000, unite: 'paquet' },
  ];
  for (const ad of articleDefs) {
    await upsert(articleRepo, { code: ad.code }, { libelle: ad.libelle, poidsUnitaire: ad.poidsUnitaire, unite: ad.unite });
  }
  console.log(`  ✓ 12 articles`);

  // ════════════════════════════════════════════════════════════════
  // 6. PLANS DE CHARGEMENT (18)
  // ════════════════════════════════════════════════════════════════
  console.log('\n[6/9] Plans de chargement…');

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
  };

  const planDefs: PlanDef[] = [
    // ── TODAY · IDLE (camion non encore arrivé) ──────────────────
    { ref: 'PL-RB-001', date: TODAY, truck: trucks[0],  isValidated: true, loadingStatus: 'WAITING', entryStatus: 'IDLE',    heureArrivee: '08:00', tonnageCharge: 0 },
    { ref: 'PL-RB-002', date: TODAY, truck: trucks[1],  isValidated: true, loadingStatus: 'WAITING', entryStatus: 'IDLE',    heureArrivee: '08:30', tonnageCharge: 0 },
    { ref: 'PL-RB-003', date: TODAY, truck: trucks[2],  isValidated: true, loadingStatus: 'WAITING', entryStatus: 'IDLE',    heureArrivee: '09:00', tonnageCharge: 0 },
    // ── TODAY · CALLED (appelé à la barrière) ────────────────────
    { ref: 'PL-RB-004', date: TODAY, truck: trucks[3],  isValidated: true, loadingStatus: 'WAITING', entryStatus: 'CALLED',  heureArrivee: '07:30', quai: 'Q-MCSR-1', tonnageCharge: 0 },
    { ref: 'PL-RB-005', date: TODAY, truck: trucks[4],  isValidated: true, loadingStatus: 'WAITING', entryStatus: 'CALLED',  heureArrivee: '07:45', quai: 'Q-AMT-1', tonnageCharge: 0 },
    // ── TODAY · ENTERED · IN_PROGRESS (en cours de chargement) ──
    { ref: 'PL-RB-006', date: TODAY, truck: trucks[5],  isValidated: true, loadingStatus: 'IN_PROGRESS', entryStatus: 'ENTERED', heureArrivee: '06:00', quai: 'Q-MCSR-2', tonnageCharge: 32.5 },
    { ref: 'PL-RB-007', date: TODAY, truck: trucks[6],  isValidated: true, loadingStatus: 'IN_PROGRESS', entryStatus: 'ENTERED', heureArrivee: '06:30', quai: 'Q-AMT-2', tonnageCharge: 21.0 },
    // ── TODAY · ENTERED · PAUSED (chargement en pause) ──────────
    { ref: 'PL-RB-008', date: TODAY, truck: trucks[7],  isValidated: true, loadingStatus: 'PAUSED',      entryStatus: 'ENTERED', heureArrivee: '05:30', quai: 'Q-PW-1',  tonnageCharge: 18.0 },
    // ── TODAY · EXITED · DONE (terminé — sorti) ─────────────────
    { ref: 'PL-RB-009', date: TODAY, truck: trucks[8],  isValidated: true, loadingStatus: 'DONE', entryStatus: 'EXITED', heureArrivee: '04:00', quai: 'Q-MCSR-3', tonnageCharge: 45.0 },
    { ref: 'PL-RB-010', date: TODAY, truck: trucks[9],  isValidated: true, loadingStatus: 'DONE', entryStatus: 'EXITED', heureArrivee: '04:30', quai: 'Q-AMT-3', tonnageCharge: 38.5 },
    // ── YESTERDAY · tous DONE/EXITED ────────────────────────────
    { ref: 'PL-RB-011', date: YESTERDAY, truck: trucks[10], isValidated: true, loadingStatus: 'DONE', entryStatus: 'EXITED', heureArrivee: '06:00', quai: 'Q-MCSR-1', tonnageCharge: 42.0 },
    { ref: 'PL-RB-012', date: YESTERDAY, truck: trucks[11], isValidated: true, loadingStatus: 'DONE', entryStatus: 'EXITED', heureArrivee: '07:00', quai: 'Q-AMT-1', tonnageCharge: 36.0 },
    { ref: 'PL-RB-013', date: YESTERDAY, truck: trucks[0],  isValidated: true, loadingStatus: 'DONE', entryStatus: 'EXITED', heureArrivee: '08:00', quai: 'Q-PW-1',  tonnageCharge: 28.0 },
    { ref: 'PL-RB-014', date: YESTERDAY, truck: trucks[1],  isValidated: true, loadingStatus: 'DONE', entryStatus: 'EXITED', heureArrivee: '09:00', quai: 'Q-MCSR-2', tonnageCharge: 50.0 },
    { ref: 'PL-RB-015', date: YESTERDAY, truck: trucks[2],  isValidated: true, loadingStatus: 'DONE', entryStatus: 'EXITED', heureArrivee: '10:00', quai: 'Q-AMT-2', tonnageCharge: 44.0 },
    // ── TOMORROW · IDLE (planifié pour demain) ───────────────────
    { ref: 'PL-RB-016', date: TOMORROW, truck: trucks[3],  isValidated: true, loadingStatus: 'WAITING', entryStatus: 'IDLE', heureArrivee: '07:00', tonnageCharge: 0 },
    { ref: 'PL-RB-017', date: TOMORROW, truck: trucks[4],  isValidated: true, loadingStatus: 'WAITING', entryStatus: 'IDLE', heureArrivee: '08:00', tonnageCharge: 0 },
    { ref: 'PL-RB-018', date: TOMORROW, truck: trucks[5],  isValidated: true, loadingStatus: 'WAITING', entryStatus: 'IDLE', heureArrivee: '09:00', tonnageCharge: 0 },
  ];

  const plans: Record<string, LoadingPlan> = {};
  for (const pd of planDefs) {
    const plan = await upsert(planRepo,
      { reference: pd.ref } as any,
      {
        dateLivraison:       pd.date as any,
        isValidated:         pd.isValidated,
        loadingStatus:       pd.loadingStatus,
        entryStatus:         pd.entryStatus,
        heureArrivee:        pd.heureArrivee ?? null,
        quai:                pd.quai ?? null,
        tonnageCharge:       pd.tonnageCharge ?? 0,
        palettesChargees:    0,
        truck:               pd.truck,
        validatedBy:         companyAdmin,
        logistiqueCompanyId: transfood.id,
        signature:           pd.isValidated ? 'sig_demo' : null,
      } as any,
    );
    plans[pd.ref] = plan;
  }
  console.log(`  ✓ 18 plans (3 IDLE · 2 CALLED · 2 IN_PROGRESS · 1 PAUSED · 2 DONE/today · 5 DONE/hier · 3 IDLE/demain)`);

  // ════════════════════════════════════════════════════════════════
  // 7. BONS DE LIVRAISON (53)
  // ════════════════════════════════════════════════════════════════
  console.log('\n[7/9] Bons de livraison…');

  type BlDef = {
    numeroBl: string;
    clientNom: string;
    destination: string;
    origine?: string;
    tonnageTotal: number;
    nombrePalettes?: number;
    typeChargement: TypeChargement;
    statut: BlStatus;
    datelivraison: string;
    filiere: Filiere;
    ordreChargement?: number;
    plan?: LoadingPlan;
    notes?: string;
  };

  const blDefs: BlDef[] = [
    // ══════════════════════════════════════════════════════════════
    // TODAY — Plan PL-RB-001 (IDLE/WAITING) — 3 BLs VALIDATED
    // ══════════════════════════════════════════════════════════════
    { numeroBl: 'BL-MCSR-T001', clientNom: 'SAPD Distribution',          destination: 'Tunis',        origine: 'Béja', tonnageTotal: 12.0, typeChargement: TypeChargement.FRIGO,   statut: BlStatus.VALIDATED, datelivraison: TODAY, filiere: filMCR, ordreChargement: 1, plan: plans['PL-RB-001'] },
    { numeroBl: 'BL-AMT-T001', clientNom: 'Cotupha  ',                 destination: 'Sousse',       origine: 'Béja', tonnageTotal: 18.0, typeChargement: TypeChargement.VRAC,    statut: BlStatus.VALIDATED, datelivraison: TODAY, filiere: filAMT, ordreChargement: 2, plan: plans['PL-RB-001'] },
    { numeroBl: 'BL-PW-T001',  clientNom: 'Maghrébine Aliments',        destination: 'Sfax',         origine: 'Béja', tonnageTotal: 15.0, typeChargement: TypeChargement.PALETTE, statut: BlStatus.VALIDATED, datelivraison: TODAY, filiere: filPW,  ordreChargement: 3, plan: plans['PL-RB-001'] },

    // TODAY — Plan PL-RB-002 (IDLE/WAITING) — 3 BLs VALIDATED
    { numeroBl: 'BL-MCSR-T002', clientNom: 'Grande Distribution Sud',    destination: 'Gabes',        origine: 'Béja', tonnageTotal: 8.5,  typeChargement: TypeChargement.FRIGO,   statut: BlStatus.VALIDATED, datelivraison: TODAY, filiere: filMCR, ordreChargement: 1, plan: plans['PL-RB-002'] },
    { numeroBl: 'BL-AMT-T002', clientNom: 'Société Nabeulienne',        destination: 'Nabeul',       origine: 'Béja', tonnageTotal: 24.0, typeChargement: TypeChargement.VRAC,    statut: BlStatus.VALIDATED, datelivraison: TODAY, filiere: filAMT, ordreChargement: 2, plan: plans['PL-RB-002'] },
    { numeroBl: 'BL-PW-T002',  clientNom: 'Distributeur Côtier',        destination: 'Bizerte',      origine: 'Béja', tonnageTotal: 20.0, typeChargement: TypeChargement.PALETTE, statut: BlStatus.VALIDATED, datelivraison: TODAY, filiere: filPW,  ordreChargement: 3, plan: plans['PL-RB-002'] },

    // TODAY — Plan PL-RB-003 (IDLE/WAITING) — 2 BLs VALIDATED
    { numeroBl: 'BL-MCSR-T003', clientNom: 'Monastir Trade',             destination: 'Monastir',     origine: 'Béja', tonnageTotal: 15.0, typeChargement: TypeChargement.FRIGO,   statut: BlStatus.VALIDATED, datelivraison: TODAY, filiere: filMCR, ordreChargement: 1, plan: plans['PL-RB-003'] },
    { numeroBl: 'BL-AMT-T003', clientNom: 'Kairouan Distribution',      destination: 'Kairouan',     origine: 'Béja', tonnageTotal: 22.0, typeChargement: TypeChargement.CITERNE, statut: BlStatus.VALIDATED, datelivraison: TODAY, filiere: filAMT, ordreChargement: 2, plan: plans['PL-RB-003'] },

    // TODAY — Plan PL-RB-004 (CALLED) — 2 BLs LOADED
    { numeroBl: 'BL-MCSR-T004', clientNom: 'Sud Alimentaire',            destination: 'Gafsa',        origine: 'Béja', tonnageTotal: 10.0, typeChargement: TypeChargement.FRIGO,   statut: BlStatus.LOADED, datelivraison: TODAY, filiere: filMCR, ordreChargement: 1, plan: plans['PL-RB-004'] },
    { numeroBl: 'BL-AMT-T004', clientNom: 'Béja Négoce',               destination: 'Béja',         origine: 'Béja', tonnageTotal: 28.0, typeChargement: TypeChargement.VRAC,    statut: BlStatus.LOADED, datelivraison: TODAY, filiere: filAMT, ordreChargement: 2, plan: plans['PL-RB-004'] },

    // TODAY — Plan PL-RB-005 (CALLED) — 2 BLs LOADED
    { numeroBl: 'BL-PW-T003',  clientNom: 'SAPD Distribution',          destination: 'Tunis',        origine: 'Béja', tonnageTotal: 22.0, typeChargement: TypeChargement.PALETTE, statut: BlStatus.LOADED, datelivraison: TODAY, filiere: filPW,  ordreChargement: 1, plan: plans['PL-RB-005'] },
    { numeroBl: 'BL-AMT-T005', clientNom: 'Cotupha  ',                 destination: 'Sousse',       origine: 'Béja', tonnageTotal: 26.0, typeChargement: TypeChargement.VRAC,    statut: BlStatus.LOADED, datelivraison: TODAY, filiere: filAMT, ordreChargement: 2, plan: plans['PL-RB-005'] },

    // TODAY — Plan PL-RB-006 (ENTERED/IN_PROGRESS) — 3 BLs LOADED
    { numeroBl: 'BL-MCSR-T005', clientNom: 'Maghrébine Aliments',        destination: 'Sfax',         origine: 'Béja', tonnageTotal: 20.0, typeChargement: TypeChargement.FRIGO,   statut: BlStatus.LOADED, datelivraison: TODAY, filiere: filMCR, ordreChargement: 1, plan: plans['PL-RB-006'] },
    { numeroBl: 'BL-AMT-T006', clientNom: 'Grande Distribution Sud',    destination: 'Gabes',        origine: 'Béja', tonnageTotal: 18.0, typeChargement: TypeChargement.CITERNE, statut: BlStatus.LOADED, datelivraison: TODAY, filiere: filAMT, ordreChargement: 2, plan: plans['PL-RB-006'] },
    { numeroBl: 'BL-PW-T004',  clientNom: 'Société Nabeulienne',        destination: 'Nabeul',       origine: 'Béja', tonnageTotal: 15.0, typeChargement: TypeChargement.VRAC,    statut: BlStatus.LOADED, datelivraison: TODAY, filiere: filPW,  ordreChargement: 3, plan: plans['PL-RB-006'] },

    // TODAY — Plan PL-RB-007 (ENTERED/IN_PROGRESS) — 2 BLs LOADED
    { numeroBl: 'BL-MCSR-T006', clientNom: 'Distributeur Côtier',        destination: 'Bizerte',      origine: 'Béja', tonnageTotal: 12.0, typeChargement: TypeChargement.PALETTE, statut: BlStatus.LOADED, datelivraison: TODAY, filiere: filMCR, ordreChargement: 1, plan: plans['PL-RB-007'] },
    { numeroBl: 'BL-PW-T005',  clientNom: 'Monastir Trade',             destination: 'Monastir',     origine: 'Béja', tonnageTotal: 16.0, typeChargement: TypeChargement.PALETTE, statut: BlStatus.LOADED, datelivraison: TODAY, filiere: filPW,  ordreChargement: 2, plan: plans['PL-RB-007'] },

    // TODAY — Plan PL-RB-008 (ENTERED/PAUSED) — 2 BLs LOADED
    { numeroBl: 'BL-AMT-T007', clientNom: 'Kairouan Distribution',      destination: 'Kairouan',     origine: 'Béja', tonnageTotal: 20.0, typeChargement: TypeChargement.VRAC,    statut: BlStatus.LOADED, datelivraison: TODAY, filiere: filAMT, ordreChargement: 1, plan: plans['PL-RB-008'] },
    { numeroBl: 'BL-MCSR-T007', clientNom: 'Sud Alimentaire',            destination: 'Gafsa',        origine: 'Béja', tonnageTotal: 9.0,  typeChargement: TypeChargement.FRIGO,   statut: BlStatus.LOADED, datelivraison: TODAY, filiere: filMCR, ordreChargement: 2, plan: plans['PL-RB-008'] },

    // TODAY — Plan PL-RB-009 (EXITED/DONE) — 3 BLs DELIVERED
    { numeroBl: 'BL-MCSR-T008', clientNom: 'Béja Négoce',               destination: 'Béja',         origine: 'Béja', tonnageTotal: 14.0, typeChargement: TypeChargement.FRIGO,   statut: BlStatus.DELIVERED, datelivraison: TODAY, filiere: filMCR, ordreChargement: 1, plan: plans['PL-RB-009'] },
    { numeroBl: 'BL-AMT-T008', clientNom: 'SAPD Distribution',          destination: 'Tunis',        origine: 'Béja', tonnageTotal: 22.0, typeChargement: TypeChargement.VRAC,    statut: BlStatus.DELIVERED, datelivraison: TODAY, filiere: filAMT, ordreChargement: 2, plan: plans['PL-RB-009'] },
    { numeroBl: 'BL-PW-T006',  clientNom: 'Cotupha  ',                 destination: 'Sousse',       origine: 'Béja', tonnageTotal: 16.0, typeChargement: TypeChargement.PALETTE, statut: BlStatus.DELIVERED, datelivraison: TODAY, filiere: filPW,  ordreChargement: 3, plan: plans['PL-RB-009'] },

    // TODAY — Plan PL-RB-010 (EXITED/DONE) — 3 BLs DELIVERED
    { numeroBl: 'BL-MCSR-T009', clientNom: 'Maghrébine Aliments',        destination: 'Sfax',         origine: 'Béja', tonnageTotal: 18.0, typeChargement: TypeChargement.FRIGO,   statut: BlStatus.DELIVERED, datelivraison: TODAY, filiere: filMCR, ordreChargement: 1, plan: plans['PL-RB-010'] },
    { numeroBl: 'BL-PW-T007',  clientNom: 'Grande Distribution Sud',    destination: 'Gabes',        origine: 'Béja', tonnageTotal: 19.0, typeChargement: TypeChargement.VRAC,    statut: BlStatus.DELIVERED, datelivraison: TODAY, filiere: filPW,  ordreChargement: 2, plan: plans['PL-RB-010'] },
    { numeroBl: 'BL-AMT-T009', clientNom: 'Société Nabeulienne',        destination: 'Nabeul',       origine: 'Béja', tonnageTotal: 12.0, typeChargement: TypeChargement.CITERNE, statut: BlStatus.DELIVERED, datelivraison: TODAY, filiere: filAMT, ordreChargement: 3, plan: plans['PL-RB-010'] },

    // TODAY — Sans plan (DRAFT / VALIDATED en attente de planification)
    { numeroBl: 'BL-MCSR-T010', clientNom: 'Distributeur Côtier',        destination: 'Bizerte',      origine: 'Béja', tonnageTotal: 9.5,  typeChargement: TypeChargement.FRIGO,   statut: BlStatus.DRAFT,     datelivraison: TODAY, filiere: filMCR, notes: 'En attente de validation BL' },
    { numeroBl: 'BL-AMT-T010', clientNom: 'Monastir Trade',             destination: 'Monastir',     origine: 'Béja', tonnageTotal: 16.0, typeChargement: TypeChargement.PALETTE, statut: BlStatus.DRAFT,     datelivraison: TODAY, filiere: filAMT, notes: 'Commande urgente — à valider' },
    { numeroBl: 'BL-PW-T008',  clientNom: 'Sud Alimentaire',            destination: 'Gafsa',        origine: 'Béja', tonnageTotal: 14.0, typeChargement: TypeChargement.VRAC,    statut: BlStatus.DRAFT,     datelivraison: TODAY, filiere: filPW,  notes: 'BL créé manuellement' },
    { numeroBl: 'BL-MCSR-T011', clientNom: 'Kairouan Distribution',      destination: 'Kairouan',     origine: 'Béja', tonnageTotal: 11.0, typeChargement: TypeChargement.FRIGO,   statut: BlStatus.VALIDATED, datelivraison: TODAY, filiere: filMCR, notes: 'Validé — sans plan encore' },
    { numeroBl: 'BL-AMT-T011', clientNom: 'Béja Négoce',               destination: 'Béja',         origine: 'Béja', tonnageTotal: 30.0, typeChargement: TypeChargement.VRAC,    statut: BlStatus.VALIDATED, datelivraison: TODAY, filiere: filAMT, notes: 'Validé — sans plan encore' },

    // ══════════════════════════════════════════════════════════════
    // YESTERDAY — Plans PL-RB-011..015 (DONE/EXITED) — 10 BLs DELIVERED
    // ══════════════════════════════════════════════════════════════
    { numeroBl: 'BL-MCSR-Y001', clientNom: 'SAPD Distribution',          destination: 'Tunis',        origine: 'Béja', tonnageTotal: 16.0, typeChargement: TypeChargement.FRIGO,   statut: BlStatus.DELIVERED, datelivraison: YESTERDAY, filiere: filMCR, ordreChargement: 1, plan: plans['PL-RB-011'] },
    { numeroBl: 'BL-AMT-Y001', clientNom: 'Cotupha  ',                 destination: 'Sousse',       origine: 'Béja', tonnageTotal: 26.0, typeChargement: TypeChargement.VRAC,    statut: BlStatus.DELIVERED, datelivraison: YESTERDAY, filiere: filAMT, ordreChargement: 2, plan: plans['PL-RB-011'] },
    { numeroBl: 'BL-PW-Y001',  clientNom: 'Maghrébine Aliments',        destination: 'Sfax',         origine: 'Béja', tonnageTotal: 18.0, typeChargement: TypeChargement.PALETTE, statut: BlStatus.DELIVERED, datelivraison: YESTERDAY, filiere: filPW,  ordreChargement: 3, plan: plans['PL-RB-011'] },
    { numeroBl: 'BL-MCSR-Y002', clientNom: 'Grande Distribution Sud',    destination: 'Gabes',        origine: 'Béja', tonnageTotal: 12.0, typeChargement: TypeChargement.FRIGO,   statut: BlStatus.DELIVERED, datelivraison: YESTERDAY, filiere: filMCR, ordreChargement: 1, plan: plans['PL-RB-012'] },
    { numeroBl: 'BL-AMT-Y002', clientNom: 'Société Nabeulienne',        destination: 'Nabeul',       origine: 'Béja', tonnageTotal: 24.0, typeChargement: TypeChargement.CITERNE, statut: BlStatus.DELIVERED, datelivraison: YESTERDAY, filiere: filAMT, ordreChargement: 2, plan: plans['PL-RB-012'] },
    { numeroBl: 'BL-MCSR-Y003', clientNom: 'Distributeur Côtier',        destination: 'Bizerte',      origine: 'Béja', tonnageTotal: 10.0, typeChargement: TypeChargement.FRIGO,   statut: BlStatus.DELIVERED, datelivraison: YESTERDAY, filiere: filMCR, ordreChargement: 1, plan: plans['PL-RB-013'] },
    { numeroBl: 'BL-PW-Y002',  clientNom: 'Monastir Trade',             destination: 'Monastir',     origine: 'Béja', tonnageTotal: 18.0, typeChargement: TypeChargement.PALETTE, statut: BlStatus.DELIVERED, datelivraison: YESTERDAY, filiere: filPW,  ordreChargement: 2, plan: plans['PL-RB-013'] },
    { numeroBl: 'BL-AMT-Y003', clientNom: 'Kairouan Distribution',      destination: 'Kairouan',     origine: 'Béja', tonnageTotal: 28.0, typeChargement: TypeChargement.VRAC,    statut: BlStatus.DELIVERED, datelivraison: YESTERDAY, filiere: filAMT, ordreChargement: 1, plan: plans['PL-RB-014'] },
    { numeroBl: 'BL-PW-Y003',  clientNom: 'Sud Alimentaire',            destination: 'Gafsa',        origine: 'Béja', tonnageTotal: 22.0, typeChargement: TypeChargement.VRAC,    statut: BlStatus.DELIVERED, datelivraison: YESTERDAY, filiere: filPW,  ordreChargement: 2, plan: plans['PL-RB-014'] },
    { numeroBl: 'BL-AMT-Y004', clientNom: 'Béja Négoce',               destination: 'Béja',         origine: 'Béja', tonnageTotal: 44.0, typeChargement: TypeChargement.VRAC,    statut: BlStatus.DELIVERED, datelivraison: YESTERDAY, filiere: filAMT, ordreChargement: 1, plan: plans['PL-RB-015'] },

    // ══════════════════════════════════════════════════════════════
    // TOMORROW — Plans PL-RB-016..018 (IDLE) — 8 BLs VALIDATED + DRAFT
    // ══════════════════════════════════════════════════════════════
    { numeroBl: 'BL-MCSR-TM01', clientNom: 'SAPD Distribution',          destination: 'Tunis',        origine: 'Béja', tonnageTotal: 14.0, typeChargement: TypeChargement.FRIGO,   statut: BlStatus.VALIDATED, datelivraison: TOMORROW, filiere: filMCR, ordreChargement: 1, plan: plans['PL-RB-016'] },
    { numeroBl: 'BL-AMT-TM01', clientNom: 'Cotupha  ',                 destination: 'Sousse',       origine: 'Béja', tonnageTotal: 20.0, typeChargement: TypeChargement.VRAC,    statut: BlStatus.VALIDATED, datelivraison: TOMORROW, filiere: filAMT, ordreChargement: 2, plan: plans['PL-RB-016'] },
    { numeroBl: 'BL-MCSR-TM02', clientNom: 'Maghrébine Aliments',        destination: 'Sfax',         origine: 'Béja', tonnageTotal: 11.0, typeChargement: TypeChargement.FRIGO,   statut: BlStatus.VALIDATED, datelivraison: TOMORROW, filiere: filMCR, ordreChargement: 1, plan: plans['PL-RB-017'] },
    { numeroBl: 'BL-AMT-TM02', clientNom: 'Grande Distribution Sud',    destination: 'Gabes',        origine: 'Béja', tonnageTotal: 25.0, typeChargement: TypeChargement.CITERNE, statut: BlStatus.VALIDATED, datelivraison: TOMORROW, filiere: filAMT, ordreChargement: 2, plan: plans['PL-RB-017'] },
    { numeroBl: 'BL-PW-TM01',  clientNom: 'Société Nabeulienne',        destination: 'Nabeul',       origine: 'Béja', tonnageTotal: 18.0, typeChargement: TypeChargement.PALETTE, statut: BlStatus.VALIDATED, datelivraison: TOMORROW, filiere: filPW,  ordreChargement: 3, plan: plans['PL-RB-017'] },
    { numeroBl: 'BL-AMT-TM03', clientNom: 'Distributeur Côtier',        destination: 'Bizerte',      origine: 'Béja', tonnageTotal: 22.0, typeChargement: TypeChargement.VRAC,    statut: BlStatus.VALIDATED, datelivraison: TOMORROW, filiere: filAMT, ordreChargement: 1, plan: plans['PL-RB-018'] },
    // TOMORROW sans plan (DRAFT)
    { numeroBl: 'BL-MCSR-TM03', clientNom: 'Monastir Trade',             destination: 'Monastir',     origine: 'Béja', tonnageTotal: 13.0, typeChargement: TypeChargement.FRIGO,   statut: BlStatus.DRAFT, datelivraison: TOMORROW, filiere: filMCR, notes: 'BL demain — pas encore planifié' },
    { numeroBl: 'BL-PW-TM02',  clientNom: 'Kairouan Distribution',      destination: 'Kairouan',     origine: 'Béja', tonnageTotal: 17.0, typeChargement: TypeChargement.PALETTE, statut: BlStatus.DRAFT, datelivraison: TOMORROW, filiere: filPW,  notes: 'BL demain — en cours de validation' },

    // ══════════════════════════════════════════════════════════════
    // NEXT WEEK — 5 BLs DRAFT (pré-commandes)
    // ══════════════════════════════════════════════════════════════
    { numeroBl: 'BL-MCSR-NW01', clientNom: 'SAPD Distribution',          destination: 'Tunis',        origine: 'Béja', tonnageTotal: 20.0, typeChargement: TypeChargement.FRIGO,   statut: BlStatus.DRAFT, datelivraison: NEXT_WEEK, filiere: filMCR, notes: 'Pré-commande semaine prochaine' },
    { numeroBl: 'BL-AMT-NW01', clientNom: 'Cotupha  ',                 destination: 'Sousse',       origine: 'Béja', tonnageTotal: 30.0, typeChargement: TypeChargement.VRAC,    statut: BlStatus.DRAFT, datelivraison: NEXT_WEEK, filiere: filAMT, notes: 'Pré-commande semaine prochaine' },
    { numeroBl: 'BL-PW-NW01',  clientNom: 'Maghrébine Aliments',        destination: 'Sfax',         origine: 'Béja', tonnageTotal: 24.0, typeChargement: TypeChargement.PALETTE, statut: BlStatus.DRAFT, datelivraison: NEXT_WEEK, filiere: filPW,  notes: 'Pré-commande semaine prochaine' },
    { numeroBl: 'BL-AMT-NW02', clientNom: 'Grande Distribution Sud',    destination: 'Gabes',        origine: 'Béja', tonnageTotal: 28.0, typeChargement: TypeChargement.CITERNE, statut: BlStatus.DRAFT, datelivraison: NEXT_WEEK, filiere: filAMT, notes: 'Pré-commande semaine prochaine' },
    { numeroBl: 'BL-PW-NW02',  clientNom: 'Société Nabeulienne',        destination: 'Nabeul',       origine: 'Béja', tonnageTotal: 18.0, typeChargement: TypeChargement.VRAC,    statut: BlStatus.DRAFT, datelivraison: NEXT_WEEK, filiere: filPW,  notes: 'Pré-commande semaine prochaine' },

    // ══════════════════════════════════════════════════════════════
    // LAST WEEK — 4 BLs DELIVERED (historique)
    // ══════════════════════════════════════════════════════════════
    { numeroBl: 'BL-MCSR-LW01', clientNom: 'Distributeur Côtier',        destination: 'Bizerte',      origine: 'Béja', tonnageTotal: 15.0, typeChargement: TypeChargement.FRIGO,   statut: BlStatus.DELIVERED, datelivraison: LAST_WEEK, filiere: filMCR },
    { numeroBl: 'BL-AMT-LW01', clientNom: 'Monastir Trade',             destination: 'Monastir',     origine: 'Béja', tonnageTotal: 28.0, typeChargement: TypeChargement.VRAC,    statut: BlStatus.DELIVERED, datelivraison: LAST_WEEK, filiere: filAMT },
    { numeroBl: 'BL-PW-LW01',  clientNom: 'Kairouan Distribution',      destination: 'Kairouan',     origine: 'Béja', tonnageTotal: 22.0, typeChargement: TypeChargement.PALETTE, statut: BlStatus.DELIVERED, datelivraison: LAST_WEEK, filiere: filPW },
    { numeroBl: 'BL-AMT-LW02', clientNom: 'Sud Alimentaire',            destination: 'Gafsa',        origine: 'Béja', tonnageTotal: 36.0, typeChargement: TypeChargement.VRAC,    statut: BlStatus.DELIVERED, datelivraison: LAST_WEEK, filiere: filAMT },
  ];

  let blCount = 0;
  for (const bd of blDefs) {
    await upsert(blRepo,
      { numeroBl: bd.numeroBl } as any,
      {
        clientNom:         bd.clientNom,
        clientAdresse:     bd.destination,
        destination:       bd.destination,
        origine:           bd.origine ?? 'Béja',
        typeChargement:    bd.typeChargement,
        tonnageTotal:      bd.tonnageTotal,
        nombrePalettes:    bd.typeChargement === TypeChargement.PALETTE ? Math.ceil(bd.tonnageTotal / 0.8) : 0,
        statut:            bd.statut,
        datelivraison:     bd.datelivraison as any,
        filiere:           bd.filiere,
        societeExpeditrice: societe,
        company:           transfood,
        loadingPlan:       bd.plan ?? null,
        ordreChargement:   bd.ordreChargement ?? null,
        notes:             bd.notes ?? null,
        erpReference:      `ERP-${bd.numeroBl}`,
      } as any,
    );
    blCount++;
  }
  console.log(`  ✓ ${blCount} bons de livraison`);

  // ════════════════════════════════════════════════════════════════
  // 8. RÉCAPITULATIF
  // ════════════════════════════════════════════════════════════════
  console.log('\n[8/9] Récapitulatif des BLs…');

  const counts = {
    today:    blDefs.filter((b) => b.datelivraison === TODAY).length,
    yesterday: blDefs.filter((b) => b.datelivraison === YESTERDAY).length,
    tomorrow:  blDefs.filter((b) => b.datelivraison === TOMORROW).length,
    nextWeek:  blDefs.filter((b) => b.datelivraison === NEXT_WEEK).length,
    lastWeek:  blDefs.filter((b) => b.datelivraison === LAST_WEEK).length,
    draft:     blDefs.filter((b) => b.statut === BlStatus.DRAFT).length,
    validated: blDefs.filter((b) => b.statut === BlStatus.VALIDATED).length,
    loaded:    blDefs.filter((b) => b.statut === BlStatus.LOADED).length,
    delivered: blDefs.filter((b) => b.statut === BlStatus.DELIVERED).length,
    mcr:       blDefs.filter((b) => b.filiere === filMCR).length,
    amt:       blDefs.filter((b) => b.filiere === filAMT).length,
    pw:        blDefs.filter((b) => b.filiere === filPW).length,
  };

  console.log(`  Dates  : aujourd'hui=${counts.today} · hier=${counts.yesterday} · demain=${counts.tomorrow} · semaine prochaine=${counts.nextWeek} · semaine dernière=${counts.lastWeek}`);
  console.log(`  Statuts: DRAFT=${counts.draft} · VALIDATED=${counts.validated} · LOADED=${counts.loaded} · DELIVERED=${counts.delivered}`);
  console.log(`  Filières: MCSR=${counts.mcr} · AMT=${counts.amt} · PW=${counts.pw}`);

  // ════════════════════════════════════════════════════════════════
  // 9. RÉSUMÉ FINAL
  // ════════════════════════════════════════════════════════════════
  console.log('\n[9/9] ✅ Seeder terminé !');
  console.log('='.repeat(62));
  console.log('  COMPTES (mot de passe : Demo123!)');
  console.log('  ─────────────────────────────────────────────────────────');
  console.log('  SUPER_ADMIN          : admin@tms.com');
  console.log('  COMPANY_ADMIN        : logistique@transfood.tn');
  console.log('  EXPEDITEUR_ADMIN     : admin@roseblanche.tn');
  console.log('  FILIERE_ADMIN MCSR    : admin.mcr@roseblanche.tn');
  console.log('  FILIERE_ADMIN AMT    : admin.amt@roseblanche.tn');
  console.log('  FILIERE_ADMIN PW     : admin.pw@roseblanche.tn');
  console.log('  MAGASINIER MCSR+AMT   : mag1@roseblanche.tn');
  console.log('  MAGASINIER PW        : mag2@roseblanche.tn');
  console.log('  SECURITE MCSR+AMT     : sec1@roseblanche.tn');
  console.log('  SECURITE PW          : sec2@roseblanche.tn');
  console.log('  TRANSPORT_ADMIN      : admin@rapidtransport.tn');
  console.log('  EXPLOITANT_TRANSPORT : exploit@rapidtransport.tn');
  console.log('='.repeat(62));
  console.log(`  ${blCount} BLs · 18 plans · 12 camions · 10 chauffeurs · 8 quais`);
  console.log('='.repeat(62));

  await app.close();
}

bootstrap().catch((e) => {
  console.error('❌ Erreur seeder :', e);
  process.exit(1);
});
