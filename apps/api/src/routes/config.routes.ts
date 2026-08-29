import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { db, schema } from "@compsphere/db";
import { eq } from "drizzle-orm";
import { auditService } from "../services/audit.service";
import { z } from "zod";

const router = Router();

/**
 * Get public countdown config (no auth required)
 * GET /api/config/public
 */
router.get("/public", async (req, res, next) => {
  try {
    const keys = [
      "countdown_compsphere_enabled",
      "countdown_talksphere_enabled",
      "countdown_enabled",
      "countdown_24h_enabled",
      "show_login_buttons",
      "hacksphere_devpost_url",
      "hacksphere_discord_url",
      "hacksphere_guidebook_url",
    ];
    const configs = await db.query.systemConfig.findMany();
    const publicConfigs = configs
      .filter((c) => keys.includes(c.key))
      .reduce((acc, c) => ({ ...acc, [c.key]: c.value }), {} as Record<string, string>);
    res.json({ success: true, data: publicConfigs });
  } catch (error) {
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
  } catch (error) {
    next(error);
  }
});

/**
 * Update (upsert) system configurations (Admin only)
 * PUT /api/config
 */
router.put("/", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const admin = req.sessionUser!;
    const bodySchema = z.array(
      z.object({
        key: z.string(),
        value: z.string(),
      })
    );

    const updates = bodySchema.parse(req.body);

    await db.transaction(async (tx) => {
      for (const update of updates) {
        await tx
          .insert(schema.systemConfig)
          .values({
            key: update.key,
            value: update.value,
            type: "STRING",
            updatedAt: new Date(),
            updatedBy: admin.profileId,
          })
          .onConflictDoUpdate({
            target: schema.systemConfig.key,
            set: {
              value: update.value,
              updatedAt: new Date(),
              updatedBy: admin.profileId,
            },
          });
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
  } catch (error) {
    next(error);
  }
});

/**
 * Seed missing config keys with defaults (Admin only, idempotent)
 * POST /api/config/seed-missing
 */
router.post("/seed-missing", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const defaultConfigs = [
      { key: "hacksphere_devpost_url", value: "", type: "STRING" as const },
      { key: "hacksphere_discord_url", value: "", type: "STRING" as const },
      { key: "hacksphere_guidebook_url", value: "", type: "STRING" as const },
    ];

    const inserted: string[] = [];
    const skipped: string[] = [];

    for (const config of defaultConfigs) {
      const existing = await db.query.systemConfig.findFirst({
        where: eq(schema.systemConfig.key, config.key),
      });
      if (!existing) {
        await db.insert(schema.systemConfig).values(config);
        inserted.push(config.key);
      } else {
        skipped.push(config.key);
      }
    }

    res.json({
      success: true,
      message: `Inserted ${inserted.length} new config keys, skipped ${skipped.length} existing.`,
      inserted,
      skipped,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

