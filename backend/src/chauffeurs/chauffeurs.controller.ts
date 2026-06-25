import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ChauffeursService } from './chauffeurs.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Chauffeurs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.LOGISTIC_ADMIN)
@Controller('chauffeurs')
export class ChauffeursController {
  constructor(private readonly service: ChauffeursService) {}

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('deliveryCompanyId') deliveryCompanyId?: string,
  ) {
    if (deliveryCompanyId) return this.service.findByDeliveryCompany(deliveryCompanyId);
    return this.service.findAll(user.companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.LOGISTIC_ADMIN)
  create(@Body() dto: any) { return this.service.create(dto); }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.LOGISTIC_ADMIN)
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Patch(':id/toggle-active')
  @Roles(Role.SUPER_ADMIN, Role.LOGISTIC_ADMIN)
  toggleActive(@Param('id') id: string) { return this.service.toggleActive(id); }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
