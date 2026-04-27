import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { AuditLogsService } from './audit-logs.service';
import { AuditLog } from './audit-log.entity';
import { User } from '../users/user.entity';
import { Company } from '../companies/company.entity';
import { BonLivraison } from '../bons-livraison/bon-livraison.entity';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('admin')
export class AuditLogsController {
  constructor(
    private readonly service: AuditLogsService,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Company) private companyRepo: Repository<Company>,
    @InjectRepository(BonLivraison) private blRepo: Repository<BonLivraison>,
    @InjectRepository(AuditLog) private logRepo: Repository<AuditLog>,
  ) {}

  @Get('audit-logs')
  findAll(
    @Query('companyId') companyId?: string,
    @Query('action') action?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll({ companyId, action, fromDate, toDate, search });
  }

  @Get('stats')
  async getStats() {
    const [
      totalCompanies,
      activeCompanies,
      totalUsers,
      activeUsers,
      totalBls,
    ] = await Promise.all([
      this.companyRepo.count(),
      this.companyRepo.count({ where: { isActive: true } }),
      this.userRepo.count(),
      this.userRepo.count({ where: { isActive: true } }),
      this.blRepo.count(),
    ]);

    const recentLogs = await this.service.findAll({ limit: 20 });

    // Logins today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const loginsToday = await this.logRepo.count({
      where: {
        action: 'LOGIN_SUCCESS',
        createdAt: MoreThanOrEqual(todayStart),
      },
    });

    // Logins this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const loginsWeek = await this.logRepo
      .createQueryBuilder('l')
      .where('l.action = :a', { a: 'LOGIN_SUCCESS' })
      .andWhere('l.createdAt >= :w', { w: weekStart })
      .getCount();

    return {
      companies: { total: totalCompanies, active: activeCompanies, inactive: totalCompanies - activeCompanies },
      users: { total: totalUsers, active: activeUsers, inactive: totalUsers - activeUsers },
      bls: { total: totalBls },
      logins: { today: loginsToday, week: loginsWeek },
      recentLogs,
    };
  }
}
