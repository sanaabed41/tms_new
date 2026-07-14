/**
 * seed-clean — Nettoie TOUTES les tables (TRUNCATE CASCADE)
 * ==========================================================
 * ⚠️  DESTRUCTIF — supprime toutes les données.
 * Lancer : cd backend && npm run seed:clean
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const ds  = app.get(DataSource);

  const tables = [
    'bl_articles',
    'bons_livraison',
    'loading_plans',
    'truck_availabilities',
    'trucks',
    'chauffeurs',
    'delivery_companies',
    'quais',
    'filieres',
    'societes_expeditrices',
    'invitations',
    'audit_logs',
    'users',
    'companies',
    'articles',
  ];

  console.log('\n🧹  Nettoyage de la base de données…\n');
  for (const table of tables) {
    try {
      await ds.query(`TRUNCATE TABLE "${table}" CASCADE`);
      console.log(`  ✓  ${table}`);
    } catch {
      console.log(`  –  ${table} (ignoré)`);
    }
  }

  console.log('\n✅  Base de données nettoyée.\n');
  await app.close();
}

bootstrap().catch((e) => {
  console.error('❌ Erreur :', e.message);
  process.exit(1);
});
