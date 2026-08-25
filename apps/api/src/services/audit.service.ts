import { db, schema } from "@compsphere/db";
import type { DB } from "@compsphere/db";
import { like, or, sql } from "drizzle-orm";

interface AuditLogPayload {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata?: Record<string, unknown> | null;
}

export const auditService = {
  /**
   * Log an administrative or sensitive competition event.
   * Can accept a transaction client (tx) to execute inside a transaction.
   */
  async log(tx: DB | any, payload: AuditLogPayload) {
    const dbClient = tx || db;
    try {
      await dbClient.insert(schema.auditLogs).values({
        actorId: payload.actorId,
        action: payload.action,
        entityType: payload.entityType,
        entityId: payload.entityId,
        metadata: payload.metadata || {},
      });
    } catch (err) {
      console.error("[AUDIT LOG ERROR] Failed to write audit log:", err);
      // Don't crash the request if audit logging fails, but log it
    }
  },

  /**
   * Get audit logs (paginated, with actor profile information, with search)
   */
  async getLogs(page = 1, limit = 50, search?: string) {
    const offset = (page - 1) * limit;

    // Build search conditions
    const searchConditions = search
      ? or(
          like(schema.auditLogs.action, `%${search}%`),
          like(schema.auditLogs.entityType, `%${search}%`),
          like(schema.auditLogs.entityId, `%${search}%`),
        )
      : undefined;

    const whereClause = searchConditions || undefined;

    const [logs, countResult] = await Promise.all([
      db.query.auditLogs.findMany({
        limit,
        offset,
        orderBy: (al, { desc }) => [desc(al.createdAt)],
        with: {
          actor: {
            columns: {
              fullName: true,
              email: true,
            },
          },
        },
        where: whereClause,
      }),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.auditLogs)
        .where(whereClause)
        .then((rows) => rows[0]?.count ?? 0),
    ]);

    return {
      logs,
      page,
      limit,
      total: countResult,
      totalPages: Math.ceil(countResult / limit),
    };
  },
};
