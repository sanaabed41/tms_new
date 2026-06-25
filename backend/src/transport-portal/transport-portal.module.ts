import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransportPortalController } from './transport-portal.controller';
import { TransportPortalService } from './transport-portal.service';
import { TransportDeclaration } from './transport-declaration.entity';
import { Truck } from '../trucks/truck.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TransportDeclaration, Truck])],
  controllers: [TransportPortalController],
  providers: [TransportPortalService],
})
export class TransportPortalModule {}
