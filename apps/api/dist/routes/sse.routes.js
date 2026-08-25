import { Router } from "express";
import { optionalAuth } from "../middleware/auth.middleware.js";
import { sseService } from "../sse/sse.service.js";
import crypto from "crypto";
const router = Router();
/**
 * SSE endpoint for live updates.
 * GET /api/sse
 */
router.get("/", optionalAuth, (req, res) => {
    // Remove helmet security headers that block browser EventSource
    res.removeHeader("Cross-Origin-Opener-Policy");
    res.removeHeader("Cross-Origin-Resource-Policy");
    res.removeHeader("Origin-Agent-Cluster");
    // Set headers for Server-Sent Events
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
    });
    // Unique client ID
    const clientId = crypto.randomBytes(16).toString("hex");
    // Keep alive ping immediately
    res.write(`: ok\n\n`);
    // Register client
    sseService.addClient({
        id: clientId,
        res,
        userId: req.sessionUser?.profileId,
        teamId: req.sessionUser?.teamId || undefined,
        role: req.sessionUser?.role,
    });
    // Handle client disconnection
    req.on("close", () => {
        sseService.removeClient(clientId);
    });
});
export default router;
//# sourceMappingURL=sse.routes.js.map