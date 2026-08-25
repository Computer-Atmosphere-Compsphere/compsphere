import { Request, Response, NextFunction } from "express";
import type { RoleType } from "@compsphere/types";

/**
 * Role-based access control middleware.
 * Must be used AFTER requireAuth.
 */
export function requireRole(...roles: RoleType[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.sessionUser) {
      res.status(401).json({ success: false, error: "Not authenticated" });
      return;
    }
    if (!roles.includes(req.sessionUser.role)) {
      res.status(403).json({
        success: false,
        error: "Insufficient permissions",
        required: roles,
        current: req.sessionUser.role,
      });
      return;
    }
    next();
  };
}

/**
 * Ensure the request user is a team leader.
 * Must be used AFTER requireAuth.
 */
export function requireTeamLeader(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.sessionUser) {
    res.status(401).json({ success: false, error: "Not authenticated" });
    return;
  }
  if (req.sessionUser.memberRole !== "TEAM_LEADER") {
    res.status(403).json({
      success: false,
      error: "Only the team leader can perform this action",
    });
    return;
  }
  next();
}

/**
 * Ensure the user belongs to the team specified in the request.
 * Checks req.params.teamId or req.body.teamId against session.
 */
export function requireTeamMembership(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.sessionUser) {
    res.status(401).json({ success: false, error: "Not authenticated" });
    return;
  }

  // ADMIN can bypass team membership checks
  if (req.sessionUser.role === "ADMIN") {
    next();
    return;
  }

  const requestedTeamId = req.params.teamId || req.body?.teamId;
  if (!requestedTeamId) {
    res.status(400).json({ success: false, error: "teamId required" });
    return;
  }

  if (req.sessionUser.teamId !== requestedTeamId) {
    res.status(403).json({
      success: false,
      error: "Not a member of this team",
    });
    return;
  }

  next();
}
