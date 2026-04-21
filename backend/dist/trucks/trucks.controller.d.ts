import { TrucksService } from './trucks.service';
export declare class TrucksController {
    private readonly service;
    constructor(service: TrucksService);
    findAll(dcId: string): Promise<import("./truck.entity").Truck[]>;
    findOne(id: string): Promise<import("./truck.entity").Truck>;
    create(dto: any): Promise<import("./truck.entity").Truck[]>;
    update(id: string, dto: any): Promise<import("./truck.entity").Truck>;
    remove(id: string): Promise<import("./truck.entity").Truck>;
}
