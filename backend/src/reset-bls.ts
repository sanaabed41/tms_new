import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BonLivraison, TypeChargement } from './bons-livraison/bon-livraison.entity';
import { BlStatus } from './common/enums/bl-status.enum';
import { UsersService } from './users/users.service';
import { CompaniesService } from './companies/companies.service';

async function resetBls() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const blRepo = app.get<Repository<BonLivraison>>(getRepositoryToken(BonLivraison));
  const companiesService = app.get(CompaniesService);

  // Récupérer la première société
  const companies = await companiesService.findAll();
  if (!companies.length) {
    console.error('❌ Aucune société trouvée — lance le seed principal d\'abord');
    await app.close();
    return;
  }
  const company = companies[0];
  console.log(`✓ Société: ${company.nom}`);

  // Supprimer tous les BLs existants
  await blRepo.query(`DELETE FROM bl_articles`);
  await blRepo.query(`UPDATE bons_livraison SET "loadingPlanId" = NULL`);
  await blRepo.query(`DELETE FROM loading_plans`);
  await blRepo.query(`DELETE FROM bons_livraison`);
  console.log('✓ Anciens BLs supprimés');

  // Recréer les BLs avec origine + destination
  const blData = [
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
      notes: 'Température 2–4°C obligatoire',
    },
    {
      numeroBl: 'BL-2025-004', statut: BlStatus.VALIDATED,
      clientNom: 'Marché Monastir', clientAdresse: 'Centre Commercial Monastir City',
      origine: 'Tunis', destination: 'Monastir',
      typeChargement: TypeChargement.PALETTE, tonnageTotal: 2.5, nombrePalettes: 5,
      datelivraison: new Date('2025-05-10'), erpReference: 'ERP-10048',
      notes: '',
    },
    {
      numeroBl: 'BL-2025-005', statut: BlStatus.VALIDATED,
      clientNom: 'Industriel Gabès  ', clientAdresse: 'Zone Chimique, Port de Gabès',
      origine: 'Sfax', destination: 'Gabès',
      typeChargement: TypeChargement.CITERNE, tonnageTotal: 8.0, nombrePalettes: 0,
      datelivraison: new Date('2025-05-10'), erpReference: 'ERP-10049',
      notes: 'Certificat de conformité requis',
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
      notes: 'Produits fragiles',
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

  console.log(`\n✅ ${blData.length} BLs recréés avec origine & destination`);
  await app.close();
}

resetBls().catch(console.error);
