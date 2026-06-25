import { Repository } from 'typeorm';
import { Company } from './company.entity';
import { CompanyType } from '../common/enums/company-type.enum';
export declare class CompaniesService {
    private repo;
    constructor(repo: Repository<Company>);
    findAll(type?: CompanyType): Promise<Company[]>;
    findByLogistique(logistiqueId: string): Promise<Company[]>;
    findOne(id: string): Promise<Company>;
    private normalize;
    private assertCodeUnique;
    create(dto: any): Promise<Company>;
    update(id: string, dto: any): Promise<Company>;
    remove(id: string): Promise<Company>;
    setLogistiqueCompany(expediteurId: string, logistiqueId: string | null): Promise<Company>;
}
