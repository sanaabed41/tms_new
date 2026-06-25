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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcryptjs"));
const crypto = __importStar(require("crypto"));
const users_service_1 = require("../users/users.service");
const user_entity_1 = require("../users/user.entity");
const company_entity_1 = require("../companies/company.entity");
const societe_expeditrice_entity_1 = require("../expediteurs/societe-expeditrice.entity");
const company_type_enum_1 = require("../common/enums/company-type.enum");
const role_enum_1 = require("../common/enums/role.enum");
const mail_service_1 = require("../mail/mail.service");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
let AuthService = class AuthService {
    usersService;
    jwtService;
    config;
    mailService;
    auditLogs;
    userRepo;
    companyRepo;
    societeRepo;
    constructor(usersService, jwtService, config, mailService, auditLogs, userRepo, companyRepo, societeRepo) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.config = config;
        this.mailService = mailService;
        this.auditLogs = auditLogs;
        this.userRepo = userRepo;
        this.companyRepo = companyRepo;
        this.societeRepo = societeRepo;
    }
    async register(dto) {
        const existing = await this.userRepo.findOne({ where: { email: dto.email } });
        if (existing)
            throw new common_1.BadRequestException('Cet email est déjà utilisé');
        const existingCompany = await this.companyRepo.findOne({ where: { nom: dto.companyNom } });
        if (existingCompany)
            throw new common_1.BadRequestException('Une société avec ce nom existe déjà');
        const company = await this.companyRepo.save(this.companyRepo.create({
            nom: dto.companyNom,
            type: dto.companyType,
            code: dto.code,
            couleur: dto.couleur,
            isActive: true,
        }));
        if (dto.companyType === company_type_enum_1.CompanyType.EXPEDITEUR) {
            await this.societeRepo.save(this.societeRepo.create({
                nom: dto.companyNom,
                code: dto.code,
                expediteurCompany: { id: company.id },
            }));
        }
        const role = dto.companyType === company_type_enum_1.CompanyType.EXPEDITEUR
            ? role_enum_1.Role.EXPEDITEUR_ADMIN
            : role_enum_1.Role.LOGISTIC_ADMIN;
        const hashed = await bcrypt.hash(dto.password, 10);
        const user = await this.userRepo.save(this.userRepo.create({
            prenom: dto.prenom,
            nom: dto.nom,
            email: dto.email,
            password: hashed,
            role,
            isActive: true,
            company: { id: company.id },
        }));
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
    async login(email, password, ip) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            await this.auditLogs.log({
                action: 'LOGIN_FAILED',
                actorEmail: email,
                ip,
                metadata: { reason: 'email_not_found' },
            });
            throw new common_1.UnauthorizedException('Email ou mot de passe incorrect');
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
            throw new common_1.UnauthorizedException('Compte inactif — contactez votre administrateur');
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
            throw new common_1.UnauthorizedException('Compte non activé — vérifiez votre email d\'invitation');
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
            throw new common_1.UnauthorizedException('Email ou mot de passe incorrect');
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
            companyType: user.company?.type,
            deliveryCompanyId: user.deliveryCompany?.id ?? null,
        };
        const withFilieres = [role_enum_1.Role.FILIERE_ADMIN, role_enum_1.Role.MAGASINIER, role_enum_1.Role.SECURITE].includes(user.role);
        const filieres = withFilieres
            ? (await this.userRepo.findOne({ where: { id: user.id }, relations: ['filieres'] }))?.filieres ?? []
            : [];
        return {
            access_token: this.jwtService.sign(payload),
            user: { id: user.id, nom: user.nom, prenom: user.prenom, email: user.email, role: user.role, company: user.company, filieres },
        };
    }
    async profile(userId) {
        return this.usersService.findOne(userId);
    }
    async forgotPassword(email) {
        const user = await this.usersService.findByEmail(email);
        if (!user || !user.isActive)
            return { message: 'Si cet email existe, un lien aété envoyé.' };
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
    async verifyResetToken(token) {
        const users = await this.userRepo.find({ where: { isActive: true } });
        const user = await this.findUserByRawToken(users, token, 'resetPasswordToken');
        if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
            throw new common_1.BadRequestException('Lien invalide ou expiré');
        }
        return { valid: true, email: user.email };
    }
    async resetPassword(token, newPassword) {
        const users = await this.userRepo.find({ where: { isActive: true } });
        const user = await this.findUserByRawToken(users, token, 'resetPasswordToken');
        if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
            throw new common_1.BadRequestException('Lien invalide ou expiré');
        }
        const hashed = await bcrypt.hash(newPassword, 10);
        await this.userRepo.update(user.id, {
            password: hashed,
            resetPasswordToken: null,
            resetPasswordExpires: null,
        });
        return { message: 'Mot de passe réinitialisé avec succès' };
    }
    async findUserByRawToken(users, rawToken, field) {
        for (const user of users) {
            if (!user[field])
                continue;
            const match = await bcrypt.compare(rawToken, user[field]);
            if (match)
                return user;
        }
        return null;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(5, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(6, (0, typeorm_1.InjectRepository)(company_entity_1.Company)),
    __param(7, (0, typeorm_1.InjectRepository)(societe_expeditrice_entity_1.SocieteExpeditrice)),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        mail_service_1.MailService,
        audit_logs_service_1.AuditLogsService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AuthService);
//# sourceMappingURL=auth.service.js.map