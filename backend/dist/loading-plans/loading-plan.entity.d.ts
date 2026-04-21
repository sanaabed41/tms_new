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
    createdAt: Date;
    truck: Truck;
    bonsLivraison: BonLivraison[];
    validatedBy: User;
}
