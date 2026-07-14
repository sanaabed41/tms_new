import { ConfigService } from '@nestjs/config';
export declare class MailService {
    private config;
    private readonly logger;
    private transporter;
    constructor(config: ConfigService);
    private initTransporter;
    private send;
    sendCredentials(email: string, prenom: string, nom: string, password: string, role: string, companyNom: string, appUrl: string): Promise<{
        preview: string;
        messageId?: undefined;
    } | {
        messageId: any;
        preview?: undefined;
    }>;
    sendInvitation(email: string, companyNom: string, role: string, token: string, frontUrl: string): Promise<{
        preview: string;
        messageId?: undefined;
    } | {
        messageId: any;
        preview?: undefined;
    }>;
    sendDailyReport(to: string, date: string, companyNom: string, plans: any[]): Promise<{
        preview: string;
        messageId?: undefined;
    } | {
        messageId: any;
        preview?: undefined;
    }>;
    sendResetPassword(email: string, prenom: string, token: string, frontUrl: string): Promise<{
        preview: string;
        messageId?: undefined;
    } | {
        messageId: any;
        preview?: undefined;
    }>;
}
