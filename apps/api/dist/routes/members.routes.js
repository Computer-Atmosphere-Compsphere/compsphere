import { Router } from "express";
import { requireAuth, requireGoogleSession } from "../middleware/auth.middleware.js";
import { requireTeamLeader } from "../middleware/role.middleware.js";
import { db, schema } from "@compsphere/db";
import { eq, and } from "drizzle-orm";
import { generateToken, hashToken } from "../lib/crypto.js";
import { AppError } from "../middleware/error.middleware.js";
import { auditService } from "../services/audit.service.js";
import { z } from "zod";
const router = Router();
/**
 * Generate a member invitation token (Leader only)
 * POST /api/members/invite
 */
router.post("/invite", requireAuth, requireTeamLeader, async (req, res, next) => {
    try {
        const leader = req.sessionUser;
        const rawToken = generateToken(32);
        const inviteHash = hashToken(rawToken);
        const expiryHours = await db.query.systemConfig.findFirst({
            where: eq(schema.systemConfig.key, "invite_expiry_hours"),
        });
        const hours = expiryHours ? parseInt(expiryHours.value) : 48;
        const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
        const [invite] = await db
            .insert(schema.memberInvites)
            .values({
            teamId: leader.teamId,
            inviteHash,
            createdBy: leader.profileId,
            status: "PENDING",
            expiresAt,
        })
            .returning();
        res.json({
            success: true,
            data: {
                id: invite.id,
                expiresAt: invite.expiresAt,
                token: rawToken, // displayed securely once
            },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * Accept a team member invitation
 * POST /api/members/redeem-invite
 */
router.post("/redeem-invite", requireGoogleSession, async (req, res, next) => {
    try {
        const session = req.googleSession;
        const bodySchema = z.object({
            token: z.string().min(1, "Invite token is required"),
        });
        const { token } = bodySchema.parse(req.body);
        const inviteHash = hashToken(token);
        const result = await db.transaction(async (tx) => {
            // Find the invite
            const invite = await tx.query.memberInvites.findFirst({
                where: eq(schema.memberInvites.inviteHash, inviteHash),
            });
            if (!invite || invite.status !== "PENDING") {
                throw new AppError(400, "Invalid or already used invite.", "INVALID_INVITE");
            }
            if (new Date() > new Date(invite.expiresAt)) {
                await tx
                    .update(schema.memberInvites)
                    .set({ status: "EXPIRED" })
                    .where(eq(schema.memberInvites.id, invite.id));
                throw new AppError(400, "Invite link has expired.", "INVITE_EXPIRED");
            }
            // Check team capacity
            const maxConfig = await tx.query.systemConfig.findFirst({
                where: eq(schema.systemConfig.key, "max_team_members"),
            });
            const maxMembers = maxConfig ? parseInt(maxConfig.value) : 5;
            const currentCount = await tx.query.teamMembers.findMany({
                where: and(eq(schema.teamMembers.teamId, invite.teamId), eq(schema.teamMembers.status, "ACTIVE")),
            });
            if (currentCount.length >= maxMembers) {
                throw new AppError(400, "Team has reached maximum capacity.", "TEAM_FULL");
            }
            // Ensure profile exists (create if not exists)
            let profile = await tx.query.profiles.findFirst({
                where: eq(schema.profiles.email, session.email),
            });
            if (!profile) {
                [profile] = await tx
                    .insert(schema.profiles)
                    .values({
                    googleSub: session.id,
                    email: session.email,
                    fullName: session.name,
                    avatarUrl: session.image,
                    onboardingStatus: "COMPLETE",
                })
                    .returning();
            }
            else {
                await tx
                    .update(schema.profiles)
                    .set({ onboardingStatus: "COMPLETE", preferredRole: "PARTICIPANT" })
                    .where(eq(schema.profiles.id, profile.id));
            }
            // Ensure not already in a team
            const existingMembership = await tx.query.teamMembers.findFirst({
                where: and(eq(schema.teamMembers.userId, profile.id), eq(schema.teamMembers.status, "ACTIVE")),
            });
            if (existingMembership) {
                throw new AppError(400, "You are already a member of a team.", "ALREADY_IN_TEAM");
            }
            // Join team
            const [membership] = await tx
                .insert(schema.teamMembers)
                .values({
                teamId: invite.teamId,
                userId: profile.id,
                role: "TEAM_MEMBER",
                status: "ACTIVE",
                verifiedAt: new Date(),
            })
                .returning();
            // Assign role assignment
            await tx
                .insert(schema.roleAssignments)
                .values({
                userId: profile.id,
                role: "PARTICIPANT",
                source: "team_token",
                teamId: invite.teamId,
            })
                .onConflictDoNothing();
            // Mark invite as used
            await tx
                .update(schema.memberInvites)
                .set({
                status: "ACCEPTED",
                usedBy: profile.id,
                usedAt: new Date(),
            })
                .where(eq(schema.memberInvites.id, invite.id));
            await auditService.log(tx, {
                actorId: profile.id,
                action: "TEAM_MEMBER_JOINED",
                entityType: "team",
                entityId: invite.teamId,
                metadata: { inviteId: invite.id },
            });
            return { membership, teamId: invite.teamId };
        });
        res.json({
            success: true,
            message: "Successfully joined team.",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=members.routes.js.map