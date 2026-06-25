/**
 * Seeder portail expéditeur — Rose Blanche
 *
 * Prérequis : npm run seed && npm run seed:pb && npm run seed:full
 * Lancer    : npm run seed:expediteur
 *
 * Crée / met à jour :
 *   - Company(EXPEDITEUR)  "Rose Blanche Portail"  code=RB  couleur=#d4380d
 *   - Lie SocieteExpeditrice "Rose Blanche" → expediteurCompany
 *   - Partenariat : TransFood (LOGISTIQUE) ↔ Rose Blanche Portail (EXPEDITEUR)
 *   - EXPEDITEUR_ADMIN : admin@roseblanche.tn            mdp: Password123!
 *   - FILIERE_ADMIN    : filiere.admin@roseblanche.tn   mdp: Password123!  (AMT)
 *   - MAGASINIER RB1   : magasinier.rb1@roseblanche.tn  mdp: Password123!  (AMT + MCSR)
 *   - MAGASINIER RB2   : magasinier.rb2@roseblanche.tn  mdp: Password123!  (PW)
 *   - SECURITE  RB1    : securite.rb1@roseblanche.tn    mdp: Password123!  (AMT + PW)
 *   - SECURITE  RB2    : securite.rb2@roseblanche.tn    mdp: Password123!  (MCSR)
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './companies/company.entity';
import { User } from './users/user.entity';
import { SocieteExpeditrice } from './expediteurs/societe-expeditrice.entity';
import { Filiere } from './expediteurs/filiere.entity';
import { Role } from './common/enums/role.enum';
import { CompanyType } from './common/enums/company-type.enum';
import * as bcrypt from 'bcryptjs';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });

  const companyRepo = app.get<Repository<Company>>(getRepositoryToken(Company));
  const userRepo    = app.get<Repository<User>>(getRepositoryToken(User));
  const societeRepo = app.get<Repository<SocieteExpeditrice>>(getRepositoryToken(SocieteExpeditrice));
  const filiereRepo = app.get<Repository<Filiere>>(getRepositoryToken(Filiere));

  // ── 1. TransFood (LOGISTIQUE) ────────────────────────────────────────────────
  const transfood = await companyRepo.findOne({
    where: { nom: 'TransFood' },
  });
  if (!transfood) {
    console.log('❌  TransFood introuvable — lancez d\'abord : npm run seed && npm run seed:pb');
    await app.close();
    return;
  }
  console.log(`✅  Société logistique : ${transfood.nom}`);

  // ── 2. Rose Blanche (SocieteExpeditrice) ─────────────────────────────────────
  const roseBlanche = await societeRepo.findOne({
    where: { nom: 'Rose Blanche' },
    relations: ['filieres'],
  });
  if (!roseBlanche) {
    console.log('❌  "Rose Blanche" introuvable — lancez d\'abord npm run seed:pb');
    await app.close();
    return;
  }
  console.log(`✅  Société expéditrice : ${roseBlanche.nom} (${roseBlanche.filieres.length} filières)`);

  // ── 3. Filières ──────────────────────────────────────────────────────────────
  const filAMT  = roseBlanche.filieres.find((f) => f.code === 'AMT')
               ?? await filiereRepo.findOne({ where: { code: 'AMT' } });
  const filMCSR = roseBlanche.filieres.find((f) => f.code === 'MCSR')
               ?? await filiereRepo.findOne({ where: { code: 'MCSR' } });
  const filPW   = roseBlanche.filieres.find((f) => f.code === 'PW')
               ?? await filiereRepo.findOne({ where: { code: 'PW' } });

  if (!filAMT || !filMCSR || !filPW) {
    console.log('❌  Filières AMT/MCSR/PW introuvables — lancez npm run seed:full');
    await app.close();
    return;
  }
  console.log(`✅  Filières : AMT ✓  MCSR ✓  PW ✓`);

  // ── 4. Company EXPEDITEUR "Rose Blanche Portail" ─────────────────────────────
  let rbPortail = await companyRepo.findOne({
    where: { nom: 'Rose Blanche Portail' },
  });

  if (!rbPortail) {
    rbPortail = await companyRepo.save(
      companyRepo.create({
        nom:      'Rose Blanche Portail',
        type:     CompanyType.EXPEDITEUR,
        code:     'RB',
        couleur:  '#d4380d',
        isActive: true,
      }),
    );
    console.log(`  ✚  Company EXPEDITEUR créée : ${rbPortail.nom}`);
  } else {
    await companyRepo.update(rbPortail.id, {
      type:    CompanyType.EXPEDITEUR,
      code:    'RB',
      couleur: '#d4380d',
    });
    console.log(`  ✓  Company EXPEDITEUR existante : ${rbPortail.nom}`);
  }

  // ── 5. Lier SocieteExpeditrice → expediteurCompany ───────────────────────────
  if (roseBlanche.expediteurCompany?.id !== rbPortail.id) {
    await societeRepo.update(roseBlanche.id, { expediteurCompany: { id: rbPortail.id } as any });
    console.log(`  ✚  Lien SocieteExpeditrice → expediteurCompanyétabli`);
  } else {
    console.log(`  ✓  Lien SocieteExpeditrice → expediteurCompany déjàétabli`);
  }

  // ── 6. Rose Blanche Portail appartient à TransFood ─────────────────────────
  await companyRepo.update(rbPortail!.id, { logistiqueCompany: { id: transfood.id } } as any);
  console.log(`  ✓  Rose Blanche Portail → TransFood`);

  // ── 7. Comptes utilisateurs Rose Blanche ────────────────────────────────────
  const hashed = await bcrypt.hash('Password123!', 10);

  const accounts = [
    {
      prenom: 'Admin', nom: 'Rose Blanche',
      email: 'admin@roseblanche.tn',
      role: Role.EXPEDITEUR_ADMIN,
      filieres: [] as Filiere[],
      label: 'EXPEDITEUR_ADMIN',
    },
    {
      prenom: 'Magasinier', nom: 'RB1',
      email: 'magasinier.rb1@roseblanche.tn',
      role: Role.MAGASINIER,
      filieres: [filAMT, filMCSR],
      label: 'MAGASINIER (AMT + MCSR)',
    },
    {
      prenom: 'Magasinier', nom: 'RB2',
      email: 'magasinier.rb2@roseblanche.tn',
      role: Role.MAGASINIER,
      filieres: [filPW],
      label: 'MAGASINIER (PW)',
    },
    {
      prenom: 'Sécurité', nom: 'RB1',
      email: 'securite.rb1@roseblanche.tn',
      role: Role.SECURITE,
      filieres: [filAMT, filPW],
      label: 'SECURITE (AMT + PW)',
    },
    {
      prenom: 'Sécurité', nom: 'RB2',
      email: 'securite.rb2@roseblanche.tn',
      role: Role.SECURITE,
      filieres: [filMCSR],
      label: 'SECURITE (MCSR)',
    },
    {
      prenom: 'Admin', nom: 'FiliereTest',
      email: 'filiere.admin@roseblanche.tn',
      role: Role.FILIERE_ADMIN,
      filieres: [filAMT],
      label: 'FILIERE_ADMIN (AMT)',
    },
  ];

  for (const acc of accounts) {
    let user = await userRepo.findOne({ where: { email: acc.email }, relations: ['filieres'] });
    if (!user) {
      user = userRepo.create({
        prenom:   acc.prenom,
        nom:      acc.nom,
        email:    acc.email,
        password: hashed,
        role:     acc.role,
        isActive: true,
        company:  { id: rbPortail!.id } as any,
        filieres: acc.filieres,
      });
      await userRepo.save(user);
      console.log(`  ✚  ${acc.label} créé : ${acc.email}`);
    } else {
      user.filieres = acc.filieres;
      await userRepo.save(user);
      console.log(`  ✓  ${acc.label} mis à jour : ${acc.email}`);
    }
  }

  console.log(`\n🎉  Seeder expéditeur terminé — portail Rose Blanche opérationnel`);
  console.log(`\nComptes (mot de passe : Password123!) :`);
  console.log(`  EXPEDITEUR_ADMIN : admin@roseblanche.tn`);
  console.log(`  FILIERE_ADMIN    : filiere.admin@roseblanche.tn  (AMT)`);
  console.log(`  MAGASINIER       : magasinier.rb1@roseblanche.tn  |  magasinier.rb2@roseblanche.tn`);
  console.log(`  SECURITE         : securite.rb1@roseblanche.tn    |  securite.rb2@roseblanche.tn`);

  await app.close();
}

bootstrap().catch((e) => { console.error(e); process.exit(1); });
