/**
 * Seeder complet — quais dédiés + génériques + affectations filières magasiniers/sécurité
 *
 * Prérequis : npm run seed:pb  (crée TransFood, la Rose Blanche, les filières AMT/MCSR/PW)
 * Lancer    : npm run seed:full
 *
 * Crée :
 *   - Quais dédiés Rose Blanche (QPW1-3, QAMT1-4, QMCSR1-3)
 *   - Quais génériques (Quai 1 à Quai 8) pour les autres sociétés
 *   - 2 magasiniers avec affectations filières différentes
 *   - 2 agents sécurité avec affectations filières différentes
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
import { Role } from './common/enums/role.enum';
import * as bcrypt from 'bcryptjs';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });

  const companyRepo   = app.get<Repository<Company>>(getRepositoryToken(Company));
  const userRepo      = app.get<Repository<User>>(getRepositoryToken(User));
  const societeRepo   = app.get<Repository<SocieteExpeditrice>>(getRepositoryToken(SocieteExpeditrice));
  const filiereRepo   = app.get<Repository<Filiere>>(getRepositoryToken(Filiere));
  const quaiRepo      = app.get<Repository<Quai>>(getRepositoryToken(Quai));

  // ── 1. Find TransFood company ────────────────────────────────────────────────
  let company = await companyRepo.findOne({ where: { nom: 'TransFood' } });
  if (!company) {
    console.log('❌  TransFood introuvable — lancez d\'abord npm run seed puis npm run seed:pb');
    await app.close();
    return;
  }
  console.log(`✅  Company: ${company.nom}`);

  // ── 2. Find Rose Blanche societe ─────────────────────────────────────────────
  const roseBlanche = await societeRepo.findOne({ where: { nom: 'Rose Blanche' } });
  if (!roseBlanche) {
    console.log('❌  "Rose Blanche" introuvable — lancez d\'abord npm run seed:pb');
    await app.close();
    return;
  }

  // Lookup filières globally by code (codes are now globally unique and uppercase)
  let filAMT  = await filiereRepo.findOne({ where: { code: 'AMT'  } });
  let filMCSR = await filiereRepo.findOne({ where: { code: 'MCSR' } });
  let filPW   = await filiereRepo.findOne({ where: { code: 'PW'   } });

  // Create missing filières and link them to Rose Blanche
  if (!filAMT)  { filAMT  = await filiereRepo.save(filiereRepo.create({ nom: 'Alimentation & Minoterie Tunisie', code: 'AMT',  societeExpeditrice: { id: roseBlanche.id } as any })); }
  if (!filMCSR) { filMCSR = await filiereRepo.save(filiereRepo.create({ nom: 'Minoterie Centrale de Sfax et du Sahel', code: 'MCSR', societeExpeditrice: { id: roseBlanche.id } as any })); }
  if (!filPW)   { filPW   = await filiereRepo.save(filiereRepo.create({ nom: 'Pâtes et Whisky', code: 'PW',   societeExpeditrice: { id: roseBlanche.id } as any })); }

  // Ensure surviving filières are linked to Rose Blanche (they may have been moved during dedup)
  await filiereRepo.update(filAMT.id,  { societeExpeditrice: { id: roseBlanche.id } as any });
  await filiereRepo.update(filMCSR.id, { societeExpeditrice: { id: roseBlanche.id } as any });
  await filiereRepo.update(filPW.id,   { societeExpeditrice: { id: roseBlanche.id } as any });

  console.log(`✅  Rose Blanche filières: AMT=${!!filAMT} MCSR=${!!filMCSR} PW=${!!filPW}`);

  // ── 3. Quais dédiés Rose Blanche ─────────────────────────────────────────────
  const dedicated: Array<{ nom: string; filiere: Filiere | undefined }> = [
    // PW quais
    { nom: 'QPW1', filiere: filPW },
    { nom: 'QPW2', filiere: filPW },
    { nom: 'QPW3', filiere: filPW },
    // AMT quais
    { nom: 'QAMT1', filiere: filAMT },
    { nom: 'QAMT2', filiere: filAMT },
    { nom: 'QAMT3', filiere: filAMT },
    { nom: 'QAMT4', filiere: filAMT },
    // MCSR quais
    { nom: 'QMCSR1', filiere: filMCSR },
    { nom: 'QMCSR2', filiere: filMCSR },
    { nom: 'QMCSR3', filiere: filMCSR },
  ];

  for (const { nom, filiere } of dedicated) {
    const existing = await quaiRepo.findOne({ where: { nom, company: { id: company.id } } });
    if (!existing) {
      await quaiRepo.save(
        quaiRepo.create({
          nom,
          isActive: true,
          company: { id: company.id } as any,
          societeExpeditrice: { id: roseBlanche.id } as any,
          filiere: filiere ? { id: filiere.id } as any : null,
        }),
      );
      console.log(`  ✚  Quai dédié créé: ${nom}`);
    } else {
      console.log(`  –  Quai dédié existant: ${nom}`);
    }
  }

  // ── 4. Quais génériques (Quai 1..8) ─────────────────────────────────────────
  for (let i = 1; i <= 8; i++) {
    const nom = `Quai ${i}`;
    const existing = await quaiRepo.findOne({ where: { nom, company: { id: company.id } } });
    if (!existing) {
      await quaiRepo.save(
        quaiRepo.create({
          nom,
          isActive: true,
          company: { id: company.id } as any,
          societeExpeditrice: null,
          filiere: null,
        }),
      );
      console.log(`  ✚  Quai générique créé: ${nom}`);
    } else {
      console.log(`  –  Quai générique existant: ${nom}`);
    }
  }

  // ── 5. Magasiniers avec affectations filières ────────────────────────────────
  const hashed = await bcrypt.hash('Password123!', 10);

  const magasiniers = [
    {
      prenom: 'Magasinier',
      nom: '1',
      email: 'magasinier1@transfood.tn',
      filieres: [filAMT, filMCSR].filter(Boolean) as Filiere[],
      label: 'AMT + MCSR',
    },
    {
      prenom: 'Magasinier',
      nom: '2',
      email: 'magasinier2@transfood.tn',
      filieres: [filPW].filter(Boolean) as Filiere[],
      label: 'PW',
    },
  ];

  for (const m of magasiniers) {
    let user = await userRepo.findOne({ where: { email: m.email }, relations: ['filieres'] });
    if (!user) {
      user = userRepo.create({
        prenom: m.prenom,
        nom: m.nom,
        email: m.email,
        password: hashed,
        role: Role.MAGASINIER,
        isActive: true,
        company: { id: company.id } as any,
        filieres: m.filieres,
      });
      await userRepo.save(user);
      console.log(`  ✚  Magasinier créé: ${m.email} (${m.label})`);
    } else {
      user.filieres = m.filieres;
      await userRepo.save(user);
      console.log(`  ✓  Magasinier mis à jour: ${m.email} (${m.label})`);
    }
  }

  // ── 6. Agents de sécurité avec affectations filières ────────────────────────
  const securites = [
    {
      prenom: 'Sécurité',
      nom: '1',
      email: 'securite1@transfood.tn',
      filieres: [filAMT, filPW].filter(Boolean) as Filiere[],
      label: 'AMT + PW',
    },
    {
      prenom: 'Sécurité',
      nom: '2',
      email: 'securite2@transfood.tn',
      filieres: [filMCSR].filter(Boolean) as Filiere[],
      label: 'MCSR',
    },
  ];

  for (const s of securites) {
    let user = await userRepo.findOne({ where: { email: s.email }, relations: ['filieres'] });
    if (!user) {
      user = userRepo.create({
        prenom: s.prenom,
        nom: s.nom,
        email: s.email,
        password: hashed,
        role: Role.SECURITE,
        isActive: true,
        company: { id: company.id } as any,
        filieres: s.filieres,
      });
      await userRepo.save(user);
      console.log(`  ✚  Sécurité créé: ${s.email} (${s.label})`);
    } else {
      user.filieres = s.filieres;
      await userRepo.save(user);
      console.log(`  ✓  Sécurité mis à jour: ${s.email} (${s.label})`);
    }
  }

  const totalQuais = await quaiRepo.count({ where: { company: { id: company.id } } });
  console.log(`\n🎉  Seeder terminé — ${totalQuais} quais pour TransFood`);
  console.log(`\nComptes créés (mot de passe: Password123!) :`);
  console.log(`  magasiniers  : magasinier1@transfood.tn  |  magasinier2@transfood.tn`);
  console.log(`  sécurité     : securite1@transfood.tn    |  securite2@transfood.tn`);

  await app.close();
}

bootstrap().catch((e) => { console.error(e); process.exit(1); });
