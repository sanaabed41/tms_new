/**
 * Seeder — Disponibilités camions (Planning)
 * Marque tous les camions actifs comme disponibles pour aujourd'hui + 3 jours
 * Prérequis : npm run seed && npm run seed:rb
 *
 * Lancer : npm run seed:planning
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Truck } from './trucks/truck.entity';
import { Company } from './companies/company.entity';
import { TruckAvailability } from './truck-availability/truck-availability.entity';
import { BonLivraison } from './bons-livraison/bon-livraison.entity';
import { BlStatus } from './common/enums/bl-status.enum';

function addDays(date: Date, n: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });

  const truckRepo  = app.get<Repository<Truck>>(getRepositoryToken(Truck));
  const availRepo  = app.get<Repository<TruckAvailability>>(getRepositoryToken(TruckAvailability));
  const compRepo   = app.get<Repository<Company>>(getRepositoryToken(Company));
  const blRepo     = app.get<Repository<BonLivraison>>(getRepositoryToken(BonLivraison));

  console.log('\n🚛  Seeder Planning — démarrage...\n');

  // ── Société ──────────────────────────────────────────────────────────────────
  const company = await compRepo.findOne({ where: { nom: 'TransFood' } });
  if (!company) {
    console.error('❌  Société "TransFood" introuvable. Lance npm run seed en premier.');
    await app.close(); process.exit(1);
  }

  // ── Camions actifs ────────────────────────────────────────────────────────────
  const trucks = await truckRepo.find({ where: { isActive: true }, relations: ['deliveryCompany'] });
  if (trucks.length === 0) {
    console.error('❌  Aucun camion actif trouvé. Lance npm run seed:rb en premier.');
    await app.close(); process.exit(1);
  }
  console.log(`✅  ${trucks.length} camion(s) actif(s) trouvé(s)\n`);

  // ── Dates : aujourd'hui + 3 jours ─────────────────────────────────────────────
  const today = new Date();
  const dates = [0, 1, 2, 3].map((n) => addDays(today, n));
  console.log(`📅  Dates couvertes :`);
  dates.forEach((d) => console.log(`     • ${d}`));
  console.log();

  // ── Insérer les disponibilités (idempotent) ───────────────────────────────────
  let created = 0;
  let skipped = 0;

  for (const date of dates) {
    for (const truck of trucks) {
      const existing = await availRepo.findOne({
        where: { truck: { id: truck.id }, date },
      });
      if (existing) { skipped++; continue; }

      await availRepo.save(availRepo.create({ truck, date, company }));
      created++;
    }
  }

  console.log(`✅  Disponibilités : ${created} créée(s), ${skipped} déjà existante(s)\n`);

  // ── Résumé par société de livraison ──────────────────────────────────────────
  const groups: Record<string, string[]> = {};
  trucks.forEach((t) => {
    const nom = t.deliveryCompany?.nom || 'Inconnue';
    if (!groups[nom]) groups[nom] = [];
    groups[nom].push(`${t.matricule} (${t.type || 'Standard'}, ${t.capaciteTonnage}T)`);
  });
  console.log('🚛  Camions disponibles par société :');
  Object.entries(groups).forEach(([nom, mats]) => {
    console.log(`\n   ${nom}`);
    mats.forEach((m) => console.log(`     • ${m}`));
  });

  // ── BL disponibles ────────────────────────────────────────────────────────────
  const validatedBls = await blRepo.find({
    where: { statut: BlStatus.VALIDATED },
    relations: ['societeExpeditrice', 'filiere'],
  });
  console.log(`\n📄  BL disponibles pour le planning : ${validatedBls.length}`);

  if (validatedBls.length === 0) {
    console.log('   ⚠️   Aucun BL en statut VALIDATED. Lance npm run seed:rb pour en créer.');
  } else {
    const byDest: Record<string, number> = {};
    validatedBls.forEach((bl) => {
      const d = bl.destination || 'Non défini';
      byDest[d] = (byDest[d] || 0) + 1;
    });
    Object.entries(byDest)
      .sort(([, a], [, b]) => b - a)
      .forEach(([dest, count]) => console.log(`     • ${dest.padEnd(12)} ${count} BL`));
  }

  console.log(`\n✅  Done! Va sur http://localhost:3001/planning pour tester.\n`);
  await app.close();
}

seed().catch((e) => { console.error(e); process.exit(1); });
