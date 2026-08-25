import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { db, schema } from "@compsphere/db";
import { eq, or, and, isNull, desc } from "drizzle-orm";

const router = Router();

/**
 * Get notification log for current user/team
 * GET /api/notifications
 */
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const user = req.sessionUser!;

    let whereClause = eq(schema.notifications.userId, user.profileId);
    if (user.teamId) {
      whereClause = or(whereClause, eq(schema.notifications.teamId, user.teamId)) as any;
    }

    const list = await db.query.notifications.findMany({
      where: whereClause,
      orderBy: [desc(schema.notifications.createdAt)],
      limit: 50,
    });

    res.json({
      success: true,
      data: list,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Mark notifications as read
 * POST /api/notifications/read
 */
router.post("/read", requireAuth, async (req, res, next) => {
  try {
    const user = req.sessionUser!;

    let whereClause = eq(schema.notifications.userId, user.profileId);
    if (user.teamId) {
      whereClause = or(whereClause, eq(schema.notifications.teamId, user.teamId)) as any;
    }

    await db
      .update(schema.notifications)
      .set({ readAt: new Date() })
      .where(and(whereClause, isNull(schema.notifications.readAt)));

    res.json({
      success: true,
      message: "Notifications marked as read.",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
