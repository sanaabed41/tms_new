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

  @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' })
  company!: Company;

  @OneToMany(() => Filiere, (f) => f.societeExpeditrice, { cascade: true, eager: true })
  filieres!: Filiere[];
}
