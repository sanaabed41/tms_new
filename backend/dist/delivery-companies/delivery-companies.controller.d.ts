import { DeliveryCompaniesService } from './delivery-companies.service';
export declare class DeliveryCompaniesController {
    private readonly service;
    constructor(service: DeliveryCompaniesService);
    findAll(user: any): Promise<import("./delivery-company.entity").DeliveryCompany[]>;
    findOne(id: string): Promise<import("./delivery-company.entity").DeliveryCompany>;
    create(dto: any, user: any): Promise<import("./delivery-company.entity").DeliveryCompany[]>;
    update(id: string, dto: any): Promise<import("./delivery-company.entity").DeliveryCompany>;
    remove(id: string): Promise<import("./delivery-company.entity").DeliveryCompany>;
}
