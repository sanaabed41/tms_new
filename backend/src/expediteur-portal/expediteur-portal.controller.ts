import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ExpediteursPortalService } from './expediteur-portal.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Portail Expéditeur')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.EXPEDITEUR_ADMIN, Role.FILIERE_ADMIN, Role.SUPER_ADMIN)
@Controller('expediteur-portal')
export class ExpediteursPortalController {
  constructor(private readonly service: ExpediteursPortalService) {}

  @Get('dashboard')
  dashboard(@CurrentUser() user: any) {
    return this.service.getDashboard(user.companyId);
  }

  @Get('me')
  getMySociete(@CurrentUser() user: any) {
    return this.service.getMySociete(user.companyId);
  }

  @Put('me')
  @Roles(Role.EXPEDITEUR_ADMIN, Role.SUPER_ADMIN)
  updateMySociete(@CurrentUser() user: any, @Body() dto: any) {
    return this.service.updateMySociete(user.companyId, dto);
  }

  @Get('magasin/dashboard')
  @Roles(Role.MAGASINIER, Role.SUPER_ADMIN)
  getMagasinierDashboard(@CurrentUser() user: any) {
    return this.service.getMagasinierDashboard(user.companyId, user.sub);
  }

  @Get('planning')
  @Roles(Role.EXPEDITEUR_ADMIN, Role.FILIERE_ADMIN, Role.MAGASINIER, Role.SECURITE, Role.SUPER_ADMIN)
  getMyPlanning(@CurrentUser() user: any, @Query('date') date?: string) {
    if (
      user.role === Role.FILIERE_ADMIN ||
      user.role === Role.MAGASINIER ||
      user.role === Role.SECURITE
    ) {
      return this.service.getValidatedPlansForFiliere(user.companyId, user.sub, date);
    }
    return this.service.getMyValidatedPlans(user.companyId, date);
  }

  @Get('profile')
  @Roles(Role.FILIERE_ADMIN, Role.MAGASINIER)
  getMyProfile(@CurrentUser() user: any) {
    return this.service.getMyProfile(user.sub);
  }

  @Put('profile')
  @Roles(Role.FILIERE_ADMIN, Role.MAGASINIER)
  updateMyProfile(@CurrentUser() user: any, @Body() dto: any) {
    return this.service.updateMyProfile(user.sub, dto);
  }

  @Get('bls')
  @Roles(Role.EXPEDITEUR_ADMIN, Role.FILIERE_ADMIN, Role.MAGASINIER, Role.SUPER_ADMIN)
  getMyBls(@CurrentUser() user: any, @Query('date') date?: string) {
    if (user.role === Role.FILIERE_ADMIN || user.role === Role.MAGASINIER) {
      return this.service.getMyBlsForFiliere(user.companyId, user.sub, date);
    }
    return this.service.getMyBls(user.companyId, date);
  }

  @Get('users')
  getMyUsers(@CurrentUser() user: any) {
    if (user.role === Role.FILIERE_ADMIN) {
      return this.service.getMyUsersForFiliere(user.companyId, user.sub);
    }
    return this.service.getMyUsers(user.companyId);
  }

  @Patch('users/:id/toggle-active')
  @Roles(Role.EXPEDITEUR_ADMIN, Role.FILIERE_ADMIN, Role.SUPER_ADMIN)
  toggleUserActive(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.toggleUserActive(user.companyId, user.sub, id, user.role);
  }

  @Delete('users/:id')
  @Roles(Role.EXPEDITEUR_ADMIN, Role.FILIERE_ADMIN, Role.SUPER_ADMIN)
  deleteUser(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.deleteWorker(user.companyId, user.sub, id, user.role);
  }

  @Get('quais')
  @Roles(Role.EXPEDITEUR_ADMIN, Role.FILIERE_ADMIN, Role.MAGASINIER, Role.SECURITE, Role.SUPER_ADMIN)
  getMyQuais(@CurrentUser() user: any) {
    if (user.role === Role.MAGASINIER || user.role === Role.SECURITE) {
      return this.service.getMyQuaisForFiliere(user.sub);
    }
    return this.service.getMyQuais(user.companyId);
  }

  // ── Société Logistique ────────────────────────────────────────────────────

  @Get('logistique')
  @Roles(Role.EXPEDITEUR_ADMIN, Role.SUPER_ADMIN)
  getMyLogistique(@CurrentUser() user: any) {
    return this.service.getMyLogistique(user.companyId);
  }

  @Post('logistique')
  @Roles(Role.EXPEDITEUR_ADMIN, Role.SUPER_ADMIN)
  setupLogistique(
    @CurrentUser() user: any,
    @Body() dto: { companyNom: string; adresse?: string; telephone?: string; adminEmail: string },
  ) {
    return this.service.setupLogistique(user.companyId, dto);
  }

  @Post('logistique/resend-invitation')
  @Roles(Role.EXPEDITEUR_ADMIN, Role.SUPER_ADMIN)
  resendLogistiqueInvitation(@CurrentUser() user: any) {
    return this.service.resendLogistiqueInvitation(user.companyId);
  }

  // ── Filières — EXPEDITEUR_ADMIN uniquement ─────────────────────────────────

  @Post('filieres')
  @Roles(Role.EXPEDITEUR_ADMIN, Role.SUPER_ADMIN)
  createFiliere(@CurrentUser() user: any, @Body() dto: { nom: string; code: string }) {
    return this.service.createFiliere(user.companyId, dto);
  }

  @Put('filieres/:id')
  @Roles(Role.EXPEDITEUR_ADMIN, Role.SUPER_ADMIN)
  updateFiliere(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: { nom?: string; code?: string },
  ) {
    return this.service.updateFiliere(user.companyId, id, dto);
  }

  @Delete('filieres/:id')
  @Roles(Role.EXPEDITEUR_ADMIN, Role.SUPER_ADMIN)
  deleteFiliere(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.deleteFiliere(user.companyId, id);
  }

  // ── Quais — EXPEDITEUR_ADMIN + FILIERE_ADMIN ───────────────────────────────

  @Post('quais')
  @Roles(Role.EXPEDITEUR_ADMIN, Role.FILIERE_ADMIN, Role.SUPER_ADMIN)
  createQuai(@CurrentUser() user: any, @Body() dto: { nom: string; filiereId?: string; capacite?: number }) {
    if (user.role === Role.FILIERE_ADMIN) {
      return this.service.createQuaiForFiliere(user.sub, dto);
    }
    return this.service.createQuai(user.companyId, dto);
  }

  @Put('quais/:id')
  @Roles(Role.EXPEDITEUR_ADMIN, Role.FILIERE_ADMIN, Role.MAGASINIER, Role.SUPER_ADMIN)
  updateQuai(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: { nom?: string; isActive?: boolean; filiereId?: string | null; capacite?: number },
  ) {
    if (user.role === Role.FILIERE_ADMIN) {
      return this.service.updateQuaiForFiliere(user.sub, id, dto);
    }
    if (user.role === Role.MAGASINIER) {
      return this.service.updateQuaiForFiliere(user.sub, id, {});
    }
    return this.service.updateQuai(user.companyId, id, dto);
  }

  @Delete('quais/:id')
  @Roles(Role.EXPEDITEUR_ADMIN, Role.FILIERE_ADMIN, Role.SUPER_ADMIN)
  deleteQuai(@CurrentUser() user: any, @Param('id') id: string) {
    if (user.role === Role.FILIERE_ADMIN) {
      return this.service.deleteQuaiForFiliere(user.sub, id);
    }
    return this.service.deleteQuai(user.companyId, id);
  }
}
