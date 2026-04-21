import { DeliveryCompany } from '../delivery-companies/delivery-company.entity';
import { LoadingPlan } from '../loading-plans/loading-plan.entity';
export declare class Truck {
    id: string;
    matricule: string;
    capaciteTonnage: number;
    capacitePalettes: number;
    type: string;
    isActive: boolean;
    deliveryCompany: DeliveryCompany;
    loadingPlans: LoadingPlan[];
}
