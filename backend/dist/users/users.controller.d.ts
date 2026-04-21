import { UsersService } from './users.service';
export declare class UsersController {
    private readonly service;
    constructor(service: UsersService);
    findAll(companyId: string, user: any): Promise<import("./user.entity").User[]>;
    findOne(id: string): Promise<import("./user.entity").User>;
    create(dto: any, user: any): Promise<import("./user.entity").User[]>;
    update(id: string, dto: any, user: any): Promise<import("./user.entity").User>;
    toggleActive(id: string): Promise<import("./user.entity").User>;
    remove(id: string, user: any): Promise<import("./user.entity").User>;
}
