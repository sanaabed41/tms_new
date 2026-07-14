import { Truck } from '../trucks/truck.entity';
import { Company } from '../companies/company.entity';
export declare class TruckAvailability {
    id: string;
    date: string;
    statut: string;
    motif: string | null;
    truck: Truck;
    company: Company;
    createdAt: Date;
}
