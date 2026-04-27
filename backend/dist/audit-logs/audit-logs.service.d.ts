import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';
export interface LogPayload {
    action: string;
    actorId?: string;
    actorEmail?: string;
    actorRole?: string;
    targetId?: string;
    targetEmail?: string;
    companyId?: string;
    companyNom?: string;
    ip?: string;
    metadata?: Record<string, any>;
}
export declare class AuditLogsService {
    private repo;
    constructor(repo: Repository<AuditLog>);
    log(payload: LogPayload): Promise<void>;
    findAll(filters?: {
        companyId?: string;
        action?: string;
        fromDate?: string;
        toDate?: string;
        search?: string;
        limit?: number;
    }): Promise<AuditLog[]>;
}
