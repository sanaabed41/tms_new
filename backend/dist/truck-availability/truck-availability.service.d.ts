import { Repository } from 'typeorm';
import { TruckAvailability } from './truck-availability.entity';
import { Truck } from '../trucks/truck.entity';
export declare class TruckAvailabilityService {
    private repo;
    private truckRepo;
    constructor(repo: Repository<TruckAvailability>, truckRepo: Repository<Truck>);
    findByDate(companyId: string, date: string): Promise<TruckAvailability[]>;
    getByDateRange(companyId: string, dateDebut: string, dateFin: string): Promise<TruckAvailability[]>;
}
