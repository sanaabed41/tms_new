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

  @ManyToOne(() => Truck, { eager: true, onDelete: 'CASCADE' })
  truck!: Truck;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  company!: Company;

  @CreateDateColumn()
  createdAt!: Date;
}
