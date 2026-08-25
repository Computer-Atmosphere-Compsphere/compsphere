import { db, schema } from "@compsphere/db";
import { eq, and, isNull, sql, desc } from "drizzle-orm";
import { verifyToken, hashToken, generateToken } from "../lib/crypto";
import { AppError } from "../middleware/error.middleware";
import { auditService } from "./audit.service";
import { sseService } from "../sse/sse.service";

export const teamService = {
  /**
   * Redeem a team activation token.
   * Validates the token and returns team info + leader status.
   * DOES NOT grant access — just validates intent.
   */
  async redeemTeamToken(rawToken: string) {
    const tokenHash = hashToken(rawToken);

    const token = await db.query.teamAccessTokens.findFirst({
      where: eq(schema.teamAccessTokens.tokenHash, tokenHash),
      with: { team: true },
    });

    if (!token) throw new AppError(400, "Invalid team access token", "INVALID_TOKEN");
    if (token.status === "REVOKED") throw new AppError(400, "Token has been revoked", "TOKEN_REVOKED");
    if (token.status === "EXPIRED") throw new AppError(400, "Token has expired", "TOKEN_EXPIRED");
    if (token.status === "ACTIVATED") {
      // Token already activated — check if calling user is member of this team
      // (allow re-entry for members)
      throw new AppError(400, "Token already activated. Use the member invite link instead.", "TOKEN_ALREADY_ACTIVATED");
    }

    if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
      await db.update(schema.teamAccessTokens)
        .set({ status: "EXPIRED" })
        .where(eq(schema.teamAccessTokens.id, token.id));
      throw new AppError(400, "Token has expired", "TOKEN_EXPIRED");
    }

    const team = await db.query.competitionTeams.findFirst({
      where: eq(schema.competitionTeams.id, token.teamId),
    });

    if (!team) throw new AppError(404, "Team not found", "TEAM_NOT_FOUND");

    // Check if team already has a leader
    const existingLeader = await db.query.teamMembers.findFirst({
      where: and(
        eq(schema.teamMembers.teamId, team.id),
        eq(schema.teamMembers.role, "TEAM_LEADER"),
        eq(schema.teamMembers.status, "ACTIVE")
      ),
    });

    return {
      tokenId: token.id,
      team: {
        id: team.id,
        teamName: team.teamName,
        teamCode: team.teamCode,
        category: team.category,
        originalRank: team.originalRank,
        status: team.status,
        paymentRequired: team.paymentRequired,
        paymentAmount: team.paymentAmount,
      },
      alreadyHasLeader: !!existingLeader,
    };
  },

  /**
   * Activate a team with the requesting user as TEAM_LEADER.
   * Atomic: marks token as ACTIVATED + creates team membership.
   */
  async activateAsLeader(profileId: string, teamId: string, tokenId: string) {
    return await db.transaction(async (tx) => {
      // Lock the token row
      const token = await tx.query.teamAccessTokens.findFirst({
        where: and(
          eq(schema.teamAccessTokens.id, tokenId),
          eq(schema.teamAccessTokens.teamId, teamId)
        ),
      });

      if (!token || token.status !== "ISSUED") {
        throw new AppError(400, "Token is no longer valid", "TOKEN_INVALID");
      }

      // Ensure no leader exists yet (race condition guard)
      const existingLeader = await tx.query.teamMembers.findFirst({
        where: and(
          eq(schema.teamMembers.teamId, teamId),
          eq(schema.teamMembers.role, "TEAM_LEADER"),
          eq(schema.teamMembers.status, "ACTIVE")
        ),
      });

      if (existingLeader) {
        throw new AppError(409, "Team already has a leader", "LEADER_EXISTS");
      }

      // Mark token as ACTIVATED
      await tx.update(schema.teamAccessTokens).set({
        status: "ACTIVATED",
        activatedBy: profileId,
        activatedAt: new Date(),
      }).where(eq(schema.teamAccessTokens.id, tokenId));

      // Create TEAM_LEADER membership
      const [membership] = await tx.insert(schema.teamMembers).values({
        teamId,
        userId: profileId,
        role: "TEAM_LEADER",
        status: "ACTIVE",
        verifiedAt: new Date(),
      }).returning();

      // Update team status to AWAITING_CONFIRMATION
      const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000);
      await tx.update(schema.competitionTeams).set({
        status: "AWAITING_CONFIRMATION",
        confirmationStartedAt: new Date(),
        confirmationDeadline: deadline,
      }).where(eq(schema.competitionTeams.id, teamId));

      // Assign PARTICIPANT role
      await tx.insert(schema.roleAssignments).values({
        userId: profileId,
        role: "PARTICIPANT",
        source: "team_token",
        teamId,
      }).onConflictDoNothing();

      // Update profile onboarding status
      await tx.update(schema.profiles).set({
        onboardingStatus: "COMPLETE",
        preferredRole: "PARTICIPANT",
      }).where(eq(schema.profiles.id, profileId));

      // Audit log
      await auditService.log(tx, {
        actorId: profileId,
        action: "TEAM_LEADER_ACTIVATED",
        entityType: "team",
        entityId: teamId,
        metadata: { tokenId, teamId },
      });

      return { membership, deadline };
    });
  },

  /**
   * Join an already-activated team as a TEAM_MEMBER using a new ISSUED token.
   * The admin can regenerate tokens even after a team is activated, creating a fresh
   * ISSUED token that allows remaining members to join.
   */
  async joinAsMember(profileId: string, teamId: string, tokenId: string) {
    return await db.transaction(async (tx) => {
      // Find the token — must be ISSUED (from regeneration)
      const token = await tx.query.teamAccessTokens.findFirst({
        where: and(
          eq(schema.teamAccessTokens.id, tokenId),
          eq(schema.teamAccessTokens.teamId, teamId)
        ),
      });

      if (!token || token.status !== "ISSUED") {
        throw new AppError(400, "Token is no longer valid", "TOKEN_INVALID");
      }

      // Check if user is already a member of this team
      const existingMember = await tx.query.teamMembers.findFirst({
        where: and(
          eq(schema.teamMembers.teamId, teamId),
          eq(schema.teamMembers.userId, profileId),
          eq(schema.teamMembers.status, "ACTIVE")
        ),
      });

      if (existingMember) {
        throw new AppError(400, "You are already a member of this team", "ALREADY_MEMBER");
      }

      // Mark token as ACTIVATED
      await tx.update(schema.teamAccessTokens).set({
        status: "ACTIVATED",
        activatedBy: profileId,
        activatedAt: new Date(),
      }).where(eq(schema.teamAccessTokens.id, tokenId));

      // Create TEAM_MEMBER membership
      const [membership] = await tx.insert(schema.teamMembers).values({
        teamId,
        userId: profileId,
        role: "TEAM_MEMBER",
        status: "ACTIVE",
        verifiedAt: new Date(),
      }).returning();

      // Assign PARTICIPANT role
      await tx.insert(schema.roleAssignments).values({
        userId: profileId,
        role: "PARTICIPANT",
        source: "team_token",
        teamId,
      }).onConflictDoNothing();

      // Update profile onboarding status
      await tx.update(schema.profiles).set({
        onboardingStatus: "COMPLETE",
        preferredRole: "PARTICIPANT",
      }).where(eq(schema.profiles.id, profileId));

      // Audit log
      await auditService.log(tx, {
        actorId: profileId,
        action: "TEAM_MEMBER_JOINED",
        entityType: "team",
        entityId: teamId,
        metadata: { tokenId, teamId },
      });

      return { membership };
    });
  },

  /**
   * Get full team details with members, proposals, payments, submissions,
   * access token, and attendance. Used by both the participant dashboard
   * and the admin / judge team detail views.
   */
  async getTeamDetails(teamId: string) {
    const team = await db.query.competitionTeams.findFirst({
      where: eq(schema.competitionTeams.id, teamId),
    });
    if (!team) throw new AppError(404, "Team not found");

    const members = await db.query.teamMembers.findMany({
      where: and(
        eq(schema.teamMembers.teamId, teamId),
        eq(schema.teamMembers.status, "ACTIVE")
      ),
      with: { user: true },
    });

    const proposal = await db.query.proposals.findFirst({
      where: eq(schema.proposals.teamId, teamId),
    });

    const proposalFiles = proposal
      ? await db.query.proposalFiles.findMany({
          where: eq(schema.proposalFiles.proposalId, proposal.id),
        })
      : [];

    // Full payment history (latest first) for the rundown
    const payments = await db.query.payments.findMany({
      where: eq(schema.payments.teamId, teamId),
      orderBy: (p, { desc }) => [desc(p.submittedAt)],
    });

    // Submissions history (for Phase 2 deliverables)
    const submissions = await db.query.submissions.findMany({
      where: eq(schema.submissions.teamId, teamId),
      orderBy: (s, { desc }) => [desc(s.submittedAt)],
    });

    // Attendance history across all days (include profile for rundown display)
    const attendance = await db.query.attendance.findMany({
      where: eq(schema.attendance.teamId, teamId),
      orderBy: (a, { desc }) => [desc(a.scannedAt)],
      with: { profile: true },
    });

    // Latest access token (admin/judge only need to see meta, not the hash)
    const latestToken = await db.query.teamAccessTokens.findFirst({
      where: eq(schema.teamAccessTokens.teamId, teamId),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });

    const { tokenHash: _omit, ...tokenMeta } = latestToken ?? {
      tokenHash: undefined,
    };

    return {
      team,
      members,
      proposal: proposal ? { ...proposal, files: proposalFiles } : null,
      payments,
      submissions,
      attendance,
      token: latestToken ? tokenMeta : null,
    };
  },

  /**
   * Admin: regenerate a team's activation token. Invalidates any previously
   * ISSUED tokens for the team and issues a fresh one. Returns the raw token
   * (only returned once — store securely and distribute to the team leader).
   */
  async regenerateTeamToken(adminId: string, teamId: string) {
    return await db.transaction(async (tx) => {
      const team = await tx.query.competitionTeams.findFirst({
        where: eq(schema.competitionTeams.id, teamId),
      });
      if (!team) throw new AppError(404, "Team not found");

      // Revoke any currently issued tokens for this team to avoid duplicates
      await tx
        .update(schema.teamAccessTokens)
        .set({ status: "REVOKED" })
        .where(
          and(
            eq(schema.teamAccessTokens.teamId, teamId),
            eq(schema.teamAccessTokens.status, "ISSUED")
          )
        );

      const rawToken = generateToken(32);
      const tokenHash = hashToken(rawToken);

      const [token] = await tx
        .insert(schema.teamAccessTokens)
        .values({
          teamId,
          tokenHash,
          status: "ISSUED",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        .returning();

      await auditService.log(tx, {
        actorId: adminId,
        action: "TEAM_TOKEN_REGENERATED",
        entityType: "team",
        entityId: teamId,
        metadata: { teamCode: team.teamCode },
      });

      // Notify the team that a new token has been issued
      await tx.insert(schema.notifications).values({
        teamId,
        type: "TEAM_TOKEN_REGENERATED",
        title: "New Activation Token",
        message:
          "Your team has been issued a new activation token. Please contact the committee to receive it.",
      });

      return {
        tokenId: token.id,
        rawToken,
        expiresAt: token.expiresAt,
      };
    });
  },

  /**
   * Admin: verify a team (move to VERIFIED)
   */
  async verifyTeam(adminId: string, teamId: string) {
    return await db.transaction(async (tx) => {
      const team = await tx.query.competitionTeams.findFirst({
        where: eq(schema.competitionTeams.id, teamId),
      });

      if (!team) throw new AppError(404, "Team not found");
      if (!["VERIFICATION_PENDING", "PAYMENT_PENDING", "DOCUMENT_PENDING"].includes(team.status)) {
        throw new AppError(400, `Cannot verify team in status: ${team.status}`);
      }

      await tx.update(schema.competitionTeams).set({
        status: "VERIFIED",
        updatedAt: new Date(),
      }).where(eq(schema.competitionTeams.id, teamId));

      await auditService.log(tx, {
        actorId: adminId,
        action: "TEAM_VERIFIED",
        entityType: "team",
        entityId: teamId,
        metadata: { previousStatus: team.status },
      });

      // Notify team
      await tx.insert(schema.notifications).values({
        teamId,
        type: "TEAM_VERIFIED",
        title: "Team Verified! 🎉",
        message: "Your team has been verified and is confirmed for Phase 2.",
      });

      sseService.sendToTeam(teamId, "team:status_changed", {
        teamId,
        newStatus: "VERIFIED",
      });

      return { teamId, newStatus: "VERIFIED" };
    });
  },

  /**
   * Admin: drop a team
   */
  async dropTeam(adminId: string, teamId: string, reason?: string) {
    return await db.transaction(async (tx) => {
      const team = await tx.query.competitionTeams.findFirst({
        where: eq(schema.competitionTeams.id, teamId),
      });
      if (!team) throw new AppError(404, "Team not found");

      await tx.update(schema.competitionTeams).set({
        status: "DROPPED",
        updatedAt: new Date(),
      }).where(eq(schema.competitionTeams.id, teamId));

      await auditService.log(tx, {
        actorId: adminId,
        action: "TEAM_DROPPED",
        entityType: "team",
        entityId: teamId,
        metadata: { previousStatus: team.status, reason },
      });

      await tx.insert(schema.notifications).values({
        teamId,
        type: "TEAM_DROPPED",
        title: "Team Status Update",
        message: reason || "Your team has been marked as dropped from the competition.",
      });

      sseService.sendToTeam(teamId, "team:status_changed", { teamId, newStatus: "DROPPED" });
      sseService.broadcast("admin:counter_updated", { event: "team_dropped", teamId });

      return { teamId, newStatus: "DROPPED" };
    });
  },

  /**
   * Get admin overview metrics
   */
  async getAdminMetrics() {
    const resMetrics = await db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE 1=1) AS total_imported,
        COUNT(*) FILTER (WHERE status = 'NEW') AS new_count,
        COUNT(*) FILTER (WHERE original_rank <= 30) AS top30_selected,
        COUNT(*) FILTER (WHERE status = 'AWAITING_CONFIRMATION') AS awaiting_confirmation,
        COUNT(*) FILTER (WHERE status IN ('PAYMENT_PENDING', 'DOCUMENT_PENDING')) AS payment_pending,
        COUNT(*) FILTER (WHERE status = 'VERIFICATION_PENDING') AS verification_pending,
        COUNT(*) FILTER (WHERE status = 'VERIFIED') AS verified,
        COUNT(*) FILTER (WHERE status = 'DROPPED') AS dropped,
        COUNT(*) FILTER (WHERE status = 'WAITLIST') AS waitlist_count,
        COUNT(*) FILTER (WHERE status = 'SUBMITTED') AS submitted,
        COUNT(*) FILTER (WHERE status = 'JUDGED') AS judged,
        COUNT(*) FILTER (WHERE status = 'FINALIST') AS finalist
      FROM competition_teams
    `);
    const metrics = resMetrics.rows[0];

    // Category breakdown
    const resCategories = await db.execute(sql`
      SELECT
        category,
        COUNT(*) AS count,
        COUNT(*) FILTER (WHERE status = 'VERIFIED') AS verified_count
      FROM competition_teams
      GROUP BY category
    `);
    const categories = resCategories.rows;

    // Payment stats
    const resPayments = await db.execute(sql`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'PENDING') AS pending,
        COUNT(*) FILTER (WHERE status = 'APPROVED') AS approved,
        COUNT(*) FILTER (WHERE status = 'REJECTED') AS rejected
      FROM payments
    `);
    const payments = resPayments.rows[0];

    // Submission stats
    const resSubmission = await db.execute(sql`
      SELECT COUNT(*) AS submission_count FROM submissions
    `);
    const submissionMetrics = resSubmission.rows[0];

    // Attendance stats
    const resAttendance = await db.execute(sql`
      SELECT COUNT(*) AS attendance_count FROM attendance
    `);
    const attendanceMetrics = resAttendance.rows[0];

    // Judging progress
    const resJudging = await db.execute(sql`
      SELECT
        (SELECT COUNT(*) FROM judge_assignments) AS total_assignments,
        (SELECT COUNT(*) FROM judge_scores) AS total_scores,
        (SELECT COUNT(*) FROM judges WHERE status = 'ACTIVE') AS active_judges
    `);
    const judging = resJudging.rows[0];

    // Recent activity (last 10 audit logs)
    const resRecent = await db.execute(sql`
      SELECT
        al.action,
        al.entity_type,
        al.entity_id,
        al.created_at,
        p.full_name AS actor_name
      FROM audit_logs al
      LEFT JOIN profiles p ON al.actor_id = p.id
      ORDER BY al.created_at DESC
      LIMIT 10
    `);
    const recentActivity = resRecent.rows;

    return {
      ...metrics,
      categories,
      payments: {
        total: Number((payments as Record<string, unknown>)?.total ?? 0),
        pending: Number((payments as Record<string, unknown>)?.pending ?? 0),
        approved: Number((payments as Record<string, unknown>)?.approved ?? 0),
        rejected: Number((payments as Record<string, unknown>)?.rejected ?? 0),
      },
      submission_count: Number((submissionMetrics as Record<string, unknown>)?.submission_count ?? 0),
      attendance_count: Number((attendanceMetrics as Record<string, unknown>)?.attendance_count ?? 0),
      judging: {
        totalAssignments: Number((judging as Record<string, unknown>)?.total_assignments ?? 0),
        totalScores: Number((judging as Record<string, unknown>)?.total_scores ?? 0),
        activeJudges: Number((judging as Record<string, unknown>)?.active_judges ?? 0),
      },
      recentActivity,
    };
  },
};
