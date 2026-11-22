import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { teamService } from "../services/team.service";
import { db, schema } from "@compsphere/db";
import { eq, desc, ilike, or, and, sql } from "drizzle-orm";
import { z } from "zod";
import { auditService } from "../services/audit.service";
import { AppError } from "../middleware/error.middleware";
import { submissionService } from "../services/submission.service";

const SCORE_SECURITY_PASSWORD =
  process.env.SCORE_OVERRIDE_AUTH_PASSWORD || "compsphere12jayajayajaya";

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

/**
 * Update team details (Admin override)
 * PUT /api/admin/update-team
 * PATCH /api/admin/teams/:teamId
 */
const updateTeamSchema = z.object({
  teamId: z.string().uuid(),
  teamName: z.string().min(1).optional(),
  category: z.enum(["NATIONAL", "MIX", "INTERNATIONAL"]).optional(),
  countryMix: z.string().nullable().optional(),
  originalRank: z.number().int().min(1).optional(),
  status: z
    .enum([
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
    ])
    .optional(),
  paymentRequired: z.boolean().optional(),
  paymentAmount: z.number().int().min(0).optional(),
  // Advanced overrides
  leaderMemberId: z.string().uuid().optional(),        // Select which existing member is the team leader
  leaderEmail: z.string().email().optional(),         // Override leader's Google profile email
  leaderName: z.string().min(1).optional(),           // Override leader's display name
  scoreOverride: z.number().min(0).max(100).optional(), // Manual final_score override for judge scores
  scoreAuthPassword: z.string().optional(),          // Security authorization password required to change scores
});

async function applyScoreOverride(adminId: string, teamId: string, scoreOverride: number) {
  const existingScores = await db.query.judgeScores.findMany({
    where: eq(schema.judgeScores.teamId, teamId),
  });

  if (existingScores.length > 0) {
    await db.execute(
      sql`UPDATE judge_scores
          SET final_score = ${scoreOverride},
              technical_score = ${Math.round(scoreOverride)},
              problem_score = ${Math.round(scoreOverride)},
              innovation_score = ${Math.round(scoreOverride)},
              market_score = ${Math.round(scoreOverride)},
              document_score = ${Math.round(scoreOverride)},
              updated_at = NOW()
          WHERE team_id = ${teamId}`
    );
  } else {
    // If no scores exist yet, look up assigned judges or active judges in system
    const assignments = await db.query.judgeAssignments.findMany({
      where: eq(schema.judgeAssignments.teamId, teamId),
    });
    let judgeIds = assignments.map((a) => a.judgeId);

    if (judgeIds.length === 0) {
      const activeJudges = await db.query.judges.findMany({
        limit: 2,
      });
      for (const j of activeJudges) {
        await db
          .insert(schema.judgeAssignments)
          .values({
            judgeId: j.id,
            teamId,
          })
          .onConflictDoNothing();
      }
      judgeIds = activeJudges.map((j) => j.id);
    }

    for (const judgeId of judgeIds) {
      await db
        .insert(schema.judgeScores)
        .values({
          judgeId,
          teamId,
          technicalScore: Math.round(scoreOverride),
          problemScore: Math.round(scoreOverride),
          innovationScore: Math.round(scoreOverride),
          marketScore: Math.round(scoreOverride),
          documentScore: Math.round(scoreOverride),
          finalScore: scoreOverride.toFixed(2),
          submittedAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [schema.judgeScores.judgeId, schema.judgeScores.teamId],
          set: {
            finalScore: scoreOverride.toFixed(2),
            technicalScore: Math.round(scoreOverride),
            problemScore: Math.round(scoreOverride),
            innovationScore: Math.round(scoreOverride),
            marketScore: Math.round(scoreOverride),
            documentScore: Math.round(scoreOverride),
            updatedAt: new Date(),
          },
        });
    }
  }

  await auditService.log(db, {
    actorId: adminId,
    action: "TEAM_UPDATED",
    entityType: "team",
    entityId: teamId,
    metadata: { type: "score_override", scoreOverride, existingScoresCount: existingScores.length },
  });
}

