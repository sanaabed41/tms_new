import { ChauffeursService } from './chauffeurs.service';
export declare class ChauffeursController {
    private readonly service;
    constructor(service: ChauffeursService);
    findAll(user: any, deliveryCompanyId?: string): Promise<import("./chauffeur.entity").Chauffeur[]>;
    findOne(id: string): Promise<import("./chauffeur.entity").Chauffeur>;
    create(dto: any): Promise<import("./chauffeur.entity").Chauffeur>;
    update(id: string, dto: any): Promise<import("./chauffeur.entity").Chauffeur>;
    toggleActive(id: string): Promise<import("./chauffeur.entity").Chauffeur>;
    remove(id: string): Promise<import("typeorm").DeleteResult>;
}
