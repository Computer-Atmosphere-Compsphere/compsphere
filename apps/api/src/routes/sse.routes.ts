import { Router } from "express";
import { optionalAuth } from "../middleware/auth.middleware";
import { sseService } from "../sse/sse.service";
import crypto from "crypto";

const router = Router();

/**
 * SSE endpoint for live updates.
 * GET /api/sse
 * 
 * In serverless environments (e.g. Vercel), long-lived HTTP streams cannot
 * stay open indefinitely without triggering "Task timed out after 300 seconds"
 * and exhausting serverless concurrency.
 * 
 * We cycle the connection cleanly every 25 seconds by calling res.end(),
 * prompting the client to seamlessly reconnect. This guarantees HTTP 200
 * completion, avoids runtime timeouts, and releases serverless resources.
 */
router.get("/", optionalAuth, (req, res) => {
  // Remove helmet security headers that block browser EventSource
  res.removeHeader("Cross-Origin-Opener-Policy");
  res.removeHeader("Cross-Origin-Resource-Policy");
  res.removeHeader("Origin-Agent-Cluster");

  // Set headers for Server-Sent Events
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
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

  // Periodic ping to keep stream active
  const pingInterval = setInterval(() => {
    try {
      res.write(`: ping\n\n`);
    } catch {
      cleanup();
    }
  }, 8_000);

  // Cleanly close before Vercel serverless execution timeout (25 seconds)
  // This produces a normal HTTP 200 completion instead of a 300s timeout crash.
  const cycleTimer = setTimeout(() => {
    try {
      res.write(`event: heartbeat\ndata: ${JSON.stringify({ type: "heartbeat", status: "cycle", timestamp: new Date().toISOString() })}\n\n`);
      res.end();
    } catch {
      // response might already be closed
    }
    cleanup();
  }, 25_000);

  let isCleanedUp = false;
  function cleanup() {
    if (isCleanedUp) return;
    isCleanedUp = true;
    clearInterval(pingInterval);
    clearTimeout(cycleTimer);
    sseService.removeClient(clientId);
  }

  // Handle client disconnection
  req.on("close", cleanup);
  res.on("finish", cleanup);
});

export default router;
