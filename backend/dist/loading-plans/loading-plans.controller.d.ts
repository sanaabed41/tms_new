import { LoadingPlansService } from './loading-plans.service';
export declare class LoadingPlansController {
    private readonly service;
    constructor(service: LoadingPlansService);
    findAll(user: any, date: string): Promise<import("./loading-plan.entity").LoadingPlan[]>;
    findOne(id: string): Promise<import("./loading-plan.entity").LoadingPlan>;
    create(dto: any): Promise<import("./loading-plan.entity").LoadingPlan>;
    assignBl(id: string, blId: string, user: any, force: boolean): Promise<import("./loading-plan.entity").LoadingPlan>;
    validateAll(user: any, date: string): Promise<{
        validated: number;
    }>;
    removeBl(id: string, blId: string): Promise<void>;
    validate(id: string, user: any): Promise<import("./loading-plan.entity").LoadingPlan>;
    remove(id: string): Promise<import("typeorm").DeleteResult>;
}
