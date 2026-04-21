import { Repository } from 'typeorm';
import { SocieteExpeditrice } from './societe-expeditrice.entity';
import { Filiere } from './filiere.entity';
export declare class ExpediteursService {
    private societeRepo;
    private filiereRepo;
    constructor(societeRepo: Repository<SocieteExpeditrice>, filiereRepo: Repository<Filiere>);
    findAll(companyId: string): Promise<SocieteExpeditrice[]>;
    findOne(id: string): Promise<SocieteExpeditrice>;
    create(dto: any, companyId: string): Promise<SocieteExpeditrice[]>;
    update(id: string, dto: any): Promise<SocieteExpeditrice>;
    remove(id: string): Promise<import("typeorm").DeleteResult>;
    createFiliere(societeId: string, dto: any): Promise<Filiere[]>;
    updateFiliere(filiereId: string, dto: any): Promise<Filiere | null>;
    removeFiliere(filiereId: string): Promise<import("typeorm").DeleteResult>;
}
