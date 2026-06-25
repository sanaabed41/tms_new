import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Company } from '../companies/company.entity';
import { SocieteExpeditrice } from '../expediteurs/societe-expeditrice.entity';
import { Filiere } from '../expediteurs/filiere.entity';

@Entity('quais')
export class Quai {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nom: string;

  @Column({ default: true })
  isActive: boolean;

  // nullable : les quais d'un expéditeur n'appartiennent pas à une société logistique
  @ManyToOne(() => Company, { nullable: true, onDelete: 'SET NULL', eager: false })
  company: Company | null;

  @ManyToOne(() => SocieteExpeditrice, { nullable: true, onDelete: 'CASCADE', eager: true })
  societeExpeditrice: SocieteExpeditrice | null;

  @ManyToOne(() => Filiere, { nullable: true, onDelete: 'CASCADE', eager: true })
  filiere: Filiere | null;
}
