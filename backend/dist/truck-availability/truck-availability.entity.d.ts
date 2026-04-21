import { Truck } from '../trucks/truck.entity';
import { Company } from '../companies/company.entity';
export declare class TruckAvailability {
    id: string;
    date: string;
    truck: Truck;
    company: Company;
    createdAt: Date;
}
