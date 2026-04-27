import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { MailService } from '../mail/mail.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
export declare class AuthService {
    private usersService;
    private jwtService;
    private config;
    private mailService;
    private auditLogs;
    private userRepo;
    constructor(usersService: UsersService, jwtService: JwtService, config: ConfigService, mailService: MailService, auditLogs: AuditLogsService, userRepo: Repository<User>);
    login(email: string, password: string, ip?: string): Promise<{
        access_token: string;
        user: {
            id: string;
            nom: string;
            prenom: string;
            email: string;
            role: import("../common/enums/role.enum").Role;
            company: import("../companies/company.entity").Company;
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
