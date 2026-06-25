import { Truck } from '../trucks/truck.entity';
import { BonLivraison } from '../bons-livraison/bon-livraison.entity';
import { User } from '../users/user.entity';
export declare class LoadingPlan {
    id: string;
    reference: string;
    dateLivraison: Date;
    tonnageCharge: number;
    palettesChargees: number;
    isValidated: boolean;
    signature: string;
    heureArrivee: string;
    loadingStatus: string;
    entryStatus: string;
    quai: string;
    stationsSequence: string[];
    currentStationIdx: number;
    currentStation: string;
    loadingStartedAt: Date;
    loadingElapsedSeconds: number;
    calledAt: Date;
    enteredAt: Date;
    logistiqueCompanyId: string;
    createdAt: Date;
    truck: Truck;
    bonsLivraison: BonLivraison[];
    validatedBy: User;
}
