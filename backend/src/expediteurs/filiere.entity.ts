import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { SocieteExpeditrice } from './societe-expeditrice.entity';

@Entity('filieres')
export class Filiere {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  nom!: string;

  @Column({ nullable: true })
  code!: string;

  @ManyToOne(() => SocieteExpeditrice, (s) => s.filieres, { onDelete: 'CASCADE' })
  societeExpeditrice!: SocieteExpeditrice;
}
