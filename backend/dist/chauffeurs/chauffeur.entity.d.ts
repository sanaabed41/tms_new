import { DeliveryCompany } from '../delivery-companies/delivery-company.entity';
export declare class Chauffeur {
    id: string;
    nom: string;
    prenom: string;
    telephone: string;
    cin: string;
    permis: string;
    isActive: boolean;
    createdAt: Date;
    deliveryCompany: DeliveryCompany;
}
