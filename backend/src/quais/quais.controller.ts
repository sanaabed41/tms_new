import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { QuaisService } from './quais.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Quais')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('quais')
export class QuaisController {
  constructor(private readonly service: QuaisService) {}

  @Get()
  @Roles(Role.LOGISTIC_ADMIN, Role.MAGASINIER, Role.SECURITE)
  findAll(@CurrentUser() user: any) {
    return this.service.findAll(user.companyId);
  }

  @Post()
  @Roles(Role.LOGISTIC_ADMIN)
  create(@CurrentUser() user: any, @Body() dto: any) {
    return this.service.create(user.companyId, dto);
  }

  @Put(':id')
  @Roles(Role.LOGISTIC_ADMIN)
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.LOGISTIC_ADMIN)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
