import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ErpService } from './erp.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('ERP Integration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('erp')
export class ErpController {
  constructor(private readonly service: ErpService) {}

  /**
   * ERP pushes article catalog updates.
   * Accessible to any authenticated company admin or super admin.
   */
  @Post('articles')
  @Roles(Role.LOGISTIC_ADMIN, Role.SUPER_ADMIN)
  upsertArticles(@Body() body: { articles: any[] }) {
    return this.service.upsertArticles(body.articles);
  }

  /**
   * ERP pushes new or updated BLs.
   * BLs are created as VALIDATED (ready for planning).
   * BLs already LOADED or DELIVERED are skipped.
   */
  @Post('bons-livraison')
  @Roles(Role.LOGISTIC_ADMIN, Role.SUPER_ADMIN)
  upsertBons(@CurrentUser() user: any, @Body() body: { bons: any[] }) {
    return this.service.upsertBons(user.companyId, body.bons);
  }
}
