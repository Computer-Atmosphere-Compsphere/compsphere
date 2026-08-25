import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { auditService } from "../services/audit.service.js";
import { z } from "zod";
const router = Router();
/**
 * Get audit logs (Admin only)
 * GET /api/audit?page=1&limit=50&search=payment
 */
router.get("/", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
    try {
        const querySchema = z.object({
            page: z.preprocess((val) => Number(val), z.number().min(1).default(1)),
            limit: z.preprocess((val) => Number(val), z.number().min(1).max(100).default(50)),
            search: z.string().optional(),
        });
        const parsed = querySchema.parse(req.query);
        const result = await auditService.getLogs(parsed.page, parsed.limit, parsed.search);
        res.json({
            success: true,
            data: {
                logs: result.logs,
                pagination: {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    totalPages: result.totalPages,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=audit.routes.js.map