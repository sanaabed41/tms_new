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
const societe_expeditrice_entity_1 = require("./expediteurs/societe-expeditrice.entity");
const filiere_entity_1 = require("./expediteurs/filiere.entity");
const quai_entity_1 = require("./quais/quai.entity");
const bon_livraison_entity_1 = require("./bons-livraison/bon-livraison.entity");
const loading_plan_entity_1 = require("./loading-plans/loading-plan.entity");
const article_entity_1 = require("./articles/article.entity");
const delivery_company_entity_1 = require("./delivery-companies/delivery-company.entity");
const truck_entity_1 = require("./trucks/truck.entity");
const chauffeur_entity_1 = require("./chauffeurs/chauffeur.entity");
const role_enum_1 = require("./common/enums/role.enum");
const company_type_enum_1 = require("./common/enums/company-type.enum");
const bl_status_enum_1 = require("./common/enums/bl-status.enum");
const bcrypt = __importStar(require("bcryptjs"));
async function upsert(repo, where, defaults) {
    const existing = await repo.findOne({ where: where });
    if (existing) {
        Object.assign(existing, defaults);
        return repo.save(existing);
    }
    return repo.save(repo.create({ ...where, ...defaults }));
}
function dateStr(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
}
const TODAY = dateStr(0);
const YESTERDAY = dateStr(-1);
const TOMORROW = dateStr(+1);
const NEXT_WEEK = dateStr(+7);
const LAST_WEEK = dateStr(-7);
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, { logger: false });
    const companyRepo = app.get((0, typeorm_1.getRepositoryToken)(company_entity_1.Company));
    const userRepo = app.get((0, typeorm_1.getRepositoryToken)(user_entity_1.User));
    const societeRepo = app.get((0, typeorm_1.getRepositoryToken)(societe_expeditrice_entity_1.SocieteExpeditrice));
    const filiereRepo = app.get((0, typeorm_1.getRepositoryToken)(filiere_entity_1.Filiere));
    const quaiRepo = app.get((0, typeorm_1.getRepositoryToken)(quai_entity_1.Quai));
    const blRepo = app.get((0, typeorm_1.getRepositoryToken)(bon_livraison_entity_1.BonLivraison));
    const planRepo = app.get((0, typeorm_1.getRepositoryToken)(loading_plan_entity_1.LoadingPlan));
    const articleRepo = app.get((0, typeorm_1.getRepositoryToken)(article_entity_1.Article));
    const deliveryCoRepo = app.get((0, typeorm_1.getRepositoryToken)(delivery_company_entity_1.DeliveryCompany));
    const truckRepo = app.get((0, typeorm_1.getRepositoryToken)(truck_entity_1.Truck));
    const chauffeurRepo = app.get((0, typeorm_1.getRepositoryToken)(chauffeur_entity_1.Chauffeur));
    const PWD = await bcrypt.hash('Demo123!', 10);
    console.log('\n[1/9] Companies…');
    const transfood = await upsert(companyRepo, { code: 'TF' }, { nom: 'TransFood', type: company_type_enum_1.CompanyType.LOGISTIQUE, couleur: '#1890ff', isActive: true });
    const rbSA = await upsert(companyRepo, { code: 'RB' }, { nom: 'Rose Blanche', type: company_type_enum_1.CompanyType.EXPEDITEUR, couleur: '#eb2f96', isActive: true });
    await companyRepo.update(rbSA.id, { logistiqueCompany: { id: transfood.id } });
    console.log(`  ✓ TransFood   · Rose Blanche   · Rapid Transport SARL`);
    console.log('\n[2/9] Utilisateurs…');
    const superAdmin = await upsert(userRepo, { email: 'admin@tms.com' }, { prenom: 'Super', nom: 'Admin', password: PWD, role: role_enum_1.Role.SUPER_ADMIN, isActive: true, company: transfood });
    const companyAdmin = await upsert(userRepo, { email: 'logistique@transfood.tn' }, { prenom: 'Responsable', nom: 'Logistique', password: PWD, role: role_enum_1.Role.LOGISTIC_ADMIN, isActive: true, company: transfood });
    const expediteurAdmin = await upsert(userRepo, { email: 'admin@roseblanche.tn' }, { prenom: 'Admin', nom: 'Rose Blanche', password: PWD, role: role_enum_1.Role.EXPEDITEUR_ADMIN, isActive: true, company: rbSA });
    console.log(`  ✓ SUPER_ADMIN · LOGISTIC_ADMIN · EXPEDITEUR_ADMIN`);
    console.log('\n[3/9] Société expéditrice + filières + quais…');
    const societe = await upsert(societeRepo, { nom: 'Rose Blanche' }, {
        code: 'RB',
        couleur: '#eb2f96',
        company: transfood,
        expediteurCompany: rbSA,
    });
    const filMCR = await upsert(filiereRepo, { code: 'MCSR' }, { nom: 'Matières Crèmeries', societeExpeditrice: societe });
    const filAMT = await upsert(filiereRepo, { code: 'AMT' }, { nom: 'AMT', societeExpeditrice: societe });
    const filPW = await upsert(filiereRepo, { code: 'PW' }, { nom: 'Pate Warda', societeExpeditrice: societe });
    console.log(`  ✓ Filières : MCSR · AMT · PW`);
    const faAdminMCR = await upsert(userRepo, { email: 'admin.mcr@roseblanche.tn' }, { prenom: 'Admin', nom: 'MCSR', password: PWD, role: role_enum_1.Role.FILIERE_ADMIN, isActive: true, company: rbSA, filieres: [filMCR] });
    const faAdminAMT = await upsert(userRepo, { email: 'admin.amt@roseblanche.tn' }, { prenom: 'Admin', nom: 'AMT', password: PWD, role: role_enum_1.Role.FILIERE_ADMIN, isActive: true, company: rbSA, filieres: [filAMT] });
    const faAdminPW = await upsert(userRepo, { email: 'admin.pw@roseblanche.tn' }, { prenom: 'Admin', nom: 'PW', password: PWD, role: role_enum_1.Role.FILIERE_ADMIN, isActive: true, company: rbSA, filieres: [filPW] });
    const mag1 = await upsert(userRepo, { email: 'mag1@roseblanche.tn' }, { prenom: 'Magasinier', nom: 'MCSR-AMT', password: PWD, role: role_enum_1.Role.MAGASINIER, isActive: true, company: rbSA, filieres: [filMCR, filAMT] });
    const mag2 = await upsert(userRepo, { email: 'mag2@roseblanche.tn' }, { prenom: 'Magasinier', nom: 'PW', password: PWD, role: role_enum_1.Role.MAGASINIER, isActive: true, company: rbSA, filieres: [filPW] });
    const sec1 = await upsert(userRepo, { email: 'sec1@roseblanche.tn' }, { prenom: 'Agent', nom: 'Sécurité MCSR-AMT', password: PWD, role: role_enum_1.Role.SECURITE, isActive: true, company: rbSA, filieres: [filMCR, filAMT] });
    const sec2 = await upsert(userRepo, { email: 'sec2@roseblanche.tn' }, { prenom: 'Agent', nom: 'Sécurité PW', password: PWD, role: role_enum_1.Role.SECURITE, isActive: true, company: rbSA, filieres: [filPW] });
    console.log(`  ✓ 3× FILIERE_ADMIN · 2× MAGASINIER · 2× SECURITE`);
    const quais = [];
    const quaiDefs = [
        { nom: 'Q-MCSR-1', filiere: filMCR }, { nom: 'Q-MCSR-2', filiere: filMCR }, { nom: 'Q-MCSR-3', filiere: filMCR },
        { nom: 'Q-AMT-1', filiere: filAMT }, { nom: 'Q-AMT-2', filiere: filAMT }, { nom: 'Q-AMT-3', filiere: filAMT },
        { nom: 'Q-PW-1', filiere: filPW }, { nom: 'Q-PW-2', filiere: filPW },
    ];
    for (const qd of quaiDefs) {
        const q = await upsert(quaiRepo, { nom: qd.nom, societeExpeditrice: societe }, { filiere: qd.filiere, isActive: true, company: null });
        quais.push(q);
    }
    console.log(`  ✓ 8 quais (Q-MCSR-1..3 · Q-AMT-1..3 · Q-PW-1..2)`);
    console.log('\n[4/9] Transport…');
    const dc = await upsert(deliveryCoRepo, { nom: 'Rapid Transport SARL' }, { adresse: 'Zone Industrielle Charguia, Tunis', telephone: '+216 71 800 200', isActive: true, company: transfood });
    const truckDefs = [
        { matricule: 'TN-111-1001', capaciteTonnage: 24, capacitePalettes: 20, type: 'FRIGO' },
        { matricule: 'TN-222-2002', capaciteTonnage: 30, capacitePalettes: 0, type: 'CITERNE' },
        { matricule: 'TN-333-3003', capaciteTonnage: 20, capacitePalettes: 18, type: 'PALETTE' },
        { matricule: 'TN-444-4004', capaciteTonnage: 28, capacitePalettes: 0, type: 'VRAC' },
        { matricule: 'TN-555-5005', capaciteTonnage: 18, capacitePalettes: 16, type: 'FRIGO' },
        { matricule: 'TN-666-6006', capaciteTonnage: 22, capacitePalettes: 20, type: 'PALETTE' },
        { matricule: 'TN-777-7007', capaciteTonnage: 25, capacitePalettes: 0, type: 'VRAC' },
        { matricule: 'TN-888-8008', capaciteTonnage: 32, capacitePalettes: 0, type: 'CITERNE' },
        { matricule: 'TN-999-9009', capaciteTonnage: 20, capacitePalettes: 18, type: 'FRIGO' },
        { matricule: 'TN-010-1010', capaciteTonnage: 18, capacitePalettes: 16, type: 'PALETTE' },
        { matricule: 'TN-011-1111', capaciteTonnage: 26, capacitePalettes: 0, type: 'VRAC' },
        { matricule: 'TN-012-1212', capaciteTonnage: 24, capacitePalettes: 20, type: 'FRIGO' },
    ];
    const trucks = [];
    for (const td of truckDefs) {
        const t = await upsert(truckRepo, { matricule: td.matricule }, { capaciteTonnage: td.capaciteTonnage, capacitePalettes: td.capacitePalettes, type: td.type, isActive: true, deliveryCompany: dc });
        trucks.push(t);
    }
    const chauffeurDefs = [
        { nom: 'Ben Ali', prenom: 'Khaled', cin: '12345678', telephone: '+216 20 111 001', permis: 'C' },
        { nom: 'Trabelsi', prenom: 'Sami', cin: '23456789', telephone: '+216 20 111 002', permis: 'C+E' },
        { nom: 'Mansouri', prenom: 'Farouk', cin: '34567890', telephone: '+216 20 111 003', permis: 'C' },
        { nom: 'Boughzala', prenom: 'Mehdi', cin: '45678901', telephone: '+216 20 111 004', permis: 'CE' },
        { nom: 'Jelassi', prenom: 'Amine', cin: '56789012', telephone: '+216 20 111 005', permis: 'C' },
        { nom: 'Chaabane', prenom: 'Riadh', cin: '67890123', telephone: '+216 20 111 006', permis: 'C+E' },
        { nom: 'Khedher', prenom: 'Walid', cin: '78901234', telephone: '+216 20 111 007', permis: 'C' },
        { nom: 'Zouaghi', prenom: 'Nabil', cin: '89012345', telephone: '+216 20 111 008', permis: 'CE' },
        { nom: 'Hamdi', prenom: 'Slim', cin: '90123456', telephone: '+216 20 111 009', permis: 'C' },
        { nom: 'Baccouche', prenom: 'Tarek', cin: '01234567', telephone: '+216 20 111 010', permis: 'C+E' },
    ];
    for (const cd of chauffeurDefs) {
        await upsert(chauffeurRepo, { cin: cd.cin }, { nom: cd.nom, prenom: cd.prenom, telephone: cd.telephone, permis: cd.permis, isActive: true, deliveryCompany: dc });
    }
    console.log(`  ✓ 12 camions · 10 chauffeurs`);
    console.log('\n[5/9] Articles…');
    const articleDefs = [
        { code: 'MCSR-FRB-001', libelle: 'Fromage blanc 500g', poidsUnitaire: 0.500, unite: 'pièce' },
        { code: 'MCSR-BEU-001', libelle: 'Beurre doux 250g', poidsUnitaire: 0.250, unite: 'pièce' },
        { code: 'MCSR-CRE-001', libelle: 'Crème fraîche 1L', poidsUnitaire: 1.000, unite: 'litre' },
        { code: 'MCSR-LAC-001', libelle: 'Lait concentré 400g', poidsUnitaire: 0.400, unite: 'boîte' },
        { code: 'AMT-SEM-001', libelle: 'Semoule fine 5kg', poidsUnitaire: 5.000, unite: 'sac' },
        { code: 'AMT-FAR-001', libelle: 'Farine type 55 50kg', poidsUnitaire: 50.00, unite: 'sac' },
        { code: 'AMT-HUI-001', libelle: 'Huile tournesol 5L', poidsUnitaire: 4.500, unite: 'bidon' },
        { code: 'AMT-SUC-001', libelle: 'Sucre blanc 50kg', poidsUnitaire: 50.00, unite: 'sac' },
        { code: 'PW-PAT-001', libelle: 'Pâtes Warda courte 1kg', poidsUnitaire: 1.000, unite: 'paquet' },
        { code: 'PW-PAT-002', libelle: 'Pâtes Warda longue 1kg', poidsUnitaire: 1.000, unite: 'paquet' },
        { code: 'PW-CUS-001', libelle: 'Couscous fin 1kg', poidsUnitaire: 1.000, unite: 'paquet' },
        { code: 'PW-CUS-002', libelle: 'Couscous moyen 1kg', poidsUnitaire: 1.000, unite: 'paquet' },
    ];
    for (const ad of articleDefs) {
        await upsert(articleRepo, { code: ad.code }, { libelle: ad.libelle, poidsUnitaire: ad.poidsUnitaire, unite: ad.unite });
    }
    console.log(`  ✓ 12 articles`);
    console.log('\n[6/9] Plans de chargement…');
    const planDefs = [
        { ref: 'PL-RB-001', date: TODAY, truck: trucks[0], isValidated: true, loadingStatus: 'WAITING', entryStatus: 'IDLE', heureArrivee: '08:00', tonnageCharge: 0 },
        { ref: 'PL-RB-002', date: TODAY, truck: trucks[1], isValidated: true, loadingStatus: 'WAITING', entryStatus: 'IDLE', heureArrivee: '08:30', tonnageCharge: 0 },
        { ref: 'PL-RB-003', date: TODAY, truck: trucks[2], isValidated: true, loadingStatus: 'WAITING', entryStatus: 'IDLE', heureArrivee: '09:00', tonnageCharge: 0 },
        { ref: 'PL-RB-004', date: TODAY, truck: trucks[3], isValidated: true, loadingStatus: 'WAITING', entryStatus: 'CALLED', heureArrivee: '07:30', quai: 'Q-MCSR-1', tonnageCharge: 0 },
        { ref: 'PL-RB-005', date: TODAY, truck: trucks[4], isValidated: true, loadingStatus: 'WAITING', entryStatus: 'CALLED', heureArrivee: '07:45', quai: 'Q-AMT-1', tonnageCharge: 0 },
        { ref: 'PL-RB-006', date: TODAY, truck: trucks[5], isValidated: true, loadingStatus: 'IN_PROGRESS', entryStatus: 'ENTERED', heureArrivee: '06:00', quai: 'Q-MCSR-2', tonnageCharge: 32.5 },
        { ref: 'PL-RB-007', date: TODAY, truck: trucks[6], isValidated: true, loadingStatus: 'IN_PROGRESS', entryStatus: 'ENTERED', heureArrivee: '06:30', quai: 'Q-AMT-2', tonnageCharge: 21.0 },
        { ref: 'PL-RB-008', date: TODAY, truck: trucks[7], isValidated: true, loadingStatus: 'PAUSED', entryStatus: 'ENTERED', heureArrivee: '05:30', quai: 'Q-PW-1', tonnageCharge: 18.0 },
        { ref: 'PL-RB-009', date: TODAY, truck: trucks[8], isValidated: true, loadingStatus: 'DONE', entryStatus: 'EXITED', heureArrivee: '04:00', quai: 'Q-MCSR-3', tonnageCharge: 45.0 },
        { ref: 'PL-RB-010', date: TODAY, truck: trucks[9], isValidated: true, loadingStatus: 'DONE', entryStatus: 'EXITED', heureArrivee: '04:30', quai: 'Q-AMT-3', tonnageCharge: 38.5 },
        { ref: 'PL-RB-011', date: YESTERDAY, truck: trucks[10], isValidated: true, loadingStatus: 'DONE', entryStatus: 'EXITED', heureArrivee: '06:00', quai: 'Q-MCSR-1', tonnageCharge: 42.0 },
        { ref: 'PL-RB-012', date: YESTERDAY, truck: trucks[11], isValidated: true, loadingStatus: 'DONE', entryStatus: 'EXITED', heureArrivee: '07:00', quai: 'Q-AMT-1', tonnageCharge: 36.0 },
        { ref: 'PL-RB-013', date: YESTERDAY, truck: trucks[0], isValidated: true, loadingStatus: 'DONE', entryStatus: 'EXITED', heureArrivee: '08:00', quai: 'Q-PW-1', tonnageCharge: 28.0 },
        { ref: 'PL-RB-014', date: YESTERDAY, truck: trucks[1], isValidated: true, loadingStatus: 'DONE', entryStatus: 'EXITED', heureArrivee: '09:00', quai: 'Q-MCSR-2', tonnageCharge: 50.0 },
        { ref: 'PL-RB-015', date: YESTERDAY, truck: trucks[2], isValidated: true, loadingStatus: 'DONE', entryStatus: 'EXITED', heureArrivee: '10:00', quai: 'Q-AMT-2', tonnageCharge: 44.0 },
        { ref: 'PL-RB-016', date: TOMORROW, truck: trucks[3], isValidated: true, loadingStatus: 'WAITING', entryStatus: 'IDLE', heureArrivee: '07:00', tonnageCharge: 0 },
        { ref: 'PL-RB-017', date: TOMORROW, truck: trucks[4], isValidated: true, loadingStatus: 'WAITING', entryStatus: 'IDLE', heureArrivee: '08:00', tonnageCharge: 0 },
        { ref: 'PL-RB-018', date: TOMORROW, truck: trucks[5], isValidated: true, loadingStatus: 'WAITING', entryStatus: 'IDLE', heureArrivee: '09:00', tonnageCharge: 0 },
    ];
    const plans = {};
    for (const pd of planDefs) {
        const plan = await upsert(planRepo, { reference: pd.ref }, {
            dateLivraison: pd.date,
            isValidated: pd.isValidated,
            loadingStatus: pd.loadingStatus,
            entryStatus: pd.entryStatus,
            heureArrivee: pd.heureArrivee ?? null,
            quai: pd.quai ?? null,
            tonnageCharge: pd.tonnageCharge ?? 0,
            palettesChargees: 0,
            truck: pd.truck,
            validatedBy: companyAdmin,
            logistiqueCompanyId: transfood.id,
            signature: pd.isValidated ? 'sig_demo' : null,
        });
        plans[pd.ref] = plan;
    }
    console.log(`  ✓ 18 plans (3 IDLE · 2 CALLED · 2 IN_PROGRESS · 1 PAUSED · 2 DONE/today · 5 DONE/hier · 3 IDLE/demain)`);
    console.log('\n[7/9] Bons de livraison…');
    const blDefs = [
        { numeroBl: 'BL-MCSR-T001', clientNom: 'SAPD Distribution', destination: 'Tunis', origine: 'Béja', tonnageTotal: 12.0, typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, statut: bl_status_enum_1.BlStatus.VALIDATED, datelivraison: TODAY, filiere: filMCR, ordreChargement: 1, plan: plans['PL-RB-001'] },
        { numeroBl: 'BL-AMT-T001', clientNom: 'Cotupha  ', destination: 'Sousse', origine: 'Béja', tonnageTotal: 18.0, typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, statut: bl_status_enum_1.BlStatus.VALIDATED, datelivraison: TODAY, filiere: filAMT, ordreChargement: 2, plan: plans['PL-RB-001'] },
        { numeroBl: 'BL-PW-T001', clientNom: 'Maghrébine Aliments', destination: 'Sfax', origine: 'Béja', tonnageTotal: 15.0, typeChargement: bon_livraison_entity_1.TypeChargement.PALETTE, statut: bl_status_enum_1.BlStatus.VALIDATED, datelivraison: TODAY, filiere: filPW, ordreChargement: 3, plan: plans['PL-RB-001'] },
        { numeroBl: 'BL-MCSR-T002', clientNom: 'Grande Distribution Sud', destination: 'Gabes', origine: 'Béja', tonnageTotal: 8.5, typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, statut: bl_status_enum_1.BlStatus.VALIDATED, datelivraison: TODAY, filiere: filMCR, ordreChargement: 1, plan: plans['PL-RB-002'] },
        { numeroBl: 'BL-AMT-T002', clientNom: 'Société Nabeulienne', destination: 'Nabeul', origine: 'Béja', tonnageTotal: 24.0, typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, statut: bl_status_enum_1.BlStatus.VALIDATED, datelivraison: TODAY, filiere: filAMT, ordreChargement: 2, plan: plans['PL-RB-002'] },
        { numeroBl: 'BL-PW-T002', clientNom: 'Distributeur Côtier', destination: 'Bizerte', origine: 'Béja', tonnageTotal: 20.0, typeChargement: bon_livraison_entity_1.TypeChargement.PALETTE, statut: bl_status_enum_1.BlStatus.VALIDATED, datelivraison: TODAY, filiere: filPW, ordreChargement: 3, plan: plans['PL-RB-002'] },
        { numeroBl: 'BL-MCSR-T003', clientNom: 'Monastir Trade', destination: 'Monastir', origine: 'Béja', tonnageTotal: 15.0, typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, statut: bl_status_enum_1.BlStatus.VALIDATED, datelivraison: TODAY, filiere: filMCR, ordreChargement: 1, plan: plans['PL-RB-003'] },
        { numeroBl: 'BL-AMT-T003', clientNom: 'Kairouan Distribution', destination: 'Kairouan', origine: 'Béja', tonnageTotal: 22.0, typeChargement: bon_livraison_entity_1.TypeChargement.CITERNE, statut: bl_status_enum_1.BlStatus.VALIDATED, datelivraison: TODAY, filiere: filAMT, ordreChargement: 2, plan: plans['PL-RB-003'] },
        { numeroBl: 'BL-MCSR-T004', clientNom: 'Sud Alimentaire', destination: 'Gafsa', origine: 'Béja', tonnageTotal: 10.0, typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, statut: bl_status_enum_1.BlStatus.LOADED, datelivraison: TODAY, filiere: filMCR, ordreChargement: 1, plan: plans['PL-RB-004'] },
        { numeroBl: 'BL-AMT-T004', clientNom: 'Béja Négoce', destination: 'Béja', origine: 'Béja', tonnageTotal: 28.0, typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, statut: bl_status_enum_1.BlStatus.LOADED, datelivraison: TODAY, filiere: filAMT, ordreChargement: 2, plan: plans['PL-RB-004'] },
        { numeroBl: 'BL-PW-T003', clientNom: 'SAPD Distribution', destination: 'Tunis', origine: 'Béja', tonnageTotal: 22.0, typeChargement: bon_livraison_entity_1.TypeChargement.PALETTE, statut: bl_status_enum_1.BlStatus.LOADED, datelivraison: TODAY, filiere: filPW, ordreChargement: 1, plan: plans['PL-RB-005'] },
        { numeroBl: 'BL-AMT-T005', clientNom: 'Cotupha  ', destination: 'Sousse', origine: 'Béja', tonnageTotal: 26.0, typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, statut: bl_status_enum_1.BlStatus.LOADED, datelivraison: TODAY, filiere: filAMT, ordreChargement: 2, plan: plans['PL-RB-005'] },
        { numeroBl: 'BL-MCSR-T005', clientNom: 'Maghrébine Aliments', destination: 'Sfax', origine: 'Béja', tonnageTotal: 20.0, typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, statut: bl_status_enum_1.BlStatus.LOADED, datelivraison: TODAY, filiere: filMCR, ordreChargement: 1, plan: plans['PL-RB-006'] },
        { numeroBl: 'BL-AMT-T006', clientNom: 'Grande Distribution Sud', destination: 'Gabes', origine: 'Béja', tonnageTotal: 18.0, typeChargement: bon_livraison_entity_1.TypeChargement.CITERNE, statut: bl_status_enum_1.BlStatus.LOADED, datelivraison: TODAY, filiere: filAMT, ordreChargement: 2, plan: plans['PL-RB-006'] },
        { numeroBl: 'BL-PW-T004', clientNom: 'Société Nabeulienne', destination: 'Nabeul', origine: 'Béja', tonnageTotal: 15.0, typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, statut: bl_status_enum_1.BlStatus.LOADED, datelivraison: TODAY, filiere: filPW, ordreChargement: 3, plan: plans['PL-RB-006'] },
        { numeroBl: 'BL-MCSR-T006', clientNom: 'Distributeur Côtier', destination: 'Bizerte', origine: 'Béja', tonnageTotal: 12.0, typeChargement: bon_livraison_entity_1.TypeChargement.PALETTE, statut: bl_status_enum_1.BlStatus.LOADED, datelivraison: TODAY, filiere: filMCR, ordreChargement: 1, plan: plans['PL-RB-007'] },
        { numeroBl: 'BL-PW-T005', clientNom: 'Monastir Trade', destination: 'Monastir', origine: 'Béja', tonnageTotal: 16.0, typeChargement: bon_livraison_entity_1.TypeChargement.PALETTE, statut: bl_status_enum_1.BlStatus.LOADED, datelivraison: TODAY, filiere: filPW, ordreChargement: 2, plan: plans['PL-RB-007'] },
        { numeroBl: 'BL-AMT-T007', clientNom: 'Kairouan Distribution', destination: 'Kairouan', origine: 'Béja', tonnageTotal: 20.0, typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, statut: bl_status_enum_1.BlStatus.LOADED, datelivraison: TODAY, filiere: filAMT, ordreChargement: 1, plan: plans['PL-RB-008'] },
        { numeroBl: 'BL-MCSR-T007', clientNom: 'Sud Alimentaire', destination: 'Gafsa', origine: 'Béja', tonnageTotal: 9.0, typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, statut: bl_status_enum_1.BlStatus.LOADED, datelivraison: TODAY, filiere: filMCR, ordreChargement: 2, plan: plans['PL-RB-008'] },
        { numeroBl: 'BL-MCSR-T008', clientNom: 'Béja Négoce', destination: 'Béja', origine: 'Béja', tonnageTotal: 14.0, typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, statut: bl_status_enum_1.BlStatus.DELIVERED, datelivraison: TODAY, filiere: filMCR, ordreChargement: 1, plan: plans['PL-RB-009'] },
        { numeroBl: 'BL-AMT-T008', clientNom: 'SAPD Distribution', destination: 'Tunis', origine: 'Béja', tonnageTotal: 22.0, typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, statut: bl_status_enum_1.BlStatus.DELIVERED, datelivraison: TODAY, filiere: filAMT, ordreChargement: 2, plan: plans['PL-RB-009'] },
        { numeroBl: 'BL-PW-T006', clientNom: 'Cotupha  ', destination: 'Sousse', origine: 'Béja', tonnageTotal: 16.0, typeChargement: bon_livraison_entity_1.TypeChargement.PALETTE, statut: bl_status_enum_1.BlStatus.DELIVERED, datelivraison: TODAY, filiere: filPW, ordreChargement: 3, plan: plans['PL-RB-009'] },
        { numeroBl: 'BL-MCSR-T009', clientNom: 'Maghrébine Aliments', destination: 'Sfax', origine: 'Béja', tonnageTotal: 18.0, typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, statut: bl_status_enum_1.BlStatus.DELIVERED, datelivraison: TODAY, filiere: filMCR, ordreChargement: 1, plan: plans['PL-RB-010'] },
        { numeroBl: 'BL-PW-T007', clientNom: 'Grande Distribution Sud', destination: 'Gabes', origine: 'Béja', tonnageTotal: 19.0, typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, statut: bl_status_enum_1.BlStatus.DELIVERED, datelivraison: TODAY, filiere: filPW, ordreChargement: 2, plan: plans['PL-RB-010'] },
        { numeroBl: 'BL-AMT-T009', clientNom: 'Société Nabeulienne', destination: 'Nabeul', origine: 'Béja', tonnageTotal: 12.0, typeChargement: bon_livraison_entity_1.TypeChargement.CITERNE, statut: bl_status_enum_1.BlStatus.DELIVERED, datelivraison: TODAY, filiere: filAMT, ordreChargement: 3, plan: plans['PL-RB-010'] },
        { numeroBl: 'BL-MCSR-T010', clientNom: 'Distributeur Côtier', destination: 'Bizerte', origine: 'Béja', tonnageTotal: 9.5, typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, statut: bl_status_enum_1.BlStatus.DRAFT, datelivraison: TODAY, filiere: filMCR, notes: 'En attente de validation BL' },
        { numeroBl: 'BL-AMT-T010', clientNom: 'Monastir Trade', destination: 'Monastir', origine: 'Béja', tonnageTotal: 16.0, typeChargement: bon_livraison_entity_1.TypeChargement.PALETTE, statut: bl_status_enum_1.BlStatus.DRAFT, datelivraison: TODAY, filiere: filAMT, notes: 'Commande urgente — à valider' },
        { numeroBl: 'BL-PW-T008', clientNom: 'Sud Alimentaire', destination: 'Gafsa', origine: 'Béja', tonnageTotal: 14.0, typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, statut: bl_status_enum_1.BlStatus.DRAFT, datelivraison: TODAY, filiere: filPW, notes: 'BL créé manuellement' },
        { numeroBl: 'BL-MCSR-T011', clientNom: 'Kairouan Distribution', destination: 'Kairouan', origine: 'Béja', tonnageTotal: 11.0, typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, statut: bl_status_enum_1.BlStatus.VALIDATED, datelivraison: TODAY, filiere: filMCR, notes: 'Validé — sans plan encore' },
        { numeroBl: 'BL-AMT-T011', clientNom: 'Béja Négoce', destination: 'Béja', origine: 'Béja', tonnageTotal: 30.0, typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, statut: bl_status_enum_1.BlStatus.VALIDATED, datelivraison: TODAY, filiere: filAMT, notes: 'Validé — sans plan encore' },
        { numeroBl: 'BL-MCSR-Y001', clientNom: 'SAPD Distribution', destination: 'Tunis', origine: 'Béja', tonnageTotal: 16.0, typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, statut: bl_status_enum_1.BlStatus.DELIVERED, datelivraison: YESTERDAY, filiere: filMCR, ordreChargement: 1, plan: plans['PL-RB-011'] },
        { numeroBl: 'BL-AMT-Y001', clientNom: 'Cotupha  ', destination: 'Sousse', origine: 'Béja', tonnageTotal: 26.0, typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, statut: bl_status_enum_1.BlStatus.DELIVERED, datelivraison: YESTERDAY, filiere: filAMT, ordreChargement: 2, plan: plans['PL-RB-011'] },
        { numeroBl: 'BL-PW-Y001', clientNom: 'Maghrébine Aliments', destination: 'Sfax', origine: 'Béja', tonnageTotal: 18.0, typeChargement: bon_livraison_entity_1.TypeChargement.PALETTE, statut: bl_status_enum_1.BlStatus.DELIVERED, datelivraison: YESTERDAY, filiere: filPW, ordreChargement: 3, plan: plans['PL-RB-011'] },
        { numeroBl: 'BL-MCSR-Y002', clientNom: 'Grande Distribution Sud', destination: 'Gabes', origine: 'Béja', tonnageTotal: 12.0, typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, statut: bl_status_enum_1.BlStatus.DELIVERED, datelivraison: YESTERDAY, filiere: filMCR, ordreChargement: 1, plan: plans['PL-RB-012'] },
        { numeroBl: 'BL-AMT-Y002', clientNom: 'Société Nabeulienne', destination: 'Nabeul', origine: 'Béja', tonnageTotal: 24.0, typeChargement: bon_livraison_entity_1.TypeChargement.CITERNE, statut: bl_status_enum_1.BlStatus.DELIVERED, datelivraison: YESTERDAY, filiere: filAMT, ordreChargement: 2, plan: plans['PL-RB-012'] },
        { numeroBl: 'BL-MCSR-Y003', clientNom: 'Distributeur Côtier', destination: 'Bizerte', origine: 'Béja', tonnageTotal: 10.0, typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, statut: bl_status_enum_1.BlStatus.DELIVERED, datelivraison: YESTERDAY, filiere: filMCR, ordreChargement: 1, plan: plans['PL-RB-013'] },
        { numeroBl: 'BL-PW-Y002', clientNom: 'Monastir Trade', destination: 'Monastir', origine: 'Béja', tonnageTotal: 18.0, typeChargement: bon_livraison_entity_1.TypeChargement.PALETTE, statut: bl_status_enum_1.BlStatus.DELIVERED, datelivraison: YESTERDAY, filiere: filPW, ordreChargement: 2, plan: plans['PL-RB-013'] },
        { numeroBl: 'BL-AMT-Y003', clientNom: 'Kairouan Distribution', destination: 'Kairouan', origine: 'Béja', tonnageTotal: 28.0, typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, statut: bl_status_enum_1.BlStatus.DELIVERED, datelivraison: YESTERDAY, filiere: filAMT, ordreChargement: 1, plan: plans['PL-RB-014'] },
        { numeroBl: 'BL-PW-Y003', clientNom: 'Sud Alimentaire', destination: 'Gafsa', origine: 'Béja', tonnageTotal: 22.0, typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, statut: bl_status_enum_1.BlStatus.DELIVERED, datelivraison: YESTERDAY, filiere: filPW, ordreChargement: 2, plan: plans['PL-RB-014'] },
        { numeroBl: 'BL-AMT-Y004', clientNom: 'Béja Négoce', destination: 'Béja', origine: 'Béja', tonnageTotal: 44.0, typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, statut: bl_status_enum_1.BlStatus.DELIVERED, datelivraison: YESTERDAY, filiere: filAMT, ordreChargement: 1, plan: plans['PL-RB-015'] },
        { numeroBl: 'BL-MCSR-TM01', clientNom: 'SAPD Distribution', destination: 'Tunis', origine: 'Béja', tonnageTotal: 14.0, typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, statut: bl_status_enum_1.BlStatus.VALIDATED, datelivraison: TOMORROW, filiere: filMCR, ordreChargement: 1, plan: plans['PL-RB-016'] },
        { numeroBl: 'BL-AMT-TM01', clientNom: 'Cotupha  ', destination: 'Sousse', origine: 'Béja', tonnageTotal: 20.0, typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, statut: bl_status_enum_1.BlStatus.VALIDATED, datelivraison: TOMORROW, filiere: filAMT, ordreChargement: 2, plan: plans['PL-RB-016'] },
        { numeroBl: 'BL-MCSR-TM02', clientNom: 'Maghrébine Aliments', destination: 'Sfax', origine: 'Béja', tonnageTotal: 11.0, typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, statut: bl_status_enum_1.BlStatus.VALIDATED, datelivraison: TOMORROW, filiere: filMCR, ordreChargement: 1, plan: plans['PL-RB-017'] },
        { numeroBl: 'BL-AMT-TM02', clientNom: 'Grande Distribution Sud', destination: 'Gabes', origine: 'Béja', tonnageTotal: 25.0, typeChargement: bon_livraison_entity_1.TypeChargement.CITERNE, statut: bl_status_enum_1.BlStatus.VALIDATED, datelivraison: TOMORROW, filiere: filAMT, ordreChargement: 2, plan: plans['PL-RB-017'] },
        { numeroBl: 'BL-PW-TM01', clientNom: 'Société Nabeulienne', destination: 'Nabeul', origine: 'Béja', tonnageTotal: 18.0, typeChargement: bon_livraison_entity_1.TypeChargement.PALETTE, statut: bl_status_enum_1.BlStatus.VALIDATED, datelivraison: TOMORROW, filiere: filPW, ordreChargement: 3, plan: plans['PL-RB-017'] },
        { numeroBl: 'BL-AMT-TM03', clientNom: 'Distributeur Côtier', destination: 'Bizerte', origine: 'Béja', tonnageTotal: 22.0, typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, statut: bl_status_enum_1.BlStatus.VALIDATED, datelivraison: TOMORROW, filiere: filAMT, ordreChargement: 1, plan: plans['PL-RB-018'] },
        { numeroBl: 'BL-MCSR-TM03', clientNom: 'Monastir Trade', destination: 'Monastir', origine: 'Béja', tonnageTotal: 13.0, typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, statut: bl_status_enum_1.BlStatus.DRAFT, datelivraison: TOMORROW, filiere: filMCR, notes: 'BL demain — pas encore planifié' },
        { numeroBl: 'BL-PW-TM02', clientNom: 'Kairouan Distribution', destination: 'Kairouan', origine: 'Béja', tonnageTotal: 17.0, typeChargement: bon_livraison_entity_1.TypeChargement.PALETTE, statut: bl_status_enum_1.BlStatus.DRAFT, datelivraison: TOMORROW, filiere: filPW, notes: 'BL demain — en cours de validation' },
        { numeroBl: 'BL-MCSR-NW01', clientNom: 'SAPD Distribution', destination: 'Tunis', origine: 'Béja', tonnageTotal: 20.0, typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, statut: bl_status_enum_1.BlStatus.DRAFT, datelivraison: NEXT_WEEK, filiere: filMCR, notes: 'Pré-commande semaine prochaine' },
        { numeroBl: 'BL-AMT-NW01', clientNom: 'Cotupha  ', destination: 'Sousse', origine: 'Béja', tonnageTotal: 30.0, typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, statut: bl_status_enum_1.BlStatus.DRAFT, datelivraison: NEXT_WEEK, filiere: filAMT, notes: 'Pré-commande semaine prochaine' },
        { numeroBl: 'BL-PW-NW01', clientNom: 'Maghrébine Aliments', destination: 'Sfax', origine: 'Béja', tonnageTotal: 24.0, typeChargement: bon_livraison_entity_1.TypeChargement.PALETTE, statut: bl_status_enum_1.BlStatus.DRAFT, datelivraison: NEXT_WEEK, filiere: filPW, notes: 'Pré-commande semaine prochaine' },
        { numeroBl: 'BL-AMT-NW02', clientNom: 'Grande Distribution Sud', destination: 'Gabes', origine: 'Béja', tonnageTotal: 28.0, typeChargement: bon_livraison_entity_1.TypeChargement.CITERNE, statut: bl_status_enum_1.BlStatus.DRAFT, datelivraison: NEXT_WEEK, filiere: filAMT, notes: 'Pré-commande semaine prochaine' },
        { numeroBl: 'BL-PW-NW02', clientNom: 'Société Nabeulienne', destination: 'Nabeul', origine: 'Béja', tonnageTotal: 18.0, typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, statut: bl_status_enum_1.BlStatus.DRAFT, datelivraison: NEXT_WEEK, filiere: filPW, notes: 'Pré-commande semaine prochaine' },
        { numeroBl: 'BL-MCSR-LW01', clientNom: 'Distributeur Côtier', destination: 'Bizerte', origine: 'Béja', tonnageTotal: 15.0, typeChargement: bon_livraison_entity_1.TypeChargement.FRIGO, statut: bl_status_enum_1.BlStatus.DELIVERED, datelivraison: LAST_WEEK, filiere: filMCR },
        { numeroBl: 'BL-AMT-LW01', clientNom: 'Monastir Trade', destination: 'Monastir', origine: 'Béja', tonnageTotal: 28.0, typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, statut: bl_status_enum_1.BlStatus.DELIVERED, datelivraison: LAST_WEEK, filiere: filAMT },
        { numeroBl: 'BL-PW-LW01', clientNom: 'Kairouan Distribution', destination: 'Kairouan', origine: 'Béja', tonnageTotal: 22.0, typeChargement: bon_livraison_entity_1.TypeChargement.PALETTE, statut: bl_status_enum_1.BlStatus.DELIVERED, datelivraison: LAST_WEEK, filiere: filPW },
        { numeroBl: 'BL-AMT-LW02', clientNom: 'Sud Alimentaire', destination: 'Gafsa', origine: 'Béja', tonnageTotal: 36.0, typeChargement: bon_livraison_entity_1.TypeChargement.VRAC, statut: bl_status_enum_1.BlStatus.DELIVERED, datelivraison: LAST_WEEK, filiere: filAMT },
    ];
    let blCount = 0;
    for (const bd of blDefs) {
        await upsert(blRepo, { numeroBl: bd.numeroBl }, {
            clientNom: bd.clientNom,
            clientAdresse: bd.destination,
            destination: bd.destination,
            origine: bd.origine ?? 'Béja',
            typeChargement: bd.typeChargement,
            tonnageTotal: bd.tonnageTotal,
            nombrePalettes: bd.typeChargement === bon_livraison_entity_1.TypeChargement.PALETTE ? Math.ceil(bd.tonnageTotal / 0.8) : 0,
            statut: bd.statut,
            datelivraison: bd.datelivraison,
            filiere: bd.filiere,
            societeExpeditrice: societe,
            company: transfood,
            loadingPlan: bd.plan ?? null,
            ordreChargement: bd.ordreChargement ?? null,
            notes: bd.notes ?? null,
            erpReference: `ERP-${bd.numeroBl}`,
        });
        blCount++;
    }
    console.log(`  ✓ ${blCount} bons de livraison`);
    console.log('\n[8/9] Récapitulatif des BLs…');
    const counts = {
        today: blDefs.filter((b) => b.datelivraison === TODAY).length,
        yesterday: blDefs.filter((b) => b.datelivraison === YESTERDAY).length,
        tomorrow: blDefs.filter((b) => b.datelivraison === TOMORROW).length,
        nextWeek: blDefs.filter((b) => b.datelivraison === NEXT_WEEK).length,
        lastWeek: blDefs.filter((b) => b.datelivraison === LAST_WEEK).length,
        draft: blDefs.filter((b) => b.statut === bl_status_enum_1.BlStatus.DRAFT).length,
        validated: blDefs.filter((b) => b.statut === bl_status_enum_1.BlStatus.VALIDATED).length,
        loaded: blDefs.filter((b) => b.statut === bl_status_enum_1.BlStatus.LOADED).length,
        delivered: blDefs.filter((b) => b.statut === bl_status_enum_1.BlStatus.DELIVERED).length,
        mcr: blDefs.filter((b) => b.filiere === filMCR).length,
        amt: blDefs.filter((b) => b.filiere === filAMT).length,
        pw: blDefs.filter((b) => b.filiere === filPW).length,
    };
    console.log(`  Dates  : aujourd'hui=${counts.today} · hier=${counts.yesterday} · demain=${counts.tomorrow} · semaine prochaine=${counts.nextWeek} · semaine dernière=${counts.lastWeek}`);
    console.log(`  Statuts: DRAFT=${counts.draft} · VALIDATED=${counts.validated} · LOADED=${counts.loaded} · DELIVERED=${counts.delivered}`);
    console.log(`  Filières: MCSR=${counts.mcr} · AMT=${counts.amt} · PW=${counts.pw}`);
    console.log('\n[9/9] ✅ Seeder terminé !');
    console.log('='.repeat(62));
    console.log('  COMPTES (mot de passe : Demo123!)');
    console.log('  ─────────────────────────────────────────────────────────');
    console.log('  SUPER_ADMIN          : admin@tms.com');
    console.log('  COMPANY_ADMIN        : logistique@transfood.tn');
    console.log('  EXPEDITEUR_ADMIN     : admin@roseblanche.tn');
    console.log('  FILIERE_ADMIN MCSR    : admin.mcr@roseblanche.tn');
    console.log('  FILIERE_ADMIN AMT    : admin.amt@roseblanche.tn');
    console.log('  FILIERE_ADMIN PW     : admin.pw@roseblanche.tn');
    console.log('  MAGASINIER MCSR+AMT   : mag1@roseblanche.tn');
    console.log('  MAGASINIER PW        : mag2@roseblanche.tn');
    console.log('  SECURITE MCSR+AMT     : sec1@roseblanche.tn');
    console.log('  SECURITE PW          : sec2@roseblanche.tn');
    console.log('  TRANSPORT_ADMIN      : admin@rapidtransport.tn');
    console.log('  EXPLOITANT_TRANSPORT : exploit@rapidtransport.tn');
    console.log('='.repeat(62));
    console.log(`  ${blCount} BLs · 18 plans · 12 camions · 10 chauffeurs · 8 quais`);
    console.log('='.repeat(62));
    await app.close();
}
bootstrap().catch((e) => {
    console.error('❌ Erreur seeder :', e);
    process.exit(1);
});
//# sourceMappingURL=seed-rb-complet.js.map