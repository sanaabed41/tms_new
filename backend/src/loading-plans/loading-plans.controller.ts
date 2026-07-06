import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseBoolPipe, DefaultValuePipe } from '@nestjs/common';
import { LoadingPlansService } from './loading-plans.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Loading Plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('loading-plans')
export class LoadingPlansController {
  constructor(private readonly service: LoadingPlansService) {}

  @Get()
  @Roles(Role.LOGISTIC_ADMIN, Role.SUPER_ADMIN)
  findAll(@CurrentUser() user: any, @Query('date') date: string) {
    return this.service.findAll(user.companyId, date);
  }

  @Get('history')
  @Roles(Role.LOGISTIC_ADMIN, Role.SUPER_ADMIN, Role.EXPEDITEUR_ADMIN, Role.FILIERE_ADMIN, Role.MAGASINIER, Role.SECURITE)
  getHistory(
    @CurrentUser() user: any,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.service.findHistory(user.companyId, dateFrom, dateTo);
  }

  @Get('magasin')
  @Roles(Role.MAGASINIER, Role.SECURITE, Role.LOGISTIC_ADMIN, Role.SUPER_ADMIN)
  getMagasin(@CurrentUser() user: any, @Query('date') date: string) {
    return this.service.getMagasinPlans(user.companyId, date);
  }

  @Get('quais-libres')
  @Roles(Role.MAGASINIER, Role.LOGISTIC_ADMIN, Role.SUPER_ADMIN)
  getQuaisLibres(@CurrentUser() user: any, @Query('date') date: string) {
    return this.service.getQuaisLibres(user.companyId, date);
  }

  @Get('security')
  @Roles(Role.SECURITE, Role.LOGISTIC_ADMIN, Role.SUPER_ADMIN)
  getSecurity(@CurrentUser() user: any, @Query('date') date: string) {
    return this.service.getSecurityPlans(user.companyId, date);
  }

  @Get('day-report')
  @Roles(Role.MAGASINIER, Role.LOGISTIC_ADMIN, Role.SUPER_ADMIN)
  getDayReport(@CurrentUser() user: any, @Query('date') date: string) {
    return this.service.getDayReport(user.companyId, date);
  }

  @Get(':id')
  @Roles(Role.LOGISTIC_ADMIN, Role.SUPER_ADMIN, Role.MAGASINIER)
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post()
  @Roles(Role.LOGISTIC_ADMIN)
  create(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.create({ ...dto, logistiqueCompanyId: user.companyId });
  }

  @Post(':id/assign-bl')
  @Roles(Role.LOGISTIC_ADMIN)
  assignBl(
    @Param('id') id: string,
    @Body('blId') blId: string,
    @CurrentUser() user: any,
    @Query('force', new DefaultValuePipe(false), ParseBoolPipe) force: boolean,
  ) {
    return this.service.assignBl(id, blId, user.id, force);
  }

  @Post('send-report')
  @Roles(Role.LOGISTIC_ADMIN, Role.SUPER_ADMIN)
  sendReport(
    @CurrentUser() user: any,
    @Query('date') date: string,
    @Body('companyNom') companyNom: string,
  ) {
    return this.service.sendReport(user.companyId, date, companyNom);
  }

  @Put('validate-all')
  @Roles(Role.LOGISTIC_ADMIN)
  validateAll(@CurrentUser() user: any, @Query('date') date: string, @Body('signature') signature?: string) {
    return this.service.validateAll(user.companyId, date, user.id, signature);
  }

  @Delete(':id/remove-bl/:blId')
  @Roles(Role.LOGISTIC_ADMIN)
  removeBl(@Param('id') id: string, @Param('blId') blId: string) {
    return this.service.removeBl(id, blId);
  }

  @Put(':id/validate')
  @Roles(Role.LOGISTIC_ADMIN)
  validate(@Param('id') id: string, @CurrentUser() user: any, @Body('signature') signature?: string) {
    return this.service.validate(id, user.id, signature);
  }

  @Put(':id/heure-arrivee')
  @Roles(Role.LOGISTIC_ADMIN, Role.SUPER_ADMIN)
  setArrivalTime(@Param('id') id: string, @Body('heureArrivee') heureArrivee: string) {
    return this.service.setArrivalTime(id, heureArrivee);
  }

  @Put(':id/next-station')
  @Roles(Role.MAGASINIER, Role.LOGISTIC_ADMIN)
  nextStation(@Param('id') id: string) {
    return this.service.nextStation(id);
  }

  @Put(':id/loading-action')
  @Roles(Role.MAGASINIER, Role.LOGISTIC_ADMIN)
  loadingAction(
    @Param('id') id: string,
    @Body('action') action: 'START' | 'PAUSE' | 'DONE',
  ) {
    return this.service.loadingAction(id, action);
  }

  @Put(':id/entry-action')
  @Roles(Role.MAGASINIER, Role.LOGISTIC_ADMIN)
  entryAction(
    @Param('id') id: string,
    @Body('action') action: 'CALL' | 'ENTER' | 'EXIT' | 'UNENTER',
    @Body('quai') quai?: string,
  ) {
    return this.service.entryAction(id, action, quai);
  }

  @Put(':id/reorder-bls')
  @Roles(Role.LOGISTIC_ADMIN)
  reorderBls(@Param('id') id: string, @Body('blIds') blIds: string[]) {
    return this.service.reorderBls(id, blIds ?? []);
  }

  @Delete(':id')
  @Roles(Role.LOGISTIC_ADMIN)
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
