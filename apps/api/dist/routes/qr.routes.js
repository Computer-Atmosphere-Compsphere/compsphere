import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { qrService } from "../services/qr.service.js";
import { AppError } from "../middleware/error.middleware.js";
const router = Router();
/**
 * Get (or generate) QR token for active participant member
 * GET /api/qr/my-token
 */
router.get("/my-token", requireAuth, async (req, res, next) => {
    try {
        const user = req.sessionUser;
        if (user.role !== "PARTICIPANT" || !user.teamId) {
            throw new AppError(403, "You must be a qualified team participant to access a QR token.", "NO_PARTICIPANT");
        }
        const token = await qrService.generateQRToken(user.teamId, user.profileId);
        res.json({
            success: true,
            data: {
                token,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=qr.routes.js.map