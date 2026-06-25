import { Repository } from 'typeorm';
import { Chauffeur } from './chauffeur.entity';
export declare class ChauffeursService {
    private repo;
    constructor(repo: Repository<Chauffeur>);
    findAll(companyId: string): Promise<Chauffeur[]>;
    findByDeliveryCompany(deliveryCompanyId: string): Promise<Chauffeur[]>;
    findOne(id: string): Promise<Chauffeur>;
    create(dto: any): Promise<Chauffeur>;
    update(id: string, dto: any): Promise<Chauffeur>;
    toggleActive(id: string): Promise<Chauffeur>;
    remove(id: string): Promise<import("typeorm").DeleteResult>;
}
