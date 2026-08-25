import { Router } from "express";
import { requireGoogleSession } from "../middleware/auth.middleware.js";
import { db, schema } from "@compsphere/db";
import { eq } from "drizzle-orm";
import { teamService } from "../services/team.service.js";
import { tokenService } from "../services/token.service.js";
import { auditService } from "../services/audit.service.js";
import { z } from "zod";
const router = Router();
/**
 * Onboard as a regular user
 * POST /api/onboarding/user
 */
router.post("/user", requireGoogleSession, async (req, res, next) => {
    try {
        const session = req.googleSession;
        // Complete basic profile
        const result = await db.transaction(async (tx) => {
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
                    preferredRole: "USER",
                    onboardingStatus: "COMPLETE",
                })
                    .returning();
            }
            else {
                [profile] = await tx
                    .update(schema.profiles)
                    .set({
                    googleSub: session.id,
                    preferredRole: "USER",
                    onboardingStatus: "COMPLETE",
                    updatedAt: new Date(),
                })
                    .where(eq(schema.profiles.id, profile.id))
                    .returning();
            }
            // Assign USER role
            await tx
                .insert(schema.roleAssignments)
                .values({
                userId: profile.id,
                role: "USER",
                source: "google_oauth",
            })
                .onConflictDoNothing();
            await auditService.log(tx, {
                actorId: profile.id,
                action: "ONBOARD_REGULAR_USER",
                entityType: "profile",
                entityId: profile.id,
            });
            return profile;
        });
        res.json({
            success: true,
            message: "Successfully onboarded as a regular user.",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * Redeem a team token (preview team details)
 * POST /api/onboarding/redeem-token
 */
router.post("/redeem-token", requireGoogleSession, async (req, res, next) => {
    try {
        const bodySchema = z.object({
            token: z.string().min(1, "Access token is required"),
        });
        const { token } = bodySchema.parse(req.body);
        const preview = await teamService.redeemTeamToken(token);
        res.json({
            success: true,
            data: preview,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * Activate team as a leader
 * POST /api/onboarding/activate-leader
 */
router.post("/activate-leader", requireGoogleSession, async (req, res, next) => {
    try {
        const session = req.googleSession;
        const bodySchema = z.object({
            teamId: z.string().uuid("Invalid team ID"),
            tokenId: z.string().uuid("Invalid token ID"),
        });
        const { teamId, tokenId } = bodySchema.parse(req.body);
        // Ensure compsphere profile exists (create if not exists)
        let profile = await db.query.profiles.findFirst({
            where: eq(schema.profiles.email, session.email),
        });
        if (!profile) {
            [profile] = await db
                .insert(schema.profiles)
                .values({
                googleSub: session.id,
                email: session.email,
                fullName: session.name,
                avatarUrl: session.image,
                onboardingStatus: "INCOMPLETE",
            })
                .returning();
        }
        const result = await teamService.activateAsLeader(profile.id, teamId, tokenId);
        res.json({
            success: true,
            message: "Team activated successfully as Leader.",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * Join a team as a member
 * POST /api/onboarding/join-member
 */
router.post("/join-member", requireGoogleSession, async (req, res, next) => {
    try {
        const session = req.googleSession;
        const bodySchema = z.object({
            teamId: z.string().uuid("Invalid team ID"),
            tokenId: z.string().uuid("Invalid token ID"),
        });
        const { teamId, tokenId } = bodySchema.parse(req.body);
        // Ensure compsphere profile exists (create if not exists)
        let profile = await db.query.profiles.findFirst({
            where: eq(schema.profiles.email, session.email),
        });
        if (!profile) {
            [profile] = await db
                .insert(schema.profiles)
                .values({
                googleSub: session.id,
                email: session.email,
                fullName: session.name,
                avatarUrl: session.image,
                onboardingStatus: "INCOMPLETE",
            })
                .returning();
        }
        const result = await teamService.joinAsMember(profile.id, teamId, tokenId);
        res.json({
            success: true,
            message: "Successfully joined the team as a member.",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * Redeem role access token (ADMIN/JUDGE)
 * POST /api/onboarding/redeem-role
 */
router.post("/redeem-role", requireGoogleSession, async (req, res, next) => {
    try {
        const session = req.googleSession;
        const bodySchema = z.object({
            token: z.string().min(1, "Role token is required"),
            role: z.enum(["ADMIN", "JUDGE"]),
        });
        const { token, role } = bodySchema.parse(req.body);
        // Ensure compsphere profile exists (create if not exists)
        let profile = await db.query.profiles.findFirst({
            where: eq(schema.profiles.email, session.email),
        });
        if (!profile) {
            [profile] = await db
                .insert(schema.profiles)
                .values({
                googleSub: session.id,
                email: session.email,
                fullName: session.name,
                avatarUrl: session.image,
                onboardingStatus: "INCOMPLETE",
            })
                .returning();
        }
        const result = await tokenService.redeemRoleToken(profile.id, token, role);
        res.json({
            success: true,
            message: `Successfully authenticated as ${role}.`,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=onboarding.routes.js.map