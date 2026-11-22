import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import {
  Clock3,
  FileText,
  ExternalLink,
  Users,
  Search,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Github,
  Globe,
  Presentation,
  Star,
  Filter,
  RefreshCw,
  BarChart3,
  Layers,
  FolderGit2,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────────────────────

function DeliverableDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${
        ok
          ? "text-green-400 bg-green-950/40 border-green-800/40"
          : "text-red-400 bg-red-950/30 border-red-800/30 opacity-60"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-green-400" : "bg-red-400"}`} />
      {label}
    </span>
  );
}

const categoryColor: Record<string, string> = {
  NATIONAL: "text-sky-300 bg-sky-950/60 border-sky-700/40",
  MIX: "text-violet-300 bg-violet-950/60 border-violet-700/40",
  INTERNATIONAL: "text-amber-300 bg-amber-950/60 border-amber-700/40",
};

// ─── Team Card ───────────────────────────────────────────────────────────────

function TeamCard({ a, idx, isPhase2 }: { a: any; idx: number; isPhase2: boolean }) {
  const team = a.team || {};
  const proposal = team.proposal || {};
  const submission = team.submission || null;
  const score = a.score;
  const isScored = !!score;

  const hasRepo = !!submission?.repositoryUrl;
  const hasDemo = !!submission?.deploymentUrl;
  const hasSlide = !!submission?.slideFilename;
  const deliverableCount = (hasRepo ? 1 : 0) + (hasDemo ? 1 : 0) + (hasSlide ? 1 : 0);

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-200"
      style={{
        background: isScored ? "rgba(74,222,128,0.03)" : "rgba(255,255,255,0.025)",
        border: `1px solid ${isScored ? "rgba(74,222,128,0.14)" : "rgba(255,255,255,0.07)"}`,
      }}
    >
      {/* ── Main Row ── */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Index */}
        <div className="text-[11px] font-mono text-text-muted/50 font-bold w-6 shrink-0 text-center">
          {idx + 1}
        </div>

        {/* Team / Project info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
            <span
              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
              style={{
                background: "rgba(0,245,200,0.08)",
                border: "1px solid rgba(0,245,200,0.2)",
                color: "#00f5c8",
              }}
            >
              {team.teamCode}
            </span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                categoryColor[team.category] || "text-text-muted bg-bg-surface border-border"
              }`}
            >
              {team.category || "NATIONAL"}
            </span>
            {isPhase2 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border text-amber-400 bg-amber-950/30 border-amber-700/40">
                PHASE 2
              </span>
            )}
          </div>
          <p className="text-sm font-bold text-text-primary truncate">{team.teamName}</p>
          {proposal.title && (
            <p className="text-[10px] text-text-muted truncate mt-0.5">
              <FileText className="w-2.5 h-2.5 inline mr-1 opacity-50" />
              {proposal.title}
            </p>
          )}
        </div>

        {/* Phase 2 deliverable summary + quick links (desktop) */}
        {isPhase2 && submission && (
          <div className="hidden md:flex flex-col gap-1 shrink-0 w-40">
            <div className="flex items-center gap-1">
              <DeliverableDot ok={hasRepo} label="Repo" />
              <DeliverableDot ok={hasDemo} label="Demo" />
              <DeliverableDot ok={hasSlide} label="Slide" />
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {hasRepo && (
                <a
                  href={submission.repositoryUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-400 hover:text-purple-300 transition"
                  title="Open Repository"
                >
                  <Github className="w-3 h-3" />
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </a>
              )}
              {hasDemo && (
                <a
                  href={submission.deploymentUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 transition"
                  title="Open Live Demo"
                >
                  <Globe className="w-3 h-3" />
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </a>
              )}
              {hasSlide && (
                <Link
                  to={`/judge/scoring/${team.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-yellow-400 hover:text-yellow-300 transition"
                  title="View slide in Scoring"
                >
                  <Presentation className="w-3 h-3" />
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Leader (desktop only) */}
        <div className="hidden lg:block min-w-0 w-32 shrink-0">
          {team.leaderName && (
            <>
              <p className="text-[11px] font-semibold text-text-primary truncate">{team.leaderName}</p>
              <p className="text-[10px] text-text-muted">
                <Users className="w-2.5 h-2.5 inline mr-0.5" />
                {team.memberCount || 1} member{(team.memberCount || 1) > 1 ? "s" : ""}
              </p>
            </>
          )}
        </div>

        {/* Score */}
        <div className="shrink-0 w-24 text-right">
          {isScored ? (
            <div>
              <p className="text-sm font-bold font-mono" style={{ color: "#00f5c8" }}>
                {Number(score.finalScore).toFixed(1)}
                <span className="text-[10px] text-text-muted font-normal"> / 100</span>
              </p>
              <div className="flex gap-0.5 mt-1 justify-end">
                {["technicalScore", "problemScore", "innovationScore", "marketScore", "documentScore"].map(
                  (key) => {
                    const val = Number(score[key]) || 0;
                    return (
                      <div
                        key={key}
                        className="h-1 w-4 rounded-sm overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.08)" }}
                      >
                        <div
                          className="h-full rounded-sm"
                          style={{
                            width: `${Math.min(100, val)}%`,
                            background: val >= 70 ? "#4ade80" : val >= 40 ? "#facc15" : "#f87171",
                          }}
                        />
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          ) : (
            <span className="text-[10px] text-yellow-400 flex items-center gap-1 font-semibold justify-end">
              <Clock3 className="w-3 h-3" /> Pending
            </span>
          )}
        </div>

        {/* Score CTA */}
        <Link
          to={`/judge/scoring/${team.id}`}
          className="shrink-0 flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded transition-all"
          style={{
            background: isScored ? "rgba(74,222,128,0.1)" : "rgba(0,245,200,0.1)",
            border: `1px solid ${isScored ? "rgba(74,222,128,0.3)" : "rgba(0,245,200,0.25)"}`,
            color: isScored ? "#4ade80" : "#00f5c8",
          }}
        >
          <Sparkles className="w-3 h-3" />
          {isScored ? "Review" : "Score"}
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Mobile deliverable row for phase 2 */}
      {isPhase2 && submission && (
        <div
          className="flex md:hidden items-center gap-2 px-4 pb-2.5 pt-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          <DeliverableDot ok={hasRepo} label="Repo" />
          <DeliverableDot ok={hasDemo} label="Demo" />
          <DeliverableDot ok={hasSlide} label="Slide" />
          <span className="ml-auto text-[9px] text-text-muted font-mono">
            {deliverableCount}/3 deliverables
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function JudgeTeams() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "SCORED">("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  const { data, isLoading, refetch, isFetching } = useQuery<any>({
    queryKey: ["judge-assignments"],
    queryFn: () => api.get("/api/judges/my-assignments"),
    refetchInterval: 30_000,
  });

  const isPhase2 =
    data?.phase === "PHASE2_JUDGING" ||
    data?.phase === "PHASE2_SUBMISSION" ||
    data?.phase === "PHASE2_CLOSED";

  const rawAssignments: any[] = data?.assignments ?? [];

  const assignments = rawAssignments.filter((a) => {
    const team = a.team || {};
    const prop = team.proposal || {};
    const q = searchTerm.toLowerCase();
    const searchMatch =
      !searchTerm ||
      team.teamName?.toLowerCase().includes(q) ||
      team.teamCode?.toLowerCase().includes(q) ||
      prop.title?.toLowerCase().includes(q) ||
      team.leaderName?.toLowerCase().includes(q);
    const isScored = !!a.score;
    const statusMatch =
      filterStatus === "ALL" ||
      (filterStatus === "SCORED" && isScored) ||
      (filterStatus === "PENDING" && !isScored);
    const categoryMatch = filterCategory === "ALL" || team.category === filterCategory;
    return searchMatch && statusMatch && categoryMatch;
  });

  const totalCount = rawAssignments.length;
  const scoredCount = rawAssignments.filter((a) => a.score).length;
  const pendingCount = totalCount - scoredCount;
  const completionPct = totalCount > 0 ? Math.round((scoredCount / totalCount) * 100) : 0;
  const hasFilters = searchTerm !== "" || filterStatus !== "ALL" || filterCategory !== "ALL";

  return (
    <div className="w-full max-w-none px-0 pb-16" style={{ minHeight: "100vh" }}>
      {/* ── Sticky Header ── */}
      <div
        className="sticky top-0 z-20 flex flex-col"
        style={{
          background: "rgba(0,0,0,0.80)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,245,200,0.09)",
        }}
      >
        {/* Title row */}
        <div className="flex items-center justify-between px-6 py-3 gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-brand-primary uppercase tracking-widest opacity-80">
              <ShieldCheck className="w-3.5 h-3.5" /> Judge Panel
            </span>
            <span className="text-border">│</span>
            <h1 className="text-base font-bold text-text-primary tracking-tight">
              {isPhase2 ? "Phase 2 — Final Judging" : "Phase 1 — Proposal Review"}
            </h1>
            <span
              className="text-[11px] font-mono font-bold px-2 py-0.5 rounded"
              style={{
                background: "rgba(0,245,200,0.08)",
                border: "1px solid rgba(0,245,200,0.2)",
                color: "#00f5c8",
              }}
            >
              {totalCount} TEAMS
            </span>
            {isPhase2 ? (
              <span className="text-xs font-bold text-amber-400 bg-amber-950/40 border border-amber-700/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3" /> Final Deliverables
              </span>
            ) : (
              <span className="text-xs font-bold text-brand-primary bg-brand-dim border border-brand-primary/20 px-2 py-0.5 rounded-full">
                Proposal Review
              </span>
            )}
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-1.5 rounded text-text-muted hover:text-text-primary transition disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-brand-primary" : ""}`} />
          </button>
        </div>

        {/* Progress + Filters */}
        <div
          className="flex flex-wrap items-center gap-4 px-6 py-2 border-t"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}
        >
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="flex-1 max-w-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
                  Scoring Progress
                </span>
                <span className="text-[10px] font-mono font-bold text-brand-primary">
                  {completionPct}%
                </span>
              </div>
              <div className="h-1 rounded-full w-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${completionPct}%`,
                    background: "linear-gradient(90deg, #00f5c8, #00ddb5)",
                    boxShadow: "0 0 8px rgba(0,245,200,0.4)",
                  }}
                />
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono shrink-0">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" />
                <span className="text-green-400 font-bold">{scoredCount}</span>
                <span className="text-text-muted">Scored</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.5)]" />
                <span className="text-yellow-400 font-bold">{pendingCount}</span>
                <span className="text-text-muted">Pending</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search team, project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-[11px] rounded border focus:outline-none focus:border-brand-primary/50 transition-colors"
                style={{
                  width: "180px",
                  background: "rgba(255,255,255,0.04)",
                  borderColor: "rgba(255,255,255,0.08)",
                  color: "#fff",
                }}
              />
            </div>

            <div
              className="flex items-center text-[10px] font-bold rounded border overflow-hidden"
              style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}
            >
              {(["ALL", "PENDING", "SCORED"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className="px-3 py-1.5 transition-all"
                  style={{
                    background:
                      filterStatus === s
                        ? s === "SCORED"
                          ? "rgba(74,222,128,0.15)"
                          : s === "PENDING"
                          ? "rgba(250,204,21,0.15)"
                          : "rgba(0,245,200,0.12)"
                        : "transparent",
                    color:
                      filterStatus === s
                        ? s === "SCORED"
                          ? "#4ade80"
                          : s === "PENDING"
                          ? "#facc15"
                          : "#00f5c8"
                        : "rgba(255,255,255,0.4)",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-[10px] font-bold py-1.5 px-2.5 rounded border focus:outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                borderColor: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              <option value="ALL">ALL CATEGORIES</option>
              <option value="NATIONAL">NATIONAL</option>
              <option value="MIX">MIX</option>
              <option value="INTERNATIONAL">INTERNATIONAL</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="px-6 pt-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div
              className="w-7 h-7 rounded-full border-2 animate-spin"
              style={{ borderColor: "rgba(0,245,200,0.2)", borderTopColor: "#00f5c8" }}
            />
            <span className="text-xs text-text-muted font-mono">Loading assignments...</span>
          </div>
        ) : rawAssignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(0,245,200,0.05)", border: "1px solid rgba(0,245,200,0.12)" }}
            >
              {isPhase2 ? (
                <FolderGit2 className="w-10 h-10 text-brand-primary/60" />
              ) : (
                <Layers className="w-10 h-10 text-text-muted" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-text-primary">
                {isPhase2 ? "No submitted teams assigned yet" : "No teams assigned yet"}
              </p>
              <p className="text-xs text-text-muted max-w-xs">
                {isPhase2
                  ? "You will only see teams that have submitted all Phase 2 deliverables. Check back after the submission window closes."
                  : "The admin will assign teams to you before judging begins."}
              </p>
            </div>
          </div>
        ) : assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
            <Filter className="w-8 h-8 text-text-muted opacity-50" />
            <p className="text-sm font-bold text-text-primary">No Teams Match</p>
            <p className="text-xs text-text-muted max-w-xs">
              Adjust your search or filter criteria.
            </p>
            {hasFilters && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterStatus("ALL");
                  setFilterCategory("ALL");
                }}
                className="mt-1 px-4 py-1.5 rounded-lg text-xs font-bold"
                style={{
                  background: "rgba(0,245,200,0.08)",
                  border: "1px solid rgba(0,245,200,0.2)",
                  color: "#00f5c8",
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Phase 2 info banner */}
            {isPhase2 && (
              <div
                className="mb-4 px-4 py-3 rounded-xl flex items-start gap-3 text-xs"
                style={{
                  background: "rgba(245,158,11,0.06)",
                  border: "1px solid rgba(245,158,11,0.18)",
                }}
              >
                <Star className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-amber-400">Phase 2 — Final Deliverables Judging</p>
                  <p className="text-text-muted leading-relaxed">
                    You are only seeing teams that have already submitted their deliverables. Click{" "}
                    <strong className="text-amber-300">Score</strong> to open the full scoring workspace, review the
                    repository, demo, and presentation slides, then submit your evaluation.
                  </p>
                </div>
              </div>
            )}

            {/* Column headers */}
            <div
              className="flex items-center gap-3 px-4 py-2 mb-1 text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted select-none"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
            >
              <span className="w-6 shrink-0">#</span>
              <span className="flex-1">Team / Project</span>
              {isPhase2 && (
                <span className="hidden md:flex items-center gap-1 w-40 shrink-0">
                  <FolderGit2 className="w-3 h-3" /> Deliverables
                </span>
              )}
              <span className="hidden lg:block w-32 shrink-0">Leader</span>
              <span className="flex items-center gap-1 w-24 shrink-0 justify-end">
                <BarChart3 className="w-3 h-3" /> Score
              </span>
              <span className="shrink-0">Action</span>
            </div>

            {/* Team list */}
            <div className="flex flex-col gap-1.5">
              {assignments.map((a: any, idx: number) => (
                <TeamCard key={a.id} a={a} idx={idx} isPhase2={isPhase2} />
              ))}
            </div>

            {/* Footer */}
            <div
              className="mt-4 py-3 px-4 flex items-center justify-between text-[10px] font-mono text-text-muted border-t"
              style={{ borderColor: "rgba(255,255,255,0.05)" }}
            >
              <span>
                Showing <strong className="text-text-secondary">{assignments.length}</strong> of{" "}
                <strong className="text-text-secondary">{totalCount}</strong> assigned teams
              </span>
              <span className="flex items-center gap-1.5">
                <Filter className="w-3 h-3" />
                {filterStatus !== "ALL" && <span>Status: {filterStatus}</span>}
                {filterCategory !== "ALL" && <span>· {filterCategory}</span>}
                {searchTerm && <span>· "{searchTerm}"</span>}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
