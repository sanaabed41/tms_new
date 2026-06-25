import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { SocieteExpeditrice } from '../expediteurs/societe-expeditrice.entity';
import { Filiere } from '../expediteurs/filiere.entity';
import { BonLivraison } from '../bons-livraison/bon-livraison.entity';
import { LoadingPlan } from '../loading-plans/loading-plan.entity';
import { User } from '../users/user.entity';
import { Quai } from '../quais/quai.entity';
import { Company } from '../companies/company.entity';
import { Invitation } from '../invitations/invitation.entity';
import { Role } from '../common/enums/role.enum';
import { MailService } from '../mail/mail.service';
export declare class ExpediteursPortalService {
    private societeRepo;
    private filiereRepo;
    private blRepo;
    private loadingPlanRepo;
    private userRepo;
    private quaiRepo;
    private companyRepo;
    private invitationRepo;
    private mailService;
    private config;
    constructor(societeRepo: Repository<SocieteExpeditrice>, filiereRepo: Repository<Filiere>, blRepo: Repository<BonLivraison>, loadingPlanRepo: Repository<LoadingPlan>, userRepo: Repository<User>, quaiRepo: Repository<Quai>, companyRepo: Repository<Company>, invitationRepo: Repository<Invitation>, mailService: MailService, config: ConfigService);
    private getFiliereIds;
    getMySociete(expediteurCompanyId: string): Promise<SocieteExpeditrice>;
    getMyBls(expediteurCompanyId: string, date?: string, filiereIds?: string[]): Promise<BonLivraison[]>;
    getMyBlsForFiliere(_expediteurCompanyId: string, callerUserId: string, date?: string): Promise<BonLivraison[]>;
    getMyUsers(expediteurCompanyId: string): Promise<User[]>;
    getMyUsersForFiliere(expediteurCompanyId: string, callerUserId: string): Promise<User[]>;
    toggleUserActive(expediteurCompanyId: string, callerUserId: string, targetUserId: string, callerRole: Role): Promise<User | null>;
    deleteFiliereAdmin(expediteurCompanyId: string, targetUserId: string): Promise<User>;
    deleteWorker(expediteurCompanyId: string, callerUserId: string, targetUserId: string, callerRole: Role): Promise<User>;
    getMyProfile(userId: string): Promise<User | null>;
    updateMyProfile(userId: string, dto: {
        prenom?: string;
        nom?: string;
        newPassword?: string;
    }): Promise<User | null>;
    getMyQuais(expediteurCompanyId: string): Promise<Quai[]>;
    getMyQuaisForFiliere(userId: string): Promise<Quai[]>;
    getDashboard(expediteurCompanyId: string): Promise<{
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
    getMyValidatedPlans(expediteurCompanyId: string, date?: string): Promise<LoadingPlan[]>;
    getValidatedPlansForFiliere(_expediteurCompanyId: string, callerUserId: string, date?: string): Promise<LoadingPlan[]>;
    updateMySociete(expediteurCompanyId: string, dto: Partial<SocieteExpeditrice>): Promise<SocieteExpeditrice>;
    createFiliere(expediteurCompanyId: string, dto: {
        nom: string;
        code: string;
    }): Promise<Filiere>;
    updateFiliere(expediteurCompanyId: string, filiereId: string, dto: {
        nom?: string;
        code?: string;
    }): Promise<Filiere>;
    deleteFiliere(expediteurCompanyId: string, filiereId: string): Promise<Filiere>;
    createQuai(expediteurCompanyId: string, dto: {
        nom: string;
        filiereId?: string;
    }): Promise<Quai>;
    updateQuai(expediteurCompanyId: string, quaiId: string, dto: {
        nom?: string;
        isActive?: boolean;
        filiereId?: string | null;
    }): Promise<Quai>;
    deleteQuai(expediteurCompanyId: string, quaiId: string): Promise<Quai>;
    createQuaiForFiliere(userId: string, dto: {
        nom: string;
        filiereId?: string;
        capacite?: number;
    }): Promise<Quai>;
    updateQuaiForFiliere(userId: string, quaiId: string, dto: {
        nom?: string;
        isActive?: boolean;
        filiereId?: string | null;
    }): Promise<Quai>;
    deleteQuaiForFiliere(userId: string, quaiId: string): Promise<Quai>;
    getMagasinierDashboard(expediteurCompanyId: string, userId: string): Promise<{
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
    getMyLogistique(expediteurCompanyId: string): Promise<{
        company: null;
        adminUser: null;
        pendingInvitation: boolean;
    } | {
        company: Company;
        adminUser: {
            id: string;
            prenom: string;
            nom: string;
            email: string;
            isActive: boolean;
        } | null;
        pendingInvitation: boolean;
    }>;
    setupLogistique(expediteurCompanyId: string, dto: {
        companyNom: string;
        adresse?: string;
        telephone?: string;
        adminEmail: string;
    }): Promise<{
        preview: string;
        messageId?: undefined;
        company: Company;
    } | {
        messageId: any;
        preview?: undefined;
        company: Company;
    }>;
    resendLogistiqueInvitation(expediteurCompanyId: string): Promise<{
        preview: string;
        messageId?: undefined;
    } | {
        messageId: any;
        preview?: undefined;
    }>;
}
