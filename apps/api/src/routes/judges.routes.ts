import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { scoringService } from "../services/scoring.service";
import { db, schema } from "@compsphere/db";
import { eq, and, sql } from "drizzle-orm";
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

    // Single raw SQL join — avoids Drizzle ORM relational N+1 / UUID binding issues
    const rows = await db.execute(sql`
      SELECT
        ja.id              AS assignment_id,
        ja.assigned_at,
        ct.id              AS team_id,
        ct.team_code,
        ct.team_name,
        ct.category,
        ct.status          AS team_status,
        ct.original_rank,
        p.id               AS proposal_id,
        p.title            AS proposal_title,
        p.description      AS proposal_description,
        p.devpost_url,
        js.id              AS score_id,
        js.technical_score,
        js.problem_score,
        js.innovation_score,
        js.market_score,
        js.document_score,
        js.final_score,
        js.submitted_at    AS score_submitted_at,
        js.updated_at      AS score_updated_at,
        j.id               AS judge_id
      FROM judges j
      INNER JOIN profiles pr ON pr.id = j.user_id
      INNER JOIN judge_assignments ja ON ja.judge_id = j.id
      INNER JOIN competition_teams ct ON ct.id = ja.team_id
      LEFT JOIN proposals p ON p.team_id = ct.id
      LEFT JOIN judge_scores js ON js.judge_id = j.id AND js.team_id = ct.id
      WHERE pr.id = ${user.profileId}
        AND j.status = 'ACTIVE'
      ORDER BY ja.assigned_at ASC
    `);

    const rawRows = Array.isArray(rows) ? rows : (rows as any).rows ?? [];

    // Check code freeze
    const freezeConfig = await db.query.systemConfig.findFirst({
      where: eq(schema.systemConfig.key, "submission_deadline"),
    });
    const deadline = freezeConfig ? new Date(freezeConfig.value) : null;
    const isFrozen = deadline ? new Date() > deadline : false;

    const assignments = rawRows.map((row: any) => ({
      id: row.assignment_id,
      judgeId: row.judge_id,
      teamId: row.team_id,
      assignedAt: row.assigned_at,
      team: {
        id: row.team_id,
        teamCode: row.team_code,
        teamName: row.team_name,
        category: row.category,
        status: row.team_status,
        originalRank: row.original_rank,
        proposal: row.proposal_id
          ? {
              id: row.proposal_id,
              title: row.proposal_title,
              description: row.proposal_description,
              devpostUrl: row.devpost_url,
            }
          : null,
      },
      score: row.score_id
        ? {
            id: row.score_id,
            technicalScore: Number(row.technical_score),
            problemScore: Number(row.problem_score),
            innovationScore: Number(row.innovation_score),
            marketScore: Number(row.market_score),
            documentScore: Number(row.document_score),
            finalScore: row.final_score,
            submittedAt: row.score_submitted_at,
            updatedAt: row.score_updated_at,
          }
        : null,
    }));

    res.json({
      success: true,
      data: {
        assignments,
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
      technicalScore: z.number().min(1).max(100),
      problemScore: z.number().min(1).max(100),
      innovationScore: z.number().min(1).max(100),
      marketScore: z.number().min(1).max(100),
      documentScore: z.number().min(1).max(100),
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
      technicalScore: parsed.technicalScore,
      problemScore: parsed.problemScore,
      innovationScore: parsed.innovationScore,
      marketScore: parsed.marketScore,
      documentScore: parsed.documentScore,
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
    // Single raw SQL with all aggregations — no N+1, no Drizzle relational ORM issues
    const rows = await db.execute(sql`
      SELECT
        j.id,
        j.status,
        pr.id          AS user_id,
        pr.full_name,
        pr.email,
        pr.avatar_url,
        pr.created_at  AS user_created_at,
        COALESCE(asgn.assigned_count, 0)::int AS assigned_team_count,
        COALESCE(scrd.scored_count,   0)::int AS scored_count
      FROM judges j
      INNER JOIN profiles pr ON pr.id = j.user_id
      LEFT JOIN (
        SELECT judge_id, COUNT(*) AS assigned_count
        FROM judge_assignments
        GROUP BY judge_id
      ) asgn ON asgn.judge_id = j.id
      LEFT JOIN (
        SELECT judge_id, COUNT(*) AS scored_count
        FROM judge_scores
        GROUP BY judge_id
      ) scrd ON scrd.judge_id = j.id
      ORDER BY pr.full_name ASC
    `);

    const rawRows = Array.isArray(rows) ? rows : (rows as any).rows ?? [];

    const judges = rawRows.map((row: any) => ({
      id: row.id,
      status: row.status,
      userId: row.user_id,
      user: {
        id: row.user_id,
        fullName: row.full_name,
        email: row.email,
        avatarUrl: row.avatar_url,
        createdAt: row.user_created_at,
      },
      assignedTeamCount: Number(row.assigned_team_count),
      scoredCount: Number(row.scored_count),
    }));

    res.json({
      success: true,
      data: judges,
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

    // 1. Get all active judges (raw SQL, no Drizzle relational)
    const judgeRows = await db.execute(sql`
      SELECT j.id, pr.full_name
      FROM judges j
      INNER JOIN profiles pr ON pr.id = j.user_id
      WHERE j.status = 'ACTIVE'
      ORDER BY j.id ASC
    `);
    const judges = (Array.isArray(judgeRows) ? judgeRows : (judgeRows as any).rows ?? []) as {
      id: string;
      full_name: string;
    }[];

    if (judges.length < 2) {
      throw new AppError(400, "At least 2 active judges are required for cross-judging.");
    }

    // 2. Get all teams ordered by rank (raw SQL)
    const teamRows = await db.execute(sql`
      SELECT id, team_code, team_name
      FROM competition_teams
      ORDER BY original_rank ASC
    `);
    const teams = (Array.isArray(teamRows) ? teamRows : (teamRows as any).rows ?? []) as {
      id: string;
      team_code: string;
      team_name: string;
    }[];

    if (teams.length === 0) {
      throw new AppError(400, "No teams found to assign.");
    }

    const nJudges = judges.length;
    const nTeams = teams.length;

    // 3. Generate balanced 2-judge cross-assignments using modular rotation
    const assignments: { judgeId: string; teamId: string }[] = [];
    const JUDGES_PER_TEAM = 2;

    for (let i = 0; i < nTeams; i++) {
      const teamId = teams[i].id;
      for (let k = 0; k < JUDGES_PER_TEAM; k++) {
        const judgeIdx = (i + k) % nJudges;
        assignments.push({ judgeId: judges[judgeIdx].id, teamId });
      }
    }

    // 4. Deduplicate assignments
    const seen = new Set<string>();
    const uniqueAssignments = assignments.filter((a) => {
      const key = `${a.judgeId}:${a.teamId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // 5. Clear old assignments
    await db.execute(sql`DELETE FROM judge_assignments`);

    // 6. Bulk insert new assignments (batches of 100 via raw SQL to avoid UUID binding issues)
    for (let i = 0; i < uniqueAssignments.length; i += 100) {
      const batch = uniqueAssignments.slice(i, i + 100);
      const valueClauses = batch.map(
        (a) => sql`(${a.judgeId}::uuid, ${a.teamId}::uuid, NOW())`
      );
      await db.execute(
        sql`INSERT INTO judge_assignments (judge_id, team_id, assigned_at) VALUES ${sql.join(valueClauses, sql`, `)}`
      );
    }

    // 7. Update competition phase via upsert
    await db.execute(sql`
      INSERT INTO system_config (key, value, type, updated_at)
      VALUES ('competition_phase', '1', 'STRING', NOW())
      ON CONFLICT (key) DO UPDATE SET value = '1', updated_at = NOW()
    `);

    // 8. Audit log
    await auditService.log(null, {
      actorId: admin.profileId,
      action: "PHASE1_JUDGING_GENERATED",
      entityType: "system",
      entityId: "phase-1",
      metadata: {
        judgeCount: nJudges,
        teamCount: nTeams,
        assignmentCount: uniqueAssignments.length,
        judges: judges.map((j) => (j as any).full_name || j.id),
      },
    });

    // 9. Compute summary stats
    const summary = judges.map((j) => {
      const assigned = uniqueAssignments.filter((a) => a.judgeId === j.id);
      return {
        judgeId: j.id,
        judgeName: (j as any).full_name || "Unknown",
        assignedCount: assigned.length,
        teams: assigned.map((a) => a.teamId),
      };
    });

    res.json({
      success: true,
      message: `Phase 1 judging generated: ${uniqueAssignments.length} assignments across ${nJudges} judges and ${nTeams} teams.`,
      data: {
        assignments: uniqueAssignments.length,
        judges: summary,
      },
    });
  } catch (error) {
    next(error);
  }
});


/**
 * Get assignment matrix overview (Admin)
 * GET /api/judges/assignment-matrix
 *
 * Fully raw SQL — eliminates Drizzle relational ORM issues in production.
 */
router.get("/assignment-matrix", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    // 1. Judge summary with aggregated counts
    const judgeMatrixRows = await db.execute(sql`
      SELECT
        j.id               AS judge_id,
        j.status,
        pr.full_name       AS judge_name,
        pr.email           AS judge_email,
        COALESCE(asgn.assigned_count, 0)::int AS assigned_count,
        COALESCE(scrd.scored_count,   0)::int AS scored_count
      FROM judges j
      INNER JOIN profiles pr ON pr.id = j.user_id
      LEFT JOIN (
        SELECT judge_id, COUNT(*) AS assigned_count
        FROM judge_assignments
        GROUP BY judge_id
      ) asgn ON asgn.judge_id = j.id
      LEFT JOIN (
        SELECT judge_id, COUNT(*) AS scored_count
        FROM judge_scores
        GROUP BY judge_id
      ) scrd ON scrd.judge_id = j.id
      WHERE j.status = 'ACTIVE'
      ORDER BY pr.full_name ASC
    `);
    const judgeMatrixRaw = Array.isArray(judgeMatrixRows)
      ? judgeMatrixRows
      : (judgeMatrixRows as any).rows ?? [];

    // 2. Team matrix with aggregated judge/score counts
    const teamMatrixRows = await db.execute(sql`
      SELECT
        ct.id              AS team_id,
        ct.team_code,
        ct.team_name,
        ct.category,
        ct.original_rank,
        COUNT(DISTINCT ja.id)::int  AS judge_count,
        COUNT(DISTINCT js.id)::int  AS score_count
      FROM competition_teams ct
      LEFT JOIN judge_assignments ja ON ja.team_id = ct.id
      LEFT JOIN judge_scores js      ON js.team_id  = ct.id
      GROUP BY ct.id, ct.team_code, ct.team_name, ct.category, ct.original_rank
      ORDER BY ct.original_rank ASC
    `);
    const teamMatrixRaw = Array.isArray(teamMatrixRows)
      ? teamMatrixRows
      : (teamMatrixRows as any).rows ?? [];

    // 3. Per-team judge detail (which judge has scored which team)
    const teamJudgeDetailRows = await db.execute(sql`
      SELECT
        ja.team_id,
        ja.judge_id,
        pr.full_name       AS judge_name,
        js.final_score,
        CASE WHEN js.id IS NOT NULL THEN true ELSE false END AS has_scored
      FROM judge_assignments ja
      INNER JOIN judges j     ON j.id  = ja.judge_id
      INNER JOIN profiles pr  ON pr.id = j.user_id
      LEFT JOIN judge_scores js
             ON js.judge_id = ja.judge_id
            AND js.team_id  = ja.team_id
      ORDER BY ja.team_id, pr.full_name
    `);
    const teamJudgeDetailRaw = Array.isArray(teamJudgeDetailRows)
      ? teamJudgeDetailRows
      : (teamJudgeDetailRows as any).rows ?? [];

    // Build lookup: teamId -> array of judge details
    const teamJudgeMap = new Map<string, any[]>();
    for (const row of teamJudgeDetailRaw as any[]) {
      const entry = {
        judgeId: row.judge_id,
        judgeName: row.judge_name,
        hasScored: row.has_scored === true || row.has_scored === "true",
        finalScore: row.final_score ?? null,
      };
      if (!teamJudgeMap.has(row.team_id)) teamJudgeMap.set(row.team_id, []);
      teamJudgeMap.get(row.team_id)!.push(entry);
    }

    const matrix = (judgeMatrixRaw as any[]).map((row) => ({
      judgeId: row.judge_id,
      judgeName: row.judge_name,
      judgeEmail: row.judge_email,
      assignedCount: Number(row.assigned_count),
      scoredCount: Number(row.scored_count),
    }));

    const teamMatrix = (teamMatrixRaw as any[]).map((row) => ({
      teamId: row.team_id,
      teamCode: row.team_code,
      teamName: row.team_name,
      category: row.category,
      rank: Number(row.original_rank),
      judgeCount: Number(row.judge_count),
      scoreCount: Number(row.score_count),
      judges: teamJudgeMap.get(row.team_id) ?? [],
    }));

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

    // Single query for both counts
    const progressRows = await db.execute(sql`
      SELECT
        (SELECT COUNT(*) FROM judge_assignments)::int AS total_assignments,
        (SELECT COUNT(*) FROM judge_scores)::int      AS total_scores
    `);
    const progressRaw = Array.isArray(progressRows)
      ? progressRows[0]
      : ((progressRows as any).rows ?? [])[0] ?? {};

    const totalAssignments = Number(progressRaw?.total_assignments ?? 0);
    const totalScores = Number(progressRaw?.total_scores ?? 0);
    const progress = {
      totalAssignments,
      totalScores,
      percentage: totalAssignments > 0
        ? Math.round((totalScores / totalAssignments) * 100)
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

