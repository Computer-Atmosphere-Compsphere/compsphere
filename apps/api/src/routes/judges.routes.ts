import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { scoringService } from "../services/scoring.service";
import { db, schema } from "@compsphere/db";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { AppError } from "../middleware/error.middleware";
import { auditService } from "../services/audit.service";
import { z } from "zod";

const router = Router();

// ═══════════════════════════════════════════════════════════════════
// JUDGE PORTAL (authenticated as JUDGE)
// ═══════════════════════════════════════════════════════════════════

/**
 * Get assigned teams for active judge
 * GET /api/judges/my-assignments
 */
router.get("/my-assignments", requireAuth, requireRole("JUDGE"), async (req, res, next) => {
  try {
    const user = req.sessionUser!;

    const judge = await db.query.judges.findFirst({
      where: eq(schema.judges.userId, user.profileId),
    });

    if (!judge || judge.status !== "ACTIVE") {
      throw new AppError(403, "You are not an active judge.", "INACTIVE_JUDGE");
    }

    const assignments = await db.query.judgeAssignments.findMany({
      where: eq(schema.judgeAssignments.judgeId, judge.id),
      with: {
        team: {
          with: {
            proposal: {
              with: { files: true },
            },
          },
        },
      },
      orderBy: (ja, { asc }) => [asc(ja.assignedAt)],
    });

    // Attach existing scores
    const assignmentsWithScores = await Promise.all(
      assignments.map(async (a) => {
        const score = await db.query.judgeScores.findFirst({
          where: and(
            eq(schema.judgeScores.judgeId, judge.id),
            eq(schema.judgeScores.teamId, a.teamId)
          ),
        });
        return { ...a, score: score || null };
      })
    );

    // Check code freeze
    const freezeConfig = await db.query.systemConfig.findFirst({
      where: eq(schema.systemConfig.key, "submission_deadline"),
    });
    const deadline = freezeConfig ? new Date(freezeConfig.value) : null;
    const isFrozen = deadline ? new Date() > deadline : false;

    res.json({
      success: true,
      data: {
        assignments: assignmentsWithScores,
        isFrozen,
        deadline: freezeConfig?.value ?? null,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Submit scores for an assigned team
 * POST /api/judges/submit-score
 */
router.post("/submit-score", requireAuth, requireRole("JUDGE"), async (req, res, next) => {
  try {
    const user = req.sessionUser!;
    const bodySchema = z.object({
      teamId: z.string().uuid(),
      mvpScore: z.number().min(1).max(100),
      impactScore: z.number().min(1).max(100),
      creativeScore: z.number().min(1).max(100),
      pitchScore: z.number().min(1).max(100),
      notes: z.string().optional(),
    });

    const parsed = bodySchema.parse(req.body);

    // Code freeze check
    const freezeConfig = await db.query.systemConfig.findFirst({
      where: eq(schema.systemConfig.key, "submission_deadline"),
    });
    if (freezeConfig && new Date() > new Date(freezeConfig.value)) {
      throw new AppError(403, "Code freeze active — submission deadline has passed.", "CODE_FREEZE");
    }

    const result = await scoringService.submitScore(user.profileId, parsed.teamId, {
      mvpScore: parsed.mvpScore,
      impactScore: parsed.impactScore,
      creativeScore: parsed.creativeScore,
      pitchScore: parsed.pitchScore,
    });

    res.json({
      success: true,
      message: "Score submitted successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// ═══════════════════════════════════════════════════════════════════
// ADMIN JUDGE MANAGEMENT (authenticated as ADMIN)
// ═══════════════════════════════════════════════════════════════════

/**
 * Get all judges with assignment counts
 * GET /api/judges
 */
router.get("/", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const judges = await db.query.judges.findMany({
      with: {
        user: {
          columns: { fullName: true, email: true, avatarUrl: true },
        },
      },
      orderBy: (j, { asc }) => [asc(j.id)],
    });

    // Count assignments per judge
    const judgesWithCounts = await Promise.all(
      judges.map(async (j) => {
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(schema.judgeAssignments)
          .where(eq(schema.judgeAssignments.judgeId, j.id));

        const [{ scored }] = await db
          .select({ scored: sql<number>`count(*)::int` })
          .from(schema.judgeScores)
          .where(eq(schema.judgeScores.judgeId, j.id));

        return {
          ...j,
          assignedTeamCount: count,
          scoredCount: scored,
        };
      })
    );

    res.json({
      success: true,
      data: judgesWithCounts,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Add a judge (Admin only)
 * POST /api/judges/add
 */
router.post("/add", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const admin = req.sessionUser!;
    const bodySchema = z.object({
      fullName: z.string().min(1),
      email: z.string().email(),
    });

    const { fullName, email } = bodySchema.parse(req.body);

    // Create or find profile
    let profile = await db.query.profiles.findFirst({
      where: eq(schema.profiles.email, email),
    });

    if (!profile) {
      [profile] = await db
        .insert(schema.profiles)
        .values({
          googleSub: `judge-${Date.now()}`,
          email,
          fullName,
          onboardingStatus: "COMPLETE",
        })
        .returning();
    }

    // Check if already a judge
    const existingJudge = await db.query.judges.findFirst({
      where: eq(schema.judges.userId, profile.id),
    });

    if (existingJudge) {
      if (existingJudge.status === "ACTIVE") {
        throw new AppError(400, "This person is already an active judge.");
      }
      // Reactivate
      await db.update(schema.judges)
        .set({ status: "ACTIVE" })
        .where(eq(schema.judges.id, existingJudge.id));

      await auditService.log(null, {
        actorId: admin.profileId,
        action: "JUDGE_REACTIVATED",
        entityType: "judge",
        entityId: existingJudge.id,
        metadata: { email, fullName },
      });

      res.json({ success: true, message: "Judge reactivated.", data: existingJudge });
      return;
    }

    // Assign JUDGE role
    await db.insert(schema.roleAssignments).values({
      userId: profile.id,
      role: "JUDGE",
      source: "admin_add",
    }).onConflictDoNothing();

    // Create judge record
    const [judge] = await db.insert(schema.judges).values({
      userId: profile.id,
      status: "ACTIVE",
    }).returning();

    await auditService.log(null, {
      actorId: admin.profileId,
      action: "JUDGE_ADDED",
      entityType: "judge",
      entityId: judge.id,
      metadata: { email, fullName },
    });

    res.json({
      success: true,
      message: "Judge added successfully.",
      data: judge,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Remove/deactivate a judge (Admin only)
 * POST /api/judges/remove
 */
router.post("/remove", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const admin = req.sessionUser!;
    const bodySchema = z.object({ judgeId: z.string().uuid() });
    const { judgeId } = bodySchema.parse(req.body);

    await db.update(schema.judges)
      .set({ status: "INACTIVE" })
      .where(eq(schema.judges.id, judgeId));

    await auditService.log(null, {
      actorId: admin.profileId,
      action: "JUDGE_REMOVED",
      entityType: "judge",
      entityId: judgeId,
    });

    res.json({ success: true, message: "Judge deactivated." });
  } catch (error) {
    next(error);
  }
});

/**
 * Activate/reactivate a judge (Admin only)
 * POST /api/judges/activate
 */
router.post("/activate", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const admin = req.sessionUser!;
    const bodySchema = z.object({ judgeId: z.string().uuid() });
    const { judgeId } = bodySchema.parse(req.body);

    await db.update(schema.judges)
      .set({ status: "ACTIVE" })
      .where(eq(schema.judges.id, judgeId));

    await auditService.log(null, {
      actorId: admin.profileId,
      action: "JUDGE_REACTIVATED",
      entityType: "judge",
      entityId: judgeId,
    });

    res.json({ success: true, message: "Judge reactivated." });
  } catch (error) {
    next(error);
  }
});

/**
 * Auto-assign judges to all teams using cross-judging algorithm
 * POST /api/judges/generate-phase-1
 *
 * Algorithm: Overlapping sets
 * - Each team is judged by exactly 2 judges
 * - Each judge handles ~N/judges*2 teams (overlapping windows)
 * - Example: 5 judges, 100 teams → each judge evaluates 40 teams
 *   Judge A: teams 1-40
 *   Judge B: teams 21-60
 *   Judge C: teams 41-80
 *   Judge D: teams 61-100
 *   Judge E: teams 81-100 + teams 1-20
 */
router.post("/generate-phase-1", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const admin = req.sessionUser!;

    // 1. Get all active judges
    const judges = await db.query.judges.findMany({
      where: eq(schema.judges.status, "ACTIVE"),
      with: { user: { columns: { fullName: true } } },
    });

    if (judges.length < 2) {
      throw new AppError(400, "At least 2 active judges are required for cross-judging.");
    }

    // 2. Get all teams with proposals (eligible for judging)
    const teams = await db.query.competitionTeams.findMany({
      orderBy: (t, { asc }) => [asc(t.originalRank)],
    });

    if (teams.length === 0) {
      throw new AppError(400, "No teams found to assign.");
    }

    const nJudges = judges.length;
    const nTeams = teams.length;

    // 3. Clear existing assignments (fresh generation)
    await db.delete(schema.judgeAssignments);

    // 4. Cross-judging assignment
    // Each judge covers a window of size ceil(nTeams / nJudges) * 2 / nJudges
    // But simpler: each team gets 2 judges. We use overlapping sliding windows.
    const windowSize = Math.ceil((nTeams * 2) / nJudges); // teams per judge
    const assignments: { judgeId: string; teamId: string }[] = [];

    for (let j = 0; j < nJudges; j++) {
      const startIdx = Math.floor((j * nTeams) / nJudges);
      const endIdx = startIdx + windowSize;

      for (let t = startIdx; t < endIdx && t < nTeams; t++) {
        // Wrap around for the last judge
        const teamIdx = t % nTeams;
        assignments.push({
          judgeId: judges[j].id,
          teamId: teams[teamIdx].id,
        });
      }
    }

    // 5. Deduplicate (if a team appears twice for same judge, keep only one)
    const seen = new Set<string>();
    const uniqueAssignments = assignments.filter((a) => {
      const key = `${a.judgeId}:${a.teamId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // 6. Verify each team has exactly 2 judges — fill gaps if needed
    const teamJudgeCount = new Map<string, string[]>();
    for (const a of uniqueAssignments) {
      const list = teamJudgeCount.get(a.teamId) || [];
      list.push(a.judgeId);
      teamJudgeCount.set(a.teamId, list);
    }

    // For teams with < 2 judges, assign from the judge with fewest assignments
    for (const team of teams) {
      const current = teamJudgeCount.get(team.id) || [];
      while (current.length < 2) {
        // Find judge with fewest assignments
        const judgeCounts = judges.map((j) => ({
          judgeId: j.id,
          count: uniqueAssignments.filter((a) => a.judgeId === j.id).length,
        }));
        judgeCounts.sort((a, b) => a.count - b.count);

        // Pick the first judge not already assigned to this team
        const available = judgeCounts.find((jc) => !current.includes(jc.judgeId));
        if (available) {
          uniqueAssignments.push({ judgeId: available.judgeId, teamId: team.id });
          current.push(available.judgeId);
          teamJudgeCount.set(team.id, current);
        } else {
          break; // all judges assigned, shouldn't happen
        }
      }
    }

    // 7. Bulk insert all assignments
    if (uniqueAssignments.length > 0) {
      // Insert in batches of 100 to avoid query size limits
      for (let i = 0; i < uniqueAssignments.length; i += 100) {
        const batch = uniqueAssignments.slice(i, i + 100);
        await db.insert(schema.judgeAssignments).values(
          batch.map((a) => ({
            judgeId: a.judgeId,
            teamId: a.teamId,
          }))
        );
      }
    }

    // 8. Update competition phase
    await db.update(schema.systemConfig)
      .set({ value: "1", updatedAt: new Date() })
      .where(eq(schema.systemConfig.key, "competition_phase"));

    // 9. Audit log
    await auditService.log(null, {
      actorId: admin.profileId,
      action: "PHASE1_JUDGING_GENERATED",
      entityType: "system",
      entityId: "phase-1",
      metadata: {
        judgeCount: nJudges,
        teamCount: nTeams,
        assignmentCount: uniqueAssignments.length,
        judges: judges.map((j) => j.user?.fullName || j.id),
      },
    });

    // 10. Compute summary stats
    const summary = judges.map((j) => {
      const assigned = uniqueAssignments.filter((a) => a.judgeId === j.id);
      return {
        judgeId: j.id,
        judgeName: j.user?.fullName || "Unknown",
        assignedCount: assigned.length,
        teams: assigned.map((a) => a.teamId),
      };
    });

    const perTeamCounts = teams.map((t) => ({
      teamId: t.id,
      teamCode: t.teamCode,
      teamName: t.teamName,
      judgeCount: (teamJudgeCount.get(t.id) || []).length,
    }));

    res.json({
      success: true,
      message: `Phase 1 judging generated: ${uniqueAssignments.length} assignments across ${nJudges} judges and ${nTeams} teams.`,
      data: {
        assignments: uniqueAssignments.length,
        judges: summary,
        teams: perTeamCounts,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get assignment matrix overview (Admin)
 * GET /api/judges/assignment-matrix
 */
router.get("/assignment-matrix", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const judges = await db.query.judges.findMany({
      where: eq(schema.judges.status, "ACTIVE"),
      with: { user: { columns: { fullName: true, email: true } } },
    });

    const assignments = await db.query.judgeAssignments.findMany({
      orderBy: (ja, { asc }) => [asc(ja.assignedAt)],
    });

    // Score progress
    const scores = await db.query.judgeScores.findMany({});

    const matrix = judges.map((j) => {
      const myAssignments = assignments.filter((a) => a.judgeId === j.id);
      const myScores = scores.filter((s) => s.judgeId === j.id);
      return {
        judgeId: j.id,
        judgeName: j.user?.fullName || "Unknown",
        judgeEmail: j.user?.email,
        assignedCount: myAssignments.length,
        scoredCount: myScores.length,
        teamIds: myAssignments.map((a) => a.teamId),
      };
    });

    // Per-team view
    const allTeamIds = [...new Set(assignments.map((a) => a.teamId))];
    const teams = await db.query.competitionTeams.findMany({
      where: allTeamIds.length > 0
        ? sql`${schema.competitionTeams.id} IN (${sql.join(allTeamIds.map((id) => sql`${id}`), sql`, `)})`
        : undefined,
      orderBy: (t, { asc }) => [asc(t.originalRank)],
    });

    const teamMatrix = teams.map((t) => {
      const teamAssignments = assignments.filter((a) => a.teamId === t.id);
      const teamScores = scores.filter((s) => s.teamId === t.id);
      return {
        teamId: t.id,
        teamCode: t.teamCode,
        teamName: t.teamName,
        category: t.category,
        rank: t.originalRank,
        judgeCount: teamAssignments.length,
        scoreCount: teamScores.length,
        judges: teamAssignments.map((a) => {
          const judge = judges.find((j) => j.id === a.judgeId);
          const score = teamScores.find((s) => s.judgeId === a.judgeId);
          return {
            judgeId: a.judgeId,
            judgeName: judge?.user?.fullName || "Unknown",
            hasScored: !!score,
            finalScore: score?.finalScore ?? null,
          };
        }),
      };
    });

    res.json({
      success: true,
      data: { judges: matrix, teams: teamMatrix },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get leaderboard (Admin)
 * GET /api/judges/leaderboard
 */
router.get("/leaderboard", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const leaderboard = await scoringService.getLeaderboard();

    // Progress stats
    const totalAssignments = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.judgeAssignments);

    const totalScores = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.judgeScores);

    const progress = {
      totalAssignments: totalAssignments[0]?.count ?? 0,
      totalScores: totalScores[0]?.count ?? 0,
      percentage: totalAssignments[0]?.count
        ? Math.round(((totalScores[0]?.count ?? 0) / totalAssignments[0].count) * 100)
        : 0,
    };

    res.json({
      success: true,
      data: { leaderboard, progress },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
