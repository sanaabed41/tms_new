import { Company } from '../companies/company.entity';
import { SocieteExpeditrice } from '../expediteurs/societe-expeditrice.entity';
import { Filiere } from '../expediteurs/filiere.entity';
export declare class Quai {
    id: string;
    nom: string;
    isActive: boolean;
    company: Company | null;
    societeExpeditrice: SocieteExpeditrice | null;
    filiere: Filiere | null;
}
