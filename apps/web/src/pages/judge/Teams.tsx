import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getUploadUrl } from "@/lib/api";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { NeonButton } from "@/components/compsphere/NeonButton";
import { Link } from "react-router-dom";
import {
  CheckSquare,
  Clock,
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
    onMutate: () => {
      setIsSyncing(true);
      setSyncMessage(null);
    },
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

  // Filter assignments based on search term, status, and category
  const assignments = rawAssignments.filter((a) => {
    const team = a.team || {};
    const prop = team.proposal || {};
    const searchMatch =
      !searchTerm ||
      team.teamName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.teamCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.leaderName?.toLowerCase().includes(searchTerm.toLowerCase());

    const isScored = !!a.score;
    const statusMatch =
      filterStatus === "ALL" ||
      (filterStatus === "SCORED" && isScored) ||
      (filterStatus === "PENDING" && !isScored);

    const categoryMatch =
      filterCategory === "ALL" || team.category === filterCategory;

    return searchMatch && statusMatch && categoryMatch;
  });

  const totalCount = rawAssignments.length;
  const scoredCount = rawAssignments.filter((a) => a.score).length;
  const pendingCount = totalCount - scoredCount;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="pb-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-brand-primary uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" /> Judge Evaluation Panel
          </div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
            Assigned Teams for Evaluation
          </h1>
          <p className="text-xs text-text-secondary mt-1 max-w-2xl">
            Review detailed proposal documents, technical architecture, and team specs. Grade each team according to COMPSPHERE Phase 1 scoring guidelines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <NeonButton
            size="sm"
            onClick={() => syncPdfMutation.mutate()}
            disabled={isSyncing}
            className="flex items-center gap-2 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing Dummy PDFs..." : "Sync PDF Server Data"}
          </NeonButton>
        </div>
      </div>

      {/* Sync alert message */}
      {syncMessage && (
        <div className="p-3 rounded-lg bg-brand-primary/10 border border-brand-primary/30 text-xs font-semibold text-brand-primary flex items-center justify-between">
          <span>{syncMessage}</span>
          <button onClick={() => setSyncMessage(null)} className="text-text-muted hover:text-text-primary">✕</button>
        </div>
      )}

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassPanel className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Total Assigned Teams</p>
            <p className="text-2xl font-extrabold text-text-primary font-mono mt-1">{totalCount}</p>
          </div>
          <Layers className="w-8 h-8 text-brand-primary/40" />
        </GlassPanel>
        <GlassPanel className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-green-400 uppercase tracking-wider">Evaluated & Scored</p>
            <p className="text-2xl font-extrabold text-green-400 font-mono mt-1">{scoredCount}</p>
          </div>
          <CheckSquare className="w-8 h-8 text-green-400/40" />
        </GlassPanel>
        <GlassPanel className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-yellow-400 uppercase tracking-wider">Pending Evaluation</p>
            <p className="text-2xl font-extrabold text-yellow-400 font-mono mt-1">{pendingCount}</p>
          </div>
          <Clock className="w-8 h-8 text-yellow-400/40" />
        </GlassPanel>
      </div>

      {/* Search & Filter Toolbar */}
      <GlassPanel className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by team name, code, proposal title, leader..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-bg-surface border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center bg-bg-surface border border-border rounded-lg p-1 text-xs font-semibold">
            <button
              onClick={() => setFilterStatus("ALL")}
              className={`px-3 py-1 rounded-md transition ${filterStatus === "ALL" ? "bg-brand-primary text-bg-primary font-bold" : "text-text-secondary hover:text-text-primary"}`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setFilterStatus("PENDING")}
              className={`px-3 py-1 rounded-md transition ${filterStatus === "PENDING" ? "bg-yellow-400/20 text-yellow-400 font-bold" : "text-text-secondary hover:text-text-primary"}`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilterStatus("SCORED")}
              className={`px-3 py-1 rounded-md transition ${filterStatus === "SCORED" ? "bg-green-400/20 text-green-400 font-bold" : "text-text-secondary hover:text-text-primary"}`}
            >
              Scored ({scoredCount})
            </button>
          </div>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-bg-surface border border-border text-xs text-text-primary rounded-lg px-3 py-2 focus:outline-none focus:border-brand-primary"
          >
            <option value="ALL">All Categories</option>
            <option value="NATIONAL">National</option>
            <option value="MIX">Mix</option>
            <option value="INTERNATIONAL">International</option>
          </select>
        </div>
      </GlassPanel>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : assignments.length === 0 ? (
        <GlassPanel className="text-center py-16 space-y-3">
          <Layers className="w-10 h-10 text-text-muted mx-auto" />
          <p className="text-base font-bold text-text-primary">No Matching Teams Found</p>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            Try adjusting your search query or filters to view assigned teams.
          </p>
        </GlassPanel>
      ) : (
        /* Wide Card List */
        <div className="space-y-6">
          {assignments.map((a: any) => {
            const team = a.team || {};
            const proposal = team.proposal || {};
            const proposalFile = proposal.files?.[0];
            const pdfUrl = proposalFile ? getUploadUrl(proposalFile.storageKey) : null;
            const score = a.score;
            const isScored = !!score;

            return (
              <GlassPanel
                key={a.id}
                className="p-6 transition hover:border-brand-primary/50 relative overflow-hidden group space-y-5"
              >
                {/* Top Badge Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/50">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand-primary bg-brand-dim border border-brand-primary/30 px-3 py-1 rounded-md">
                      {team.teamCode}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border border-purple-500/40 bg-purple-950/30 text-purple-300">
                      {team.category || "NATIONAL"}
                    </span>
                    {team.originalRank && (
                      <span className="text-xs font-bold flex items-center gap-1 text-yellow-400 bg-yellow-950/30 border border-yellow-500/30 px-2.5 py-0.5 rounded-full">
                        <Trophy className="w-3 h-3" /> Rank #{team.originalRank}
                      </span>
                    )}
                    <span className="text-xs text-text-muted bg-bg-surface px-2.5 py-0.5 rounded border border-border">
                      Status: <strong className="text-text-primary">{team.status || "NEW"}</strong>
                    </span>
                  </div>

                  <div>
                    {isScored ? (
                      <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-green-950/50 border border-green-500/40 text-green-400 text-xs font-bold">
                        <CheckSquare className="w-4 h-4 text-green-400" />
                        <span>Scored: <strong className="font-mono text-sm">{Number(score.finalScore).toFixed(1)}</strong> / 100</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-yellow-950/40 border border-yellow-500/40 text-yellow-400 text-xs font-bold animate-pulse">
                        <Clock className="w-4 h-4" />
                        <span>Pending Evaluation</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Team Title & Member Info */}
                <div className="grid md:grid-cols-3 gap-6 items-start">
                  <div className="md:col-span-2 space-y-2">
                    <h3 className="text-xl font-extrabold text-text-primary group-hover:text-brand-primary transition-colors">
                      {team.teamName}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                      <span className="flex items-center gap-1.5 font-semibold text-text-secondary">
                        <Users className="w-3.5 h-3.5 text-brand-primary" />
                        {team.memberCount || 1} Team Member{(team.memberCount || 1) > 1 ? "s" : ""}
                      </span>
                      {team.leaderName && (
                        <span>
                          Leader: <strong className="text-text-primary">{team.leaderName}</strong>
                          {team.leaderEmail && <span className="text-text-muted ml-1">({team.leaderEmail})</span>}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Action Button */}
                  <div className="flex justify-start md:justify-end items-center">
                    <Link to={`/judge/scoring/${team.id}`} className="w-full md:w-auto">
                      <NeonButton size="md" className="w-full md:w-auto flex items-center justify-center gap-2 py-2.5 px-5">
                        <Sparkles className="w-4 h-4 text-brand-primary" />
                        {isScored ? "Review & Update Score" : "Evaluate Team Proposal"}
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </NeonButton>
                    </Link>
                  </div>
                </div>

                {/* Proposal Section Details */}
                {proposal.title && (
                  <div className="p-4 rounded-xl bg-bg-surface/80 border border-border/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        Proposal Project: {proposal.title}
                      </h4>
                      {proposal.devpostUrl && (
                        <a
                          href={proposal.devpostUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-brand-primary hover:underline flex items-center gap-1"
                        >
                          Devpost Submission <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                      {proposal.description || "Proposal description submitted for COMPSPHERE 2026."}
                    </p>

                    {/* PDF File Badge & Viewer Link */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                      {proposalFile ? (
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center gap-1.5 text-xs text-green-400 bg-green-950/40 border border-green-900/50 px-2.5 py-1 rounded font-mono font-semibold">
                            <FileText className="w-3.5 h-3.5" />
                            {proposalFile.originalFilename || `proposal_${team.teamCode}.pdf`}
                            {proposalFile.sizeBytes && (
                              <span className="text-[10px] text-text-muted">
                                ({(proposalFile.sizeBytes / 1024).toFixed(0)} KB)
                              </span>
                            )}
                          </span>
                          {pdfUrl && (
                            <a
                              href={pdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-brand-primary font-bold hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> View PDF in New Tab
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-yellow-400 bg-yellow-950/30 border border-yellow-900/40 px-2.5 py-1 rounded">
                          ⚠️ No PDF document attached yet (Click Sync PDF Server Data above to generate)
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Score Breakdown Pills if already scored */}
                {isScored && (
                  <div className="pt-2 border-t border-border/40">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">
                      Your Evaluated Scores Breakdown:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                      <div className="p-2 rounded bg-bg-surface border border-border/60 text-center">
                        <span className="text-[9px] text-text-muted block font-semibold">Technical (30%)</span>
                        <span className="font-mono font-bold text-brand-primary text-sm">{score.technicalScore}</span>
                      </div>
                      <div className="p-2 rounded bg-bg-surface border border-border/60 text-center">
                        <span className="text-[9px] text-text-muted block font-semibold">Problem (20%)</span>
                        <span className="font-mono font-bold text-brand-primary text-sm">{score.problemScore}</span>
                      </div>
                      <div className="p-2 rounded bg-bg-surface border border-border/60 text-center">
                        <span className="text-[9px] text-text-muted block font-semibold">Innovation (25%)</span>
                        <span className="font-mono font-bold text-brand-primary text-sm">{score.innovationScore}</span>
                      </div>
                      <div className="p-2 rounded bg-bg-surface border border-border/60 text-center">
                        <span className="text-[9px] text-text-muted block font-semibold">Market (15%)</span>
                        <span className="font-mono font-bold text-brand-primary text-sm">{score.marketScore}</span>
                      </div>
                      <div className="p-2 rounded bg-bg-surface border border-border/60 text-center">
                        <span className="text-[9px] text-text-muted block font-semibold">Document (10%)</span>
                        <span className="font-mono font-bold text-brand-primary text-sm">{score.documentScore}</span>
                      </div>
                    </div>
                    {score.submittedAt && (
                      <p className="text-[10px] text-text-muted mt-2 text-right">
                        Evaluated on: {new Date(score.submittedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    )}
                  </div>
                )}
              </GlassPanel>
            );
          })}
        </div>
      )}
    </div>
  );
}
