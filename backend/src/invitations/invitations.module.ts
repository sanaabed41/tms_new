import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invitation } from './invitation.entity';
import { User } from '../users/user.entity';
import { Filiere } from '../expediteurs/filiere.entity';
import { DeliveryCompany } from '../delivery-companies/delivery-company.entity';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Invitation, User, Filiere, DeliveryCompany])],
  providers: [InvitationsService],
  controllers: [InvitationsController],
  exports: [InvitationsService],
})
export class InvitationsModule {}
