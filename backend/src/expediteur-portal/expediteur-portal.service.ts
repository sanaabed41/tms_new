import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { SocieteExpeditrice } from '../expediteurs/societe-expeditrice.entity';
import { Filiere } from '../expediteurs/filiere.entity';
import { BonLivraison } from '../bons-livraison/bon-livraison.entity';
import { LoadingPlan } from '../loading-plans/loading-plan.entity';
import { User } from '../users/user.entity';
import { Quai } from '../quais/quai.entity';
import { Company } from '../companies/company.entity';
import { Invitation } from '../invitations/invitation.entity';
import { Role } from '../common/enums/role.enum';
import { CompanyType } from '../common/enums/company-type.enum';
import { MailService } from '../mail/mail.service';

@Injectable()
export class ExpediteursPortalService {
  constructor(
    @InjectRepository(SocieteExpeditrice) private societeRepo: Repository<SocieteExpeditrice>,
    @InjectRepository(Filiere) private filiereRepo: Repository<Filiere>,
    @InjectRepository(BonLivraison) private blRepo: Repository<BonLivraison>,
    @InjectRepository(LoadingPlan) private loadingPlanRepo: Repository<LoadingPlan>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Quai) private quaiRepo: Repository<Quai>,
    @InjectRepository(Company) private companyRepo: Repository<Company>,
    @InjectRepository(Invitation) private invitationRepo: Repository<Invitation>,
    private mailService: MailService,
    private config: ConfigService,
  ) {}

  /** Charge les IDs de filières d'un utilisateur via une requête directe sur user_filieres.
   *  Contourne le bug TypeORM eager+relations qui retourne un tableau vide. */
  private async getFiliereIds(userId: string): Promise<string[]> {
    const rows: { filieresId: string }[] = await this.userRepo.manager.query(
      `SELECT "filieresId" FROM user_filieres WHERE "usersId" = $1`,
      [userId],
    );
    return rows.map((r) => r.filieresId);
  }

  /** Retourne la société expéditrice liée au compte portail de l'utilisateur.
   *  Essaie d'abord le lien direct (expediteurCompany), puis se rabat sur la
   *  table de partenariat LOGISTIQUE↔EXPEDITEUR (utile pour les anciennes données). */
  async getMySociete(expediteurCompanyId: string) {
    // 1. Lien direct (données récentes / seed:demo-full / inscription normale)
    let societe = await this.societeRepo.findOne({
      where: { expediteurCompany: { id: expediteurCompanyId } },
      relations: ['filieres', 'company'],
    });

    // 2. Fallback : trouver via la société logistique de l'expéditeur (nouvelle relation 1:N)
    if (!societe) {
      societe = await this.societeRepo
        .createQueryBuilder('se')
        .leftJoinAndSelect('se.filieres', 'f')
        .leftJoinAndSelect('se.company', 'logi')
        .innerJoin(
          'companies',
          'exp',
          'exp."logistiqueCompanyId" = logi.id AND exp.id = :expId',
          { expId: expediteurCompanyId },
        )
        .getOne();

      if (societe) {
        await this.societeRepo.update(societe.id, {
          expediteurCompany: { id: expediteurCompanyId } as any,
        });
      }
    }

    if (!societe) throw new NotFoundException('Aucune société expéditrice liée à ce compte');
    return societe;
  }

  /** BLs de la société — lecture seule, triés par date décroissante */
  async getMyBls(expediteurCompanyId: string, date?: string, filiereIds?: string[]) {
    const societe = await this.getMySociete(expediteurCompanyId);
    const qb = this.blRepo.createQueryBuilder('bl')
      .leftJoinAndSelect('bl.filiere', 'filiere')
      .leftJoinAndSelect('bl.loadingPlan', 'lp')
      .leftJoinAndSelect('lp.truck', 'truck')
      .where('bl.societeExpeditriceId = :sid', { sid: societe.id })
      .orderBy('bl.datelivraison', 'DESC')
      .addOrderBy('bl.ordreChargement', 'ASC', 'NULLS LAST');
    if (date) qb.andWhere('bl.datelivraison = :date', { date });
    if (filiereIds?.length) qb.andWhere('filiere.id IN (:...filiereIds)', { filiereIds });
    return qb.getMany();
  }

  /** BLs scopés à la/les filière(s) du FILIERE_ADMIN/MAGASINIER — sans passer par getMySociete */
  async getMyBlsForFiliere(_expediteurCompanyId: string, callerUserId: string, date?: string) {
    const filiereIds = await this.getFiliereIds(callerUserId);
    if (!filiereIds.length) return [];
    const qb = this.blRepo.createQueryBuilder('bl')
      .leftJoinAndSelect('bl.filiere', 'filiere')
      .leftJoinAndSelect('bl.loadingPlan', 'lp')
      .leftJoinAndSelect('lp.truck', 'truck')
      .where('bl.filiereId IN (:...filiereIds)', { filiereIds })
      .orderBy('bl.datelivraison', 'DESC')
      .addOrderBy('bl.ordreChargement', 'ASC', 'NULLS LAST');
    if (date) qb.andWhere('bl.datelivraison = :date', { date });
    return qb.getMany();
  }

  /** Admins de filières du compte portail expéditeur — FILIERE_ADMIN uniquement */
  getMyUsers(expediteurCompanyId: string) {
    return this.userRepo.find({
      where: { company: { id: expediteurCompanyId }, role: Role.FILIERE_ADMIN },
      relations: ['filieres'],
      order: { nom: 'ASC' },
    });
  }

  /** Magasiniers et agents sécurité scopés à la/les filière(s) du FILIERE_ADMIN appelant */
  async getMyUsersForFiliere(expediteurCompanyId: string, callerUserId: string) {
    const filiereIds = await this.getFiliereIds(callerUserId);
    if (!filiereIds.length) return [];
    return this.userRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.filieres', 'f')
      .where('u.companyId = :cid', { cid: expediteurCompanyId })
      .andWhere('f.id IN (:...ids)', { ids: filiereIds })
      .andWhere('u.role IN (:...roles)', { roles: [Role.MAGASINIER, Role.SECURITE] })
      .orderBy('u.nom', 'ASC')
      .getMany();
  }

  /** Activer / désactiver un utilisateur.
   *  EXPEDITEUR_ADMIN : portée société entière (tous les FILIERE_ADMIN).
   *  FILIERE_ADMIN    : portée filière partagée (MAGASINIER / SECURITE).
   */
  async toggleUserActive(
    expediteurCompanyId: string,
    callerUserId: string,
    targetUserId: string,
    callerRole: Role,
  ) {
    const target = await this.userRepo.findOne({
      where: { id: targetUserId, company: { id: expediteurCompanyId } },
      relations: ['filieres'],
    });
    if (!target) throw new NotFoundException('Utilisateur introuvable');

    if (callerRole !== Role.EXPEDITEUR_ADMIN) {
      const caller = await this.userRepo.findOne({
        where: { id: callerUserId },
        relations: ['filieres'],
      });
      const callerFiliereIds = (caller?.filieres ?? []).map((f) => f.id);
      const targetFiliereIds = (target.filieres ?? []).map((f) => f.id);
      if (!callerFiliereIds.some((id) => targetFiliereIds.includes(id))) {
        throw new ForbiddenException('Accès interdit');
      }
    }

    await this.userRepo.update(targetUserId, { isActive: !target.isActive });
    return this.userRepo.findOne({ where: { id: targetUserId }, relations: ['filieres'] });
  }

  /** Supprimer un compte FILIERE_ADMIN de la société (EXPEDITEUR_ADMIN uniquement) */
  async deleteFiliereAdmin(expediteurCompanyId: string, targetUserId: string) {
    const target = await this.userRepo.findOne({
      where: { id: targetUserId, company: { id: expediteurCompanyId }, role: Role.FILIERE_ADMIN },
    });
    if (!target) throw new NotFoundException('Admin filière introuvable');
    return this.userRepo.remove(target);
  }

  /** Supprimer un compte MAGASINIER ou SECURITE (par FILIERE_ADMIN, scopé à sa filière)
   *  ou FILIERE_ADMIN (par EXPEDITEUR_ADMIN). */
  async deleteWorker(
    expediteurCompanyId: string,
    callerUserId: string,
    targetUserId: string,
    callerRole: Role,
  ) {
    if (callerRole === Role.EXPEDITEUR_ADMIN) {
      return this.deleteFiliereAdmin(expediteurCompanyId, targetUserId);
    }
    const target = await this.userRepo.findOne({
      where: { id: targetUserId, company: { id: expediteurCompanyId } },
      relations: ['filieres'],
    });
    if (!target) throw new NotFoundException('Utilisateur introuvable');
    if (target.role !== Role.MAGASINIER && target.role !== Role.SECURITE) {
      throw new ForbiddenException('Action non autorisée');
    }
    const caller = await this.userRepo.findOne({ where: { id: callerUserId }, relations: ['filieres'] });
    const callerFiliereIds = (caller?.filieres ?? []).map((f) => f.id);
    const targetFiliereIds = (target.filieres ?? []).map((f) => f.id);
    if (!callerFiliereIds.some((id) => targetFiliereIds.includes(id))) {
      throw new ForbiddenException('Accès interdit');
    }
    return this.userRepo.remove(target);
  }

  /** Profil de l'utilisateur courant */
  async getMyProfile(userId: string) {
    return this.userRepo.findOne({ where: { id: userId }, relations: ['filieres', 'company'] });
  }

  /** Mise à jour du profil (nom, prénom, mot de passe optionnel) */
  async updateMyProfile(userId: string, dto: { prenom?: string; nom?: string; newPassword?: string }) {
    const updateData: any = {};
    if (dto.prenom !== undefined) updateData.prenom = dto.prenom;
    if (dto.nom !== undefined) updateData.nom = dto.nom;
    if (dto.newPassword) {
      updateData.password = await bcrypt.hash(dto.newPassword, 10);
    }
    if (Object.keys(updateData).length) {
      await this.userRepo.update(userId, updateData);
    }
    return this.userRepo.findOne({ where: { id: userId }, relations: ['filieres', 'company'] });
  }

  /** Quais dédiés à la société expéditrice */
  async getMyQuais(expediteurCompanyId: string) {
    const societe = await this.getMySociete(expediteurCompanyId);
    return this.quaiRepo.find({
      where: { societeExpeditrice: { id: societe.id } },
      relations: ['filiere'],
      order: { nom: 'ASC' },
    });
  }

  /** Quais accessibles à un MAGASINIER/SECURITE — cherche via ses filières */
  async getMyQuaisForFiliere(userId: string) {
    const filiereIds = await this.getFiliereIds(userId);
    if (!filiereIds.length) return [];
    return this.quaiRepo.find({
      where: { filiere: { id: In(filiereIds) } },
      relations: ['filiere'],
      order: { nom: 'ASC' },
    });
  }

  /** Dashboard : stats du jour */
  async getDashboard(expediteurCompanyId: string) {
    const societe = await this.getMySociete(expediteurCompanyId);
    const today = new Date().toISOString().split('T')[0];

    const [totalBls, blsAujourdhui, users, quais] = await Promise.all([
      this.blRepo.count({ where: { societeExpeditrice: { id: societe.id } } }),
      this.blRepo.count({ where: { societeExpeditrice: { id: societe.id }, datelivraison: today as any } }),
      this.userRepo.count({ where: { company: { id: expediteurCompanyId } } }),
      this.quaiRepo.count({ where: { societeExpeditrice: { id: societe.id } } }),
    ]);

    return {
      societe: { id: societe.id, nom: societe.nom, couleur: societe.couleur, code: societe.code },
      filieres: societe.filieres.length,
      quais,
      users,
      totalBls,
      blsAujourdhui,
    };
  }

  /** Tous les camions des plans validés pour les dates où la société a des BLs chargés.
   *  Retourne l'ensemble du plan journalier (tous les camions, tous les BLs). */
  async getMyValidatedPlans(expediteurCompanyId: string, date?: string) {
    const societe = await this.getMySociete(expediteurCompanyId);

    const qb = this.loadingPlanRepo.createQueryBuilder('lp')
      .innerJoinAndSelect('lp.truck', 'truck')
      .leftJoinAndSelect('lp.bonsLivraison', 'bl')
      .leftJoinAndSelect('bl.filiere', 'filiere')
      .leftJoinAndSelect('bl.societeExpeditrice', 'se')
      .leftJoinAndSelect('lp.validatedBy', 'validatedBy')
      .where('lp.isValidated = true')
      .andWhere(
        `lp."dateLivraison" IN (
          SELECT DISTINCT lp2."dateLivraison"
          FROM loading_plans lp2
          INNER JOIN bons_livraison bl2 ON bl2."loadingPlanId" = lp2.id
          WHERE bl2."societeExpeditriceId" = :sid
            AND lp2."isValidated" = true
        )`,
      )
      .setParameter('sid', societe.id)
      .orderBy('lp.dateLivraison', 'DESC')
      .addOrderBy('lp.reference', 'ASC');

    if (date) qb.andWhere('lp.dateLivraison = :date', { date });
    return qb.getMany();
  }

  /** Plans validés pour un FILIERE_ADMIN — uniquement les BLs de sa filière chargés dans chaque camion */
  async getValidatedPlansForFiliere(_expediteurCompanyId: string, callerUserId: string, date?: string) {
    const filiereIds = await this.getFiliereIds(callerUserId);
    if (!filiereIds.length) return [];

    const qb = this.loadingPlanRepo.createQueryBuilder('lp')
      .innerJoinAndSelect('lp.truck', 'truck')
      .leftJoinAndSelect('lp.bonsLivraison', 'bl', 'bl."filiereId" IN (:...fliIds)')
      .leftJoinAndSelect('bl.filiere', 'filiere')
      .leftJoinAndSelect('bl.societeExpeditrice', 'se')
      .leftJoinAndSelect('lp.validatedBy', 'validatedBy')
      .where('lp.isValidated = true')
      .andWhere((qb2) => {
        const sub = qb2.subQuery()
          .select('1')
          .from('bons_livraison', 'bl2')
          .where('bl2."loadingPlanId" = lp.id')
          .andWhere('bl2."filiereId" IN (:...fliIds)')
          .getQuery();
        return `EXISTS (${sub})`;
      })
      .setParameter('fliIds', filiereIds)
      .orderBy('lp.dateLivraison', 'DESC')
      .addOrderBy('lp.reference', 'ASC');

    if (date) qb.andWhere('lp.dateLivraison = :date', { date });
    return qb.getMany();
  }

  /** Met à jour les infos de la société (nom, adresse, telephone, couleur) */
  async updateMySociete(expediteurCompanyId: string, dto: Partial<SocieteExpeditrice>) {
    const societe = await this.getMySociete(expediteurCompanyId);
    await this.societeRepo.update(societe.id, {
      nom: dto.nom,
      adresse: dto.adresse,
      telephone: dto.telephone,
      couleur: dto.couleur,
    });
    return this.getMySociete(expediteurCompanyId);
  }

  // ── Gestion des filières ──────────────────────────────────────────────────

  async createFiliere(expediteurCompanyId: string, dto: { nom: string; code: string }) {
    const societe = await this.getMySociete(expediteurCompanyId);
    return this.filiereRepo.save(
      this.filiereRepo.create({ nom: dto.nom, code: dto.code, societeExpeditrice: { id: societe.id } as any }),
    );
  }

  async updateFiliere(expediteurCompanyId: string, filiereId: string, dto: { nom?: string; code?: string }) {
    const societe = await this.getMySociete(expediteurCompanyId);
    const filiere = await this.filiereRepo.findOne({
      where: { id: filiereId, societeExpeditrice: { id: societe.id } },
    });
    if (!filiere) throw new ForbiddenException('Filière introuvable ou accès refusé');
    if (dto.nom !== undefined) filiere.nom = dto.nom;
    if (dto.code !== undefined) filiere.code = dto.code;
    return this.filiereRepo.save(filiere);
  }

  async deleteFiliere(expediteurCompanyId: string, filiereId: string) {
    const societe = await this.getMySociete(expediteurCompanyId);
    const filiere = await this.filiereRepo.findOne({
      where: { id: filiereId, societeExpeditrice: { id: societe.id } },
    });
    if (!filiere) throw new ForbiddenException('Filière introuvable ou accès refusé');
    return this.filiereRepo.remove(filiere);
  }

  // ── Gestion des quais ─────────────────────────────────────────────────────

  async createQuai(expediteurCompanyId: string, dto: { nom: string; filiereId?: string }) {
    const societe = await this.getMySociete(expediteurCompanyId);
    return this.quaiRepo.save(
      this.quaiRepo.create({
        nom: dto.nom,
        isActive: true,
        societeExpeditrice: { id: societe.id } as any,
        company: null,
        filiere: dto.filiereId ? { id: dto.filiereId } as any : null,
      }),
    );
  }

  async updateQuai(
    expediteurCompanyId: string,
    quaiId: string,
    dto: { nom?: string; isActive?: boolean; filiereId?: string | null },
  ) {
    const societe = await this.getMySociete(expediteurCompanyId);
    const quai = await this.quaiRepo.findOne({
      where: { id: quaiId, societeExpeditrice: { id: societe.id } },
    });
    if (!quai) throw new ForbiddenException('Quai introuvable ou accès refusé');
    if (dto.nom !== undefined) quai.nom = dto.nom;
    if (dto.isActive !== undefined) quai.isActive = dto.isActive;
    if ('filiereId' in dto) (quai as any).filiere = dto.filiereId ? { id: dto.filiereId } : null;
    return this.quaiRepo.save(quai);
  }

  async deleteQuai(expediteurCompanyId: string, quaiId: string) {
    const societe = await this.getMySociete(expediteurCompanyId);
    const quai = await this.quaiRepo.findOne({
      where: { id: quaiId, societeExpeditrice: { id: societe.id } },
    });
    if (!quai) throw new ForbiddenException('Quai introuvable ou accès refusé');
    return this.quaiRepo.remove(quai);
  }

  // ── Gestion des quais par FILIERE_ADMIN ──────────────────────────────────

  async createQuaiForFiliere(userId: string, dto: { nom: string; filiereId?: string; capacite?: number }) {
    const filiereIds = await this.getFiliereIds(userId);
    if (!filiereIds.length) throw new ForbiddenException('Aucune filière associée');
    const targetFiliereId = dto.filiereId ?? filiereIds[0];
    if (!filiereIds.includes(targetFiliereId)) throw new ForbiddenException('Filière non autorisée');
    const filiere = await this.filiereRepo.findOne({
      where: { id: targetFiliereId },
      relations: ['societeExpeditrice'],
    });
    if (!filiere) throw new NotFoundException('Filière introuvable');
    return this.quaiRepo.save(
      this.quaiRepo.create({
        nom: dto.nom,
        isActive: true,
        societeExpeditrice: { id: filiere.societeExpeditrice.id } as any,
        company: null,
        filiere: { id: targetFiliereId } as any,
      }),
    );
  }

  async updateQuaiForFiliere(
    userId: string,
    quaiId: string,
    dto: { nom?: string; isActive?: boolean; filiereId?: string | null },
  ) {
    const filiereIds = await this.getFiliereIds(userId);
    if (!filiereIds.length) throw new ForbiddenException('Aucune filière associée');
    const quai = await this.quaiRepo.findOne({
      where: { id: quaiId },
      relations: ['filiere'],
    });
    if (!quai) throw new NotFoundException('Quai introuvable');
    if (quai.filiere && !filiereIds.includes(quai.filiere.id))
      throw new ForbiddenException('Accès refusé à ce quai');
    if (dto.nom !== undefined) quai.nom = dto.nom;
    if (dto.isActive !== undefined) quai.isActive = dto.isActive;
    if ('filiereId' in dto) {
      if (dto.filiereId && !filiereIds.includes(dto.filiereId))
        throw new ForbiddenException('Filière non autorisée');
      (quai as any).filiere = dto.filiereId ? { id: dto.filiereId } : null;
    }
    return this.quaiRepo.save(quai);
  }

  async deleteQuaiForFiliere(userId: string, quaiId: string) {
    const filiereIds = await this.getFiliereIds(userId);
    const quai = await this.quaiRepo.findOne({ where: { id: quaiId }, relations: ['filiere'] });
    if (!quai) throw new NotFoundException('Quai introuvable');
    if (quai.filiere && !filiereIds.includes(quai.filiere.id))
      throw new ForbiddenException('Accès refusé à ce quai');
    return this.quaiRepo.remove(quai);
  }

  /** Tableau de bord du magasinier — stats du jour filtrées sur sa filière */
  async getMagasinierDashboard(expediteurCompanyId: string, userId: string) {
    const today = new Date().toISOString().split('T')[0];
    const plans = await this.getValidatedPlansForFiliere(expediteurCompanyId, userId, today);

    const allBls = plans.flatMap((p) => p.bonsLivraison ?? []);
    const totalBls = allBls.length;
    const tonnage = allBls.reduce((s, bl) => s + Number((bl as any).tonnageTotal ?? 0), 0);

    const statsMap: Record<string, { nom: string; code: string; count: number; tonnage: number }> = {};
    for (const bl of allBls) {
      const key = (bl as any).filiere?.id ?? '__none__';
      if (!statsMap[key]) {
        statsMap[key] = {
          nom: (bl as any).filiere?.nom ?? '—',
          code: (bl as any).filiere?.code ?? '—',
          count: 0,
          tonnage: 0,
        };
      }
      statsMap[key].count++;
      statsMap[key].tonnage += Number((bl as any).tonnageTotal ?? 0);
    }

    return {
      trucks: plans.length,
      totalBls,
      tonnage,
      filiereStats: Object.values(statsMap),
    };
  }

  // ── Gestion de la société logistique ──────────────────────────────────────

  /** Retourne la société logistique liée + son admin + invitation en attente */
  async getMyLogistique(expediteurCompanyId: string) {
    const expediteur = await this.companyRepo.findOne({
      where: { id: expediteurCompanyId },
      relations: ['logistiqueCompany'],
    });
    if (!expediteur) throw new NotFoundException('Société expéditrice introuvable');

    const logistique = expediteur.logistiqueCompany ?? null;
    if (!logistique) return { company: null, adminUser: null, pendingInvitation: false };

    const [adminUser, pendingInvitation] = await Promise.all([
      this.userRepo.findOne({
        where: { company: { id: logistique.id }, role: Role.LOGISTIC_ADMIN },
      }),
      this.invitationRepo.findOne({
        where: { company: { id: logistique.id }, role: Role.LOGISTIC_ADMIN, isUsed: false },
      }),
    ]);

    return {
      company: logistique,
      adminUser: adminUser ? {
        id: adminUser.id,
        prenom: adminUser.prenom,
        nom: adminUser.nom,
        email: adminUser.email,
        isActive: adminUser.isActive,
      } : null,
      pendingInvitation: !!pendingInvitation,
    };
  }

  /** Crée la société logistique et invite son responsable */
  async setupLogistique(
    expediteurCompanyId: string,
    dto: { companyNom: string; adresse?: string; telephone?: string; adminEmail: string },
  ) {
    const expediteur = await this.companyRepo.findOne({
      where: { id: expediteurCompanyId },
      relations: ['logistiqueCompany'],
    });
    if (!expediteur) throw new NotFoundException('Société expéditrice introuvable');
    if (expediteur.logistiqueCompany)
      throw new BadRequestException('Une société logistique est déjà liée à votre compte');

    const existingNom = await this.companyRepo.findOne({ where: { nom: dto.companyNom } });
    if (existingNom) throw new BadRequestException(`Une société avec le nom "${dto.companyNom}" existe déjà`);

    const existingUser = await this.userRepo.findOne({ where: { email: dto.adminEmail } });
    if (existingUser) throw new BadRequestException('Un compte existe déjà pour cet email');

    // Créer la Company LOGISTIQUE
    const logistique = await this.companyRepo.save(
      this.companyRepo.create({
        nom: dto.companyNom,
        adresse: dto.adresse,
        telephone: dto.telephone,
        type: CompanyType.LOGISTIQUE,
        isActive: true,
      }),
    );

    // Lier l'expéditeur à la logistique
    await this.companyRepo.update(expediteurCompanyId, {
      logistiqueCompany: { id: logistique.id },
    } as any);

    // Créer l'invitation pour le LOGISTIC_ADMIN
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(rawToken, 8);
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72h

    await this.invitationRepo.save(
      this.invitationRepo.create({
        email: dto.adminEmail,
        role: Role.LOGISTIC_ADMIN,
        token: hashedToken,
        expiresAt,
        company: { id: logistique.id },
      }),
    );

    const frontUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
    const mailResult = await this.mailService.sendInvitation(
      dto.adminEmail, logistique.nom, Role.LOGISTIC_ADMIN, rawToken, frontUrl,
    );

    return { company: logistique, ...mailResult };
  }

  /** Renvoie l'invitation au responsable logistique */
  async resendLogistiqueInvitation(expediteurCompanyId: string) {
    const expediteur = await this.companyRepo.findOne({
      where: { id: expediteurCompanyId },
      relations: ['logistiqueCompany'],
    });
    if (!expediteur?.logistiqueCompany)
      throw new NotFoundException('Aucune société logistique liée');

    const invitation = await this.invitationRepo.findOne({
      where: {
        company: { id: expediteur.logistiqueCompany.id },
        role: Role.LOGISTIC_ADMIN,
        isUsed: false,
      },
    });
    if (!invitation) throw new NotFoundException('Aucune invitation en attente');

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(rawToken, 8);
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
    await this.invitationRepo.update(invitation.id, { token: hashedToken, expiresAt });

    const frontUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
    const mailResult = await this.mailService.sendInvitation(
      invitation.email, expediteur.logistiqueCompany.nom, Role.LOGISTIC_ADMIN, rawToken, frontUrl,
    );
    return mailResult;
  }
}
