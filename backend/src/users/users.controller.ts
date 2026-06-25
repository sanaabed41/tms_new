import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.LOGISTIC_ADMIN)
  findAll(@Query('companyId') companyId: string, @CurrentUser() user: any) {
    const cid = user.role === Role.SUPER_ADMIN ? companyId : user.companyId;
    return this.service.findAll(cid);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.LOGISTIC_ADMIN)
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  create(@Body() dto: any, @CurrentUser() user: any) { return this.service.create(dto, user); }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.LOGISTIC_ADMIN)
  update(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.service.update(id, dto, { role: user.role, companyId: user.companyId });
  }

  @Patch(':id/toggle-active')
  @Roles(Role.SUPER_ADMIN, Role.LOGISTIC_ADMIN)
  toggleActive(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.toggleActive(id, { id: user.id, email: user.email, role: user.role });
  }

  @Put(':id/filieres')
  @Roles(Role.SUPER_ADMIN)
  setFilieres(@Param('id') id: string, @Body('filiereIds') filiereIds: string[]) {
    return this.service.setFilieres(id, filiereIds ?? []);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.LOGISTIC_ADMIN)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, { role: user.role, companyId: user.companyId, id: user.id, email: user.email });
  }
}
