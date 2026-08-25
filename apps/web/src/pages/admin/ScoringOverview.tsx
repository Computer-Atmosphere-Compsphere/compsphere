import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { BarChart2, Trophy } from "lucide-react";

export function ScoringOverview() {
  const { data, isLoading } = useQuery<any>({
    queryKey: ["admin-scoring"],
    queryFn: () => api.get("/api/scoring/leaderboard"),
  });

  const leaderboard: any[] = data?.leaderboard ?? [];

  const medalColor = (rank: number) => {
    if (rank === 1) return "text-yellow-400";
    if (rank === 2) return "text-gray-300";
    if (rank === 3) return "text-amber-600";
    return "text-text-muted";
  };

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-border">
        <h1 className="text-3xl font-extrabold text-text-primary">Scoring Overview</h1>
        <p className="text-xs text-text-secondary mt-1">
          Weighted leaderboard: Innovation 35% · Impact 25% · Feasibility 20% · Presentation 20%
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="w-7 h-7 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : leaderboard.length === 0 ? (
        <GlassPanel className="text-center py-14 space-y-3">
          <BarChart2 className="w-10 h-10 text-brand-primary mx-auto" />
          <p className="text-sm font-bold text-text-primary">No Scores Yet</p>
          <p className="text-xs text-text-muted">Judges haven't submitted evaluations yet.</p>
        </GlassPanel>
      ) : (
        <div className="overflow-x-auto rounded border border-border">
          <table className="min-w-full text-xs text-left">
            <thead className="bg-bg-surface text-text-muted uppercase border-b border-border">
              <tr>
                <th className="px-4 py-3 w-12">#</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3 text-right">Innovation</th>
                <th className="px-4 py-3 text-right">Impact</th>
                <th className="px-4 py-3 text-right">Feasibility</th>
                <th className="px-4 py-3 text-right">Presentation</th>
                <th className="px-4 py-3 text-right">Weighted</th>
                <th className="px-4 py-3 text-right">Judges</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-text-secondary">
              {leaderboard.map((entry: any, idx: number) => {
                const rank = idx + 1;
                return (
                  <tr key={entry.teamId} className="hover:bg-bg-surface/30 transition">
                    <td className={`px-4 py-3 font-mono font-black text-base ${medalColor(rank)}`}>
                      {rank <= 3 ? <Trophy className="w-4 h-4 inline mr-1" /> : null}
                      {rank}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-text-primary">{entry.teamName}</p>
                      <p className="text-[10px] text-text-muted font-mono">{entry.teamCode}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {Number(entry.innovation ?? 0).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {Number(entry.impact ?? 0).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {Number(entry.feasibility ?? 0).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {Number(entry.presentation ?? 0).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-brand-primary">
                      {Number(entry.weightedScore ?? 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-text-muted">
                      {entry.judgeCount ?? 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
