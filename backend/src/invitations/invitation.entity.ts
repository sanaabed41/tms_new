import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Company } from '../companies/company.entity';
import { Role } from '../common/enums/role.enum';

@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ type: 'enum', enum: Role, default: Role.LOGISTIC_ADMIN })
  role!: Role;

  @Column()
  token!: string;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ default: false })
  isUsed!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  filiereIds!: string[] | null;

  // Pour TRANSPORT_ADMIN : nom de la société de transport à créer
  @Column({ type: 'varchar', nullable: true })
  deliveryCompanyNom!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Company, { eager: true })
  company!: Company;
}
