import { TransportPortalService } from './transport-portal.service';
export declare class TransportPortalController {
    private readonly service;
    constructor(service: TransportPortalService);
    getMyFleet(user: any): never[] | Promise<{
        declaration: import("./transport-declaration.entity").TransportDeclaration | null;
        id: string;
        matricule: string;
        capaciteTonnage: number;
        capacitePalettes: number;
        type: string;
        isActive: boolean;
        deliveryCompany: import("../delivery-companies/delivery-company.entity").DeliveryCompany;
        loadingPlans: import("../loading-plans/loading-plan.entity").LoadingPlan[];
    }[]>;
    createTruck(user: any, dto: any): Promise<import("../trucks/truck.entity").Truck> | {
        error: string;
    };
    updateTruck(user: any, id: string, dto: any): Promise<import("../trucks/truck.entity").Truck | null>;
    removeTruck(user: any, id: string): Promise<import("../trucks/truck.entity").Truck>;
    getRapport(user: any, date: string): never[] | Promise<{
        truck: import("../trucks/truck.entity").Truck;
        plan: import("../loading-plans/loading-plan.entity").LoadingPlan | null;
    }[]>;
    getDeclarations(user: any, dateFrom?: string, dateTo?: string): Promise<import("./transport-declaration.entity").TransportDeclaration[]>;
}
