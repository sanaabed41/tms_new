import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { DeliveryCompany } from '../delivery-companies/delivery-company.entity';
import { BonLivraison } from '../bons-livraison/bon-livraison.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  nom: string;

  @Column({ nullable: true })
  adresse: string;

  @Column({ nullable: true })
  telephone: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => User, (user) => user.company)
  users: User[];

  @OneToMany(() => DeliveryCompany, (dc) => dc.company)
  deliveryCompanies: DeliveryCompany[];

  @OneToMany(() => BonLivraison, (bl) => bl.company)
  bonsLivraison: BonLivraison[];
}
