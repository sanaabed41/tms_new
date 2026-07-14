import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { DeliveryCompany } from '../delivery-companies/delivery-company.entity';
import { LoadingPlan } from '../loading-plans/loading-plan.entity';

@Entity('trucks')
export class Truck {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  matricule: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  capaciteTonnage: number;

  @Column({ type: 'int' })
  capacitePalettes: number;

  @Column({ nullable: true })
  type: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'varchar', nullable: true })
  chauffeurNom: string | null;

  @Column({ type: 'varchar', nullable: true })
  chauffeurTel: string | null;

  @ManyToOne(() => DeliveryCompany, (dc) => dc.camions)
  deliveryCompany: DeliveryCompany;

  @OneToMany(() => LoadingPlan, (lp) => lp.truck)
  loadingPlans: LoadingPlan[];
}
