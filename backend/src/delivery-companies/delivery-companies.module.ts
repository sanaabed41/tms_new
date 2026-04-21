import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryCompany } from './delivery-company.entity';
import { DeliveryCompaniesService } from './delivery-companies.service';
import { DeliveryCompaniesController } from './delivery-companies.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DeliveryCompany])],
  providers: [DeliveryCompaniesService],
  controllers: [DeliveryCompaniesController],
  exports: [DeliveryCompaniesService],
})
export class DeliveryCompaniesModule {}
