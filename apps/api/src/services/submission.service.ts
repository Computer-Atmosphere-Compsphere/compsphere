import { db, schema } from "@compsphere/db";
import { eq, inArray } from "drizzle-orm";
import { AppError } from "../middleware/error.middleware";
import { auditService } from "./audit.service";
import { sseService } from "../sse/sse.service";
import { isHostinger, generatePresignedUrl } from "../lib/storage";

function getSlideUrl(slideStorageKey: string | null, slideFilename: string | null): string | null {
  if (!slideStorageKey) return null;
  if (isHostinger) {
    try {
      return generatePresignedUrl(slideStorageKey, 3600, slideFilename ?? undefined);
    } catch {
      return `/api/uploads/${slideStorageKey.replace(/^\/?/, "")}`;
    }
  }
  return `/api/uploads/${slideStorageKey.replace(/^\/?/, "")}`;
}

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
      if (
        team.status !== "VERIFIED" &&
        team.status !== "SUBMITTED" &&
        team.status !== "JUDGED" &&
        team.status !== "SUBMISSION_OPEN"
      ) {
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

  /**
   * Get all submissions with full team, proposal, and member details for admin / committee monitoring.
   */
  async getAdminSubmissions() {
    const deadline = await this.getDeadline();
    const isDeadlineExpired = new Date() >= deadline;

    // 1. Fetch all submissions with team, members, and proposal
    const rawSubmissions = await db.query.submissions.findMany({
      orderBy: (s, { desc }) => [desc(s.submittedAt)],
      with: {
        team: {
          with: {
            members: {
              where: eq(schema.teamMembers.status, "ACTIVE"),
              with: { user: true },
            },
            proposal: {
              with: {
                files: true,
              },
            },
          },
        },
      },
    });

    const submissions = rawSubmissions.map((s) => {
      const slideUrl = getSlideUrl(s.slideStorageKey, s.slideFilename);
      const team = s.team;
      const proposal = team?.proposal?.[0] ?? null;
      const members = team?.members ?? [];
      const leader = members.find((m) => m.role === "TEAM_LEADER") || members[0] || null;

      return {
        id: s.id,
        teamId: s.teamId,
        repositoryUrl: s.repositoryUrl,
        deploymentUrl: s.deploymentUrl,
        slideStorageKey: s.slideStorageKey,
        slideFilename: s.slideFilename,
        slideSizeBytes: s.slideSizeBytes,
        submittedAt: s.submittedAt,
        status: s.status,
        slideUrl,
        team: team
          ? {
              id: team.id,
              teamCode: team.teamCode,
              teamName: team.teamName,
              category: team.category,
              countryMix: team.countryMix,
              originalRank: team.originalRank,
              status: team.status,
            }
          : null,
        proposal: proposal
          ? {
              id: proposal.id,
              title: proposal.title,
              description: proposal.description,
              devpostUrl: proposal.devpostUrl,
              files: proposal.files ?? [],
            }
          : null,
        leader: leader?.user
          ? {
              id: leader.user.id,
              fullName: leader.user.fullName,
              email: leader.user.email,
              avatarUrl: leader.user.avatarUrl,
            }
          : null,
        members: members.map((m) => ({
          id: m.id,
          role: m.role,
          status: m.status,
          user: m.user
            ? {
                id: m.user.id,
                fullName: m.user.fullName,
                email: m.user.email,
                avatarUrl: m.user.avatarUrl,
              }
            : null,
        })),
      };
    });

    const submittedTeamIds = new Set(submissions.map((s) => s.teamId));

    // 2. Fetch eligible teams for Phase 2 that might not have submitted yet
    const eligibleTeams = await db.query.competitionTeams.findMany({
      where: inArray(schema.competitionTeams.status, [
        "VERIFIED",
        "SUBMISSION_OPEN",
        "SUBMITTED",
        "JUDGED",
        "FINALIST",
      ]),
      orderBy: [schema.competitionTeams.teamCode],
      with: {
        members: {
          where: eq(schema.teamMembers.status, "ACTIVE"),
          with: { user: true },
        },
        proposal: true,
      },
    });

    const missingTeams = eligibleTeams
      .filter((t) => !submittedTeamIds.has(t.id))
      .map((t) => {
        const leader = t.members.find((m) => m.role === "TEAM_LEADER") || t.members[0];
        const proposal = t.proposal?.[0];
        return {
          teamId: t.id,
          teamCode: t.teamCode,
          teamName: t.teamName,
          category: t.category,
          countryMix: t.countryMix,
          status: t.status,
          leader: leader?.user
            ? {
                name: leader.user.fullName,
                email: leader.user.email,
                avatarUrl: leader.user.avatarUrl,
              }
            : null,
          proposalTitle: proposal?.title || null,
          memberCount: t.members.length,
        };
      });

    // 3. Calculate summary metrics
    const totalSubmissions = submissions.length;
    const totalEligible = eligibleTeams.length;
    const submissionRate = totalEligible > 0 ? Math.round((totalSubmissions / totalEligible) * 100) : 0;
    const withRepository = submissions.filter((s) => !!s.repositoryUrl?.trim()).length;
    const withDeployment = submissions.filter((s) => !!s.deploymentUrl?.trim()).length;
    const withSlide = submissions.filter((s) => !!s.slideStorageKey).length;
    const completeDeliverables = submissions.filter(
      (s) => !!s.repositoryUrl?.trim() && !!s.deploymentUrl?.trim() && !!s.slideStorageKey
    ).length;

    const metrics = {
      totalSubmissions,
      totalEligible,
      submissionRate,
      withRepository,
      withDeployment,
      withSlide,
      completeDeliverables,
      missingCount: missingTeams.length,
      deadline: deadline.toISOString(),
      isExpired: isDeadlineExpired,
    };

    return {
      submissions,
      missingTeams,
      metrics,
    };
  },

  /**
   * Get single submission details for admin / committee
   */
  async getSubmissionByTeamId(teamId: string) {
    const team = await db.query.competitionTeams.findFirst({
      where: eq(schema.competitionTeams.id, teamId),
      with: {
        members: {
          where: eq(schema.teamMembers.status, "ACTIVE"),
          with: { user: true },
        },
        proposal: {
          with: { files: true },
        },
      },
    });

    if (!team) {
      throw new AppError(404, "Team not found");
    }

    const submission = await db.query.submissions.findFirst({
      where: eq(schema.submissions.teamId, teamId),
    });

    const slideUrl = getSlideUrl(
      submission?.slideStorageKey ?? null,
      submission?.slideFilename ?? null
    );

    const proposal = team.proposal?.[0] ?? null;
    const members = team.members ?? [];
    const leader = members.find((m) => m.role === "TEAM_LEADER") || members[0] || null;

    let auditLogs: any[] = [];
    if (submission) {
      auditLogs = await db.query.auditLogs.findMany({
        where: eq(schema.auditLogs.entityId, submission.id),
        orderBy: (l, { desc }) => [desc(l.createdAt)],
        limit: 10,
        with: {
          actor: true,
        },
      });
    }

    return {
      team: {
        id: team.id,
        teamCode: team.teamCode,
        teamName: team.teamName,
        category: team.category,
        countryMix: team.countryMix,
        originalRank: team.originalRank,
        status: team.status,
      },
      submission: submission
        ? {
            ...submission,
            slideUrl,
          }
        : null,
      proposal: proposal
        ? {
            id: proposal.id,
            title: proposal.title,
            description: proposal.description,
            devpostUrl: proposal.devpostUrl,
            files: proposal.files ?? [],
          }
        : null,
      leader: leader?.user
        ? {
            id: leader.user.id,
            fullName: leader.user.fullName,
            email: leader.user.email,
            avatarUrl: leader.user.avatarUrl,
          }
        : null,
      members: members.map((m) => ({
        id: m.id,
        role: m.role,
        status: m.status,
        user: m.user
          ? {
              id: m.user.id,
              fullName: m.user.fullName,
              email: m.user.email,
              avatarUrl: m.user.avatarUrl,
            }
          : null,
      })),
      auditLogs,
    };
  },
};
