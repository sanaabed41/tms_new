/**
 * Seeder — Scénario Rose Blanche (multi-filières dans un même camion)
 *
 * Ce seeder illustre le cas concret suivant :
 *   - La société expéditrice "Rose Blanche" produit 3 filières :
 *       • Pâte Blanche  (spaghetti, macaroni, fusilli, penne)
 *       • MCSR          (semoule grossière, fine, moyenne)
 *       • Couscous      (couscous fin, moyen, gros)
 *
 *   - Elle génère des BL pour chaque filière, vers plusieurs villes tunisiennes.
 *
 *   - Un camion PEUT embarquer des BL de PLUSIEURS filières de la MÊME société.
 *     Ex : camion → Sfax avec : BL Pâte Blanche + BL MCSR + BL Couscous
 *
 *   - Certains camions sont sans capacité palette (transport en vrac/citerne).
 *
 *   - Tous les BL sont en statut VALIDATED → prêts à glisser dans le planning.
 *
 * Lancer : npx ts-node -r tsconfig-paths/register src/seed-rose-blanche.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './companies/company.entity';
import { User } from './users/user.entity';
import { Role } from './common/enums/role.enum';
import { DeliveryCompany } from './delivery-companies/delivery-company.entity';
import { Truck } from './trucks/truck.entity';
import { Article } from './articles/article.entity';
import { SocieteExpeditrice } from './expediteurs/societe-expeditrice.entity';
import { Filiere } from './expediteurs/filiere.entity';
import { BonLivraison, TypeChargement } from './bons-livraison/bon-livraison.entity';
import { BlArticle } from './bons-livraison/bl-article.entity';
import { BlStatus } from './common/enums/bl-status.enum';
import * as bcrypt from 'bcryptjs';

let blSeq = 2000;
const nextBl = () => `RB-${String(++blSeq).padStart(4, '0')}`;

async function findOrCreate<T>(
  repo: Repository<T>,
  where: Partial<T>,
  creator: () => T,
): Promise<T> {
  const found = await repo.findOne({ where: where as any });
  if (found) return found;
  const entity = creator();
  return repo.save(entity as any);
}

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });

  const companyRepo  = app.get<Repository<Company>>(getRepositoryToken(Company));
  const userRepo     = app.get<Repository<User>>(getRepositoryToken(User));
  const dcRepo       = app.get<Repository<DeliveryCompany>>(getRepositoryToken(DeliveryCompany));
  const truckRepo    = app.get<Repository<Truck>>(getRepositoryToken(Truck));
  const artRepo      = app.get<Repository<Article>>(getRepositoryToken(Article));
  const seRepo       = app.get<Repository<SocieteExpeditrice>>(getRepositoryToken(SocieteExpeditrice));
  const filRepo      = app.get<Repository<Filiere>>(getRepositoryToken(Filiere));
  const blRepo       = app.get<Repository<BonLivraison>>(getRepositoryToken(BonLivraison));
  const blaRepo      = app.get<Repository<BlArticle>>(getRepositoryToken(BlArticle));

  console.log('\n🌱  Seeder Rose Blanche — démarrage...\n');

  // ── 1. Company (tenant logistique) ──────────────────────────────────────────
  const company = await findOrCreate(
    companyRepo,
    { nom: "Grain d'Or SARL" } as any,
    () => companyRepo.create({
      nom: "Grain d'Or SARL",
      adresse: 'Zone Industrielle El Agba, Tunis 2036',
      telephone: '+216 71 000 001',
      isActive: true,
    }),
  );
  console.log(`✅  Company        : ${company.nom}`);

  // ── 2. Utilisateur COMPANY_ADMIN ────────────────────────────────────────────
  const adminEmail = 'logistique@graindor.tn';
  const existing = await userRepo.findOne({ where: { email: adminEmail } });
  if (!existing) {
    const admin = userRepo.create({
      nom: 'Ben Salah',
      prenom: 'Karim',
      email: adminEmail,
      password: await bcrypt.hash('Admin1234!', 10),
      role: Role.COMPANY_ADMIN,
      isActive: true,
      company,
    });
    await userRepo.save(admin);
    console.log(`✅  Resp. Logistique : ${adminEmail} / Admin1234!`);
  } else {
    console.log(`ℹ️   Utilisateur existant : ${adminEmail}`);
  }

  // ── 3. Sociétés de livraison ────────────────────────────────────────────────

  // SAFRAT — camions avec palettes (transport palette spaghetti, couscous)
  const dcSafrat = await findOrCreate(
    dcRepo,
    { nom: 'SAFRAT Transport' } as any,
    () => dcRepo.create({
      nom: 'SAFRAT Transport',
      adresse: 'Rue de la Mecque, Sfax 3000',
      telephone: '+216 74 111 222',
      company,
    }),
  );

  // TunisExpress — camions SANS palettes (vrac farine/semoule en citerne)
  const dcTunisEx = await findOrCreate(
    dcRepo,
    { nom: 'TunisExpress Logistique' } as any,
    () => dcRepo.create({
      nom: 'TunisExpress Logistique',
      adresse: 'Avenue Bourguiba, Sousse 4000',
      telephone: '+216 73 333 444',
      company,
    }),
  );

  // ── 4. Camions ──────────────────────────────────────────────────────────────

  // SAFRAT : 3 camions AVEC palettes
  const safratSpecs = [
    { matricule: '247 TUN 1234', capaciteTonnage: 24, capacitePalettes: 33, type: 'Semi-remorque' },
    { matricule: '189 TUN 5678', capaciteTonnage: 20, capacitePalettes: 28, type: 'Plateau'       },
    { matricule: '150 TUN 9012', capaciteTonnage: 15, capacitePalettes: 20, type: 'Fourgon'       },
  ];
  for (const spec of safratSpecs) {
    await findOrCreate(
      truckRepo,
      { matricule: spec.matricule } as any,
      () => truckRepo.create({ ...spec, isActive: true, deliveryCompany: dcSafrat }),
    );
  }
  console.log(`✅  SAFRAT (3 camions avec palettes — semi-remorque, plateau, fourgon)`);

  // TunisExpress : 2 camions citerne SANS palettes (vrac semoule/farine)
  const texSpecs = [
    { matricule: '320 TUN 3333', capaciteTonnage: 32, capacitePalettes: 0, type: 'Citerne farine' },
    { matricule: '280 TUN 4444', capaciteTonnage: 28, capacitePalettes: 0, type: 'Citerne farine' },
  ];
  for (const spec of texSpecs) {
    await findOrCreate(
      truckRepo,
      { matricule: spec.matricule } as any,
      () => truckRepo.create({ ...spec, isActive: true, deliveryCompany: dcTunisEx }),
    );
  }
  console.log(`✅  TunisExpress (2 citernes sans palettes — transport vrac semoule)\n`);

  // ── 5. Articles (produits Rose Blanche, 3 gammes) ───────────────────────────
  const artSpecs = [
    // Pâte Blanche
    { code: 'PB-SPG-500', libelle: 'Spaghetti 500g',        poidsUnitaire: 0.5,  unite: 'Colis' },
    { code: 'PB-MAC-500', libelle: 'Macaroni 500g',         poidsUnitaire: 0.5,  unite: 'Colis' },
    { code: 'PB-FUS-500', libelle: 'Fusilli 500g',          poidsUnitaire: 0.5,  unite: 'Colis' },
    { code: 'PB-PEN-500', libelle: 'Penne 500g',            poidsUnitaire: 0.5,  unite: 'Colis' },
    // MCSR — Semoule
    { code: 'MC-SG-1KG',  libelle: 'Semoule Grossière 1kg', poidsUnitaire: 1.0,  unite: 'Sac'   },
    { code: 'MC-SF-1KG',  libelle: 'Semoule Fine 1kg',      poidsUnitaire: 1.0,  unite: 'Sac'   },
    { code: 'MC-SM-5KG',  libelle: 'Semoule Moyenne 5kg',   poidsUnitaire: 5.0,  unite: 'Sac'   },
    // Couscous
    { code: 'CCS-FIN-1K', libelle: 'Couscous Fin 1kg',      poidsUnitaire: 1.0,  unite: 'Sachet'},
    { code: 'CCS-MOY-1K', libelle: 'Couscous Moyen 1kg',    poidsUnitaire: 1.0,  unite: 'Sachet'},
    { code: 'CCS-GRO-1K', libelle: 'Couscous Gros 1kg',     poidsUnitaire: 1.0,  unite: 'Sachet'},
  ];
  const articles: Record<string, Article> = {};
  for (const spec of artSpecs) {
    articles[spec.code] = await findOrCreate(
      artRepo,
      { code: spec.code } as any,
      () => artRepo.create(spec),
    );
  }
  console.log(`✅  ${artSpecs.length} articles créés (Pâte Blanche + MCSR + Couscous)\n`);

  // ── 6. Société expéditrice : Rose Blanche ───────────────────────────────────
  const roseBlanche = await findOrCreate(
    seRepo,
    { nom: 'Rose Blanche', company: { id: company.id } } as any,
    () => seRepo.create({
      nom: 'Rose Blanche',
      code: 'RB',
      couleur: '#e83e8c',
      adresse: 'Zone Industrielle El Agba, Tunis',
      telephone: '+216 71 555 666',
      company,
    }),
  );
  console.log(`✅  Société expéditrice : Rose Blanche (${roseBlanche.couleur})`);

  // Filières
  const filPate = await findOrCreate(
    filRepo,
    { nom: 'Pâte Blanche', societeExpeditrice: { id: roseBlanche.id } } as any,
    () => filRepo.create({ nom: 'Pâte Blanche', code: 'PB', societeExpeditrice: roseBlanche }),
  );
  const filMcsr = await findOrCreate(
    filRepo,
    { nom: 'MCSR', societeExpeditrice: { id: roseBlanche.id } } as any,
    () => filRepo.create({ nom: 'MCSR', code: 'MCSR', societeExpeditrice: roseBlanche }),
  );
  const filCouscous = await findOrCreate(
    filRepo,
    { nom: 'Couscous', societeExpeditrice: { id: roseBlanche.id } } as any,
    () => filRepo.create({ nom: 'Couscous', code: 'CCS', societeExpeditrice: roseBlanche }),
  );
  console.log(`✅  3 filières : Pâte Blanche (PB) | MCSR | Couscous (CCS)\n`);

  // ── 7. Bons de Livraison ────────────────────────────────────────────────────
  const TODAY = new Date().toISOString().split('T')[0];
  const ORIGINE = 'Tunis — El Agba';

  async function makeBl(params: {
    filiere: Filiere;
    client: string;
    adresse: string;
    destination: string;
    type: TypeChargement;
    palettes: number;
    lignes: { code: string; qte: number }[];
    notes?: string;
  }) {
    const numeroBl = nextBl();
    const already = await blRepo.findOne({ where: { numeroBl } });
    if (already) return already;

    const tonnageTotal = params.lignes.reduce((s, l) => {
      const art = articles[l.code];
      return s + (art ? art.poidsUnitaire * l.qte : 0);
    }, 0);

    const bl = await blRepo.save(blRepo.create({
      numeroBl,
      clientNom: params.client,
      clientAdresse: params.adresse,
      origine: ORIGINE,
      destination: params.destination,
      typeChargement: params.type,
      tonnageTotal: Math.round(tonnageTotal * 100) / 100,
      nombrePalettes: params.palettes,
      statut: BlStatus.VALIDATED,
      datelivraison: new Date(TODAY),
      notes: params.notes || '',
      company,
      societeExpeditrice: roseBlanche,
      filiere: params.filiere,
    }));

    for (const l of params.lignes) {
      const art = articles[l.code];
      if (!art) continue;
      await blaRepo.save(blaRepo.create({
        bonLivraison: bl,
        article: art,
        quantite: l.qte,
        poidsTotal: Math.round(art.poidsUnitaire * l.qte * 100) / 100,
      }));
    }

    return bl;
  }

  console.log('📦  Création des BL...\n');

  // ════════════════════════════════════════════════════════════════════════════
  //  DESTINATION : SFAX — 3 BL de filières différentes → 1 seul camion
  //  Camion cible : 247 TUN 1234 (24T, 33 pal)
  //  Total prévu  : 8T + 6T + 4T = 18T | 12 + 0 + 8 = 20 pal
  // ════════════════════════════════════════════════════════════════════════════
  const bl_sfax_pb = await makeBl({
    filiere: filPate, destination: 'Sfax',
    client: 'Épicerie Moderne Sfax', adresse: 'Rue Farhat Hached, Sfax 3000',
    type: TypeChargement.PALETTE, palettes: 12,
    lignes: [
      { code: 'PB-SPG-500', qte: 4000 }, // 2T
      { code: 'PB-MAC-500', qte: 6000 }, // 3T
      { code: 'PB-FUS-500', qte: 6000 }, // 3T  → total 8T
    ],
  });

  const bl_sfax_mc = await makeBl({
    filiere: filMcsr, destination: 'Sfax',
    client: 'Grossiste du Sud', adresse: 'Zone Commerciale Thyna, Sfax',
    type: TypeChargement.VRAC, palettes: 0,         // ← pas de palettes (semoule vrac)
    lignes: [
      { code: 'MC-SG-1KG', qte: 3000 }, // 3T
      { code: 'MC-SF-1KG', qte: 3000 }, // 3T  → total 6T
    ],
    notes: 'Vrac — prévoir bâche étanche',
  });

  const bl_sfax_ccs = await makeBl({
    filiere: filCouscous, destination: 'Sfax',
    client: 'Supérette Sfaxia', adresse: 'Avenue de la Liberté, Sfax',
    type: TypeChargement.PALETTE, palettes: 8,
    lignes: [
      { code: 'CCS-FIN-1K', qte: 2000 }, // 2T
      { code: 'CCS-MOY-1K', qte: 2000 }, // 2T  → total 4T
    ],
  });

  console.log(`  🟣  [PB]  ${bl_sfax_pb.numeroBl}  Pâte Blanche → Sfax   ${bl_sfax_pb.tonnageTotal}T   12 pal`);
  console.log(`  🟣  [MC]  ${bl_sfax_mc.numeroBl}  MCSR         → Sfax   ${bl_sfax_mc.tonnageTotal}T    0 pal (vrac)`);
  console.log(`  🟣  [CCS] ${bl_sfax_ccs.numeroBl}  Couscous     → Sfax    ${bl_sfax_ccs.tonnageTotal}T    8 pal`);
  console.log(`\n  🚛  Ces 3 BL forment 18T / 20 pal → camion 247 TUN 1234 (24T, 33 pal, 75%)\n`);

  // ════════════════════════════════════════════════════════════════════════════
  //  SOUSSE — BL Pâte Blanche + BL Couscous (2ème exemple multi-filières)
  // ════════════════════════════════════════════════════════════════════════════
  const bl_sousse_pb = await makeBl({
    filiere: filPate, destination: 'Sousse',
    client: 'Carrefour Sousse', adresse: 'Route de Tunis, Sousse',
    type: TypeChargement.PALETTE, palettes: 16,
    lignes: [
      { code: 'PB-SPG-500', qte: 5000 }, // 2.5T
      { code: 'PB-PEN-500', qte: 5000 }, // 2.5T
      { code: 'PB-MAC-500', qte: 3000 }, // 1.5T  → 6.5T
    ],
  });

  const bl_sousse_ccs = await makeBl({
    filiere: filCouscous, destination: 'Sousse',
    client: 'Monoprix Hammam-Sousse', adresse: 'Rue du Commerce, Hammam-Sousse',
    type: TypeChargement.PALETTE, palettes: 10,
    lignes: [
      { code: 'CCS-FIN-1K', qte: 3000 }, // 3T
      { code: 'CCS-GRO-1K', qte: 2500 }, // 2.5T  → 5.5T
    ],
  });

  console.log(`  🟠  [PB]  ${bl_sousse_pb.numeroBl}  Pâte Blanche → Sousse  ${bl_sousse_pb.tonnageTotal}T  16 pal`);
  console.log(`  🟠  [CCS] ${bl_sousse_ccs.numeroBl}  Couscous     → Sousse  ${bl_sousse_ccs.tonnageTotal}T  10 pal`);
  console.log(`\n  🚛  Camion 189 TUN 5678 (20T, 28 pal) → Sousse : 12T / 26 pal (60%)\n`);

  // ════════════════════════════════════════════════════════════════════════════
  //  NABEUL — MCSR vrac (citerne, sans palettes)
  // ════════════════════════════════════════════════════════════════════════════
  const bl_nabeul_mc = await makeBl({
    filiere: filMcsr, destination: 'Nabeul',
    client: 'Minoterie El Faouzi', adresse: 'Zone Artisanale, Nabeul',
    type: TypeChargement.CITERNE, palettes: 0,
    lignes: [
      { code: 'MC-SM-5KG', qte: 5600 }, // 28T — citerne farine
    ],
    notes: 'Transport en citerne — certificat sanitaire obligatoire',
  });
  console.log(`  🔵  [MC]  ${bl_nabeul_mc.numeroBl}  MCSR (citerne) → Nabeul   ${bl_nabeul_mc.tonnageTotal}T`);
  console.log(`  🚛  Camion 320 TUN 3333 (citerne 32T, sans palettes) — transport vrac semoule\n`);

  // ════════════════════════════════════════════════════════════════════════════
  //  BIZERTE — Pâte Blanche (camion plateau)
  // ════════════════════════════════════════════════════════════════════════════
  const bl_bizerte_pb = await makeBl({
    filiere: filPate, destination: 'Bizerte',
    client: 'Grossiste Bizerte Nord', adresse: 'Menzel Bourguiba, Bizerte',
    type: TypeChargement.PALETTE, palettes: 20,
    lignes: [
      { code: 'PB-SPG-500', qte: 8000 }, // 4T
      { code: 'PB-FUS-500', qte: 4000 }, // 2T  → 6T
    ],
  });
  console.log(`  🟢  [PB]  ${bl_bizerte_pb.numeroBl}  Pâte Blanche → Bizerte   ${bl_bizerte_pb.tonnageTotal}T  20 pal`);

  // ════════════════════════════════════════════════════════════════════════════
  //  MONASTIR — 2 filières pour 1 camion
  // ════════════════════════════════════════════════════════════════════════════
  const bl_monastir_pb = await makeBl({
    filiere: filPate, destination: 'Monastir',
    client: 'Épicerie El Mourouj', adresse: 'Centre Ville, Monastir',
    type: TypeChargement.PALETTE, palettes: 6,
    lignes: [
      { code: 'PB-MAC-500', qte: 3000 }, // 1.5T
      { code: 'PB-PEN-500', qte: 3000 }, // 1.5T  → 3T
    ],
  });

  const bl_monastir_ccs = await makeBl({
    filiere: filCouscous, destination: 'Monastir',
    client: 'Supermarché Médina', adresse: 'Rue Ibn Khaldoun, Monastir',
    type: TypeChargement.PALETTE, palettes: 5,
    lignes: [
      { code: 'CCS-MOY-1K', qte: 2000 }, // 2T
      { code: 'CCS-FIN-1K', qte: 1500 }, // 1.5T  → 3.5T
    ],
  });

  console.log(`  🟡  [PB]  ${bl_monastir_pb.numeroBl}  Pâte Blanche → Monastir   ${bl_monastir_pb.tonnageTotal}T   6 pal`);
  console.log(`  🟡  [CCS] ${bl_monastir_ccs.numeroBl}  Couscous     → Monastir   ${bl_monastir_ccs.tonnageTotal}T   5 pal\n`);

  // ════════════════════════════════════════════════════════════════════════════
  //  KAIROUAN — MCSR vrac
  // ════════════════════════════════════════════════════════════════════════════
  const bl_kairouan_mc = await makeBl({
    filiere: filMcsr, destination: 'Kairouan',
    client: 'Marché Central Kairouan', adresse: 'Souk El Ahad, Kairouan',
    type: TypeChargement.VRAC, palettes: 0,
    lignes: [
      { code: 'MC-SG-1KG', qte: 8000 }, // 8T
      { code: 'MC-SF-1KG', qte: 6000 }, // 6T  → 14T
    ],
  });
  console.log(`  🔴  [MC]  ${bl_kairouan_mc.numeroBl}  MCSR (vrac)  → Kairouan  ${bl_kairouan_mc.tonnageTotal}T\n`);

  // ── Résumé final ────────────────────────────────────────────────────────────
  console.log('─'.repeat(66));
  console.log('✅  Seeder Rose Blanche terminé avec succès !');
  console.log('─'.repeat(66));
  console.log('\n📌  Scénario clé à tester dans le planning :\n');
  console.log('  Rose Blanche → Sfax : regrouper ces 3 BL dans 1 camion\n');
  console.log(`  ┌──────────────────────────────────────────────────────────┐`);
  console.log(`  │  Camion : 247 TUN 1234  (SAFRAT, 24T, 33 palettes)      │`);
  console.log(`  │  ─────────────────────────────────────────────────────   │`);
  console.log(`  │  ${bl_sfax_pb.numeroBl}  [Pâte Blanche]  Sfax   8.0T  12 pal  │`);
  console.log(`  │  ${bl_sfax_mc.numeroBl}  [MCSR]          Sfax   6.0T   0 pal  │`);
  console.log(`  │  ${bl_sfax_ccs.numeroBl}  [Couscous]      Sfax   4.0T   8 pal  │`);
  console.log(`  │  ─────────────────────────────────────────────────────   │`);
  console.log(`  │  Total : 18.0T (75%)  ·  20 palettes (60%)              │`);
  console.log(`  └──────────────────────────────────────────────────────────┘`);
  console.log('\n  💡 Les 3 BL sont de filières DIFFÉRENTES mais de la MÊME société.');
  console.log('     → Le camion peut les prendre tous les 3 sans restriction.\n');
  console.log('  Connexion : logistique@graindor.tn  /  Admin1234!\n');
  console.log('  Groupe par "Expéditeur" dans le panel BL pour voir le regroupement.\n');

  await app.close();
}

seed().catch((err) => {
  console.error('❌  Erreur seeder :', err.message);
  process.exit(1);
});
