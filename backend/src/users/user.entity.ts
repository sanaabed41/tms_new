import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Company } from '../companies/company.entity';
import { Role } from '../common/enums/role.enum';

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

  @Column({ type: 'enum', enum: Role, default: Role.COMPANY_ADMIN })
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
}
