import { ErpService } from './erp.service';
export declare class ErpController {
    private readonly service;
    constructor(service: ErpService);
    upsertArticles(body: {
        articles: any[];
    }): Promise<{
        code: string;
        action: "created" | "updated";
    }[]>;
    upsertBons(user: any, body: {
        bons: any[];
    }): Promise<{
        processed: number;
        results: {
            erpReference: string;
            numeroBl: string;
            action: "created" | "updated" | "skipped";
        }[];
    }>;
}
