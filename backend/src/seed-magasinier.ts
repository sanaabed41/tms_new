/**
 * Seeder — Compte Magasinier
 * Crée un utilisateur Magasinier rattaché à la société TransFood
 * Prérequis : npm run seed (seed principal doit avoirété exécuté)
 *
 * Lancer : npm run seed:magasinier
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

  const usersService  = app.get(UsersService);
  const companyRepo   = app.get<Repository<Company>>(getRepositoryToken(Company));

  console.log('\n🏭  Seeder Magasinier — démarrage...\n');

  // ── Trouver la société TransFood ──────────────────────────────────────────────
  const company = await companyRepo.findOne({ where: { nom: 'TransFood' } });
  if (!company) {
    console.error('❌  Société "TransFood" introuvable. Lance npm run seed en premier.');
    await app.close();
    process.exit(1);
  }
  console.log(`✅  Société trouvée : ${company.nom}`);

  // ── Vérifier si le compte existe déjà ────────────────────────────────────────
  const existing = await usersService.findByEmail('magasinier@tms.com');
  if (existing) {
    console.log('ℹ️   Compte magasinier@tms.com existe déjà — ignoré.');
    await app.close();
    return;
  }

  // ── Créer le compte Magasinier ────────────────────────────────────────────────
  await usersService.create(
    {
      nom: 'Haddad',
      prenom: 'Youssef',
      email: 'magasinier@tms.com',
      password: 'Magasin123!',
      role: Role.MAGASINIER,
      companyId: company.id,
      isActive: true,
    },
    { role: Role.SUPER_ADMIN, company: { id: company.id } } as any,
  );

  console.log('✅  Magasinier créé :');
  console.log('    Email    : magasinier@tms.com');
  console.log('    Password : Magasin123!');
  console.log('    Société  : TransFood\n');

  await app.close();
}

seed().catch((err) => {
  console.error('❌  Erreur :', err);
  process.exit(1);
});
