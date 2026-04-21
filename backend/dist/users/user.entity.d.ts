import { Company } from '../companies/company.entity';
import { Role } from '../common/enums/role.enum';
export declare class User {
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
    company: Company;
}
