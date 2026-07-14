/**
 * Seeder — Portail Transport (test complet)
 * ==========================================
 * Prépare les données pour tester TOUTES les fonctionnalités
 * liées à la société de transport.
 *
 * Prérequis : npm run seed:rb-complet
 * Lancer    : cd backend && npm run seed:transport-portal
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  Comptes créés / mis à jour                             │
 * │  LOGISTIC_ADMIN : logistique@transfood.tn  / Demo123!  │
 * │  TRANSPORT_ADMIN: transport@rapidtransport.tn / Demo123!│
 * ├─────────────────────────────────────────────────────────┤
 * │  Fonctionnalités couvertes                              │
 * │  LOGISTIC_ADMIN                                         │
 * │    /transport        → camions disponibles (lecture)    │
 * │    /planning         → planification avec camions dispos│
 * │    /users            → voir l'admin transport           │
 * │  TRANSPORT_ADMIN                                        │
 * │    /transport-portal → flotte (Mes Camions)             │
 * │    /transport-portal/rapport → rapport du jour          │
 * └─────────────────────────────────────────────────────────┘
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Company }             from './companies/company.entity';
import { DeliveryCompany }     from './delivery-companies/delivery-company.entity';
import { Truck }               from './trucks/truck.entity';
import { User }                from './users/user.entity';
import { TruckAvailability }   from './truck-availability/truck-availability.entity';
import { BonLivraison, TypeChargement } from './bons-livraison/bon-livraison.entity';
import { LoadingPlan }         from './loading-plans/loading-plan.entity';
import { SocieteExpeditrice }  from './expediteurs/societe-expeditrice.entity';
import { Role }                from './common/enums/role.enum';
import { BlStatus }            from './common/enums/bl-status.enum';

function today(): string {
  return new Date().toISOString().split('T')[0];
}

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });

  const companyRepo      = app.get<Repository<Company>>(getRepositoryToken(Company));
  const dcRepo           = app.get<Repository<DeliveryCompany>>(getRepositoryToken(DeliveryCompany));
  const truckRepo        = app.get<Repository<Truck>>(getRepositoryToken(Truck));
  const userRepo         = app.get<Repository<User>>(getRepositoryToken(User));
  const availRepo        = app.get<Repository<TruckAvailability>>(getRepositoryToken(TruckAvailability));
  const blRepo           = app.get<Repository<BonLivraison>>(getRepositoryToken(BonLivraison));
  const planRepo         = app.get<Repository<LoadingPlan>>(getRepositoryToken(LoadingPlan));
  const societeRepo      = app.get<Repository<SocieteExpeditrice>>(getRepositoryToken(SocieteExpeditrice));

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║      Seeder — Portail Transport (test complet)          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // ── 1. TransFood ─────────────────────────────────────────────────────────────
  console.log('[1/6] Société logistique...');
  const transfood = await companyRepo.findOne({ where: { nom: 'TransFood' } });
  if (!transfood) {
    console.error('❌  TransFood introuvable — lancez d\'abord : npm run seed:rb-complet');
    await app.close();
    process.exit(1);
  }
  console.log(`  ✓ TransFood trouvé`);

  // ── 2. Société de transport ───────────────────────────────────────────────────
  console.log('\n[2/6] Société de transport...');
  let dc = await dcRepo.findOne({ where: { nom: 'Rapid Transport TN' } });
  if (!dc) {
    dc = await dcRepo.save(dcRepo.create({
      nom: 'Rapid Transport TN',
      adresse: 'Zone Industrielle Charguia, Tunis',
      telephone: '+216 71 234 567',
      isActive: true,
      company: transfood,
    }));
    console.log('  ✓ Société de transport créée : Rapid Transport TN');
  } else {
    console.log('  ✓ Société existante : Rapid Transport TN');
  }

  // ── 3. Camions ───────────────────────────────────────────────────────────────
  console.log('\n[3/6] Camions...');
  const trucksData = [
    { matricule: 'TUN-2301-A', type: 'Frigo',    capaciteTonnage: 20, capacitePalettes: 33 },
    { matricule: 'TUN-1542-B', type: 'Palette',  capaciteTonnage: 24, capacitePalettes: 40 },
    { matricule: 'TUN-8874-C', type: 'Citerne',  capaciteTonnage: 30, capacitePalettes: 0  },
    { matricule: 'TUN-3310-D', type: 'Benne',    capaciteTonnage: 18, capacitePalettes: 0  },
    { matricule: 'TUN-6601-E', type: 'Standard', capaciteTonnage: 12, capacitePalettes: 20 },
  ];

  const trucks: Truck[] = [];
  for (const t of trucksData) {
    let truck = await truckRepo.findOne({ where: { matricule: t.matricule } });
    if (!truck) {
      truck = await truckRepo.save(truckRepo.create({
        ...t,
        isActive: true,
        deliveryCompany: dc,
      }));
      console.log(`  ✓ Camion créé : ${t.matricule} (${t.type} — ${t.capaciteTonnage}T)`);
    } else {
      console.log(`  ✓ Camion existant : ${t.matricule}`);
    }
    trucks.push(truck);
  }

  // ── 4. Compte TRANSPORT_ADMIN ─────────────────────────────────────────────────
  console.log('\n[4/6] Compte TRANSPORT_ADMIN...');
  const transportEmail = 'transport@rapidtransport.tn';
  const hash = await bcrypt.hash('Demo123!', 10);
  let transportAdmin = await userRepo.findOne({ where: { email: transportEmail } });
  if (transportAdmin) {
    await userRepo.update(transportAdmin.id, {
      role: Role.TRANSPORT_ADMIN,
      isActive: true,
      company: transfood,
      deliveryCompany: dc,
    } as any);
    console.log(`  ✓ Compte mis à jour → TRANSPORT_ADMIN : ${transportEmail}`);
  } else {
    await userRepo.save(userRepo.create({
      nom: 'Ben Salem',
      prenom: 'Nour',
      email: transportEmail,
      password: hash,
      role: Role.TRANSPORT_ADMIN,
      isActive: true,
      company: transfood,
      deliveryCompany: dc,
    }));
    console.log(`  ✓ Compte créé : ${transportEmail}`);
  }

  // ── 5. Disponibilités pour aujourd'hui ──────────────────────────────────────
  console.log('\n[5/6] Disponibilités des camions pour aujourd\'hui...');
  const DATE = today();

  for (const truck of trucks) {
    const existing = await availRepo.findOne({ where: { truck: { id: truck.id }, date: DATE } } as any);
    if (!existing) {
      await availRepo.save(availRepo.create({
        date: DATE,
        truck,
        company: transfood,
      }));
      console.log(`  ✓ Disponibilité ajoutée : ${truck.matricule}`);
    } else {
      console.log(`  ✓ Déjà disponible : ${truck.matricule}`);
    }
  }

  // ── 6. Plans de chargement pour aujourd'hui ──────────────────────────────────
  console.log('\n[6/6] Plans de chargement pour aujourd\'hui...');

  const logistiqueAdmin = await userRepo.findOne({ where: { email: 'logistique@transfood.tn' } });
  const societe = await societeRepo.findOne({ where: { nom: 'Rose Blanche' } });

  const plansData = [
    {
      reference: 'PLAN-TP-001',
      truck: trucks[0], // Frigo TUN-2301-A
      heureArrivee: '07:30',
      tonnageCharge: 18.5,
      bls: [
        { ref: 'BL-TP-001', client: 'Carrefour Market Tunis', origine: 'Dépôt Béja', destination: 'Tunis Centre',  tonnage: 8.5,  type: TypeChargement.FRIGO,   ordre: 1 },
        { ref: 'BL-TP-002', client: 'Monoprix La Marsa',      origine: 'Dépôt Béja', destination: 'La Marsa',      tonnage: 10.0, type: TypeChargement.FRIGO,   ordre: 2 },
      ],
    },
    {
      reference: 'PLAN-TP-002',
      truck: trucks[1], // Palette TUN-1542-B
      heureArrivee: '08:00',
      tonnageCharge: 22.0,
      bls: [
        { ref: 'BL-TP-003', client: 'Géant Ariana',           origine: 'Dépôt Mateur', destination: 'Ariana',       tonnage: 7.0,  type: TypeChargement.PALETTE, ordre: 1 },
        { ref: 'BL-TP-004', client: 'Monoprix Sousse',        origine: 'Dépôt Mateur', destination: 'Sousse',       tonnage: 9.0,  type: TypeChargement.PALETTE, ordre: 2 },
        { ref: 'BL-TP-005', client: 'Magasin Général Sfax',   origine: 'Dépôt Mateur', destination: 'Sfax',         tonnage: 6.0,  type: TypeChargement.PALETTE, ordre: 3 },
      ],
    },
    {
      reference: 'PLAN-TP-003',
      truck: trucks[2], // Citerne TUN-8874-C
      heureArrivee: '09:00',
      tonnageCharge: 28.0,
      bls: [
        { ref: 'BL-TP-006', client: 'Station Agil Nabeul',    origine: 'Dépôt Manouba', destination: 'Nabeul',      tonnage: 28.0, type: TypeChargement.VRAC,    ordre: 1 },
      ],
    },
  ];

  // Trucks 4 & 5 sans plan (pour tester "camions sans mission")

  for (const pd of plansData) {
    // Plan
    let plan: any = await planRepo.findOne({ where: { reference: pd.reference } } as any);
    if (!plan) {
      plan = await planRepo.save(planRepo.create({
        reference: pd.reference,
        dateLivraison: DATE as any,
        isValidated: true,
        validatedBy: logistiqueAdmin ?? undefined,
        logistiqueCompanyId: transfood.id,
        truck: pd.truck,
        heureArrivee: pd.heureArrivee,
        tonnageCharge: pd.tonnageCharge,
        palettesChargees: 0,
        statut: 'DONE',
      } as any));
      console.log(`  ✓ Plan créé : ${pd.reference} → ${pd.truck.matricule}`);
    } else {
      await planRepo.update((plan as any).id, {
        dateLivraison: DATE as any,
        tonnageCharge: pd.tonnageCharge,
      });
      plan = await planRepo.findOne({ where: { reference: pd.reference } } as any) as any;
      console.log(`  ✓ Plan mis à jour : ${pd.reference}`);
    }

    // BLs
    for (const bl of pd.bls) {
      const existing: any = await blRepo.findOne({ where: { numeroBl: bl.ref } } as any);
      if (!existing) {
        await blRepo.save(blRepo.create({
          numeroBl: bl.ref,
          clientNom: bl.client,
          origine: bl.origine,
          destination: bl.destination,
          tonnageTotal: bl.tonnage,
          typeChargement: bl.type,
          ordreChargement: bl.ordre,
          nombrePalettes: 0,
          statut: BlStatus.LOADED,
          loadingPlan: plan,
          societeExpeditrice: societe ?? undefined,
          company: transfood,
          datelivraison: DATE as any,
        } as any));
        console.log(`    ✓ BL créé : ${bl.ref} → ${bl.destination}`);
      } else {
        await blRepo.update(existing.id, {
          loadingPlan: plan,
          datelivraison: DATE as any,
        } as any);
        console.log(`    ✓ BL mis à jour : ${bl.ref}`);
      }
    }
  }

  // ── 7. Rapid Transport SARL — société + camions + admin ─────────────────────
  console.log('\n[7/9] Société de transport n°2 : Rapid Transport SARL...');
  let dc2 = await dcRepo.findOne({ where: { nom: 'Rapid Transport SARL' } });
  if (!dc2) {
    dc2 = await dcRepo.save(dcRepo.create({
      nom: 'Rapid Transport SARL',
      adresse: 'Route de Sfax Km 4, Sousse',
      telephone: '+216 73 456 789',
      isActive: true,
      company: transfood,
    }));
    console.log('  ✓ Société créée : Rapid Transport SARL');
  } else {
    console.log('  ✓ Société existante : Rapid Transport SARL');
  }

  console.log('\n[8/9] Camions Rapid Transport SARL...');
  const trucksData2 = [
    { matricule: 'SOU-1101-X', type: 'Palette',  capaciteTonnage: 22, capacitePalettes: 36 },
    { matricule: 'SOU-2203-Y', type: 'Frigo',    capaciteTonnage: 16, capacitePalettes: 26 },
    { matricule: 'SOU-3305-Z', type: 'Standard', capaciteTonnage: 10, capacitePalettes: 18 },
  ];

  const trucks2: Truck[] = [];
  for (const t of trucksData2) {
    let truck = await truckRepo.findOne({ where: { matricule: t.matricule } });
    if (!truck) {
      truck = await truckRepo.save(truckRepo.create({
        ...t,
        isActive: true,
        deliveryCompany: dc2,
      }));
      console.log(`  ✓ Camion créé : ${t.matricule} (${t.type} — ${t.capaciteTonnage}T)`);
    } else {
      console.log(`  ✓ Camion existant : ${t.matricule}`);
    }
    trucks2.push(truck);
  }

  // Disponibilités pour aujourd'hui — société 2
  for (const truck of trucks2) {
    const existing = await availRepo.findOne({ where: { truck: { id: truck.id }, date: DATE } } as any);
    if (!existing) {
      await availRepo.save(availRepo.create({ date: DATE, truck, company: transfood }));
      console.log(`  ✓ Disponibilité : ${truck.matricule}`);
    } else {
      console.log(`  ✓ Déjà disponible : ${truck.matricule}`);
    }
  }

  // Plan de chargement — camion SOU-1101-X
  const plan2Ref = 'PLAN-TP-SARL-001';
  let plan2: any = await planRepo.findOne({ where: { reference: plan2Ref } } as any);
  if (!plan2) {
    plan2 = await planRepo.save(planRepo.create({
      reference: plan2Ref,
      dateLivraison: DATE as any,
      isValidated: true,
      validatedBy: logistiqueAdmin ?? undefined,
      logistiqueCompanyId: transfood.id,
      truck: trucks2[0],
      heureArrivee: '10:00',
      tonnageCharge: 19.0,
      palettesChargees: 0,
      statut: 'IN_PROGRESS',
    } as any));
    console.log(`  ✓ Plan créé : ${plan2Ref} → ${trucks2[0].matricule}`);
  } else {
    await planRepo.update((plan2 as any).id, { dateLivraison: DATE as any });
    plan2 = await planRepo.findOne({ where: { reference: plan2Ref } } as any) as any;
    console.log(`  ✓ Plan mis à jour : ${plan2Ref}`);
  }

  const bls2 = [
    { ref: 'BL-TP-SARL-001', client: 'Carrefour Sousse',  origine: 'Dépôt Sousse', destination: 'Sousse',   tonnage: 9.0,  type: TypeChargement.PALETTE, ordre: 1 },
    { ref: 'BL-TP-SARL-002', client: 'Monoprix Mahdia',   origine: 'Dépôt Sousse', destination: 'Mahdia',   tonnage: 5.5,  type: TypeChargement.PALETTE, ordre: 2 },
    { ref: 'BL-TP-SARL-003', client: 'Super U Monastir',  origine: 'Dépôt Sousse', destination: 'Monastir', tonnage: 4.5,  type: TypeChargement.PALETTE, ordre: 3 },
  ];

  for (const bl of bls2) {
    const existing: any = await blRepo.findOne({ where: { numeroBl: bl.ref } } as any);
    if (!existing) {
      await blRepo.save(blRepo.create({
        numeroBl: bl.ref,
        clientNom: bl.client,
        origine: bl.origine,
        destination: bl.destination,
        tonnageTotal: bl.tonnage,
        typeChargement: bl.type,
        ordreChargement: bl.ordre,
        nombrePalettes: 0,
        statut: BlStatus.LOADED,
        loadingPlan: plan2,
        societeExpeditrice: societe ?? undefined,
        company: transfood,
        datelivraison: DATE as any,
      } as any));
      console.log(`    ✓ BL créé : ${bl.ref} → ${bl.destination}`);
    } else {
      await blRepo.update(existing.id, { loadingPlan: plan2, datelivraison: DATE as any } as any);
      console.log(`    ✓ BL mis à jour : ${bl.ref}`);
    }
  }

  // Admin transport SARL
  console.log('\n[9/9] Compte TRANSPORT_ADMIN — Rapid Transport SARL...');
  const email2 = 'transport@rapidsarl.tn';
  let admin2 = await userRepo.findOne({ where: { email: email2 } });
  if (admin2) {
    await userRepo.update(admin2.id, {
      role: Role.TRANSPORT_ADMIN,
      isActive: true,
      company: transfood,
      deliveryCompany: dc2,
    } as any);
    console.log(`  ✓ Compte mis à jour : ${email2}`);
  } else {
    await userRepo.save(userRepo.create({
      nom: 'Hamdi',
      prenom: 'Youssef',
      email: email2,
      password: await bcrypt.hash('Demo123!', 10),
      role: Role.TRANSPORT_ADMIN,
      isActive: true,
      company: transfood,
      deliveryCompany: dc2,
    }));
    console.log(`  ✓ Compte créé : ${email2}`);
  }

  // ── Résumé ────────────────────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║               ✅  Seeder Transport Portal — OK                 ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log('║  LOGISTIC_ADMIN  : logistique@transfood.tn      / Demo123!     ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log('║  Société 1 : Rapid Transport TN                                ║');
  console.log('║    Admin   : transport@rapidtransport.tn        / Demo123!     ║');
  console.log('║    Camions : 5 — 3 avec plan, 2 sans mission                  ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log('║  Société 2 : Rapid Transport SARL                              ║');
  console.log('║    Admin   : transport@rapidsarl.tn             / Demo123!     ║');
  console.log('║    Camions : 3 — 1 avec plan (en cours), 2 sans mission        ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log('║  LOGISTIC_ADMIN → /transport      camions des 2 sociétés       ║');
  console.log('║  LOGISTIC_ADMIN → /users          voir les 2 admins transport  ║');
  console.log('║  TRANSPORT_ADMIN → /transport-portal/rapport  rapport du jour  ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  await app.close();
}

seed().catch((err) => {
  console.error('❌  Erreur :', err);
  process.exit(1);
});
