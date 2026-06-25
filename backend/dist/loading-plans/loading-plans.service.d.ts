import { Repository } from 'typeorm';
import { LoadingPlan } from './loading-plan.entity';
import { BonLivraison } from '../bons-livraison/bon-livraison.entity';
import { Truck } from '../trucks/truck.entity';
import { Quai } from '../quais/quai.entity';
export declare class LoadingPlansService {
    private repo;
    private blRepo;
    private truckRepo;
    private quaiRepo;
    constructor(repo: Repository<LoadingPlan>, blRepo: Repository<BonLivraison>, truckRepo: Repository<Truck>, quaiRepo: Repository<Quai>);
    private baseQuery;
    findAll(companyId: string, date?: string): Promise<LoadingPlan[]>;
    findHistory(companyId: string, dateFrom?: string, dateTo?: string): Promise<LoadingPlan[]>;
    findOne(id: string): Promise<LoadingPlan>;
    create(dto: any): Promise<LoadingPlan>;
    assignBl(planId: string, blId: string, _userId: string, force?: boolean): Promise<LoadingPlan>;
    removeBl(planId: string, blId: string): Promise<void>;
    validate(planId: string, userId: string, signature?: string): Promise<LoadingPlan>;
    validateAll(companyId: string, date: string, userId: string, signature?: string): Promise<{
        validated: number;
    }>;
    remove(id: string): Promise<import("typeorm").DeleteResult>;
    setArrivalTime(planId: string, heureArrivee: string): Promise<LoadingPlan>;
    loadingAction(planId: string, action: 'START' | 'PAUSE' | 'DONE'): Promise<LoadingPlan>;
    entryAction(planId: string, action: 'CALL' | 'ENTER' | 'EXIT' | 'UNENTER', quai?: string): Promise<LoadingPlan>;
    nextStation(planId: string): Promise<LoadingPlan>;
    getQuaisLibres(companyId: string, date?: string): Promise<{
        societes: any[];
        generiques: {
            id: string;
            nom: string;
            occupe: boolean;
            entryStatus: string;
            matricule: string;
        }[];
    }>;
    reorderBls(planId: string, blIds: string[]): Promise<LoadingPlan>;
    getDayReport(companyId: string, date: string): Promise<LoadingPlan[]>;
    getSecurityPlans(companyId: string, date?: string): Promise<LoadingPlan[]>;
    getMagasinPlans(companyId: string, date?: string): Promise<LoadingPlan[]>;
}
