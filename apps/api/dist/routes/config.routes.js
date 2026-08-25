import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { db, schema } from "@compsphere/db";
import { eq } from "drizzle-orm";
import { auditService } from "../services/audit.service.js";
import { z } from "zod";
const router = Router();
/**
 * Get public countdown config (no auth required)
 * GET /api/config/public
 */
router.get("/public", async (req, res, next) => {
    try {
        const keys = ["countdown_compsphere_enabled", "countdown_talksphere_enabled", "countdown_enabled", "countdown_24h_enabled", "show_login_buttons"];
        const configs = await db.query.systemConfig.findMany();
        const publicConfigs = configs
            .filter((c) => keys.includes(c.key))
            .reduce((acc, c) => ({ ...acc, [c.key]: c.value }), {});
        res.json({ success: true, data: publicConfigs });
    }
    catch (error) {
        next(error);
    }
});
/**
 * Get all configurations (open to authenticated)
 * GET /api/config
 */
router.get("/", requireAuth, async (req, res, next) => {
    try {
        const list = await db.query.systemConfig.findMany();
        res.json({
            success: true,
            data: list,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * Update system configurations (Admin only)
 * PUT /api/config
 */
router.put("/", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
    try {
        const admin = req.sessionUser;
        const bodySchema = z.array(z.object({
            key: z.string(),
            value: z.string(),
        }));
        const updates = bodySchema.parse(req.body);
        await db.transaction(async (tx) => {
            for (const update of updates) {
                await tx
                    .update(schema.systemConfig)
                    .set({
                    value: update.value,
                    updatedAt: new Date(),
                    updatedBy: admin.profileId,
                })
                    .where(eq(schema.systemConfig.key, update.key));
            }
            await auditService.log(tx, {
                actorId: admin.profileId,
                action: "SYSTEM_CONFIG_UPDATED",
                entityType: "system_config",
                entityId: "bulk",
                metadata: { updates },
            });
        });
        res.json({
            success: true,
            message: "Configurations updated successfully.",
        });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=config.routes.js.map