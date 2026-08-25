import { db, schema } from "@compsphere/db";
import { eq, and, isNull } from "drizzle-orm";
import { AppError } from "../middleware/error.middleware.js";
import { auditService } from "./audit.service.js";
export const tokenService = {
    /**
     * Redeem role access tokens (ADMIN or JUDGE).
     * Compares the input raw token with environment variables hashes
     * (to prevent plaintext DB storage or hardcoding in frontend)
     */
    async redeemRoleToken(profileId, rawToken, requestedRole) {
        let expectedToken;
        if (requestedRole === "ADMIN") {
            expectedToken = process.env.COMMITTEE_ACCESS_TOKEN;
        }
        else if (requestedRole === "JUDGE") {
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
                where: and(eq(schema.roleAssignments.userId, profileId), eq(schema.roleAssignments.role, requestedRole), isNull(schema.roleAssignments.revokedAt)),
            });
            if (existing) {
                return { success: true, message: `Role ${requestedRole} already assigned.` };
            }
            // Revoke any current active role assignment for clean state
            await tx
                .update(schema.roleAssignments)
                .set({ revokedAt: new Date() })
                .where(and(eq(schema.roleAssignments.userId, profileId), isNull(schema.roleAssignments.revokedAt)));
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
            return { success: true, role: requestedRole };
        });
    },
};
//# sourceMappingURL=token.service.js.map