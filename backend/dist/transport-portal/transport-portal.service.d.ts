import { Repository } from 'typeorm';
import { TransportDeclaration } from './transport-declaration.entity';
import { Truck } from '../trucks/truck.entity';
export declare class TransportPortalService {
    private declRepo;
    private truckRepo;
    constructor(declRepo: Repository<TransportDeclaration>, truckRepo: Repository<Truck>);
    getMyFleet(deliveryCompanyId: string): Promise<{
        declaration: TransportDeclaration | null;
        id: string;
        matricule: string;
        capaciteTonnage: number;
        capacitePalettes: number;
        type: string;
        isActive: boolean;
        deliveryCompany: import("../delivery-companies/delivery-company.entity").DeliveryCompany;
        loadingPlans: import("../loading-plans/loading-plan.entity").LoadingPlan[];
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
    getDeclarationsForLogistique(logistiqueCompanyId: string, dateFrom?: string, dateTo?: string): Promise<TransportDeclaration[]>;
}
