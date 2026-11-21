import { db, schema } from "@compsphere/db";
import { eq, and, sql } from "drizzle-orm";
import { generateToken, hashToken } from "../lib/crypto";
import { AppError } from "../middleware/error.middleware";
import { auditService } from "./audit.service";
import type { AttendanceType } from "@compsphere/types";

export const qrService = {
  /**
   * Generate a unique opaque QR token for a participant member.
   * Stores the hash in the database, returns raw token.
   */
  async generateQRToken(teamId: string, userId: string): Promise<string> {
    const rawToken = generateToken(32);
    const tokenHash = hashToken(rawToken);

    // Deactivate previous active tokens for this user
    await db
      .update(schema.qrTokens)
      .set({ active: false })
      .where(and(eq(schema.qrTokens.userId, userId), eq(schema.qrTokens.teamId, teamId)));

    // Insert new token
    await db.insert(schema.qrTokens).values({
      teamId,
      userId,
      tokenHash,
      active: true,
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours expiry
    });

    return rawToken;
  },

  /**
   * Validate a QR code token and record attendance.
   * Team-level check: if ANY member of the team already checked in
   * for this attendanceType today, the whole team is considered attended.
   * The scanner who scanned is recorded, but the whole team is marked.
   */
  async scanQRToken(
    scannerId: string,
    rawToken: string,
    attendanceType: AttendanceType
  ) {
    const tokenHash = hashToken(rawToken);

    return await db.transaction(async (tx) => {
      // 1. Find the token
      const token = await tx.query.qrTokens.findFirst({
        where: eq(schema.qrTokens.tokenHash, tokenHash),
      });

      if (!token || !token.active) {
        return { result: "INVALID" as const, message: "Invalid or inactive QR code." };
      }

      // 2. Check expiry
      if (token.expiresAt && new Date() > new Date(token.expiresAt)) {
        return { result: "EXPIRED" as const, message: "This QR code has expired." };
      }

      // 3. Check team qualification status (must be verified or higher)
      const team = await tx.query.competitionTeams.findFirst({
        where: eq(schema.competitionTeams.id, token.teamId),
        with: {
          members: {
            columns: { userId: true, role: true },
            where: eq(schema.teamMembers.status, "ACTIVE"),
          },
        },
      });

      if (!team || !["VERIFIED", "SUBMITTED", "JUDGED"].includes(team.status)) {
        return { result: "NOT_ELIGIBLE" as const, message: "Team is not confirmed or has dropped." };
      }

      // Get the profile of the person whose QR was scanned
      const profile = await tx.query.profiles.findFirst({
        where: eq(schema.profiles.id, token.userId),
      });

      if (!profile) {
        return { result: "INVALID" as const, message: "Associated profile not found." };
      }

      // 4. TEAM-LEVEL duplicate check:
      //    If any member of this team already has an attendance record
      //    for this attendanceType today → the whole team is already attended.
      const teamMemberIds = (team.members ?? []).map((m: { userId: string }) => m.userId);

      const existingTeamAttendance = teamMemberIds.length > 0
        ? await tx.query.attendance.findFirst({
            where: and(
              eq(schema.attendance.teamId, token.teamId),
              eq(schema.attendance.attendanceType, attendanceType),
              sql`DATE(scanned_at) = DATE(NOW())`
            ),
            with: {
              profile: { columns: { fullName: true } },
            },
          })
        : null;

      if (existingTeamAttendance) {
        const whoScanned = (existingTeamAttendance as any).profile?.fullName ?? "A team member";
        const isSelf = existingTeamAttendance.userId === token.userId;
        return {
          result: "TEAM_ALREADY_ATTENDED" as const,
          participant: {
            fullName: profile.fullName,
            teamName: team.teamName,
            teamCode: team.teamCode,
          },
          alreadyScannedBy: whoScanned,
          message: isSelf
            ? `${profile.fullName} already checked in for ${attendanceType} today.`
            : `Team "${team.teamName}" already checked in for ${attendanceType} today (by ${whoScanned}). No need to scan again.`,
        };
      }

      // 5. Insert attendance record for the scanned user
      await tx.insert(schema.attendance).values({
        teamId: token.teamId,
        userId: token.userId,
        attendanceType,
        scannedBy: scannerId,
      });

      await auditService.log(tx, {
        actorId: scannerId,
        action: "ATTENDANCE_SCANNED",
        entityType: "attendance",
        entityId: token.userId,
        metadata: { teamId: token.teamId, attendanceType, teamName: team.teamName },
      });

      return {
        result: "VALID" as const,
        participant: {
          fullName: profile.fullName,
          teamName: team.teamName,
          teamCode: team.teamCode,
        },
        message: `✓ ${profile.fullName} (${team.teamName}) checked in for ${attendanceType}!`,
      };
    });
  },
};
