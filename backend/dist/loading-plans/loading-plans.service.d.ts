import { Repository } from 'typeorm';
import { LoadingPlan } from './loading-plan.entity';
import { BonLivraison } from '../bons-livraison/bon-livraison.entity';
import { Truck } from '../trucks/truck.entity';
export declare class LoadingPlansService {
    private repo;
    private blRepo;
    private truckRepo;
    constructor(repo: Repository<LoadingPlan>, blRepo: Repository<BonLivraison>, truckRepo: Repository<Truck>);
    findAll(companyId: string, date?: string): Promise<LoadingPlan[]>;
    findOne(id: string): Promise<LoadingPlan>;
    create(dto: any): Promise<LoadingPlan>;
    assignBl(planId: string, blId: string, _userId: string, force?: boolean): Promise<LoadingPlan>;
    removeBl(planId: string, blId: string): Promise<void>;
    validate(planId: string, userId: string): Promise<LoadingPlan>;
    validateAll(companyId: string, date: string, userId: string): Promise<{
        validated: number;
    }>;
    remove(id: string): Promise<import("typeorm").DeleteResult>;
}
