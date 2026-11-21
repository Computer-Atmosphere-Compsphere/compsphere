import { Router } from "express";

const router = Router();

/**
 * SSE endpoint — disabled on Vercel serverless.
 *
 * Vercel has a hard 300-second function timeout. Long-lived SSE streams
 * hit this limit and cause "Task timed out after 300 seconds" errors that
 * bring down ALL other API endpoints by exhausting serverless concurrency.
 *
 * The frontend now uses polling (every 30 s via useSSE hook) instead.
 * This endpoint returns an immediate 200 OK and closes, so the client
 * can confirm the API is reachable. Zero risk of timeout.
 */
router.get("/", (_req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "close",
    "X-Accel-Buffering": "no",
  });
  res.write(`: ok\n\n`);
  res.end();
});

export default router;
