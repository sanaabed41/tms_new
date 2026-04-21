import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { BonLivraison } from './bon-livraison.entity';
import { Article } from '../articles/article.entity';

@Entity('bl_articles')
export class BlArticle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => BonLivraison, (bl) => bl.blArticles, { onDelete: 'CASCADE' })
  bonLivraison: BonLivraison;

  @ManyToOne(() => Article, { eager: true })
  article: Article;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantite: number;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  poidsTotal: number;
}
