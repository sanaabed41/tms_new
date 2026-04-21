import { ConfigService } from '@nestjs/config';
export declare class MailService {
    private config;
    private readonly logger;
    private transporter;
    constructor(config: ConfigService);
    private initTransporter;
    private send;
    sendInvitation(email: string, companyNom: string, role: string, token: string, frontUrl: string): Promise<{
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
