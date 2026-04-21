"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const typeorm_1 = require("@nestjs/typeorm");
const company_entity_1 = require("./companies/company.entity");
const user_entity_1 = require("./users/user.entity");
const role_enum_1 = require("./common/enums/role.enum");
const delivery_company_entity_1 = require("./delivery-companies/delivery-company.entity");
const truck_entity_1 = require("./trucks/truck.entity");
const article_entity_1 = require("./articles/article.entity");
const societe_expeditrice_entity_1 = require("./expediteurs/societe-expeditrice.entity");
const filiere_entity_1 = require("./expediteurs/filiere.entity");
const bon_livraison_entity_1 = require("./bons-livraison/bon-livraison.entity");
const bl_article_entity_1 = require("./bons-livraison/bl-article.entity");
const bl_status_enum_1 = require("./common/enums/bl-status.enum");
const bcrypt = __importStar(require("bcryptjs"));
let blSeq = 2000;
const nextBl = () => `RB-${String(++blSeq).padStart(4, '0')}`;
async function findOrCreate(repo, where, creator) {
    const found = await repo.findOne({ where: where });
    if (found)
        return found;
    const entity = creator();
    return repo.save(entity);
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
    const company = await findOrCreate(companyRepo, { nom: "Grain d'Or SARL" }, () => companyRepo.create({
        nom: "Grain d'Or SARL",
        adresse: 'Zone Industrielle El Agba, Tunis 2036',
        telephone: '+216 71 000 001',
        isActive: true,
    }));
    console.log(`✅  Company        : ${company.nom}`);
    const adminEmail = 'logistique@graindor.tn';
    const existing = await userRepo.findOne({ where: { email: adminEmail } });
    if (!existing) {
        const admin = userRepo.create({
            nom: 'Ben Salah',
            prenom: 'Karim',
            email: adminEmail,
            password: await bcrypt.hash('Admin1234!', 10),
            role: role_enum_1.Role.COMPANY_ADMIN,
            isActive: true,
            company,
        });
        await userRepo.save(admin);
        console.log(`✅  Resp. Logistique : ${adminEmail} / Admin1234!`);
    }
    else {
        console.log(`ℹ️   Utilisateur existant : ${adminEmail}`);
    }
    const dcSafrat = await findOrCreate(dcRepo, { nom: 'SAFRAT Transport' }, () => dcRepo.create({
        nom: 'SAFRAT Transport',
        adresse: 'Rue de la Mecque, Sfax 3000',
        telephone: '+216 74 111 222',
        company,
    }));
    const dcTunisEx = await findOrCreate(dcRepo, { nom: 'TunisExpress Logistique' }, () => dcRepo.create({
        nom: 'TunisExpress Logistique',
        adresse: 'Avenue Bourguiba, Sousse 4000',
        telephone: '+216 73 333 444',
        company,
    }));
    const safratSpecs = [
        { matricule: '247 TUN 1234', capaciteTonnage: 24, capacitePalettes: 33, type: 'Semi-remorque' },
        { matricule: '189 TUN 5678', capaciteTonnage: 20, capacitePalettes: 28, type: 'Plateau' },
        { matricule: '150 TUN 9012', capaciteTonnage: 15, capacitePalettes: 20, type: 'Fourgon' },
    ];
    for (const spec of safratSpecs) {
        await findOrCreate(truckRepo, { matricule: spec.matricule }, () => truckRepo.create({ ...spec, isActive: true, deliveryCompany: dcSafrat }));
    }
    console.log(`✅  SAFRAT (3 camions avec palettes — semi-remorque, plateau, fourgon)`);
    const texSpecs = [
        { matricule: '320 TUN 3333', capaciteTonnage: 32, capacitePalettes: 0, type: 'Citerne farine' },
        { matricule: '280 TUN 4444', capaciteTonnage: 28, capacitePalettes: 0, type: 'Citerne farine' },
    ];
    for (const spec of texSpecs) {
        await findOrCreate(truckRepo, { matricule: spec.matricule }, () => truckRepo.create({ ...spec, isActive: true, deliveryCompany: dcTunisEx }));
    }
    console.log(`✅  TunisExpress (2 citernes sans palettes — transport vrac semoule)\n`);
    const artSpecs = [
        { code: 'PB-SPG-500', libelle: 'Spaghetti 500g', poidsUnitaire: 0.5, unite: 'Colis' },
        { code: 'PB-MAC-500', libelle: 'Macaroni 500g', poidsUnitaire: 0.5, unite: 'Colis' },
        { code: 'PB-FUS-500', libelle: 'Fusilli 500g', poidsUnitaire: 0.5, unite: 'Colis' },
        { code: 'PB-PEN-500', libelle: 'Penne 500g', poidsUnitaire: 0.5, unite: 'Colis' },
        { code: 'MC-SG-1KG', libelle: 'Semoule Grossière 1kg', poidsUnitaire: 1.0, unite: 'Sac' },
        { code: 'MC-SF-1KG', libelle: 'Semoule Fine 1kg', poidsUnitaire: 1.0, unite: 'Sac' },
        { code: 'MC-SM-5KG', libelle: 'Semoule Moyenne 5kg', poidsUnitaire: 5.0, unite: 'Sac' },
        { code: 'CCS-FIN-1K', libelle: 'Couscous Fin 1kg', poidsUnitaire: 1.0, unite: 'Sachet' },
        { code: 'CCS-MOY-1K', libelle: 'Couscous Moyen 1kg', poidsUnitaire: 1.0, unite: 'Sachet' },
        { code: 'CCS-GRO-1K', libelle: 'Couscous Gros 1kg', poidsUnitaire: 1.0, unite: 'Sachet' },
    ];
    const articles = {};
    for (const spec of artSpecs) {
        articles[spec.code] = await findOrCreate(artRepo, { code: spec.code }, () => artRepo.create(spec));
    }
    console.log(`✅  ${artSpecs.length} articles créés (Pâte Blanche + MCSR + Couscous)\n`);
    const roseBlanche = await findOrCreate(seRepo, { nom: 'Rose Blanche', company: { id: company.id } }, () => seRepo.create({
        nom: 'Rose Blanche',
        code: 'RB',
        couleur: '#e83e8c',
        adresse: 'Zone Industrielle El Agba, Tunis',
        telephone: '+216 71 555 666',
        company,
    }));
    console.log(`✅  Société expéditrice : Rose Blanche (${roseBlanche.couleur})`);
    const filPate = await findOrCreate(filRepo, { nom: 'Pâte Blanche', societeExpeditrice: { id: roseBlanche.id } }, () => filRepo.create({ nom: 'Pâte Blanche', code: 'PB', societeExpeditrice: roseBlanche }));
    const filMcsr = await findOrCreate(filRepo, { nom: 'MCSR', societeExpeditrice: { id: roseBlanche.id } }, () => filRepo.create({ nom: 'MCSR', code: 'MCSR', societeExpeditrice: roseBlanche }));
    const filCouscous = await findOrCreate(filRepo, { nom: 'Couscous', societeExpeditrice: { id: roseBlanche.id } }, () => filRepo.create({ nom: 'Couscous', code: 'CCS', societeExpeditrice: roseBlanche }));
    console.log(`✅  3 filières : Pâte Blanche (PB) | MCSR | Couscous (CCS)\n`);
    const TODAY = new Date().toISOString().split('T')[0];
    const ORIGINE = 'Tunis — El Agba';
    async function makeBl(params) {
        const numeroBl = nextBl();
        const already = await blRepo.findOne({ where: { numeroBl } });
        if (already)
            return already;
        const tonnageTotal = params.lignes.reduce((s, l) => {
            const art = articles[l.code];
            return s + (art ? art.poidsUnitaire * l.qte : 0);
        }, 0);
        const bl = await blRepo.save(blRepo.create({
            numeroBl,
            clientNom: params.client,
            clientAdresse: params.adresse,
            origine: ORIGINE,
            destination: params.destination,
            typeChargement: params.type,
            tonnageTotal: Math.round(tonnageTotal * 100) / 100,
            nombrePalettes: params.palettes,
            statut: bl_status_enum_1.BlStatus.VALIDATED,
            datelivraison: new Date(TODAY),
            notes: params.notes || '',
            company,
            societeExpeditrice: roseBlanche,
            filiere: params.filiere,
        }));
        for (const l of params.lignes) {
            const art = articles[l.code];
            if (!art)
                continue;
            await blaRepo.save(blaRepo.create({
                bonLivraison: bl,
                article: art,
                quantite: l.qte,
                poidsTotal: Math.round(art.poidsUnitaire * l.qte * 100) / 100,
            }));
        }
        return bl;
    }
    console.log('📦  Création des BL...\n');
    const bl_sfax_pb = await makeBl({
        filiere: filPate, destination: 'Sfax',
        client: 'Épicerie Moderne Sfax', adresse: 'Rue Farhat Hached, Sfax 3000',
        type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 12,
        lignes: [
            { code: 'PB-SPG-500', qte: 4000 },
            { code: 'PB-MAC-500', qte: 6000 },
            { code: 'PB-FUS-500', qte: 6000 },
        ],
    });
    const bl_sfax_mc = await makeBl({
        filiere: filMcsr, destination: 'Sfax',
        client: 'Grossiste du Sud', adresse: 'Zone Commerciale Thyna, Sfax',
        type: bon_livraison_entity_1.TypeChargement.VRAC, palettes: 0,
        lignes: [
            { code: 'MC-SG-1KG', qte: 3000 },
            { code: 'MC-SF-1KG', qte: 3000 },
        ],
        notes: 'Vrac — prévoir bâche étanche',
    });
    const bl_sfax_ccs = await makeBl({
        filiere: filCouscous, destination: 'Sfax',
        client: 'Supérette Sfaxia', adresse: 'Avenue de la Liberté, Sfax',
        type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 8,
        lignes: [
            { code: 'CCS-FIN-1K', qte: 2000 },
            { code: 'CCS-MOY-1K', qte: 2000 },
        ],
    });
    console.log(`  🟣  [PB]  ${bl_sfax_pb.numeroBl}  Pâte Blanche → Sfax   ${bl_sfax_pb.tonnageTotal}T   12 pal`);
    console.log(`  🟣  [MC]  ${bl_sfax_mc.numeroBl}  MCSR         → Sfax   ${bl_sfax_mc.tonnageTotal}T    0 pal (vrac)`);
    console.log(`  🟣  [CCS] ${bl_sfax_ccs.numeroBl}  Couscous     → Sfax    ${bl_sfax_ccs.tonnageTotal}T    8 pal`);
    console.log(`\n  🚛  Ces 3 BL forment 18T / 20 pal → camion 247 TUN 1234 (24T, 33 pal, 75%)\n`);
    const bl_sousse_pb = await makeBl({
        filiere: filPate, destination: 'Sousse',
        client: 'Carrefour Sousse', adresse: 'Route de Tunis, Sousse',
        type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 16,
        lignes: [
            { code: 'PB-SPG-500', qte: 5000 },
            { code: 'PB-PEN-500', qte: 5000 },
            { code: 'PB-MAC-500', qte: 3000 },
        ],
    });
    const bl_sousse_ccs = await makeBl({
        filiere: filCouscous, destination: 'Sousse',
        client: 'Monoprix Hammam-Sousse', adresse: 'Rue du Commerce, Hammam-Sousse',
        type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 10,
        lignes: [
            { code: 'CCS-FIN-1K', qte: 3000 },
            { code: 'CCS-GRO-1K', qte: 2500 },
        ],
    });
    console.log(`  🟠  [PB]  ${bl_sousse_pb.numeroBl}  Pâte Blanche → Sousse  ${bl_sousse_pb.tonnageTotal}T  16 pal`);
    console.log(`  🟠  [CCS] ${bl_sousse_ccs.numeroBl}  Couscous     → Sousse  ${bl_sousse_ccs.tonnageTotal}T  10 pal`);
    console.log(`\n  🚛  Camion 189 TUN 5678 (20T, 28 pal) → Sousse : 12T / 26 pal (60%)\n`);
    const bl_nabeul_mc = await makeBl({
        filiere: filMcsr, destination: 'Nabeul',
        client: 'Minoterie El Faouzi', adresse: 'Zone Artisanale, Nabeul',
        type: bon_livraison_entity_1.TypeChargement.CITERNE, palettes: 0,
        lignes: [
            { code: 'MC-SM-5KG', qte: 5600 },
        ],
        notes: 'Transport en citerne — certificat sanitaire obligatoire',
    });
    console.log(`  🔵  [MC]  ${bl_nabeul_mc.numeroBl}  MCSR (citerne) → Nabeul   ${bl_nabeul_mc.tonnageTotal}T`);
    console.log(`  🚛  Camion 320 TUN 3333 (citerne 32T, sans palettes) — transport vrac semoule\n`);
    const bl_bizerte_pb = await makeBl({
        filiere: filPate, destination: 'Bizerte',
        client: 'Grossiste Bizerte Nord', adresse: 'Menzel Bourguiba, Bizerte',
        type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 20,
        lignes: [
            { code: 'PB-SPG-500', qte: 8000 },
            { code: 'PB-FUS-500', qte: 4000 },
        ],
    });
    console.log(`  🟢  [PB]  ${bl_bizerte_pb.numeroBl}  Pâte Blanche → Bizerte   ${bl_bizerte_pb.tonnageTotal}T  20 pal`);
    const bl_monastir_pb = await makeBl({
        filiere: filPate, destination: 'Monastir',
        client: 'Épicerie El Mourouj', adresse: 'Centre Ville, Monastir',
        type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 6,
        lignes: [
            { code: 'PB-MAC-500', qte: 3000 },
            { code: 'PB-PEN-500', qte: 3000 },
        ],
    });
    const bl_monastir_ccs = await makeBl({
        filiere: filCouscous, destination: 'Monastir',
        client: 'Supermarché Médina', adresse: 'Rue Ibn Khaldoun, Monastir',
        type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 5,
        lignes: [
            { code: 'CCS-MOY-1K', qte: 2000 },
            { code: 'CCS-FIN-1K', qte: 1500 },
        ],
    });
    console.log(`  🟡  [PB]  ${bl_monastir_pb.numeroBl}  Pâte Blanche → Monastir   ${bl_monastir_pb.tonnageTotal}T   6 pal`);
    console.log(`  🟡  [CCS] ${bl_monastir_ccs.numeroBl}  Couscous     → Monastir   ${bl_monastir_ccs.tonnageTotal}T   5 pal\n`);
    const bl_kairouan_mc = await makeBl({
        filiere: filMcsr, destination: 'Kairouan',
        client: 'Marché Central Kairouan', adresse: 'Souk El Ahad, Kairouan',
        type: bon_livraison_entity_1.TypeChargement.VRAC, palettes: 0,
        lignes: [
            { code: 'MC-SG-1KG', qte: 8000 },
            { code: 'MC-SF-1KG', qte: 6000 },
        ],
    });
    console.log(`  🔴  [MC]  ${bl_kairouan_mc.numeroBl}  MCSR (vrac)  → Kairouan  ${bl_kairouan_mc.tonnageTotal}T\n`);
    console.log('─'.repeat(66));
    console.log('✅  Seeder Rose Blanche terminé avec succès !');
    console.log('─'.repeat(66));
    console.log('\n📌  Scénario clé à tester dans le planning :\n');
    console.log('  Rose Blanche → Sfax : regrouper ces 3 BL dans 1 camion\n');
    console.log(`  ┌──────────────────────────────────────────────────────────┐`);
    console.log(`  │  Camion : 247 TUN 1234  (SAFRAT, 24T, 33 palettes)      │`);
    console.log(`  │  ─────────────────────────────────────────────────────   │`);
    console.log(`  │  ${bl_sfax_pb.numeroBl}  [Pâte Blanche]  Sfax   8.0T  12 pal  │`);
    console.log(`  │  ${bl_sfax_mc.numeroBl}  [MCSR]          Sfax   6.0T   0 pal  │`);
    console.log(`  │  ${bl_sfax_ccs.numeroBl}  [Couscous]      Sfax   4.0T   8 pal  │`);
    console.log(`  │  ─────────────────────────────────────────────────────   │`);
    console.log(`  │  Total : 18.0T (75%)  ·  20 palettes (60%)              │`);
    console.log(`  └──────────────────────────────────────────────────────────┘`);
    console.log('\n  💡 Les 3 BL sont de filières DIFFÉRENTES mais de la MÊME société.');
    console.log('     → Le camion peut les prendre tous les 3 sans restriction.\n');
    console.log('  Connexion : logistique@graindor.tn  /  Admin1234!\n');
    console.log('  Groupe par "Expéditeur" dans le panel BL pour voir le regroupement.\n');
    await app.close();
}
seed().catch((err) => {
    console.error('❌  Erreur seeder :', err.message);
    process.exit(1);
});
//# sourceMappingURL=seed-rose-blanche.js.map