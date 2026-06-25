import {
  Entity, PrimaryGeneratedColumn, Column, OneToMany,
  ManyToOne, CreateDateColumn, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { DeliveryCompany } from '../delivery-companies/delivery-company.entity';
import { BonLivraison } from '../bons-livraison/bon-livraison.entity';
import { CompanyType } from '../common/enums/company-type.enum';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  nom: string;

  @Column({ type: 'enum', enum: CompanyType, default: CompanyType.LOGISTIQUE })
  type: CompanyType;

  @Column({ nullable: true })
  adresse: string;

  @Column({ nullable: true })
  telephone: string;

  @Column({ nullable: true })
  couleur: string;        // pour les sociétés EXPEDITEUR (badge couleur)

  @Column({ nullable: true, unique: true })
  code: string;           // code court (ex: RB, PW)

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

  // Relation 1 Company EXPEDITEUR → 1 Company LOGISTIQUE (qui l'héberge)
  @ManyToOne(() => Company, (c) => c.expediteurClients, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'logistiqueCompanyId' })
  logistiqueCompany?: Company | null;

  // Vue inverse : 1 Company LOGISTIQUE → N Company EXPEDITEUR clientes
  @OneToMany(() => Company, (c) => c.logistiqueCompany)
  expediteurClients?: Company[];
}
