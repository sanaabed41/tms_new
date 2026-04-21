import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TruckAvailabilityService } from './truck-availability.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Truck Availability')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('truck-availability')
export class TruckAvailabilityController {
  constructor(private readonly service: TruckAvailabilityService) {}

  @Get()
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  findByDate(@CurrentUser() user: any, @Query('date') date: string) {
    return this.service.findByDate(user.companyId, date);
  }

  @Post()
  @Roles(Role.COMPANY_ADMIN)
  addTruck(@CurrentUser() user: any, @Body() body: { truckId: string; date: string }) {
    return this.service.addTruck(user.companyId, body.truckId, body.date);
  }

  @Post('bulk-set')
  @Roles(Role.COMPANY_ADMIN)
  bulkSet(@CurrentUser() user: any, @Body() body: { truckIds: string[]; date: string }) {
    return this.service.bulkSet(user.companyId, body.truckIds, body.date);
  }

  @Delete(':id')
  @Roles(Role.COMPANY_ADMIN)
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.remove(user.companyId, id);
  }
}
