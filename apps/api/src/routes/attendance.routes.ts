import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { qrService } from "../services/qr.service";
import { db, schema } from "@compsphere/db";
import { desc } from "drizzle-orm";
import { z } from "zod";

const router = Router();

/**
 * Scan a QR token to record attendance (Admin only)
 * POST /api/attendance/scan
 */
router.post("/scan", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const admin = req.sessionUser!;
    const bodySchema = z.object({
      token: z.string().min(1, "QR token is required"),
      attendanceType: z.enum(["DAY1", "DAY2", "CEREMONY"]),
    });

    const { token, attendanceType } = bodySchema.parse(req.body);

    const result = await qrService.scanQRToken(admin.profileId, token, attendanceType);

    res.json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get attendance log history (Admin only)
 * GET /api/attendance/logs
 */
router.get("/logs", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const logs = await db.query.attendance.findMany({
      orderBy: [desc(schema.attendance.scannedAt)],
      with: {
        profile: {
          columns: {
            fullName: true,
            email: true,
          },
        },
        team: {
          columns: {
            teamName: true,
            teamCode: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
