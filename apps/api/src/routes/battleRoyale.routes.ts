import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { battleRoyaleService } from "../services/battleRoyale.service";
import { z } from "zod";

const router = Router();

/**
 * Get current Battle Royale status and remaining slots
 * GET /api/battle-royale/status
 */
router.get("/status", async (req, res, next) => {
  try {
    const status = await battleRoyaleService.getStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Open the waiting-list claiming phase (Admin only)
 * POST /api/battle-royale/initiate
 */
router.post("/initiate", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const admin = req.sessionUser!;
    const config = await battleRoyaleService.initiate(admin.profileId);
    res.json({
      success: true,
      message: "Battle Royale initiated successfully.",
      data: config,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Claim a Battle Royale slot atomically (First Come First Served)
 * POST /api/battle-royale/claim
 */
router.post("/claim", requireAuth, async (req, res, next) => {
  try {
    const user = req.sessionUser!;
    const bodySchema = z.object({
      teamId: z.string().uuid("Invalid team ID"),
    });

    const { teamId } = bodySchema.parse(req.body);

    const result = await battleRoyaleService.claimSlot(teamId, user.profileId);

    res.json({
      success: true,
      message: "Successfully claimed a Battle Royale slot!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
