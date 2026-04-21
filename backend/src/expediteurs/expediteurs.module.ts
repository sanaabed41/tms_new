import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocieteExpeditrice } from './societe-expeditrice.entity';
import { Filiere } from './filiere.entity';
import { ExpediteursService } from './expediteurs.service';
import { ExpediteursController } from './expediteurs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SocieteExpeditrice, Filiere])],
  providers: [ExpediteursService],
  controllers: [ExpediteursController],
  exports: [ExpediteursService],
})
export class ExpediteursModule {}
