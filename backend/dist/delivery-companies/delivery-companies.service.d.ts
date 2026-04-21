import { Repository } from 'typeorm';
import { DeliveryCompany } from './delivery-company.entity';
export declare class DeliveryCompaniesService {
    private repo;
    constructor(repo: Repository<DeliveryCompany>);
    findAll(companyId: string): Promise<DeliveryCompany[]>;
    findOne(id: string): Promise<DeliveryCompany>;
    create(dto: any, companyId: string): Promise<DeliveryCompany[]>;
    update(id: string, dto: any): Promise<DeliveryCompany>;
    remove(id: string): Promise<DeliveryCompany>;
}
