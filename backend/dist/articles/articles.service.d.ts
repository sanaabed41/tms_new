import { Repository } from 'typeorm';
import { Article } from './article.entity';
export declare class ArticlesService {
    private repo;
    constructor(repo: Repository<Article>);
    findAll(search?: string): Promise<Article[]>;
    findOne(id: string): Promise<Article>;
    create(dto: Partial<Article>): Promise<Article>;
    update(id: string, dto: Partial<Article>): Promise<Article>;
    remove(id: string): Promise<Article>;
}
