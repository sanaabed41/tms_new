import { ExpediteursPortalService } from './expediteur-portal.service';
export declare class ExpediteursPortalController {
    private readonly service;
    constructor(service: ExpediteursPortalService);
    dashboard(user: any): Promise<{
        societe: {
            id: string;
            nom: string;
            couleur: string;
            code: string;
        };
        filieres: number;
        quais: number;
        users: number;
        totalBls: number;
        blsAujourdhui: number;
    }>;
    getMySociete(user: any): Promise<import("../expediteurs/societe-expeditrice.entity").SocieteExpeditrice>;
    updateMySociete(user: any, dto: any): Promise<import("../expediteurs/societe-expeditrice.entity").SocieteExpeditrice>;
    getMagasinierDashboard(user: any): Promise<{
        trucks: number;
        totalBls: number;
        tonnage: number;
        filiereStats: {
            nom: string;
            code: string;
            count: number;
            tonnage: number;
        }[];
    }>;
    getMyPlanning(user: any, date?: string): Promise<import("../loading-plans/loading-plan.entity").LoadingPlan[]>;
    getMyProfile(user: any): Promise<import("../users/user.entity").User | null>;
    updateMyProfile(user: any, dto: any): Promise<import("../users/user.entity").User | null>;
    getMyBls(user: any, date?: string): Promise<import("../bons-livraison/bon-livraison.entity").BonLivraison[]>;
    getMyUsers(user: any): Promise<import("../users/user.entity").User[]>;
    toggleUserActive(user: any, id: string): Promise<import("../users/user.entity").User | null>;
    deleteUser(user: any, id: string): Promise<import("../users/user.entity").User>;
    getMyQuais(user: any): Promise<import("../quais/quai.entity").Quai[]>;
    getMyLogistique(user: any): Promise<{
        company: null;
        adminUser: null;
        pendingInvitation: boolean;
    } | {
        company: import("../companies/company.entity").Company;
        adminUser: {
            id: string;
            prenom: string;
            nom: string;
            email: string;
            isActive: boolean;
        } | null;
        pendingInvitation: boolean;
    }>;
    setupLogistique(user: any, dto: {
        companyNom: string;
        adresse?: string;
        telephone?: string;
        adminEmail: string;
    }): Promise<{
        preview: string;
        messageId?: undefined;
        company: import("../companies/company.entity").Company;
    } | {
        messageId: any;
        preview?: undefined;
        company: import("../companies/company.entity").Company;
    }>;
    resendLogistiqueInvitation(user: any): Promise<{
        preview: string;
        messageId?: undefined;
    } | {
        messageId: any;
        preview?: undefined;
    }>;
    createFiliere(user: any, dto: {
        nom: string;
        code: string;
    }): Promise<import("../expediteurs/filiere.entity").Filiere>;
    updateFiliere(user: any, id: string, dto: {
        nom?: string;
        code?: string;
    }): Promise<import("../expediteurs/filiere.entity").Filiere>;
    deleteFiliere(user: any, id: string): Promise<import("../expediteurs/filiere.entity").Filiere>;
    createQuai(user: any, dto: {
        nom: string;
        filiereId?: string;
        capacite?: number;
    }): Promise<import("../quais/quai.entity").Quai>;
    updateQuai(user: any, id: string, dto: {
        nom?: string;
        isActive?: boolean;
        filiereId?: string | null;
        capacite?: number;
    }): Promise<import("../quais/quai.entity").Quai>;
    deleteQuai(user: any, id: string): Promise<import("../quais/quai.entity").Quai>;
}
