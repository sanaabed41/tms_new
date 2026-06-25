import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable, CreateDateColumn } from 'typeorm';
import { Company } from '../companies/company.entity';
import { Role } from '../common/enums/role.enum';
import { Filiere } from '../expediteurs/filiere.entity';
import { DeliveryCompany } from '../delivery-companies/delivery-company.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nom: string;

  @Column()
  prenom: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ type: 'enum', enum: Role, default: Role.LOGISTIC_ADMIN })
  role: Role;

  @Column({ default: false })
  isActive: boolean;

  @Column({ type: 'varchar', nullable: true })
  resetPasswordToken: string | null;

  @Column({ nullable: true, type: 'timestamptz' })
  resetPasswordExpires: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Company, (company) => company.users, { nullable: true })
  company: Company;

  // Pour TRANSPORT_ADMIN : société de transport qu'il gère
  @ManyToOne(() => DeliveryCompany, { nullable: true, eager: false, onDelete: 'SET NULL' })
  deliveryCompany?: DeliveryCompany | null;

  @ManyToMany(() => Filiere, { eager: true })
  @JoinTable({ name: 'user_filieres' })
  filieres!: Filiere[];
}
