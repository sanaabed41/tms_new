import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoadingPlan } from './loading-plan.entity';
import { BonLivraison } from '../bons-livraison/bon-livraison.entity';
import { Truck } from '../trucks/truck.entity';
import { LoadingPlansService } from './loading-plans.service';
import { LoadingPlansController } from './loading-plans.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LoadingPlan, BonLivraison, Truck])],
  providers: [LoadingPlansService],
  controllers: [LoadingPlansController],
  exports: [LoadingPlansService],
})
export class LoadingPlansModule {}
