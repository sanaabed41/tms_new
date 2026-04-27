"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const typeorm_1 = require("@nestjs/typeorm");
const company_entity_1 = require("./companies/company.entity");
const article_entity_1 = require("./articles/article.entity");
const societe_expeditrice_entity_1 = require("./expediteurs/societe-expeditrice.entity");
const filiere_entity_1 = require("./expediteurs/filiere.entity");
const bon_livraison_entity_1 = require("./bons-livraison/bon-livraison.entity");
const bl_article_entity_1 = require("./bons-livraison/bl-article.entity");
const bl_status_enum_1 = require("./common/enums/bl-status.enum");
let seq = 3000;
const nextBl = (prefix) => `${prefix}-${String(++seq).padStart(4, '0')}`;
async function findOrCreate(repo, where, creator) {
    const found = await repo.findOne({ where });
    if (found)
        return found;
    return repo.save(creator());
}
async function seed() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, { logger: ['error'] });
    const companyRepo = app.get((0, typeorm_1.getRepositoryToken)(company_entity_1.Company));
    const artRepo = app.get((0, typeorm_1.getRepositoryToken)(article_entity_1.Article));
    const seRepo = app.get((0, typeorm_1.getRepositoryToken)(societe_expeditrice_entity_1.SocieteExpeditrice));
    const filRepo = app.get((0, typeorm_1.getRepositoryToken)(filiere_entity_1.Filiere));
    const blRepo = app.get((0, typeorm_1.getRepositoryToken)(bon_livraison_entity_1.BonLivraison));
    const blaRepo = app.get((0, typeorm_1.getRepositoryToken)(bl_article_entity_1.BlArticle));
    console.log('\n🌱  Seeder BLs Demo (50 BLs) — démarrage...\n');
    const company = await companyRepo.findOne({ where: { nom: 'TransFood' } });
    if (!company) {
        console.error('❌  Société introuvable. Lance npm run seed:rb en premier.');
        await app.close();
        process.exit(1);
    }
    const co = company;
    const arts = {};
    for (const code of ['PB-SPG-500', 'PB-MAC-500', 'PB-FUS-500', 'PB-PEN-500', 'PB-TAG-500',
        'MC-SG-1KG', 'MC-SF-1KG', 'MC-SM-5KG', 'MC-SG-5KG',
        'CCS-FIN-1K', 'CCS-MOY-1K', 'CCS-GRO-1K', 'CCS-FIN-5K']) {
        const a = await artRepo.findOne({ where: { code } });
        if (a)
            arts[code] = a;
    }
    const tlArts = [
        { code: 'TL-LAIT-1L', libelle: 'Lait Frais 1L', poidsUnitaire: 1.03, unite: 'Bouteille' },
        { code: 'TL-LAIT-DM', libelle: 'Lait Demi-écrémé 1L', poidsUnitaire: 1.03, unite: 'Bouteille' },
        { code: 'TL-YAO-125', libelle: 'Yaourt Nature 125g', poidsUnitaire: 0.13, unite: 'Pot' },
        { code: 'TL-YAO-FRU', libelle: 'Yaourt Fruits 125g', poidsUnitaire: 0.14, unite: 'Pot' },
        { code: 'TL-FRM-200', libelle: 'Fromage Frais 200g', poidsUnitaire: 0.21, unite: 'Boîte' },
        { code: 'TL-BRR-250', libelle: 'Beurre 250g', poidsUnitaire: 0.26, unite: 'Plaquette' },
        { code: 'TL-CRM-200', libelle: 'Crème fraîche 200ml', poidsUnitaire: 0.21, unite: 'Pot' },
    ];
    for (const s of tlArts) {
        arts[s.code] = await findOrCreate(artRepo, { code: s.code }, () => artRepo.create(s));
    }
    const hcArts = [
        { code: 'HC-OLV-1L', libelle: "Huile d'Olive Extra Vierge 1L", poidsUnitaire: 0.92, unite: 'Bouteille' },
        { code: 'HC-OLV-5L', libelle: "Huile d'Olive 5L", poidsUnitaire: 4.60, unite: 'Bidon' },
        { code: 'HC-VEG-1L', libelle: 'Huile Végétale 1L', poidsUnitaire: 0.92, unite: 'Bouteille' },
        { code: 'HC-VEG-5L', libelle: 'Huile Végétale 5L', poidsUnitaire: 4.60, unite: 'Bidon' },
        { code: 'HC-TON-20L', libelle: 'Huile Végétale 20L (tonne)', poidsUnitaire: 18.4, unite: 'Bidon' },
    ];
    for (const s of hcArts) {
        arts[s.code] = await findOrCreate(artRepo, { code: s.code }, () => artRepo.create(s));
    }
    const brArts = [
        { code: 'BR-EAU-05L', libelle: 'Eau Minérale 0.5L', poidsUnitaire: 0.52, unite: 'Bouteille' },
        { code: 'BR-EAU-1L5', libelle: 'Eau Minérale 1.5L', poidsUnitaire: 1.55, unite: 'Bouteille' },
        { code: 'BR-JUS-1L', libelle: 'Jus de Fruits 1L', poidsUnitaire: 1.05, unite: 'Bouteille' },
        { code: 'BR-SOD-33', libelle: 'Soda 33cl canette', poidsUnitaire: 0.37, unite: 'Canette' },
        { code: 'BR-SOD-1L5', libelle: 'Soda 1.5L', poidsUnitaire: 1.60, unite: 'Bouteille' },
    ];
    for (const s of brArts) {
        arts[s.code] = await findOrCreate(artRepo, { code: s.code }, () => artRepo.create(s));
    }
    console.log(`✅  Articles chargés/créés\n`);
    const rb = await seRepo.findOne({ where: { nom: 'Rose Blanche', company: { id: co.id } } });
    if (!rb) {
        console.error('❌  Rose Blanche introuvable. Lance seed:rb.');
        await app.close();
        process.exit(1);
    }
    const filPB = await filRepo.findOne({ where: { nom: 'Pâte Blanche', societeExpeditrice: { id: rb.id } } });
    const filMC = await filRepo.findOne({ where: { nom: 'MCSR', societeExpeditrice: { id: rb.id } } });
    const filCCS = await filRepo.findOne({ where: { nom: 'Couscous', societeExpeditrice: { id: rb.id } } });
    const tl = await findOrCreate(seRepo, { nom: 'Tunisie Lait', company: { id: co.id } }, () => seRepo.create({ nom: 'Tunisie Lait', code: 'TL', couleur: '#1890ff',
        adresse: 'Route de Bizerte km 12, Tunis', telephone: '+216 71 777 888', company: co }));
    const filLait = await findOrCreate(filRepo, { nom: 'Lait Frais', societeExpeditrice: { id: tl.id } }, () => filRepo.create({ nom: 'Lait Frais', code: 'LF', societeExpeditrice: tl }));
    const filYaourt = await findOrCreate(filRepo, { nom: 'Yaourts & Fromages', societeExpeditrice: { id: tl.id } }, () => filRepo.create({ nom: 'Yaourts & Fromages', code: 'YF', societeExpeditrice: tl }));
    const hc = await findOrCreate(seRepo, { nom: 'Huile Carthage', company: { id: co.id } }, () => seRepo.create({ nom: 'Huile Carthage', code: 'HC', couleur: '#fa8c16',
        adresse: 'Zone Industrielle Sfax', telephone: '+216 74 333 555', company: co }));
    const filOlive = await findOrCreate(filRepo, { nom: "Huile d'Olive", societeExpeditrice: { id: hc.id } }, () => filRepo.create({ nom: "Huile d'Olive", code: 'HO', societeExpeditrice: hc }));
    const filVeg = await findOrCreate(filRepo, { nom: 'Huile Végétale', societeExpeditrice: { id: hc.id } }, () => filRepo.create({ nom: 'Huile Végétale', code: 'HV', societeExpeditrice: hc }));
    const boisExp = await findOrCreate(seRepo, { nom: 'Boissons Rafraîchissantes', company: { id: co.id } }, () => seRepo.create({ nom: 'Boissons Rafraîchissantes', code: 'BR', couleur: '#52c41a',
        adresse: 'Zone Industrielle, Ben Arous', telephone: '+216 71 444 999', company: co }));
    const filEau = await findOrCreate(filRepo, { nom: 'Eau & Jus', societeExpeditrice: { id: boisExp.id } }, () => filRepo.create({ nom: 'Eau & Jus', code: 'EJ', societeExpeditrice: boisExp }));
    const filSoda = await findOrCreate(filRepo, { nom: 'Sodas', societeExpeditrice: { id: boisExp.id } }, () => filRepo.create({ nom: 'Sodas', code: 'SD', societeExpeditrice: boisExp }));
    console.log('✅  4 expéditeurs + filières prêts\n');
    const TODAY = new Date().toISOString().split('T')[0];
    let created = 0;
    async function makeBl(p) {
        const numeroBl = nextBl(p.prefix);
        const existing = await blRepo.findOne({ where: { numeroBl } });
        if (existing) {
            console.log(`  ⏭️  ${numeroBl} déjà existant`);
            return;
        }
        const entity = blRepo.create({
            numeroBl,
            clientNom: p.client,
            clientAdresse: p.adresse,
            origine: 'Tunis',
            destination: p.destination,
            typeChargement: p.type,
            tonnageTotal: p.tonnage,
            nombrePalettes: p.palettes,
            statut: bl_status_enum_1.BlStatus.VALIDATED,
            datelivraison: new Date(TODAY),
            notes: p.notes || '',
            company: co,
            societeExpeditrice: p.exp,
            filiere: p.filiere,
        });
        const bl = (await blRepo.save(entity));
        for (const l of p.lignes) {
            const art = arts[l.code];
            if (!art)
                continue;
            await blaRepo.save(blaRepo.create({
                bonLivraison: bl, article: art,
                quantite: l.qte,
                poidsTotal: Math.round(art.poidsUnitaire * l.qte * 100) / 100,
            }));
        }
        console.log(`  📄  ${bl.numeroBl}  [${p.exp.code.padEnd(3)}/${p.filiere.code.padEnd(4)}]  → ${p.destination.padEnd(12)}  ${String(p.tonnage).padStart(5)} T${p.palettes > 0 ? `  ${p.palettes} pal` : '  vrac'}`);
        created++;
    }
    console.log('\n📦  Rose Blanche — Pâte Blanche :');
    await makeBl({ prefix: 'RB', exp: rb, filiere: filPB, client: 'Carrefour Tunis La Marsa', adresse: 'Rue du Lac, Tunis', destination: 'Tunis', type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 14, tonnage: 7.00, lignes: [{ code: 'PB-SPG-500', qte: 8000 }, { code: 'PB-MAC-500', qte: 6000 }] });
    await makeBl({ prefix: 'RB', exp: rb, filiere: filPB, client: 'Monoprix Ariana', adresse: 'Centre Ville, Ariana', destination: 'Ariana', type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 10, tonnage: 5.00, lignes: [{ code: 'PB-PEN-500', qte: 6000 }, { code: 'PB-FUS-500', qte: 4000 }] });
    await makeBl({ prefix: 'RB', exp: rb, filiere: filPB, client: 'Epicerie Ben Arous Centre', adresse: 'Av. Habib Bourguiba, Ben Arous', destination: 'Ben Arous', type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 8, tonnage: 4.00, lignes: [{ code: 'PB-TAG-500', qte: 4000 }, { code: 'PB-SPG-500', qte: 4000 }] });
    await makeBl({ prefix: 'RB', exp: rb, filiere: filPB, client: 'Grossiste Zaghouan', adresse: 'Route de Tunis, Zaghouan', destination: 'Zaghouan', type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 6, tonnage: 3.00, lignes: [{ code: 'PB-MAC-500', qte: 6000 }] });
    await makeBl({ prefix: 'RB', exp: rb, filiere: filPB, client: 'Supermarché Béja Nord', adresse: 'Av. de la République, Béja', destination: 'Béja', type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 12, tonnage: 6.00, lignes: [{ code: 'PB-SPG-500', qte: 7000 }, { code: 'PB-FUS-500', qte: 5000 }] });
    console.log('\n📦  Rose Blanche — MCSR (Semoule) :');
    await makeBl({ prefix: 'RB', exp: rb, filiere: filMC, client: 'Minoterie Kasserine', adresse: 'Zone Industrielle, Kasserine', destination: 'Kasserine', type: bon_livraison_entity_1.TypeChargement.VRAC, palettes: 0, tonnage: 12.00, lignes: [{ code: 'MC-SG-5KG', qte: 1200 }, { code: 'MC-SF-1KG', qte: 4000 }], notes: 'Vrac — bâche obligatoire' });
    await makeBl({ prefix: 'RB', exp: rb, filiere: filMC, client: 'Semoule Sidi Bouzid', adresse: 'Route de Kasserine, Sidi Bouzid', destination: 'Sidi Bouzid', type: bon_livraison_entity_1.TypeChargement.VRAC, palettes: 0, tonnage: 10.00, lignes: [{ code: 'MC-SG-1KG', qte: 5000 }, { code: 'MC-SM-5KG', qte: 1000 }] });
    await makeBl({ prefix: 'RB', exp: rb, filiere: filMC, client: 'Minoterie El Hana Médenine', adresse: 'Route de Djerba, Médenine', destination: 'Médenine', type: bon_livraison_entity_1.TypeChargement.CITERNE, palettes: 0, tonnage: 28.00, lignes: [{ code: 'MC-SM-5KG', qte: 2800 }, { code: 'MC-SG-5KG', qte: 2800 }], notes: 'Citerne farine — certificat exigé' });
    await makeBl({ prefix: 'RB', exp: rb, filiere: filMC, client: 'Grossiste Siliana', adresse: 'Centre Ville, Siliana', destination: 'Siliana', type: bon_livraison_entity_1.TypeChargement.VRAC, palettes: 0, tonnage: 8.00, lignes: [{ code: 'MC-SF-1KG', qte: 4000 }, { code: 'MC-SG-1KG', qte: 4000 }] });
    await makeBl({ prefix: 'RB', exp: rb, filiere: filMC, client: 'Minoterie Le Kef', adresse: 'Route de Jendouba, Le Kef', destination: 'Le Kef', type: bon_livraison_entity_1.TypeChargement.CITERNE, palettes: 0, tonnage: 25.00, lignes: [{ code: 'MC-SM-5KG', qte: 2500 }, { code: 'MC-SG-5KG', qte: 2500 }], notes: 'Transport citerne' });
    console.log('\n📦  Rose Blanche — Couscous :');
    await makeBl({ prefix: 'RB', exp: rb, filiere: filCCS, client: 'Carrefour Manouba', adresse: 'Centre Commercial, Manouba', destination: 'Manouba', type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 8, tonnage: 4.00, lignes: [{ code: 'CCS-FIN-1K', qte: 2000 }, { code: 'CCS-MOY-1K', qte: 2000 }] });
    await makeBl({ prefix: 'RB', exp: rb, filiere: filCCS, client: 'Supermarché Jendouba', adresse: 'Av. Bourguiba, Jendouba', destination: 'Jendouba', type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 10, tonnage: 5.00, lignes: [{ code: 'CCS-MOY-1K', qte: 3000 }, { code: 'CCS-GRO-1K', qte: 2000 }] });
    await makeBl({ prefix: 'RB', exp: rb, filiere: filCCS, client: 'Grossiste Tozeur', adresse: 'Oasis Palmeraie, Tozeur', destination: 'Tozeur', type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 5, tonnage: 4.50, lignes: [{ code: 'CCS-FIN-5K', qte: 500 }, { code: 'CCS-MOY-1K', qte: 2000 }] });
    await makeBl({ prefix: 'RB', exp: rb, filiere: filCCS, client: 'Epicerie Kébili Palmeraie', adresse: 'Route des Dunes, Kébili', destination: 'Kébili', type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 4, tonnage: 3.50, lignes: [{ code: 'CCS-FIN-5K', qte: 400 }, { code: 'CCS-GRO-1K', qte: 1500 }] });
    await makeBl({ prefix: 'RB', exp: rb, filiere: filCCS, client: 'Supermarché Tataouine', adresse: 'Av. Farhat Hached, Tataouine', destination: 'Tataouine', type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 4, tonnage: 3.00, lignes: [{ code: 'CCS-MOY-1K', qte: 1500 }, { code: 'CCS-FIN-1K', qte: 1500 }] });
    console.log('\n📦  Tunisie Lait — Lait Frais :');
    await makeBl({ prefix: 'TL', exp: tl, filiere: filLait, client: 'Monoprix Lac 2', adresse: 'Les Berges du Lac, Tunis', destination: 'Tunis', type: bon_livraison_entity_1.TypeChargement.FRIGO, palettes: 12, tonnage: 6.18, lignes: [{ code: 'TL-LAIT-1L', qte: 3000 }, { code: 'TL-LAIT-DM', qte: 3000 }] });
    await makeBl({ prefix: 'TL', exp: tl, filiere: filLait, client: 'Geant Casino Ariana', adresse: 'Ennasr, Ariana', destination: 'Ariana', type: bon_livraison_entity_1.TypeChargement.FRIGO, palettes: 10, tonnage: 5.15, lignes: [{ code: 'TL-LAIT-1L', qte: 5000 }] });
    await makeBl({ prefix: 'TL', exp: tl, filiere: filLait, client: 'Supermarché Nabeul Centre', adresse: 'Av. Habib Thameur, Nabeul', destination: 'Nabeul', type: bon_livraison_entity_1.TypeChargement.FRIGO, palettes: 8, tonnage: 4.12, lignes: [{ code: 'TL-LAIT-1L', qte: 2000 }, { code: 'TL-LAIT-DM', qte: 2000 }] });
    await makeBl({ prefix: 'TL', exp: tl, filiere: filLait, client: 'Magasin Général Bizerte', adresse: 'Av. de la Corniche, Bizerte', destination: 'Bizerte', type: bon_livraison_entity_1.TypeChargement.FRIGO, palettes: 14, tonnage: 7.21, lignes: [{ code: 'TL-LAIT-1L', qte: 7000 }] });
    await makeBl({ prefix: 'TL', exp: tl, filiere: filLait, client: 'Carrefour Sousse Mall', adresse: 'Route de Tunis, Sousse', destination: 'Sousse', type: bon_livraison_entity_1.TypeChargement.FRIGO, palettes: 16, tonnage: 8.24, lignes: [{ code: 'TL-LAIT-1L', qte: 4000 }, { code: 'TL-LAIT-DM', qte: 4000 }] });
    await makeBl({ prefix: 'TL', exp: tl, filiere: filLait, client: 'Monoprix Sfax Corniche', adresse: 'Av. de la Liberté, Sfax', destination: 'Sfax', type: bon_livraison_entity_1.TypeChargement.FRIGO, palettes: 10, tonnage: 5.15, lignes: [{ code: 'TL-LAIT-1L', qte: 5000 }] });
    await makeBl({ prefix: 'TL', exp: tl, filiere: filLait, client: 'Supermarché Gabès Medina', adresse: 'Rue Ali Belhouane, Gabès', destination: 'Gabès', type: bon_livraison_entity_1.TypeChargement.FRIGO, palettes: 8, tonnage: 4.12, lignes: [{ code: 'TL-LAIT-DM', qte: 4000 }] });
    console.log('\n📦  Tunisie Lait — Yaourts & Fromages :');
    await makeBl({ prefix: 'TL', exp: tl, filiere: filYaourt, client: 'Carrefour Tunis Centre', adresse: 'Av. Habib Bourguiba, Tunis', destination: 'Tunis', type: bon_livraison_entity_1.TypeChargement.FRIGO, palettes: 10, tonnage: 4.20, lignes: [{ code: 'TL-YAO-125', qte: 10000 }, { code: 'TL-YAO-FRU', qte: 10000 }, { code: 'TL-FRM-200', qte: 2000 }] });
    await makeBl({ prefix: 'TL', exp: tl, filiere: filYaourt, client: 'Géant Mahdia', adresse: 'Route Nationale, Mahdia', destination: 'Mahdia', type: bon_livraison_entity_1.TypeChargement.FRIGO, palettes: 8, tonnage: 3.50, lignes: [{ code: 'TL-YAO-125', qte: 8000 }, { code: 'TL-FRM-200', qte: 1500 }] });
    await makeBl({ prefix: 'TL', exp: tl, filiere: filYaourt, client: 'Epicerie Fine Hammamet', adresse: 'Av. des Hotels, Nabeul', destination: 'Nabeul', type: bon_livraison_entity_1.TypeChargement.FRIGO, palettes: 6, tonnage: 2.80, lignes: [{ code: 'TL-YAO-FRU', qte: 6000 }, { code: 'TL-BRR-250', qte: 2000 }], notes: 'Produits haut de gamme — hôtels' });
    await makeBl({ prefix: 'TL', exp: tl, filiere: filYaourt, client: 'Monastir Superstore', adresse: 'Route de Tunis, Monastir', destination: 'Monastir', type: bon_livraison_entity_1.TypeChargement.FRIGO, palettes: 7, tonnage: 3.15, lignes: [{ code: 'TL-YAO-125', qte: 8000 }, { code: 'TL-CRM-200', qte: 3000 }] });
    await makeBl({ prefix: 'TL', exp: tl, filiere: filYaourt, client: 'Casino Kairouan', adresse: 'Route de Tunis, Kairouan', destination: 'Kairouan', type: bon_livraison_entity_1.TypeChargement.FRIGO, palettes: 6, tonnage: 2.60, lignes: [{ code: 'TL-YAO-FRU', qte: 5000 }, { code: 'TL-FRM-200', qte: 2000 }] });
    await makeBl({ prefix: 'TL', exp: tl, filiere: filYaourt, client: 'Gafsa Supermarché', adresse: 'Av. Bourguiba, Gafsa', destination: 'Gafsa', type: bon_livraison_entity_1.TypeChargement.FRIGO, palettes: 5, tonnage: 2.10, lignes: [{ code: 'TL-YAO-125', qte: 5000 }, { code: 'TL-BRR-250', qte: 2000 }] });
    await makeBl({ prefix: 'TL', exp: tl, filiere: filYaourt, client: 'Monoprix Manouba', adresse: 'Centre Commercial Manouba', destination: 'Manouba', type: bon_livraison_entity_1.TypeChargement.FRIGO, palettes: 8, tonnage: 3.10, lignes: [{ code: 'TL-YAO-FRU', qte: 8000 }, { code: 'TL-CRM-200', qte: 2000 }, { code: 'TL-BRR-250', qte: 1000 }] });
    console.log('\n📦  Huile Carthage — Huile d\'Olive :');
    await makeBl({ prefix: 'HC', exp: hc, filiere: filOlive, client: 'Exportateur Tunis Port', adresse: 'Zone Portuaire, Tunis', destination: 'Tunis', type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 20, tonnage: 18.40, lignes: [{ code: 'HC-OLV-1L', qte: 10000 }, { code: 'HC-OLV-5L', qte: 1600 }], notes: 'Export — documents douane joints' });
    await makeBl({ prefix: 'HC', exp: hc, filiere: filOlive, client: 'Carrefour Sfax Thyna', adresse: 'Route de Tunis, Sfax', destination: 'Sfax', type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 14, tonnage: 10.12, lignes: [{ code: 'HC-OLV-1L', qte: 6000 }, { code: 'HC-OLV-5L', qte: 800 }] });
    await makeBl({ prefix: 'HC', exp: hc, filiere: filOlive, client: 'Grossiste Sousse Kalaa', adresse: 'Kalaa Kebira, Sousse', destination: 'Sousse', type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 12, tonnage: 8.28, lignes: [{ code: 'HC-OLV-1L', qte: 5000 }, { code: 'HC-OLV-5L', qte: 600 }] });
    await makeBl({ prefix: 'HC', exp: hc, filiere: filOlive, client: 'Boutique Terroir Béja', adresse: 'Av. de l\'Indépendance, Béja', destination: 'Béja', type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 6, tonnage: 4.60, lignes: [{ code: 'HC-OLV-1L', qte: 3000 }, { code: 'HC-OLV-5L', qte: 200 }] });
    await makeBl({ prefix: 'HC', exp: hc, filiere: filOlive, client: 'Epicerie Fine Monastir', adresse: 'Av. de la République, Monastir', destination: 'Monastir', type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 5, tonnage: 3.68, lignes: [{ code: 'HC-OLV-5L', qte: 400 }, { code: 'HC-OLV-1L', qte: 2000 }] });
    await makeBl({ prefix: 'HC', exp: hc, filiere: filOlive, client: 'Grossiste Gabès Centre', adresse: 'Rue El Jem, Gabès', destination: 'Gabès', type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 4, tonnage: 3.22, lignes: [{ code: 'HC-OLV-1L', qte: 2000 }, { code: 'HC-OLV-5L', qte: 230 }] });
    console.log('\n📦  Huile Carthage — Huile Végétale :');
    await makeBl({ prefix: 'HC', exp: hc, filiere: filVeg, client: 'Grossiste Ariana Ennasr', adresse: 'Cité Ennasr, Ariana', destination: 'Ariana', type: bon_livraison_entity_1.TypeChargement.CITERNE, palettes: 0, tonnage: 20.00, lignes: [{ code: 'HC-TON-20L', qte: 544 }], notes: 'Citerne inox alimentaire' });
    await makeBl({ prefix: 'HC', exp: hc, filiere: filVeg, client: 'Distributor Ben Arous', adresse: 'Zone Industrielle, Ben Arous', destination: 'Ben Arous', type: bon_livraison_entity_1.TypeChargement.CITERNE, palettes: 0, tonnage: 18.40, lignes: [{ code: 'HC-TON-20L', qte: 500 }], notes: 'Citerne alimentaire' });
    await makeBl({ prefix: 'HC', exp: hc, filiere: filVeg, client: 'Monoprix Kairouan', adresse: 'Av. Bourguiba, Kairouan', destination: 'Kairouan', type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 16, tonnage: 14.72, lignes: [{ code: 'HC-VEG-1L', qte: 8000 }, { code: 'HC-VEG-5L', qte: 800 }] });
    await makeBl({ prefix: 'HC', exp: hc, filiere: filVeg, client: 'Supermarché Zaghouan', adresse: 'Route de Tunis, Zaghouan', destination: 'Zaghouan', type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 8, tonnage: 7.36, lignes: [{ code: 'HC-VEG-1L', qte: 4000 }, { code: 'HC-VEG-5L', qte: 400 }] });
    await makeBl({ prefix: 'HC', exp: hc, filiere: filVeg, client: 'Casino Kasserine', adresse: 'Centre Ville, Kasserine', destination: 'Kasserine', type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 10, tonnage: 8.28, lignes: [{ code: 'HC-VEG-5L', qte: 900 }, { code: 'HC-VEG-1L', qte: 3000 }] });
    await makeBl({ prefix: 'HC', exp: hc, filiere: filVeg, client: 'Grossiste Jendouba', adresse: 'Av. Ali Belhouane, Jendouba', destination: 'Jendouba', type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 6, tonnage: 5.52, lignes: [{ code: 'HC-VEG-5L', qte: 600 }, { code: 'HC-VEG-1L', qte: 2000 }] });
    console.log('\n📦  Boissons Rafraîchissantes — Eau & Jus :');
    await makeBl({ prefix: 'BR', exp: boisExp, filiere: filEau, client: 'Carrefour Lac Tunis', adresse: 'Les Berges du Lac II, Tunis', destination: 'Tunis', type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 22, tonnage: 16.90, lignes: [{ code: 'BR-EAU-1L5', qte: 5000 }, { code: 'BR-JUS-1L', qte: 3000 }, { code: 'BR-EAU-05L', qte: 4000 }] });
    await makeBl({ prefix: 'BR', exp: boisExp, filiere: filEau, client: 'Géant Sousse City', adresse: 'Av. de la Corniche, Sousse', destination: 'Sousse', type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 18, tonnage: 14.10, lignes: [{ code: 'BR-EAU-1L5', qte: 4000 }, { code: 'BR-JUS-1L', qte: 4000 }] });
    await makeBl({ prefix: 'BR', exp: boisExp, filiere: filEau, client: 'Supermarché Mahdia Plage', adresse: 'Route de la Corniche, Mahdia', destination: 'Mahdia', type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 10, tonnage: 7.75, lignes: [{ code: 'BR-EAU-1L5', qte: 2000 }, { code: 'BR-EAU-05L', qte: 3000 }, { code: 'BR-JUS-1L', qte: 1000 }] });
    await makeBl({ prefix: 'BR', exp: boisExp, filiere: filEau, client: 'Casino Siliana', adresse: 'Centre Ville, Siliana', destination: 'Siliana', type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 8, tonnage: 6.20, lignes: [{ code: 'BR-EAU-1L5', qte: 2000 }, { code: 'BR-JUS-1L', qte: 2000 }] });
    console.log('\n📦  Boissons Rafraîchissantes — Sodas :');
    await makeBl({ prefix: 'BR', exp: boisExp, filiere: filSoda, client: 'Monoprix Manouba', adresse: 'Centre Commercial, Manouba', destination: 'Manouba', type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 20, tonnage: 14.80, lignes: [{ code: 'BR-SOD-1L5', qte: 5000 }, { code: 'BR-SOD-33', qte: 10000 }] });
    await makeBl({ prefix: 'BR', exp: boisExp, filiere: filSoda, client: 'Carrefour Sfax', adresse: 'Route de Tunis, Sfax', destination: 'Sfax', type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 18, tonnage: 12.96, lignes: [{ code: 'BR-SOD-1L5', qte: 4000 }, { code: 'BR-SOD-33', qte: 8000 }] });
    await makeBl({ prefix: 'BR', exp: boisExp, filiere: filSoda, client: 'Casino Nabeul', adresse: 'Av. Habib Bourguiba, Nabeul', destination: 'Nabeul', type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 12, tonnage: 8.96, lignes: [{ code: 'BR-SOD-1L5', qte: 3000 }, { code: 'BR-SOD-33', qte: 5000 }] });
    await makeBl({ prefix: 'BR', exp: boisExp, filiere: filSoda, client: 'Supermarché Bizerte', adresse: 'Rue de la Corniche, Bizerte', destination: 'Bizerte', type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 14, tonnage: 10.36, lignes: [{ code: 'BR-SOD-1L5', qte: 3500 }, { code: 'BR-SOD-33', qte: 7000 }] });
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`✅  ${created} BL(s) créé(s) pour le demo Planning\n`);
    const total = await blRepo.count({ where: { statut: bl_status_enum_1.BlStatus.VALIDATED } });
    console.log(`📊  Total BL VALIDATED dans la base : ${total}`);
    const byDest = {};
    const allBls = await blRepo.find({ where: { statut: bl_status_enum_1.BlStatus.VALIDATED }, relations: ['societeExpeditrice'] });
    allBls.forEach(bl => { byDest[bl.destination || '?'] = (byDest[bl.destination || '?'] || 0) + 1; });
    console.log('\n   Par destination :');
    Object.entries(byDest).sort(([, a], [, b]) => b - a).forEach(([d, n]) => console.log(`     ${d.padEnd(14)} ${n} BL`));
    const byExp = {};
    allBls.forEach(bl => { const e = bl.societeExpeditrice?.nom || '?'; byExp[e] = (byExp[e] || 0) + 1; });
    console.log('\n   Par expéditeur :');
    Object.entries(byExp).forEach(([e, n]) => console.log(`     ${e.padEnd(25)} ${n} BL`));
    console.log(`\n  🔗  Planning → http://localhost:3000/planning\n`);
    await app.close();
}
seed().catch(e => { console.error(e); process.exit(1); });
//# sourceMappingURL=seed-bls-demo.js.map