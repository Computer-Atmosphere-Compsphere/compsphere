import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Fetches the public system configuration from the backend.
 * Returns a key→value record for all publicly-exposed config keys.
 * Uses a shared query key so it is cached across all components
 * that call this hook on the same page.
 */
export function usePublicConfig() {
  return useQuery<Record<string, string>>({
    queryKey: ["public-config"],
    queryFn: () => api.get("/api/config/public"),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
