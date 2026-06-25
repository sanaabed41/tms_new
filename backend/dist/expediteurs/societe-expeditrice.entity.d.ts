import { Company } from '../companies/company.entity';
import { Filiere } from './filiere.entity';
export declare class SocieteExpeditrice {
    id: string;
    nom: string;
    code: string;
    couleur: string;
    adresse: string;
    telephone: string;
    createdAt: Date;
    company: Company | null;
    expediteurCompany: Company | null;
    filieres: Filiere[];
}
