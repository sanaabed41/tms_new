import { Repository } from 'typeorm';
import { TransportDeclaration } from './transport-declaration.entity';
import { Truck } from '../trucks/truck.entity';
import { LoadingPlan } from '../loading-plans/loading-plan.entity';
export declare class TransportPortalService {
    private declRepo;
    private truckRepo;
    private planRepo;
    constructor(declRepo: Repository<TransportDeclaration>, truckRepo: Repository<Truck>, planRepo: Repository<LoadingPlan>);
    getMyFleet(deliveryCompanyId: string): Promise<{
        declaration: TransportDeclaration | null;
        id: string;
        matricule: string;
        capaciteTonnage: number;
        capacitePalettes: number;
        type: string;
        isActive: boolean;
        deliveryCompany: import("../delivery-companies/delivery-company.entity").DeliveryCompany;
        loadingPlans: LoadingPlan[];
    }[]>;
    createTruck(dto: {
        matricule: string;
        capaciteTonnage: number;
        capacitePalettes: number;
        type?: string;
        dateDebut?: string;
        dateFin?: string | null;
        chauffeurNom?: string | null;
        chauffeurTel?: string | null;
        disponible?: boolean;
    }, deliveryCompanyId: string, logistiqueCompanyId: string, userId: string): Promise<Truck>;
    updateTruck(truckId: string, dto: {
        matricule?: string;
        capaciteTonnage?: number;
        capacitePalettes?: number;
        type?: string;
        dateDebut?: string;
        dateFin?: string | null;
        chauffeurNom?: string | null;
        chauffeurTel?: string | null;
        disponible?: boolean;
    }, deliveryCompanyId: string, logistiqueCompanyId: string, userId: string): Promise<Truck | null>;
    removeTruck(truckId: string, deliveryCompanyId: string): Promise<Truck>;
    getRapport(deliveryCompanyId: string, date: string): Promise<{
        truck: Truck;
        plan: LoadingPlan | null;
    }[]>;
    getDeclarationsForLogistique(logistiqueCompanyId: string, dateFrom?: string, dateTo?: string): Promise<TransportDeclaration[]>;
}
