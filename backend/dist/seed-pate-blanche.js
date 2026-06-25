"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const typeorm_1 = require("@nestjs/typeorm");
const company_entity_1 = require("./companies/company.entity");
const delivery_company_entity_1 = require("./delivery-companies/delivery-company.entity");
const truck_entity_1 = require("./trucks/truck.entity");
const article_entity_1 = require("./articles/article.entity");
const bon_livraison_entity_1 = require("./bons-livraison/bon-livraison.entity");
const bl_article_entity_1 = require("./bons-livraison/bl-article.entity");
const loading_plan_entity_1 = require("./loading-plans/loading-plan.entity");
const societe_expeditrice_entity_1 = require("./expediteurs/societe-expeditrice.entity");
const filiere_entity_1 = require("./expediteurs/filiere.entity");
const bl_status_enum_1 = require("./common/enums/bl-status.enum");
const user_entity_1 = require("./users/user.entity");
const TODAY = new Date().toISOString().split('T')[0];
async function findOrCreate(repo, where, build) {
    const found = await repo.findOne({ where });
    return found ?? repo.save(build());
}
function hhmm(h, m) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
const ARTICLES_DEF = [
    { code: 'AMT-SPG-500', libelle: 'Spaghetti Pâte Blanche 500g', poidsUnitaire: 0.5, unite: 'Colis' },
    { code: 'AMT-MAC-500', libelle: 'Macaroni Pâte Blanche 500g', poidsUnitaire: 0.5, unite: 'Colis' },
    { code: 'AMT-PEN-500', libelle: 'Penne Pâte Blanche 500g', poidsUnitaire: 0.5, unite: 'Colis' },
    { code: 'AMT-FUS-500', libelle: 'Fusilli Pâte Blanche 500g', poidsUnitaire: 0.5, unite: 'Colis' },
    { code: 'AMT-TAG-500', libelle: 'Tagliatelle Pâte Blanche 500g', poidsUnitaire: 0.5, unite: 'Colis' },
    { code: 'AMT-FID-500', libelle: 'Fidée Pâte Blanche 500g', poidsUnitaire: 0.5, unite: 'Colis' },
    { code: 'MCSR-SG-1KG', libelle: 'Semoule Grossière 1 kg', poidsUnitaire: 1.0, unite: 'Sac' },
    { code: 'MCSR-SF-1KG', libelle: 'Semoule Fine 1 kg', poidsUnitaire: 1.0, unite: 'Sac' },
    { code: 'MCSR-SM-5KG', libelle: 'Semoule Moyenne 5 kg', poidsUnitaire: 5.0, unite: 'Sac' },
    { code: 'MCSR-SG-5KG', libelle: 'Semoule Grossière 5 kg', poidsUnitaire: 5.0, unite: 'Sac' },
    { code: 'PW-SPG-500', libelle: 'Spaghetti Warda 500g', poidsUnitaire: 0.5, unite: 'Colis' },
    { code: 'PW-MAC-500', libelle: 'Macaroni Warda 500g', poidsUnitaire: 0.5, unite: 'Colis' },
    { code: 'PW-FID-500', libelle: 'Fidée Warda 500g', poidsUnitaire: 0.5, unite: 'Colis' },
    { code: 'PW-PEN-250', libelle: 'Penne Warda 250g', poidsUnitaire: 0.25, unite: 'Sachet' },
    { code: 'PW-FUS-500', libelle: 'Fusilli Warda 500g', poidsUnitaire: 0.5, unite: 'Colis' },
];
const PLANS = [
    {
        truckIdx: 0, heureArrivee: hhmm(6, 30),
        entryStatus: 'IDLE', loadingStatus: 'WAITING', elapsedSeconds: 0,
        bls: [
            {
                filCode: 'AMT', ordre: 1, dest: 'Sfax',
                client: 'Épicerie Moderne Sfax', adresse: 'Rue Farhat Hached, Sfax 3000',
                type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 12,
                lignes: [
                    { code: 'AMT-SPG-500', qte: 4000 },
                    { code: 'AMT-MAC-500', qte: 4000 },
                    { code: 'AMT-PEN-500', qte: 2000 },
                ],
            },
            {
                filCode: 'MCSR', ordre: 2, dest: 'Sfax',
                client: 'Moulin du Sud Sfax', adresse: 'Zone Industrielle Thyna, Sfax',
                type: bon_livraison_entity_1.TypeChargement.VRAC, palettes: 0,
                notes: 'Vrac — prévoir bâcheétanche',
                lignes: [
                    { code: 'MCSR-SG-1KG', qte: 3000 },
                    { code: 'MCSR-SF-1KG', qte: 3000 },
                ],
            },
        ],
    },
    {
        truckIdx: 1, heureArrivee: hhmm(7, 0),
        entryStatus: 'IDLE', loadingStatus: 'WAITING', elapsedSeconds: 0,
        bls: [
            {
                filCode: 'PW', ordre: 1, dest: 'Sousse',
                client: 'Carrefour Sousse', adresse: 'Route de Tunis km 3, Sousse',
                type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 10,
                lignes: [
                    { code: 'PW-SPG-500', qte: 5000 },
                    { code: 'PW-FID-500', qte: 3000 },
                ],
            },
            {
                filCode: 'AMT', ordre: 2, dest: 'Nabeul',
                client: 'Grossiste Nabeul Centre', adresse: 'Zone Artisanale, Nabeul 8000',
                type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 8,
                lignes: [
                    { code: 'AMT-SPG-500', qte: 4000 },
                    { code: 'AMT-FUS-500', qte: 2000 },
                ],
            },
        ],
    },
    {
        truckIdx: 2, heureArrivee: hhmm(7, 30),
        entryStatus: 'IDLE', loadingStatus: 'WAITING', elapsedSeconds: 0,
        bls: [
            {
                filCode: 'MCSR', ordre: 1, dest: 'Kairouan',
                client: 'Marché Central Kairouan', adresse: 'Souk El Ahad, Kairouan',
                type: bon_livraison_entity_1.TypeChargement.VRAC, palettes: 0,
                lignes: [
                    { code: 'MCSR-SG-5KG', qte: 1000 },
                    { code: 'MCSR-SF-1KG', qte: 4000 },
                ],
            },
            {
                filCode: 'PW', ordre: 2, dest: 'Monastir',
                client: 'Supermarché Médina Monastir', adresse: 'Rue Ibn Khaldoun, Monastir',
                type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 8,
                lignes: [
                    { code: 'PW-MAC-500', qte: 3000 },
                    { code: 'PW-PEN-250', qte: 4000 },
                ],
            },
        ],
    },
    {
        truckIdx: 3, heureArrivee: hhmm(8, 0),
        entryStatus: 'IDLE', loadingStatus: 'WAITING', elapsedSeconds: 0,
        bls: [
            {
                filCode: 'AMT', ordre: 1, dest: 'Bizerte',
                client: 'Grossiste Bizerte Nord', adresse: 'Menzel Bourguiba, Bizerte',
                type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 14,
                lignes: [
                    { code: 'AMT-SPG-500', qte: 6000 },
                    { code: 'AMT-TAG-500', qte: 4000 },
                ],
            },
            {
                filCode: 'PW', ordre: 2, dest: 'Bizerte',
                client: 'Supermarché Bizerte Plage', adresse: 'Route Corniche, Bizerte',
                type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 6,
                lignes: [
                    { code: 'PW-SPG-500', qte: 3000 },
                    { code: 'PW-FUS-500', qte: 2000 },
                ],
            },
            {
                filCode: 'MCSR', ordre: 3, dest: 'Bizerte',
                client: 'Minoterie El Faouzi Bizerte', adresse: 'Zone Industrielle, Bizerte',
                type: bon_livraison_entity_1.TypeChargement.VRAC, palettes: 0,
                notes: 'Citerne — certificat sanitaire obligatoire',
                lignes: [
                    { code: 'MCSR-SM-5KG', qte: 800 },
                    { code: 'MCSR-SG-1KG', qte: 2000 },
                ],
            },
        ],
    },
    {
        truckIdx: 4, heureArrivee: hhmm(8, 30),
        entryStatus: 'IDLE', loadingStatus: 'WAITING', elapsedSeconds: 0,
        bls: [
            {
                filCode: 'MCSR', ordre: 1, dest: 'Gabès',
                client: 'Moulin du Sud Gabès', adresse: 'Zone Industrielle, Gabès',
                type: bon_livraison_entity_1.TypeChargement.CITERNE, palettes: 0,
                notes: 'Transport en citerne pressurisée',
                lignes: [
                    { code: 'MCSR-SG-5KG', qte: 1200 },
                    { code: 'MCSR-SG-1KG', qte: 3000 },
                ],
            },
            {
                filCode: 'AMT', ordre: 2, dest: 'Gabès',
                client: 'Épicerie Sud Gabès', adresse: 'Rue de la Gare, Gabès',
                type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 8,
                lignes: [
                    { code: 'AMT-TAG-500', qte: 4000 },
                    { code: 'AMT-SPG-500', qte: 4000 },
                ],
            },
        ],
    },
    {
        truckIdx: 5, heureArrivee: hhmm(6, 10),
        entryStatus: 'CALLED', loadingStatus: 'WAITING', elapsedSeconds: 0,
        quai: 'Entrée',
        stationsSequence: ['AMT', 'PW'], currentStation: 'AMT', currentStationIdx: 0,
        bls: [
            {
                filCode: 'AMT', ordre: 1, dest: 'Tunis',
                client: 'Hypermarché Géant Lac', adresse: 'Les Berges du Lac, Tunis',
                type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 16,
                lignes: [
                    { code: 'AMT-SPG-500', qte: 6000 },
                    { code: 'AMT-MAC-500', qte: 4000 },
                    { code: 'AMT-FUS-500', qte: 4000 },
                ],
            },
            {
                filCode: 'PW', ordre: 2, dest: 'Tunis',
                client: 'Carrefour Tunis City', adresse: 'Centre Ville, Tunis',
                type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 10,
                lignes: [
                    { code: 'PW-SPG-500', qte: 4000 },
                    { code: 'PW-MAC-500', qte: 3000 },
                    { code: 'PW-FID-500', qte: 2000 },
                ],
            },
        ],
    },
    {
        truckIdx: 6, heureArrivee: hhmm(6, 40),
        entryStatus: 'CALLED', loadingStatus: 'WAITING', elapsedSeconds: 0,
        quai: 'Entrée',
        stationsSequence: ['MCSR', 'PW', 'AMT'], currentStation: 'MCSR', currentStationIdx: 0,
        bls: [
            {
                filCode: 'MCSR', ordre: 1, dest: 'Gafsa',
                client: 'Moulin Gafsa Central', adresse: 'Avenue Bourguiba, Gafsa',
                type: bon_livraison_entity_1.TypeChargement.VRAC, palettes: 0,
                lignes: [
                    { code: 'MCSR-SG-1KG', qte: 5000 },
                    { code: 'MCSR-SF-1KG', qte: 3000 },
                ],
            },
            {
                filCode: 'PW', ordre: 2, dest: 'Gafsa',
                client: 'Épicerie Sahara Gafsa', adresse: 'Route de Tozeur, Gafsa',
                type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 8,
                lignes: [
                    { code: 'PW-SPG-500', qte: 3000 },
                    { code: 'PW-PEN-250', qte: 4000 },
                ],
            },
            {
                filCode: 'AMT', ordre: 3, dest: 'Gafsa',
                client: 'Supermarché Gafsa Central', adresse: 'Rue Principale, Gafsa',
                type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 10,
                lignes: [
                    { code: 'AMT-SPG-500', qte: 5000 },
                    { code: 'AMT-FUS-500', qte: 3000 },
                ],
            },
        ],
    },
    {
        truckIdx: 7, heureArrivee: hhmm(6, 0),
        entryStatus: 'ENTERED', loadingStatus: 'WAITING', elapsedSeconds: 0,
        quai: 'PW-1',
        stationsSequence: ['PW', 'MCSR'], currentStation: 'PW', currentStationIdx: 0,
        bls: [
            {
                filCode: 'PW', ordre: 1, dest: 'Monastir',
                client: 'Épicerie El Mourouj Monastir', adresse: 'Centre Ville, Monastir',
                type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 8,
                lignes: [
                    { code: 'PW-SPG-500', qte: 3000 },
                    { code: 'PW-FUS-500', qte: 3000 },
                ],
            },
            {
                filCode: 'MCSR', ordre: 2, dest: 'Monastir',
                client: 'Minoterie El Amal Monastir', adresse: 'Zone Industrielle Monastir',
                type: bon_livraison_entity_1.TypeChargement.VRAC, palettes: 0,
                lignes: [
                    { code: 'MCSR-SG-5KG', qte: 1000 },
                    { code: 'MCSR-SF-1KG', qte: 2000 },
                ],
            },
        ],
    },
    {
        truckIdx: 8, heureArrivee: hhmm(6, 20),
        entryStatus: 'ENTERED', loadingStatus: 'WAITING', elapsedSeconds: 0,
        quai: 'AMT-1',
        stationsSequence: ['AMT', 'MCSR', 'PW'], currentStation: 'AMT', currentStationIdx: 0,
        bls: [
            {
                filCode: 'AMT', ordre: 1, dest: 'Sousse',
                client: 'Monoprix Hammam-Sousse', adresse: 'Rue du Commerce, Hammam-Sousse',
                type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 14,
                lignes: [
                    { code: 'AMT-SPG-500', qte: 5000 },
                    { code: 'AMT-PEN-500', qte: 5000 },
                    { code: 'AMT-MAC-500', qte: 3000 },
                ],
            },
            {
                filCode: 'MCSR', ordre: 2, dest: 'Sousse',
                client: 'Minoterie El Amal Kalâa', adresse: 'Zone Industrielle, Kalâa Kebira',
                type: bon_livraison_entity_1.TypeChargement.VRAC, palettes: 0,
                lignes: [
                    { code: 'MCSR-SG-5KG', qte: 1200 },
                    { code: 'MCSR-SF-1KG', qte: 2000 },
                ],
            },
            {
                filCode: 'PW', ordre: 3, dest: 'Sousse',
                client: 'Supermarché El Warda Sousse', adresse: 'Boulevard Habib Bourguiba, Sousse',
                type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 6,
                lignes: [
                    { code: 'PW-MAC-500', qte: 2000 },
                    { code: 'PW-FID-500', qte: 2000 },
                ],
            },
        ],
    },
    {
        truckIdx: 9, heureArrivee: hhmm(5, 50),
        entryStatus: 'ENTERED', loadingStatus: 'IN_PROGRESS', elapsedSeconds: 0,
        startedSecsAgo: 1200,
        quai: 'AMT-2',
        stationsSequence: ['AMT', 'PW'], currentStation: 'AMT', currentStationIdx: 0,
        bls: [
            {
                filCode: 'AMT', ordre: 1, dest: 'Tunis',
                client: 'Boulangerie El Hana Tunis', adresse: 'Rue de Marseille, Tunis',
                type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 12,
                lignes: [
                    { code: 'AMT-SPG-500', qte: 5000 },
                    { code: 'AMT-FID-500', qte: 3000 },
                ],
            },
            {
                filCode: 'PW', ordre: 2, dest: 'Ariana',
                client: 'Supermarché Ariana Centre', adresse: 'Avenue Habib Bourguiba, Ariana',
                type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 8,
                lignes: [
                    { code: 'PW-SPG-500', qte: 3000 },
                    { code: 'PW-MAC-500', qte: 2000 },
                ],
            },
        ],
    },
    {
        truckIdx: 10, heureArrivee: hhmm(5, 30),
        entryStatus: 'ENTERED', loadingStatus: 'IN_PROGRESS', elapsedSeconds: 2400,
        startedSecsAgo: 600,
        quai: 'AMT-3',
        stationsSequence: ['MCSR', 'AMT'], currentStation: 'AMT', currentStationIdx: 1,
        bls: [
            {
                filCode: 'MCSR', ordre: 1, dest: 'Ben Arous',
                client: 'Minoterie Ben Arous', adresse: 'Zone Industrielle, Ben Arous',
                type: bon_livraison_entity_1.TypeChargement.VRAC, palettes: 0,
                lignes: [
                    { code: 'MCSR-SG-1KG', qte: 4000 },
                    { code: 'MCSR-SM-5KG', qte: 600 },
                ],
            },
            {
                filCode: 'AMT', ordre: 2, dest: 'Ben Arous',
                client: 'Hypermarché BenArous Mall', adresse: 'Route de Mégrine, Ben Arous',
                type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 16,
                lignes: [
                    { code: 'AMT-SPG-500', qte: 8000 },
                    { code: 'AMT-FUS-500', qte: 4000 },
                ],
            },
        ],
    },
    {
        truckIdx: 11, heureArrivee: hhmm(6, 5),
        entryStatus: 'ENTERED', loadingStatus: 'IN_PROGRESS', elapsedSeconds: 0,
        startedSecsAgo: 900,
        quai: 'PW-2',
        stationsSequence: ['PW', 'MCSR', 'AMT'], currentStation: 'PW', currentStationIdx: 0,
        bls: [
            {
                filCode: 'PW', ordre: 1, dest: 'Zaghouan',
                client: 'Épicerie Zaghouan Ville', adresse: 'Avenue Principale, Zaghouan',
                type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 6,
                lignes: [
                    { code: 'PW-SPG-500', qte: 2000 },
                    { code: 'PW-FID-500', qte: 2000 },
                    { code: 'PW-FUS-500', qte: 2000 },
                ],
            },
            {
                filCode: 'MCSR', ordre: 2, dest: 'Zaghouan',
                client: 'Moulin Zaghouan', adresse: 'Zone Artisanale, Zaghouan',
                type: bon_livraison_entity_1.TypeChargement.VRAC, palettes: 0,
                lignes: [
                    { code: 'MCSR-SG-1KG', qte: 3000 },
                    { code: 'MCSR-SF-1KG', qte: 2000 },
                ],
            },
            {
                filCode: 'AMT', ordre: 3, dest: 'Béja',
                client: 'Supermarché Béja Centre', adresse: 'Avenue Bourguiba, Béja',
                type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 10,
                lignes: [
                    { code: 'AMT-SPG-500', qte: 4000 },
                    { code: 'AMT-PEN-500', qte: 2000 },
                ],
            },
        ],
    },
    {
        truckIdx: 12, heureArrivee: hhmm(5, 45),
        entryStatus: 'ENTERED', loadingStatus: 'PAUSED', elapsedSeconds: 1800,
        quai: 'AMT-4',
        stationsSequence: ['AMT', 'PW'], currentStation: 'AMT', currentStationIdx: 0,
        bls: [
            {
                filCode: 'AMT', ordre: 1, dest: 'Mahdia',
                client: 'Épicerie El Manar Mahdia', adresse: 'Port de Mahdia',
                type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 10,
                lignes: [
                    { code: 'AMT-MAC-500', qte: 5000 },
                    { code: 'AMT-PEN-500', qte: 3000 },
                ],
            },
            {
                filCode: 'PW', ordre: 2, dest: 'Mahdia',
                client: 'Supermarché Mahdia Plage', adresse: 'Route de la Corniche, Mahdia',
                type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 7,
                lignes: [
                    { code: 'PW-MAC-500', qte: 3000 },
                    { code: 'PW-PEN-250', qte: 4000 },
                ],
            },
        ],
    },
    {
        truckIdx: 13, heureArrivee: hhmm(5, 20),
        entryStatus: 'ENTERED', loadingStatus: 'PAUSED', elapsedSeconds: 3000,
        quai: 'PW-3',
        stationsSequence: ['MCSR', 'PW', 'AMT'], currentStation: 'PW', currentStationIdx: 1,
        bls: [
            {
                filCode: 'MCSR', ordre: 1, dest: 'Siliana',
                client: 'Moulin El Amal Siliana', adresse: 'Route Nationale, Siliana',
                type: bon_livraison_entity_1.TypeChargement.CITERNE, palettes: 0,
                notes: 'Citerne — vérifier pression',
                lignes: [
                    { code: 'MCSR-SG-5KG', qte: 1000 },
                    { code: 'MCSR-SF-1KG', qte: 3000 },
                ],
            },
            {
                filCode: 'PW', ordre: 2, dest: 'Siliana',
                client: 'Épicerie Siliana Nord', adresse: 'Avenue Bourguiba, Siliana',
                type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 6,
                lignes: [
                    { code: 'PW-SPG-500', qte: 2500 },
                    { code: 'PW-FID-500', qte: 2000 },
                ],
            },
            {
                filCode: 'AMT', ordre: 3, dest: 'Siliana',
                client: 'Supermarché Siliana Centre', adresse: 'Centre Ville, Siliana',
                type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 9,
                lignes: [
                    { code: 'AMT-SPG-500', qte: 4000 },
                    { code: 'AMT-MAC-500', qte: 3000 },
                ],
            },
        ],
    },
    {
        truckIdx: 14, heureArrivee: hhmm(5, 0),
        entryStatus: 'EXITED', loadingStatus: 'DONE', elapsedSeconds: 5400,
        quai: 'AMT-5',
        stationsSequence: ['AMT', 'MCSR'], currentStation: undefined, currentStationIdx: 2,
        bls: [
            {
                filCode: 'AMT', ordre: 1, dest: 'Jendouba',
                client: 'Épicerie Jendouba Ville', adresse: 'Avenue 7 Novembre, Jendouba',
                type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 12,
                lignes: [
                    { code: 'AMT-SPG-500', qte: 6000 },
                    { code: 'AMT-TAG-500', qte: 3000 },
                ],
            },
            {
                filCode: 'MCSR', ordre: 2, dest: 'Jendouba',
                client: 'Moulin Jendouba', adresse: 'Zone Industrielle, Jendouba',
                type: bon_livraison_entity_1.TypeChargement.VRAC, palettes: 0,
                lignes: [
                    { code: 'MCSR-SG-1KG', qte: 4000 },
                    { code: 'MCSR-SM-5KG', qte: 700 },
                ],
            },
        ],
    },
    {
        truckIdx: 15, heureArrivee: hhmm(4, 30),
        entryStatus: 'EXITED', loadingStatus: 'DONE', elapsedSeconds: 7200,
        quai: 'PW-4',
        stationsSequence: ['PW', 'AMT', 'MCSR'], currentStation: undefined, currentStationIdx: 3,
        bls: [
            {
                filCode: 'PW', ordre: 1, dest: 'Kasserine',
                client: 'Épicerie Kasserine Sud', adresse: 'Route de Sbeitla, Kasserine',
                type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 8,
                lignes: [
                    { code: 'PW-SPG-500', qte: 3000 },
                    { code: 'PW-MAC-500', qte: 2000 },
                    { code: 'PW-FUS-500', qte: 2000 },
                ],
            },
            {
                filCode: 'AMT', ordre: 2, dest: 'Kasserine',
                client: 'Supermarché Kasserine Nord', adresse: 'Avenue Bourguiba, Kasserine',
                type: bon_livraison_entity_1.TypeChargement.PALETTE, palettes: 12,
                lignes: [
                    { code: 'AMT-SPG-500', qte: 5000 },
                    { code: 'AMT-PEN-500', qte: 3000 },
                    { code: 'AMT-FUS-500', qte: 2000 },
                ],
            },
            {
                filCode: 'MCSR', ordre: 3, dest: 'Kasserine',
                client: 'Moulin du Centre Kasserine', adresse: 'Zone Artisanale, Kasserine',
                type: bon_livraison_entity_1.TypeChargement.VRAC, palettes: 0,
                lignes: [
                    { code: 'MCSR-SG-1KG', qte: 3000 },
                    { code: 'MCSR-SF-1KG', qte: 2000 },
                    { code: 'MCSR-SM-5KG', qte: 500 },
                ],
            },
        ],
    },
];
const TRUCKS_DEF = [
    { matricule: 'PB-SFR-001', type: 'Semi-remorque', tonnage: 24, palettes: 33 },
    { matricule: 'PB-SFR-002', type: 'Semi-remorque', tonnage: 22, palettes: 28 },
    { matricule: 'PB-SFR-003', type: 'Semi-remorque', tonnage: 20, palettes: 28 },
    { matricule: 'PB-SFR-004', type: 'Plateau', tonnage: 18, palettes: 24 },
    { matricule: 'PB-SFR-005', type: 'Plateau', tonnage: 15, palettes: 20 },
    { matricule: 'PB-TEX-001', type: 'Citerne farine', tonnage: 32, palettes: 0 },
    { matricule: 'PB-TEX-002', type: 'Citerne farine', tonnage: 28, palettes: 0 },
    { matricule: 'PB-MGT-001', type: 'Fourgon', tonnage: 12, palettes: 16 },
    { matricule: 'PB-MGT-002', type: 'Plateau', tonnage: 18, palettes: 22 },
    { matricule: 'PB-MGT-003', type: 'Fourgon', tonnage: 10, palettes: 14 },
    { matricule: 'PB-MGT-004', type: 'Semi-remorque', tonnage: 22, palettes: 28 },
    { matricule: 'PB-MGT-005', type: 'Plateau', tonnage: 16, palettes: 20 },
    { matricule: 'PB-MGT-006', type: 'Fourgon', tonnage: 12, palettes: 16 },
    { matricule: 'PB-MGT-007', type: 'Semi-remorque', tonnage: 24, palettes: 33 },
    { matricule: 'PB-MGT-008', type: 'Plateau', tonnage: 18, palettes: 24 },
    { matricule: 'PB-MGT-009', type: 'Fourgon', tonnage: 14, palettes: 18 },
];
async function seed() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, { logger: ['error'] });
    const companyRepo = app.get((0, typeorm_1.getRepositoryToken)(company_entity_1.Company));
    const dcRepo = app.get((0, typeorm_1.getRepositoryToken)(delivery_company_entity_1.DeliveryCompany));
    const truckRepo = app.get((0, typeorm_1.getRepositoryToken)(truck_entity_1.Truck));
    const artRepo = app.get((0, typeorm_1.getRepositoryToken)(article_entity_1.Article));
    const seRepo = app.get((0, typeorm_1.getRepositoryToken)(societe_expeditrice_entity_1.SocieteExpeditrice));
    const filRepo = app.get((0, typeorm_1.getRepositoryToken)(filiere_entity_1.Filiere));
    const blRepo = app.get((0, typeorm_1.getRepositoryToken)(bon_livraison_entity_1.BonLivraison));
    const blaRepo = app.get((0, typeorm_1.getRepositoryToken)(bl_article_entity_1.BlArticle));
    const planRepo = app.get((0, typeorm_1.getRepositoryToken)(loading_plan_entity_1.LoadingPlan));
    const userRepo = app.get((0, typeorm_1.getRepositoryToken)(user_entity_1.User));
    console.log(`\n🏭  Seeder Pâte Blanche (AMT | MCSR | PW) — ${TODAY}\n`);
    const company = await companyRepo.findOne({ where: { nom: 'TransFood' } });
    if (!company) {
        console.error('❌  "TransFood" introuvable — lancez npm run seed d\'abord.');
        await app.close();
        process.exit(1);
    }
    console.log(`✅  Société : ${company.nom}`);
    const dcSafrat = await findOrCreate(dcRepo, { nom: 'SAFRAT Transport' }, () => dcRepo.create({ nom: 'SAFRAT Transport', adresse: 'Rue de la Mecque, Sfax 3000', telephone: '+216 74 111 222', company }));
    const dcTunisEx = await findOrCreate(dcRepo, { nom: 'TunisExpress Logistique' }, () => dcRepo.create({ nom: 'TunisExpress Logistique', adresse: 'Avenue Bourguiba, Sousse 4000', telephone: '+216 73 333 444', company }));
    const dcMaghreb = await findOrCreate(dcRepo, { nom: 'Maghreb Transit' }, () => dcRepo.create({ nom: 'Maghreb Transit', adresse: 'Zone Logistique, Tunis 2036', telephone: '+216 71 222 333', company }));
    console.log('✅  3 sociétés de livraison');
    const dcMap = {
        'PB-SFR': dcSafrat,
        'PB-TEX': dcTunisEx,
        'PB-MGT': dcMaghreb,
    };
    const trucks = [];
    for (const t of TRUCKS_DEF) {
        const prefix = t.matricule.split('-').slice(0, 2).join('-');
        const dc = dcMap[prefix] ?? dcMaghreb;
        trucks.push(await findOrCreate(truckRepo, { matricule: t.matricule }, () => truckRepo.create({
            matricule: t.matricule, type: t.type,
            capaciteTonnage: t.tonnage, capacitePalettes: t.palettes,
            isActive: true, deliveryCompany: dc,
        })));
    }
    console.log(`✅  ${trucks.length} camions Pâte Blanche\n`);
    const arts = {};
    for (const a of ARTICLES_DEF) {
        arts[a.code] = await findOrCreate(artRepo, { code: a.code }, () => artRepo.create(a));
    }
    console.log(`✅  ${ARTICLES_DEF.length} articles (AMT + MCSR + PW)\n`);
    const pateBlanche = await findOrCreate(seRepo, { code: 'PB', company: { id: company.id } }, () => seRepo.create({
        nom: 'Pâte Blanche', code: 'PB', couleur: '#e83e8c',
        adresse: 'Zone Industrielle El Agba, Tunis',
        telephone: '+216 71 555 666', company,
    }));
    const filAmt = await findOrCreate(filRepo, { code: 'AMT', societeExpeditrice: { id: pateBlanche.id } }, () => filRepo.create({ nom: 'AMT', code: 'AMT', societeExpeditrice: pateBlanche }));
    const filMcsr = await findOrCreate(filRepo, { code: 'MCSR', societeExpeditrice: { id: pateBlanche.id } }, () => filRepo.create({ nom: 'MCSR', code: 'MCSR', societeExpeditrice: pateBlanche }));
    const filPw = await findOrCreate(filRepo, { code: 'PW', societeExpeditrice: { id: pateBlanche.id } }, () => filRepo.create({ nom: 'Pâte Warda', code: 'PW', societeExpeditrice: pateBlanche }));
    const filMap = { AMT: filAmt, MCSR: filMcsr, PW: filPw };
    console.log('✅  Pâte Blanche (#e83e8c) — filières : AMT | MCSR | PW\n');
    const validator = await userRepo.findOne({ where: { email: 'logistique@tms.com' } }) ?? undefined;
    let blSeq = 5000;
    const nextBlNum = () => `PB-${String(++blSeq).padStart(5, '0')}`;
    console.log('📦  Création des plans :\n');
    const ICONS = {
        IDLE: '⏳', CALLED: '📞', ENTERED: '✅', EXITED: '🏁',
    };
    const STATUS_LABEL = {
        WAITING: 'En attente', IN_PROGRESS: 'En cours', PAUSED: 'En pause', DONE: 'Terminé',
    };
    let created = 0;
    let skipped = 0;
    for (let i = 0; i < PLANS.length; i++) {
        const pd = PLANS[i];
        const truck = trucks[pd.truckIdx];
        const exists = await planRepo
            .createQueryBuilder('p')
            .where('p.truckId = :tid', { tid: truck.id })
            .andWhere('CAST(p.dateLivraison AS date) = :d', { d: TODAY })
            .andWhere('p.reference LIKE :ref', { ref: 'PB-%' })
            .getOne();
        if (exists) {
            console.log(`  ⏭️   Plan ${i + 1} ignoré (déjà existant pour ${truck.matricule})`);
            skipped++;
            continue;
        }
        const createdBLs = [];
        let totalTonnage = 0;
        let totalPalettes = 0;
        for (const blDef of pd.bls) {
            const filiere = filMap[blDef.filCode];
            const tonnage = blDef.lignes.reduce((s, l) => s + (arts[l.code]?.poidsUnitaire ?? 0) * l.qte, 0);
            const numeroBl = nextBlNum();
            const blStatus = (pd.entryStatus === 'IDLE') ? bl_status_enum_1.BlStatus.VALIDATED : bl_status_enum_1.BlStatus.LOADED;
            const bl = (await blRepo.save(blRepo.create({
                numeroBl,
                clientNom: blDef.client,
                clientAdresse: blDef.adresse,
                origine: 'Tunis — El Agba',
                destination: blDef.dest,
                typeChargement: blDef.type,
                tonnageTotal: Math.round(tonnage * 100) / 100,
                nombrePalettes: blDef.palettes,
                statut: blStatus,
                datelivraison: new Date(TODAY),
                ordreChargement: blDef.ordre,
                notes: blDef.notes || '',
                company,
                societeExpeditrice: pateBlanche,
                filiere,
            })));
            for (const l of blDef.lignes) {
                const art = arts[l.code];
                if (!art)
                    continue;
                await blaRepo.save(blaRepo.create({
                    bonLivraison: bl,
                    article: art,
                    quantite: l.qte,
                    poidsTotal: Math.round(art.poidsUnitaire * l.qte * 100) / 100,
                }));
            }
            createdBLs.push(bl);
            totalTonnage += tonnage;
            totalPalettes += blDef.palettes;
        }
        const ref = `PB-${TODAY.replace(/-/g, '')}-${String(i + 1).padStart(3, '0')}`;
        let loadingStartedAt;
        if (pd.loadingStatus === 'IN_PROGRESS' && pd.startedSecsAgo) {
            loadingStartedAt = new Date(Date.now() - pd.startedSecsAgo * 1000);
        }
        const planData = {
            reference: ref,
            dateLivraison: new Date(TODAY),
            tonnageCharge: Math.round(totalTonnage * 100) / 100,
            palettesChargees: totalPalettes,
            isValidated: true,
            heureArrivee: pd.heureArrivee,
            loadingStatus: pd.loadingStatus,
            entryStatus: pd.entryStatus,
            loadingElapsedSeconds: pd.elapsedSeconds,
            loadingStartedAt: loadingStartedAt ?? null,
            quai: pd.quai ?? null,
            truck,
            validatedBy: validator,
        };
        if (pd.stationsSequence) {
            planData.stationsSequence = pd.stationsSequence;
            planData.currentStation = pd.currentStation ?? null;
            planData.currentStationIdx = pd.currentStationIdx ?? 0;
        }
        const plan = (await planRepo.save(planRepo.create(planData)));
        for (const bl of createdBLs) {
            await blRepo.update(bl.id, { loadingPlan: plan });
        }
        const icon = ICONS[pd.entryStatus] ?? '•';
        const slabel = STATUS_LABEL[pd.loadingStatus] ?? pd.loadingStatus;
        const seqStr = pd.stationsSequence ? ` [${pd.stationsSequence.join(' → ')}]` : '';
        const curStr = pd.currentStation ? ` ▶ ${pd.currentStation}` : '';
        const quaiStr = pd.quai ? ` @ ${pd.quai}` : '';
        const elStr = pd.elapsedSeconds > 0 ? ` (${Math.floor(pd.elapsedSeconds / 60)}min)` : '';
        console.log(`  ${icon}  [${pd.heureArrivee}]  ${truck.matricule.padEnd(12)}`
            + `  ${slabel.padEnd(12)}${quaiStr}${seqStr}${curStr}${elStr}`);
        created++;
    }
    console.log('\n' + '─'.repeat(70));
    console.log(`✅  ${created} plan(s) créé(s), ${skipped} ignoré(s) — date : ${TODAY}`);
    console.log('─'.repeat(70));
    console.log('\n  📊  Résumé desétats :');
    console.log('     ⏳  IDLE        × 5  — plans validés, camions non appelés');
    console.log('     📞  CALLED      × 2  — appelés, attente autorisation sécurité');
    console.log('     ✅  ENTERED     × 7  — à l\'intérieur (WAITING/IN_PROGRESS/PAUSED)');
    console.log('     🏁  EXITED      × 2  — chargement terminé, camion sorti');
    console.log('\n  🔗  Connexions :');
    console.log('     logistique@tms.com / Logistique123!  → http://localhost:3000/planning');
    console.log('     magasinier@tms.com / Magasin123!    → http://localhost:3000/magasin');
    console.log('     securite@tms.com   / Securite123!   → http://localhost:3000/securite\n');
    await app.close();
}
seed().catch((err) => {
    console.error('❌', err.message || err);
    process.exit(1);
});
//# sourceMappingURL=seed-pate-blanche.js.map