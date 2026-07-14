import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  CreateDateColumn, Unique,
} from 'typeorm';
import { Truck } from '../trucks/truck.entity';
import { Company } from '../companies/company.entity';

@Entity('truck_availabilities')
@Unique(['truck', 'date'])
export class TruckAvailability {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'varchar', length: 20, default: 'DISPONIBLE' })
  statut!: string; // DISPONIBLE | INDISPONIBLE

  @Column({ type: 'varchar', length: 100, nullable: true })
  motif!: string | null; // ex: "En panne", "Révision", "Accident"

  @ManyToOne(() => Truck, { eager: true, onDelete: 'CASCADE' })
  truck!: Truck;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  company!: Company;

  @CreateDateColumn()
  createdAt!: Date;
}
