"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const typeorm_1 = require("@nestjs/typeorm");
const company_entity_1 = require("./companies/company.entity");
const delivery_company_entity_1 = require("./delivery-companies/delivery-company.entity");
const truck_entity_1 = require("./trucks/truck.entity");
async function upsertDC(repo, nom, adresse, telephone, company) {
    const existing = await repo.findOne({ where: { nom } });
    if (existing)
        return existing;
    return repo.save(repo.create({ nom, adresse, telephone, isActive: true, company }));
}
async function upsertTruck(repo, matricule, capaciteTonnage, capacitePalettes, type, dc) {
    const existing = await repo.findOne({ where: { matricule } });
    if (existing)
        return;
    await repo.save(repo.create({ matricule, capaciteTonnage, capacitePalettes, type, isActive: true, deliveryCompany: dc }));
}
async function seed() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, { logger: ['error'] });
    const companyRepo = app.get((0, typeorm_1.getRepositoryToken)(company_entity_1.Company));
    const dcRepo = app.get((0, typeorm_1.getRepositoryToken)(delivery_company_entity_1.DeliveryCompany));
    const truckRepo = app.get((0, typeorm_1.getRepositoryToken)(truck_entity_1.Truck));
    console.log('\n🚛  Seeder Camions Complet (56 camions) — démarrage...\n');
    const transfood = await companyRepo.findOne({ where: { code: 'TF' } });
    if (!transfood) {
        console.error('❌  TransFood (code TF) introuvable. Lance npm run seed:rb-complet en premier.');
        await app.close();
        process.exit(1);
    }
    console.log(`✅  Société logistique : ${transfood.nom.trim()}\n`);
    const companies = [
        {
            nom: 'Maghreb Trans SARL',
            adresse: 'Route de Bizerte km 5, Tunis',
            tel: '+216 71 800 100',
            prefix: 'MT',
            trucks: [
                { matricule: 'MT-001-2401', t: 24, p: 20, type: 'FRIGO' },
                { matricule: 'MT-002-2402', t: 30, p: 0, type: 'CITERNE' },
                { matricule: 'MT-003-2403', t: 20, p: 18, type: 'PALETTE' },
                { matricule: 'MT-004-2404', t: 28, p: 0, type: 'VRAC' },
                { matricule: 'MT-005-2405', t: 18, p: 16, type: 'FRIGO' },
                { matricule: 'MT-006-2406', t: 22, p: 20, type: 'PALETTE' },
                { matricule: 'MT-007-2407', t: 15, p: 12, type: 'FRIGO' },
                { matricule: 'MT-008-2408', t: 26, p: 0, type: 'VRAC' },
            ],
        },
        {
            nom: 'Atlas Logistics TN',
            adresse: 'Zone Industrielle La Charguia, Tunis',
            tel: '+216 71 900 200',
            prefix: 'AL',
            trucks: [
                { matricule: 'AL-001-2401', t: 20, p: 18, type: 'PALETTE' },
                { matricule: 'AL-002-2402', t: 24, p: 20, type: 'FRIGO' },
                { matricule: 'AL-003-2403', t: 32, p: 0, type: 'CITERNE' },
                { matricule: 'AL-004-2404', t: 18, p: 16, type: 'PALETTE' },
                { matricule: 'AL-005-2405', t: 25, p: 0, type: 'VRAC' },
                { matricule: 'AL-006-2406', t: 20, p: 18, type: 'FRIGO' },
                { matricule: 'AL-007-2407', t: 12, p: 10, type: 'PALETTE' },
                { matricule: 'AL-008-2408', t: 28, p: 24, type: 'FRIGO' },
            ],
        },
        {
            nom: 'Sahel Express Transport',
            adresse: 'Route de Sousse km 10, Hammamet',
            tel: '+216 72 500 300',
            prefix: 'SE',
            trucks: [
                { matricule: 'SE-001-2401', t: 22, p: 20, type: 'FRIGO' },
                { matricule: 'SE-002-2402', t: 16, p: 14, type: 'PALETTE' },
                { matricule: 'SE-003-2403', t: 30, p: 0, type: 'VRAC' },
                { matricule: 'SE-004-2404', t: 24, p: 20, type: 'FRIGO' },
                { matricule: 'SE-005-2405', t: 20, p: 0, type: 'CITERNE' },
                { matricule: 'SE-006-2406', t: 18, p: 16, type: 'PALETTE' },
                { matricule: 'SE-007-2407', t: 26, p: 22, type: 'PALETTE' },
                { matricule: 'SE-008-2408', t: 14, p: 12, type: 'FRIGO' },
            ],
        },
        {
            nom: 'Medina Transport SARL',
            adresse: 'Avenue de la République, Sfax',
            tel: '+216 74 300 400',
            prefix: 'MD',
            trucks: [
                { matricule: 'MD-001-2401', t: 28, p: 0, type: 'CITERNE' },
                { matricule: 'MD-002-2402', t: 20, p: 18, type: 'PALETTE' },
                { matricule: 'MD-003-2403', t: 24, p: 20, type: 'FRIGO' },
                { matricule: 'MD-004-2404', t: 18, p: 0, type: 'VRAC' },
                { matricule: 'MD-005-2405', t: 22, p: 20, type: 'FRIGO' },
                { matricule: 'MD-006-2406', t: 30, p: 0, type: 'CITERNE' },
                { matricule: 'MD-007-2407', t: 16, p: 14, type: 'PALETTE' },
                { matricule: 'MD-008-2408', t: 20, p: 18, type: 'FRIGO' },
            ],
        },
        {
            nom: 'Nord Express Tunisie',
            adresse: 'Zone Industrielle, Bizerte',
            tel: '+216 72 200 500',
            prefix: 'NE',
            trucks: [
                { matricule: 'NE-001-2401', t: 24, p: 20, type: 'FRIGO' },
                { matricule: 'NE-002-2402', t: 18, p: 16, type: 'PALETTE' },
                { matricule: 'NE-003-2403', t: 26, p: 0, type: 'VRAC' },
                { matricule: 'NE-004-2404', t: 20, p: 18, type: 'FRIGO' },
                { matricule: 'NE-005-2405', t: 32, p: 0, type: 'CITERNE' },
                { matricule: 'NE-006-2406', t: 22, p: 20, type: 'PALETTE' },
                { matricule: 'NE-007-2407', t: 15, p: 12, type: 'PALETTE' },
                { matricule: 'NE-008-2408', t: 24, p: 20, type: 'FRIGO' },
            ],
        },
        {
            nom: 'Grand Sud Transport',
            adresse: 'Route Nationale 1, Gabès',
            tel: '+216 75 100 600',
            prefix: 'GS',
            trucks: [
                { matricule: 'GS-001-2401', t: 20, p: 18, type: 'PALETTE' },
                { matricule: 'GS-002-2402', t: 28, p: 0, type: 'VRAC' },
                { matricule: 'GS-003-2403', t: 24, p: 20, type: 'FRIGO' },
                { matricule: 'GS-004-2404', t: 30, p: 0, type: 'CITERNE' },
                { matricule: 'GS-005-2405', t: 18, p: 16, type: 'PALETTE' },
                { matricule: 'GS-006-2406', t: 22, p: 20, type: 'FRIGO' },
                { matricule: 'GS-007-2407', t: 26, p: 0, type: 'VRAC' },
                { matricule: 'GS-008-2408', t: 20, p: 18, type: 'PALETTE' },
            ],
        },
        {
            nom: 'Centre Logistique Kairouan',
            adresse: 'Route de Tunis, Kairouan',
            tel: '+216 77 200 700',
            prefix: 'CK',
            trucks: [
                { matricule: 'CK-001-2401', t: 22, p: 20, type: 'FRIGO' },
                { matricule: 'CK-002-2402', t: 24, p: 0, type: 'CITERNE' },
                { matricule: 'CK-003-2403', t: 18, p: 16, type: 'PALETTE' },
                { matricule: 'CK-004-2404', t: 20, p: 18, type: 'FRIGO' },
                { matricule: 'CK-005-2405', t: 26, p: 22, type: 'PALETTE' },
                { matricule: 'CK-006-2406', t: 30, p: 0, type: 'VRAC' },
                { matricule: 'CK-007-2407', t: 16, p: 14, type: 'FRIGO' },
                { matricule: 'CK-008-2408', t: 24, p: 20, type: 'PALETTE' },
            ],
        },
    ];
    let totalTrucks = 0;
    let createdDCs = 0;
    for (const coDef of companies) {
        const dc = await upsertDC(dcRepo, coDef.nom, coDef.adresse, coDef.tel, transfood);
        const isNew = !(await dcRepo.findOne({ where: { nom: coDef.nom } }));
        if (isNew)
            createdDCs++;
        let truckCount = 0;
        for (const td of coDef.trucks) {
            await upsertTruck(truckRepo, td.matricule, td.t, td.p, td.type, dc);
            truckCount++;
        }
        totalTrucks += truckCount;
        console.log(`  🏢  ${coDef.nom.padEnd(30)} → ${truckCount} camions`);
    }
    const grandTotal = await truckRepo.count({ where: { isActive: true } });
    console.log(`\n${'─'.repeat(55)}`);
    console.log(`✅  ${totalTrucks} camion(s) traités, ${grandTotal} actifs au total dans la base`);
    const byType = {};
    const allTrucks = await truckRepo.find({ where: { isActive: true } });
    allTrucks.forEach((t) => { byType[t.type || 'N/A'] = (byType[t.type || 'N/A'] || 0) + 1; });
    console.log('\n   Par type :');
    Object.entries(byType).forEach(([type, n]) => console.log(`     ${type.padEnd(10)} : ${n} camions`));
    console.log();
    await app.close();
}
seed().catch((err) => {
    console.error('❌  Erreur :', err);
    process.exit(1);
});
//# sourceMappingURL=seed-camions-complet.js.map