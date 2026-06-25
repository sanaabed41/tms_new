import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chauffeur } from './chauffeur.entity';
import { ChauffeursService } from './chauffeurs.service';
import { ChauffeursController } from './chauffeurs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Chauffeur])],
  providers: [ChauffeursService],
  controllers: [ChauffeursController],
  exports: [ChauffeursService],
})
export class ChauffeursModule {}
