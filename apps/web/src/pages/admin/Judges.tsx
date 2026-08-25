import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { NeonButton } from "@/components/compsphere/NeonButton";
import { useForm } from "react-hook-form";
import {
  Plus,
  X,
  Gavel,
  RefreshCw,
  Users,
  Trophy,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  UserCheck,
  UserX,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface JudgeForm {
  email: string;
  fullName: string;
}

function JudgeStatusBadge({ status }: { status: string }) {
  const isActive = status === "ACTIVE";
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        isActive
          ? "bg-green-950/40 text-green-400 border-green-900/50"
          : "bg-red-950/40 text-red-400 border-red-900/50"
      )}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

export function Judges() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"judges" | "matrix" | "leaderboard">("judges");
  const [expandedJudge, setExpandedJudge] = useState<string | null>(null);
  const [confirmGenerate, setConfirmGenerate] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState<{ judgeId: string; judgeName: string; currentStatus: string } | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<JudgeForm>();

  const { data: judges, isLoading: judgesLoading } = useQuery<any[]>({
    queryKey: ["admin-judges"],
    queryFn: () => api.get("/api/judges"),
  });

  const { data: matrixData, isLoading: matrixLoading } = useQuery<any>({
    queryKey: ["admin-judges-matrix"],
    queryFn: () => api.get("/api/judges/assignment-matrix"),
    enabled: activeTab === "matrix",
  });

  const { data: leaderboardData, isLoading: leaderboardLoading } = useQuery<any>({
    queryKey: ["admin-judges-leaderboard"],
    queryFn: () => api.get("/api/judges/leaderboard"),
    enabled: activeTab === "leaderboard",
  });

  const addJudgeMutation = useMutation({
    mutationFn: (data: JudgeForm) => api.post("/api/judges/add", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-judges"] });
      reset();
      setShowForm(false);
    },
  });

  const removeJudgeMutation = useMutation({
    mutationFn: (judgeId: string) => api.post("/api/judges/remove", { judgeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-judges"] });
      setConfirmToggle(null);
    },
  });

  const activateJudgeMutation = useMutation({
    mutationFn: (judgeId: string) => api.post("/api/judges/activate", { judgeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-judges"] });
      setConfirmToggle(null);
    },
  });

  const generatePhase1Mutation = useMutation({
    mutationFn: () => api.post<any>("/api/judges/generate-phase-1"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-judges"] });
      queryClient.invalidateQueries({ queryKey: ["admin-judges-matrix"] });
      setConfirmGenerate(false);
    },
  });

  const onSubmit = (data: JudgeForm) => addJudgeMutation.mutate(data);

  const progress = leaderboardData?.progress;
  const isToggling = removeJudgeMutation.isPending || activateJudgeMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-6 border-b border-border flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary">Judge Panel</h1>
          <p className="text-xs text-text-secondary mt-1">
            Manage judges, generate assignments, and track scoring progress.
          </p>
        </div>
        <div className="flex gap-2">
          <NeonButton
            onClick={() => setConfirmGenerate(true)}
            disabled={generatePhase1Mutation.isPending}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", generatePhase1Mutation.isPending && "animate-spin")} />
            {generatePhase1Mutation.isPending ? "Generating..." : "Generate Phase 1"}
          </NeonButton>
          <NeonButton onClick={() => setShowForm(!showForm)} variant="secondary" className="flex items-center gap-2">
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Cancel" : "Add Judge"}
          </NeonButton>
        </div>
      </div>

      {/* Generate result */}
      {generatePhase1Mutation.data && (
        <GlassPanel className="border-green-900/40 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <p className="text-sm font-bold text-green-400">Phase 1 Generated Successfully</p>
          </div>
          <p className="text-xs text-text-secondary">{generatePhase1Mutation.data.message}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            {generatePhase1Mutation.data.data?.judges?.map((j: any) => (
              <div key={j.judgeId} className="p-3 rounded bg-bg-surface border border-border/40 text-xs">
                <p className="font-bold text-text-primary">{j.judgeName}</p>
                <p className="text-brand-primary font-mono mt-1">{j.assignedCount} teams assigned</p>
              </div>
            ))}
          </div>
        </GlassPanel>
      )}

      {/* Add Judge Form */}
      {showForm && (
        <GlassPanel className="space-y-4 max-w-md">
          <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
            <Gavel className="w-4 h-4 text-brand-primary" /> Register New Judge
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-text-secondary uppercase block mb-1">Full Name</label>
              <input
                {...register("fullName", { required: "Required" })}
                className="w-full px-3 py-2 rounded bg-bg-surface border border-border text-xs text-text-primary focus:outline-none focus:border-brand-primary"
                placeholder="Dr. Budi Santoso"
              />
              {errors.fullName && <p className="text-[10px] text-red-400 mt-0.5">{errors.fullName.message}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary uppercase block mb-1">Email Address</label>
              <input
                {...register("email", { required: "Required" })}
                type="email"
                className="w-full px-3 py-2 rounded bg-bg-surface border border-border text-xs text-text-primary focus:outline-none focus:border-brand-primary"
                placeholder="judge@university.ac.id"
              />
              {errors.email && <p className="text-[10px] text-red-400 mt-0.5">{errors.email.message}</p>}
            </div>
            <NeonButton type="submit" disabled={addJudgeMutation.isPending} className="w-full">
              {addJudgeMutation.isPending ? "Adding..." : "Add to Panel"}
            </NeonButton>
          </form>
        </GlassPanel>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(["judges", "matrix", "leaderboard"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 -mb-px",
              activeTab === tab
                ? "text-brand-primary border-brand-primary"
                : "text-text-muted border-transparent hover:text-text-secondary"
            )}
          >
            {tab === "judges" && "Judges"}
            {tab === "matrix" && "Assignment Matrix"}
            {tab === "leaderboard" && "Leaderboard"}
          </button>
        ))}
      </div>

      {/* Tab: Judges */}
      {activeTab === "judges" && (
        <div>
          {judgesLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : judges && judges.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {judges.map((judge: any) => {
                const isActive = judge.status === "ACTIVE";
                return (
                  <GlassPanel key={judge.id} className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full border flex items-center justify-center text-sm font-bold",
                          isActive
                            ? "bg-bg-surface border-border text-brand-primary"
                            : "bg-red-950/20 border-red-900/30 text-red-400"
                        )}>
                          {judge.user?.fullName?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className={cn("font-bold text-sm", isActive ? "text-text-primary" : "text-text-muted line-through")}>
                            {judge.user?.fullName}
                          </p>
                          <p className="text-[10px] text-text-muted">{judge.user?.email}</p>
                        </div>
                      </div>
                      <JudgeStatusBadge status={judge.status} />
                    </div>
                    <div className="flex items-center gap-4 text-[10px]">
                      <span className="text-text-muted">
                        Assigned: <strong className="text-brand-primary font-mono">{judge.assignedTeamCount ?? 0}</strong>
                      </span>
                      <span className="text-text-muted">
                        Scored: <strong className="text-green-400 font-mono">{judge.scoredCount ?? 0}</strong>
                      </span>
                    </div>
                    <button
                      onClick={() => setConfirmToggle({
                        judgeId: judge.id,
                        judgeName: judge.user?.fullName || "Unknown",
                        currentStatus: judge.status,
                      })}
                      className={cn(
                        "w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-colors border",
                        isActive
                          ? "border-red-900/40 text-red-400 hover:bg-red-950/20"
                          : "border-green-900/40 text-green-400 hover:bg-green-950/20"
                      )}
                    >
                      {isActive ? (
                        <><UserX className="w-3.5 h-3.5" /> Deactivate</>
                      ) : (
                        <><UserCheck className="w-3.5 h-3.5" /> Activate</>
                      )}
                    </button>
                  </GlassPanel>
                );
              })}
            </div>
          ) : (
            <GlassPanel className="text-center py-14 space-y-3">
              <Gavel className="w-10 h-10 text-brand-primary mx-auto" />
              <p className="text-sm font-bold text-text-primary">No Judges Registered</p>
              <p className="text-xs text-text-muted">Add judges above, then generate Phase 1 assignments.</p>
            </GlassPanel>
          )}
        </div>
      )}

      {/* Tab: Assignment Matrix */}
      {activeTab === "matrix" && (
        <div>
          {matrixLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : matrixData ? (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {matrixData.judges?.map((j: any) => (
                  <GlassPanel key={j.judgeId} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm text-text-primary">{j.judgeName}</p>
                        <p className="text-[10px] text-text-muted">{j.judgeEmail}</p>
                      </div>
                      <button
                        onClick={() => setExpandedJudge(expandedJudge === j.judgeId ? null : j.judgeId)}
                        className="p-1.5 rounded hover:bg-bg-surface transition text-text-muted"
                      >
                        {expandedJudge === j.judgeId ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-text-muted">
                        Assigned: <strong className="text-brand-primary font-mono">{j.assignedCount}</strong>
                      </span>
                      <span className="text-text-muted">
                        Scored: <strong className="text-green-400 font-mono">{j.scoredCount}</strong>
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-bg-surface overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-primary transition-all"
                        style={{ width: `${j.assignedCount ? (j.scoredCount / j.assignedCount) * 100 : 0}%` }}
                      />
                    </div>
                  </GlassPanel>
                ))}
              </div>

              <GlassPanel className="overflow-hidden">
                <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-text-primary">Team Assignment Status</h3>
                  <span className="text-[10px] text-text-muted">{matrixData.teams?.length ?? 0} teams</span>
                </div>
                <div className="divide-y divide-border/30 max-h-[60vh] overflow-y-auto">
                  {matrixData.teams?.map((t: any) => (
                    <div key={t.teamId} className="px-4 py-3 flex items-center justify-between text-xs hover:bg-bg-surface/30">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[10px] font-mono text-text-muted w-8 shrink-0">#{t.rank}</span>
                        <span className="text-[10px] font-bold text-brand-primary bg-brand-dim px-1.5 py-0.5 rounded shrink-0">{t.teamCode}</span>
                        <span className="font-semibold text-text-primary truncate">{t.teamName}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex gap-1">
                          {t.judges?.map((j: any) => (
                            <span
                              key={j.judgeId}
                              className={cn(
                                "text-[9px] font-bold px-1.5 py-0.5 rounded",
                                j.hasScored
                                  ? "bg-green-950/40 text-green-400 border border-green-900/50"
                                  : "bg-bg-surface text-text-muted border border-border"
                              )}
                              title={`${j.judgeName}: ${j.hasScored ? `Scored (${j.finalScore})` : "Pending"}`}
                            >
                              {j.judgeName?.split(" ")[0]} {j.hasScored ? "✓" : "…"}
                            </span>
                          ))}
                        </div>
                        <span className="text-[10px] text-text-muted w-6 text-right">{t.scoreCount}/{t.judgeCount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassPanel>
            </div>
          ) : (
            <GlassPanel className="text-center py-14 space-y-3">
              <Users className="w-10 h-10 text-brand-primary mx-auto" />
              <p className="text-sm font-bold text-text-primary">No Assignments Yet</p>
              <p className="text-xs text-text-muted">Click "Generate Phase 1" to auto-assign judges to teams.</p>
            </GlassPanel>
          )}
        </div>
      )}

      {/* Tab: Leaderboard */}
      {activeTab === "leaderboard" && (
        <div>
          {leaderboardLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-3 gap-4">
                <GlassPanel className="space-y-2">
                  <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Total Assignments</p>
                  <p className="text-2xl font-extrabold font-mono text-brand-primary">{progress?.totalAssignments ?? 0}</p>
                </GlassPanel>
                <GlassPanel className="space-y-2">
                  <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Scores Submitted</p>
                  <p className="text-2xl font-extrabold font-mono text-green-400">{progress?.totalScores ?? 0}</p>
                </GlassPanel>
                <GlassPanel className="space-y-2">
                  <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Progress</p>
                  <div className="flex items-center gap-3">
                    <p className="text-2xl font-extrabold font-mono text-text-primary">{progress?.percentage ?? 0}%</p>
                    <div className="flex-1 h-2 rounded-full bg-bg-surface overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-primary transition-all"
                        style={{ width: `${progress?.percentage ?? 0}%` }}
                      />
                    </div>
                  </div>
                </GlassPanel>
              </div>

              <GlassPanel className="overflow-hidden">
                <div className="px-4 py-3 border-b border-border/40">
                  <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-brand-primary" />
                    Team Rankings
                  </h3>
                </div>
                <div className="divide-y divide-border/30 max-h-[60vh] overflow-y-auto">
                  {leaderboardData?.leaderboard && leaderboardData.leaderboard.length > 0 ? (
                    leaderboardData.leaderboard.map((row: any, idx: number) => (
                      <div key={row.team_id} className="px-4 py-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                            idx < 3 ? "bg-brand-dim text-brand-primary border border-brand-primary/30" : "bg-bg-surface text-text-muted border border-border"
                          )}>
                            {idx + 1}
                          </span>
                          <span className="text-[10px] font-bold text-brand-primary bg-brand-dim px-1.5 py-0.5 rounded shrink-0">{row.team_code}</span>
                          <span className="font-semibold text-text-primary truncate">{row.team_name}</span>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <span className="text-[10px] text-text-muted">{row.category}</span>
                          <span className="text-[10px] text-text-muted">{row.judge_count} judge{row.judge_count !== 1 ? "s" : ""}</span>
                          <span className={cn(
                            "font-mono font-bold text-sm",
                            row.average_score >= 70 ? "text-green-400" : row.average_score >= 50 ? "text-amber-400" : "text-red-400"
                          )}>
                            {Number(row.average_score).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-xs text-text-muted">
                      No scores submitted yet. Waiting for judges to evaluate teams.
                    </div>
                  )}
                </div>
              </GlassPanel>
            </div>
          )}
        </div>
      )}

      {/* ── Generate Phase 1 Confirmation Modal ── */}
      {confirmGenerate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setConfirmGenerate(false)}>
          <div className="w-full max-w-md mx-4 rounded-xl border border-brand-primary/40 bg-bg-secondary shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-950/60 border border-amber-900/50 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-text-primary">Generate Phase 1 Judging?</h3>
                  <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Cross-judging assignment</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-bg-surface border border-border/60 space-y-2">
                <p className="text-xs text-text-secondary leading-relaxed">
                  This will auto-assign judges to all teams using the <strong className="text-brand-primary">cross-judging algorithm</strong>.
                </p>
                <ul className="text-[10px] text-text-muted space-y-1 ml-3 list-disc">
                  <li>Each team will be evaluated by <strong className="text-text-primary">exactly 2 judges</strong></li>
                  <li>Workload distributed evenly across all active judges</li>
                  <li>Existing assignments will be <strong className="text-red-400">cleared and regenerated</strong></li>
                </ul>
              </div>
              <div className="flex gap-3 pt-1">
                <NeonButton onClick={() => setConfirmGenerate(false)} variant="secondary" size="sm" className="flex-1">Cancel</NeonButton>
                <NeonButton
                  onClick={() => generatePhase1Mutation.mutate()}
                  disabled={generatePhase1Mutation.isPending}
                  variant="primary"
                  size="sm"
                  className="flex-1"
                >
                  {generatePhase1Mutation.isPending ? (
                    <><div className="w-4 h-4 border-2 border-bg-primary border-t-transparent rounded-full animate-spin mr-1.5" /> Generating...</>
                  ) : (
                    <><RefreshCw className="w-4 h-4 mr-1.5" /> Generate Now</>
                  )}
                </NeonButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toggle Judge Status Confirmation Modal ── */}
      {confirmToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => !isToggling && setConfirmToggle(null)}>
          <div className="w-full max-w-md mx-4 rounded-xl border border-border/40 bg-bg-secondary shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  confirmToggle.currentStatus === "ACTIVE"
                    ? "bg-red-950/60 border border-red-900/50"
                    : "bg-green-950/60 border border-green-900/50"
                )}>
                  {confirmToggle.currentStatus === "ACTIVE" ? (
                    <UserX className="w-5 h-5 text-red-400" />
                  ) : (
                    <UserCheck className="w-5 h-5 text-green-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-text-primary">
                    {confirmToggle.currentStatus === "ACTIVE" ? "Deactivate Judge?" : "Activate Judge?"}
                  </h3>
                  <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">
                    {confirmToggle.currentStatus === "ACTIVE" ? "Revoke scoring access" : "Grant scoring access"}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-bg-surface border border-border/60 space-y-1.5">
                <p className="text-sm font-bold text-text-primary">{confirmToggle.judgeName}</p>
                <p className="text-[10px] text-text-muted">
                  {confirmToggle.currentStatus === "ACTIVE"
                    ? "This judge will lose access to the scoring portal. Existing scores will be preserved."
                    : "This judge will regain access to the scoring portal and their assigned teams."}
                </p>
              </div>

              {(removeJudgeMutation.isError || activateJudgeMutation.isError) && (
                <div className="p-3 rounded bg-red-950/30 border border-red-900/40 text-red-400 text-xs">
                  {(removeJudgeMutation.error as any)?.message || (activateJudgeMutation.error as any)?.message || "An error occurred. Please try again."}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <NeonButton onClick={() => setConfirmToggle(null)} variant="secondary" size="sm" className="flex-1" disabled={isToggling}>
                  Cancel
                </NeonButton>
                <NeonButton
                  onClick={() => {
                    if (confirmToggle.currentStatus === "ACTIVE") {
                      removeJudgeMutation.mutate(confirmToggle.judgeId);
                    } else {
                      activateJudgeMutation.mutate(confirmToggle.judgeId);
                    }
                  }}
                  disabled={isToggling}
                  variant={confirmToggle.currentStatus === "ACTIVE" ? "destructive" : "primary"}
                  size="sm"
                  className="flex-1"
                >
                  {isToggling ? (
                    <><div className="w-4 h-4 border-2 border-bg-primary border-t-transparent rounded-full animate-spin mr-1.5" /> Processing...</>
                  ) : confirmToggle.currentStatus === "ACTIVE" ? (
                    <><UserX className="w-4 h-4 mr-1.5" /> Yes, Deactivate</>
                  ) : (
                    <><UserCheck className="w-4 h-4 mr-1.5" /> Yes, Activate</>
                  )}
                </NeonButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
