import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { NeonButton } from "@/components/compsphere/NeonButton";
import { StatusBadge } from "@/components/compsphere/StatusBadge";
import { CountdownCard } from "@/components/compsphere/CountdownCard";
import { Trophy, Clock, AlertTriangle, SkipForward } from "lucide-react";

export function Top30() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<any>({
    queryKey: ["admin-top30"],
    queryFn: () => api.get("/api/admin/top30"),
    refetchInterval: 60_000,
  });

  const dropMutation = useMutation({
    mutationFn: (teamId: string) => api.post("/api/admin/drop-team", { teamId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-top30"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
    },
  });

  const teams: any[] = data?.teams ?? [];

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-border flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary">Top 30 SLA Management</h1>
          <p className="text-xs text-text-secondary mt-1">
            Monitor 48-hour confirmation windows. Expired slots cascade to the waitlist automatically.
          </p>
        </div>
        <div className="text-right text-xs">
          <span className="text-brand-primary font-mono font-bold text-2xl">{teams.length}</span>
          <p className="text-text-muted">Active Top 30</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="w-7 h-7 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : teams.length === 0 ? (
        <GlassPanel className="text-center py-14 space-y-3">
          <Trophy className="w-10 h-10 text-brand-primary mx-auto" />
          <p className="text-sm font-bold text-text-primary">No Active Top 30 SLA</p>
          <p className="text-xs text-text-muted">Run a migration import to populate Top 30 activation data.</p>
        </GlassPanel>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team: any) => {
            const deadline = team.confirmationDeadline ? new Date(team.confirmationDeadline) : null;
            const isExpired = deadline && new Date() > deadline;
            const isNearExpiry =
              deadline &&
              !isExpired &&
              new Date(deadline).getTime() - Date.now() < 4 * 60 * 60 * 1000;

            return (
              <GlassPanel
                key={team.id}
                className={`flex flex-col justify-between ${
                  isExpired
                    ? "border-red-900/40"
                    : isNearExpiry
                    ? "border-yellow-700/40"
                    : "border-border"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-brand-primary bg-brand-dim px-2 py-0.5 rounded">
                      #{team.originalRank}
                    </span>
                    <StatusBadge status={team.status} />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-primary text-sm line-clamp-1">{team.teamName}</h4>
                    <p className="text-[10px] text-text-muted font-mono mt-0.5">{team.teamCode}</p>
                  </div>

                  {deadline && !isExpired && (
                    <div className="pt-2">
                      <p className="text-[9px] text-text-muted mb-1.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Confirmation Deadline
                      </p>
                      <CountdownCard deadline={deadline.toISOString()} className="!p-3 text-sm" />
                    </div>
                  )}

                  {isExpired && (
                    <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-950/20 px-2 py-1.5 rounded border border-red-900/30">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>SLA Expired</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-border/40">
                  <NeonButton
                    onClick={() => dropMutation.mutate(team.id)}
                    disabled={dropMutation.isPending}
                    variant="destructive"
                    size="sm"
                    className="w-full flex items-center justify-center gap-1.5"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    Force Drop → Waitlist
                  </NeonButton>
                </div>
              </GlassPanel>
            );
          })}
        </div>
      )}
    </div>
  );
}
