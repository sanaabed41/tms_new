/**
 * Seeder — Admin Transport
 * Crée une société de transport + ses camions + un compte TRANSPORT_ADMIN
 * Prérequis : npm run seed (seed principal doit avoir été exécuté)
 *
 * Lancer : npm run seed:transport-admin
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Company } from './companies/company.entity';
import { DeliveryCompany } from './delivery-companies/delivery-company.entity';
import { Truck } from './trucks/truck.entity';
import { User } from './users/user.entity';
import { Role } from './common/enums/role.enum';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });

  const companyRepo         = app.get<Repository<Company>>(getRepositoryToken(Company));
  const deliveryCompanyRepo = app.get<Repository<DeliveryCompany>>(getRepositoryToken(DeliveryCompany));
  const truckRepo           = app.get<Repository<Truck>>(getRepositoryToken(Truck));
  const userRepo            = app.get<Repository<User>>(getRepositoryToken(User));

  console.log('\n🚛  Seeder Admin Transport — démarrage...\n');

  // ── 1. Trouver la société logistique ─────────────────────────────────────
  const company = await companyRepo.findOne({ where: { nom: 'TransFood' } });
  if (!company) {
    console.error('❌  Société "TransFood" introuvable. Lance npm run seed en premier.');
    await app.close();
    process.exit(1);
  }
  console.log(`✅  Société logistique : ${company.nom}`);

  // ── 2. Créer la société de transport ─────────────────────────────────────
  let deliveryCompany = await deliveryCompanyRepo.findOne({
    where: { nom: 'Rapid Fret SARL' },
  });

  if (deliveryCompany) {
    console.log(`ℹ️   Société de transport "Rapid Fret SARL" existe déjà — réutilisée.`);
  } else {
    deliveryCompany = await deliveryCompanyRepo.save(
      deliveryCompanyRepo.create({
        nom: 'Rapid Fret SARL',
        adresse: 'Zone Industrielle Ben Arous, Tunis',
        telephone: '+216 71 456 789',
        company: { id: company.id },
      }),
    );
    console.log(`✅  Société de transport créée : ${deliveryCompany.nom}`);
  }

  // ── 3. Créer les camions ──────────────────────────────────────────────────
  const trucks = [
    { matricule: '100TUN01', capaciteTonnage: 10, capacitePalettes: 20, type: 'Plateau' },
    { matricule: '200TUN01', capaciteTonnage: 5,  capacitePalettes: 10, type: 'Frigorifique' },
    { matricule: '300TUN01', capaciteTonnage: 20, capacitePalettes: 40, type: 'Semi-remorque' },
  ];

  let trucksCreated = 0;
  for (const t of trucks) {
    const exists = await truckRepo.findOne({ where: { matricule: t.matricule } });
    if (exists) {
      console.log(`ℹ️   Camion ${t.matricule} existe déjà — ignoré.`);
      continue;
    }
    await truckRepo.save(
      truckRepo.create({ ...t, deliveryCompany: { id: deliveryCompany.id } }),
    );
    console.log(`✅  Camion créé : ${t.matricule} (${t.capaciteTonnage}T — ${t.type})`);
    trucksCreated++;
  }
  if (trucksCreated === 0) console.log('ℹ️   Tous les camions existent déjà.');

  // ── 4. Créer le compte TRANSPORT_ADMIN ───────────────────────────────────
  const email = 'transport@tms.com';
  const existingUser = await userRepo.findOne({ where: { email } });

  if (existingUser) {
    console.log(`ℹ️   Compte ${email} existe déjà — ignoré.`);
  } else {
    const hashed = await bcrypt.hash('Transport123!', 10);
    await userRepo.save(
      userRepo.create({
        nom: 'Chaabane',
        prenom: 'Sami',
        email,
        password: hashed,
        role: Role.TRANSPORT_ADMIN,
        isActive: true,
        company: { id: company.id },
        deliveryCompany: { id: deliveryCompany.id },
      }),
    );
    console.log(`✅  Admin Transport créé : ${email}`);
  }

  // ── Résumé ────────────────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║          ADMIN TRANSPORT — RÉSUMÉ           ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  Email    : transport@tms.com               ║`);
  console.log(`║  Password : Transport123!                   ║`);
  console.log(`║  Société  : Rapid Fret SARL                 ║`);
  console.log(`║  Camions  : 3 (Plateau, Frigo, Semi)        ║`);
  console.log('╚══════════════════════════════════════════════╝\n');

  await app.close();
}

seed().catch((err) => {
  console.error('❌  Erreur :', err);
  process.exit(1);
});
