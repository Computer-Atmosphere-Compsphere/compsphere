import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { StatusBadge } from "@/components/compsphere/StatusBadge";
import { Link } from "react-router-dom";
import { CheckSquare, Clock } from "lucide-react";

export function JudgeTeams() {
  const { data, isLoading } = useQuery<any>({
    queryKey: ["judge-assignments"],
    queryFn: () => api.get("/api/judges/my-assignments"),
  });

  const assignments: any[] = data?.assignments ?? [];

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-border">
        <h1 className="text-3xl font-extrabold text-text-primary">Assigned Teams</h1>
        <p className="text-xs text-text-secondary mt-1">
          All teams assigned for your evaluation. Click a team to score them.
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="w-7 h-7 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((a: any) => (
            <Link key={a.id} to={`/judge/scoring/${a.teamId}`}>
              <GlassPanel className="flex flex-col justify-between hover:border-brand-primary/40 transition cursor-pointer">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-brand-primary bg-brand-dim px-2 py-0.5 rounded font-mono">
                      {a.teamCode}
                    </span>
                    {a.scoredAt ? (
                      <span className="flex items-center gap-1 text-[9px] text-brand-primary font-bold">
                        <CheckSquare className="w-3 h-3" /> Scored
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[9px] text-yellow-400 font-bold">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-text-primary text-sm">{a.teamName}</h4>
                  {a.scoredAt && (
                    <p className="text-[10px] text-text-muted">
                      Scored: {new Date(a.scoredAt).toLocaleDateString("id-ID")}
                    </p>
                  )}
                </div>
                <div className="mt-5 pt-4 border-t border-border/40 text-xs text-brand-primary font-bold">
                  {a.scoredAt ? "Review Score →" : "Score Now →"}
                </div>
              </GlassPanel>
            </Link>
          ))}
          {assignments.length === 0 && (
            <p className="col-span-full text-center text-text-muted text-xs py-12">
              No teams assigned yet. Contact the admin.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
