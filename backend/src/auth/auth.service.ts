import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { Company } from '../companies/company.entity';
import { SocieteExpeditrice } from '../expediteurs/societe-expeditrice.entity';
import { CompanyType } from '../common/enums/company-type.enum';
import { Role } from '../common/enums/role.enum';
import { MailService } from '../mail/mail.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
    private mailService: MailService,
    private auditLogs: AuditLogsService,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Company) private companyRepo: Repository<Company>,
    @InjectRepository(SocieteExpeditrice) private societeRepo: Repository<SocieteExpeditrice>,
  ) {}

  /** Inscription autonome : crée la société + le premier admin + (si EXPEDITEUR) la fiche expéditrice */
  async register(dto: {
    companyNom: string;
    companyType: CompanyType;
    code?: string;
    couleur?: string;
    prenom: string;
    nom: string;
    email: string;
    password: string;
  }) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('Cet email est déjà utilisé');

    const existingCompany = await this.companyRepo.findOne({ where: { nom: dto.companyNom } });
    if (existingCompany) throw new BadRequestException('Une société avec ce nom existe déjà');

    // Créer la société
    const company = await this.companyRepo.save(
      this.companyRepo.create({
        nom: dto.companyNom,
        type: dto.companyType,
        code: dto.code,
        couleur: dto.couleur,
        isActive: true,
      }),
    );

    // Si EXPEDITEUR : créer automatiquement la fiche SocieteExpeditrice
    if (dto.companyType === CompanyType.EXPEDITEUR) {
      await this.societeRepo.save(
        this.societeRepo.create({
          nom: dto.companyNom,
          code: dto.code,
          expediteurCompany: { id: company.id } as any,
        }),
      );
    }

    // Créer le premier admin
    const role = dto.companyType === CompanyType.EXPEDITEUR
      ? Role.EXPEDITEUR_ADMIN
      : Role.LOGISTIC_ADMIN;
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.userRepo.save(
      this.userRepo.create({
        prenom: dto.prenom,
        nom: dto.nom,
        email: dto.email,
        password: hashed,
        role,
        isActive: true,
        company: { id: company.id } as any,
      }),
    );

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: company.id,
      companyNom: company.nom,
      companyType: company.type,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: { ...user, company },
    };
  }

  async login(email: string, password: string, ip?: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      await this.auditLogs.log({
        action: 'LOGIN_FAILED',
        actorEmail: email,
        ip,
        metadata: { reason: 'email_not_found' },
      });
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    if (!user.isActive) {
      await this.auditLogs.log({
        action: 'LOGIN_FAILED',
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        companyId: user.company?.id,
        companyNom: user.company?.nom,
        ip,
        metadata: { reason: 'account_inactive' },
      });
      throw new UnauthorizedException('Compte inactif — contactez votre administrateur');
    }

    if (!user.password) {
      await this.auditLogs.log({
        action: 'LOGIN_FAILED',
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        companyId: user.company?.id,
        companyNom: user.company?.nom,
        ip,
        metadata: { reason: 'password_not_set' },
      });
      throw new UnauthorizedException('Compte non activé — vérifiez votre email d\'invitation');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      await this.auditLogs.log({
        action: 'LOGIN_FAILED',
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        companyId: user.company?.id,
        companyNom: user.company?.nom,
        ip,
        metadata: { reason: 'wrong_password' },
      });
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    await this.auditLogs.log({
      action: 'LOGIN_SUCCESS',
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      companyId: user.company?.id,
      companyNom: user.company?.nom,
      ip,
    });

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.company?.id,
      companyNom: user.company?.nom,
      companyType: (user.company as any)?.type,
      deliveryCompanyId: (user as any).deliveryCompany?.id ?? null,
    };
    // Inclure les filières pour FILIERE_ADMIN, MAGASINIER et SECURITE
    const withFilieres = [Role.FILIERE_ADMIN, Role.MAGASINIER, Role.SECURITE].includes(user.role);
    const filieres = withFilieres
      ? (await this.userRepo.findOne({ where: { id: user.id }, relations: ['filieres'] }))?.filieres ?? []
      : [];
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, nom: user.nom, prenom: user.prenom, email: user.email, role: user.role, company: user.company, filieres },
    };
  }

  async profile(userId: string) {
    return this.usersService.findOne(userId);
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.isActive) return { message: 'Si cet email existe, un lien aété envoyé.' };

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(rawToken, 8);
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await this.userRepo.update(user.id, {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: expires,
    });

    const frontUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
    await this.mailService.sendResetPassword(user.email, user.prenom, rawToken, frontUrl);

    return { message: 'Si cet email existe, un lien aété envoyé.' };
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
