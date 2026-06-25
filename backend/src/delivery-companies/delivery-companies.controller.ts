import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { DeliveryCompaniesService } from './delivery-companies.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Delivery Companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('delivery-companies')
export class DeliveryCompaniesController {
  constructor(private readonly service: DeliveryCompaniesService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.LOGISTIC_ADMIN)
  findAll(@CurrentUser() user: any) { return this.service.findAll(user.companyId); }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.LOGISTIC_ADMIN)
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.LOGISTIC_ADMIN)
  create(@Body() dto: any, @CurrentUser() user: any) { return this.service.create(dto, user.companyId); }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.LOGISTIC_ADMIN)
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
