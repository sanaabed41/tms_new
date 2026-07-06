import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TransportPortalService } from './transport-portal.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('transport-portal')
export class TransportPortalController {
  constructor(private readonly service: TransportPortalService) {}

  // ── Portail TRANSPORT_ADMIN ──────────────────────────────────────────────

  @Get('fleet')
  @Roles(Role.TRANSPORT_ADMIN)
  getMyFleet(@CurrentUser() user: any) {
    if (!user.deliveryCompanyId) return [];
    return this.service.getMyFleet(user.deliveryCompanyId);
  }

  @Post('trucks')
  @Roles(Role.TRANSPORT_ADMIN)
  createTruck(@CurrentUser() user: any, @Body() dto: any) {
    if (!user.deliveryCompanyId) return { error: 'No delivery company assigned' };
    return this.service.createTruck(dto, user.deliveryCompanyId, user.companyId, user.sub);
  }

  @Put('trucks/:id')
  @Roles(Role.TRANSPORT_ADMIN)
  updateTruck(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.service.updateTruck(id, dto, user.deliveryCompanyId, user.companyId, user.sub);
  }

  @Delete('trucks/:id')
  @Roles(Role.TRANSPORT_ADMIN)
  removeTruck(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.removeTruck(id, user.deliveryCompanyId);
  }

  @Get('rapport')
  @Roles(Role.TRANSPORT_ADMIN)
  getRapport(@CurrentUser() user: any, @Query('date') date: string) {
    if (!user.deliveryCompanyId) return [];
    return this.service.getRapport(user.deliveryCompanyId, date);
  }

  // ── Vue LOGISTIC_ADMIN : déclarations actives des transporteurs ──────────

  @Get('declarations')
  @Roles(Role.LOGISTIC_ADMIN, Role.SUPER_ADMIN)
  getDeclarations(
    @CurrentUser() user: any,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.service.getDeclarationsForLogistique(user.companyId, dateFrom, dateTo);
  }
}
