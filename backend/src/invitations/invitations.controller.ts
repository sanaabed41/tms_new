import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly service: InvitationsService) {}

  // ── Routes publiques ──────────────────────────────────────────────────────
  @Get('verify/:token')
  verify(@Param('token') token: string) {
    return this.service.verify(token);
  }

  @Post('accept/:token')
  accept(
    @Param('token') token: string,
    @Body() dto: { nom: string; prenom: string; password: string },
  ) {
    return this.service.accept(token, dto);
  }

  // ── Routes protégées ─────────────────────────────────────────────────────
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EXPEDITEUR_ADMIN, Role.FILIERE_ADMIN, Role.SUPER_ADMIN, Role.LOGISTIC_ADMIN)
  @Get()
  findAll(@CurrentUser() user: any, @Query('companyId') companyId?: string) {
    const cid = user.role === Role.SUPER_ADMIN ? (companyId ?? user.companyId) : user.companyId;
    return this.service.findAll(cid);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EXPEDITEUR_ADMIN, Role.FILIERE_ADMIN, Role.SUPER_ADMIN, Role.LOGISTIC_ADMIN)
  @Post()
  create(
    @Body() dto: {
      email: string; role: Role; nom: string; prenom: string;
      filiereIds?: string[]; companyId?: string; deliveryCompanyNom?: string;
    },
    @CurrentUser() user: any,
  ) {
    const cid = user.role === Role.SUPER_ADMIN ? (dto.companyId ?? user.companyId) : user.companyId;
    return this.service.create(
      { email: dto.email, role: dto.role, nom: dto.nom, prenom: dto.prenom, filiereIds: dto.filiereIds, deliveryCompanyNom: dto.deliveryCompanyNom },
      cid,
      user.companyNom ?? 'votre société',
      user.role,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EXPEDITEUR_ADMIN, Role.FILIERE_ADMIN, Role.SUPER_ADMIN, Role.LOGISTIC_ADMIN)
  @Post(':id/resend')
  resend(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.resend(id, user.companyId, user.role, user.companyNom ?? 'votre société');
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EXPEDITEUR_ADMIN, Role.FILIERE_ADMIN, Role.SUPER_ADMIN, Role.LOGISTIC_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user.companyId, user.role);
  }
}
