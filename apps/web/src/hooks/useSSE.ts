import { useEffect, useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { SSEEvent } from "@compsphere/types";

/**
 * Resolve the SSE endpoint URL.
 *
 *  • In development the Vite dev-server proxies `/api/*` → the backend,
 *    so a **relative** URL is the safest choice — no CORS headaches,
 *    no buffering surprises.
 *
 *  • If VITE_API_URL is explicitly set (e.g. a remote staging server),
 *    use it as-is so the fetch still works cross-origin.
 */
// Always use a relative URL so the Vite dev-proxy handles the request.
// This avoids CORS + compression-buffering issues that plagued the old
// direct-to-backend fetch (http://localhost:3001/api/sse).
const SSE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api/sse` 
  : "/api/sse";

/**
 * SSE hook that uses fetch + ReadableStream instead of EventSource.
 *
 * Fallback chain:
 *   1. Try to open an SSE stream via fetch.
 *   2. If that fails, poll /api/health to confirm the backend is reachable.
 *   3. If the health endpoint answers, show "online" (the SSE endpoint
 *      might just be unavailable for streaming, but the API is live).
 */
export function useSSE() {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const connectedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let unmounted = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let retryCount = 0;
    const MAX_RETRY_DELAY = 15_000;

    function handleEvent(type: string, data: any) {
      switch (type) {
        case "battle_royale:slot_updated":
          console.log("[SSE] Battle Royale slots updated:", data);
          queryClient.invalidateQueries({ queryKey: ["battle-royale-status"] });
          break;
        case "battle_royale:initiated":
          console.log("[SSE] Battle Royale initiated!");
          queryClient.invalidateQueries({ queryKey: ["battle-royale-status"] });
          break;
        case "team:status_changed":
          console.log("[SSE] Team status changed:", data);
          queryClient.invalidateQueries({ queryKey: ["my-team"] });
          queryClient.invalidateQueries({ queryKey: ["admin-teams"] });
          queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
          break;
        case "payment:verified":
          queryClient.invalidateQueries({ queryKey: ["my-team"] });
          queryClient.invalidateQueries({ queryKey: ["admin-payments-queue"] });
          queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
          break;
        case "payment:rejected":
          queryClient.invalidateQueries({ queryKey: ["my-team"] });
          queryClient.invalidateQueries({ queryKey: ["admin-payments-queue"] });
          break;
        case "submission:locked":
          queryClient.invalidateQueries({ queryKey: ["submission-deadline"] });
          break;
        case "admin:counter_updated":
          queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
          queryClient.invalidateQueries({ queryKey: ["admin-teams"] });
          break;
        case "migration:team_added":
          console.log("[SSE] New team migrated:", data);
          queryClient.invalidateQueries({ queryKey: ["admin-recent-teams"] });
          queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
          break;
        case "notification:new":
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          break;
        case "heartbeat":
          // keep-alive — confirms connection is alive
          break;
        default:
          console.log("[SSE] Unknown event:", type, data);
      }
    }

    /** Exponential back-off retry */
    function scheduleRetry() {
      if (unmounted) return;
      retryCount++;
      const delay = Math.min(1000 * Math.pow(1.5, retryCount - 1), MAX_RETRY_DELAY);
      console.log(`[SSE] Reconnecting in ${Math.round(delay)}ms (attempt ${retryCount})…`);
      setIsConnected(false);
      setIsReconnecting(true);
      retryTimer = setTimeout(connect, delay);
    }

    /**
     * Fallback: if SSE streaming fails, try the plain health endpoint.
     * If the backend is reachable we mark online anyway — the user just
     * won't get live push events, but the UI won't look broken.
     */
    async function healthFallback() {
      if (unmounted) return;
      try {
        const healthUrl = import.meta.env.VITE_API_URL 
          ? `${import.meta.env.VITE_API_URL}/api/health` 
          : "/api/health";
        const res = await fetch(healthUrl, { cache: "no-store" });
        if (res.ok) {
          console.log("[SSE] Health check passed — marking online (fallback).");
          setIsConnected(true);
          setIsReconnecting(false);
          connectedRef.current = true;
          // Schedule a periodic re-check of the real SSE endpoint
          retryTimer = setTimeout(connect, 30_000);
          return;
        }
      } catch {
        // health also unreachable — keep trying
      }
      scheduleRetry();
    }

    async function connect() {
      if (unmounted) return;

      // Abort any previous connection
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(SSE_URL, {
          credentials: "include",
          signal: controller.signal,
          headers: { Accept: "text/event-stream" },
        });

        if (!res.ok) {
          console.warn(`[SSE] HTTP ${res.status} — will try health fallback.`);
          healthFallback();
          return;
        }

        if (!res.body) {
          console.warn("[SSE] No response body — will try health fallback.");
          healthFallback();
          return;
        }

        // Connection successful
        retryCount = 0; // reset back-off on success
        setIsConnected(true);
        setIsReconnecting(false);
        connectedRef.current = true;
        console.log("[SSE] Connected to event stream.");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE format: lines separated by \n\n
          const events = buffer.split("\n\n");
          buffer = events.pop() || ""; // Keep incomplete chunk

          for (const raw of events) {
            let eventType = "";
            let data = "";

            for (const line of raw.split("\n")) {
              if (line.startsWith("event: ")) {
                eventType = line.slice(7).trim();
              } else if (line.startsWith("data: ")) {
                data = line.slice(6);
              } else if (line.startsWith(":")) {
                // Comment line (like `: ok`) — ignore
              }
            }

            if (eventType && data) {
              try {
                const parsed = JSON.parse(data);
                handleEvent(eventType, parsed.data ?? parsed);
              } catch {
                // Non-JSON data, skip
              }
            }
          }
        }

        // Stream ended unexpectedly
        console.warn("[SSE] Stream ended unexpectedly.");
        scheduleRetry();
      } catch (err: any) {
        if (err.name === "AbortError") {
          // Intentional abort — don't retry
          return;
        }
        console.warn("[SSE] Connection error:", err.message);
        scheduleRetry();
      }
    }

    connect();

    return () => {
      unmounted = true;
      if (retryTimer) clearTimeout(retryTimer);
      abortRef.current?.abort();
      setIsConnected(false);
      connectedRef.current = false;
      setIsReconnecting(false);
      console.log("[SSE] Disconnected from event stream.");
    };
  }, [queryClient]);

  return { isConnected, isReconnecting };
}
