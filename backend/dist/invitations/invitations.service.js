"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvitationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcryptjs"));
const crypto = __importStar(require("crypto"));
const invitation_entity_1 = require("./invitation.entity");
const user_entity_1 = require("../users/user.entity");
const filiere_entity_1 = require("../expediteurs/filiere.entity");
const delivery_company_entity_1 = require("../delivery-companies/delivery-company.entity");
const mail_service_1 = require("../mail/mail.service");
const role_enum_1 = require("../common/enums/role.enum");
const EXPEDITEUR_ADMIN_ROLES = [role_enum_1.Role.EXPEDITEUR_ADMIN, role_enum_1.Role.FILIERE_ADMIN];
const FILIERE_ADMIN_ROLES = [role_enum_1.Role.MAGASINIER, role_enum_1.Role.SECURITE];
const LOGISTIC_ADMIN_ROLES = [role_enum_1.Role.TRANSPORT_ADMIN];
let InvitationsService = class InvitationsService {
    repo;
    userRepo;
    filiereRepo;
    deliveryCompanyRepo;
    mailService;
    config;
    constructor(repo, userRepo, filiereRepo, deliveryCompanyRepo, mailService, config) {
        this.repo = repo;
        this.userRepo = userRepo;
        this.filiereRepo = filiereRepo;
        this.deliveryCompanyRepo = deliveryCompanyRepo;
        this.mailService = mailService;
        this.config = config;
    }
    async create(dto, companyId, companyNom, callerRole) {
        if (callerRole === role_enum_1.Role.EXPEDITEUR_ADMIN && !EXPEDITEUR_ADMIN_ROLES.includes(dto.role)) {
            throw new common_1.ForbiddenException('Vous n\'êtes pas autorisé à inviter ce rôle');
        }
        if (callerRole === role_enum_1.Role.FILIERE_ADMIN && !FILIERE_ADMIN_ROLES.includes(dto.role)) {
            throw new common_1.ForbiddenException('Vous n\'êtes pas autorisé à inviter ce rôle');
        }
        const existingUser = await this.userRepo.findOne({ where: { email: dto.email } });
        if (existingUser)
            throw new common_1.BadRequestException('Un compte existe déjà pour cet email');
        const rawPassword = this.generatePassword();
        const hashed = await bcrypt.hash(rawPassword, 10);
        let deliveryCompanyId = null;
        if (dto.role === role_enum_1.Role.TRANSPORT_ADMIN && dto.deliveryCompanyNom) {
            const newDc = await this.deliveryCompanyRepo.save(this.deliveryCompanyRepo.create({
                nom: dto.deliveryCompanyNom,
                company: { id: companyId },
            }));
            deliveryCompanyId = newDc.id;
        }
        const filieres = dto.filiereIds?.length
            ? await this.filiereRepo.findBy({ id: (0, typeorm_2.In)(dto.filiereIds) })
            : [];
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
        const appUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
        const mailResult = await this.mailService.sendCredentials(dto.email, dto.prenom, dto.nom, rawPassword, dto.role, companyNom, appUrl);
        return { message: `Compte créé et identifiants envoyés à ${dto.email}`, ...mailResult };
    }
    generatePassword() {
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
    async verify(rawToken) {
        const invitation = await this.findByRawToken(rawToken);
        if (!invitation)
            throw new common_1.NotFoundException('Invitation invalide ou expirée');
        if (invitation.isUsed)
            throw new common_1.BadRequestException('Cette invitation a déjàété utilisée');
        if (invitation.expiresAt < new Date())
            throw new common_1.BadRequestException('Invitation expirée');
        return {
            email: invitation.email,
            role: invitation.role,
            company: invitation.company,
        };
    }
    async accept(rawToken, dto) {
        const invitation = await this.findByRawToken(rawToken);
        if (!invitation)
            throw new common_1.NotFoundException('Invitation invalide ou expirée');
        if (invitation.isUsed)
            throw new common_1.BadRequestException('Cette invitation a déjàété utilisée');
        if (invitation.expiresAt < new Date())
            throw new common_1.BadRequestException('Invitation expirée');
        const hashed = await bcrypt.hash(dto.password, 10);
        const filieres = invitation.filiereIds?.length
            ? await this.filiereRepo.findBy({ id: (0, typeorm_2.In)(invitation.filiereIds) })
            : [];
        let deliveryCompanyId = null;
        if (invitation.role === role_enum_1.Role.TRANSPORT_ADMIN && invitation.deliveryCompanyNom) {
            const newDc = await this.deliveryCompanyRepo.save(this.deliveryCompanyRepo.create({
                nom: invitation.deliveryCompanyNom,
                company: { id: invitation.company.id },
            }));
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
    findAll(companyId) {
        return this.repo.find({
            where: { company: { id: companyId } },
            order: { createdAt: 'DESC' },
        });
    }
    async resend(id, callerCompanyId, callerRole, companyNom) {
        const inv = await this.repo.findOne({ where: { id }, relations: ['company'] });
        if (!inv)
            throw new common_1.NotFoundException('Invitation non trouvée');
        if (callerRole !== role_enum_1.Role.SUPER_ADMIN && inv.company.id !== callerCompanyId) {
            throw new common_1.ForbiddenException('Accès interdit');
        }
        const user = await this.userRepo.findOne({ where: { email: inv.email } });
        if (!user)
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        const rawPassword = this.generatePassword();
        const hashed = await bcrypt.hash(rawPassword, 10);
        await this.userRepo.update(user.id, { password: hashed });
        const appUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
        const mailResult = await this.mailService.sendCredentials(user.email, user.prenom, user.nom, rawPassword, user.role, companyNom, appUrl);
        return { message: 'Nouveaux identifiants envoyés', ...mailResult };
    }
    async remove(id, callerCompanyId, callerRole) {
        const inv = await this.repo.findOne({ where: { id }, relations: ['company'] });
        if (!inv)
            throw new common_1.NotFoundException('Invitation non trouvée');
        if (callerRole !== role_enum_1.Role.SUPER_ADMIN && inv.company.id !== callerCompanyId) {
            throw new common_1.ForbiddenException('Accès interdit');
        }
        return this.repo.delete(id);
    }
    async findByRawToken(rawToken) {
        const invitations = await this.repo.find({ relations: ['company'] });
        for (const inv of invitations) {
            const match = await bcrypt.compare(rawToken, inv.token);
            if (match)
                return inv;
        }
        return null;
    }
};
exports.InvitationsService = InvitationsService;
exports.InvitationsService = InvitationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(invitation_entity_1.Invitation)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(filiere_entity_1.Filiere)),
    __param(3, (0, typeorm_1.InjectRepository)(delivery_company_entity_1.DeliveryCompany)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        mail_service_1.MailService,
        config_1.ConfigService])
], InvitationsService);
//# sourceMappingURL=invitations.service.js.map