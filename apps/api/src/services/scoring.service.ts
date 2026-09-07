import { db, schema } from "@compsphere/db";
import { eq, and, sql, inArray } from "drizzle-orm";
import { AppError } from "../middleware/error.middleware";
import { auditService } from "./audit.service";
import { calculateFinalScore } from "@compsphere/types";

export const scoringService = {
  /**
   * Get Phase 1 judging weights from system config, or defaults.
   *
   * Phase 1 — Babak Penyisihan Online Criteria:
   *   technical  : Technical Architecture & Feasibility  — 30%
   *   problem    : Problem Relevance & Solution Fit       — 20%
   *   innovation : Innovation & Value Proposition         — 25%
   *   market     : Market & Impact Viability              — 15%
   *   document   : Document Clarity & Structure           — 10%
   */
  async getWeights() {
    const keys = [
      "scoring_weight_technical",
      "scoring_weight_problem",
      "scoring_weight_innovation",
      "scoring_weight_market",
      "scoring_weight_document",
    ];

    // Use inArray for safe parameterized query (avoids sql.raw UUID binding issues)
    const configs = await db.query.systemConfig.findMany({
      where: inArray(schema.systemConfig.key, keys),
    });

    const weights = {
      technical: 0.30,
      problem: 0.20,
      innovation: 0.25,
      market: 0.15,
      document: 0.10,
    };

    configs.forEach((c) => {
      if (c.key === "scoring_weight_technical")  weights.technical  = parseFloat(c.value);
      if (c.key === "scoring_weight_problem")    weights.problem    = parseFloat(c.value);
      if (c.key === "scoring_weight_innovation") weights.innovation = parseFloat(c.value);
      if (c.key === "scoring_weight_market")     weights.market     = parseFloat(c.value);
      if (c.key === "scoring_weight_document")   weights.document   = parseFloat(c.value);
    });

    return weights;
  },


  /**
   * Submit or update a Phase 1 score for a team by a judge.
   * Ensures judge is assigned to team and scores are valid (1–100).
   */
  async submitScore(
    userId: string,
    teamId: string,
    scores: {
      technicalScore: number;
      problemScore: number;
      innovationScore: number;
      marketScore: number;
      documentScore: number;
    }
  ) {
    // Validate score ranges
    const allScores = [
      scores.technicalScore,
      scores.problemScore,
      scores.innovationScore,
      scores.marketScore,
      scores.documentScore,
    ];
    if (allScores.some((s) => s < 1 || s > 100)) {
      throw new AppError(400, "Scores must be between 1 and 100.");
    }

    return await db.transaction(async (tx) => {
      // Find the judge ID for this user
      const judge = await tx.query.judges.findFirst({
        where: eq(schema.judges.userId, userId),
      });

      if (!judge || judge.status !== "ACTIVE") {
        throw new AppError(403, "You are not an active judge.", "INACTIVE_JUDGE");
      }

      // Check assignment
      const assignment = await tx.query.judgeAssignments.findFirst({
        where: and(
          eq(schema.judgeAssignments.judgeId, judge.id),
          eq(schema.judgeAssignments.teamId, teamId)
        ),
      });

      if (!assignment) {
        throw new AppError(403, "You are not assigned to score this team.", "UNASSIGNED_TEAM");
      }

      // Load weights and calculate final score
      const weights = await this.getWeights();
      const finalScoreDecimal = calculateFinalScore(scores, weights);
      const finalScore = parseFloat(finalScoreDecimal.toFixed(2));

      // Check if existing score exists
      const existing = await tx.query.judgeScores.findFirst({
        where: and(
          eq(schema.judgeScores.judgeId, judge.id),
          eq(schema.judgeScores.teamId, teamId)
        ),
      });

      let scoreRecord;
      if (existing) {
        [scoreRecord] = await tx
          .update(schema.judgeScores)
          .set({
            technicalScore: scores.technicalScore,
            problemScore: scores.problemScore,
            innovationScore: scores.innovationScore,
            marketScore: scores.marketScore,
            documentScore: scores.documentScore,
            finalScore: finalScore.toString(),
            updatedAt: new Date(),
          })
          .where(eq(schema.judgeScores.id, existing.id))
          .returning();
      } else {
        [scoreRecord] = await tx
          .insert(schema.judgeScores)
          .values({
            judgeId: judge.id,
            teamId,
            technicalScore: scores.technicalScore,
            problemScore: scores.problemScore,
            innovationScore: scores.innovationScore,
            marketScore: scores.marketScore,
            documentScore: scores.documentScore,
            finalScore: finalScore.toString(),
          })
          .returning();
      }

      // Update team status to JUDGED if all assigned judges have scored
      const totalAssignments = await tx.query.judgeAssignments.findMany({
        where: eq(schema.judgeAssignments.teamId, teamId),
      });

      const totalScores = await tx.query.judgeScores.findMany({
        where: eq(schema.judgeScores.teamId, teamId),
      });

      if (totalScores.length >= totalAssignments.length && totalAssignments.length > 0) {
        await tx
          .update(schema.competitionTeams)
          .set({ status: "JUDGED", updatedAt: new Date() })
          .where(eq(schema.competitionTeams.id, teamId));
      }

      await auditService.log(tx, {
        actorId: userId,
        action: "SCORE_SUBMITTED",
        entityType: "score",
        entityId: scoreRecord.id,
        metadata: { teamId, finalScore, ...scores },
      });

      return { ...scoreRecord, finalScore };
    });
  },

  /**
   * Get team scoreboard with aggregated scores (Phase 1 leaderboard)
   */
  async getLeaderboard() {
    const res = await db.execute(sql`
      SELECT
        ct.id AS team_id,
        ct.team_name,
        ct.team_code,
        ct.category,
        COALESCE(AVG(js.final_score::numeric), 0)::float AS average_score,
        COUNT(js.id) AS judge_count
      FROM competition_teams ct
      LEFT JOIN judge_scores js ON ct.id = js.team_id
      WHERE ct.status IN ('VERIFIED', 'SUBMITTED', 'JUDGED')
      GROUP BY ct.id, ct.team_name, ct.team_code, ct.category
      ORDER BY average_score DESC, ct.original_rank ASC
    `);
    return Array.isArray(res) ? res : (res as any).rows ?? [];
  },
};
