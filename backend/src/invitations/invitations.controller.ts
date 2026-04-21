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

  // Routes publiques (sans auth)
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

  // Routes protégées — COMPANY_ADMIN uniquement sur sa société
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  @Get()
  findAll(@CurrentUser() user: any, @Query('companyId') companyId?: string) {
    // SUPER_ADMIN peut cibler n'importe quelle société via query param
    const cid = user.role === Role.SUPER_ADMIN ? companyId ?? user.companyId : user.companyId;
    return this.service.findAll(cid);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  @Post()
  create(@Body() dto: { email: string; role: Role; companyId?: string }, @CurrentUser() user: any) {
    // COMPANY_ADMIN ne peut créer que pour sa propre société
    const cid = user.role === Role.SUPER_ADMIN ? dto.companyId ?? user.companyId : user.companyId;
    return this.service.create(
      { email: dto.email, role: dto.role },
      cid,
      user.companyNom || 'votre société',
      user.role,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  @Post(':id/resend')
  resend(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.resend(id, user.companyId, user.role, user.companyNom || 'votre société');
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user.companyId, user.role);
  }
}
