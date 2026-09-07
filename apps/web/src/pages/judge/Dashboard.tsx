import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  CheckCircle2,
  Clock3,
  Lock,
  Layers,
  Sparkles,
  ChevronRight,
  BarChart3,
  ArrowUpRight,
  Award,
  Users,
  FileText,
  Clock,
  TrendingUp,
} from "lucide-react";

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

  const totalCount = assignments.length;
  const scoredCount = scored.length;
  const pendingCount = pending.length;
  const completionPct = totalCount > 0 ? Math.round((scoredCount / totalCount) * 100) : 0;

  // Calculate overall average score given
  const totalScoreSum = scored.reduce((acc, curr) => acc + (Number(curr.score?.finalScore) || 0), 0);
  const avgScore = scoredCount > 0 ? (totalScoreSum / scoredCount).toFixed(1) : "—";

  const categoryBadge: Record<string, string> = {
    NATIONAL: "text-sky-300 bg-sky-950/60 border-sky-700/40",
    MIX: "text-violet-300 bg-violet-950/60 border-violet-700/40",
    INTERNATIONAL: "text-amber-300 bg-amber-950/60 border-amber-700/40",
  };

  return (
    <div className="w-full max-w-none px-0 pb-16 min-h-screen">
      {/* ── TOP COMMAND HEADER ── */}
      <div
        className="sticky top-0 z-20 flex flex-col gap-0"
        style={{
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,245,200,0.09)",
        }}
      >
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-brand-primary uppercase tracking-widest opacity-80">
              <ShieldCheck className="w-3.5 h-3.5" /> Judge Evaluator Console
            </span>
            <span className="text-border">│</span>
            <h1 className="text-base font-bold text-text-primary tracking-tight">
              Overview & Analytics
            </h1>
            <span
              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase"
              style={{
                background: "rgba(0,245,200,0.08)",
                border: "1px solid rgba(0,245,200,0.2)",
                color: "#00f5c8",
              }}
            >
              Phase 1 Evaluation
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isFrozen && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-950/60 border border-red-800/50 px-2.5 py-1 rounded">
                <Lock className="w-3 h-3" /> Code Freeze Active
              </span>
            )}
            <span className="text-xs text-text-muted">
              Evaluator: <strong className="text-text-primary">{user?.fullName}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ── MAIN DASHBOARD WORKBENCH ── */}
      <div className="px-6 pt-6 space-y-6">
        {/* KPI Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Total Assignments */}
          <div
            className="p-4 rounded-xl flex items-center justify-between transition-all"
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div>
              <p className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider">
                Assigned Teams
              </p>
              <p className="text-2xl font-extrabold text-text-primary font-mono mt-1">
                {totalCount}
              </p>
            </div>
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(0,245,200,0.08)", border: "1px solid rgba(0,245,200,0.2)" }}
            >
              <Layers className="w-5 h-5 text-brand-primary" />
            </div>
          </div>

          {/* Card 2: Scored */}
          <div
            className="p-4 rounded-xl flex items-center justify-between transition-all"
            style={{
              background: "rgba(74,222,128,0.025)",
              border: "1px solid rgba(74,222,128,0.12)",
            }}
          >
            <div>
              <p className="text-[10px] font-mono font-bold text-green-400 uppercase tracking-wider">
                Evaluated & Scored
              </p>
              <p className="text-2xl font-extrabold text-green-400 font-mono mt-1">
                {scoredCount}
              </p>
            </div>
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)" }}
            >
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
          </div>

          {/* Card 3: Pending */}
          <div
            className="p-4 rounded-xl flex items-center justify-between transition-all"
            style={{
              background: "rgba(250,204,21,0.025)",
              border: "1px solid rgba(250,204,21,0.12)",
            }}
          >
            <div>
              <p className="text-[10px] font-mono font-bold text-yellow-400 uppercase tracking-wider">
                Pending Evaluation
              </p>
              <p className="text-2xl font-extrabold text-yellow-400 font-mono mt-1">
                {pendingCount}
              </p>
            </div>
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(250,204,21,0.1)", border: "1px solid rgba(250,204,21,0.25)" }}
            >
              <Clock3 className="w-5 h-5 text-yellow-400" />
            </div>
          </div>

          {/* Card 4: Avg Score Given */}
          <div
            className="p-4 rounded-xl flex items-center justify-between transition-all"
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div>
              <p className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider">
                Average Score Given
              </p>
              <p className="text-2xl font-extrabold font-mono mt-1" style={{ color: "#00f5c8" }}>
                {avgScore} <span className="text-xs font-normal text-text-muted">/ 100</span>
              </p>
            </div>
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(0,245,200,0.08)", border: "1px solid rgba(0,245,200,0.2)" }}
            >
              <TrendingUp className="w-5 h-5 text-brand-primary" />
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div
          className="p-4 rounded-xl space-y-2"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-text-muted uppercase tracking-wider text-[10px]">
              Overall Scoring Completion
            </span>
            <span className="font-mono font-bold" style={{ color: "#00f5c8" }}>
              {scoredCount} of {totalCount} teams ({completionPct}%)
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${completionPct}%`,
                background: "linear-gradient(90deg, #00f5c8, #00ddb5)",
                boxShadow: "0 0 10px rgba(0,245,200,0.3)",
              }}
            />
          </div>
        </div>

        {/* Split Column Layout */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Pending Evaluations Queue (6 cols) */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Clock3 className="w-4 h-4 text-yellow-400" />
                <h3 className="text-sm font-bold text-text-primary">Pending Evaluation Queue</h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded text-yellow-400 bg-yellow-950/40 border border-yellow-900/50">
                {pendingCount} REMAINING
              </span>
            </div>

            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <div
                  className="w-6 h-6 rounded-full border-2 animate-spin"
                  style={{ borderColor: "rgba(0,245,200,0.2)", borderTopColor: "#00f5c8" }}
                />
              </div>
            ) : pending.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-white/[0.015] border border-white/5 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto" />
                <p className="text-xs font-bold text-text-primary">All Pending Evaluations Completed!</p>
                <p className="text-[11px] text-text-muted max-w-xs mx-auto">
                  You have finished scoring all teams assigned to your evaluation queue.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {pending.map((a: any) => {
                  const team = a.team || {};
                  const proposal = team.proposal || {};

                  return (
                    <div
                      key={a.id}
                      className="group flex items-center justify-between p-3.5 rounded-lg transition-all"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(0,245,200,0.04)";
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,245,200,0.18)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)";
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)";
                      }}
                    >
                      <div className="space-y-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                            style={{
                              background: "rgba(0,245,200,0.08)",
                              border: "1px solid rgba(0,245,200,0.2)",
                              color: "#00f5c8",
                            }}
                          >
                            {team.teamCode}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${categoryBadge[team.category] || "text-text-muted"}`}
                          >
                            {team.category || "NATIONAL"}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-text-primary truncate group-hover:text-brand-primary transition-colors">
                          {team.teamName}
                        </p>
                        {proposal.title && (
                          <p className="text-[10px] text-text-muted truncate max-w-xs">
                            {proposal.title}
                          </p>
                        )}
                      </div>

                      <Link
                        to={`/judge/scoring/${a.teamId}`}
                        className="shrink-0 flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded transition-all"
                        style={{
                          background: "rgba(0,245,200,0.1)",
                          border: "1px solid rgba(0,245,200,0.25)",
                          color: "#00f5c8",
                        }}
                      >
                        <Sparkles className="w-3 h-3" /> Evaluate <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Evaluated Scores History (6 cols) */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <h3 className="text-sm font-bold text-text-primary">Completed Evaluations</h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded text-green-400 bg-green-950/40 border border-green-900/50">
                {scoredCount} SCORED
              </span>
            </div>

            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <div
                  className="w-6 h-6 rounded-full border-2 animate-spin"
                  style={{ borderColor: "rgba(0,245,200,0.2)", borderTopColor: "#00f5c8" }}
                />
              </div>
            ) : scored.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-white/[0.015] border border-white/5 space-y-2">
                <BarChart3 className="w-8 h-8 text-text-muted mx-auto" />
                <p className="text-xs font-bold text-text-primary">No Scores Submitted Yet</p>
                <p className="text-[11px] text-text-muted max-w-xs mx-auto">
                  Evaluated scores will be cataloged here once you start grading teams.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {scored.map((a: any) => {
                  const team = a.team || {};
                  const score = a.score || {};

                  return (
                    <div
                      key={a.id}
                      className="group flex items-center justify-between p-3.5 rounded-lg transition-all"
                      style={{
                        background: "rgba(74,222,128,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(74,222,128,0.04)";
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(74,222,128,0.2)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(74,222,128,0.02)";
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)";
                      }}
                    >
                      <div className="space-y-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                            style={{
                              background: "rgba(0,245,200,0.08)",
                              border: "1px solid rgba(0,245,200,0.2)",
                              color: "#00f5c8",
                            }}
                          >
                            {team.teamCode}
                          </span>
                          <span className="text-[9px] font-mono text-green-400 font-semibold">
                            Evaluated
                          </span>
                        </div>
                        <p className="text-xs font-bold text-text-primary truncate">
                          {team.teamName}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right font-mono">
                          <span className="text-sm font-bold" style={{ color: "#00f5c8" }}>
                            {Number(score.finalScore).toFixed(1)}
                          </span>
                          <span className="text-[10px] text-text-muted"> / 100</span>
                        </div>

                        <Link
                          to={`/judge/scoring/${a.teamId}`}
                          className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded transition-all"
                          style={{
                            background: "rgba(74,222,128,0.1)",
                            border: "1px solid rgba(74,222,128,0.3)",
                            color: "#4ade80",
                          }}
                        >
                          Review <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
