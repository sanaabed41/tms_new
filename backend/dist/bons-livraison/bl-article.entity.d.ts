import { BonLivraison } from './bon-livraison.entity';
import { Article } from '../articles/article.entity';
export declare class BlArticle {
    id: string;
    bonLivraison: BonLivraison;
    article: Article;
    quantite: number;
    poidsTotal: number;
}
