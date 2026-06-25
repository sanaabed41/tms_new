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

  @Column({ type: 'text', nullable: true })
  signature: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  heureArrivee: string;

  @Column({ type: 'varchar', length: 20, default: 'WAITING' })
  loadingStatus: string;

  @Column({ type: 'varchar', length: 20, default: 'IDLE' })
  entryStatus: string; // IDLE | CALLED | ENTERED | EXITED

  @Column({ type: 'varchar', length: 30, nullable: true })
  quai: string;

  // Séquence de stations filière à parcourir dans l'ordre (ex: ["AMT","PW","MCSR"])
  @Column({ type: 'jsonb', nullable: true })
  stationsSequence: string[];

  @Column({ type: 'int', default: 0 })
  currentStationIdx: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  currentStation: string;

  @Column({ type: 'timestamptz', nullable: true })
  loadingStartedAt: Date;

  @Column({ type: 'int', default: 0 })
  loadingElapsedSeconds: number;

  @Column({ type: 'timestamptz', nullable: true })
  calledAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  enteredAt: Date;

  @Column({ type: 'uuid', nullable: true })
  logistiqueCompanyId: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Truck, (truck) => truck.loadingPlans, { eager: true })
  truck: Truck;

  @OneToMany(() => BonLivraison, (bl) => bl.loadingPlan)
  bonsLivraison: BonLivraison[];

  @ManyToOne(() => User, { nullable: true, eager: true })
  validatedBy: User;
}
