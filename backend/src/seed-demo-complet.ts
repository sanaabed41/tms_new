/**
 * Seeder DÉMO COMPLET — couvre toutes les fonctionnalités de la plateforme TMS
 *
 * Crée d'un seul coup :
 *   • 3 sociétés  : TransFood (LOGISTIQUE) | Rose Blanche   (EXPEDITEUR) | Rapid Transport (TRANSPORT)
 *   • 12 comptes  : tous les rôles (SUPER_ADMIN, COMPANY_ADMIN, EXPEDITEUR_ADMIN,
 *                   FILIERE_ADMIN × 3, MAGASINIER × 2, SECURITE × 2, TRANSPORT_ADMIN, EXPLOITANT)
 *   • 3 sociétés de livraison + 10 camions + 10 chauffeurs
 *   • 1 société expéditrice "Rose Blanche" + 3 filières + 8 quais
 *   • 10 articles
 *   • 30 bons de livraison  (statuts DRAFT / VALIDATED / LOADED / DELIVERED, dates variées)
 *   • 15 plans de chargement (état IDLE / CALLED / ENTERED/IN_PROGRESS / ENTERED/PAUSED / EXITED/DONE)
 *
 * IDEMPOTENT : peut être relancé sans dupliquer les données.
 *
 * Lancer : npm run seed:demo-full
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { Company } from './companies/company.entity';
import { CompanyType } from './common/enums/company-type.enum';
import { User } from './users/user.entity';
import { Role } from './common/enums/role.enum';
import { DeliveryCompany } from './delivery-companies/delivery-company.entity';
import { Truck } from './trucks/truck.entity';
import { Chauffeur } from './chauffeurs/chauffeur.entity';
import { Article } from './articles/article.entity';
import { SocieteExpeditrice } from './expediteurs/societe-expeditrice.entity';
import { Filiere } from './expediteurs/filiere.entity';
import { Quai } from './quais/quai.entity';
import { BonLivraison, TypeChargement } from './bons-livraison/bon-livraison.entity';
import { BlArticle } from './bons-livraison/bl-article.entity';
import { BlStatus } from './common/enums/bl-status.enum';
import { LoadingPlan } from './loading-plans/loading-plan.entity';

// ── Helpers ────────────────────────────────────────────────────────────────────

const PASS = 'Demo123!';

function d(offset: number): string {
  const dt = new Date();
  dt.setDate(dt.getDate() + offset);
  return dt.toISOString().split('T')[0];
}
const TODAY      = d(0);
const YESTERDAY  = d(-1);
const TOMORROW   = d(1);
const NEXT_WEEK  = d(7);

let planSeq = 0;
const ref = () => `PL-${TODAY}-${String(++planSeq).padStart(3, '0')}`;

let blSeq = 3000;
const blRef = () => `BL-${String(++blSeq).padStart(5, '0')}`;

async function upsert<T extends { id?: string }>(
  repo: Repository<T>,
  where: Partial<T>,
  build: () => Partial<T>,
): Promise<T> {
  const found = await (repo as any).findOne({ where });
  if (found) return found;
  return (repo as any).save({ ...build() });
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });

  const ds          = app.get(DataSource);
  const companyRepo = app.get<Repository<Company>>(getRepositoryToken(Company));
  const userRepo    = app.get<Repository<User>>(getRepositoryToken(User));
  const dcRepo      = app.get<Repository<DeliveryCompany>>(getRepositoryToken(DeliveryCompany));
  const truckRepo   = app.get<Repository<Truck>>(getRepositoryToken(Truck));
  const chauffRepo  = app.get<Repository<Chauffeur>>(getRepositoryToken(Chauffeur));
  const artRepo     = app.get<Repository<Article>>(getRepositoryToken(Article));
  const seRepo      = app.get<Repository<SocieteExpeditrice>>(getRepositoryToken(SocieteExpeditrice));
  const filRepo     = app.get<Repository<Filiere>>(getRepositoryToken(Filiere));
  const quaiRepo    = app.get<Repository<Quai>>(getRepositoryToken(Quai));
  const blRepo      = app.get<Repository<BonLivraison>>(getRepositoryToken(BonLivraison));
  const blaRepo     = app.get<Repository<BlArticle>>(getRepositoryToken(BlArticle));
  const planRepo    = app.get<Repository<LoadingPlan>>(getRepositoryToken(LoadingPlan));

  const hashed = await bcrypt.hash(PASS, 10);

  console.log('\n🌱  Seeder Démo Complet — démarrage...\n');

  // ═══════════════════════════════════════════════════════════════════════════
  // 1.  SOCIÉTÉS
  // ═══════════════════════════════════════════════════════════════════════════

  const transfood = await upsert(companyRepo, { nom: 'TransFood' } as any, () => ({
    nom: 'TransFood',
    type: CompanyType.LOGISTIQUE,
    adresse: 'Zone Logistique El Aouina, Tunis',
    telephone: '+216 71 000 000',
    couleur: '#1890ff',
    code: 'TF',
    isActive: true,
  }));
  console.log(`✅  [LOGISTIQUE]  ${transfood.nom}`);

  const rbSA = await upsert(companyRepo, { nom: 'Rose Blanche  ' } as any, () => ({
    nom: 'Rose Blanche  ',
    type: CompanyType.EXPEDITEUR,
    adresse: 'Zone Industrielle El Agba, Tunis 2086',
    telephone: '+216 71 555 666',
    couleur: '#e83e8c',
    code: 'RB',
    isActive: true,
  }));
  console.log(`✅  [EXPEDITEUR]  ${rbSA.nom}`);


  // Rose Blanche appartient à TransFood
  await companyRepo.update(rbSA.id, { logistiqueCompany: { id: transfood.id } } as any);
  console.log(`🔗  Rose Blanche → TransFood\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 2.  UTILISATEURS
  // ═══════════════════════════════════════════════════════════════════════════

  const makeUser = async (
    email: string, prenom: string, nom: string, role: Role,
    company: Company, filieres?: Filiere[],
  ) => {
    let u = await userRepo.findOne({ where: { email }, relations: ['filieres'] });
    if (!u) {
      u = userRepo.create({ email, prenom, nom, password: hashed, role, isActive: true, company });
      if (filieres) u.filieres = filieres;
      await userRepo.save(u);
    }
    return u;
  };

  // Ces utilisateurs seront créés après les filières — placeholder pour l'instant
  const superAdmin = await makeUser('admin@tms.com',        'Super', 'Admin',     Role.SUPER_ADMIN,      transfood);
  const respLogist = await makeUser('logistique@tms.com',   'Karim', 'Ben Salem', Role.LOGISTIC_ADMIN,   transfood);
  const expedAdmin = await makeUser('admin@roseblanche.tn', 'Fatma', 'Gharbi',    Role.EXPEDITEUR_ADMIN, rbSA);

  console.log('✅  Comptes de base créés (SUPER_ADMIN, LOGISTIC_ADMIN, EXPEDITEUR_ADMIN)');

  // ═══════════════════════════════════════════════════════════════════════════
  // 3.  SOCIÉTÉS DE LIVRAISON + CAMIONS + CHAUFFEURS  (sous TransFood)
  // ═══════════════════════════════════════════════════════════════════════════

  const makeDC = (nom: string, adresse: string, tel: string) =>
    upsert(dcRepo, { nom } as any, () => ({ nom, adresse, telephone: tel, company: transfood }));

  const safrat   = await makeDC('SAFRAT Transport',       'Rue de la Mecque, Sfax',       '+216 74 111 222');
  const tunisExp = await makeDC('TunisExpress Logistique','Avenue Bourguiba, Sousse',      '+216 73 333 444');
  const maghreb  = await makeDC('Maghreb Transit',        'Zone Logistique, Tunis 2036',   '+216 71 222 333');
  console.log(`✅  3 sociétés de livraison`);

  const makeTruck = (mat: string, tonnage: number, pal: number, type: string, dc: DeliveryCompany) =>
    upsert(truckRepo, { matricule: mat } as any, () => ({ matricule: mat, capaciteTonnage: tonnage, capacitePalettes: pal, type, isActive: true, deliveryCompany: dc }));

  const trucks = [
    await makeTruck('247 TUN 1234', 24, 33, 'Semi-remorque',   safrat),    // 0
    await makeTruck('189 TUN 5678', 20, 28, 'Plateau',          safrat),    // 1
    await makeTruck('150 TUN 9012', 15, 20, 'Fourgon',          safrat),    // 2
    await makeTruck('320 TUN 3333', 32, 0,  'Citerne farine',   tunisExp),  // 3
    await makeTruck('280 TUN 4444', 28, 0,  'Citerne semoule',  tunisExp),  // 4
    await makeTruck('410 TUN 7777', 18, 22, 'Frigorifique',     maghreb),   // 5
    await makeTruck('390 TUN 8888', 14, 18, 'Frigorifique',     maghreb),   // 6
    await makeTruck('350 TUN 9999', 10, 14, 'Fourgon frigo',    maghreb),   // 7
    await makeTruck('220 TUN 5555', 22, 30, 'Semi-remorque',    safrat),    // 8
    await makeTruck('180 TUN 6666', 16, 20, 'Plateau bâché',    tunisExp),  // 9
  ];
  console.log(`✅  10 camions`);

  const makeChauffeur = (prenom: string, nom: string, cin: string, permis: string, dc: DeliveryCompany) =>
    upsert(chauffRepo, { cin } as any, () => ({ prenom, nom, cin, permis, telephone: '+216 9' + cin.slice(-7), isActive: true, deliveryCompany: dc }));

  await makeChauffeur('Mohamed',  'Trabelsi', '10203040', 'CAT-C-001', safrat);
  await makeChauffeur('Ahmed',    'Maaloul',  '20304050', 'CAT-C-002', safrat);
  await makeChauffeur('Karim',    'Ben Ali',  '30405060', 'CAT-C-003', safrat);
  await makeChauffeur('Hedi',     'Souissi',  '40506070', 'CAT-C-004', tunisExp);
  await makeChauffeur('Riadh',    'Ferchichi','50607080', 'CAT-C-005', tunisExp);
  await makeChauffeur('Noureddine','Ayari',   '60708090', 'CAT-C-006', tunisExp);
  await makeChauffeur('Slim',     'Belhaj',   '70809010', 'CAT-C-007', maghreb);
  await makeChauffeur('Tarek',    'Mansouri', '80901020', 'CAT-C-008', maghreb);
  await makeChauffeur('Sami',     'Zghal',    '90102030', 'CAT-C-009', maghreb);
  await makeChauffeur('Walid',    'Hamdi',    '01020304', 'CAT-C-010', safrat);
  console.log(`✅  10 chauffeurs\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 4.  SOCIÉTÉ EXPÉDITRICE + FILIÈRES + QUAIS
  // ═══════════════════════════════════════════════════════════════════════════

  const roseBlanche = await upsert(seRepo, { nom: 'Rose Blanche' } as any, () => ({
    nom: 'Rose Blanche',
    code: 'RB',
    couleur: '#e83e8c',
    adresse: 'Zone Industrielle El Agba, Tunis 2086',
    telephone: '+216 71 555 666',
    company: transfood,
    expediteurCompany: rbSA,
  }));
  // Update expediteurCompany if missing
  if (!roseBlanche.expediteurCompany) {
    await seRepo.update(roseBlanche.id, { expediteurCompany: { id: rbSA.id } } as any);
  }
  console.log(`✅  Société expéditrice: ${roseBlanche.nom} (${roseBlanche.code})`);

  const filAMT  = await upsert(filRepo, { code: 'AMT', societeExpeditrice: { id: roseBlanche.id } } as any,
    () => ({ nom: 'Alimentation & Minoterie Tunisie', code: 'AMT', societeExpeditrice: roseBlanche }));
  const filMCSR = await upsert(filRepo, { code: 'MCSR', societeExpeditrice: { id: roseBlanche.id } } as any,
    () => ({ nom: 'Minoterie Centrale du Sahel et du Sahel', code: 'MCSR', societeExpeditrice: roseBlanche }));
  const filPW   = await upsert(filRepo, { code: 'PW', societeExpeditrice: { id: roseBlanche.id } } as any,
    () => ({ nom: 'Pâtes Warda', code: 'PW', societeExpeditrice: roseBlanche }));
  console.log(`✅  3 filières: AMT | MCSR | PW`);

  // Quais
  const makeQuai = (nom: string, filiere: Filiere | null) =>
    upsert(quaiRepo, { nom, societeExpeditrice: { id: roseBlanche.id } } as any, () => ({
      nom, isActive: true, company: null, societeExpeditrice: roseBlanche, filiere,
    }));

  const [qAMT1, qAMT2, qAMT3] = await Promise.all([
    makeQuai('QAMT1', filAMT), makeQuai('QAMT2', filAMT), makeQuai('QAMT3', filAMT),
  ]);
  const [qMCSR1, qMCSR2] = await Promise.all([
    makeQuai('QMCSR1', filMCSR), makeQuai('QMCSR2', filMCSR),
  ]);
  const [qPW1, qPW2, qPW3] = await Promise.all([
    makeQuai('QPW1', filPW), makeQuai('QPW2', filPW), makeQuai('QPW3', filPW),
  ]);
  console.log(`✅  8 quais (3 AMT + 2 MCSR + 3 PW)\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 5.  COMPTES FILIÈRE (FILIERE_ADMIN, MAGASINIER, SECURITE)
  //     créés après les filières pour pouvoir les assigner
  // ═══════════════════════════════════════════════════════════════════════════

  const adminAMT  = await makeUser('admin.amt@roseblanche.tn',  'Amine',    'Hadj Taieb',  Role.FILIERE_ADMIN, rbSA, [filAMT]);
  const adminMCSR = await makeUser('admin.mcsr@roseblanche.tn', 'Sonia',    'Khalfallah',  Role.FILIERE_ADMIN, rbSA, [filMCSR]);
  const adminPW   = await makeUser('admin.pw@roseblanche.tn',   'Houda',    'Bensalem',    Role.FILIERE_ADMIN, rbSA, [filPW]);

  const mag1 = await makeUser('mag1@roseblanche.tn', 'Rachid', 'Dridi',   Role.MAGASINIER, rbSA, [filAMT, filMCSR]);
  const mag2 = await makeUser('mag2@roseblanche.tn', 'Khaled', 'Touati',  Role.MAGASINIER, rbSA, [filPW]);

  const sec1 = await makeUser('sec1@roseblanche.tn', 'Youssef','Chaabane', Role.SECURITE, rbSA, [filAMT, filMCSR]);
  const sec2 = await makeUser('sec2@roseblanche.tn', 'Moez',   'Saidi',   Role.SECURITE, rbSA, [filPW]);

  console.log('✅  7 comptes filière (FILIERE_ADMIN×3, MAGASINIER×2, SECURITE×2)\n');

  // ═══════════════════════════════════════════════════════════════════════════
  // 6.  ARTICLES
  // ═══════════════════════════════════════════════════════════════════════════

  const arts: Record<string, Article> = {};
  for (const a of [
    // AMT
    { code: 'AMT-SPG-500', libelle: 'Spaghetti 500g',          poidsUnitaire: 0.5,  unite: 'Colis'  },
    { code: 'AMT-MAC-500', libelle: 'Macaroni 500g',           poidsUnitaire: 0.5,  unite: 'Colis'  },
    { code: 'AMT-PEN-500', libelle: 'Penne 500g',              poidsUnitaire: 0.5,  unite: 'Colis'  },
    { code: 'AMT-FUS-500', libelle: 'Fusilli 500g',            poidsUnitaire: 0.5,  unite: 'Colis'  },
    // MCSR
    { code: 'MCSR-SG-1KG', libelle: 'Semoule Grossière 1kg',  poidsUnitaire: 1.0,  unite: 'Sac'    },
    { code: 'MCSR-SF-1KG', libelle: 'Semoule Fine 1kg',       poidsUnitaire: 1.0,  unite: 'Sac'    },
    { code: 'MCSR-SM-5KG', libelle: 'Semoule Moyenne 5kg',    poidsUnitaire: 5.0,  unite: 'Sac'    },
    // PW
    { code: 'PW-SPG-500',  libelle: 'Spaghetti Warda 500g',   poidsUnitaire: 0.5,  unite: 'Colis'  },
    { code: 'PW-FID-500',  libelle: 'Fidée Warda 500g',       poidsUnitaire: 0.5,  unite: 'Colis'  },
    { code: 'PW-CCS-1KG',  libelle: 'Couscous Warda 1kg',     poidsUnitaire: 1.0,  unite: 'Sachet' },
  ]) {
    arts[a.code] = await upsert(artRepo, { code: a.code } as any, () => a);
  }
  console.log(`✅  10 articles (AMT×4 | MCSR×3 | PW×3)\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 7.  BONS DE LIVRAISON (30 au total)
  // ═══════════════════════════════════════════════════════════════════════════

  const makeBL = async (params: {
    date: string;
    filiere: Filiere;
    client: string;
    dest: string;
    adresse: string;
    type: TypeChargement;
    pal: number;
    statut: BlStatus;
    lignes: { code: string; qte: number }[];
    ordreChargement?: number;
  }): Promise<BonLivraison> => {
    const numero = blRef();
    const existing = await blRepo.findOne({ where: { numeroBl: numero } });
    if (existing) return existing;
    const tonnage = params.lignes.reduce((s, l) => s + (arts[l.code]?.poidsUnitaire ?? 0) * l.qte, 0);
    const bl = await blRepo.save(blRepo.create({
      numeroBl: numero,
      clientNom: params.client,
      clientAdresse: params.adresse,
      origine: 'Tunis — El Agba',
      destination: params.dest,
      typeChargement: params.type,
      tonnageTotal: Math.round(tonnage * 100) / 100,
      nombrePalettes: params.pal,
      statut: params.statut,
      datelivraison: new Date(params.date),
      ordreChargement: params.ordreChargement ?? null,
      company: transfood,
      societeExpeditrice: roseBlanche,
      filiere: params.filiere,
    }));
    for (const l of params.lignes) {
      const art = arts[l.code];
      if (!art) continue;
      await blaRepo.save(blaRepo.create({
        bonLivraison: bl as any,
        article: art,
        quantite: l.qte,
        poidsTotal: Math.round(art.poidsUnitaire * l.qte * 100) / 100,
      }));
    }
    return bl as BonLivraison;
  };

  console.log('📦  Création des BLs...\n');

  // ── AUJOURD'HUI — BLs qui seront dans les plans de chargement ─────────────

  // Plan 1 : Semi-remorque 247 TUN 1234 — AMT × 2 BLs (IDLE / WAITING)
  const t1bl1 = await makeBL({ date: TODAY, filiere: filAMT, client: 'Carrefour Sfax',       dest: 'Sfax',    adresse: 'Route Nationale 1, Sfax 3000',           type: TypeChargement.PALETTE, pal: 14, statut: BlStatus.VALIDATED, ordreChargement: 1, lignes: [{ code: 'AMT-SPG-500', qte: 6000 }, { code: 'AMT-MAC-500', qte: 4000 }] });
  const t1bl2 = await makeBL({ date: TODAY, filiere: filAMT, client: 'Grossiste Sfax Nord',  dest: 'Sfax',    adresse: 'Zone Commerciale Thyna, Sfax',            type: TypeChargement.PALETTE, pal: 8,  statut: BlStatus.VALIDATED, ordreChargement: 2, lignes: [{ code: 'AMT-PEN-500', qte: 4000 }, { code: 'AMT-FUS-500', qte: 2000 }] });

  // Plan 2 : Plateau 189 TUN 5678 — MCSR × 2 BLs (IDLE / WAITING)
  const t2bl1 = await makeBL({ date: TODAY, filiere: filMCSR, client: 'Minoterie El Amal',   dest: 'Sousse',  adresse: 'Zone Industrielle, Kalaa Kebira 4060',   type: TypeChargement.VRAC,    pal: 0,  statut: BlStatus.VALIDATED, ordreChargement: 1, lignes: [{ code: 'MCSR-SG-1KG', qte: 5000 }, { code: 'MCSR-SF-1KG', qte: 4000 }] });
  const t2bl2 = await makeBL({ date: TODAY, filiere: filMCSR, client: 'Boulangerie El Hana', dest: 'Sousse',  adresse: 'Rue du Commerce, Hammam-Sousse 4011',     type: TypeChargement.VRAC,    pal: 0,  statut: BlStatus.VALIDATED, ordreChargement: 2, lignes: [{ code: 'MCSR-SF-1KG', qte: 3000 }, { code: 'MCSR-SM-5KG', qte: 800 }] });

  // Plan 3 : Fourgon 150 TUN 9012 — PW × 2 BLs (IDLE / WAITING)
  const t3bl1 = await makeBL({ date: TODAY, filiere: filPW, client: 'Épicerie Monastir',      dest: 'Monastir',adresse: 'Centre Ville, Monastir 5000',            type: TypeChargement.PALETTE, pal: 10, statut: BlStatus.VALIDATED, ordreChargement: 1, lignes: [{ code: 'PW-SPG-500',  qte: 5000 }, { code: 'PW-FID-500',  qte: 3000 }] });
  const t3bl2 = await makeBL({ date: TODAY, filiere: filPW, client: 'Supermarché Monastir',   dest: 'Monastir',adresse: 'Rue Ibn Khaldoun, Monastir 5000',         type: TypeChargement.PALETTE, pal: 6,  statut: BlStatus.VALIDATED, ordreChargement: 2, lignes: [{ code: 'PW-CCS-1KG',  qte: 4000 }] });

  // Plan 4 : Citerne 320 TUN 3333 — MCSR × 2 BLs (CALLED / quai QMCSR1)
  const t4bl1 = await makeBL({ date: TODAY, filiere: filMCSR, client: 'Moulin du Centre',     dest: 'Kairouan',adresse: 'Souk El Ahad, Kairouan 3100',            type: TypeChargement.CITERNE, pal: 0,  statut: BlStatus.VALIDATED, ordreChargement: 1, lignes: [{ code: 'MCSR-SG-1KG', qte: 8000 }, { code: 'MCSR-SF-1KG', qte: 6000 }] });
  const t4bl2 = await makeBL({ date: TODAY, filiere: filMCSR, client: 'Minoterie Faouzi',     dest: 'Nabeul',  adresse: 'Zone Artisanale, Nabeul 8000',           type: TypeChargement.CITERNE, pal: 0,  statut: BlStatus.VALIDATED, ordreChargement: 2, lignes: [{ code: 'MCSR-SM-5KG', qte: 5000 }] });

  // Plan 5 : Semi-remorque 220 TUN 5555 — AMT × 2 + PW × 1 BL (CALLED / quai QAMT1)
  const t5bl1 = await makeBL({ date: TODAY, filiere: filAMT, client: 'Hypermarché Géant Lac', dest: 'Tunis',   adresse: 'Les Berges du Lac, Tunis 2045',          type: TypeChargement.PALETTE, pal: 18, statut: BlStatus.VALIDATED, ordreChargement: 1, lignes: [{ code: 'AMT-SPG-500', qte: 8000 }, { code: 'AMT-MAC-500', qte: 6000 }] });
  const t5bl2 = await makeBL({ date: TODAY, filiere: filAMT, client: 'Monoprix Lac',          dest: 'Tunis',   adresse: 'Avenue Habib Bourguiba, Tunis',          type: TypeChargement.PALETTE, pal: 10, statut: BlStatus.VALIDATED, ordreChargement: 2, lignes: [{ code: 'AMT-PEN-500', qte: 5000 }, { code: 'AMT-FUS-500', qte: 3000 }] });
  const t5bl3 = await makeBL({ date: TODAY, filiere: filPW,  client: 'Carrefour Tunis City',  dest: 'Tunis',   adresse: 'Centre Ville, Tunis 1000',              type: TypeChargement.PALETTE, pal: 8,  statut: BlStatus.VALIDATED, ordreChargement: 3, lignes: [{ code: 'PW-SPG-500',  qte: 4000 }, { code: 'PW-CCS-1KG', qte: 2000 }] });

  // Plan 6 : Plateau 189 TUN 5678 (réutilisé pour Bizerte) — AMT × 2 BLs (ENTERED / IN_PROGRESS / QAMT2)
  const t6bl1 = await makeBL({ date: TODAY, filiere: filAMT, client: 'Grossiste Bizerte Nord',dest: 'Bizerte', adresse: 'Menzel Bourguiba, Bizerte 7050',         type: TypeChargement.PALETTE, pal: 20, statut: BlStatus.LOADED,     ordreChargement: 1, lignes: [{ code: 'AMT-SPG-500', qte: 9000 }, { code: 'AMT-FUS-500', qte: 5000 }] });
  const t6bl2 = await makeBL({ date: TODAY, filiere: filAMT, client: 'Épicerie Mateur',       dest: 'Bizerte', adresse: 'Rue de la Gare, Mateur 7030',           type: TypeChargement.PALETTE, pal: 8,  statut: BlStatus.LOADED,     ordreChargement: 2, lignes: [{ code: 'AMT-MAC-500', qte: 4000 }] });

  // Plan 7 : Citerne 280 TUN 4444 — MCSR × 2 BLs (ENTERED / IN_PROGRESS / QMCSR2)
  const t7bl1 = await makeBL({ date: TODAY, filiere: filMCSR, client: 'Moulin El Faouzi Gafsa',dest: 'Gafsa',  adresse: 'Zone Industrielle, Gafsa 2100',         type: TypeChargement.VRAC,    pal: 0,  statut: BlStatus.LOADED,     ordreChargement: 1, lignes: [{ code: 'MCSR-SG-1KG', qte: 10000}, { code: 'MCSR-SF-1KG', qte: 8000 }] });
  const t7bl2 = await makeBL({ date: TODAY, filiere: filMCSR, client: 'Entrepôt Sud Gabès',   dest: 'Gabès',   adresse: 'Zone Chimique, Port de Gabès',          type: TypeChargement.VRAC,    pal: 0,  statut: BlStatus.LOADED,     ordreChargement: 2, lignes: [{ code: 'MCSR-SM-5KG', qte: 2000 }] });

  // Plan 8 : Frigorifique 410 TUN 7777 — PW × 2 BLs (ENTERED / PAUSED / QPW1)
  const t8bl1 = await makeBL({ date: TODAY, filiere: filPW,  client: 'Supermarché Sfax Mall', dest: 'Sfax',    adresse: 'Sfax Mall, Route Nationale 1',          type: TypeChargement.PALETTE, pal: 12, statut: BlStatus.LOADED,     ordreChargement: 1, lignes: [{ code: 'PW-SPG-500',  qte: 6000 }, { code: 'PW-FID-500',  qte: 4000 }] });
  const t8bl2 = await makeBL({ date: TODAY, filiere: filPW,  client: 'Magasin Médina Sfax',   dest: 'Sfax',    adresse: 'Médina, Sfax 3000',                     type: TypeChargement.PALETTE, pal: 8,  statut: BlStatus.LOADED,     ordreChargement: 2, lignes: [{ code: 'PW-CCS-1KG',  qte: 5000 }] });

  // Plan 9 : Fourgon frigo 350 TUN 9999 — AMT + MCSR × 2 BLs (EXITED / DONE)
  const t9bl1 = await makeBL({ date: TODAY, filiere: filAMT,  client: 'BioFrais Nabeul',       dest: 'Nabeul',  adresse: 'Zone Artisanale, Nabeul 8000',          type: TypeChargement.FRIGO,   pal: 6,  statut: BlStatus.DELIVERED,  ordreChargement: 1, lignes: [{ code: 'AMT-SPG-500', qte: 3000 }] });
  const t9bl2 = await makeBL({ date: TODAY, filiere: filMCSR, client: 'Distributeur Nabeul',   dest: 'Nabeul',  adresse: 'Route de Tunis, Nabeul',                type: TypeChargement.VRAC,    pal: 0,  statut: BlStatus.DELIVERED,  ordreChargement: 2, lignes: [{ code: 'MCSR-SG-1KG', qte: 4000 }] });

  // Plan 10 : Frigorifique 390 TUN 8888 — PW × 2 BLs (EXITED / DONE)
  const t10bl1 = await makeBL({ date: TODAY, filiere: filPW,  client: 'Épicerie El Amal Tunis',dest: 'Tunis',   adresse: 'Rue de Marseille, Tunis 1000',          type: TypeChargement.PALETTE, pal: 14, statut: BlStatus.DELIVERED,  ordreChargement: 1, lignes: [{ code: 'PW-SPG-500',  qte: 7000 }, { code: 'PW-FID-500',  qte: 5000 }] });
  const t10bl2 = await makeBL({ date: TODAY, filiere: filPW,  client: 'Grossiste Ariana',       dest: 'Tunis',   adresse: 'Avenue Habib Thameur, Ariana 2080',     type: TypeChargement.PALETTE, pal: 8,  statut: BlStatus.DELIVERED,  ordreChargement: 2, lignes: [{ code: 'PW-CCS-1KG',  qte: 6000 }] });

  // ── HIER — historique des plans (BLs DELIVERED)  ──────────────────────────

  const y1bl1 = await makeBL({ date: YESTERDAY, filiere: filAMT,  client: 'Marché Central Kairouan', dest: 'Kairouan', adresse: 'Souk El Ahad, Kairouan',    type: TypeChargement.PALETTE, pal: 12, statut: BlStatus.DELIVERED, lignes: [{ code: 'AMT-SPG-500', qte: 5000 }, { code: 'AMT-MAC-500', qte: 3000 }] });
  const y1bl2 = await makeBL({ date: YESTERDAY, filiere: filMCSR, client: 'Moulin Sousse',           dest: 'Sousse',   adresse: 'Route El Ain, Sousse',       type: TypeChargement.VRAC,    pal: 0,  statut: BlStatus.DELIVERED, lignes: [{ code: 'MCSR-SG-1KG', qte: 7000 }] });
  const y1bl3 = await makeBL({ date: YESTERDAY, filiere: filPW,   client: 'Hypermarché Sfax',        dest: 'Sfax',     adresse: 'Route Nationale 1, Sfax',    type: TypeChargement.PALETTE, pal: 16, statut: BlStatus.DELIVERED, lignes: [{ code: 'PW-SPG-500',  qte: 8000 }, { code: 'PW-FID-500', qte: 4000 }] });
  const y2bl1 = await makeBL({ date: YESTERDAY, filiere: filAMT,  client: 'Grossiste Nabeul',        dest: 'Nabeul',   adresse: 'Zone Artisanale, Nabeul',    type: TypeChargement.PALETTE, pal: 10, statut: BlStatus.DELIVERED, lignes: [{ code: 'AMT-PEN-500', qte: 5000 }, { code: 'AMT-FUS-500', qte: 3000 }] });
  const y2bl2 = await makeBL({ date: YESTERDAY, filiere: filMCSR, client: 'Moulin Bizerte',          dest: 'Bizerte',  adresse: 'Port de Bizerte',            type: TypeChargement.VRAC,    pal: 0,  statut: BlStatus.DELIVERED, lignes: [{ code: 'MCSR-SF-1KG', qte: 6000 }] });
  const y2bl3 = await makeBL({ date: YESTERDAY, filiere: filPW,   client: 'Monoprix Monastir',       dest: 'Monastir', adresse: 'Centre Ville, Monastir',     type: TypeChargement.PALETTE, pal: 8,  statut: BlStatus.DELIVERED, lignes: [{ code: 'PW-CCS-1KG',  qte: 5000 }] });

  // ── DEMAIN — BLs futurs (VALIDATED, pas encore dans un plan) ─────────────

  await makeBL({ date: TOMORROW, filiere: filAMT,  client: 'Distributeur Gafsa',  dest: 'Gafsa',     adresse: 'Avenue Bourguiba, Gafsa 2100',     type: TypeChargement.PALETTE, pal: 12, statut: BlStatus.VALIDATED, lignes: [{ code: 'AMT-SPG-500', qte: 5000 }, { code: 'AMT-MAC-500', qte: 3000 }] });
  await makeBL({ date: TOMORROW, filiere: filAMT,  client: 'Épicerie Tataouine',  dest: 'Tataouine', adresse: 'Centre Ville, Tataouine 3200',     type: TypeChargement.PALETTE, pal: 8,  statut: BlStatus.VALIDATED, lignes: [{ code: 'AMT-FUS-500', qte: 4000 }] });
  await makeBL({ date: TOMORROW, filiere: filMCSR, client: 'Moulin El Hana',      dest: 'Sousse',    adresse: 'Zone Industrielle, Sousse',        type: TypeChargement.VRAC,    pal: 0,  statut: BlStatus.VALIDATED, lignes: [{ code: 'MCSR-SG-1KG', qte: 8000 }, { code: 'MCSR-SF-1KG', qte: 5000 }] });
  await makeBL({ date: TOMORROW, filiere: filMCSR, client: 'Boulangerie Nabeul',  dest: 'Nabeul',    adresse: 'Route de Tunis, Nabeul',           type: TypeChargement.CITERNE, pal: 0,  statut: BlStatus.VALIDATED, lignes: [{ code: 'MCSR-SM-5KG', qte: 3000 }] });
  await makeBL({ date: TOMORROW, filiere: filPW,   client: 'Carrefour Mahdia',    dest: 'Mahdia',    adresse: 'Port de Mahdia, Mahdia 5100',      type: TypeChargement.PALETTE, pal: 10, statut: BlStatus.VALIDATED, lignes: [{ code: 'PW-SPG-500',  qte: 5000 }, { code: 'PW-FID-500', qte: 3000 }] });
  await makeBL({ date: TOMORROW, filiere: filPW,   client: 'Épicerie Tozeur',     dest: 'Tozeur',    adresse: 'Centre Ville, Tozeur 2200',        type: TypeChargement.PALETTE, pal: 6,  statut: BlStatus.VALIDATED, lignes: [{ code: 'PW-CCS-1KG',  qte: 4000 }] });

  // ── SEMAINE PROCHAINE — BLs brouillons (DRAFT) ──────────────────────────

  await makeBL({ date: NEXT_WEEK, filiere: filAMT,  client: 'Magasin Sud Médenine', dest: 'Médenine',  adresse: 'Avenue de la République, Médenine', type: TypeChargement.PALETTE, pal: 10, statut: BlStatus.DRAFT, lignes: [{ code: 'AMT-SPG-500', qte: 5000 }] });
  await makeBL({ date: NEXT_WEEK, filiere: filMCSR, client: 'Minoterie Tozeur',     dest: 'Tozeur',    adresse: 'Zone Artisanale, Tozeur',          type: TypeChargement.VRAC,    pal: 0,  statut: BlStatus.DRAFT, lignes: [{ code: 'MCSR-SG-1KG', qte: 6000 }] });
  await makeBL({ date: NEXT_WEEK, filiere: filPW,   client: 'Épicerie Médenine',    dest: 'Médenine',  adresse: 'Rue du Commerce, Médenine',        type: TypeChargement.PALETTE, pal: 8,  statut: BlStatus.DRAFT, lignes: [{ code: 'PW-SPG-500',  qte: 4000 }, { code: 'PW-CCS-1KG', qte: 2000 }] });

  console.log('✅  30 BLs créés (aujourd\'hui×20 | hier×6 | demain×6 | semaine prochaine×3)\n');

  // ═══════════════════════════════════════════════════════════════════════════
  // 8.  PLANS DE CHARGEMENT — aujourd'hui (10 plans, tousétats)
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('🚛  Création des plans de chargement...\n');

  const makePlan = async (params: {
    truck: Truck;
    bls: BonLivraison[];
    heureArrivee: string;
    entryStatus: string;
    loadingStatus: string;
    quai?: string;
    date?: string;
    isValidated?: boolean;
  }): Promise<LoadingPlan> => {
    const date = params.date ?? TODAY;
    const tonnage   = params.bls.reduce((s, b) => s + Number(b.tonnageTotal ?? 0), 0);
    const palettes  = params.bls.reduce((s, b) => s + Number(b.nombrePalettes ?? 0), 0);
    const reference = ref();
    const plan = await planRepo.save(planRepo.create({
      reference,
      dateLivraison: new Date(date),
      tonnageCharge: Math.round(tonnage * 100) / 100,
      palettesChargees: palettes,
      isValidated: params.isValidated ?? true,
      heureArrivee: params.heureArrivee,
      loadingStatus: params.loadingStatus,
      entryStatus: params.entryStatus,
      quai: params.quai ?? undefined,
      logistiqueCompanyId: transfood.id,
      validatedBy: respLogist,
      truck: params.truck,
    }));
    // Attacher les BLs au plan
    for (const bl of params.bls) {
      await blRepo.update(bl.id, { loadingPlan: { id: plan.id } } as any);
    }
    return plan;
  };

  // Plan 1 — IDLE / WAITING  (en attente, camion non appelé)
  await makePlan({ truck: trucks[0], heureArrivee: '07:30', entryStatus: 'IDLE', loadingStatus: 'WAITING', bls: [t1bl1, t1bl2] });

  // Plan 2 — IDLE / WAITING
  await makePlan({ truck: trucks[1], heureArrivee: '07:45', entryStatus: 'IDLE', loadingStatus: 'WAITING', bls: [t2bl1, t2bl2] });

  // Plan 3 — IDLE / WAITING
  await makePlan({ truck: trucks[2], heureArrivee: '08:00', entryStatus: 'IDLE', loadingStatus: 'WAITING', bls: [t3bl1, t3bl2] });

  // Plan 4 — CALLED / WAITING  (appelé par sécurité, en attente d'entrée)
  await makePlan({ truck: trucks[3], heureArrivee: '08:15', entryStatus: 'CALLED', loadingStatus: 'WAITING', quai: 'QMCSR1', bls: [t4bl1, t4bl2] });

  // Plan 5 — CALLED / WAITING
  await makePlan({ truck: trucks[8], heureArrivee: '08:30', entryStatus: 'CALLED', loadingStatus: 'WAITING', quai: 'QAMT1',  bls: [t5bl1, t5bl2, t5bl3] });

  // Plan 6 — ENTERED / IN_PROGRESS  (entré, chargement en cours)
  await makePlan({ truck: trucks[4], heureArrivee: '06:00', entryStatus: 'ENTERED', loadingStatus: 'IN_PROGRESS', quai: 'QMCSR2', bls: [t7bl1, t7bl2] });

  // Plan 7 — ENTERED / IN_PROGRESS
  await makePlan({ truck: trucks[9], heureArrivee: '06:20', entryStatus: 'ENTERED', loadingStatus: 'IN_PROGRESS', quai: 'QAMT2',  bls: [t6bl1, t6bl2] });

  // Plan 8 — ENTERED / PAUSED  (chargement mis en pause)
  await makePlan({ truck: trucks[5], heureArrivee: '05:45', entryStatus: 'ENTERED', loadingStatus: 'PAUSED', quai: 'QPW1', bls: [t8bl1, t8bl2] });

  // Plan 9 — EXITED / DONE  (chargement terminé, camion sorti)
  await makePlan({ truck: trucks[6], heureArrivee: '05:00', entryStatus: 'EXITED', loadingStatus: 'DONE', quai: 'QAMT3', bls: [t9bl1, t9bl2] });

  // Plan 10 — EXITED / DONE
  await makePlan({ truck: trucks[7], heureArrivee: '04:30', entryStatus: 'EXITED', loadingStatus: 'DONE', quai: 'QPW2',  bls: [t10bl1, t10bl2] });

  console.log('✅  10 plans aujourd\'hui (IDLE×3 | CALLED×2 | IN_PROGRESS×2 | PAUSED×1 | DONE×2)');

  // ── HIER — 5 plans historiques (tous terminés) ─────────────────────────────

  planSeq = 0; // reset pour les refs d'hier
  const refY = () => `PL-${YESTERDAY}-${String(++planSeq).padStart(3, '0')}`;

  const makeHistPlan = async (truck: Truck, bls: BonLivraison[], heure: string, quai: string) => {
    const tonnage  = bls.reduce((s, b) => s + Number(b.tonnageTotal ?? 0), 0);
    const palettes = bls.reduce((s, b) => s + Number(b.nombrePalettes ?? 0), 0);
    const plan = await planRepo.save(planRepo.create({
      reference: refY(),
      dateLivraison: new Date(YESTERDAY),
      tonnageCharge: Math.round(tonnage * 100) / 100,
      palettesChargees: palettes,
      isValidated: true,
      heureArrivee: heure,
      loadingStatus: 'DONE',
      entryStatus: 'EXITED',
      quai,
      logistiqueCompanyId: transfood.id,
      validatedBy: respLogist,
      truck,
    }));
    for (const bl of bls) {
      await blRepo.update(bl.id, { loadingPlan: { id: plan.id } } as any);
    }
    return plan;
  };

  await makeHistPlan(trucks[0], [y1bl1, y1bl2], '07:15', 'QAMT1');
  await makeHistPlan(trucks[1], [y1bl3],         '07:30', 'QPW1');
  await makeHistPlan(trucks[2], [y2bl1, y2bl2], '08:00', 'QAMT2');
  await makeHistPlan(trucks[3], [y2bl3],         '07:45', 'QMCSR1');
  await makeHistPlan(trucks[4], [y2bl2],         '06:30', 'QMCSR2');

  console.log('✅  5 plans hier (tous DONE/EXITED — historique)\n');

  // ═══════════════════════════════════════════════════════════════════════════
  // RÉSUMÉ
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('═'.repeat(65));
  console.log('🎉  Seeder Démo Complet terminé !');
  console.log('═'.repeat(65));
  console.log('\n📋  COMPTES (mot de passe : Demo123!)\n');
  console.log('  Rôle               Email                          Portail');
  console.log('  ─────────────────────────────────────────────────────────');
  console.log('  SUPER_ADMIN        admin@tms.com                  /admin');
  console.log('  COMPANY_ADMIN      logistique@tms.com             /');
  console.log('  EXPEDITEUR_ADMIN   admin@roseblanche.tn           /expediteur');
  console.log('  FILIERE_ADMIN AMT  admin.amt@roseblanche.tn       /filiere-admin');
  console.log('  FILIERE_ADMIN MCSR admin.mcsr@roseblanche.tn      /filiere-admin');
  console.log('  FILIERE_ADMIN PW   admin.pw@roseblanche.tn        /filiere-admin');
  console.log('  MAGASINIER (AMT+MCSR) mag1@roseblanche.tn         /magasin/dashboard');
  console.log('  MAGASINIER (PW)    mag2@roseblanche.tn            /magasin/dashboard');
  console.log('  SECURITE (AMT+MCSR) sec1@roseblanche.tn           /securite/suivi');
  console.log('  SECURITE (PW)      sec2@roseblanche.tn            /securite/suivi');
  console.log('  TRANSPORT_ADMIN    admin@rapidtransport.tn        /transport-portal');
  console.log('  EXPLOITANT         exploit@rapidtransport.tn      /transport-portal');
  console.log('\n📊  DONNÉES\n');
  console.log('  10 camions  |  10 chauffeurs  |  3 sociétés de livraison');
  console.log('  1 societe expéditrice  |  3 filières  |  8 quais');
  console.log('  10 articles  |  30 BLs  |  15 plans de chargement');
  console.log('\n🚛  PLANS AUJOURD\'HUI\n');
  console.log('  247 TUN 1234  → IDLE/WAITING    (en attente)');
  console.log('  189 TUN 5678  → IDLE/WAITING    (en attente)');
  console.log('  150 TUN 9012  → IDLE/WAITING    (en attente)');
  console.log('  320 TUN 3333  → CALLED/QMCSR1   (appelé)');
  console.log('  220 TUN 5555  → CALLED/QAMT1    (appelé)');
  console.log('  280 TUN 4444  → ENTERED/QMCSR2  (en chargement)');
  console.log('  180 TUN 6666  → ENTERED/QAMT2   (en chargement)');
  console.log('  410 TUN 7777  → PAUSED/QPW1     (en pause)');
  console.log('  390 TUN 8888  → EXITED/QAMT3    (terminé)');
  console.log('  350 TUN 9999  → EXITED/QPW2     (terminé)');
  console.log('═'.repeat(65) + '\n');

  await app.close();
}

seed().catch((err) => {
  console.error('❌  Erreur :', err.message || err);
  process.exit(1);
});
