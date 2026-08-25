import { db, schema } from "@compsphere/db";
import { eq, and, sql } from "drizzle-orm";
import { AppError } from "../middleware/error.middleware.js";
import { auditService } from "./audit.service.js";
import { calculateFinalScore } from "@compsphere/types";
export const scoringService = {
    /**
     * Get the judging weights from system config, or defaults.
     */
    async getWeights() {
        const keys = [
            "scoring_weight_mvp",
            "scoring_weight_impact",
            "scoring_weight_creative",
            "scoring_weight_pitch",
        ];
        const configs = await db.query.systemConfig.findMany({
            where: sql `key IN (${sql.join(keys.map((k) => sql.raw(`'${k}'`)), sql.raw(","))})`,
        });
        const weights = {
            mvp: 0.35,
            impact: 0.3,
            creative: 0.2,
            pitch: 0.15,
        };
        configs.forEach((c) => {
            if (c.key === "scoring_weight_mvp")
                weights.mvp = parseFloat(c.value);
            if (c.key === "scoring_weight_impact")
                weights.impact = parseFloat(c.value);
            if (c.key === "scoring_weight_creative")
                weights.creative = parseFloat(c.value);
            if (c.key === "scoring_weight_pitch")
                weights.pitch = parseFloat(c.value);
        });
        return weights;
    },
    /**
     * Submit or update a score for a team by a judge.
     * Ensures judge is assigned to team and scores are valid.
     */
    async submitScore(userId, teamId, scores) {
        // Validate score ranges
        const allScores = [scores.mvpScore, scores.impactScore, scores.creativeScore, scores.pitchScore];
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
                where: and(eq(schema.judgeAssignments.judgeId, judge.id), eq(schema.judgeAssignments.teamId, teamId)),
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
                where: and(eq(schema.judgeScores.judgeId, judge.id), eq(schema.judgeScores.teamId, teamId)),
            });
            let scoreRecord;
            if (existing) {
                [scoreRecord] = await tx
                    .update(schema.judgeScores)
                    .set({
                    mvpScore: scores.mvpScore,
                    impactScore: scores.impactScore,
                    creativeScore: scores.creativeScore,
                    pitchScore: scores.pitchScore,
                    finalScore: finalScore.toString(),
                    updatedAt: new Date(),
                })
                    .where(eq(schema.judgeScores.id, existing.id))
                    .returning();
            }
            else {
                [scoreRecord] = await tx
                    .insert(schema.judgeScores)
                    .values({
                    judgeId: judge.id,
                    teamId,
                    mvpScore: scores.mvpScore,
                    impactScore: scores.impactScore,
                    creativeScore: scores.creativeScore,
                    pitchScore: scores.pitchScore,
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
     * Get team scoreboard with aggregated scores
     */
    async getLeaderboard() {
        return await db.execute(sql `
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
    },
};
//# sourceMappingURL=scoring.service.js.map