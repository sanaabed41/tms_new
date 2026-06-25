import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Truck } from '../trucks/truck.entity';

@Entity('transport_declarations')
export class TransportDeclaration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  dateDebut: string;

  @Column({ type: 'date', nullable: true })
  dateFin: string | null;

  @Column({ type: 'varchar', nullable: true })
  chauffeurNom: string | null;

  @Column({ type: 'varchar', nullable: true })
  chauffeurTel: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'uuid', nullable: true })
  declaredByUserId: string | null;

  @Column({ type: 'uuid' })
  logistiqueCompanyId: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Truck, { eager: true, onDelete: 'CASCADE' })
  truck: Truck;
}
