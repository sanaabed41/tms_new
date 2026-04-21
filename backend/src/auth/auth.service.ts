import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
    private mailService: MailService,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Email ou mot de passe incorrect');
    if (!user.isActive) throw new UnauthorizedException('Compte inactif — contactez votre administrateur');
    if (!user.password) throw new UnauthorizedException('Compte non activé — vérifiez votre email d\'invitation');

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new UnauthorizedException('Email ou mot de passe incorrect');

    const payload = { sub: user.id, email: user.email, role: user.role, companyId: user.company?.id, companyNom: user.company?.nom };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, nom: user.nom, prenom: user.prenom, email: user.email, role: user.role, company: user.company },
    };
  }

  async profile(userId: string) {
    return this.usersService.findOne(userId);
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    // Toujours répondre OK pour ne pas révéler si l'email existe
    if (!user || !user.isActive) return { message: 'Si cet email existe, un lien a été envoyé.' };

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(rawToken, 8);
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await this.userRepo.update(user.id, {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: expires,
    });

    const frontUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
    await this.mailService.sendResetPassword(user.email, user.prenom, rawToken, frontUrl);

    return { message: 'Si cet email existe, un lien a été envoyé.' };
  }

  async verifyResetToken(token: string) {
    const users = await this.userRepo.find({ where: { isActive: true } });
    const user = await this.findUserByRawToken(users, token, 'resetPasswordToken');
    if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Lien invalide ou expiré');
    }
    return { valid: true, email: user.email };
  }

  async resetPassword(token: string, newPassword: string) {
    const users = await this.userRepo.find({ where: { isActive: true } });
    const user = await this.findUserByRawToken(users, token, 'resetPasswordToken');
    if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Lien invalide ou expiré');
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.userRepo.update(user.id, {
      password: hashed,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });
    return { message: 'Mot de passe réinitialisé avec succès' };
  }

  private async findUserByRawToken(users: User[], rawToken: string, field: 'resetPasswordToken') {
    for (const user of users) {
      if (!user[field]) continue;
      const match = await bcrypt.compare(rawToken, user[field] as string);
      if (match) return user;
    }
    return null;
  }
}
