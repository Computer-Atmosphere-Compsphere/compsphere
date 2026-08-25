import { auth } from "../auth.js";
import { db, schema } from "@compsphere/db";
import { eq, and, isNull } from "drizzle-orm";
/**
 * Validates the better-auth session and attaches the COMPSPHERE profile
 * to req.sessionUser. Routes that need auth must use this middleware.
 */
export async function requireAuth(req, res, next) {
    try {
        console.log("🔑 [requireAuth] Request headers cookie:", req.headers.cookie);
        const session = await auth.api.getSession({
            headers: new Headers(req.headers),
        });
        console.log("🔑 [requireAuth] Resolved session:", session ? { id: session.user.id, email: session.user.email } : null);
        if (!session?.user) {
            res.status(401).json({ success: false, error: "Not authenticated" });
            return;
        }
        // Look up the compsphere profile linked to this google user
        const profile = await db.query.profiles.findFirst({
            where: eq(schema.profiles.email, session.user.email),
        });
        if (!profile) {
            // User authenticated but no profile yet — send them to onboarding
            res.status(403).json({
                success: false,
                error: "PROFILE_NOT_FOUND",
                message: "Complete onboarding first",
            });
            return;
        }
        // Get the active role assignment
        const roleAssignment = await db.query.roleAssignments.findFirst({
            where: and(eq(schema.roleAssignments.userId, profile.id), isNull(schema.roleAssignments.revokedAt)),
            orderBy: (ra, { desc }) => [desc(ra.assignedAt)],
        });
        // Get team membership if participant
        let teamId = null;
        let memberRole = null;
        if (roleAssignment?.role === "PARTICIPANT") {
            const membership = await db.query.teamMembers.findFirst({
                where: and(eq(schema.teamMembers.userId, profile.id), eq(schema.teamMembers.status, "ACTIVE")),
            });
            if (membership) {
                teamId = membership.teamId;
                memberRole = membership.role;
            }
        }
        req.sessionUser = {
            authUserId: session.user.id,
            profileId: profile.id,
            email: profile.email,
            fullName: profile.fullName,
            avatarUrl: profile.avatarUrl,
            role: roleAssignment?.role ?? "USER",
            teamId,
            memberRole,
            onboardingStatus: profile.onboardingStatus,
        };
        next();
    }
    catch (error) {
        next(error);
    }
}
/**
 * Optional auth — attaches session if present, continues without error if not.
 */
export async function optionalAuth(req, res, next) {
    try {
        const session = await auth.api.getSession({
            headers: new Headers(req.headers),
        });
        if (session?.user) {
            const profile = await db.query.profiles.findFirst({
                where: eq(schema.profiles.email, session.user.email),
            });
            if (profile) {
                req.sessionUser = {
                    authUserId: session.user.id,
                    profileId: profile.id,
                    email: profile.email,
                    fullName: profile.fullName,
                    avatarUrl: profile.avatarUrl,
                    role: "USER",
                    teamId: null,
                    memberRole: null,
                    onboardingStatus: profile.onboardingStatus,
                };
            }
        }
        next();
    }
    catch {
        next();
    }
}
/**
 * Validates the better-auth session only (does not require compsphere profile).
 * Used during onboarding.
 */
export async function requireGoogleSession(req, res, next) {
    try {
        console.log("🔑 [requireGoogleSession] Request headers cookie:", req.headers.cookie);
        const session = await auth.api.getSession({
            headers: new Headers(req.headers),
        });
        console.log("🔑 [requireGoogleSession] Resolved session:", session ? { id: session.user.id, email: session.user.email } : null);
        if (!session?.user) {
            res.status(401).json({ success: false, error: "Not authenticated" });
            return;
        }
        req.googleSession = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            image: session.user.image || null,
        };
        next();
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=auth.middleware.js.map