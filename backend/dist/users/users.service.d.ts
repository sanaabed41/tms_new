import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Role } from '../common/enums/role.enum';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Filiere } from '../expediteurs/filiere.entity';
export declare class UsersService {
    private repo;
    private filiereRepo;
    private auditLogs;
    constructor(repo: Repository<User>, filiereRepo: Repository<Filiere>, auditLogs: AuditLogsService);
    findAll(companyId?: string): Promise<User[]>;
    findOne(id: string): Promise<User>;
    setFilieres(userId: string, filiereIds: string[]): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    create(dto: any, createdBy: User): Promise<User>;
    update(id: string, dto: any, caller: {
        role: Role;
        companyId: string;
    }): Promise<User>;
    toggleActive(id: string, actor?: {
        id: string;
        email: string;
        role: string;
    }): Promise<User>;
    remove(id: string, caller: {
        role: Role;
        companyId: string;
        id?: string;
        email?: string;
    }): Promise<User>;
}
