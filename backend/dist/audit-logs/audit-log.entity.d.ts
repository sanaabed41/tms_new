export declare class AuditLog {
    id: string;
    action: string;
    actorId: string;
    actorEmail: string;
    actorRole: string;
    targetId: string;
    targetEmail: string;
    companyId: string;
    companyNom: string;
    ip: string;
    metadata: Record<string, any>;
    createdAt: Date;
}
