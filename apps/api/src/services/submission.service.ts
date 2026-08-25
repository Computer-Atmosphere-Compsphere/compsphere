import { db, schema } from "@compsphere/db";
import { eq } from "drizzle-orm";
import { AppError } from "../middleware/error.middleware";
import { auditService } from "./audit.service";
import { sseService } from "../sse/sse.service";

export const submissionService = {
  /**
   * Get the configured submission deadline.
   */
  async getDeadline(): Promise<Date> {
    const config = await db.query.systemConfig.findFirst({
      where: eq(schema.systemConfig.key, "submission_deadline"),
    });
    return config ? new Date(config.value) : new Date("2026-10-11T10:00:00+07:00");
  },

  /**
   * Submit Phase 2 deliverables for a team.
   * Atomically validates deadline and inserts/updates submission.
   */
  async submit(
    teamId: string,
    userId: string,
    repositoryUrl: string,
    deploymentUrl: string | null,
    slideStorageKey: string | null,
    slideFilename: string | null,
    slideSizeBytes: number | null
  ) {
    const deadline = await this.getDeadline();
    if (new Date() >= deadline) {
      throw new AppError(400, "Submission window has closed.", "SUBMISSION_LOCKED");
    }

    return await db.transaction(async (tx) => {
      // Ensure team is VERIFIED/eligible
      const team = await tx.query.competitionTeams.findFirst({
        where: eq(schema.competitionTeams.id, teamId),
      });

      if (!team) throw new AppError(404, "Team not found");
      if (team.status !== "VERIFIED" && team.status !== "SUBMITTED" && team.status !== "SUBMISSION_OPEN") {
        throw new AppError(400, "Your team must be verified before submitting deliverables.");
      }

      // Check if a slide is already uploaded and we need to overwrite
      const existing = await tx.query.submissions.findFirst({
        where: eq(schema.submissions.teamId, teamId),
      });

      let submission;
      if (existing) {
        [submission] = await tx
          .update(schema.submissions)
          .set({
            repositoryUrl,
            deploymentUrl,
            slideStorageKey: slideStorageKey || existing.slideStorageKey,
            slideFilename: slideFilename || existing.slideFilename,
            slideSizeBytes: slideSizeBytes || existing.slideSizeBytes,
            submittedAt: new Date(),
            status: "SUBMITTED",
          })
          .where(eq(schema.submissions.id, existing.id))
          .returning();
      } else {
        if (!slideStorageKey) {
          throw new AppError(400, "Presentation slides file is required for first-time submission.");
        }

        [submission] = await tx
          .insert(schema.submissions)
          .values({
            teamId,
            repositoryUrl,
            deploymentUrl,
            slideStorageKey,
            slideFilename,
            slideSizeBytes,
            status: "SUBMITTED",
          })
          .returning();
      }

      // Update team status to SUBMITTED
      await tx
        .update(schema.competitionTeams)
        .set({ status: "SUBMITTED", updatedAt: new Date() })
        .where(eq(schema.competitionTeams.id, teamId));

      await auditService.log(tx, {
        actorId: userId,
        action: "SUBMISSION_UPDATED",
        entityType: "submission",
        entityId: submission.id,
        metadata: { repositoryUrl, slideFilename },
      });

      sseService.sendToTeam(teamId, "team:status_changed", {
        teamId,
        newStatus: "SUBMITTED",
      });

      sseService.broadcast("admin:counter_updated", { event: "submission_submitted" });

      return submission;
    });
  },

  /**
   * Get all submissions (monitoring)
   */
  async getSubmissions() {
    return await db.query.submissions.findMany({
      with: {
        team: true,
      },
    });
  },
};
