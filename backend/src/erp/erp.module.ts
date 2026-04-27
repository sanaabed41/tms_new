import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from '../articles/article.entity';
import { BonLivraison } from '../bons-livraison/bon-livraison.entity';
import { BlArticle } from '../bons-livraison/bl-article.entity';
import { ErpService } from './erp.service';
import { ErpController } from './erp.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Article, BonLivraison, BlArticle])],
  providers: [ErpService],
  controllers: [ErpController],
})
export class ErpModule {}
