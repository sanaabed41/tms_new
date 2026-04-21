import { ArticlesService } from './articles.service';
export declare class ArticlesController {
    private readonly service;
    constructor(service: ArticlesService);
    findAll(search: string): Promise<import("./article.entity").Article[]>;
    findOne(id: string): Promise<import("./article.entity").Article>;
    create(dto: any): Promise<import("./article.entity").Article>;
    update(id: string, dto: any): Promise<import("./article.entity").Article>;
    remove(id: string): Promise<import("./article.entity").Article>;
}
