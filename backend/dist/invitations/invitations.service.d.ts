import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Invitation } from './invitation.entity';
import { User } from '../users/user.entity';
import { MailService } from '../mail/mail.service';
import { Role } from '../common/enums/role.enum';
export declare class InvitationsService {
    private repo;
    private userRepo;
    private mailService;
    private config;
    constructor(repo: Repository<Invitation>, userRepo: Repository<User>, mailService: MailService, config: ConfigService);
    create(dto: {
        email: string;
        role: Role;
    }, companyId: string, companyNom: string, callerRole: Role): Promise<{
        preview: string;
        messageId?: undefined;
        message: string;
    } | {
        messageId: any;
        preview?: undefined;
        message: string;
    }>;
    verify(rawToken: string): Promise<{
        email: string;
        role: Role;
        company: import("../companies/company.entity").Company;
    }>;
    accept(rawToken: string, dto: {
        nom: string;
        prenom: string;
        password: string;
    }): Promise<{
        message: string;
    }>;
    findAll(companyId: string): Promise<Invitation[]>;
    resend(id: string, callerCompanyId: string, callerRole: Role, companyNom: string): Promise<{
        preview: string;
        messageId?: undefined;
        message: string;
    } | {
        messageId: any;
        preview?: undefined;
        message: string;
    }>;
    remove(id: string, callerCompanyId: string, callerRole: Role): Promise<import("typeorm").DeleteResult>;
    private findByRawToken;
}
