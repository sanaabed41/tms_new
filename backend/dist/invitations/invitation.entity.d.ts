import { Company } from '../companies/company.entity';
import { Role } from '../common/enums/role.enum';
export declare class Invitation {
    id: string;
    email: string;
    role: Role;
    token: string;
    expiresAt: Date;
    isUsed: boolean;
    createdAt: Date;
    company: Company;
}
