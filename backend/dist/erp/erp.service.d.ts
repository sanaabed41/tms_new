import { Repository } from 'typeorm';
import { Article } from '../articles/article.entity';
import { BonLivraison } from '../bons-livraison/bon-livraison.entity';
import { BlArticle } from '../bons-livraison/bl-article.entity';
export declare class ErpService {
    private artRepo;
    private blRepo;
    private blaRepo;
    constructor(artRepo: Repository<Article>, blRepo: Repository<BonLivraison>, blaRepo: Repository<BlArticle>);
    upsertArticles(articles: {
        code: string;
        libelle: string;
        poidsUnitaire: number;
        unite?: string;
    }[]): Promise<{
        code: string;
        action: "created" | "updated";
    }[]>;
    upsertBons(companyId: string, bons: {
        erpReference: string;
        numeroBl: string;
        clientNom: string;
        clientAdresse?: string;
        origine?: string;
        destination?: string;
        typeChargement?: string;
        tonnageTotal: number;
        nombrePalettes?: number;
        datelivraison?: string;
        notes?: string;
        articles?: {
            code: string;
            quantite: number;
        }[];
    }[]): Promise<{
        processed: number;
        results: {
            erpReference: string;
            numeroBl: string;
            action: "created" | "updated" | "skipped";
        }[];
    }>;
    private syncArticles;
}
