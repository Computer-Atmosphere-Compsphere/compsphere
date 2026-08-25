import { Request, Response, NextFunction } from "express";
import type { RoleType } from "@compsphere/types";
/**
 * Role-based access control middleware.
 * Must be used AFTER requireAuth.
 */
export declare function requireRole(...roles: RoleType[]): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Ensure the request user is a team leader.
 * Must be used AFTER requireAuth.
 */
export declare function requireTeamLeader(req: Request, res: Response, next: NextFunction): void;
/**
 * Ensure the user belongs to the team specified in the request.
 * Checks req.params.teamId or req.body.teamId against session.
 */
export declare function requireTeamMembership(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=role.middleware.d.ts.map