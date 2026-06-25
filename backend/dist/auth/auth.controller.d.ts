import type { Request } from 'express';
import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly service;
    constructor(service: AuthService);
    register(dto: {
        companyNom: string;
        companyType: string;
        code?: string;
        couleur?: string;
        prenom: string;
        nom: string;
        email: string;
        password: string;
    }): Promise<{
        access_token: string;
        user: {
            company: import("../companies/company.entity").Company;
            id: string;
            nom: string;
            prenom: string;
            email: string;
            password: string;
            role: import("../common/enums/role.enum").Role;
            isActive: boolean;
            resetPasswordToken: string | null;
            resetPasswordExpires: Date | null;
            createdAt: Date;
            deliveryCompany?: import("../delivery-companies/delivery-company.entity").DeliveryCompany | null;
            filieres: import("../expediteurs/filiere.entity").Filiere[];
        };
    }>;
    login(dto: {
        email: string;
        password: string;
    }, req: Request): Promise<{
        access_token: string;
        user: {
            id: string;
            nom: string;
            prenom: string;
            email: string;
            role: import("../common/enums/role.enum").Role;
            company: import("../companies/company.entity").Company;
            filieres: import("../expediteurs/filiere.entity").Filiere[];
        };
    }>;
    profile(user: any): Promise<import("../users/user.entity").User>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    verifyResetToken(token: string): Promise<{
        valid: boolean;
        email: string;
    }>;
    resetPassword(dto: {
        token: string;
        password: string;
    }): Promise<{
        message: string;
    }>;
}
