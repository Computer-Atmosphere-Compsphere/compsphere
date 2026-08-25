import type { DB } from "@compsphere/db";
interface AuditLogPayload {
    actorId: string | null;
    action: string;
    entityType: string;
    entityId: string | null;
    metadata?: Record<string, unknown> | null;
}
export declare const auditService: {
    /**
     * Log an administrative or sensitive competition event.
     * Can accept a transaction client (tx) to execute inside a transaction.
     */
    log(tx: DB | any, payload: AuditLogPayload): Promise<void>;
    /**
     * Get audit logs (paginated, with actor profile information, with search)
     */
    getLogs(page?: number, limit?: number, search?: string): Promise<{
        logs: {
            id: string;
            createdAt: Date;
            actorId: string | null;
            action: string;
            entityType: string;
            entityId: string | null;
            metadata: unknown;
        }[];
        page: number;
        limit: number;
        total: {};
        totalPages: number;
    }>;
};
export {};
//# sourceMappingURL=audit.service.d.ts.map