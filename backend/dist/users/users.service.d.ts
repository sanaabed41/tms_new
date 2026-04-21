import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Role } from '../common/enums/role.enum';
export declare class UsersService {
    private repo;
    constructor(repo: Repository<User>);
    findAll(companyId?: string): Promise<User[]>;
    findOne(id: string): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    create(dto: any, createdBy: User): Promise<User[]>;
    update(id: string, dto: any, caller: {
        role: Role;
        companyId: string;
    }): Promise<User>;
    toggleActive(id: string): Promise<User>;
    remove(id: string, caller: {
        role: Role;
        companyId: string;
    }): Promise<User>;
}
