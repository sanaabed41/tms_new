import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users/users.service';
import { CompaniesService } from './companies/companies.service';
import { DeliveryCompaniesService } from './delivery-companies/delivery-companies.service';
import { TrucksService } from './trucks/trucks.service';
import { BonLivraison, TypeChargement } from './bons-livraison/bon-livraison.entity';
import { Role } from './common/enums/role.enum';
import { BlStatus } from './common/enums/bl-status.enum';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const companiesService = app.get(CompaniesService);
  const dcService = app.get(DeliveryCompaniesService);
  const trucksService = app.get(TrucksService);
  const blRepo = app.get<Repository<BonLivraison>>(getRepositoryToken(BonLivraison));

  const existing = await usersService.findByEmail('admin@tms.com');
  if (existing) {
    console.log('Seed déjà effectué — ignoré.');
    await app.close();
    return;
  }

  // 1. Société cliente
  const company = await companiesService.create({
    nom: 'TransFood',
    adresse: 'Route de la Marsa, Tunis',
    telephone: '+216 71 000 000',
  });
  console.log(`✓ Société: ${company.nom}`);

  // 2. Comptes utilisateurs
  await usersService.create(
    { nom: 'Admin', prenom: 'Super', email: 'admin@tms.com', password: 'Admin123!', role: Role.SUPER_ADMIN, companyId: company.id },
    { role: Role.SUPER_ADMIN, company: { id: company.id } } as any,
  );
  console.log('✓ Super Admin    : admin@tms.com / Admin123!');

  await usersService.create(
    { nom: 'Ben Salem', prenom: 'Karim', email: 'logistique@tms.com', password: 'Logistique123!', role: Role.LOGISTIC_ADMIN, companyId: company.id },
    { role: Role.SUPER_ADMIN, company: { id: company.id } } as any,
  );
  console.log('✓ Resp. Logistique: logistique@tms.com / Logistique123!');

  // 3. Société de livraison + camions
  const dc = await dcService.create({
    nom: 'Trans Tunisie Transport',
    adresse: 'Zone Industrielle, Sousse',
    telephone: '+216 73 000 000',
  }, company.id) as any;
  console.log(`✓ Société livraison: ${dc.nom}`);

  await trucksService.create({ matricule: '123TUN16', capaciteTonnage: 10, capacitePalettes: 20, type: 'Plateau', deliveryCompanyId: dc.id });
  await trucksService.create({ matricule: '456TUN16', capaciteTonnage: 5, capacitePalettes: 10, type: 'Frigorifique', deliveryCompanyId: dc.id });
  await trucksService.create({ matricule: '789TUN25', capaciteTonnage: 20, capacitePalettes: 40, type: 'Semi-remorque', deliveryCompanyId: dc.id });
  await trucksService.create({ matricule: '321TUN11', capaciteTonnage: 8, capacitePalettes: 16, type: 'Plateau', deliveryCompanyId: dc.id });
  console.log('✓ 4 camions créés');

  // 4. Bons de livraison — variés (origines multiples, statuts DRAFT et VALIDATED)
  const blData = [
    // ── VALIDATED (prêts pour le planning) ──────────────────────────────
    {
      numeroBl: 'BL-2025-001', statut: BlStatus.VALIDATED,
      clientNom: 'Magasin Sfax Centre', clientAdresse: 'Avenue Bourguiba, Sfax 3000',
      origine: 'Tunis', destination: 'Sfax',
      typeChargement: TypeChargement.PALETTE, tonnageTotal: 4.5, nombrePalettes: 9,
      datelivraison: new Date('2025-05-10'), erpReference: 'ERP-10045',
      notes: 'Livraison avant 10h, appeler avant',
    },
    {
      numeroBl: 'BL-2025-002', statut: BlStatus.VALIDATED,
      clientNom: 'Distributor Sousse', clientAdresse: 'Route de Tunis km 4, Sousse 4000',
      origine: 'Sfax', destination: 'Sousse',
      typeChargement: TypeChargement.VRAC, tonnageTotal: 6.0, nombrePalettes: 0,
      datelivraison: new Date('2025-05-10'), erpReference: 'ERP-10046',
      notes: '',
    },
    {
      numeroBl: 'BL-2025-003', statut: BlStatus.VALIDATED,
      clientNom: 'Frais Express Sfax', clientAdresse: 'Zone Industrielle El Ain, Sfax',
      origine: 'Sousse', destination: 'Sfax',
      typeChargement: TypeChargement.FRIGO, tonnageTotal: 3.0, nombrePalettes: 6,
      datelivraison: new Date('2025-05-10'), erpReference: 'ERP-10047',
      notes: 'Température 2–4°C obligatoire — vérifier frigo avant départ',
    },
    {
      numeroBl: 'BL-2025-004', statut: BlStatus.VALIDATED,
      clientNom: 'Marché Monastir', clientAdresse: 'Centre Commercial Monastir City, Monastir',
      origine: 'Tunis', destination: 'Monastir',
      typeChargement: TypeChargement.PALETTE, tonnageTotal: 2.5, nombrePalettes: 5,
      datelivraison: new Date('2025-05-10'), erpReference: 'ERP-10048',
      notes: '',
    },
    {
      numeroBl: 'BL-2025-005', statut: BlStatus.VALIDATED,
      clientNom: 'Industriel Gabès ', clientAdresse: 'Zone Chimique, Port de Gabès',
      origine: 'Sfax', destination: 'Gabès',
      typeChargement: TypeChargement.CITERNE, tonnageTotal: 8.0, nombrePalettes: 0,
      datelivraison: new Date('2025-05-10'), erpReference: 'ERP-10049',
      notes: 'Matières premières — certificat de conformité requis',
    },
    {
      numeroBl: 'BL-2025-006', statut: BlStatus.VALIDATED,
      clientNom: 'Grossiste Sousse Nord', clientAdresse: 'Route El Ain km 2, Sousse',
      origine: 'Kairouan', destination: 'Sousse',
      typeChargement: TypeChargement.VRAC, tonnageTotal: 5.5, nombrePalettes: 0,
      datelivraison: new Date('2025-05-10'), erpReference: 'ERP-10050',
      notes: '',
    },
    {
      numeroBl: 'BL-2025-007', statut: BlStatus.VALIDATED,
      clientNom: 'Hypermarché Sfax Mall', clientAdresse: 'Sfax Mall, Route Nationale 1',
      origine: 'Tunis', destination: 'Sfax',
      typeChargement: TypeChargement.PALETTE, tonnageTotal: 3.8, nombrePalettes: 8,
      datelivraison: new Date('2025-05-10'), erpReference: 'ERP-10051',
      notes: 'Produits fragiles — manutention soigneuse',
    },
    {
      numeroBl: 'BL-2025-008', statut: BlStatus.VALIDATED,
      clientNom: 'Entrepôt Kairouan', clientAdresse: 'Zone Logistique, Kairouan 3100',
      origine: 'Sousse', destination: 'Kairouan',
      typeChargement: TypeChargement.VRAC, tonnageTotal: 7.2, nombrePalettes: 0,
      datelivraison: new Date('2025-05-10'), erpReference: 'ERP-10052',
      notes: '',
    },
    {
      numeroBl: 'BL-2025-009', statut: BlStatus.VALIDATED,
      clientNom: 'BioFrais Nabeul', clientAdresse: 'Zone Artisanale, Nabeul 8000',
      origine: 'Tunis', destination: 'Nabeul',
      typeChargement: TypeChargement.FRIGO, tonnageTotal: 2.0, nombrePalettes: 4,
      datelivraison: new Date('2025-05-10'), erpReference: 'ERP-10053',
      notes: 'Produits laitiers',
    },
    {
      numeroBl: 'BL-2025-010', statut: BlStatus.VALIDATED,
      clientNom: 'Centrale Bizerte', clientAdresse: 'Port de Bizerte, Menzel Bourguiba',
      origine: 'Tunis', destination: 'Bizerte',
      typeChargement: TypeChargement.VRAC, tonnageTotal: 9.0, nombrePalettes: 0,
      datelivraison: new Date('2025-05-10'), erpReference: 'ERP-10054',
      notes: '',
    },
    // ── DRAFT (en attente de validation) ─────────────────────────────────
    {
      numeroBl: 'BL-2025-011', statut: BlStatus.DRAFT,
      clientNom: 'Mahdia Export', clientAdresse: 'Port de Mahdia',
      origine: 'Sfax', destination: 'Mahdia',
      typeChargement: TypeChargement.PALETTE, tonnageTotal: 3.2, nombrePalettes: 7,
      datelivraison: new Date('2025-05-12'), erpReference: 'ERP-10055',
      notes: '',
    },
    {
      numeroBl: 'BL-2025-012', statut: BlStatus.DRAFT,
      clientNom: 'Gafsa Mining Supply', clientAdresse: 'Zone Minière, Gafsa',
      origine: 'Tunis', destination: 'Gafsa',
      typeChargement: TypeChargement.CITERNE, tonnageTotal: 12.0, nombrePalettes: 0,
      datelivraison: new Date('2025-05-13'), erpReference: 'ERP-10056',
      notes: 'Huile industrielle',
    },
  ];

  for (const data of blData) {
    const bl = blRepo.create({ ...data, company: { id: company.id } });
    await blRepo.save(bl);
    console.log(`  ✓ ${data.numeroBl} [${data.statut}] ${data.origine} → ${data.destination} (${data.tonnageTotal}T)`);
  }

  console.log('\n=== COMPTES ===');
  console.log('Resp. Logistique : logistique@tms.com / Logistique123!');
  console.log('Super Admin      : admin@tms.com       / Admin123!');
  console.log('\n=== BLs ===');
  console.log('10 BLs VALIDATED → visibles dans le planning');
  console.log(' 2 BLs DRAFT     → à valider par le Resp. Logistique');

  await app.close();
}

seed().catch(console.error);
