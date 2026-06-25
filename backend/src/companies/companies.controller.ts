import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CompanyType } from '../common/enums/company-type.enum';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly service: CompaniesService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.LOGISTIC_ADMIN)
  findAll(@Query('type') type?: CompanyType) {
    return this.service.findAll(type);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.LOGISTIC_ADMIN)
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  create(@Body() dto: any) { return this.service.create(dto); }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id') id: string) { return this.service.remove(id); }

  @Get('logistique/:logistiqueId/expediteurs')
  @Roles(Role.SUPER_ADMIN, Role.LOGISTIC_ADMIN)
  findByLogistique(@Param('logistiqueId') logistiqueId: string) {
    return this.service.findByLogistique(logistiqueId);
  }

  @Put(':id/logistique')
  @Roles(Role.SUPER_ADMIN)
  setLogistiqueCompany(
    @Param('id') expediteurId: string,
    @Body('logistiqueId') logistiqueId: string | null,
  ) {
    return this.service.setLogistiqueCompany(expediteurId, logistiqueId);
  }
}
