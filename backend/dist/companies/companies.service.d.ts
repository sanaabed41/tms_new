import { Repository } from 'typeorm';
import { Company } from './company.entity';
export declare class CompaniesService {
    private repo;
    constructor(repo: Repository<Company>);
    findAll(): Promise<Company[]>;
    findOne(id: string): Promise<Company>;
    create(dto: Partial<Company>): Promise<Company>;
    update(id: string, dto: Partial<Company>): Promise<Company>;
    remove(id: string): Promise<Company>;
}
