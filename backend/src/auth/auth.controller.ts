import { Controller, Post, Body, Get, Param, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('login')
  login(@Body() dto: { email: string; password: string }, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip;
    return this.service.login(dto.email, dto.password, ip);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  profile(@CurrentUser() user: any) {
    return this.service.profile(user.id);
  }

  @Post('forgot-password')
  forgotPassword(@Body('email') email: string) {
    return this.service.forgotPassword(email);
  }

  @Get('verify-reset-token/:token')
  verifyResetToken(@Param('token') token: string) {
    return this.service.verifyResetToken(token);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: { token: string; password: string }) {
    return this.service.resetPassword(dto.token, dto.password);
  }
}
