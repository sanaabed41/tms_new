"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const typeorm_1 = require("@nestjs/typeorm");
const company_entity_1 = require("./companies/company.entity");
const user_entity_1 = require("./users/user.entity");
const delivery_company_entity_1 = require("./delivery-companies/delivery-company.entity");
const truck_entity_1 = require("./trucks/truck.entity");
const article_entity_1 = require("./articles/article.entity");
const societe_expeditrice_entity_1 = require("./expediteurs/societe-expeditrice.entity");
const filiere_entity_1 = require("./expediteurs/filiere.entity");
const bon_livraison_entity_1 = require("./bons-livraison/bon-livraison.entity");
const bl_article_entity_1 = require("./bons-livraison/bl-article.entity");
const bl_status_enum_1 = require("./common/enums/bl-status.enum");
let blSeq = 2000;
const nextBl = () => `RB-${String(++blSeq).padStart(4, '0')}`;
async function findOrCreate(repo, where, creator) {
    const found = await repo.findOne({ where });
    if (found)
        return found;
    return repo.save(creator());
}
async function seed() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, { logger: ['error'] });
    const companyRepo = app.get((0, typeorm_1.getRepositoryToken)(company_entity_1.Company));
    const userRepo = app.get((0, typeorm_1.getRepositoryToken)(user_entity_1.User));
    const dcRepo = app.get((0, typeorm_1.getRepositoryToken)(delivery_company_entity_1.DeliveryCompany));
    const truckRepo = app.get((0, typeorm_1.getRepositoryToken)(truck_entity_1.Truck));
    const artRepo = app.get((0, typeorm_1.getRepositoryToken)(article_entity_1.Article));
    const seRepo = app.get((0, typeorm_1.getRepositoryToken)(societe_expeditrice_entity_1.SocieteExpeditrice));
    const filRepo = app.get((0, typeorm_1.getRepositoryToken)(filiere_entity_1.Filiere));
    const blRepo = app.get((0, typeorm_1.getRepositoryToken)(bon_livraison_entity_1.BonLivraison));
    const blaRepo = app.get((0, typeorm_1.getRepositoryToken)(bl_article_entity_1.BlArticle));
    console.log('\n🌱  Seeder Rose Blanche — démarrage...\n');
    let company = await companyRepo.findOne({ where: { nom: 'TransFood' } });
    if (!company) {
        console.log('⚠️   Société introuvable — création de "TransFood"...');
        company = await companyRepo.save(companyRepo.create({
            nom: 'TransFood',
            adresse: 'Route de la Marsa, Tunis',
            telephone: '+216 71 000 000',
            isActive: true,
        }));
        const logUser = await userRepo.findOne({ where: { email: 'logistique@tms.com' } });
        if (logUser && !logUser.company) {
            await userRepo.update(logUser.id, { company });
            console.log('   ✅  logistique@tms.com rattaché à TransFood');
        }
    }
    console.log(`✅  Société : ${company.nom}\n`);
    const co = company;
    const dcSafrat = await findOrCreate(dcRepo, { nom: 'SAFRAT Transport' }, () => dcRepo.create({ nom: 'SAFRAT Transport', adresse: 'Rue de la Mecque, Sfax 3000', telephone: '+216 74 111 222', company: co }));
    const dcTunisEx = await findOrCreate(dcRepo, { nom: 'TunisExpress Logistique' }, () => dcRepo.create({ nom: 'TunisExpress Logistique', adresse: 'Avenue Bourguiba, Sousse 4000', telephone: '+216 73 333 444', company: co }));
    const dcMaghreb = await findOrCreate(dcRepo, { nom: 'Maghreb Transit' }, () => dcRepo.create({ nom: 'Maghreb Transit', adresse: 'Zone Logistique, Tunis 2036', telephone: '+216 71 222 333', company: co }));
    for (const s of [
        { matricule: '247 TUN 1234', capaciteTonnage: 24, capacitePalettes: 33, type: 'Semi-remorque' },
        { matricule: '189 TUN 5678', capaciteTonnage: 20, capacitePalettes: 28, type: 'Plateau' },
        { matricule: '150 TUN 9012', capaciteTonnage: 15, capacitePalettes: 20, type: 'Fourgon' },
    ]) {
        await findOrCreate(truckRepo, { matricule: s.matricule }, () => truckRepo.create({ ...s, isActive: true, deliveryCompany: dcSafrat }));
    }
    console.log('✅  3 camions SAFRAT (palette)');
    for (const s of [
        { matricule: '320 TUN 3333', capaciteTonnage: 32, capacitePalettes: 0, type: 'Citerne farine' },
        { matricule: '280 TUN 4444', capaciteTonnage: 28, capacitePalettes: 0, type: 'Citerne farine' },
    ]) {
        await findOrCreate(truckRepo, { matricule: s.matricule }, () => truckRepo.create({ ...s, isActive: true, deliveryCompany: dcTunisEx }));
    }
    console.log('✅  2 camions TunisExpress (citerne)');
    for (const s of [
        { matricule: '410 TUN 7777', capaciteTonnage: 18, capacitePalettes: 22, type: 'Frigorifique' },
        { matricule: '390 TUN 8888', capaciteTonnage: 14, capacitePalettes: 18, type: 'Frigorifique' },
        { matricule: '350 TUN 9999', capaciteTonnage: 10, capacitePalettes: 14, type: 'Fourgon frigo' },
    ]) {
        await findOrCreate(truckRepo, { matricule: s.matricule }, () => truckRepo.create({ ...s, isActive: true, deliveryCompany: dcMaghreb }));
    }
    console.log('✅  3 camions Maghreb Transit (frigo)\n');
    const artSpecs = [
        { code: 'PB-SPG-500', libelle: 'Spaghetti 500g', poidsUnitaire: 0.5, unite: 'Colis' },
        { code: 'PB-MAC-500', libelle: 'Macaroni 500g', poidsUnitaire: 0.5, unite: 'Colis' },
        { code: 'PB-FUS-500', libelle: 'Fusilli 500g', poidsUnitaire: 0.5, unite: 'Colis' },
        { code: 'PB-PEN-500', libelle: 'Penne 500g', poidsUnitaire: 0.5, unite: 'Colis' },
        { code: 'PB-TAG-500', libelle: 'Tagliatelle 500g', poidsUnitaire: 0.5, unite: 'Colis' },
        { code: 'MC-SG-1KG', libelle: 'Semoule Grossière 1kg', poidsUnitaire: 1.0, unite: 'Sac' },
        { code: 'MC-SF-1KG', libelle: 'Semoule Fine 1kg', poidsUnitaire: 1.0, unite: 'Sac' },
        { code: 'MC-SM-5KG', libelle: 'Semoule Moyenne 5kg', poidsUnitaire: 5.0, unite: 'Sac' },
        { code: 'MC-SG-5KG', libelle: 'Semoule Grossière 5kg', poidsUnitaire: 5.0, unite: 'Sac' },
        { code: 'CCS-FIN-1K', libelle: 'Couscous Fin 1kg', poidsUnitaire: 1.0, unite: 'Sachet' },
        { code: 'CCS-MOY-1K', libelle: 'Couscous Moyen 1kg', poidsUnitaire: 1.0, unite: 'Sachet' },
        { code: 'CCS-GRO-1K', libelle: 'Couscous Gros 1kg', poidsUnitaire: 1.0, unite: 'Sachet' },
        { code: 'CCS-FIN-5K', libelle: 'Couscous Fin 5kg', poidsUnitaire: 5.0, unite: 'Sachet' },
    ];
    const articles = {};
    for (const s of artSpecs) {
        articles[s.code] = await findOrCreate(artRepo, { code: s.code }, () => artRepo.create(s));
    }
    console.log(`✅  ${artSpecs.length} articles Rose Blanche\n`);
    const roseBlanche = await findOrCreate(seRepo, { nom: 'Rose Blanche', company: { id: company.id } }, () => seRepo.create({ nom: 'Rose Blanche', code: 'RB', couleur: '#e83e8c', adresse: 'Zone Industrielle El Agba, Tunis', telephone: '+216 71 555 666', company: co }));
    const filPate = await findOrCreate(filRepo, { nom: 'Pâte Blanche', societeExpeditrice: { id: roseBlanche.id } }, () => filRepo.create({ nom: 'Pâte Blanche', code: 'PB', societeExpeditrice: roseBlanche }));
    const filMcsr = await findOrCreate(filRepo, { nom: 'MCSR', societeExpeditrice: { id: roseBlanche.id } }, () => filRepo.create({ nom: 'MCSR', code: 'MCSR', societeExpeditrice: roseBlanche }));
    const filCouscous = await findOrCreate(filRepo, { nom: 'Couscous', societeExpeditrice: { id: roseBlanche.id } }, () => filRepo.create({ nom: 'Couscous', code: 'CCS', societeExpeditrice: roseBlanche }));
    console.log('✅  Rose Blanche (#e83e8c) + 3 filières : Pâte Blanche | MCSR | Couscous\n');
    const TODAY = new Date().toISOString().split('T')[0];
    async function makeBl(params) {
        const numeroBl = nextBl();
        const existing = await blRepo.findOne({ where: { numeroBl } });
        if (existing) {
            console.log(`  ⏭️   ${numeroBl}  déjà existant — ignoré`);
            return existing;
        }
        const tonnageTotal = params.lignes.reduce((s, l) => s + (articles[l.code]?.poidsUnitaire ?? 0) * l.qte, 0);
        const entity = blRepo.create({
            numeroBl,
            clientNom: params.client,
            clientAdresse: params.adresse,
            origine: 'Tunis — El Agba',
            destination: params.destination,
            typeChargement: params.type,
            tonnageTotal: Math.round(tonnageTotal * 100) / 100,
            nombrePalettes: params.palettes,
            statut: bl_status_enum_1.BlStatus.VALIDATED,
            datelivraison: new Date(TODAY),
            notes: params.notes || '',
            company: co,
            societeExpeditrice: roseBlanche,
            filiere: params.filiere,
        });
        const bl = (await blRepo.save(entity));
        for (const l of params.lignes) {
            const art = articles[l.code];
            if (!art)
                continue;
            const bla = blaRepo.create({
                bonLivraison: bl,
                article: art,
                quantite: l.qte,
                poidsTotal: Math.round(art.poidsUnitaire * l.qte * 100) / 100,
            });
            await blaRepo.save(bla);
        }
        console.log(`  📄  ${bl.numeroBl}  [${params.filiere.code.padEnd(5)}]  → ${params.destination.padEnd(10)}  ${String(bl.tonnageTotal).padStart(5)} T${params.palettes > 0 ? `  ${params.palettes} pal` : '  vrac'}`);
        return bl;
    }
    console.log('📦  BL disponibles :\n');
    await makeBl({ filiere: filPate, destination: 'Sfax',
        client: 'Épicerie Moderne Sfax', adresse: 'Rue Farhat Hached, Sfax 3000',
        type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 12,
        lignes: [{ code: 'PB-SPG-500', qte: 4000 }, { code: 'PB-MAC-500', qte: 6000 }, { code: 'PB-FUS-500', qte: 4000 }] });
    await makeBl({ filiere: filMcsr, destination: 'Sfax',
        client: 'Grossiste du Sud', adresse: 'Zone Commerciale Thyna, Sfax',
        type: bon_livraison_entity_1.TypeChargement.VRAC, palettes: 0,
        notes: 'Vrac — prévoir bâcheétanche',
        lignes: [{ code: 'MC-SG-1KG', qte: 3000 }, { code: 'MC-SF-1KG', qte: 3000 }] });
    await makeBl({ filiere: filCouscous, destination: 'Sfax',
        client: 'Supérette Sfaxia', adresse: 'Avenue de la Liberté, Sfax',
        type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 8,
        lignes: [{ code: 'CCS-FIN-1K', qte: 2000 }, { code: 'CCS-MOY-1K', qte: 2000 }] });
    await makeBl({ filiere: filPate, destination: 'Sousse',
        client: 'Carrefour Sousse', adresse: 'Route de Tunis km 3, Sousse',
        type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 16,
        lignes: [{ code: 'PB-SPG-500', qte: 5000 }, { code: 'PB-PEN-500', qte: 5000 }, { code: 'PB-MAC-500', qte: 3000 }] });
    await makeBl({ filiere: filCouscous, destination: 'Sousse',
        client: 'Monoprix Hammam-Sousse', adresse: 'Rue du Commerce, Hammam-Sousse',
        type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 10,
        lignes: [{ code: 'CCS-FIN-1K', qte: 3000 }, { code: 'CCS-GRO-1K', qte: 2500 }] });
    await makeBl({ filiere: filMcsr, destination: 'Sousse',
        client: 'Minoterie El Amal', adresse: 'Zone Industrielle, Kalaa Kebira',
        type: bon_livraison_entity_1.TypeChargement.VRAC, palettes: 0,
        lignes: [{ code: 'MC-SG-5KG', qte: 1200 }, { code: 'MC-SF-1KG', qte: 2000 }] });
    await makeBl({ filiere: filMcsr, destination: 'Nabeul',
        client: 'Minoterie El Faouzi Nabeul', adresse: 'Zone Artisanale, Nabeul 8000',
        type: bon_livraison_entity_1.TypeChargement.CITERNE, palettes: 0,
        notes: 'Transport en citerne — certificat sanitaire obligatoire',
        lignes: [{ code: 'MC-SM-5KG', qte: 5600 }] });
    await makeBl({ filiere: filPate, destination: 'Bizerte',
        client: 'Grossiste Bizerte Nord', adresse: 'Menzel Bourguiba, Bizerte',
        type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 20,
        lignes: [{ code: 'PB-SPG-500', qte: 8000 }, { code: 'PB-FUS-500', qte: 4000 }] });
    await makeBl({ filiere: filCouscous, destination: 'Bizerte',
        client: 'Supermarché Bizerte Plage', adresse: 'Route de la Corniche, Bizerte',
        type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 6,
        lignes: [{ code: 'CCS-FIN-5K', qte: 500 }, { code: 'CCS-MOY-1K', qte: 1500 }] });
    await makeBl({ filiere: filPate, destination: 'Monastir',
        client: 'Épicerie El Mourouj Monastir', adresse: 'Centre Ville, Monastir',
        type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 6,
        lignes: [{ code: 'PB-MAC-500', qte: 3000 }, { code: 'PB-PEN-500', qte: 3000 }] });
    await makeBl({ filiere: filCouscous, destination: 'Monastir',
        client: 'Supermarché Médina Monastir', adresse: 'Rue Ibn Khaldoun, Monastir',
        type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 5,
        lignes: [{ code: 'CCS-MOY-1K', qte: 2000 }, { code: 'CCS-FIN-1K', qte: 1500 }] });
    await makeBl({ filiere: filMcsr, destination: 'Kairouan',
        client: 'Marché Central Kairouan', adresse: 'Souk El Ahad, Kairouan',
        type: bon_livraison_entity_1.TypeChargement.VRAC, palettes: 0,
        lignes: [{ code: 'MC-SG-1KG', qte: 8000 }, { code: 'MC-SF-1KG', qte: 6000 }] });
    await makeBl({ filiere: filPate, destination: 'Gabès',
        client: 'Épicerie Sud Gabès', adresse: 'Rue de la Gare, Gabès',
        type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 8,
        lignes: [{ code: 'PB-TAG-500', qte: 4000 }, { code: 'PB-SPG-500', qte: 4000 }] });
    await makeBl({ filiere: filMcsr, destination: 'Gabès',
        client: 'Moulin du Sud Gabès', adresse: 'Zone Industrielle, Gabès',
        type: bon_livraison_entity_1.TypeChargement.VRAC, palettes: 0,
        lignes: [{ code: 'MC-SG-5KG', qte: 1000 }, { code: 'MC-SG-1KG', qte: 3000 }] });
    await makeBl({ filiere: filPate, destination: 'Tunis',
        client: 'Hypermarché Géant Lac', adresse: 'Les Berges du Lac, Tunis',
        type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 14,
        lignes: [{ code: 'PB-SPG-500', qte: 6000 }, { code: 'PB-MAC-500', qte: 4000 }, { code: 'PB-FUS-500', qte: 4000 }] });
    await makeBl({ filiere: filCouscous, destination: 'Tunis',
        client: 'Carrefour Tunis City', adresse: 'Centre Ville, Tunis',
        type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 10,
        lignes: [{ code: 'CCS-FIN-1K', qte: 4000 }, { code: 'CCS-MOY-1K', qte: 3000 }, { code: 'CCS-GRO-1K', qte: 2000 }] });
    await makeBl({ filiere: filMcsr, destination: 'Tunis',
        client: 'Boulangerie El Hana', adresse: 'Rue de Marseille, Tunis',
        type: bon_livraison_entity_1.TypeChargement.VRAC, palettes: 0,
        lignes: [{ code: 'MC-SF-1KG', qte: 5000 }, { code: 'MC-SG-1KG', qte: 3000 }] });
    await makeBl({ filiere: filPate, destination: 'Gafsa',
        client: 'Supermarché Gafsa Central', adresse: 'Avenue Bourguiba, Gafsa',
        type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 10,
        lignes: [{ code: 'PB-SPG-500', qte: 5000 }, { code: 'PB-FUS-500', qte: 3000 }] });
    await makeBl({ filiere: filCouscous, destination: 'Gafsa',
        client: 'Epicerie Sahara Gafsa', adresse: 'Route de Tozeur, Gafsa',
        type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 6,
        lignes: [{ code: 'CCS-FIN-5K', qte: 600 }, { code: 'CCS-MOY-1K', qte: 2000 }] });
    console.log('\n' + '─'.repeat(60));
    console.log('✅  Seeder Rose Blanche terminé !');
    console.log('─'.repeat(60));
    console.log('\n  Connexion : logistique@tms.com / Logistique123!');
    console.log('  Planning → grouper par "Expéditeur" ou "Destination"\n');
    await app.close();
}
seed().catch((err) => {
    console.error('❌  Erreur :', err.message);
    process.exit(1);
});
//# sourceMappingURL=seed-rose-blanche.js.map