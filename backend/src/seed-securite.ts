/**
 * Seeder — Compte Agent de Sécurité
 * Crée securite@tms.com rattaché à TransFood
 * Prérequis : npm run seed
 *
 * Lancer : npm run seed:securite
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users/users.service';
import { Company } from './companies/company.entity';
import { Role } from './common/enums/role.enum';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });

  const usersService = app.get(UsersService);
  const companyRepo  = app.get<Repository<Company>>(getRepositoryToken(Company));

  console.log('\n🔐  Seeder Sécurité — démarrage...\n');

  const company = await companyRepo.findOne({ where: { nom: 'TransFood' } });
  if (!company) {
    console.error('❌  Société "TransFood" introuvable. Lance npm run seed en premier.');
    await app.close(); process.exit(1);
  }
  console.log(`✅  Société : ${company.nom}`);

  const existing = await usersService.findByEmail('securite@tms.com');
  if (existing) {
    console.log('ℹ️   Compte securite@tms.com existe déjà — ignoré.');
    await app.close();
    return;
  }

  await usersService.create(
    {
      nom:       'Trabelsi',
      prenom:    'Khalil',
      email:     'securite@tms.com',
      password:  'Securite123!',
      role:      Role.SECURITE,
      companyId: company.id,
      isActive:  true,
    },
    { role: Role.SUPER_ADMIN, company: { id: company.id } } as any,
  );

  console.log('\n✅  Agent de sécurité créé :');
  console.log('    Email    : securite@tms.com');
  console.log('    Password : Securite123!');
  console.log('    Société  : TransFood\n');

  await app.close();
}

seed().catch((err) => {
  console.error('❌  Erreur :', err);
  process.exit(1);
});
