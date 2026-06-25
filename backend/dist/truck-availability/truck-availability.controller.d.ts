import { TruckAvailabilityService } from './truck-availability.service';
export declare class TruckAvailabilityController {
    private readonly service;
    constructor(service: TruckAvailabilityService);
    findByDate(user: any, date: string): Promise<import("./truck-availability.entity").TruckAvailability[]>;
    addTruck(user: any, body: {
        truckId: string;
        date: string;
    }): Promise<import("./truck-availability.entity").TruckAvailability>;
    bulkSet(user: any, body: {
        truckIds: string[];
        date: string;
    }): Promise<{
        set: number;
    }>;
    bulkSetRange(user: any, body: {
        truckIds: string[];
        dateDebut: string;
        dateFin: string;
    }): Promise<{
        set: number;
    }>;
    findByDateRange(user: any, dateDebut: string, dateFin: string): Promise<import("./truck-availability.entity").TruckAvailability[]>;
    remove(user: any, id: string): Promise<void>;
}
