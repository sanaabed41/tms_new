import { CompaniesService } from './companies.service';
import { CompanyType } from '../common/enums/company-type.enum';
export declare class CompaniesController {
    private readonly service;
    constructor(service: CompaniesService);
    findAll(type?: CompanyType): Promise<import("./company.entity").Company[]>;
    findOne(id: string): Promise<import("./company.entity").Company>;
    create(dto: any): Promise<import("./company.entity").Company>;
    update(id: string, dto: any): Promise<import("./company.entity").Company>;
    remove(id: string): Promise<import("./company.entity").Company>;
    findByLogistique(logistiqueId: string): Promise<import("./company.entity").Company[]>;
    setLogistiqueCompany(expediteurId: string, logistiqueId: string | null): Promise<import("./company.entity").Company>;
}
