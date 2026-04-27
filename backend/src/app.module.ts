import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { UsersModule } from './users/users.module';
import { DeliveryCompaniesModule } from './delivery-companies/delivery-companies.module';
import { TrucksModule } from './trucks/trucks.module';
import { ArticlesModule } from './articles/articles.module';
import { BonsLivraisonModule } from './bons-livraison/bons-livraison.module';
import { LoadingPlansModule } from './loading-plans/loading-plans.module';
import { InvitationsModule } from './invitations/invitations.module';
import { MailModule } from './mail/mail.module';
import { ExpediteursModule } from './expediteurs/expediteurs.module';
import { TruckAvailabilityModule } from './truck-availability/truck-availability.module';
import { ErpModule } from './erp/erp.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: +config.get<number>('DB_PORT')!,
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        logging: false,
      }),
    }),
    MailModule,
    AuthModule,
    CompaniesModule,
    UsersModule,
    DeliveryCompaniesModule,
    TrucksModule,
    ArticlesModule,
    BonsLivraisonModule,
    LoadingPlansModule,
    InvitationsModule,
    ExpediteursModule,
    TruckAvailabilityModule,
    ErpModule,
    AuditLogsModule,
  ],
})
export class AppModule {}
