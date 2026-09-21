import { db, schema } from "@compsphere/db";
import { eq, and, isNull } from "drizzle-orm";
import { hashToken } from "../lib/crypto";
import { AppError } from "../middleware/error.middleware";
import { auditService } from "./audit.service";
import type { RoleType } from "@compsphere/types";

export const tokenService = {
  /**
   * Redeem role access tokens (ADMIN or JUDGE).
   * Compares the input raw token with environment variables hashes
   * (to prevent plaintext DB storage or hardcoding in frontend)
   */
  async redeemRoleToken(profileId: string, rawToken: string, requestedRole: "ADMIN" | "JUDGE") {
    let expectedToken: string | undefined;

    if (requestedRole === "ADMIN") {
      expectedToken = process.env.COMMITTEE_ACCESS_TOKEN;
    } else if (requestedRole === "JUDGE") {
      expectedToken = process.env.JUDGE_ACCESS_TOKEN;
    }

    if (!expectedToken) {
      throw new AppError(500, "Token verification is temporarily unavailable server-side.", "TOKEN_CONFIG_ERROR");
    }

    // Direct comparison (timing safe comparison if required, simple comparison for MVP is fine as they are loaded into mem)
    if (rawToken !== expectedToken) {
      throw new AppError(400, "Invalid access token.", "INVALID_TOKEN");
    }

    return await db.transaction(async (tx) => {
      // Check if user already has this role
      const existing = await tx.query.roleAssignments.findFirst({
        where: and(
          eq(schema.roleAssignments.userId, profileId),
          eq(schema.roleAssignments.role, requestedRole),
          isNull(schema.roleAssignments.revokedAt)
        ),
      });

      if (existing) {
        return { success: true, message: `Role ${requestedRole} already assigned.` };
      }

      // Revoke any current active role assignment for clean state
      await tx
        .update(schema.roleAssignments)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(schema.roleAssignments.userId, profileId),
            isNull(schema.roleAssignments.revokedAt)
          )
        );

      // Create new role assignment
      await tx.insert(schema.roleAssignments).values({
        userId: profileId,
        role: requestedRole,
        source: requestedRole === "ADMIN" ? "committee_token" : "judge_token",
      });

      // Update profile onboarding status
      await tx
        .update(schema.profiles)
        .set({
          onboardingStatus: "COMPLETE",
          preferredRole: requestedRole,
        })
        .where(eq(schema.profiles.id, profileId));

      // If JUDGE, also ensure they are in the judges table
      if (requestedRole === "JUDGE") {
        await tx
          .insert(schema.judges)
          .values({ userId: profileId, status: "ACTIVE" })
          .onConflictDoNothing();
      }

      await auditService.log(tx, {
        actorId: profileId,
        action: `ROLE_ASSIGNED_${requestedRole}`,
        entityType: "profile",
        entityId: profileId,
        metadata: { role: requestedRole },
      });

      return {
        success: true,
        role: requestedRole,
        redirectUrl: requestedRole === "ADMIN" ? "/admin" : "/judge",
        message: `Successfully authenticated and upgraded to ${requestedRole}.`,
      };
    });
  },

  /**
   * Universal token redemption for regular users.
   * Auto-detects token type: Committee / Admin, Judge, Team Leader, or Team Member Invite.
   */
  async redeemUniversalToken(profileId: string, rawToken: string) {
    const cleanToken = (rawToken || "").trim();
    if (!cleanToken) {
      throw new AppError(400, "Access token is required.", "TOKEN_REQUIRED");
    }

    // 1. Check Committee / Admin Token
    const committeeToken = process.env.COMMITTEE_ACCESS_TOKEN;
    if (committeeToken && cleanToken === committeeToken) {
      return await this.redeemRoleToken(profileId, cleanToken, "ADMIN");
    }

    // 2. Check Judge Token
    const judgeToken = process.env.JUDGE_ACCESS_TOKEN;
    if (judgeToken && cleanToken === judgeToken) {
      return await this.redeemRoleToken(profileId, cleanToken, "JUDGE");
    }

    // Compute token hash for DB lookups
    const tokenHash = hashToken(cleanToken);

    // 3. Check Team Access Token (Top 30 / Participant Hackathon Token)
    const teamToken = await db.query.teamAccessTokens.findFirst({
      where: eq(schema.teamAccessTokens.tokenHash, tokenHash),
      with: { team: true },
    });

    if (teamToken) {
      if (teamToken.status === "REVOKED") {
        throw new AppError(400, "This team access token has been revoked by the committee.", "TOKEN_REVOKED");
      }
      if (teamToken.status === "EXPIRED" || (teamToken.expiresAt && new Date(teamToken.expiresAt) < new Date())) {
        throw new AppError(400, "This team access token has expired.", "TOKEN_EXPIRED");
      }

      const team = teamToken.team;
      if (!team) {
        throw new AppError(404, "Associated competition team was not found.", "TEAM_NOT_FOUND");
      }

      // Check if user is already a member of this team
      const existingMembership = await db.query.teamMembers.findFirst({
        where: and(
          eq(schema.teamMembers.teamId, team.id),
          eq(schema.teamMembers.userId, profileId),
          eq(schema.teamMembers.status, "ACTIVE")
        ),
      });

      if (existingMembership) {
        return {
          success: true,
          role: "PARTICIPANT" as const,
          memberRole: existingMembership.role,
          teamName: team.teamName,
          teamCode: team.teamCode,
          redirectUrl: "/dashboard",
          message: `You are already a member of team "${team.teamName}".`,
        };
      }

      if (teamToken.status === "ACTIVATED") {
        throw new AppError(400, "This team access token has already been activated. Please ask your Team Leader for a member invite link or code.", "TOKEN_ALREADY_ACTIVATED");
      }

      // Atomically activate or join
      return await db.transaction(async (tx) => {
        // Check if team already has a leader
        const existingLeader = await tx.query.teamMembers.findFirst({
          where: and(
            eq(schema.teamMembers.teamId, team.id),
            eq(schema.teamMembers.role, "TEAM_LEADER"),
            eq(schema.teamMembers.status, "ACTIVE")
          ),
        });

        const isLeader = !existingLeader;
        const memberRole = isLeader ? "TEAM_LEADER" : "TEAM_MEMBER";

        // Mark token as ACTIVATED
        await tx.update(schema.teamAccessTokens).set({
          status: "ACTIVATED",
          activatedBy: profileId,
          activatedAt: new Date(),
        }).where(eq(schema.teamAccessTokens.id, teamToken.id));

        // Create membership
        await tx.insert(schema.teamMembers).values({
          teamId: team.id,
          userId: profileId,
          role: memberRole,
          status: "ACTIVE",
          verifiedAt: new Date(),
        });

        // If leader, set team status to AWAITING_CONFIRMATION if NEW or TOP30
        if (isLeader) {
          const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000);
          await tx.update(schema.competitionTeams).set({
            status: "AWAITING_CONFIRMATION",
            confirmationStartedAt: new Date(),
            confirmationDeadline: deadline,
          }).where(eq(schema.competitionTeams.id, team.id));
        }

        // Revoke any previous active role assignments (e.g. USER)
        await tx.update(schema.roleAssignments).set({
          revokedAt: new Date(),
        }).where(
          and(
            eq(schema.roleAssignments.userId, profileId),
            isNull(schema.roleAssignments.revokedAt)
          )
        );

        // Assign PARTICIPANT role
        await tx.insert(schema.roleAssignments).values({
          userId: profileId,
          role: "PARTICIPANT",
          source: "team_token",
          teamId: team.id,
        });

        // Update profile
        await tx.update(schema.profiles).set({
          onboardingStatus: "COMPLETE",
          preferredRole: "PARTICIPANT",
        }).where(eq(schema.profiles.id, profileId));

        await auditService.log(tx, {
          actorId: profileId,
          action: isLeader ? "TEAM_LEADER_ACTIVATED_VIA_TOKEN" : "TEAM_MEMBER_JOINED_VIA_TOKEN",
          entityType: "team",
          entityId: team.id,
          metadata: { tokenId: teamToken.id, role: memberRole },
        });

        return {
          success: true,
          role: "PARTICIPANT" as const,
          memberRole,
          teamName: team.teamName,
          teamCode: team.teamCode,
          redirectUrl: "/dashboard",
          message: isLeader
            ? `Successfully activated ${team.teamName} as Team Leader!`
            : `Successfully joined ${team.teamName} as Team Member!`,
        };
      });
    }

    // 4. Check Member Invite Token
    const invite = await db.query.memberInvites.findFirst({
      where: eq(schema.memberInvites.inviteHash, tokenHash),
      with: { team: true },
    });

    if (invite) {
      if (invite.status === "REVOKED") {
        throw new AppError(400, "This invitation code has been revoked by the team leader.", "INVITE_REVOKED");
      }
      if (invite.status === "EXPIRED" || new Date(invite.expiresAt) < new Date()) {
        throw new AppError(400, "This invitation code has expired.", "INVITE_EXPIRED");
      }
      if (invite.status === "ACCEPTED") {
        throw new AppError(400, "This invitation code has already been used.", "INVITE_ALREADY_USED");
      }

      const team = invite.team;
      if (!team) {
        throw new AppError(404, "Associated team not found for this invitation.", "TEAM_NOT_FOUND");
      }

      return await db.transaction(async (tx) => {
        // Check if user is already in a team
        const existingMember = await tx.query.teamMembers.findFirst({
          where: and(
            eq(schema.teamMembers.userId, profileId),
            eq(schema.teamMembers.status, "ACTIVE")
          ),
        });

        if (existingMember) {
          throw new AppError(400, "You are already a member of an active team.", "ALREADY_IN_TEAM");
        }

        // Add to team members
        await tx.insert(schema.teamMembers).values({
          teamId: team.id,
          userId: profileId,
          role: "TEAM_MEMBER",
          status: "ACTIVE",
          verifiedAt: new Date(),
        });

        // Mark invite as ACCEPTED
        await tx.update(schema.memberInvites).set({
          status: "ACCEPTED",
          usedBy: profileId,
          usedAt: new Date(),
        }).where(eq(schema.memberInvites.id, invite.id));

        // Revoke previous role assignment
        await tx.update(schema.roleAssignments).set({
          revokedAt: new Date(),
        }).where(
          and(
            eq(schema.roleAssignments.userId, profileId),
            isNull(schema.roleAssignments.revokedAt)
          )
        );

        // Assign PARTICIPANT role
        await tx.insert(schema.roleAssignments).values({
          userId: profileId,
          role: "PARTICIPANT",
          source: "team_token",
          teamId: team.id,
        });

        // Update profile
        await tx.update(schema.profiles).set({
          onboardingStatus: "COMPLETE",
          preferredRole: "PARTICIPANT",
        }).where(eq(schema.profiles.id, profileId));

        await auditService.log(tx, {
          actorId: profileId,
          action: "TEAM_MEMBER_JOINED_VIA_INVITE_TOKEN",
          entityType: "team",
          entityId: team.id,
          metadata: { inviteId: invite.id },
        });

        return {
          success: true,
          role: "PARTICIPANT" as const,
          memberRole: "TEAM_MEMBER" as const,
          teamName: team.teamName,
          teamCode: team.teamCode,
          redirectUrl: "/dashboard",
          message: `Successfully joined ${team.teamName} via invitation code!`,
        };
      });
    }

    // 5. None matched
    throw new AppError(
      400,
      "Invalid access token. Please verify your token and try again, or contact the CompSphere committee.",
      "INVALID_TOKEN"
    );
  },
};
