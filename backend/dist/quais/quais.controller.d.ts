import { QuaisService } from './quais.service';
export declare class QuaisController {
    private readonly service;
    constructor(service: QuaisService);
    findAll(user: any): Promise<import("./quai.entity").Quai[]>;
    create(user: any, dto: any): Promise<import("./quai.entity").Quai>;
    update(id: string, dto: any): Promise<import("./quai.entity").Quai>;
    remove(id: string): Promise<import("./quai.entity").Quai>;
}
