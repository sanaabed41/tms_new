import { CompaniesService } from './companies.service';
export declare class CompaniesController {
    private readonly service;
    constructor(service: CompaniesService);
    findAll(): Promise<import("./company.entity").Company[]>;
    findOne(id: string): Promise<import("./company.entity").Company>;
    create(dto: any): Promise<import("./company.entity").Company>;
    update(id: string, dto: any): Promise<import("./company.entity").Company>;
    remove(id: string): Promise<import("./company.entity").Company>;
}
