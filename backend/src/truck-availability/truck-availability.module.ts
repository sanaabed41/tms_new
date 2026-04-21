import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TruckAvailability } from './truck-availability.entity';
import { Truck } from '../trucks/truck.entity';
import { TruckAvailabilityService } from './truck-availability.service';
import { TruckAvailabilityController } from './truck-availability.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TruckAvailability, Truck])],
  providers: [TruckAvailabilityService],
  controllers: [TruckAvailabilityController],
})
export class TruckAvailabilityModule {}
