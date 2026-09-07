import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getUploadUrl } from "@/lib/api";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock3,
  FileText,
  ExternalLink,
  Users,
  Trophy,
  RefreshCw,
  Search,
  ArrowRight,
  ShieldCheck,
  Tag,
  Layers,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  LayoutList,
  BarChart3,
  Filter,
} from "lucide-react";

export function JudgeTeams() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "SCORED">("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const { data, isLoading } = useQuery<any>({
    queryKey: ["judge-assignments"],
    queryFn: () => api.get("/api/judges/my-assignments"),
  });

  const syncPdfMutation = useMutation({
    mutationFn: () => api.post("/api/judges/sync-dummy-pdfs"),
    onMutate: () => { setIsSyncing(true); setSyncMessage(null); },
    onSuccess: (res: any) => {
      setIsSyncing(false);
      setSyncMessage(res.message || "PDFs synced successfully!");
      queryClient.invalidateQueries({ queryKey: ["judge-assignments"] });
      setTimeout(() => setSyncMessage(null), 5000);
    },
    onError: (err: any) => {
      setIsSyncing(false);
      setSyncMessage(`Sync failed: ${err.message}`);
    },
  });

  const rawAssignments: any[] = data?.assignments ?? [];

  const assignments = rawAssignments.filter((a) => {
    const team = a.team || {};
    const prop = team.proposal || {};
    const q = searchTerm.toLowerCase();
    const searchMatch = !searchTerm ||
      team.teamName?.toLowerCase().includes(q) ||
      team.teamCode?.toLowerCase().includes(q) ||
      prop.title?.toLowerCase().includes(q) ||
      team.leaderName?.toLowerCase().includes(q);
    const isScored = !!a.score;
    const statusMatch = filterStatus === "ALL" ||
      (filterStatus === "SCORED" && isScored) ||
      (filterStatus === "PENDING" && !isScored);
    const categoryMatch = filterCategory === "ALL" || team.category === filterCategory;
    return searchMatch && statusMatch && categoryMatch;
  });

  const totalCount = rawAssignments.length;
  const scoredCount = rawAssignments.filter((a) => a.score).length;
  const pendingCount = totalCount - scoredCount;
  const completionPct = totalCount > 0 ? Math.round((scoredCount / totalCount) * 100) : 0;

  const categoryBadge: Record<string, string> = {
    NATIONAL: "text-sky-300 bg-sky-950/60 border-sky-700/40",
    MIX: "text-violet-300 bg-violet-950/60 border-violet-700/40",
    INTERNATIONAL: "text-amber-300 bg-amber-950/60 border-amber-700/40",
  };

  return (
    <div className="w-full max-w-none px-0 pb-16" style={{ minHeight: "100vh" }}>
      {/* ── TOP COMMAND BAR ── */}
      <div
        className="sticky top-0 z-20 flex flex-col gap-0"
        style={{
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,245,200,0.09)",
        }}
      >
        {/* Title Row */}
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
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
          </div>
        </div>

        {/* Stats + Progress Row */}
        <div
          className="flex items-center gap-0 px-6 py-2 border-t"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}
        >
          {/* Progress bar area */}
          <div className="flex-1 flex items-center gap-4 mr-8">
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
            <div className="flex items-center gap-5 text-xs font-mono">
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
              <span className="flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-text-muted" />
                <span className="text-text-secondary font-bold">{totalCount}</span>
                <span className="text-text-muted">Total</span>
              </span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search teams, proposals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-[11px] rounded border focus:outline-none focus:border-brand-primary/50 transition-colors"
                style={{
                  width: "220px",
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
                    background: filterStatus === s
                      ? s === "SCORED" ? "rgba(74,222,128,0.15)"
                        : s === "PENDING" ? "rgba(250,204,21,0.15)"
                        : "rgba(0,245,200,0.12)"
                      : "transparent",
                    color: filterStatus === s
                      ? s === "SCORED" ? "#4ade80"
                        : s === "PENDING" ? "#facc15"
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
            {/* Column Header */}
            <div
              className="grid items-center gap-4 px-4 py-2 mb-1 text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted select-none"
              style={{
                gridTemplateColumns: "2.5rem 1fr 14rem 10rem 8rem 10rem 9rem",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <span>#</span>
              <span className="flex items-center gap-1.5"><LayoutList className="w-3 h-3" /> Team / Proposal</span>
              <span className="flex items-center gap-1.5"><Tag className="w-3 h-3" /> Code & Category</span>
              <span className="flex items-center gap-1.5"><Users className="w-3 h-3" /> Leader</span>
              <span className="flex items-center gap-1.5"><FileText className="w-3 h-3" /> Document</span>
              <span className="flex items-center gap-1.5"><BarChart3 className="w-3 h-3" /> Score</span>
              <span>Action</span>
            </div>

            {/* Rows */}
            <div className="flex flex-col gap-0.5">
              {assignments.map((a: any, idx: number) => {
                const team = a.team || {};
                const proposal = team.proposal || {};
                const proposalFile = proposal.files?.[0];
                const pdfUrl = proposalFile ? getUploadUrl(proposalFile.storageKey) : null;
                const score = a.score;
                const isScored = !!score;

                return (
                  <div
                    key={a.id}
                    className="group relative grid items-center gap-4 px-4 py-3 rounded-lg transition-all duration-150"
                    style={{
                      gridTemplateColumns: "2.5rem 1fr 14rem 10rem 8rem 10rem 9rem",
                      background: isScored
                        ? "rgba(74,222,128,0.03)"
                        : "rgba(255,255,255,0.025)",
                      border: "1px solid transparent",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(0,245,200,0.04)";
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,245,200,0.12)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = isScored
                        ? "rgba(74,222,128,0.03)"
                        : "rgba(255,255,255,0.025)";
                      (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                    }}
                  >
                    {/* # */}
                    <div className="text-[11px] font-mono text-text-muted font-bold">
                      {team.originalRank ? (
                        <span className="flex items-center gap-1 text-yellow-500">
                          <Trophy className="w-3 h-3" />{team.originalRank}
                        </span>
                      ) : (
                        <span className="text-text-muted/50">{idx + 1}</span>
                      )}
                    </div>

                    {/* Team + Proposal */}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-text-primary group-hover:text-brand-primary transition-colors truncate">
                        {team.teamName}
                      </p>
                      {proposal.title && (
                        <p className="text-[11px] text-text-muted truncate mt-0.5 max-w-xs">
                          <FileText className="w-3 h-3 inline mr-1 text-brand-primary/50" />
                          {proposal.title}
                        </p>
                      )}
                    </div>

                    {/* Code + Category */}
                    <div className="flex flex-col gap-1">
                      <span
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded w-fit"
                        style={{
                          background: "rgba(0,245,200,0.08)",
                          border: "1px solid rgba(0,245,200,0.2)",
                          color: "#00f5c8",
                        }}
                      >
                        {team.teamCode}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border w-fit ${categoryBadge[team.category] || "text-text-muted bg-bg-surface border-border"}`}
                      >
                        {team.category || "NATIONAL"}
                      </span>
                    </div>

                    {/* Leader */}
                    <div className="min-w-0">
                      {team.leaderName ? (
                        <>
                          <p className="text-[11px] font-semibold text-text-primary truncate">{team.leaderName}</p>
                          <p className="text-[10px] text-text-muted truncate">
                            {team.memberCount || 1} member{(team.memberCount || 1) > 1 ? "s" : ""}
                          </p>
                        </>
                      ) : (
                        <span className="text-[10px] text-text-muted">—</span>
                      )}
                    </div>

                    {/* Document */}
                    <div>
                      {proposalFile ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-mono text-green-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> PDF Ready
                          </span>
                          {pdfUrl && (
                            <a
                              href={pdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-brand-primary hover:underline flex items-center gap-0.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-yellow-500 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> No PDF
                        </span>
                      )}
                    </div>

                    {/* Score */}
                    <div>
                      {isScored ? (
                        <div>
                          <p className="text-sm font-bold font-mono" style={{ color: "#00f5c8" }}>
                            {Number(score.finalScore).toFixed(1)}
                            <span className="text-[10px] text-text-muted font-normal"> / 100</span>
                          </p>
                          <div className="flex gap-0.5 mt-1">
                            {[
                              { key: "technicalScore", pct: 30 },
                              { key: "problemScore", pct: 20 },
                              { key: "innovationScore", pct: 25 },
                              { key: "marketScore", pct: 15 },
                              { key: "documentScore", pct: 10 },
                            ].map(({ key, pct }) => {
                              const val = Number(score[key]) || 0;
                              return (
                                <div
                                  key={key}
                                  className="h-1 flex-1 rounded-sm overflow-hidden"
                                  title={`${key}: ${val} (${pct}%)`}
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
                        <span className="text-[10px] text-yellow-400 flex items-center gap-1 font-semibold animate-pulse">
                          <Clock3 className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </div>

                    {/* Action */}
                    <div>
                      <Link
                        to={`/judge/scoring/${team.id}`}
                        className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded transition-all"
                        style={{
                          background: isScored ? "rgba(74,222,128,0.1)" : "rgba(0,245,200,0.1)",
                          border: `1px solid ${isScored ? "rgba(74,222,128,0.3)" : "rgba(0,245,200,0.25)"}`,
                          color: isScored ? "#4ade80" : "#00f5c8",
                        }}
                      >
                        <Sparkles className="w-3 h-3" />
                        {isScored ? "Review" : "Evaluate"}
                        <ChevronRight className="w-3 h-3 ml-auto" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer summary */}
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
                {searchTerm && <span>· Search: "{searchTerm}"</span>}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
