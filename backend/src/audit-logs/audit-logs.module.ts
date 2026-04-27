import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './audit-log.entity';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogsController } from './audit-logs.controller';
import { User } from '../users/user.entity';
import { Company } from '../companies/company.entity';
import { BonLivraison } from '../bons-livraison/bon-livraison.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog, User, Company, BonLivraison])],
  providers: [AuditLogsService],
  controllers: [AuditLogsController],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}
