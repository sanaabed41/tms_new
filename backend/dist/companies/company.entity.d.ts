import { User } from '../users/user.entity';
import { DeliveryCompany } from '../delivery-companies/delivery-company.entity';
import { BonLivraison } from '../bons-livraison/bon-livraison.entity';
export declare class Company {
    id: string;
    nom: string;
    adresse: string;
    telephone: string;
    isActive: boolean;
    createdAt: Date;
    users: User[];
    deliveryCompanies: DeliveryCompany[];
    bonsLivraison: BonLivraison[];
}
