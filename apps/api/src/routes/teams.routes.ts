import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole, requireTeamMembership } from "../middleware/role.middleware";
import { teamService } from "../services/team.service";
import { AppError } from "../middleware/error.middleware";

const router = Router();

/**
 * Get active team details for authenticated participant
 * GET /api/teams/my-team
 */
router.get("/my-team", requireAuth, async (req, res, next) => {
  try {
    const user = req.sessionUser!;
    if (user.role !== "PARTICIPANT" || !user.teamId) {
      throw new AppError(403, "You do not have a team assignment.", "NO_TEAM");
    }

    const details = await teamService.getTeamDetails(user.teamId);
    res.json({
      success: true,
      data: details,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get details for a specific team (Admin or Judge only)
 * GET /api/teams/:teamId
 */
router.get("/:teamId", requireAuth, requireRole("ADMIN", "JUDGE"), async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const details = await teamService.getTeamDetails(teamId as string);
    res.json({
      success: true,
      data: details,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