router.put("/update-team", async (req, res, next) => {
  try {
    const admin = req.sessionUser!;
    const parsed = updateTeamSchema.parse(req.body);
    const { teamId, leaderMemberId, leaderEmail, leaderName, scoreOverride, scoreAuthPassword, ...teamUpdates } = parsed;

    // Security Gate: verifying committee authorization password BEFORE any updates
    if (scoreOverride !== undefined) {
      if (!scoreAuthPassword || scoreAuthPassword !== SCORE_SECURITY_PASSWORD) {
        throw new AppError(
          403,
          "Invalid security authorization password for score modifications. Access restricted to authorized committee members.",
          "INVALID_SCORE_AUTH_PASSWORD"
        );
      }
    }

    const result = await teamService.updateTeam(admin.profileId, teamId, teamUpdates);

    // Reassign team leader member if requested
    if (leaderMemberId) {
      await db.update(schema.teamMembers)
        .set({ role: "TEAM_MEMBER" })
        .where(eq(schema.teamMembers.teamId, teamId));
      await db.update(schema.teamMembers)
        .set({ role: "TEAM_LEADER" })
        .where(and(eq(schema.teamMembers.teamId, teamId), eq(schema.teamMembers.id, leaderMemberId)));
    }

    // Handle leader profile overrides (email / name)
    if (leaderEmail !== undefined || leaderName !== undefined) {
      const leaderMember = await db.query.teamMembers.findFirst({
        where: and(
          eq(schema.teamMembers.teamId, teamId),
          eq(schema.teamMembers.role, "TEAM_LEADER"),
          eq(schema.teamMembers.status, "ACTIVE")
        ),
        with: { user: true },
      });
      if (leaderMember) {
        const profileUpdates: Record<string, any> = { updatedAt: new Date() };
        if (leaderEmail !== undefined) profileUpdates.email = leaderEmail.toLowerCase().trim();
        if (leaderName !== undefined) profileUpdates.fullName = leaderName.trim();
        await db.update(schema.profiles)
          .set(profileUpdates)
          .where(eq(schema.profiles.id, leaderMember.userId));
        await auditService.log(db, {
          actorId: admin.profileId,
          action: "TEAM_UPDATED",
          entityType: "team",
          entityId: teamId,
          metadata: { type: "leader_profile_override", leaderUserId: leaderMember.userId, profileUpdates },
        });
      }
    }

    // Handle score override: guarantees score record update/creation
    if (scoreOverride !== undefined) {
      await applyScoreOverride(admin.profileId, teamId, scoreOverride);
    }

    res.json({
      success: true,
      message: "Team updated successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/teams/:teamId", async (req, res, next) => {
  try {
    const admin = req.sessionUser!;
    const teamId = req.params.teamId;
    const { leaderMemberId, leaderEmail, leaderName, scoreOverride, scoreAuthPassword, ...rest } = updateTeamSchema.omit({ teamId: true }).parse(req.body);

    // Security Gate: verifying committee authorization password BEFORE any updates
    if (scoreOverride !== undefined) {
      if (!scoreAuthPassword || scoreAuthPassword !== SCORE_SECURITY_PASSWORD) {
        throw new AppError(
          403,
          "Invalid security authorization password for score modifications. Access restricted to authorized committee members.",
          "INVALID_SCORE_AUTH_PASSWORD"
        );
      }
    }

    const result = await teamService.updateTeam(admin.profileId, teamId, rest);

    // Reassign team leader member if requested
    if (leaderMemberId) {
      await db.update(schema.teamMembers)
        .set({ role: "TEAM_MEMBER" })
        .where(eq(schema.teamMembers.teamId, teamId));
      await db.update(schema.teamMembers)
        .set({ role: "TEAM_LEADER" })
        .where(and(eq(schema.teamMembers.teamId, teamId), eq(schema.teamMembers.id, leaderMemberId)));
    }

    // Handle leader profile overrides
    if (leaderEmail !== undefined || leaderName !== undefined) {
      const leaderMember = await db.query.teamMembers.findFirst({
        where: and(
          eq(schema.teamMembers.teamId, teamId),
          eq(schema.teamMembers.role, "TEAM_LEADER"),
          eq(schema.teamMembers.status, "ACTIVE")
        ),
        with: { user: true },
      });
      if (leaderMember) {
        const profileUpdates: Record<string, any> = { updatedAt: new Date() };
        if (leaderEmail !== undefined) profileUpdates.email = leaderEmail.toLowerCase().trim();
        if (leaderName !== undefined) profileUpdates.fullName = leaderName.trim();
        await db.update(schema.profiles)
          .set(profileUpdates)
          .where(eq(schema.profiles.id, leaderMember.userId));
        await auditService.log(db, {
          actorId: admin.profileId,
          action: "TEAM_UPDATED",
          entityType: "team",
          entityId: teamId,
          metadata: { type: "leader_profile_override", leaderUserId: leaderMember.userId, profileUpdates },
        });
      }
    }

    // Handle score override
    if (scoreOverride !== undefined) {
      await applyScoreOverride(admin.profileId, teamId, scoreOverride);
    }

    res.json({
      success: true,
      message: "Team updated successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get all team submissions for admin / committee monitoring
 * GET /api/admin/submissions
 */
router.get("/submissions", async (req, res, next) => {
  try {
    const data = await submissionService.getAdminSubmissions();
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get single submission details for admin / committee
 * GET /api/admin/submissions/:teamId
 */
router.get("/submissions/:teamId", async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const data = await submissionService.getSubmissionByTeamId(teamId);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

