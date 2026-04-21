import { Repository } from 'typeorm';
import { Truck } from './truck.entity';
export declare class TrucksService {
    private repo;
    constructor(repo: Repository<Truck>);
    findAll(deliveryCompanyId?: string): Promise<Truck[]>;
    findOne(id: string): Promise<Truck>;
    create(dto: any): Promise<Truck[]>;
    update(id: string, dto: any): Promise<Truck>;
    remove(id: string): Promise<Truck>;
}
