import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransportPortalController } from './transport-portal.controller';
import { TransportPortalService } from './transport-portal.service';
import { TransportDeclaration } from './transport-declaration.entity';
import { Truck } from '../trucks/truck.entity';
import { LoadingPlan } from '../loading-plans/loading-plan.entity';
import { TruckAvailability } from '../truck-availability/truck-availability.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TransportDeclaration, Truck, LoadingPlan, TruckAvailability])],
  controllers: [TransportPortalController],
  providers: [TransportPortalService],
})
export class TransportPortalModule {}
