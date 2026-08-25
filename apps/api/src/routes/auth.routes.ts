import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

/**
 * Get active session user info (profile, role, team)
 * GET /api/auth/session-info
 */
router.get("/", requireAuth, (req, res) => {
  res.json({
    success: true,
    data: req.sessionUser,
  });
});

export default router;
