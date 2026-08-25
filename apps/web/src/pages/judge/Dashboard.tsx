import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { MetricCard } from "@/components/compsphere/MetricCard";
import { Gavel, CheckSquare, Clock, Lock } from "lucide-react";
import { Link } from "react-router-dom";

export function JudgeDashboard() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery<any>({
    queryKey: ["judge-dashboard"],
    queryFn: () => api.get("/api/judges/my-assignments"),
  });

  const assignments: any[] = data?.assignments ?? [];
  const scored = assignments.filter((a) => a.score);
  const pending = assignments.filter((a) => !a.score);
  const isFrozen = data?.isFrozen;

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-border flex items-center justify-between">
        <div>
          <p className="text-xs text-text-muted">Judge Console</p>
          <h1 className="text-3xl font-extrabold text-text-primary mt-0.5">
            Welcome, {user?.fullName?.split(" ")[0]}
          </h1>
        </div>
        {isFrozen && (
          <div className="flex items-center gap-2 px-3 py-2 rounded bg-red-950/30 border border-red-900/40 text-red-400 text-xs">
            <Lock className="w-4 h-4" />
            <span className="font-bold">Code Freeze Active</span>
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-6">
        <MetricCard
          title="Total Assignments"
          value={assignments.length}
          icon={<Gavel className="w-5 h-5 text-brand-primary" />}
        />
        <MetricCard
          title="Scored"
          value={scored.length}
          icon={<CheckSquare className="w-5 h-5 text-green-400" />}
        />
        <MetricCard
          title="Pending"
          value={pending.length}
          icon={<Clock className="w-5 h-5 text-yellow-400" />}
        />
      </div>

      {/* Progress bar */}
      {assignments.length > 0 && (
        <GlassPanel className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-text-secondary">Scoring Progress</span>
            <span className="text-xs font-mono text-brand-primary">
              {scored.length}/{assignments.length} ({Math.round((scored.length / assignments.length) * 100)}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-bg-surface overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-primary transition-all"
              style={{ width: `${(scored.length / assignments.length) * 100}%` }}
            />
          </div>
        </GlassPanel>
      )}

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : pending.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-text-secondary">Pending Evaluations</h3>
          {pending.map((a: any) => (
            <Link key={a.id} to={`/judge/scoring/${a.teamId}`}>
              <GlassPanel className="hover:border-brand-primary/40 transition cursor-pointer mb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-text-primary text-sm">{a.team?.teamName}</p>
                    <p className="text-[10px] text-text-muted font-mono mt-0.5">{a.team?.teamCode}</p>
                  </div>
                  <span className="text-xs text-yellow-400 font-bold">
                    {isFrozen ? "Locked" : "Score Now →"}
                  </span>
                </div>
              </GlassPanel>
            </Link>
          ))}
        </div>
      ) : (
        <GlassPanel className="text-center py-14 space-y-3">
          <CheckSquare className="w-10 h-10 text-brand-primary mx-auto" />
          <p className="text-sm font-bold text-text-primary">All Teams Scored!</p>
          <p className="text-xs text-text-muted">You have evaluated all assigned teams.</p>
        </GlassPanel>
      )}

      {/* Recently scored */}
      {scored.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-text-secondary">Recently Scored</h3>
          {scored.slice(0, 5).map((a: any) => (
            <Link key={a.id} to={`/judge/scoring/${a.teamId}`}>
              <GlassPanel className="hover:border-brand-primary/40 transition cursor-pointer mb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-text-primary text-sm">{a.team?.teamName}</p>
                    <p className="text-[10px] text-text-muted font-mono mt-0.5">{a.team?.teamCode}</p>
                  </div>
                  <span className="text-xs text-green-400 font-mono font-bold">
                    {a.score?.finalScore ? Number(a.score.finalScore).toFixed(1) : "—"}
                  </span>
                </div>
              </GlassPanel>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
