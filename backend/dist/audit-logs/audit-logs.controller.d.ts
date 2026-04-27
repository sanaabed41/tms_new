import { Repository } from 'typeorm';
import { AuditLogsService } from './audit-logs.service';
import { AuditLog } from './audit-log.entity';
import { User } from '../users/user.entity';
import { Company } from '../companies/company.entity';
import { BonLivraison } from '../bons-livraison/bon-livraison.entity';
export declare class AuditLogsController {
    private readonly service;
    private userRepo;
    private companyRepo;
    private blRepo;
    private logRepo;
    constructor(service: AuditLogsService, userRepo: Repository<User>, companyRepo: Repository<Company>, blRepo: Repository<BonLivraison>, logRepo: Repository<AuditLog>);
    findAll(companyId?: string, action?: string, fromDate?: string, toDate?: string, search?: string): Promise<AuditLog[]>;
    getStats(): Promise<{
        companies: {
            total: number;
            active: number;
            inactive: number;
        };
        users: {
            total: number;
            active: number;
            inactive: number;
        };
        bls: {
            total: number;
        };
        logins: {
            today: number;
            week: number;
        };
        recentLogs: AuditLog[];
    }>;
}
