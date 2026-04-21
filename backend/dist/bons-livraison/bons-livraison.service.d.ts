import { Repository } from 'typeorm';
import { BonLivraison } from './bon-livraison.entity';
import { BlArticle } from './bl-article.entity';
import { BlStatus } from '../common/enums/bl-status.enum';
export declare class BonsLivraisonService {
    private repo;
    private blArticleRepo;
    constructor(repo: Repository<BonLivraison>, blArticleRepo: Repository<BlArticle>);
    findAll(companyId: string, statut?: BlStatus): Promise<BonLivraison[]>;
    findAvailable(companyId: string): Promise<BonLivraison[]>;
    findOne(id: string): Promise<BonLivraison>;
    create(dto: any, companyId: string): Promise<BonLivraison>;
    update(id: string, dto: any): Promise<BonLivraison>;
    remove(id: string): Promise<BonLivraison>;
}
