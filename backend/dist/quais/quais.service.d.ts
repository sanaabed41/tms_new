import { Repository } from 'typeorm';
import { Quai } from './quai.entity';
export declare class QuaisService {
    private repo;
    constructor(repo: Repository<Quai>);
    findAll(companyId?: string): Promise<Quai[]>;
    create(companyId: string, dto: any): Promise<Quai>;
    update(id: string, dto: any): Promise<Quai>;
    remove(id: string): Promise<Quai>;
}
