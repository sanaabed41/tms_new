import { InvitationsService } from './invitations.service';
import { Role } from '../common/enums/role.enum';
export declare class InvitationsController {
    private readonly service;
    constructor(service: InvitationsService);
    verify(token: string): Promise<{
        email: string;
        role: Role;
        company: import("../companies/company.entity").Company;
    }>;
    accept(token: string, dto: {
        nom: string;
        prenom: string;
        password: string;
    }): Promise<{
        message: string;
    }>;
    findAll(user: any, companyId?: string): Promise<import("./invitation.entity").Invitation[]>;
    create(dto: {
        email: string;
        role: Role;
        nom: string;
        prenom: string;
        filiereIds?: string[];
        companyId?: string;
        deliveryCompanyNom?: string;
    }, user: any): Promise<{
        preview: string;
        messageId?: undefined;
        message: string;
    } | {
        messageId: any;
        preview?: undefined;
        message: string;
    }>;
    resend(id: string, user: any): Promise<{
        preview: string;
        messageId?: undefined;
        message: string;
    } | {
        messageId: any;
        preview?: undefined;
        message: string;
    }>;
    remove(id: string, user: any): Promise<import("typeorm").DeleteResult>;
}
