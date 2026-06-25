"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const typeorm_1 = require("@nestjs/typeorm");
const users_service_1 = require("./users/users.service");
const company_entity_1 = require("./companies/company.entity");
const role_enum_1 = require("./common/enums/role.enum");
async function seed() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, { logger: ['error'] });
    const usersService = app.get(users_service_1.UsersService);
    const companyRepo = app.get((0, typeorm_1.getRepositoryToken)(company_entity_1.Company));
    console.log('\n🏭  Seeder Magasinier — démarrage...\n');
    const company = await companyRepo.findOne({ where: { nom: 'TransFood' } });
    if (!company) {
        console.error('❌  Société "TransFood" introuvable. Lance npm run seed en premier.');
        await app.close();
        process.exit(1);
    }
    console.log(`✅  Société trouvée : ${company.nom}`);
    const existing = await usersService.findByEmail('magasinier@tms.com');
    if (existing) {
        console.log('ℹ️   Compte magasinier@tms.com existe déjà — ignoré.');
        await app.close();
        return;
    }
    await usersService.create({
        nom: 'Haddad',
        prenom: 'Youssef',
        email: 'magasinier@tms.com',
        password: 'Magasin123!',
        role: role_enum_1.Role.MAGASINIER,
        companyId: company.id,
        isActive: true,
    }, { role: role_enum_1.Role.SUPER_ADMIN, company: { id: company.id } });
    console.log('✅  Magasinier créé :');
    console.log('    Email    : magasinier@tms.com');
    console.log('    Password : Magasin123!');
    console.log('    Société  : TransFood\n');
    await app.close();
}
seed().catch((err) => {
    console.error('❌  Erreur :', err);
    process.exit(1);
});
//# sourceMappingURL=seed-magasinier.js.map