import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { SocieteExpeditrice } from './societe-expeditrice.entity';

@Entity('filieres')
export class Filiere {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  nom!: string;

  @Column({ nullable: true, unique: true, transformer: {
    to: (v: string) => v?.trim().toUpperCase() ?? v,
    from: (v: string) => v,
  }})
  code!: string;

  @Column({ nullable: true })
  adresse!: string;

  @ManyToOne(() => SocieteExpeditrice, (s) => s.filieres, { onDelete: 'CASCADE' })
  societeExpeditrice!: SocieteExpeditrice;
}
