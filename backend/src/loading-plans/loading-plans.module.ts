import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoadingPlan } from './loading-plan.entity';
import { BonLivraison } from '../bons-livraison/bon-livraison.entity';
import { Truck } from '../trucks/truck.entity';
import { Quai } from '../quais/quai.entity';
import { User } from '../users/user.entity';
import { LoadingPlansService } from './loading-plans.service';
import { LoadingPlansController } from './loading-plans.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LoadingPlan, BonLivraison, Truck, Quai, User])],
  providers: [LoadingPlansService],
  controllers: [LoadingPlansController],
  exports: [LoadingPlansService],
})
export class LoadingPlansModule {}
