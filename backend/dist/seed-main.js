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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const typeorm_1 = require("@nestjs/typeorm");
const pg_1 = require("pg");
const bcrypt = __importStar(require("bcryptjs"));
const dayjs_1 = __importDefault(require("dayjs"));
const dotenv = __importStar(require("dotenv"));
const company_entity_1 = require("./companies/company.entity");
const user_entity_1 = require("./users/user.entity");
const societe_expeditrice_entity_1 = require("./expediteurs/societe-expeditrice.entity");
const filiere_entity_1 = require("./expediteurs/filiere.entity");
const quai_entity_1 = require("./quais/quai.entity");
const delivery_company_entity_1 = require("./delivery-companies/delivery-company.entity");
const truck_entity_1 = require("./trucks/truck.entity");
const truck_availability_entity_1 = require("./truck-availability/truck-availability.entity");
const bon_livraison_entity_1 = require("./bons-livraison/bon-livraison.entity");
const loading_plan_entity_1 = require("./loading-plans/loading-plan.entity");
const role_enum_1 = require("./common/enums/role.enum");
const company_type_enum_1 = require("./common/enums/company-type.enum");
const bl_status_enum_1 = require("./common/enums/bl-status.enum");
const PWD = 'Test1234!';
const D_2 = (0, dayjs_1.default)().subtract(2, 'day').format('YYYY-MM-DD');
const D_1 = (0, dayjs_1.default)().subtract(1, 'day').format('YYYY-MM-DD');
const D0 = (0, dayjs_1.default)().format('YYYY-MM-DD');
const D1 = (0, dayjs_1.default)().add(1, 'day').format('YYYY-MM-DD');
const D2 = (0, dayjs_1.default)().add(2, 'day').format('YYYY-MM-DD');
const D3 = (0, dayjs_1.default)().add(3, 'day').format('YYYY-MM-DD');
const ORIGINES = ['Tunis', 'Sfax', 'Sousse', 'Kairouan', 'Bizerte', 'Tunis', 'Tunis'];
const VILLES = [
    'Sfax', 'Sousse', 'Bizerte', 'Nabeul', 'Kairouan', 'Gabes',
    'Medenine', 'Monastir', 'Jendouba', 'Le Kef', 'Mahdia',
    'Gafsa', 'Tozeur', 'Kebili', 'Siliana',
];
const CLIENTS = [
    'Ste El Amal Distribution', 'Ets Ben Salah et Fils',
    'Agro Market SARL', 'Cooperative El Wafa',
    'Distribution Nord SARL', 'Ste El Baraka Commerce',
    'Transag SARL', 'Market Plus Tunisie',
    'Ets Trabelsi et Cie', 'Cooperative de Sfax',
    'El Fateh Commerce', 'Dist Sud SARL',
    'Ste Alimentaire Centrale', 'El Jadida SARL',
    'Hyper Marche Sfax',
];
const NOTES_POOL = [
    '',
    'Livraison avant 10h - appeler avant',
    'Produits fragiles - manutention soigneuse',
    '',
    'Urgent - priorite haute',
    'Temperature 2-4 C requise',
    '',
    'Certificat de conformite requis',
    'Palette filmee obligatoire',
    '',
];
const TC_AMT = [
    bon_livraison_entity_1.TypeChargement.VRAC, bon_livraison_entity_1.TypeChargement.VRAC, bon_livraison_entity_1.TypeChargement.PALETTE,
    bon_livraison_entity_1.TypeChargement.VRAC, bon_livraison_entity_1.TypeChargement.VRAC, bon_livraison_entity_1.TypeChargement.PALETTE,
    bon_livraison_entity_1.TypeChargement.VRAC, bon_livraison_entity_1.TypeChargement.FRIGO, bon_livraison_entity_1.TypeChargement.VRAC,
    bon_livraison_entity_1.TypeChargement.PALETTE, bon_livraison_entity_1.TypeChargement.VRAC, bon_livraison_entity_1.TypeChargement.VRAC,
];
const TC_MCR = [
    bon_livraison_entity_1.TypeChargement.VRAC, bon_livraison_entity_1.TypeChargement.PALETTE, bon_livraison_entity_1.TypeChargement.VRAC,
    bon_livraison_entity_1.TypeChargement.FRIGO, bon_livraison_entity_1.TypeChargement.VRAC, bon_livraison_entity_1.TypeChargement.PALETTE,
    bon_livraison_entity_1.TypeChargement.VRAC, bon_livraison_entity_1.TypeChargement.VRAC, bon_livraison_entity_1.TypeChargement.PALETTE,
    bon_livraison_entity_1.TypeChargement.FRIGO, bon_livraison_entity_1.TypeChargement.VRAC, bon_livraison_entity_1.TypeChargement.CITERNE,
];
const TC_PW = [
    bon_livraison_entity_1.TypeChargement.VRAC, bon_livraison_entity_1.TypeChargement.VRAC, bon_livraison_entity_1.TypeChargement.PALETTE,
    bon_livraison_entity_1.TypeChargement.VRAC, bon_livraison_entity_1.TypeChargement.FRIGO, bon_livraison_entity_1.TypeChargement.VRAC,
    bon_livraison_entity_1.TypeChargement.CITERNE, bon_livraison_entity_1.TypeChargement.VRAC, bon_livraison_entity_1.TypeChargement.PALETTE,
    bon_livraison_entity_1.TypeChargement.VRAC, bon_livraison_entity_1.TypeChargement.VRAC, bon_livraison_entity_1.TypeChargement.PALETTE,
];
async function resetSchema() {
    dotenv.config();
    const pool = new pg_1.Pool({
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? 5432),
        user: process.env.DB_USERNAME ?? 'postgres',
        password: process.env.DB_PASSWORD ?? 'sana',
        database: process.env.DB_NAME ?? 'tms_db_new',
    });
    console.log('[seed] Reset du schema PostgreSQL...');
    await pool.query('DROP SCHEMA public CASCADE');
    await pool.query('CREATE SCHEMA public');
    await pool.query('GRANT ALL ON SCHEMA public TO postgres');
    await pool.query('GRANT ALL ON SCHEMA public TO public');
    await pool.end();
    console.log('[seed] OK - Schema remis a zero, TypeORM va reconstruire les tables');
}
async function bootstrap() {
    await resetSchema();
    console.log('[seed] Initialisation NestJS...');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, { logger: false });
    console.log('[seed] OK');
    const companyRepo = app.get((0, typeorm_1.getRepositoryToken)(company_entity_1.Company));
    const userRepo = app.get((0, typeorm_1.getRepositoryToken)(user_entity_1.User));
    const societeRepo = app.get((0, typeorm_1.getRepositoryToken)(societe_expeditrice_entity_1.SocieteExpeditrice));
    const filRepo = app.get((0, typeorm_1.getRepositoryToken)(filiere_entity_1.Filiere));
    const quaiRepo = app.get((0, typeorm_1.getRepositoryToken)(quai_entity_1.Quai));
    const dcRepo = app.get((0, typeorm_1.getRepositoryToken)(delivery_company_entity_1.DeliveryCompany));
    const truckRepo = app.get((0, typeorm_1.getRepositoryToken)(truck_entity_1.Truck));
    const taRepo = app.get((0, typeorm_1.getRepositoryToken)(truck_availability_entity_1.TruckAvailability));
    const blRepo = app.get((0, typeorm_1.getRepositoryToken)(bon_livraison_entity_1.BonLivraison));
    const lpRepo = app.get((0, typeorm_1.getRepositoryToken)(loading_plan_entity_1.LoadingPlan));
    console.log('[seed] Societes...');
    const transfood = await companyRepo.save(companyRepo.create({
        nom: 'TransFood', type: company_type_enum_1.CompanyType.LOGISTIQUE,
        couleur: '#1890ff', code: 'TF', isActive: true,
    }));
    const rbCompany = await companyRepo.save(companyRepo.create({
        nom: 'Rose Blanche', type: company_type_enum_1.CompanyType.EXPEDITEUR,
        couleur: '#eb2f96', code: 'RB', isActive: true,
    }));
    console.log('[seed] OK - TransFood + Rose Blanche');
    console.log('[seed] Utilisateurs...');
    const pwd = await bcrypt.hash(PWD, 10);
    const mkUser = (email, prenom, nom, role, co) => userRepo.save(userRepo.create({ email, prenom, nom, password: pwd, role, isActive: true, company: co }));
    const respLogist = await mkUser('logistique@transfood.tn', 'Responsable', 'Logistique', role_enum_1.Role.LOGISTIC_ADMIN, transfood);
    await mkUser('admin@tms.tn', 'Super', 'Admin', role_enum_1.Role.SUPER_ADMIN, transfood);
    await mkUser('admin@roseblanche.tn', 'Admin', 'Rose Blanche', role_enum_1.Role.EXPEDITEUR_ADMIN, rbCompany);
    const uAMT = await mkUser('amt@roseblanche.tn', 'Responsable', 'Filiere AMT', role_enum_1.Role.FILIERE_ADMIN, rbCompany);
    const uMCSR = await mkUser('mcsr@roseblanche.tn', 'Responsable', 'Filiere MCSR', role_enum_1.Role.FILIERE_ADMIN, rbCompany);
    const uPW = await mkUser('pw@roseblanche.tn', 'Responsable', 'Filiere PW', role_enum_1.Role.FILIERE_ADMIN, rbCompany);
    const mag1 = await mkUser('mag1@roseblanche.tn', 'Magasinier', 'Un', role_enum_1.Role.MAGASINIER, rbCompany);
    const mag2 = await mkUser('mag2@roseblanche.tn', 'Magasinier', 'Deux', role_enum_1.Role.MAGASINIER, rbCompany);
    const sec1 = await mkUser('sec1@roseblanche.tn', 'Agent', 'Securite-1', role_enum_1.Role.SECURITE, rbCompany);
    const sec2 = await mkUser('sec2@roseblanche.tn', 'Agent', 'Securite-2', role_enum_1.Role.SECURITE, rbCompany);
    console.log('[seed] OK - 10 comptes (Test1234!)');
    console.log('[seed] Rose Blanche   - filieres et quais...');
    const rbSA = await societeRepo.save(societeRepo.create({
        nom: 'Rose Blanche  ', code: 'RB', couleur: '#eb2f96',
        adresse: 'Zone Industrielle El Agba, Tunis 2086',
        telephone: '+216 71 555 666',
        company: transfood,
        expediteurCompany: rbCompany,
    }));
    const saRef = { id: rbSA.id };
    const filAMT = await filRepo.save(filRepo.create({ nom: 'AMT', code: 'AMT', societeExpeditrice: saRef }));
    const filMCR = await filRepo.save(filRepo.create({ nom: 'MCSR', code: 'MCSR', societeExpeditrice: saRef }));
    const filPW = await filRepo.save(filRepo.create({ nom: 'Pate Warda', code: 'PW', societeExpeditrice: saRef }));
    for (const [fil, prefix] of [[filAMT, 'AMT'], [filMCR, 'MCSR'], [filPW, 'PW']]) {
        for (let i = 1; i <= 3; i++) {
            await quaiRepo.save(quaiRepo.create({
                nom: `${prefix}-${i}`, isActive: true,
                company: transfood, societeExpeditrice: rbSA, filiere: fil,
            }));
        }
    }
    await userRepo.save({ ...uAMT, filieres: [filAMT] });
    await userRepo.save({ ...uMCSR, filieres: [filMCR] });
    await userRepo.save({ ...uPW, filieres: [filPW] });
    await userRepo.save({ ...mag1, filieres: [filAMT, filMCR] });
    await userRepo.save({ ...mag2, filieres: [filPW] });
    await userRepo.save({ ...sec1, filieres: [filAMT, filMCR] });
    await userRepo.save({ ...sec2, filieres: [filPW] });
    console.log('[seed] OK - 3 filieres / 9 quais / affectations');
    await companyRepo.update(rbCompany.id, { logistiqueCompany: { id: transfood.id } });
    console.log('[seed] OK - Rose Blanche → TransFood');
    console.log('[seed] Parc de camions...');
    const flotte = await dcRepo.save(dcRepo.create({
        nom: 'Flotte TransFood', adresse: 'Depot Central, Route de Tunis, Ariana',
        telephone: '+216 71 000 001', isActive: true, company: transfood,
    }));
    const truckDefs = [
        { matricule: '123TU4567', type: 'Standard', capaciteTonnage: 20, capacitePalettes: 0 },
        { matricule: '234TU5678', type: 'Standard', capaciteTonnage: 15, capacitePalettes: 0 },
        { matricule: '345TU6789', type: 'Palette', capaciteTonnage: 18, capacitePalettes: 24 },
        { matricule: '456TU7890', type: 'Palette', capaciteTonnage: 12, capacitePalettes: 16 },
        { matricule: '567TU8901', type: 'Frigo', capaciteTonnage: 8, capacitePalettes: 0 },
        { matricule: '678TU9012', type: 'Frigo', capaciteTonnage: 10, capacitePalettes: 0 },
        { matricule: '789TU0123', type: 'Standard', capaciteTonnage: 22, capacitePalettes: 0 },
        { matricule: '890TU1234', type: 'Citerne', capaciteTonnage: 25, capacitePalettes: 0 },
    ];
    const trucks = await Promise.all(truckDefs.map((d) => truckRepo.save(truckRepo.create({ ...d, isActive: true, deliveryCompany: flotte }))));
    for (const truck of trucks) {
        for (const date of [D_2, D_1, D0, D1, D2, D3]) {
            await taRepo.save(taRepo.create({ truck, date }));
        }
    }
    console.log(`[seed] OK - ${trucks.length} camions / disponibilites 6 jours`);
    console.log('[seed] Generation des BLs...');
    const mkBL = async (numeroBl, filiere, statut, idx, tcArr, extras = {}) => {
        const ville = VILLES[idx % VILLES.length];
        const client = CLIENTS[idx % CLIENTS.length];
        const tc = tcArr[idx % tcArr.length];
        const tonnage = 4 + (idx % 18);
        const palettes = tc === bon_livraison_entity_1.TypeChargement.PALETTE ? 4 + (idx % 12) : 0;
        const note = extras.notes ?? NOTES_POOL[idx % NOTES_POOL.length];
        const origine = extras.origine ?? ORIGINES[idx % ORIGINES.length];
        const erp = extras.erpReference ?? (idx % 3 === 0 ? `ERP-${10000 + idx}` : undefined);
        const delivery = new Date((0, dayjs_1.default)().add(3 + (idx % 12), 'day').toISOString());
        return blRepo.save(blRepo.create({
            numeroBl, clientNom: client, clientAdresse: `Zone Industrielle, ${ville}`,
            origine, destination: ville, typeChargement: tc,
            tonnageTotal: tonnage, nombrePalettes: palettes,
            statut, datelivraison: delivery, erpReference: erp, notes: note,
            company: transfood, societeExpeditrice: rbSA, filiere,
        }));
    };
    const amtBls = [];
    for (let i = 1; i <= 5; i++)
        amtBls.push(await mkBL(`BL-AMT-${pad(i)}`, filAMT, bl_status_enum_1.BlStatus.DRAFT, i, TC_AMT));
    for (let i = 6; i <= 14; i++)
        amtBls.push(await mkBL(`BL-AMT-${pad(i)}`, filAMT, bl_status_enum_1.BlStatus.VALIDATED, i, TC_AMT));
    for (let i = 15; i <= 17; i++)
        amtBls.push(await mkBL(`BL-AMT-${pad(i)}`, filAMT, bl_status_enum_1.BlStatus.VALIDATED, i, TC_AMT, { origine: 'Bizerte' }));
    for (let i = 18; i <= 20; i++)
        amtBls.push(await mkBL(`BL-AMT-${pad(i)}`, filAMT, bl_status_enum_1.BlStatus.LOADED, i, TC_AMT, { erpReference: `ERP-AMT-${i}` }));
    for (let i = 21; i <= 23; i++)
        amtBls.push(await mkBL(`BL-AMT-${pad(i)}`, filAMT, bl_status_enum_1.BlStatus.LOADED, i, TC_AMT, { erpReference: `ERP-AMT-${i}` }));
    amtBls.push(await mkBL('BL-AMT-024', filAMT, bl_status_enum_1.BlStatus.DELIVERED, 24, TC_AMT, { notes: 'Livraison confirmee par le client' }));
    const mcrBls = [];
    for (let i = 1; i <= 5; i++)
        mcrBls.push(await mkBL(`BL-MCSR-${pad(i)}`, filMCR, bl_status_enum_1.BlStatus.DRAFT, i + 24, TC_MCR));
    for (let i = 6; i <= 14; i++)
        mcrBls.push(await mkBL(`BL-MCSR-${pad(i)}`, filMCR, bl_status_enum_1.BlStatus.VALIDATED, i + 24, TC_MCR));
    for (let i = 15; i <= 17; i++)
        mcrBls.push(await mkBL(`BL-MCSR-${pad(i)}`, filMCR, bl_status_enum_1.BlStatus.VALIDATED, i + 24, TC_MCR, { origine: 'Kairouan' }));
    for (let i = 18; i <= 20; i++)
        mcrBls.push(await mkBL(`BL-MCSR-${pad(i)}`, filMCR, bl_status_enum_1.BlStatus.VALIDATED, i + 24, TC_MCR, { notes: 'Urgent - priorite haute' }));
    for (let i = 21; i <= 23; i++)
        mcrBls.push(await mkBL(`BL-MCSR-${pad(i)}`, filMCR, bl_status_enum_1.BlStatus.LOADED, i + 24, TC_MCR, { erpReference: `ERP-MCSR-${i}` }));
    mcrBls.push(await mkBL('BL-MCSR-024', filMCR, bl_status_enum_1.BlStatus.DELIVERED, 48, TC_MCR, { notes: 'Livraison confirmee' }));
    const pwBls = [];
    for (let i = 1; i <= 5; i++)
        pwBls.push(await mkBL(`BL-PW-${pad(i)}`, filPW, bl_status_enum_1.BlStatus.DRAFT, i + 48, TC_PW));
    for (let i = 6; i <= 13; i++)
        pwBls.push(await mkBL(`BL-PW-${pad(i)}`, filPW, bl_status_enum_1.BlStatus.VALIDATED, i + 48, TC_PW));
    for (let i = 14; i <= 16; i++)
        pwBls.push(await mkBL(`BL-PW-${pad(i)}`, filPW, bl_status_enum_1.BlStatus.VALIDATED, i + 48, TC_PW, { origine: 'Sfax' }));
    for (let i = 17; i <= 19; i++)
        pwBls.push(await mkBL(`BL-PW-${pad(i)}`, filPW, bl_status_enum_1.BlStatus.VALIDATED, i + 48, TC_PW, { notes: 'Temperature 2-4 C requise' }));
    for (let i = 20; i <= 22; i++)
        pwBls.push(await mkBL(`BL-PW-${pad(i)}`, filPW, bl_status_enum_1.BlStatus.LOADED, i + 48, TC_PW, { erpReference: `ERP-PW-${i}` }));
    pwBls.push(await mkBL('BL-PW-023', filPW, bl_status_enum_1.BlStatus.DELIVERED, 71, TC_PW));
    pwBls.push(await mkBL('BL-PW-024', filPW, bl_status_enum_1.BlStatus.DELIVERED, 72, TC_PW, { notes: 'Livre - bon de reception signe' }));
    console.log('[seed] OK - 72 BLs (15 DRAFT / 32 VALIDATED / 19 LOADED / 6 DELIVERED)');
    console.log('[seed] Plans de chargement...');
    const mkPlan = async (cfg) => {
        const tonnage = cfg.bls.reduce((s, b) => s + Number(b.tonnageTotal), 0);
        const palettes = cfg.bls.reduce((s, b) => s + Number(b.nombrePalettes), 0);
        const plan = await lpRepo.save(lpRepo.create({
            reference: cfg.reference,
            dateLivraison: new Date(cfg.date),
            tonnageCharge: tonnage,
            palettesChargees: palettes,
            isValidated: cfg.isValidated,
            loadingStatus: cfg.loadingStatus,
            entryStatus: cfg.entryStatus,
            quai: cfg.quai ?? undefined,
            heureArrivee: cfg.heureArrivee ?? undefined,
            stationsSequence: [cfg.station],
            currentStation: cfg.station,
            currentStationIdx: 0,
            loadingStartedAt: cfg.loadingStatus === 'IN_PROGRESS' ? new Date() : undefined,
            loadingElapsedSeconds: cfg.elapsedSecs,
            logistiqueCompanyId: transfood.id,
            truck: cfg.truck,
            validatedBy: cfg.isValidated ? respLogist : undefined,
        }));
        await Promise.all(cfg.bls.map((bl, i) => blRepo.update({ id: bl.id }, {
            loadingPlan: { id: plan.id },
            ordreChargement: i + 1,
        })));
        console.log(`[seed]   ${cfg.reference}  ${cfg.loadingStatus}/${cfg.entryStatus}  ${cfg.date}  ${cfg.bls.length} BLs  ${cfg.truck.matricule}`);
        return plan;
    };
    await mkPlan({
        reference: 'LP-TF-003', truck: trucks[5], date: D_2,
        bls: [pwBls[19], pwBls[20], pwBls[21]],
        isValidated: true, loadingStatus: 'DONE', entryStatus: 'EXITED',
        quai: 'PW-3', station: 'PW', elapsedSecs: 5400, heureArrivee: '07:30',
    });
    await mkPlan({
        reference: 'LP-TF-001', truck: trucks[0], date: D_1,
        bls: [amtBls[20], amtBls[21], amtBls[22]],
        isValidated: true, loadingStatus: 'DONE', entryStatus: 'EXITED',
        quai: 'AMT-1', station: 'AMT', elapsedSecs: 4800, heureArrivee: '08:15',
    });
    await mkPlan({
        reference: 'LP-TF-002', truck: trucks[1], date: D_1,
        bls: [mcrBls[20], mcrBls[21], mcrBls[22]],
        isValidated: true, loadingStatus: 'DONE', entryStatus: 'EXITED',
        quai: 'MCSR-1', station: 'MCSR', elapsedSecs: 3600, heureArrivee: '09:00',
    });
    await mkPlan({
        reference: 'LP-TF-004', truck: trucks[2], date: D0,
        bls: [amtBls[17], amtBls[18], amtBls[19]],
        isValidated: true, loadingStatus: 'IN_PROGRESS', entryStatus: 'ENTERED',
        quai: 'AMT-2', station: 'AMT', elapsedSecs: 2347, heureArrivee: '10:30',
    });
    await mkPlan({
        reference: 'LP-TF-005', truck: trucks[3], date: D0,
        bls: [mcrBls[17], mcrBls[18], mcrBls[19]],
        isValidated: true, loadingStatus: 'WAITING', entryStatus: 'CALLED',
        quai: 'MCSR-2', station: 'MCSR', elapsedSecs: 0, heureArrivee: null,
    });
    await mkPlan({
        reference: 'LP-TF-006', truck: trucks[4], date: D0,
        bls: [pwBls[16], pwBls[17], pwBls[18]],
        isValidated: true, loadingStatus: 'WAITING', entryStatus: 'CALLED',
        quai: 'PW-1', station: 'PW', elapsedSecs: 0, heureArrivee: null,
    });
    await mkPlan({
        reference: 'LP-TF-007', truck: trucks[6], date: D0,
        bls: [mcrBls[14], mcrBls[15], mcrBls[16]],
        isValidated: true, loadingStatus: 'WAITING', entryStatus: 'IDLE',
        quai: 'MCSR-3', station: 'MCSR', elapsedSecs: 0, heureArrivee: null,
    });
    await mkPlan({
        reference: 'LP-TF-008', truck: trucks[7], date: D1,
        bls: [amtBls[14], amtBls[15], amtBls[16]],
        isValidated: true, loadingStatus: 'WAITING', entryStatus: 'IDLE',
        quai: 'AMT-3', station: 'AMT', elapsedSecs: 0, heureArrivee: null,
    });
    await mkPlan({
        reference: 'LP-TF-009', truck: trucks[0], date: D2,
        bls: [pwBls[13], pwBls[14], pwBls[15]],
        isValidated: false, loadingStatus: 'WAITING', entryStatus: 'IDLE',
        quai: null, station: 'PW', elapsedSecs: 0, heureArrivee: null,
    });
    console.log('[seed] Societes de transport supplementaires...');
    const bejaoui = await dcRepo.save(dcRepo.create({
        nom: 'Transport Bejaoui', adresse: 'Route Nationale 1, Mhamdia, Ben Arous',
        telephone: '+216 71 000 100', isActive: true, company: transfood,
    }));
    const logisfax = await dcRepo.save(dcRepo.create({
        nom: 'Logistrans Sfax', adresse: 'Zone Industrielle Thyna, Sfax 3001',
        telephone: '+216 74 000 200', isActive: true, company: transfood,
    }));
    const transNord = await dcRepo.save(dcRepo.create({
        nom: 'Trans Rapide Nord', adresse: 'Avenue Mongi Slim, Bizerte 7000',
        telephone: '+216 72 000 300', isActive: true, company: transfood,
    }));
    const extTruckDefs = [
        { dc: bejaoui, defs: [
                { matricule: '910TU2345', type: 'Standard', capaciteTonnage: 18, capacitePalettes: 0 },
                { matricule: '101TU3456', type: 'Palette', capaciteTonnage: 15, capacitePalettes: 20 },
                { matricule: '112TU4567', type: 'Frigo', capaciteTonnage: 9, capacitePalettes: 0 },
            ] },
        { dc: logisfax, defs: [
                { matricule: '223TU5678', type: 'Citerne', capaciteTonnage: 28, capacitePalettes: 0 },
                { matricule: '334TU6789', type: 'Standard', capaciteTonnage: 20, capacitePalettes: 0 },
                { matricule: '445TU7890', type: 'Benne', capaciteTonnage: 22, capacitePalettes: 0 },
            ] },
        { dc: transNord, defs: [
                { matricule: '556TU8901', type: 'Standard', capaciteTonnage: 16, capacitePalettes: 0 },
                { matricule: '667TU9012', type: 'Frigo', capaciteTonnage: 11, capacitePalettes: 0 },
            ] },
    ];
    const extTrucks = [];
    for (const { dc, defs } of extTruckDefs) {
        for (const d of defs) {
            const t = await truckRepo.save(truckRepo.create({ ...d, isActive: true, deliveryCompany: dc }));
            extTrucks.push(t);
            for (const date of [D_2, D_1, D0, D1, D2, D3]) {
                await taRepo.save(taRepo.create({ truck: t, date }));
            }
        }
    }
    console.log(`[seed] OK - ${extTrucks.length} camions supplementaires (Bejaoui/Logisfax/TransNord)`);
    console.log('[seed] Poulina Group - 2eme expediteur...');
    const poulinaCompany = await companyRepo.save(companyRepo.create({
        nom: 'Poulina Group', type: company_type_enum_1.CompanyType.EXPEDITEUR,
        couleur: '#fa8c16', code: 'PG', isActive: true,
    }));
    await mkUser('admin@poulina.tn', 'Admin', 'Poulina', role_enum_1.Role.EXPEDITEUR_ADMIN, poulinaCompany);
    const uHuile = await mkUser('huile@poulina.tn', 'Responsable', 'Huile', role_enum_1.Role.FILIERE_ADMIN, poulinaCompany);
    const uCereales = await mkUser('cereales@poulina.tn', 'Responsable', 'Cereales', role_enum_1.Role.FILIERE_ADMIN, poulinaCompany);
    const magPou = await mkUser('mag@poulina.tn', 'Magasinier', 'Poulina', role_enum_1.Role.MAGASINIER, poulinaCompany);
    const secPou = await mkUser('sec@poulina.tn', 'Agent', 'Securite', role_enum_1.Role.SECURITE, poulinaCompany);
    const poulinaSA = await societeRepo.save(societeRepo.create({
        nom: 'Poulina Group Alimentaire', code: 'PG', couleur: '#fa8c16',
        adresse: 'Zone Industrielle Sidi Fathallah, Ariana 2094',
        telephone: '+216 71 700 800',
        company: transfood,
        expediteurCompany: poulinaCompany,
    }));
    const filHuile = await filRepo.save(filRepo.create({
        nom: 'Huile Vegetale', code: 'HV',
        societeExpeditrice: { id: poulinaSA.id },
    }));
    const filCereales = await filRepo.save(filRepo.create({
        nom: 'Cereales & Legumineuses', code: 'CL',
        societeExpeditrice: { id: poulinaSA.id },
    }));
    for (const [fil, prefix] of [[filHuile, 'HV'], [filCereales, 'CL']]) {
        for (let i = 1; i <= 2; i++) {
            await quaiRepo.save(quaiRepo.create({
                nom: `${prefix}-${i}`, isActive: true,
                company: transfood, societeExpeditrice: poulinaSA, filiere: fil,
            }));
        }
    }
    await userRepo.save({ ...uHuile, filieres: [filHuile] });
    await userRepo.save({ ...uCereales, filieres: [filCereales] });
    await userRepo.save({ ...magPou, filieres: [filHuile, filCereales] });
    await userRepo.save({ ...secPou, filieres: [filHuile, filCereales] });
    await companyRepo.update(poulinaCompany.id, { logistiqueCompany: { id: transfood.id } });
    const TC_HV = [bon_livraison_entity_1.TypeChargement.CITERNE, bon_livraison_entity_1.TypeChargement.CITERNE, bon_livraison_entity_1.TypeChargement.VRAC, bon_livraison_entity_1.TypeChargement.CITERNE, bon_livraison_entity_1.TypeChargement.PALETTE, bon_livraison_entity_1.TypeChargement.CITERNE];
    const TC_CL = [bon_livraison_entity_1.TypeChargement.VRAC, bon_livraison_entity_1.TypeChargement.PALETTE, bon_livraison_entity_1.TypeChargement.VRAC, bon_livraison_entity_1.TypeChargement.VRAC, bon_livraison_entity_1.TypeChargement.PALETTE, bon_livraison_entity_1.TypeChargement.VRAC];
    const mkBLPou = async (numeroBl, filiere, statut, idx, tcArr) => {
        const ville = VILLES[idx % VILLES.length];
        const tc = tcArr[idx % tcArr.length];
        const tonnage = 8 + (idx % 20);
        return blRepo.save(blRepo.create({
            numeroBl, clientNom: CLIENTS[idx % CLIENTS.length],
            clientAdresse: `Zone Industrielle, ${ville}`,
            origine: ORIGINES[idx % ORIGINES.length], destination: ville,
            typeChargement: tc, tonnageTotal: tonnage,
            nombrePalettes: tc === bon_livraison_entity_1.TypeChargement.PALETTE ? 8 + (idx % 8) : 0,
            statut, datelivraison: new Date((0, dayjs_1.default)().add(3 + (idx % 10), 'day').toISOString()),
            company: transfood, societeExpeditrice: poulinaSA, filiere,
        }));
    };
    const hvBls = [];
    const clBls = [];
    for (let i = 1; i <= 3; i++)
        hvBls.push(await mkBLPou(`BL-HV-${pad(i)}`, filHuile, bl_status_enum_1.BlStatus.DRAFT, i + 80, TC_HV));
    for (let i = 4; i <= 8; i++)
        hvBls.push(await mkBLPou(`BL-HV-${pad(i)}`, filHuile, bl_status_enum_1.BlStatus.VALIDATED, i + 80, TC_HV));
    for (let i = 9; i <= 10; i++)
        hvBls.push(await mkBLPou(`BL-HV-${pad(i)}`, filHuile, bl_status_enum_1.BlStatus.LOADED, i + 80, TC_HV));
    for (let i = 1; i <= 3; i++)
        clBls.push(await mkBLPou(`BL-CL-${pad(i)}`, filCereales, bl_status_enum_1.BlStatus.DRAFT, i + 90, TC_CL));
    for (let i = 4; i <= 8; i++)
        clBls.push(await mkBLPou(`BL-CL-${pad(i)}`, filCereales, bl_status_enum_1.BlStatus.VALIDATED, i + 90, TC_CL));
    for (let i = 9; i <= 10; i++)
        clBls.push(await mkBLPou(`BL-CL-${pad(i)}`, filCereales, bl_status_enum_1.BlStatus.LOADED, i + 90, TC_CL));
    await mkPlan({
        reference: 'LP-PG-001', truck: extTrucks[3], date: D0,
        bls: [hvBls[8], hvBls[9]],
        isValidated: true, loadingStatus: 'IN_PROGRESS', entryStatus: 'ENTERED',
        quai: 'HV-1', station: 'HV', elapsedSecs: 1200, heureArrivee: '11:00',
    });
    await mkPlan({
        reference: 'LP-PG-002', truck: extTrucks[0], date: D1,
        bls: [clBls[8], clBls[9]],
        isValidated: true, loadingStatus: 'WAITING', entryStatus: 'IDLE',
        quai: 'CL-1', station: 'CL', elapsedSecs: 0, heureArrivee: null,
    });
    console.log('[seed] OK - Poulina: 2 filieres / 4 quais / 20 BLs / 2 plans');
    console.log('');
    console.log('==============================================================');
    console.log('  SEED TERMINE AVEC SUCCES');
    console.log('==============================================================');
    console.log('  Mot de passe : Test1234!');
    console.log('');
    console.log('  admin@tms.tn             SUPER_ADMIN');
    console.log('  logistique@transfood.tn  LOGISTIC_ADMIN');
    console.log('  admin@roseblanche.tn     EXPEDITEUR_ADMIN');
    console.log('  amt@roseblanche.tn       FILIERE_ADMIN (AMT)');
    console.log('  mcsr@roseblanche.tn      FILIERE_ADMIN (MCSR)');
    console.log('  pw@roseblanche.tn        FILIERE_ADMIN (PW)');
    console.log('  mag1@roseblanche.tn      MAGASINIER    (AMT + MCSR)');
    console.log('  mag2@roseblanche.tn      MAGASINIER    (PW)');
    console.log('  sec1@roseblanche.tn      SECURITE      (AMT + MCSR)');
    console.log('  sec2@roseblanche.tn      SECURITE      (PW)');
    console.log('');
    console.log('  --- Poulina Group ---');
    console.log('  admin@poulina.tn         EXPEDITEUR_ADMIN');
    console.log('  huile@poulina.tn         FILIERE_ADMIN (Huile Vegetale)');
    console.log('  cereales@poulina.tn      FILIERE_ADMIN (Cereales)');
    console.log('  mag@poulina.tn           MAGASINIER');
    console.log('  sec@poulina.tn           SECURITE');
    console.log('');
    console.log('  72 BLs Rose Blanche + 20 BLs Poulina = 92 BLs au total');
    console.log('  11 plans  /  16 camions (4 societes de transport)');
    console.log('==============================================================');
    await app.close();
}
function pad(n) { return String(n).padStart(3, '0'); }
bootstrap().catch((err) => {
    console.error('[seed] ECHEC :', err?.message ?? String(err));
    if (err?.stack)
        console.error(err.stack);
    process.exit(1);
});
//# sourceMappingURL=seed-main.js.map