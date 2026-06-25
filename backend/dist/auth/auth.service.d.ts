import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { Company } from '../companies/company.entity';
import { SocieteExpeditrice } from '../expediteurs/societe-expeditrice.entity';
import { CompanyType } from '../common/enums/company-type.enum';
import { Role } from '../common/enums/role.enum';
import { MailService } from '../mail/mail.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
export declare class AuthService {
    private usersService;
    private jwtService;
    private config;
    private mailService;
    private auditLogs;
    private userRepo;
    private companyRepo;
    private societeRepo;
    constructor(usersService: UsersService, jwtService: JwtService, config: ConfigService, mailService: MailService, auditLogs: AuditLogsService, userRepo: Repository<User>, companyRepo: Repository<Company>, societeRepo: Repository<SocieteExpeditrice>);
    register(dto: {
        companyNom: string;
        companyType: CompanyType;
        code?: string;
        couleur?: string;
        prenom: string;
        nom: string;
        email: string;
        password: string;
    }): Promise<{
        access_token: string;
        user: {
            company: Company;
            id: string;
            nom: string;
            prenom: string;
            email: string;
            password: string;
            role: Role;
            isActive: boolean;
            resetPasswordToken: string | null;
            resetPasswordExpires: Date | null;
            createdAt: Date;
            deliveryCompany?: import("../delivery-companies/delivery-company.entity").DeliveryCompany | null;
            filieres: import("../expediteurs/filiere.entity").Filiere[];
        };
    }>;
    login(email: string, password: string, ip?: string): Promise<{
        access_token: string;
        user: {
            id: string;
            nom: string;
            prenom: string;
            email: string;
            role: Role;
            company: Company;
            filieres: import("../expediteurs/filiere.entity").Filiere[];
        };
    }>;
    profile(userId: string): Promise<User>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    verifyResetToken(token: string): Promise<{
        valid: boolean;
        email: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
    private findUserByRawToken;
}
