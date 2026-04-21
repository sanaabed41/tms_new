import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { Company } from '../companies/company.entity';
import { Truck } from '../trucks/truck.entity';

@Entity('delivery_companies')
export class DeliveryCompany {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nom: string;

  @Column({ nullable: true })
  adresse: string;

  @Column({ nullable: true })
  telephone: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Company, (company) => company.deliveryCompanies)
  company: Company;

  @OneToMany(() => Truck, (truck) => truck.deliveryCompany)
  camions: Truck[];
}
