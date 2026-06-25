import { Truck } from '../trucks/truck.entity';
export declare class TransportDeclaration {
    id: string;
    dateDebut: string;
    dateFin: string | null;
    chauffeurNom: string | null;
    chauffeurTel: string | null;
    isActive: boolean;
    declaredByUserId: string | null;
    logistiqueCompanyId: string;
    createdAt: Date;
    truck: Truck;
}
