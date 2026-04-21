import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('articles')
export class Article {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  code!: string;

  @Column()
  libelle!: string;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  poidsUnitaire!: number;

  @Column({ nullable: true })
  unite!: string;
}
