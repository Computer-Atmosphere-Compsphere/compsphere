import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, getUploadUrl } from "@/lib/api";
import { Link } from "react-router-dom";
import {
  Clock3,
  FileText,
  ExternalLink,
  Users,
  Trophy,
  Search,
  ShieldCheck,
  Layers,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  LayoutList,
  BarChart3,
  Filter,
  Github,
  Globe,
  Presentation,
  ChevronDown,
  ChevronUp,
  Star,
} from "lucide-react";

function SubmissionBadge({ has, label }: { has: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${
        has
          ? "text-green-400 bg-green-950/40 border-green-800/40"
          : "text-text-muted bg-bg-surface border-border/40 opacity-50"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${has ? "bg-green-400" : "bg-text-muted"}`} />
      {label}
    </span>
  );
}

function TeamCard({ a, idx, isPhase2 }: { a: any; idx: number; isPhase2: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const team = a.team || {};
  const proposal = team.proposal || {};
  const submission = team.submission || null;
  const proposalFile = proposal.files?.[0];
  const pdfUrl = proposalFile ? getUploadUrl(proposalFile.storageKey) : null;
  const score = a.score;
  const isScored = !!score;

  const categoryBadge: Record<string, string> = {
    NATIONAL: "text-sky-300 bg-sky-950/60 border-sky-700/40",
    MIX: "text-violet-300 bg-violet-950/60 border-violet-700/40",
    INTERNATIONAL: "text-amber-300 bg-amber-950/60 border-amber-700/40",
  };

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-200"
      style={{
        background: isScored
          ? "rgba(74,222,128,0.03)"
          : "rgba(255,255,255,0.025)",
        border: `1px solid ${isScored ? "rgba(74,222,128,0.14)" : "rgba(255,255,255,0.07)"}`,
      }}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Index */}
        <div className="text-[11px] font-mono text-text-muted/50 font-bold w-6 shrink-0 text-center">
          {idx + 1}
        </div>

        {/* Team info */}
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
                categoryBadge[team.category] || "text-text-muted bg-bg-surface border-border"
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

        {/* Leader */}
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

        {/* Phase 2 submission indicators */}
        {isPhase2 && (
          <div className="hidden md:flex items-center gap-1 shrink-0">
            <SubmissionBadge has={!!submission?.repositoryUrl} label="Repo" />
            <SubmissionBadge has={!!submission?.deploymentUrl} label="Demo" />
            <SubmissionBadge has={!!submission?.slideFilename} label="Slide" />
          </div>
        )}

        {/* Score */}
        <div className="shrink-0 w-24 text-right">
          {isScored ? (
            <div>
              <p className="text-sm font-bold font-mono" style={{ color: "#00f5c8" }}>
                {Number(score.finalScore).toFixed(1)}
                <span className="text-[10px] text-text-muted font-normal"> / 100</span>
              </p>
              <div className="flex gap-0.5 mt-1 justify-end">
                {[
                  { key: "technicalScore" },
                  { key: "problemScore" },
                  { key: "innovationScore" },
                  { key: "marketScore" },
                  { key: "documentScore" },
                ].map(({ key }) => {
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
                })}
              </div>
            </div>
          ) : (
            <span className="text-[10px] text-yellow-400 flex items-center gap-1 font-semibold justify-end">
              <Clock3 className="w-3 h-3" /> Pending
            </span>
          )}
        </div>

        {/* Expand toggle (phase 2 only) */}
        {isPhase2 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 p-1.5 rounded hover:bg-white/5 transition text-text-muted hover:text-text-primary"
            title={expanded ? "Collapse details" : "Expand submission details"}
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}

        {/* Action */}
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
          {isScored ? "Review" : "Evaluate"}
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Phase 2 expanded submission details */}
      {isPhase2 && expanded && (
        <div
          className="px-4 pb-4 pt-0 border-t"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}
        >
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Proposal */}
            <div
              className="p-3 rounded-lg space-y-1.5"
              style={{ background: "rgba(0,245,200,0.04)", border: "1px solid rgba(0,245,200,0.1)" }}
            >
              <p className="text-[9px] font-bold uppercase tracking-widest text-brand-primary">
                Proposal
              </p>
              {pdfUrl ? (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{proposalFile?.originalFilename || "proposal.pdf"}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              ) : (
                <span className="text-[10px] text-yellow-500 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> No PDF uploaded
                </span>
              )}
            </div>

            {/* Submission links */}
            <div
              className="p-3 rounded-lg space-y-1.5"
              style={{ background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.15)" }}
            >
              <p className="text-[9px] font-bold uppercase tracking-widest text-purple-400">
                Phase 2 Links
              </p>
              {submission?.repositoryUrl ? (
                <a
                  href={submission.repositoryUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Github className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Repository</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              ) : (
                <span className="text-[10px] text-text-muted opacity-50">No repository</span>
              )}
              {submission?.deploymentUrl ? (
                <a
                  href={submission.deploymentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-green-400 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Live Demo</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              ) : (
                <span className="text-[10px] text-text-muted opacity-50">No demo link</span>
              )}
            </div>

            {/* Slide */}
            <div
              className="p-3 rounded-lg space-y-1.5"
              style={{ background: "rgba(250,204,21,0.04)", border: "1px solid rgba(250,204,21,0.12)" }}
            >
              <p className="text-[9px] font-bold uppercase tracking-widest text-yellow-400">
                Presentation Slide
              </p>
              {submission?.slideFilename ? (
                <>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-yellow-300">
                    <Presentation className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{submission.slideFilename}</span>
                  </div>
                  {submission.slideSizeBytes && (
                    <p className="text-[9px] text-text-muted">
                      {(submission.slideSizeBytes / (1024 * 1024)).toFixed(1)} MB
                      {submission.submittedAt && ` · ${new Date(submission.submittedAt).toLocaleDateString("id-ID")}`}
                    </p>
                  )}
                  <Link
                    to={`/judge/scoring/${team.id}`}
                    className="text-[10px] font-bold text-yellow-400 hover:underline flex items-center gap-1 mt-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View slide in Scoring →
                  </Link>
                </>
              ) : (
                <span className="text-[10px] text-text-muted opacity-50">No slide uploaded</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function JudgeTeams() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "SCORED">("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  const { data, isLoading } = useQuery<any>({
    queryKey: ["judge-assignments"],
    queryFn: () => api.get("/api/judges/my-assignments"),
  });

  const isPhase2 = data?.phase === "PHASE2_JUDGING";
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

  return (
    <div className="w-full max-w-none px-0 pb-16" style={{ minHeight: "100vh" }}>
      {/* ── TOP COMMAND BAR ── */}
      <div
        className="sticky top-0 z-20 flex flex-col gap-0"
        style={{
          background: "rgba(0,0,0,0.80)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,245,200,0.09)",
        }}
      >
        {/* Title Row */}
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-brand-primary uppercase tracking-widest opacity-80">
              <ShieldCheck className="w-3.5 h-3.5" /> Judge Evaluation Panel
            </span>
            <span className="text-border">│</span>
            <h1 className="text-base font-bold text-text-primary tracking-tight">
              Assigned Teams
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
                <Star className="w-3 h-3" /> Phase 2 — Final Judging
              </span>
            ) : (
              <span className="text-xs font-bold text-brand-primary bg-brand-dim border border-brand-primary/20 px-2 py-0.5 rounded-full">
                Phase 1 — Proposal Review
              </span>
            )}
          </div>
        </div>

        {/* Stats + Filters Row */}
        <div
          className="flex flex-wrap items-center gap-4 px-6 py-2 border-t"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}
        >
          {/* Progress */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="flex-1 max-w-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
                  Evaluation Progress
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

          {/* Filters */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search teams..."
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

      {/* ── MAIN CONTENT ── */}
      <div className="px-6 pt-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div
              className="w-7 h-7 rounded-full border-2 animate-spin"
              style={{ borderColor: "rgba(0,245,200,0.2)", borderTopColor: "#00f5c8" }}
            />
            <span className="text-xs text-text-muted font-mono">Loading assignments...</span>
          </div>
        ) : assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
            <Layers className="w-10 h-10 text-text-muted" />
            <p className="text-sm font-bold text-text-primary">No Teams Match</p>
            <p className="text-xs text-text-muted max-w-xs">
              Adjust your search or filter criteria to find assigned teams.
            </p>
          </div>
        ) : (
          <>
            {/* Phase 2 info banner */}
            {isPhase2 && (
              <div
                className="mb-3 px-4 py-2.5 rounded-xl flex items-center gap-3 text-xs"
                style={{
                  background: "rgba(245,158,11,0.07)",
                  border: "1px solid rgba(245,158,11,0.2)",
                }}
              >
                <Star className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold text-amber-400">Phase 2 — Final Judging Active.</span>
                  <span className="text-text-muted ml-1.5">
                    Click the ▼ chevron on each team to preview submission details (repo, demo, slide) before scoring.
                  </span>
                </div>
              </div>
            )}

            {/* Column headers */}
            <div
              className="flex items-center gap-3 px-4 py-2 mb-1 text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted select-none"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
            >
              <span className="w-6 shrink-0">#</span>
              <span className="flex-1 flex items-center gap-1.5">
                <LayoutList className="w-3 h-3" /> Team / Proposal
              </span>
              <span className="hidden lg:flex items-center gap-1.5 w-32 shrink-0">
                <Users className="w-3 h-3" /> Leader
              </span>
              {isPhase2 && (
                <span className="hidden md:flex items-center gap-1.5 w-24 shrink-0">
                  <Trophy className="w-3 h-3" /> Submission
                </span>
              )}
              <span className="flex items-center gap-1.5 w-24 shrink-0 justify-end">
                <BarChart3 className="w-3 h-3" /> Score
              </span>
              {isPhase2 && <span className="w-5 shrink-0" />}
              <span className="shrink-0">Action</span>
            </div>

            {/* Team cards */}
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
                {filterCategory !== "ALL" && <span>· Category: {filterCategory}</span>}
                {searchTerm && <span>· "{searchTerm}"</span>}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
