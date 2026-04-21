import { BonsLivraisonService } from './bons-livraison.service';
import { BlStatus } from '../common/enums/bl-status.enum';
export declare class BonsLivraisonController {
    private readonly service;
    constructor(service: BonsLivraisonService);
    findAll(user: any, statut: BlStatus): Promise<import("./bon-livraison.entity").BonLivraison[]>;
    findAvailable(user: any): Promise<import("./bon-livraison.entity").BonLivraison[]>;
    findOne(id: string): Promise<import("./bon-livraison.entity").BonLivraison>;
    create(dto: any, user: any): Promise<import("./bon-livraison.entity").BonLivraison>;
    update(id: string, dto: any): Promise<import("./bon-livraison.entity").BonLivraison>;
    remove(id: string): Promise<import("./bon-livraison.entity").BonLivraison>;
}
