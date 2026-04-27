import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { Invitation } from './invitation.entity';
import { User } from '../users/user.entity';
import { MailService } from '../mail/mail.service';
import { Role } from '../common/enums/role.enum';

// Rôles qu'un COMPANY_ADMIN est autorisé à inviter
const COMPANY_ADMIN_ALLOWED_ROLES: Role[] = [Role.COMPANY_ADMIN];

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(Invitation) private repo: Repository<Invitation>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private mailService: MailService,
    private config: ConfigService,
  ) {}

  async create(
    dto: { email: string; role: Role },
    companyId: string,
    companyNom: string,
    callerRole: Role,
  ) {
    // Un COMPANY_ADMIN ne peut pas inviter un SUPER_ADMIN
    if (callerRole === Role.COMPANY_ADMIN && !COMPANY_ADMIN_ALLOWED_ROLES.includes(dto.role)) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à inviter ce rôle');
    }

    const existingUser = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existingUser) throw new BadRequestException('Un compte existe déjà pour cet email');

    // Annuler toute invitation précédente non utilisée pour cet email
    await this.repo.delete({ email: dto.email, company: { id: companyId } });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(rawToken, 8);
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h

    const invitation = this.repo.create({
      email: dto.email,
      role: dto.role,
      token: hashedToken,
      expiresAt,
      company: { id: companyId },
    });
    await this.repo.save(invitation);

    const frontUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
    const mailResult = await this.mailService.sendInvitation(
      dto.email, companyNom, dto.role, rawToken, frontUrl,
    );

    return { message: `Invitation envoyée à ${dto.email}`, ...mailResult };
  }

  async verify(rawToken: string) {
    const invitation = await this.findByRawToken(rawToken);
    if (!invitation) throw new NotFoundException('Invitation invalide ou expirée');
    if (invitation.isUsed) throw new BadRequestException('Cette invitation a déjà été utilisée');
    if (invitation.expiresAt < new Date()) throw new BadRequestException('Invitation expirée');

    return {
      email: invitation.email,
      role: invitation.role,
      company: invitation.company,
    };
  }

  async accept(rawToken: string, dto: { nom: string; prenom: string; password: string }) {
    const invitation = await this.findByRawToken(rawToken);
    if (!invitation) throw new NotFoundException('Invitation invalide ou expirée');
    if (invitation.isUsed) throw new BadRequestException('Cette invitation a déjà été utilisée');
    if (invitation.expiresAt < new Date()) throw new BadRequestException('Invitation expirée');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      nom: dto.nom,
      prenom: dto.prenom,
      email: invitation.email,
      password: hashed,
      role: invitation.role,
      isActive: true,
      company: { id: invitation.company.id },
    });
    await this.userRepo.save(user);
    await this.repo.update(invitation.id, { isUsed: true });

    return { message: 'Compte créé avec succès. Vous pouvez vous connecter.' };
  }

  findAll(companyId: string) {
    return this.repo.find({
      where: { company: { id: companyId } },
      order: { createdAt: 'DESC' },
    });
  }

  async resend(id: string, callerCompanyId: string, callerRole: Role, companyNom: string) {
    const inv = await this.repo.findOne({ where: { id }, relations: ['company'] });
    if (!inv) throw new NotFoundException('Invitation non trouvée');

    // COMPANY_ADMIN ne peut agir que sur les invitations de sa propre société
    if (callerRole === Role.COMPANY_ADMIN && inv.company.id !== callerCompanyId) {
      throw new ForbiddenException('Accès interdit');
    }

    if (inv.isUsed) throw new BadRequestException('Invitation déjà acceptée');

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(rawToken, 8);
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    await this.repo.update(id, { token: hashedToken, expiresAt });

    const frontUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
    const mailResult = await this.mailService.sendInvitation(
      inv.email, companyNom, inv.role, rawToken, frontUrl,
    );
    return { message: 'Invitation renvoyée', ...mailResult };
  }

  async remove(id: string, callerCompanyId: string, callerRole: Role) {
    const inv = await this.repo.findOne({ where: { id }, relations: ['company'] });
    if (!inv) throw new NotFoundException('Invitation non trouvée');

    if (callerRole === Role.COMPANY_ADMIN && inv.company.id !== callerCompanyId) {
      throw new ForbiddenException('Accès interdit');
    }

    return this.repo.delete(id);
  }

  private async findByRawToken(rawToken: string) {
    const invitations = await this.repo.find({ relations: ['company'] });
    for (const inv of invitations) {
      const match = await bcrypt.compare(rawToken, inv.token);
      if (match) return inv;
    }
    return null;
  }
}
