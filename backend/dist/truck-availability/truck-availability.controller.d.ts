import { TruckAvailabilityService } from './truck-availability.service';
export declare class TruckAvailabilityController {
    private readonly service;
    constructor(service: TruckAvailabilityService);
    findByDate(user: any, date: string): Promise<import("./truck-availability.entity").TruckAvailability[]>;
    findByDateRange(user: any, dateDebut: string, dateFin: string): Promise<import("./truck-availability.entity").TruckAvailability[]>;
}
