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
    remove(user: any, id: string): Promise<void>;
}
