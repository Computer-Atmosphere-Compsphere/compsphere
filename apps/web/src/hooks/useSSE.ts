import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * useSSE — Polling-based fallback for Vercel serverless.
 *
 * Vercel serverless functions have a hard 300-second execution limit.
 * Long-lived SSE connections hit this limit, causing "Task timed out"
 * errors that bring down the entire API.
 *
 * Fix: disable SSE entirely and use TanStack Query's refetchInterval
 * for data freshness instead. Key queries are polled every 30 seconds.
 * Push events that previously relied on SSE are now covered by polling.
 */
export function useSSE() {
  const queryClient = useQueryClient();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Poll critical queries every 30 seconds for near-realtime updates
    intervalRef.current = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["my-team"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["admin-payments-queue"] });
      queryClient.invalidateQueries({ queryKey: ["admin-teams"] });
      queryClient.invalidateQueries({ queryKey: ["battle-royale-status"] });
      queryClient.invalidateQueries({ queryKey: ["submission-deadline"] });
    }, 30_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [queryClient]);

  // Always report as connected — polling is always "on"
  return { isConnected: true, isReconnecting: false };
}
