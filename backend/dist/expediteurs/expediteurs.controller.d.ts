import { ExpediteursService } from './expediteurs.service';
export declare class ExpediteursController {
    private readonly service;
    constructor(service: ExpediteursService);
    findAll(user: any): Promise<import("./societe-expeditrice.entity").SocieteExpeditrice[]>;
    findOne(id: string): Promise<import("./societe-expeditrice.entity").SocieteExpeditrice>;
    create(dto: any, user: any): Promise<import("./societe-expeditrice.entity").SocieteExpeditrice[]>;
    update(id: string, dto: any): Promise<import("./societe-expeditrice.entity").SocieteExpeditrice>;
    remove(id: string): Promise<import("typeorm").DeleteResult>;
    createFiliere(id: string, dto: any): Promise<import("./filiere.entity").Filiere[]>;
    updateFiliere(filiereId: string, dto: any): Promise<import("./filiere.entity").Filiere | null>;
    removeFiliere(filiereId: string): Promise<import("typeorm").DeleteResult>;
}
