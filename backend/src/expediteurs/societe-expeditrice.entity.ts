import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { Company } from '../companies/company.entity';
import { Filiere } from './filiere.entity';

@Entity('societes_expeditrices')
export class SocieteExpeditrice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  nom!: string;

  @Column({ nullable: true })
  code!: string;

  @Column({ nullable: true })
  couleur!: string;

  @Column({ nullable: true })
  adresse!: string;

  @Column({ nullable: true })
  telephone!: string;

  @CreateDateColumn()
  createdAt!: Date;

  // Société logistique partenaire (optionnel — la fiche peut exister sans partenaire logistique)
  @ManyToOne(() => Company, { nullable: true, onDelete: 'SET NULL' })
  company!: Company | null;

  // Compte portail expéditeur (Company de type EXPEDITEUR) — optionnel
  // Quand défini, les EXPEDITEUR_ADMIN de cette Company peuvent gérer cette société
  @ManyToOne(() => Company, { nullable: true, onDelete: 'SET NULL', eager: false })
  expediteurCompany!: Company | null;

  @OneToMany(() => Filiere, (f) => f.societeExpeditrice, { cascade: true, eager: true })
  filieres!: Filiere[];
}
