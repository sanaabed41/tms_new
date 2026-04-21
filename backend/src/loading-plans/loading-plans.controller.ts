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
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  findAll(@CurrentUser() user: any, @Query('date') date: string) {
    return this.service.findAll(user.companyId, date);
  }

  @Get(':id')
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post()
  @Roles(Role.COMPANY_ADMIN)
  create(@Body() dto: any) { return this.service.create(dto); }

  @Post(':id/assign-bl')
  @Roles(Role.COMPANY_ADMIN)
  assignBl(
    @Param('id') id: string,
    @Body('blId') blId: string,
    @CurrentUser() user: any,
    @Query('force', new DefaultValuePipe(false), ParseBoolPipe) force: boolean,
  ) {
    return this.service.assignBl(id, blId, user.id, force);
  }

  @Put('validate-all')
  @Roles(Role.COMPANY_ADMIN)
  validateAll(@CurrentUser() user: any, @Query('date') date: string) {
    return this.service.validateAll(user.companyId, date, user.id);
  }

  @Delete(':id/remove-bl/:blId')
  @Roles(Role.COMPANY_ADMIN)
  removeBl(@Param('id') id: string, @Param('blId') blId: string) {
    return this.service.removeBl(id, blId);
  }

  @Put(':id/validate')
  @Roles(Role.COMPANY_ADMIN)
  validate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.validate(id, user.id);
  }

  @Delete(':id')
  @Roles(Role.COMPANY_ADMIN)
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
