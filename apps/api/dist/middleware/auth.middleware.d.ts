import { Request, Response, NextFunction } from "express";
import type { RoleType, MemberRole, OnboardingStatus } from "@compsphere/types";
declare global {
    namespace Express {
        interface Request {
            sessionUser?: {
                authUserId: string;
                profileId: string;
                email: string;
                fullName: string;
                avatarUrl: string | null;
                role: RoleType;
                teamId: string | null;
                memberRole: MemberRole | null;
                onboardingStatus: OnboardingStatus;
            };
        }
    }
}
/**
 * Validates the better-auth session and attaches the COMPSPHERE profile
 * to req.sessionUser. Routes that need auth must use this middleware.
 */
export declare function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * Optional auth — attaches session if present, continues without error if not.
 */
export declare function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void>;
declare global {
    namespace Express {
        interface Request {
            googleSession?: {
                id: string;
                email: string;
                name: string;
                image: string | null;
            };
        }
    }
}
/**
 * Validates the better-auth session only (does not require compsphere profile).
 * Used during onboarding.
 */
export declare function requireGoogleSession(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=auth.middleware.d.ts.map