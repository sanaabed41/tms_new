import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { MailService } from '../mail/mail.service';
export declare class AuthService {
    private usersService;
    private jwtService;
    private config;
    private mailService;
    private userRepo;
    constructor(usersService: UsersService, jwtService: JwtService, config: ConfigService, mailService: MailService, userRepo: Repository<User>);
    login(email: string, password: string): Promise<{
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
