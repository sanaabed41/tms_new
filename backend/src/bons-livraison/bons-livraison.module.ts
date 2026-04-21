import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BonLivraison } from './bon-livraison.entity';
import { BlArticle } from './bl-article.entity';
import { BonsLivraisonService } from './bons-livraison.service';
import { BonsLivraisonController } from './bons-livraison.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BonLivraison, BlArticle])],
  providers: [BonsLivraisonService],
  controllers: [BonsLivraisonController],
  exports: [BonsLivraisonService],
})
export class BonsLivraisonModule {}
