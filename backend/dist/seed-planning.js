"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const typeorm_1 = require("@nestjs/typeorm");
const truck_entity_1 = require("./trucks/truck.entity");
const company_entity_1 = require("./companies/company.entity");
const truck_availability_entity_1 = require("./truck-availability/truck-availability.entity");
const bon_livraison_entity_1 = require("./bons-livraison/bon-livraison.entity");
const bl_status_enum_1 = require("./common/enums/bl-status.enum");
function addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
}
async function seed() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, { logger: ['error'] });
    const truckRepo = app.get((0, typeorm_1.getRepositoryToken)(truck_entity_1.Truck));
    const availRepo = app.get((0, typeorm_1.getRepositoryToken)(truck_availability_entity_1.TruckAvailability));
    const compRepo = app.get((0, typeorm_1.getRepositoryToken)(company_entity_1.Company));
    const blRepo = app.get((0, typeorm_1.getRepositoryToken)(bon_livraison_entity_1.BonLivraison));
    console.log('\n🚛  Seeder Planning — démarrage...\n');
    const company = await compRepo.findOne({ where: { nom: 'TransFood' } });
    if (!company) {
        console.error('❌  Société "TransFood" introuvable. Lance npm run seed en premier.');
        await app.close();
        process.exit(1);
    }
    const trucks = await truckRepo.find({ where: { isActive: true }, relations: ['deliveryCompany'] });
    if (trucks.length === 0) {
        console.error('❌  Aucun camion actif trouvé. Lance npm run seed:rb en premier.');
        await app.close();
        process.exit(1);
    }
    console.log(`✅  ${trucks.length} camion(s) actif(s) trouvé(s)\n`);
    const today = new Date();
    const dates = [0, 1, 2, 3].map((n) => addDays(today, n));
    console.log(`📅  Dates couvertes :`);
    dates.forEach((d) => console.log(`     • ${d}`));
    console.log();
    let created = 0;
    let skipped = 0;
    for (const date of dates) {
        for (const truck of trucks) {
            const existing = await availRepo.findOne({
                where: { truck: { id: truck.id }, date },
            });
            if (existing) {
                skipped++;
                continue;
            }
            await availRepo.save(availRepo.create({ truck, date, company }));
            created++;
        }
    }
    console.log(`✅  Disponibilités : ${created} créée(s), ${skipped} déjà existante(s)\n`);
    const groups = {};
    trucks.forEach((t) => {
        const nom = t.deliveryCompany?.nom || 'Inconnue';
        if (!groups[nom])
            groups[nom] = [];
        groups[nom].push(`${t.matricule} (${t.type || 'Standard'}, ${t.capaciteTonnage}T)`);
    });
    console.log('🚛  Camions disponibles par société :');
    Object.entries(groups).forEach(([nom, mats]) => {
        console.log(`\n   ${nom}`);
        mats.forEach((m) => console.log(`     • ${m}`));
    });
    const validatedBls = await blRepo.find({
        where: { statut: bl_status_enum_1.BlStatus.VALIDATED },
        relations: ['societeExpeditrice', 'filiere'],
    });
    console.log(`\n📄  BL disponibles pour le planning : ${validatedBls.length}`);
    if (validatedBls.length === 0) {
        console.log('   ⚠️   Aucun BL en statut VALIDATED. Lance npm run seed:rb pour en créer.');
    }
    else {
        const byDest = {};
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
//# sourceMappingURL=seed-planning.js.map