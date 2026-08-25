import { db, schema } from "@compsphere/db";
import { eq, and, sql } from "drizzle-orm";
import { generateToken, hashToken } from "../lib/crypto.js";
import { auditService } from "./audit.service.js";
export const qrService = {
    /**
     * Generate a unique opaque QR token for a participant member.
     * Stores the hash in the database, returns raw token.
     */
    async generateQRToken(teamId, userId) {
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
     * Checks for duplication, invalidity, or team status.
     */
    async scanQRToken(scannerId, rawToken, attendanceType) {
        const tokenHash = hashToken(rawToken);
        return await db.transaction(async (tx) => {
            // 1. Find the token
            const token = await tx.query.qrTokens.findFirst({
                where: eq(schema.qrTokens.tokenHash, tokenHash),
            });
            if (!token || !token.active) {
                return { result: "INVALID", message: "Invalid or inactive QR code." };
            }
            // 2. Check expiry
            if (token.expiresAt && new Date() > new Date(token.expiresAt)) {
                return { result: "EXPIRED", message: "This QR code has expired." };
            }
            // 3. Check team qualification status (must be verified or higher)
            const team = await tx.query.competitionTeams.findFirst({
                where: eq(schema.competitionTeams.id, token.teamId),
            });
            if (!team || !["VERIFIED", "SUBMITTED", "JUDGED"].includes(team.status)) {
                return { result: "NOT_ELIGIBLE", message: "Team is not confirmed or has dropped." };
            }
            // Get user profile
            const profile = await tx.query.profiles.findFirst({
                where: eq(schema.profiles.id, token.userId),
            });
            if (!profile) {
                return { result: "INVALID", message: "Associated profile not found." };
            }
            // 4. Check for duplicate attendance on the same day/event type
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const existingAttendance = await tx.query.attendance.findFirst({
                where: and(eq(schema.attendance.userId, token.userId), eq(schema.attendance.attendanceType, attendanceType), sql `DATE(scanned_at) = DATE(NOW())`),
            });
            if (existingAttendance) {
                return {
                    result: "ALREADY_SCANNED",
                    participant: {
                        fullName: profile.fullName,
                        teamName: team.teamName,
                        teamCode: team.teamCode,
                    },
                    message: `${profile.fullName} already checked in for ${attendanceType} today.`,
                };
            }
            // 5. Insert attendance record
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
                metadata: { teamId: token.teamId, attendanceType },
            });
            return {
                result: "VALID",
                participant: {
                    fullName: profile.fullName,
                    teamName: team.teamName,
                    teamCode: team.teamCode,
                },
                message: `Successfully checked in ${profile.fullName} for ${attendanceType}!`,
            };
        });
    },
};
//# sourceMappingURL=qr.service.js.map