import { Company } from '../companies/company.entity';
import { Role } from '../common/enums/role.enum';
import { Filiere } from '../expediteurs/filiere.entity';
import { DeliveryCompany } from '../delivery-companies/delivery-company.entity';
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
    deliveryCompany?: DeliveryCompany | null;
    filieres: Filiere[];
}
