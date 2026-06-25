import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TrucksService } from './trucks.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Trucks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('trucks')
export class TrucksController {
  constructor(private readonly service: TrucksService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.LOGISTIC_ADMIN, Role.MAGASINIER, Role.SECURITE)
  findAll(@Query('deliveryCompanyId') dcId: string) { return this.service.findAll(dcId); }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.LOGISTIC_ADMIN)
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.LOGISTIC_ADMIN)
  create(@Body() dto: any) { return this.service.create(dto); }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.LOGISTIC_ADMIN)
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
