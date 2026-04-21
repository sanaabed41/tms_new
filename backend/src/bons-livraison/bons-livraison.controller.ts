import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { BonsLivraisonService } from './bons-livraison.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BlStatus } from '../common/enums/bl-status.enum';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Bons de Livraison')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bons-livraison')
export class BonsLivraisonController {
  constructor(private readonly service: BonsLivraisonService) {}

  @Get()
  findAll(@CurrentUser() user: any, @Query('statut') statut: BlStatus) {
    return this.service.findAll(user.companyId, statut);
  }

  @Get('available')
  findAvailable(@CurrentUser() user: any) {
    return this.service.findAvailable(user.companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post()
  create(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.create(dto, user.companyId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
