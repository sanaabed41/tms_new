import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocieteExpeditrice } from '../expediteurs/societe-expeditrice.entity';
import { Filiere } from '../expediteurs/filiere.entity';
import { BonLivraison } from '../bons-livraison/bon-livraison.entity';
import { User } from '../users/user.entity';
import { Quai } from '../quais/quai.entity';
import { LoadingPlan } from '../loading-plans/loading-plan.entity';
import { Company } from '../companies/company.entity';
import { Invitation } from '../invitations/invitation.entity';
import { ExpediteursPortalService } from './expediteur-portal.service';
import { ExpediteursPortalController } from './expediteur-portal.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SocieteExpeditrice, Filiere, BonLivraison, User, Quai, LoadingPlan, Company, Invitation])],
  providers: [ExpediteursPortalService],
  controllers: [ExpediteursPortalController],
})
export class ExpediteursPortalModule {}
