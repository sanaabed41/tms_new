/**
 * Seeder — Test envoi rapport journalier
 * =======================================
 * Crée un TRANSPORT_ADMIN lié à TransFood pour tester
 * la fonctionnalité "Envoyer au Transport".
 *
 * Prérequis : npm run seed:rb-complet
 * Lancer    : cd backend && npm run seed:report-test
 *
 * Compte Transport Admin :
 *   Email    : transport.admin@transfood.tn
 *   Password : Demo123!
 *
 * ⚠️  Pour recevoir l'email, change TEST_MAIL ci-dessous
 *     par une vraie adresse email accessible.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Company }          from './companies/company.entity';
import { DeliveryCompany }  from './delivery-companies/delivery-company.entity';
import { User }             from './users/user.entity';
import { BonLivraison, TypeChargement } from './bons-livraison/bon-livraison.entity';
import { LoadingPlan }      from './loading-plans/loading-plan.entity';
import { Truck }            from './trucks/truck.entity';
import { SocieteExpeditrice } from './expediteurs/societe-expeditrice.entity';
import { Role }             from './common/enums/role.enum';
import { BlStatus }         from './common/enums/bl-status.enum';

// ── Modifie cette adresse pour recevoir l'email de test ──────────────────────
const TEST_MAIL = 'sanaabed41@gmail.com';
// ─────────────────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().split('T')[0];
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });

  const companyRepo  = app.get<Repository<Company>>(getRepositoryToken(Company));
  const dcRepo       = app.get<Repository<DeliveryCompany>>(getRepositoryToken(DeliveryCompany));
  const userRepo     = app.get<Repository<User>>(getRepositoryToken(User));
  const truckRepo    = app.get<Repository<Truck>>(getRepositoryToken(Truck));
  const blRepo       = app.get<Repository<BonLivraison>>(getRepositoryToken(BonLivraison));
  const planRepo     = app.get<Repository<LoadingPlan>>(getRepositoryToken(LoadingPlan));
  const societeRepo  = app.get<Repository<SocieteExpeditrice>>(getRepositoryToken(SocieteExpeditrice));

  console.log('\n[1/4] Recherche de TransFood...');

  const transfood = await companyRepo.findOne({ where: { nom: 'TransFood' } });
  if (!transfood) {
    console.error('❌  TransFood introuvable — lancez d\'abord: npm run seed:rb-complet');
    await app.close();
    process.exit(1);
  }
  console.log(`  ✓ TransFood trouvé (id: ${transfood.id})`);

  // ── Société de livraison ──────────────────────────────────────────────────

  let dc = await dcRepo.findOne({ where: { nom: 'Rapid Transport TN' } });
  if (!dc) {
    dc = await dcRepo.save(dcRepo.create({
      nom: 'Rapid Transport TN',
      adresse: 'Zone Industrielle, Tunis',
      telephone: '+216 71 000 001',
      isActive: true,
      company: transfood,
    }));
    console.log('  ✓ Société de livraison créée : Rapid Transport TN');
  } else {
    console.log('  ✓ Société de livraison existante : Rapid Transport TN');
  }

  // ── Camion ────────────────────────────────────────────────────────────────

  console.log('\n[2/4] Camion test...');

  let truck = await truckRepo.findOne({ where: { matricule: 'RPT-TEST-01' } });
  if (!truck) {
    truck = await truckRepo.save(truckRepo.create({
      matricule: 'RPT-TEST-01',
      capaciteTonnage: 20,
      capacitePalettes: 30,
      type: 'FRIGO',
      isActive: true,
      deliveryCompany: dc,
    }));
    console.log('  ✓ Camion créé : RPT-TEST-01');
  } else {
    console.log('  ✓ Camion existant : RPT-TEST-01');
  }

  // ── TRANSPORT_ADMIN ───────────────────────────────────────────────────────

  console.log('\n[3/4] Compte Transport Admin...');

  const hash = await bcrypt.hash('Demo123!', 10);
  let transportAdmin = await userRepo.findOne({ where: { email: TEST_MAIL } });

  if (transportAdmin) {
    await userRepo.update(transportAdmin.id, {
      role: Role.TRANSPORT_ADMIN,
      isActive: true,
      company: transfood,
      deliveryCompany: dc,
    });
    console.log(`  ✓ Utilisateur existant mis à jour → TRANSPORT_ADMIN : ${TEST_MAIL}`);
  } else {
    transportAdmin = await userRepo.save(userRepo.create({
      nom: 'Ben Salah',
      prenom: 'Khalil',
      email: TEST_MAIL,
      password: hash,
      role: Role.TRANSPORT_ADMIN,
      isActive: true,
      company: transfood,
      deliveryCompany: dc,
    }));
    console.log(`  ✓ Transport Admin créé : ${TEST_MAIL}`);
  }

  // ── Plan de chargement pour aujourd'hui ──────────────────────────────────

  console.log('\n[4/4] Plan de chargement pour aujourd\'hui...');

  const DATE = today();
  const logistiqueAdmin = await userRepo.findOne({ where: { email: 'logistique@transfood.tn' } });
  const societe = await societeRepo.findOne({ where: { nom: 'Rose Blanche' } });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let plan: any = await planRepo.findOne({ where: { reference: 'RPT-TEST-PLAN' } } as any);
  if (!plan) {
    plan = await planRepo.save(planRepo.create({
      reference: 'RPT-TEST-PLAN',
      dateLivraison: DATE as any,
      isValidated: true,
      validatedBy: logistiqueAdmin ?? undefined,
      logistiqueCompanyId: transfood.id,
      truck,
      heureArrivee: '08:00',
      tonnageCharge: 35.5,
      palettesChargees: 0,
    } as any));
    console.log('  ✓ Plan de chargement créé : RPT-TEST-PLAN');
  } else {
    await planRepo.update((plan as any).id, {
      dateLivraison: DATE as any,
      isValidated: true,
      tonnageCharge: 35.5,
    });
    console.log('  ✓ Plan existant mis à jour pour aujourd\'hui');
    plan = await planRepo.findOne({ where: { reference: 'RPT-TEST-PLAN' } } as any) as any;
  }

  const blsData = [
    { numeroBl: 'BL-RPT-001', clientNom: 'Carrefour Market', destination: 'Tunis Centre', origine: 'Dépôt Béja', tonnageTotal: 12.5, typeChargement: TypeChargement.FRIGO },
    { numeroBl: 'BL-RPT-002', clientNom: 'Magasin Général',  destination: 'Sousse',       origine: 'Dépôt Béja', tonnageTotal: 14.0, typeChargement: TypeChargement.PALETTE },
    { numeroBl: 'BL-RPT-003', clientNom: 'Monoprix TN',      destination: 'Sfax',         origine: 'Dépôt Béja', tonnageTotal: 9.0,  typeChargement: TypeChargement.VRAC },
  ];

  for (let i = 0; i < blsData.length; i++) {
    const d = blsData[i];
    const existing = await blRepo.findOne({ where: { numeroBl: d.numeroBl } } as any);
    if (!existing) {
      await blRepo.save(blRepo.create({
        ...d,
        loadingPlan: plan,
        societeExpeditrice: societe ?? undefined,
        company: transfood,
        datelivraison: DATE as any,
        nombrePalettes: 0,
        statut: BlStatus.LOADED,
        ordreChargement: i + 1,
      } as any));
      console.log(`  ✓ BL créé : ${d.numeroBl} → ${d.destination}`);
    } else {
      await blRepo.update((existing as any).id, { loadingPlan: plan, datelivraison: DATE as any });
      console.log(`  ✓ BL existant mis à jour : ${d.numeroBl}`);
    }
  }

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║         ✅  Seeder Report Test — OK                     ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Date du plan   : ${DATE.padEnd(38)}║`);
  console.log(`║  Transport Admin: ${TEST_MAIL.padEnd(38)}║`);
  console.log(`║  Mot de passe   : Demo123!                              ║`);
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║  Test :                                                  ║');
  console.log('║  1. Connecte-toi avec logistique@transfood.tn           ║');
  console.log('║  2. Va sur la page Planning                             ║');
  console.log('║  3. Clique "Envoyer au Transport"                       ║');
  console.log(`║  4. Vérifie l'email reçu sur ${TEST_MAIL.padEnd(27)}║`);
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  await app.close();
}

bootstrap().catch((e) => {
  console.error('\n❌ Erreur :', e.message);
  process.exit(1);
});
