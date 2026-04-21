import { Company } from '../companies/company.entity';
import { BlArticle } from './bl-article.entity';
import { LoadingPlan } from '../loading-plans/loading-plan.entity';
import { BlStatus } from '../common/enums/bl-status.enum';
import { SocieteExpeditrice } from '../expediteurs/societe-expeditrice.entity';
import { Filiere } from '../expediteurs/filiere.entity';
export declare enum TypeChargement {
    VRAC = "VRAC",
    PALETTE = "PALETTE",
    FRIGO = "FRIGO",
    CITERNE = "CITERNE"
}
export declare class BonLivraison {
    id: string;
    numeroBl: string;
    clientNom: string;
    clientAdresse: string;
    origine: string;
    destination: string;
    typeChargement: TypeChargement;
    tonnageTotal: number;
    nombrePalettes: number;
    statut: BlStatus;
    datelivraison: Date;
    erpReference: string;
    notes: string;
    createdAt: Date;
    company: Company;
    societeExpeditrice: SocieteExpeditrice | null;
    filiere: Filiere | null;
    blArticles: BlArticle[];
    loadingPlan: LoadingPlan;
}
