import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { tokenService } from "../services/token.service";
import { z } from "zod";

const router = Router();

/**
 * Universal Access Token Redemption for logged-in users.
 * Accepts any valid token (Committee Key, Judge Key, Team Leader Token, Member Invite Code).
 * Automatically updates role and returns target dashboard redirect URL.
 * POST /api/user/redeem-token
 */
router.post("/redeem-token", requireAuth, async (req, res, next) => {
  try {
    const sessionUser = req.sessionUser!;
    const bodySchema = z.object({
      token: z.string().min(1, "Access token is required"),
    });

    const { token } = bodySchema.parse(req.body);
    const result = await tokenService.redeemUniversalToken(sessionUser.profileId, token);

    res.json({
      success: true,
      message: result.message || "Access token successfully activated.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get current user profile details
 * GET /api/user/profile
 */
router.get("/profile", requireAuth, (req, res) => {
  res.json({
    success: true,
    data: req.sessionUser,
  });
});

export default router;
