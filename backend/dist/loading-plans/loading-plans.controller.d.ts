import { LoadingPlansService } from './loading-plans.service';
export declare class LoadingPlansController {
    private readonly service;
    constructor(service: LoadingPlansService);
    findAll(user: any, date: string): Promise<import("./loading-plan.entity").LoadingPlan[]>;
    getHistory(user: any, dateFrom?: string, dateTo?: string): Promise<import("./loading-plan.entity").LoadingPlan[]>;
    getMagasin(user: any, date: string): Promise<import("./loading-plan.entity").LoadingPlan[]>;
    getQuaisLibres(user: any, date: string): Promise<{
        societes: any[];
        generiques: {
            id: string;
            nom: string;
            occupe: boolean;
            entryStatus: string;
            matricule: string;
        }[];
    }>;
    getSecurity(user: any, date: string): Promise<import("./loading-plan.entity").LoadingPlan[]>;
    getDayReport(user: any, date: string): Promise<import("./loading-plan.entity").LoadingPlan[]>;
    findOne(id: string): Promise<import("./loading-plan.entity").LoadingPlan>;
    create(dto: any, user: any): Promise<import("./loading-plan.entity").LoadingPlan>;
    assignBl(id: string, blId: string, user: any, force: boolean): Promise<import("./loading-plan.entity").LoadingPlan>;
    sendReport(user: any, date: string, companyNom: string): Promise<{
        sent: number;
        message: string;
        emails?: undefined;
        results?: undefined;
    } | {
        sent: number;
        emails: string[];
        results: ({
            preview: string;
            messageId?: undefined;
        } | {
            messageId: any;
            preview?: undefined;
        })[];
        message?: undefined;
    }>;
    validateAll(user: any, date: string, signature?: string): Promise<{
        validated: number;
    }>;
    removeBl(id: string, blId: string): Promise<void>;
    validate(id: string, user: any, signature?: string): Promise<import("./loading-plan.entity").LoadingPlan>;
    setArrivalTime(id: string, heureArrivee: string): Promise<import("./loading-plan.entity").LoadingPlan>;
    nextStation(id: string): Promise<import("./loading-plan.entity").LoadingPlan>;
    loadingAction(id: string, action: 'START' | 'PAUSE' | 'DONE'): Promise<import("./loading-plan.entity").LoadingPlan>;
    entryAction(id: string, action: 'CALL' | 'ENTER' | 'EXIT' | 'UNENTER', quai?: string): Promise<import("./loading-plan.entity").LoadingPlan>;
    reorderBls(id: string, blIds: string[]): Promise<import("./loading-plan.entity").LoadingPlan>;
    remove(id: string): Promise<import("typeorm").DeleteResult>;
}
