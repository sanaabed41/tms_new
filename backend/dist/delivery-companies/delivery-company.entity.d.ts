import { Company } from '../companies/company.entity';
import { Truck } from '../trucks/truck.entity';
export declare class DeliveryCompany {
    id: string;
    nom: string;
    adresse: string;
    telephone: string;
    isActive: boolean;
    createdAt: Date;
    company: Company;
    camions: Truck[];
}
