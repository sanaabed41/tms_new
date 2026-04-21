import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  OneToMany, CreateDateColumn,
} from 'typeorm';
import { Company } from '../companies/company.entity';
import { BlArticle } from './bl-article.entity';
import { LoadingPlan } from '../loading-plans/loading-plan.entity';
import { BlStatus } from '../common/enums/bl-status.enum';
import { SocieteExpeditrice } from '../expediteurs/societe-expeditrice.entity';
import { Filiere } from '../expediteurs/filiere.entity';

export enum TypeChargement {
  VRAC = 'VRAC',
  PALETTE = 'PALETTE',
  FRIGO = 'FRIGO',
  CITERNE = 'CITERNE',
}

@Entity('bons_livraison')
export class BonLivraison {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  numeroBl!: string;

  @Column()
  clientNom!: string;

  @Column({ nullable: true })
  clientAdresse!: string;

  @Column({ nullable: true })
  origine!: string;

  @Column({ nullable: true })
  destination!: string;

  @Column({ type: 'enum', enum: TypeChargement, default: TypeChargement.VRAC })
  typeChargement!: TypeChargement;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tonnageTotal!: number;

  @Column({ type: 'int', default: 0 })
  nombrePalettes!: number;

  @Column({ type: 'enum', enum: BlStatus, default: BlStatus.DRAFT })
  statut!: BlStatus;

  @Column({ nullable: true })
  datelivraison!: Date;

  @Column({ nullable: true })
  erpReference!: string;

  @Column({ nullable: true, type: 'text' })
  notes!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Company, (company) => company.bonsLivraison)
  company!: Company;

  @ManyToOne(() => SocieteExpeditrice, { nullable: true, eager: false, onDelete: 'SET NULL' })
  societeExpeditrice!: SocieteExpeditrice | null;

  @ManyToOne(() => Filiere, { nullable: true, eager: false, onDelete: 'SET NULL' })
  filiere!: Filiere | null;

  @OneToMany(() => BlArticle, (bla) => bla.bonLivraison, { cascade: true })
  blArticles!: BlArticle[];

  @ManyToOne(() => LoadingPlan, (lp) => lp.bonsLivraison, { nullable: true })
  loadingPlan!: LoadingPlan;
}
