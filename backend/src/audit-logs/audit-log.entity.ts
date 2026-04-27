import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('audit_logs')
@Index(['createdAt'])
@Index(['actorId'])
@Index(['companyId'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  action: string; // LOGIN_SUCCESS | LOGIN_FAILED | USER_CREATED | USER_ACTIVATED | USER_DEACTIVATED | USER_DELETED | COMPANY_CREATED | COMPANY_UPDATED | COMPANY_DELETED

  @Column({ nullable: true })
  actorId: string;

  @Column({ nullable: true })
  actorEmail: string;

  @Column({ nullable: true })
  actorRole: string;

  @Column({ nullable: true })
  targetId: string;

  @Column({ nullable: true })
  targetEmail: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ nullable: true })
  companyNom: string;

  @Column({ nullable: true })
  ip: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
