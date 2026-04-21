import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  OneToMany, CreateDateColumn,
} from 'typeorm';
import { Truck } from '../trucks/truck.entity';
import { BonLivraison } from '../bons-livraison/bon-livraison.entity';
import { User } from '../users/user.entity';

@Entity('loading_plans')
export class LoadingPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  reference: string;

  @Column({ type: 'date' })
  dateLivraison: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tonnageCharge: number;

  @Column({ type: 'int', default: 0 })
  palettesChargees: number;

  @Column({ default: false })
  isValidated: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Truck, (truck) => truck.loadingPlans, { eager: true })
  truck: Truck;

  @OneToMany(() => BonLivraison, (bl) => bl.loadingPlan)
  bonsLivraison: BonLivraison[];

  @ManyToOne(() => User, { nullable: true, eager: true })
  validatedBy: User;
}
