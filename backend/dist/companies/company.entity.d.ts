import { User } from '../users/user.entity';
import { DeliveryCompany } from '../delivery-companies/delivery-company.entity';
import { BonLivraison } from '../bons-livraison/bon-livraison.entity';
import { CompanyType } from '../common/enums/company-type.enum';
export declare class Company {
    id: string;
    nom: string;
    type: CompanyType;
    adresse: string;
    telephone: string;
    couleur: string;
    code: string;
    isActive: boolean;
    createdAt: Date;
    users: User[];
    deliveryCompanies: DeliveryCompany[];
    bonsLivraison: BonLivraison[];
    logistiqueCompany?: Company | null;
    expediteurClients?: Company[];
}
