import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ExpediteursService } from './expediteurs.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Expéditeurs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('expediteurs')
export class ExpediteursController {
  constructor(private readonly service: ExpediteursService) {}

  @Get()
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  findAll(@CurrentUser() user: any) {
    return this.service.findAll(user.companyId);
  }

  @Get(':id')
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  create(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.create(dto, user.companyId);
  }

  @Put(':id')
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  // ── Filières ──────────────────────────────────────────────────────────────

  @Post(':id/filieres')
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  createFiliere(@Param('id') id: string, @Body() dto: any) {
    return this.service.createFiliere(id, dto);
  }

  @Put('filieres/:filiereId')
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  updateFiliere(@Param('filiereId') filiereId: string, @Body() dto: any) {
    return this.service.updateFiliere(filiereId, dto);
  }

  @Delete('filieres/:filiereId')
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  removeFiliere(@Param('filiereId') filiereId: string) {
    return this.service.removeFiliere(filiereId);
  }
}
