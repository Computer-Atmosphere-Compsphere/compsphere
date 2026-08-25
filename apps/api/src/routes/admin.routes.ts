import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { teamService } from "../services/team.service";
import { db, schema } from "@compsphere/db";
import { eq, desc, ilike, or, and } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// Secure all admin routes to require ADMIN role
router.use(requireAuth, requireRole("ADMIN"));

/**
 * Get administrative overview metrics
 * GET /api/admin/metrics
 */
router.get("/metrics", async (req, res, next) => {
  try {
    const metrics = await teamService.getAdminMetrics();
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get all competition teams (paginated, searchable, filterable)
 * GET /api/admin/teams
 */
router.get("/teams", async (req, res, next) => {
  try {
    const querySchema = z.object({
      search: z.string().optional(),
      category: z.enum(["NATIONAL", "MIX", "INTERNATIONAL"]).optional(),
      status: z.enum([
        "NEW",
        "TOP30",
        "AWAITING_CONFIRMATION",
        "PAYMENT_PENDING",
        "DOCUMENT_PENDING",
        "VERIFICATION_PENDING",
        "VERIFIED",
        "DROPPED",
        "WAITLIST",
        "FINALIST",
        "SUBMISSION_OPEN",
        "SUBMITTED",
        "JUDGED",
      ]).optional(),
    });

    const parsed = querySchema.parse(req.query);

    let whereClause = undefined;
    if (parsed.search) {
      whereClause = or(
        ilike(schema.competitionTeams.teamName, `%${parsed.search}%`),
        ilike(schema.competitionTeams.teamCode, `%${parsed.search}%`)
      );
    }

    if (parsed.category) {
      const catFilter = eq(schema.competitionTeams.category, parsed.category);
      whereClause = whereClause ? and(whereClause, catFilter) : catFilter;
    }

    if (parsed.status) {
      const statusFilter = eq(schema.competitionTeams.status, parsed.status);
      whereClause = whereClause ? and(whereClause, statusFilter) : statusFilter;
    }

    const list = await db.query.competitionTeams.findMany({
      where: whereClause as any,
      orderBy: [schema.competitionTeams.originalRank],
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
 * Verify a team manually (Admin override)
 * POST /api/admin/verify-team
 */
router.post("/verify-team", async (req, res, next) => {
  try {
    const admin = req.sessionUser!;
    const bodySchema = z.object({
      teamId: z.string().uuid(),
    });

    const { teamId } = bodySchema.parse(req.body);
    const result = await teamService.verifyTeam(admin.profileId, teamId);

    res.json({
      success: true,
      message: "Team verified successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Drop a team manually (Admin override)
 * POST /api/admin/drop-team
 */
router.post("/drop-team", async (req, res, next) => {
  try {
    const admin = req.sessionUser!;
    const bodySchema = z.object({
      teamId: z.string().uuid(),
      reason: z.string().optional(),
    });

    const { teamId, reason } = bodySchema.parse(req.body);
    const result = await teamService.dropTeam(admin.profileId, teamId, reason);

    res.json({
      success: true,
      message: "Team dropped successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Regenerate activation token for a team (Admin override)
 * POST /api/admin/regenerate-team-token
 */
router.post("/regenerate-team-token", async (req, res, next) => {
  try {
    const admin = req.sessionUser!;
    const bodySchema = z.object({
      teamId: z.string().uuid(),
    });

    const { teamId } = bodySchema.parse(req.body);
    const result = await teamService.regenerateTeamToken(admin.profileId, teamId);

    res.json({
      success: true,
      message:
        "New activation token generated. Share securely with the team leader — it will not be shown again.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
