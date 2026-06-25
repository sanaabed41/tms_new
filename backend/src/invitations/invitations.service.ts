import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { Invitation } from './invitation.entity';
import { User } from '../users/user.entity';
import { Filiere } from '../expediteurs/filiere.entity';
import { DeliveryCompany } from '../delivery-companies/delivery-company.entity';
import { MailService } from '../mail/mail.service';
import { Role } from '../common/enums/role.enum';

// COMPANY_ADMIN (logistique) ne gère plus les users — géré par SUPER_ADMIN
const EXPEDITEUR_ADMIN_ROLES: Role[] = [Role.EXPEDITEUR_ADMIN, Role.FILIERE_ADMIN];
const FILIERE_ADMIN_ROLES: Role[] = [Role.MAGASINIER, Role.SECURITE];
const LOGISTIC_ADMIN_ROLES: Role[] = [Role.TRANSPORT_ADMIN];

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(Invitation) private repo: Repository<Invitation>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Filiere) private filiereRepo: Repository<Filiere>,
    @InjectRepository(DeliveryCompany) private deliveryCompanyRepo: Repository<DeliveryCompany>,
    private mailService: MailService,
    private config: ConfigService,
  ) {}

  async create(
    dto: { email: string; role: Role; nom: string; prenom: string; filiereIds?: string[]; deliveryCompanyNom?: string },
    companyId: string,
    companyNom: string,
    callerRole: Role,
  ) {
    if (callerRole === Role.EXPEDITEUR_ADMIN && !EXPEDITEUR_ADMIN_ROLES.includes(dto.role)) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à inviter ce rôle');
    }
    if (callerRole === Role.FILIERE_ADMIN && !FILIERE_ADMIN_ROLES.includes(dto.role)) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à inviter ce rôle');
    }

    const existingUser = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existingUser) throw new BadRequestException('Un compte existe déjà pour cet email');

    // Generate a secure temporary password
    const rawPassword = this.generatePassword();
    const hashed = await bcrypt.hash(rawPassword, 10);

    // Create delivery company immediately for TRANSPORT_ADMIN
    let deliveryCompanyId: string | null = null;
    if (dto.role === Role.TRANSPORT_ADMIN && dto.deliveryCompanyNom) {
      const newDc = await this.deliveryCompanyRepo.save(
        this.deliveryCompanyRepo.create({
          nom: dto.deliveryCompanyNom,
          company: { id: companyId },
        }),
      );
      deliveryCompanyId = newDc.id;
    }

    // Resolve filieres
    const filieres = dto.filiereIds?.length
      ? await this.filiereRepo.findBy({ id: In(dto.filiereIds) })
      : [];

    // Create user account directly (no acceptance step needed)
    const user = this.userRepo.create({
      nom: dto.nom,
      prenom: dto.prenom,
      email: dto.email,
      password: hashed,
      role: dto.role,
      isActive: true,
      company: { id: companyId },
      filieres,
      ...(deliveryCompanyId ? { deliveryCompany: { id: deliveryCompanyId } } : {}),
    });
    await this.userRepo.save(user);

    // Keep invitation record for audit history (isUsed: true since user is already created)
    await this.repo.delete({ email: dto.email });
    const invitation = this.repo.create({
      email: dto.email,
      role: dto.role,
      token: crypto.randomBytes(16).toString('hex'),
      expiresAt: new Date(),
      isUsed: true,
      filiereIds: dto.filiereIds?.length ? dto.filiereIds : null,
      deliveryCompanyNom: dto.deliveryCompanyNom ?? null,
      company: { id: companyId },
    });
    await this.repo.save(invitation);

    // Send credentials email
    const appUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
    const mailResult = await this.mailService.sendCredentials(
      dto.email, dto.prenom, dto.nom, rawPassword, dto.role, companyNom, appUrl,
    );

    return { message: `Compte créé et identifiants envoyés à ${dto.email}`, ...mailResult };
  }

  private generatePassword(): string {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghjkmnpqrstuvwxyz';
    const digits = '23456789';
    const special = '!@#';
    const all = upper + lower + digits + special;
    const required = [
      upper[Math.floor(Math.random() * upper.length)],
      lower[Math.floor(Math.random() * lower.length)],
      digits[Math.floor(Math.random() * digits.length)],
      special[Math.floor(Math.random() * special.length)],
    ];
    const rest = Array.from({ length: 6 }, () => all[Math.floor(Math.random() * all.length)]);
    return [...required, ...rest].sort(() => Math.random() - 0.5).join('');
  }

  async verify(rawToken: string) {
    const invitation = await this.findByRawToken(rawToken);
    if (!invitation) throw new NotFoundException('Invitation invalide ou expirée');
    if (invitation.isUsed) throw new BadRequestException('Cette invitation a déjàété utilisée');
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
    if (invitation.isUsed) throw new BadRequestException('Cette invitation a déjàété utilisée');
    if (invitation.expiresAt < new Date()) throw new BadRequestException('Invitation expirée');

    const hashed = await bcrypt.hash(dto.password, 10);

    // Résoudre les filières si présentes dans l'invitation
    const filieres = invitation.filiereIds?.length
      ? await this.filiereRepo.findBy({ id: In(invitation.filiereIds) })
      : [];

    // Créer la société de transport si c'est un TRANSPORT_ADMIN
    let deliveryCompanyId: string | null = null;
    if (invitation.role === Role.TRANSPORT_ADMIN && invitation.deliveryCompanyNom) {
      const newDc = await this.deliveryCompanyRepo.save(
        this.deliveryCompanyRepo.create({
          nom: invitation.deliveryCompanyNom,
          company: { id: invitation.company.id },
        }),
      );
      deliveryCompanyId = newDc.id;
    }

    const user = this.userRepo.create({
      nom: dto.nom,
      prenom: dto.prenom,
      email: invitation.email,
      password: hashed,
      role: invitation.role,
      isActive: true,
      company: { id: invitation.company.id },
      filieres,
      ...(deliveryCompanyId ? { deliveryCompany: { id: deliveryCompanyId } } : {}),
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

    if (callerRole !== Role.SUPER_ADMIN && inv.company.id !== callerCompanyId) {
      throw new ForbiddenException('Accès interdit');
    }

    // Find the user and regenerate their password
    const user = await this.userRepo.findOne({ where: { email: inv.email } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const rawPassword = this.generatePassword();
    const hashed = await bcrypt.hash(rawPassword, 10);
    await this.userRepo.update(user.id, { password: hashed });

    const appUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
    const mailResult = await this.mailService.sendCredentials(
      user.email, user.prenom, user.nom, rawPassword, user.role, companyNom, appUrl,
    );
    return { message: 'Nouveaux identifiants envoyés', ...mailResult };
  }

  async remove(id: string, callerCompanyId: string, callerRole: Role) {
    const inv = await this.repo.findOne({ where: { id }, relations: ['company'] });
    if (!inv) throw new NotFoundException('Invitation non trouvée');

    if (callerRole !== Role.SUPER_ADMIN && inv.company.id !== callerCompanyId) {
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
