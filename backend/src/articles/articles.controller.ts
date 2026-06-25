import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Articles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('articles')
export class ArticlesController {
  constructor(private readonly service: ArticlesService) {}

  @Get()
  @Roles(
    Role.SUPER_ADMIN, Role.LOGISTIC_ADMIN,
    Role.EXPEDITEUR_ADMIN, Role.FILIERE_ADMIN,
    Role.MAGASINIER, Role.SECURITE,
  )
  findAll(@Query('search') search: string) { return this.service.findAll(search); }

  @Get(':id')
  @Roles(
    Role.SUPER_ADMIN, Role.LOGISTIC_ADMIN,
    Role.EXPEDITEUR_ADMIN, Role.FILIERE_ADMIN,
    Role.MAGASINIER, Role.SECURITE,
  )
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  // Écriture réservée au SUPER_ADMIN — normalement alimenté par l'ERP
  @Post()
  @Roles(Role.SUPER_ADMIN)
  create(@Body() dto: any) { return this.service.create(dto); }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
