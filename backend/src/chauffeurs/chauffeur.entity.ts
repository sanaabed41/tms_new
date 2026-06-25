import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { DeliveryCompany } from '../delivery-companies/delivery-company.entity';

@Entity('chauffeurs')
export class Chauffeur {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nom: string;

  @Column()
  prenom: string;

  @Column({ nullable: true })
  telephone: string;

  @Column({ nullable: true })
  cin: string;

  @Column({ nullable: true })
  permis: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => DeliveryCompany, { onDelete: 'CASCADE', eager: false })
  deliveryCompany: DeliveryCompany;
}
