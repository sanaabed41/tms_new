/**
 * Seeder V2 — Rose Blanche Groupe × TransFood
 * =============================================
 * Données réalistes pour toutes les fonctionnalités.
 *
 * Structure :
 *   Logistique  : TransFood
 *   Expéditeur  : Rose Blanche Groupe
 *   Filières    : PW · MCSR · AMT  (chacune avec adresse propre → origine BL)
 *   Transport   : Rapid Transport SARL · Nord Express Transport (en partenariat)
 *
 * Comptes (mot de passe : Demo123!) :
 *   admin@tms.com               → SUPER_ADMIN
 *   logistique@transfood.tn     → LOGISTIC_ADMIN
 *   admin@roseblanche.tn        → EXPEDITEUR_ADMIN
 *   admin.pw@roseblanche.tn     → FILIERE_ADMIN  (PW)
 *   admin.mcsr@roseblanche.tn   → FILIERE_ADMIN  (MCSR)
 *   admin.amt@roseblanche.tn    → FILIERE_ADMIN  (AMT)
 *   mag.pw@roseblanche.tn       → MAGASINIER     (PW)
 *   mag.mcsr@roseblanche.tn     → MAGASINIER     (MCSR)
 *   mag.amt@roseblanche.tn      → MAGASINIER     (AMT)
 *   sec.mcsramt@roseblanche.tn  → SECURITE       (MCSR + AMT)
 *   sec.pw@roseblanche.tn       → SECURITE       (PW)
 *   admin@rapid-transport.tn    → TRANSPORT_ADMIN (Rapid Transport)
 *   admin@nord-express.tn       → TRANSPORT_ADMIN (Nord Express)
 *
 * Lancer : cd backend && npm run seed:v2
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
import { TruckAvailability } from './truck-availability/truck-availability.entity';
import { Role } from './common/enums/role.enum';
import { CompanyType } from './common/enums/company-type.enum';
import { BlStatus } from './common/enums/bl-status.enum';
import * as bcrypt from 'bcryptjs';

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

  const companyRepo    = app.get<Repository<Company>>(getRepositoryToken(Company));
  const userRepo       = app.get<Repository<User>>(getRepositoryToken(User));
  const societeRepo    = app.get<Repository<SocieteExpeditrice>>(getRepositoryToken(SocieteExpeditrice));
  const filiereRepo    = app.get<Repository<Filiere>>(getRepositoryToken(Filiere));
  const quaiRepo       = app.get<Repository<Quai>>(getRepositoryToken(Quai));
  const blRepo         = app.get<Repository<BonLivraison>>(getRepositoryToken(BonLivraison));
  const planRepo       = app.get<Repository<LoadingPlan>>(getRepositoryToken(LoadingPlan));
  const articleRepo    = app.get<Repository<Article>>(getRepositoryToken(Article));
  const dcRepo         = app.get<Repository<DeliveryCompany>>(getRepositoryToken(DeliveryCompany));
  const truckRepo      = app.get<Repository<Truck>>(getRepositoryToken(Truck));
  const availRepo      = app.get<Repository<TruckAvailability>>(getRepositoryToken(TruckAvailability));

  const PWD = await bcrypt.hash('Demo123!', 10);

  console.log(`\n🗓  Dates : TODAY=${TODAY}  TOMORROW=${TOMORROW}\n`);

  // ════════════════════════════════════════════════════════════════
  // 1. SOCIÉTÉS
  // ════════════════════════════════════════════════════════════════
  console.log('[1/9] Sociétés…');

  const transfood = await upsert(companyRepo,
    { code: 'TF' } as any,
    { nom: 'TransFood', type: CompanyType.LOGISTIQUE, couleur: '#1890ff', isActive: true },
  );

  const rbGroupe = await upsert(companyRepo,
    { code: 'RBG' } as any,
    { nom: 'Rose Blanche Groupe', type: CompanyType.EXPEDITEUR, couleur: '#eb2f96', isActive: true },
  );
  await companyRepo.update(rbGroupe.id, { logistiqueCompany: { id: transfood.id } } as any);

  const rapidTransportCo = await upsert(companyRepo,
    { code: 'RT' } as any,
    { nom: 'Rapid Transport SARL', type: CompanyType.LOGISTIQUE, couleur: '#13c2c2', isActive: true },
  );

  const nordExpressCo = await upsert(companyRepo,
    { code: 'NE' } as any,
    { nom: 'Nord Express Transport', type: CompanyType.LOGISTIQUE, couleur: '#faad14', isActive: true },
  );

  console.log('  ✓ TransFood · Rose Blanche Groupe · Rapid Transport · Nord Express');

  // ════════════════════════════════════════════════════════════════
  // 2. UTILISATEURS
  // ════════════════════════════════════════════════════════════════
  console.log('\n[2/9] Utilisateurs…');

  await upsert(userRepo,
    { email: 'admin@tms.com' },
    { prenom: 'Super', nom: 'Admin', password: PWD, role: Role.SUPER_ADMIN, isActive: true, company: transfood },
  );

  const companyAdmin = await upsert(userRepo,
    { email: 'logistique@transfood.tn' },
    { prenom: 'Karim', nom: 'Ben Salem', password: PWD, role: Role.LOGISTIC_ADMIN, isActive: true, company: transfood },
  );

  await upsert(userRepo,
    { email: 'admin@roseblanche.tn' },
    { prenom: 'Directrice', nom: 'Rose Blanche', password: PWD, role: Role.EXPEDITEUR_ADMIN, isActive: true, company: rbGroupe },
  );

  await upsert(userRepo,
    { email: 'admin@rapid-transport.tn' },
    { prenom: 'Admin', nom: 'Rapid Transport', password: PWD, role: Role.TRANSPORT_ADMIN, isActive: true, company: rapidTransportCo },
  );

  await upsert(userRepo,
    { email: 'admin@nord-express.tn' },
    { prenom: 'Admin', nom: 'Nord Express', password: PWD, role: Role.TRANSPORT_ADMIN, isActive: true, company: nordExpressCo },
  );

  console.log('  ✓ SUPER_ADMIN · LOGISTIC_ADMIN · EXPEDITEUR_ADMIN · 2× TRANSPORT_ADMIN');

  // ════════════════════════════════════════════════════════════════
  // 3. SOCIÉTÉ EXPÉDITRICE + FILIÈRES + QUAIS
  // ════════════════════════════════════════════════════════════════
  console.log('\n[3/9] Filières & Quais…');

  const societe = await upsert(societeRepo,
    { nom: 'Rose Blanche Groupe' },
    {
      code: 'RBG',
      couleur: '#eb2f96',
      company: transfood,
      expediteurCompany: rbGroupe,
    },
  );

  // Filières avec adresses (→ origine des BLs)
  const filPW = await upsert(filiereRepo,
    { code: 'PW' },
    {
      nom: 'Pâte Warda',
      adresse: 'Zone Industrielle Béja Km 3, 9000 Béja',
      societeExpeditrice: societe,
    } as any,
  );

  const filMCSR = await upsert(filiereRepo,
    { code: 'MCSR' },
    {
      nom: 'M.C.S.R — Minoteries du Centre et Sahel Réunies',
      adresse: 'Route de Sfax Km 6, 3003 Sousse',
      societeExpeditrice: societe,
    } as any,
  );

  const filAMT = await upsert(filiereRepo,
    { code: 'AMT' },
    {
      nom: 'A.M.T — Agro Mélange Technologie',
      adresse: 'Zone Industrielle Charguia II, 2035 Tunis',
      societeExpeditrice: societe,
    } as any,
  );

  // Admins filières
  const faAdminPW = await upsert(userRepo,
    { email: 'admin.pw@roseblanche.tn' },
    { prenom: 'Admin', nom: 'Pâte Warda', password: PWD, role: Role.FILIERE_ADMIN, isActive: true, company: rbGroupe, filieres: [filPW] },
  );
  const faAdminMCSR = await upsert(userRepo,
    { email: 'admin.mcsr@roseblanche.tn' },
    { prenom: 'Admin', nom: 'MCSR', password: PWD, role: Role.FILIERE_ADMIN, isActive: true, company: rbGroupe, filieres: [filMCSR] },
  );
  const faAdminAMT = await upsert(userRepo,
    { email: 'admin.amt@roseblanche.tn' },
    { prenom: 'Admin', nom: 'AMT', password: PWD, role: Role.FILIERE_ADMIN, isActive: true, company: rbGroupe, filieres: [filAMT] },
  );

  // Magasiniers — 1 par filière
  await upsert(userRepo,
    { email: 'mag.pw@roseblanche.tn' },
    { prenom: 'Magasinier', nom: 'PW', password: PWD, role: Role.MAGASINIER, isActive: true, company: rbGroupe, filieres: [filPW] },
  );
  await upsert(userRepo,
    { email: 'mag.mcsr@roseblanche.tn' },
    { prenom: 'Magasinier', nom: 'MCSR', password: PWD, role: Role.MAGASINIER, isActive: true, company: rbGroupe, filieres: [filMCSR] },
  );
  await upsert(userRepo,
    { email: 'mag.amt@roseblanche.tn' },
    { prenom: 'Magasinier', nom: 'AMT', password: PWD, role: Role.MAGASINIER, isActive: true, company: rbGroupe, filieres: [filAMT] },
  );

  // Agents sécurité
  await upsert(userRepo,
    { email: 'sec.mcsramt@roseblanche.tn' },
    { prenom: 'Agent', nom: 'Sécurité MCSR-AMT', password: PWD, role: Role.SECURITE, isActive: true, company: rbGroupe, filieres: [filMCSR, filAMT] },
  );
  await upsert(userRepo,
    { email: 'sec.pw@roseblanche.tn' },
    { prenom: 'Agent', nom: 'Sécurité PW', password: PWD, role: Role.SECURITE, isActive: true, company: rbGroupe, filieres: [filPW] },
  );

  console.log('  ✓ 3× FILIERE_ADMIN · 3× MAGASINIER (1/filière) · 2× SECURITE');

  // Quais
  const quaiDefs = [
    { nom: 'Q-PW-1',   filiere: filPW   }, { nom: 'Q-PW-2',   filiere: filPW   },
    { nom: 'Q-MCSR-1', filiere: filMCSR }, { nom: 'Q-MCSR-2', filiere: filMCSR }, { nom: 'Q-MCSR-3', filiere: filMCSR },
    { nom: 'Q-AMT-1',  filiere: filAMT  }, { nom: 'Q-AMT-2',  filiere: filAMT  }, { nom: 'Q-AMT-3',  filiere: filAMT  },
  ];
  const quais: Record<string, Quai> = {};
  for (const qd of quaiDefs) {
    const q = await upsert(quaiRepo,
      { nom: qd.nom, societeExpeditrice: societe } as any,
      { filiere: qd.filiere, isActive: true, company: null } as any,
    );
    quais[qd.nom] = q;
  }
  console.log('  ✓ 8 quais (Q-PW-1..2 · Q-MCSR-1..3 · Q-AMT-1..3)');

  // ════════════════════════════════════════════════════════════════
  // 4. SOCIÉTÉS DE TRANSPORT + CAMIONS + DISPONIBILITÉS
  // ════════════════════════════════════════════════════════════════
  console.log('\n[4/9] Camions & disponibilités…');

  const dcRapid = await upsert(dcRepo,
    { nom: 'Rapid Transport SARL' },
    { adresse: 'Zone Industrielle Charguia, Tunis', telephone: '+216 71 800 200', isActive: true, company: transfood },
  );
  const dcNord = await upsert(dcRepo,
    { nom: 'Nord Express Transport' },
    { adresse: 'Route de Bizerte Km 12, Mateur', telephone: '+216 72 600 100', isActive: true, company: transfood },
  );

  const truckDefs = [
    // Rapid Transport SARL
    { mat: 'RT-001-TN', tonne: 24, pal: 20, type: 'FRIGO',   dc: dcRapid, chauffeurNom: 'Ben Ali Khaled',   tel: '+216 20 111 001' },
    { mat: 'RT-002-TN', tonne: 30, pal: 0,  type: 'CITERNE', dc: dcRapid, chauffeurNom: 'Trabelsi Sami',    tel: '+216 20 111 002' },
    { mat: 'RT-003-TN', tonne: 20, pal: 18, type: 'PALETTE', dc: dcRapid, chauffeurNom: 'Mansouri Farouk',  tel: '+216 20 111 003' },
    { mat: 'RT-004-TN', tonne: 28, pal: 0,  type: 'VRAC',    dc: dcRapid, chauffeurNom: 'Boughzala Mehdi',  tel: '+216 20 111 004' },
    { mat: 'RT-005-TN', tonne: 18, pal: 16, type: 'FRIGO',   dc: dcRapid, chauffeurNom: 'Jelassi Amine',    tel: '+216 20 111 005' },
    { mat: 'RT-006-TN', tonne: 22, pal: 20, type: 'PALETTE', dc: dcRapid, chauffeurNom: 'Chaabane Riadh',   tel: '+216 20 111 006' },
    { mat: 'RT-007-TN', tonne: 25, pal: 0,  type: 'VRAC',    dc: dcRapid, chauffeurNom: 'Khedher Walid',    tel: '+216 20 111 007' },
    // Nord Express Transport
    { mat: 'NE-001-TN', tonne: 32, pal: 0,  type: 'CITERNE', dc: dcNord,  chauffeurNom: 'Zouaghi Nabil',    tel: '+216 20 222 001' },
    { mat: 'NE-002-TN', tonne: 20, pal: 18, type: 'FRIGO',   dc: dcNord,  chauffeurNom: 'Hamdi Slim',       tel: '+216 20 222 002' },
    { mat: 'NE-003-TN', tonne: 18, pal: 16, type: 'PALETTE', dc: dcNord,  chauffeurNom: 'Baccouche Tarek',  tel: '+216 20 222 003' },
    { mat: 'NE-004-TN', tonne: 26, pal: 0,  type: 'VRAC',    dc: dcNord,  chauffeurNom: 'Maatoug Youssef',  tel: '+216 20 222 004' },
    { mat: 'NE-005-TN', tonne: 24, pal: 20, type: 'FRIGO',   dc: dcNord,  chauffeurNom: 'Riahi Chokri',     tel: '+216 20 222 005' },
  ];

  const trucks: Truck[] = [];
  for (const td of truckDefs) {
    const t = await upsert(truckRepo,
      { matricule: td.mat },
      {
        capaciteTonnage: td.tonne,
        capacitePalettes: td.pal,
        type: td.type,
        isActive: true,
        chauffeurNom: td.chauffeurNom,
        chauffeurTel: td.tel,
        deliveryCompany: td.dc,
      } as any,
    );
    trucks.push(t);
  }
  console.log(`  ✓ ${trucks.length} camions (RT×7 · NE×5)`);

  // Disponibilités — gérées par les sociétés transport
  // Statuts variés : DISPONIBLE (défaut) / INDISPONIBLE (motif)
  type AvailDef = { truck: Truck; date: string; statut?: string; motif?: string };
  const availDefs: AvailDef[] = [
    // TODAY — Rapid Transport (6 dispo, 1 indispo)
    { truck: trucks[0], date: TODAY, statut: 'DISPONIBLE' },
    { truck: trucks[1], date: TODAY, statut: 'DISPONIBLE' },
    { truck: trucks[2], date: TODAY, statut: 'DISPONIBLE' },
    { truck: trucks[3], date: TODAY, statut: 'DISPONIBLE' },
    { truck: trucks[4], date: TODAY, statut: 'DISPONIBLE' },
    { truck: trucks[5], date: TODAY, statut: 'DISPONIBLE' },
    { truck: trucks[6], date: TODAY, statut: 'INDISPONIBLE', motif: 'En panne — moteur' },
    // TODAY — Nord Express (4 dispo, 1 indispo)
    { truck: trucks[7],  date: TODAY, statut: 'DISPONIBLE' },
    { truck: trucks[8],  date: TODAY, statut: 'DISPONIBLE' },
    { truck: trucks[9],  date: TODAY, statut: 'DISPONIBLE' },
    { truck: trucks[10], date: TODAY, statut: 'DISPONIBLE' },
    { truck: trucks[11], date: TODAY, statut: 'INDISPONIBLE', motif: 'Révision technique' },
    // TOMORROW — Rapid Transport (tous disponibles)
    { truck: trucks[0], date: TOMORROW, statut: 'DISPONIBLE' },
    { truck: trucks[1], date: TOMORROW, statut: 'DISPONIBLE' },
    { truck: trucks[2], date: TOMORROW, statut: 'DISPONIBLE' },
    { truck: trucks[3], date: TOMORROW, statut: 'DISPONIBLE' },
    { truck: trucks[4], date: TOMORROW, statut: 'DISPONIBLE' },
    { truck: trucks[5], date: TOMORROW, statut: 'DISPONIBLE' },
    { truck: trucks[6], date: TOMORROW, statut: 'INDISPONIBLE', motif: 'En réparation' },
    // TOMORROW — Nord Express
    { truck: trucks[7],  date: TOMORROW, statut: 'DISPONIBLE' },
    { truck: trucks[8],  date: TOMORROW, statut: 'DISPONIBLE' },
    { truck: trucks[9],  date: TOMORROW, statut: 'DISPONIBLE' },
    { truck: trucks[10], date: TOMORROW, statut: 'DISPONIBLE' },
    { truck: trucks[11], date: TOMORROW, statut: 'DISPONIBLE' },
  ];

  for (const ad of availDefs) {
    const existing = await availRepo.findOne({
      where: { truck: { id: ad.truck.id }, date: ad.date } as any,
      relations: ['truck'],
    });
    if (!existing) {
      await availRepo.save(
        availRepo.create({
          truck: ad.truck,
          date: ad.date,
          company: transfood,
          statut: ad.statut ?? 'DISPONIBLE',
          motif: ad.motif ?? null,
        } as any),
      );
    } else {
      existing.statut = ad.statut ?? 'DISPONIBLE';
      (existing as any).motif = ad.motif ?? null;
      await availRepo.save(existing);
    }
  }
  console.log(`  ✓ ${availDefs.length} disponibilités (${availDefs.filter(a => a.statut === 'INDISPONIBLE').length} INDISPONIBLE)`);

  // ════════════════════════════════════════════════════════════════
  // 5. ARTICLES
  // ════════════════════════════════════════════════════════════════
  console.log('\n[5/9] Articles…');
  const articleDefs = [
    { code: 'PW-PAT-001', libelle: 'Pâtes Warda courtes 1kg',  poidsUnitaire: 1.0, unite: 'paquet' },
    { code: 'PW-PAT-002', libelle: 'Pâtes Warda longues 1kg',  poidsUnitaire: 1.0, unite: 'paquet' },
    { code: 'PW-CUS-001', libelle: 'Couscous fin 1kg',         poidsUnitaire: 1.0, unite: 'paquet' },
    { code: 'PW-CUS-002', libelle: 'Couscous moyen 1kg',       poidsUnitaire: 1.0, unite: 'paquet' },
    { code: 'MCSR-FAR-001', libelle: 'Farine type 55 50kg',    poidsUnitaire: 50.0, unite: 'sac' },
    { code: 'MCSR-SEM-001', libelle: 'Semoule fine 5kg',       poidsUnitaire: 5.0,  unite: 'sac' },
    { code: 'MCSR-SON-001', libelle: 'Son de blé 25kg',        poidsUnitaire: 25.0, unite: 'sac' },
    { code: 'AMT-HUI-001',  libelle: 'Huile tournesol 5L',     poidsUnitaire: 4.5,  unite: 'bidon' },
    { code: 'AMT-SUC-001',  libelle: 'Sucre blanc 50kg',       poidsUnitaire: 50.0, unite: 'sac' },
    { code: 'AMT-MIX-001',  libelle: 'Mélange agro 25kg',      poidsUnitaire: 25.0, unite: 'sac' },
  ];
  for (const ad of articleDefs) {
    await upsert(articleRepo, { code: ad.code }, { libelle: ad.libelle, poidsUnitaire: ad.poidsUnitaire, unite: ad.unite });
  }
  console.log('  ✓ 10 articles (PW×4 · MCSR×3 · AMT×3)');

  // ════════════════════════════════════════════════════════════════
  // 6. PLANS DE CHARGEMENT
  // ════════════════════════════════════════════════════════════════
  console.log('\n[6/9] Plans de chargement…');

  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const oneHourAgo  = new Date(now.getTime() - 1 * 60 * 60 * 1000);

  type PlanDef = {
    ref: string; date: string; truck: Truck;
    isValidated: boolean; loadingStatus: string; entryStatus: string;
    heureArrivee?: string; quai?: string; tonnageCharge?: number;
    loadingStartedAt?: Date; loadingElapsedSeconds?: number;
    stationsSequence?: string[]; currentStation?: string | null; currentStationIdx?: number;
  };

  const planDefs: PlanDef[] = [
    // TODAY
    { ref: 'PL-V2-T01', date: TODAY, truck: trucks[0],  isValidated: true,  loadingStatus: 'WAITING',     entryStatus: 'IDLE',    heureArrivee: '08:00', tonnageCharge: 0, stationsSequence: ['MCSR', 'AMT', 'PW'], currentStation: null, currentStationIdx: 0 },
    { ref: 'PL-V2-T02', date: TODAY, truck: trucks[1],  isValidated: true,  loadingStatus: 'WAITING',     entryStatus: 'IDLE',    heureArrivee: '09:00', tonnageCharge: 0, stationsSequence: ['AMT', 'PW'],         currentStation: null, currentStationIdx: 0 },
    { ref: 'PL-V2-T03', date: TODAY, truck: trucks[2],  isValidated: false, loadingStatus: 'WAITING',     entryStatus: 'IDLE',    heureArrivee: '10:00', tonnageCharge: 0, stationsSequence: ['PW', 'MCSR'],        currentStation: null, currentStationIdx: 0 },
    { ref: 'PL-V2-T04', date: TODAY, truck: trucks[3],  isValidated: true,  loadingStatus: 'WAITING',     entryStatus: 'CALLED',  heureArrivee: '07:30', quai: quais['Q-MCSR-1'].nom, tonnageCharge: 0, stationsSequence: ['MCSR', 'AMT'], currentStation: 'MCSR', currentStationIdx: 0 },
    { ref: 'PL-V2-T05', date: TODAY, truck: trucks[4],  isValidated: true,  loadingStatus: 'WAITING',     entryStatus: 'CALLED',  heureArrivee: '07:45', quai: quais['Q-AMT-1'].nom,  tonnageCharge: 0, stationsSequence: ['AMT', 'PW'],   currentStation: 'AMT',  currentStationIdx: 0 },
    { ref: 'PL-V2-T06', date: TODAY, truck: trucks[5],  isValidated: true,  loadingStatus: 'IN_PROGRESS', entryStatus: 'ENTERED', heureArrivee: '06:00', quai: quais['Q-MCSR-2'].nom, tonnageCharge: 32.5, loadingStartedAt: twoHoursAgo, loadingElapsedSeconds: 7200, stationsSequence: ['MCSR', 'AMT', 'PW'], currentStation: 'AMT', currentStationIdx: 1 },
    { ref: 'PL-V2-T07', date: TODAY, truck: trucks[7],  isValidated: true,  loadingStatus: 'IN_PROGRESS', entryStatus: 'ENTERED', heureArrivee: '06:30', quai: quais['Q-AMT-2'].nom,  tonnageCharge: 18.0, loadingStartedAt: oneHourAgo,  loadingElapsedSeconds: 3600, stationsSequence: ['AMT', 'PW'], currentStation: 'PW', currentStationIdx: 1 },
    { ref: 'PL-V2-T08', date: TODAY, truck: trucks[8],  isValidated: true,  loadingStatus: 'PAUSED',      entryStatus: 'ENTERED', heureArrivee: '05:30', quai: quais['Q-PW-1'].nom,   tonnageCharge: 18.0, loadingStartedAt: twoHoursAgo, loadingElapsedSeconds: 5400, stationsSequence: ['PW', 'MCSR'], currentStation: 'PW', currentStationIdx: 0 },
    { ref: 'PL-V2-T09', date: TODAY, truck: trucks[9],  isValidated: true,  loadingStatus: 'DONE',        entryStatus: 'EXITED',  heureArrivee: '04:00', quai: quais['Q-AMT-3'].nom,  tonnageCharge: 45.0, loadingElapsedSeconds: 10800, stationsSequence: ['MCSR', 'AMT', 'PW'], currentStation: null, currentStationIdx: 3 },
    { ref: 'PL-V2-T10', date: TODAY, truck: trucks[10], isValidated: true,  loadingStatus: 'DONE',        entryStatus: 'EXITED',  heureArrivee: '04:30', quai: quais['Q-PW-2'].nom,   tonnageCharge: 38.5, loadingElapsedSeconds: 9000, stationsSequence: ['PW', 'AMT'], currentStation: null, currentStationIdx: 2 },
    // YESTERDAY
    { ref: 'PL-V2-Y01', date: YESTERDAY, truck: trucks[0],  isValidated: true, loadingStatus: 'DONE', entryStatus: 'EXITED', heureArrivee: '05:00', quai: quais['Q-MCSR-1'].nom, tonnageCharge: 42.0, loadingElapsedSeconds: 9600,  stationsSequence: ['MCSR', 'AMT'], currentStation: null, currentStationIdx: 2 },
    { ref: 'PL-V2-Y02', date: YESTERDAY, truck: trucks[7],  isValidated: true, loadingStatus: 'DONE', entryStatus: 'EXITED', heureArrivee: '06:00', quai: quais['Q-PW-1'].nom,   tonnageCharge: 36.0, loadingElapsedSeconds: 8400,  stationsSequence: ['PW'], currentStation: null, currentStationIdx: 1 },
    { ref: 'PL-V2-Y03', date: YESTERDAY, truck: trucks[8],  isValidated: true, loadingStatus: 'DONE', entryStatus: 'EXITED', heureArrivee: '07:00', quai: quais['Q-AMT-1'].nom,  tonnageCharge: 28.0, loadingElapsedSeconds: 7200,  stationsSequence: ['AMT', 'MCSR'], currentStation: null, currentStationIdx: 2 },
    // TOMORROW
    { ref: 'PL-V2-TM01', date: TOMORROW, truck: trucks[1],  isValidated: true,  loadingStatus: 'WAITING', entryStatus: 'IDLE', heureArrivee: '07:00', tonnageCharge: 0, stationsSequence: ['MCSR', 'AMT', 'PW'], currentStation: null, currentStationIdx: 0 },
    { ref: 'PL-V2-TM02', date: TOMORROW, truck: trucks[3],  isValidated: true,  loadingStatus: 'WAITING', entryStatus: 'IDLE', heureArrivee: '08:00', tonnageCharge: 0, stationsSequence: ['AMT', 'PW'],         currentStation: null, currentStationIdx: 0 },
    { ref: 'PL-V2-TM03', date: TOMORROW, truck: trucks[11], isValidated: false, loadingStatus: 'WAITING', entryStatus: 'IDLE', heureArrivee: '09:00', tonnageCharge: 0, stationsSequence: ['PW'],                currentStation: null, currentStationIdx: 0 },
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
        signature:             pd.isValidated ? 'sig-v2' : null,
      } as any,
    );
    plans[pd.ref] = plan;
  }
  console.log(`  ✓ ${planDefs.length} plans`);

  // ════════════════════════════════════════════════════════════════
  // 7. BONS DE LIVRAISON (56+)
  //    origine = adresse de la filière
  // ════════════════════════════════════════════════════════════════
  console.log('\n[7/9] Bons de livraison…');

  const origPW   = (filPW as any).adresse   ?? 'Zone Industrielle Béja';
  const origMCSR = (filMCSR as any).adresse ?? 'Route de Sfax Km 6, Sousse';
  const origAMT  = (filAMT as any).adresse  ?? 'Zone Industrielle Charguia II, Tunis';

  type BlDef = {
    num: string; clientNom: string; clientTel: string; destination: string;
    origine: string; tonnageTotal: number; nombrePalettes?: number;
    type: TypeChargement; statut: BlStatus; date: string;
    filiere: Filiere; ordre?: number; plan?: LoadingPlan; notes?: string;
  };

  const blDefs: BlDef[] = [
    // ══════════════════════════════════════════════════════════════
    // TODAY — avec plans
    // ══════════════════════════════════════════════════════════════

    // PL-V2-T01 (IDLE) — 3 BLs VALIDATED
    { num: 'BL-V2-T001', clientNom: 'SAPD Distribution Sfax',   clientTel: '+216 74 200 100', destination: 'Sfax',     origine: origMCSR, tonnageTotal: 12.0, type: TypeChargement.FRIGO,   statut: BlStatus.VALIDATED, date: TODAY, filiere: filMCSR, ordre: 1, plan: plans['PL-V2-T01'] },
    { num: 'BL-V2-T002', clientNom: 'Cotupha Sousse',            clientTel: '+216 73 300 200', destination: 'Sousse',   origine: origAMT,  tonnageTotal: 20.0, type: TypeChargement.VRAC,    statut: BlStatus.VALIDATED, date: TODAY, filiere: filAMT,  ordre: 2, plan: plans['PL-V2-T01'] },
    { num: 'BL-V2-T003', clientNom: 'Alimentaires Kairouan',     clientTel: '+216 77 400 300', destination: 'Kairouan', origine: origPW,   tonnageTotal: 15.0, nombrePalettes: 19, type: TypeChargement.PALETTE, statut: BlStatus.VALIDATED, date: TODAY, filiere: filPW, ordre: 3, plan: plans['PL-V2-T01'] },

    // PL-V2-T02 (IDLE) — 3 BLs VALIDATED
    { num: 'BL-V2-T004', clientNom: 'Grande Distribution Gabes', clientTel: '+216 75 500 400', destination: 'Gabes',    origine: origMCSR, tonnageTotal: 10.0, type: TypeChargement.FRIGO,   statut: BlStatus.VALIDATED, date: TODAY, filiere: filMCSR, ordre: 1, plan: plans['PL-V2-T02'] },
    { num: 'BL-V2-T005', clientNom: 'Société Nabeulienne',       clientTel: '+216 72 600 500', destination: 'Nabeul',   origine: origAMT,  tonnageTotal: 28.0, type: TypeChargement.CITERNE, statut: BlStatus.VALIDATED, date: TODAY, filiere: filAMT,  ordre: 2, plan: plans['PL-V2-T02'] },
    { num: 'BL-V2-T006', clientNom: 'Distributeur Côtier',       clientTel: '+216 71 700 600', destination: 'Bizerte',  origine: origPW,   tonnageTotal: 18.0, nombrePalettes: 23, type: TypeChargement.PALETTE, statut: BlStatus.VALIDATED, date: TODAY, filiere: filPW, ordre: 3, plan: plans['PL-V2-T02'] },

    // PL-V2-T03 (IDLE · non validé) — 2 BLs VALIDATED
    { num: 'BL-V2-T007', clientNom: 'Monastir Trade',            clientTel: '+216 73 800 700', destination: 'Monastir', origine: origMCSR, tonnageTotal:  8.0, type: TypeChargement.FRIGO,   statut: BlStatus.VALIDATED, date: TODAY, filiere: filMCSR, ordre: 1, plan: plans['PL-V2-T03'], notes: 'Plan non encore validé' },
    { num: 'BL-V2-T008', clientNom: 'Kairouan Distribution',     clientTel: '+216 77 900 800', destination: 'Kairouan', origine: origAMT,  tonnageTotal: 22.0, type: TypeChargement.VRAC,    statut: BlStatus.VALIDATED, date: TODAY, filiere: filAMT,  ordre: 2, plan: plans['PL-V2-T03'], notes: 'Plan non encore validé' },

    // PL-V2-T04 (CALLED · Q-MCSR-1) — 2 BLs LOADED
    { num: 'BL-V2-T009', clientNom: 'Sud Alimentaire Gafsa',     clientTel: '+216 76 100 900', destination: 'Gafsa',    origine: origMCSR, tonnageTotal: 10.0, type: TypeChargement.FRIGO,   statut: BlStatus.LOADED, date: TODAY, filiere: filMCSR, ordre: 1, plan: plans['PL-V2-T04'] },
    { num: 'BL-V2-T010', clientNom: 'Béja Négoce',               clientTel: '+216 78 200 010', destination: 'Béja',     origine: origAMT,  tonnageTotal: 25.0, type: TypeChargement.VRAC,    statut: BlStatus.LOADED, date: TODAY, filiere: filAMT,  ordre: 2, plan: plans['PL-V2-T04'] },

    // PL-V2-T05 (CALLED · Q-AMT-1) — 3 BLs LOADED
    { num: 'BL-V2-T011', clientNom: 'Hypermarché Sfax Mall',     clientTel: '+216 74 300 011', destination: 'Sfax',     origine: origPW,   tonnageTotal: 22.0, nombrePalettes: 28, type: TypeChargement.PALETTE, statut: BlStatus.LOADED, date: TODAY, filiere: filPW, ordre: 1, plan: plans['PL-V2-T05'] },
    { num: 'BL-V2-T012', clientNom: 'Cotupha Sousse',            clientTel: '+216 73 300 200', destination: 'Sousse',   origine: origAMT,  tonnageTotal: 26.0, type: TypeChargement.VRAC,    statut: BlStatus.LOADED, date: TODAY, filiere: filAMT,  ordre: 2, plan: plans['PL-V2-T05'] },
    { num: 'BL-V2-T013', clientNom: 'BioFrais Nabeul',           clientTel: '+216 72 400 013', destination: 'Nabeul',   origine: origMCSR, tonnageTotal: 14.0, type: TypeChargement.FRIGO,   statut: BlStatus.LOADED, date: TODAY, filiere: filMCSR, ordre: 3, plan: plans['PL-V2-T05'] },

    // PL-V2-T06 (IN_PROGRESS · Q-MCSR-2) — 3 BLs LOADED
    { num: 'BL-V2-T014', clientNom: 'SAPD Distribution Sfax',   clientTel: '+216 74 200 100', destination: 'Sfax',     origine: origMCSR, tonnageTotal: 20.0, type: TypeChargement.FRIGO,   statut: BlStatus.LOADED, date: TODAY, filiere: filMCSR, ordre: 1, plan: plans['PL-V2-T06'] },
    { num: 'BL-V2-T015', clientNom: 'Centrale Industrielle Gabes', clientTel: '+216 75 500 015', destination: 'Gabes', origine: origAMT,  tonnageTotal: 18.0, type: TypeChargement.CITERNE, statut: BlStatus.LOADED, date: TODAY, filiere: filAMT,  ordre: 2, plan: plans['PL-V2-T06'] },
    { num: 'BL-V2-T016', clientNom: 'Distributeur Côtier',       clientTel: '+216 71 700 600', destination: 'Bizerte', origine: origPW,   tonnageTotal: 15.0, nombrePalettes: 19, type: TypeChargement.PALETTE, statut: BlStatus.LOADED, date: TODAY, filiere: filPW, ordre: 3, plan: plans['PL-V2-T06'] },

    // PL-V2-T07 (IN_PROGRESS · Q-AMT-2) — 2 BLs LOADED
    { num: 'BL-V2-T017', clientNom: 'Monastir Trade',            clientTel: '+216 73 800 700', destination: 'Monastir', origine: origMCSR, tonnageTotal: 12.0, nombrePalettes: 15, type: TypeChargement.PALETTE, statut: BlStatus.LOADED, date: TODAY, filiere: filMCSR, ordre: 1, plan: plans['PL-V2-T07'] },
    { num: 'BL-V2-T018', clientNom: 'Alimentaires Kairouan',     clientTel: '+216 77 400 300', destination: 'Kairouan', origine: origPW,   tonnageTotal: 16.0, nombrePalettes: 20, type: TypeChargement.PALETTE, statut: BlStatus.LOADED, date: TODAY, filiere: filPW, ordre: 2, plan: plans['PL-V2-T07'] },

    // PL-V2-T08 (PAUSED · Q-PW-1) — 2 BLs LOADED
    { num: 'BL-V2-T019', clientNom: 'Grande Distribution Tunis', clientTel: '+216 71 600 019', destination: 'Tunis',    origine: origAMT,  tonnageTotal: 20.0, type: TypeChargement.VRAC,    statut: BlStatus.LOADED, date: TODAY, filiere: filAMT,  ordre: 1, plan: plans['PL-V2-T08'] },
    { num: 'BL-V2-T020', clientNom: 'Sud Alimentaire Gafsa',     clientTel: '+216 76 100 900', destination: 'Gafsa',    origine: origMCSR, tonnageTotal:  9.0, type: TypeChargement.FRIGO,   statut: BlStatus.LOADED, date: TODAY, filiere: filMCSR, ordre: 2, plan: plans['PL-V2-T08'] },

    // PL-V2-T09 (DONE · Q-AMT-3) — 3 BLs DELIVERED
    { num: 'BL-V2-T021', clientNom: 'BioFrais Nabeul',           clientTel: '+216 72 400 013', destination: 'Nabeul',   origine: origMCSR, tonnageTotal: 18.0, type: TypeChargement.FRIGO,   statut: BlStatus.DELIVERED, date: TODAY, filiere: filMCSR, ordre: 1, plan: plans['PL-V2-T09'] },
    { num: 'BL-V2-T022', clientNom: 'Centrale Bizerte',          clientTel: '+216 72 800 022', destination: 'Bizerte',  origine: origAMT,  tonnageTotal: 25.0, type: TypeChargement.VRAC,    statut: BlStatus.DELIVERED, date: TODAY, filiere: filAMT,  ordre: 2, plan: plans['PL-V2-T09'] },
    { num: 'BL-V2-T023', clientNom: 'Hypermarché Monastir',      clientTel: '+216 73 900 023', destination: 'Monastir', origine: origPW,   tonnageTotal: 20.0, nombrePalettes: 25, type: TypeChargement.PALETTE, statut: BlStatus.DELIVERED, date: TODAY, filiere: filPW, ordre: 3, plan: plans['PL-V2-T09'] },

    // PL-V2-T10 (DONE · Q-PW-2) — 3 BLs DELIVERED
    { num: 'BL-V2-T024', clientNom: 'Kairouan Distribution',     clientTel: '+216 77 900 800', destination: 'Kairouan', origine: origPW,   tonnageTotal: 22.0, nombrePalettes: 28, type: TypeChargement.PALETTE, statut: BlStatus.DELIVERED, date: TODAY, filiere: filPW, ordre: 1, plan: plans['PL-V2-T10'] },
    { num: 'BL-V2-T025', clientNom: 'Centrale Industrielle Gabes', clientTel: '+216 75 500 015', destination: 'Gabes', origine: origMCSR, tonnageTotal: 14.0, type: TypeChargement.FRIGO,   statut: BlStatus.DELIVERED, date: TODAY, filiere: filMCSR, ordre: 2, plan: plans['PL-V2-T10'] },
    { num: 'BL-V2-T026', clientNom: 'Société Nabeulienne',       clientTel: '+216 72 600 500', destination: 'Nabeul',  origine: origAMT,  tonnageTotal: 30.0, type: TypeChargement.CITERNE, statut: BlStatus.DELIVERED, date: TODAY, filiere: filAMT, ordre: 3, plan: plans['PL-V2-T10'] },

    // TODAY · Sans plan · DRAFT
    { num: 'BL-V2-T027', clientNom: 'Béja Négoce',               clientTel: '+216 78 200 010', destination: 'Béja',     origine: origMCSR, tonnageTotal:  9.5, type: TypeChargement.FRIGO,   statut: BlStatus.DRAFT, date: TODAY, filiere: filMCSR, notes: 'En attente de validation' },
    { num: 'BL-V2-T028', clientNom: 'Gafsa Mining Supply',        clientTel: '+216 76 200 028', destination: 'Gafsa',    origine: origAMT,  tonnageTotal: 16.0, nombrePalettes: 20, type: TypeChargement.PALETTE, statut: BlStatus.DRAFT, date: TODAY, filiere: filAMT, notes: 'Commande urgente' },
    { num: 'BL-V2-T029', clientNom: 'Nord Aliments Bizerte',      clientTel: '+216 72 700 029', destination: 'Bizerte',  origine: origPW,   tonnageTotal: 14.0, type: TypeChargement.VRAC,    statut: BlStatus.DRAFT, date: TODAY, filiere: filPW,  notes: 'Nouveau client' },
    { num: 'BL-V2-T030', clientNom: 'Tunis Express',              clientTel: '+216 71 800 030', destination: 'Tunis',    origine: origAMT,  tonnageTotal: 22.0, type: TypeChargement.CITERNE, statut: BlStatus.DRAFT, date: TODAY, filiere: filAMT, notes: 'Client prioritaire' },

    // TODAY · Sans plan · VALIDATED
    { num: 'BL-V2-T031', clientNom: 'SAPD Distribution Sfax',   clientTel: '+216 74 200 100', destination: 'Sfax',     origine: origMCSR, tonnageTotal: 11.0, type: TypeChargement.FRIGO,   statut: BlStatus.VALIDATED, date: TODAY, filiere: filMCSR, notes: 'Validé — à planifier' },
    { num: 'BL-V2-T032', clientNom: 'Grande Distribution Gabes', clientTel: '+216 75 500 400', destination: 'Gabes',    origine: origAMT,  tonnageTotal: 30.0, type: TypeChargement.VRAC,    statut: BlStatus.VALIDATED, date: TODAY, filiere: filAMT,  notes: 'Validé — à planifier' },
    { num: 'BL-V2-T033', clientNom: 'Hypermarché Sfax Mall',     clientTel: '+216 74 300 011', destination: 'Sfax',     origine: origPW,   tonnageTotal: 16.0, nombrePalettes: 20, type: TypeChargement.PALETTE, statut: BlStatus.VALIDATED, date: TODAY, filiere: filPW, notes: 'Livraison urgente' },
    { num: 'BL-V2-T034', clientNom: 'Monastir Trade',            clientTel: '+216 73 800 700', destination: 'Monastir', origine: origMCSR, tonnageTotal: 18.0, type: TypeChargement.FRIGO,   statut: BlStatus.VALIDATED, date: TODAY, filiere: filMCSR, notes: 'Second passage' },

    // ══════════════════════════════════════════════════════════════
    // YESTERDAY — historique
    // ══════════════════════════════════════════════════════════════
    { num: 'BL-V2-Y001', clientNom: 'SAPD Distribution Sfax',   clientTel: '+216 74 200 100', destination: 'Sfax',     origine: origMCSR, tonnageTotal: 16.0, type: TypeChargement.FRIGO,   statut: BlStatus.DELIVERED, date: YESTERDAY, filiere: filMCSR, plan: plans['PL-V2-Y01'] },
    { num: 'BL-V2-Y002', clientNom: 'Cotupha Sousse',            clientTel: '+216 73 300 200', destination: 'Sousse',   origine: origAMT,  tonnageTotal: 26.0, type: TypeChargement.VRAC,    statut: BlStatus.DELIVERED, date: YESTERDAY, filiere: filAMT,  plan: plans['PL-V2-Y01'] },
    { num: 'BL-V2-Y003', clientNom: 'Hypermarché Sfax Mall',     clientTel: '+216 74 300 011', destination: 'Sfax',     origine: origPW,   tonnageTotal: 18.0, nombrePalettes: 23, type: TypeChargement.PALETTE, statut: BlStatus.DELIVERED, date: YESTERDAY, filiere: filPW, plan: plans['PL-V2-Y01'] },
    { num: 'BL-V2-Y004', clientNom: 'Alimentaires Kairouan',     clientTel: '+216 77 400 300', destination: 'Kairouan', origine: origMCSR, tonnageTotal: 12.0, type: TypeChargement.FRIGO,   statut: BlStatus.DELIVERED, date: YESTERDAY, filiere: filMCSR, plan: plans['PL-V2-Y02'] },
    { num: 'BL-V2-Y005', clientNom: 'Grande Distribution Gabes', clientTel: '+216 75 500 400', destination: 'Gabes',    origine: origPW,   tonnageTotal: 22.0, nombrePalettes: 28, type: TypeChargement.PALETTE, statut: BlStatus.DELIVERED, date: YESTERDAY, filiere: filPW, plan: plans['PL-V2-Y02'] },
    { num: 'BL-V2-Y006', clientNom: 'Centrale Bizerte',          clientTel: '+216 72 800 022', destination: 'Bizerte',  origine: origAMT,  tonnageTotal: 28.0, type: TypeChargement.VRAC,    statut: BlStatus.DELIVERED, date: YESTERDAY, filiere: filAMT,  plan: plans['PL-V2-Y03'] },
    { num: 'BL-V2-Y007', clientNom: 'BioFrais Nabeul',           clientTel: '+216 72 400 013', destination: 'Nabeul',   origine: origMCSR, tonnageTotal: 14.0, type: TypeChargement.FRIGO,   statut: BlStatus.DELIVERED, date: YESTERDAY, filiere: filMCSR, plan: plans['PL-V2-Y03'] },

    // ══════════════════════════════════════════════════════════════
    // TOMORROW — avec plans
    // ══════════════════════════════════════════════════════════════
    { num: 'BL-V2-TM01', clientNom: 'SAPD Distribution Sfax',   clientTel: '+216 74 200 100', destination: 'Sfax',     origine: origMCSR, tonnageTotal: 14.0, type: TypeChargement.FRIGO,   statut: BlStatus.VALIDATED, date: TOMORROW, filiere: filMCSR, ordre: 1, plan: plans['PL-V2-TM01'] },
    { num: 'BL-V2-TM02', clientNom: 'Cotupha Sousse',            clientTel: '+216 73 300 200', destination: 'Sousse',   origine: origAMT,  tonnageTotal: 22.0, type: TypeChargement.VRAC,    statut: BlStatus.VALIDATED, date: TOMORROW, filiere: filAMT,  ordre: 2, plan: plans['PL-V2-TM01'] },
    { num: 'BL-V2-TM03', clientNom: 'Hypermarché Sfax Mall',     clientTel: '+216 74 300 011', destination: 'Sfax',     origine: origPW,   tonnageTotal: 18.0, nombrePalettes: 23, type: TypeChargement.PALETTE, statut: BlStatus.VALIDATED, date: TOMORROW, filiere: filPW, ordre: 3, plan: plans['PL-V2-TM01'] },
    { num: 'BL-V2-TM04', clientNom: 'BioFrais Nabeul',           clientTel: '+216 72 400 013', destination: 'Nabeul',   origine: origMCSR, tonnageTotal: 10.0, type: TypeChargement.FRIGO,   statut: BlStatus.VALIDATED, date: TOMORROW, filiere: filMCSR, ordre: 1, plan: plans['PL-V2-TM02'] },
    { num: 'BL-V2-TM05', clientNom: 'Centrale Industrielle Gabes', clientTel: '+216 75 500 015', destination: 'Gabes', origine: origAMT,  tonnageTotal: 26.0, type: TypeChargement.CITERNE, statut: BlStatus.VALIDATED, date: TOMORROW, filiere: filAMT,  ordre: 2, plan: plans['PL-V2-TM02'] },
    { num: 'BL-V2-TM06', clientNom: 'Distributeur Côtier',       clientTel: '+216 71 700 600', destination: 'Bizerte', origine: origPW,   tonnageTotal: 20.0, nombrePalettes: 25, type: TypeChargement.PALETTE, statut: BlStatus.VALIDATED, date: TOMORROW, filiere: filPW, ordre: 1, plan: plans['PL-V2-TM03'], notes: 'Plan demain non validé' },
    { num: 'BL-V2-TM07', clientNom: 'Monastir Trade',            clientTel: '+216 73 800 700', destination: 'Monastir', origine: origAMT, tonnageTotal: 24.0, type: TypeChargement.VRAC,    statut: BlStatus.VALIDATED, date: TOMORROW, filiere: filAMT,  ordre: 2, plan: plans['PL-V2-TM03'], notes: 'Plan demain non validé' },

    // TOMORROW · Sans plan
    { num: 'BL-V2-TM08', clientNom: 'Kairouan Distribution',     clientTel: '+216 77 900 800', destination: 'Kairouan', origine: origMCSR, tonnageTotal: 13.0, type: TypeChargement.FRIGO,   statut: BlStatus.DRAFT,     date: TOMORROW, filiere: filMCSR, notes: 'BL demain — à valider' },
    { num: 'BL-V2-TM09', clientNom: 'Alimentaires Kairouan',     clientTel: '+216 77 400 300', destination: 'Kairouan', origine: origPW,   tonnageTotal: 17.0, nombrePalettes: 22, type: TypeChargement.PALETTE, statut: BlStatus.DRAFT, date: TOMORROW, filiere: filPW,  notes: 'En attente' },
    { num: 'BL-V2-TM10', clientNom: 'Tunis Express',              clientTel: '+216 71 800 030', destination: 'Tunis',    origine: origAMT,  tonnageTotal: 28.0, type: TypeChargement.CITERNE, statut: BlStatus.DRAFT,     date: TOMORROW, filiere: filAMT,  notes: 'Nouveau client' },
    { num: 'BL-V2-TM11', clientNom: 'Grande Distribution Gabes', clientTel: '+216 75 500 400', destination: 'Gabes',    origine: origMCSR, tonnageTotal: 12.0, type: TypeChargement.FRIGO,   statut: BlStatus.VALIDATED, date: TOMORROW, filiere: filMCSR, notes: 'Validé demain — à planifier' },
    { num: 'BL-V2-TM12', clientNom: 'Centrale Bizerte',          clientTel: '+216 72 800 022', destination: 'Bizerte',  origine: origAMT,  tonnageTotal: 32.0, type: TypeChargement.VRAC,    statut: BlStatus.VALIDATED, date: TOMORROW, filiere: filAMT,  notes: 'Livraison importante' },
    { num: 'BL-V2-TM13', clientNom: 'Hypermarché Monastir',      clientTel: '+216 73 900 023', destination: 'Monastir', origine: origPW,   tonnageTotal: 15.0, nombrePalettes: 19, type: TypeChargement.PALETTE, statut: BlStatus.VALIDATED, date: TOMORROW, filiere: filPW, notes: 'Commande régulière' },
    { num: 'BL-V2-TM14', clientNom: 'Béja Négoce',               clientTel: '+216 78 200 010', destination: 'Béja',     origine: origMCSR, tonnageTotal: 20.0, type: TypeChargement.FRIGO,   statut: BlStatus.VALIDATED, date: TOMORROW, filiere: filMCSR, notes: 'Priorité haute' },
  ];

  let blCount = 0;
  for (const bd of blDefs) {
    await upsert(blRepo,
      { numeroBl: bd.num } as any,
      {
        clientNom:          bd.clientNom,
        clientTelephone:    bd.clientTel,
        clientAdresse:      bd.destination,
        destination:        bd.destination,
        origine:            bd.origine,
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
  }
  console.log(`  ✓ ${blCount} bons de livraison`);

  // ════════════════════════════════════════════════════════════════
  // 8. RÉSUMÉ
  // ════════════════════════════════════════════════════════════════
  const todayBLs    = blDefs.filter((b) => b.date === TODAY);
  const tomorrowBLs = blDefs.filter((b) => b.date === TOMORROW);
  const histBLs     = blDefs.filter((b) => b.date === YESTERDAY);

  console.log('\n[9/9] ✅  Seeder V2 terminé !');
  console.log('═'.repeat(66));
  console.log(`  📅  TODAY    (${TODAY})`);
  console.log(`      ${todayBLs.length} BLs · DRAFT=${todayBLs.filter(b => b.statut===BlStatus.DRAFT).length} · VALIDATED=${todayBLs.filter(b => b.statut===BlStatus.VALIDATED).length} · LOADED=${todayBLs.filter(b => b.statut===BlStatus.LOADED).length} · DELIVERED=${todayBLs.filter(b => b.statut===BlStatus.DELIVERED).length}`);
  console.log(`  📅  TOMORROW (${TOMORROW})`);
  console.log(`      ${tomorrowBLs.length} BLs · DRAFT=${tomorrowBLs.filter(b => b.statut===BlStatus.DRAFT).length} · VALIDATED=${tomorrowBLs.filter(b => b.statut===BlStatus.VALIDATED).length}`);
  console.log(`  📅  HIER     (${YESTERDAY})`);
  console.log(`      ${histBLs.length} BLs DELIVERED (historique)`);
  console.log('  ─'.repeat(33));
  console.log(`  TOTAL : ${blCount} BLs · ${planDefs.length} plans · ${trucks.length} camions`);
  console.log('═'.repeat(66));
  console.log('  COMPTES  (mot de passe : Demo123!)');
  console.log('  admin@tms.com               → SUPER_ADMIN');
  console.log('  logistique@transfood.tn     → LOGISTIC_ADMIN');
  console.log('  admin@roseblanche.tn        → EXPEDITEUR_ADMIN (Rose Blanche Groupe)');
  console.log('  admin.pw@roseblanche.tn     → FILIERE_ADMIN  (Pâte Warda)');
  console.log('  admin.mcsr@roseblanche.tn   → FILIERE_ADMIN  (MCSR)');
  console.log('  admin.amt@roseblanche.tn    → FILIERE_ADMIN  (AMT)');
  console.log('  mag.pw@roseblanche.tn       → MAGASINIER     (PW)');
  console.log('  mag.mcsr@roseblanche.tn     → MAGASINIER     (MCSR)');
  console.log('  mag.amt@roseblanche.tn      → MAGASINIER     (AMT)');
  console.log('  sec.mcsramt@roseblanche.tn  → SECURITE       (MCSR + AMT)');
  console.log('  sec.pw@roseblanche.tn       → SECURITE       (PW)');
  console.log('  admin@rapid-transport.tn    → TRANSPORT_ADMIN (Rapid Transport SARL)');
  console.log('  admin@nord-express.tn       → TRANSPORT_ADMIN (Nord Express Transport)');
  console.log('═'.repeat(66));

  await app.close();
}

bootstrap().catch((e) => {
  console.error('❌ Erreur seeder :', e);
  process.exit(1);
});
