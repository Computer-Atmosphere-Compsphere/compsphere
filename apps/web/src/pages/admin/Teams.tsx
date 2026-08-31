import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { StatusBadge } from "@/components/compsphere/StatusBadge";
import { NeonButton } from "@/components/compsphere/NeonButton";
import {
  Search,
  Globe,
  LayoutGrid,
  List as ListIcon,
  ArrowUpDown,
  ChevronRight,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeamStatus, TeamCategory } from "@compsphere/types";

type SortKey = "rank" | "name" | "code" | "status" | "category";
type SortDir = "asc" | "desc";

const CATEGORY_BADGE: Record<TeamCategory, string> = {
  NATIONAL: "bg-sky-950/40 text-sky-400 border-sky-900/50",
  MIX: "bg-amber-950/40 text-amber-400 border-amber-900/50",
  INTERNATIONAL: "bg-purple-950/40 text-purple-400 border-purple-900/50",
};

export function Teams() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [view, setView] = useState<"card" | "list">("card");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [dropTarget, setDropTarget] = useState<any | null>(null);
  const [approveTarget, setApproveTarget] = useState<any | null>(null);

  const { data: teamsList, isLoading } = useQuery<any[]>({
    queryKey: ["admin-teams", search, category, status],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (category) params.append("category", category);
      if (status) params.append("status", status);
      return api.get(`/api/admin/teams?${params.toString()}`);
    },
  });

  const dropTeamMutation = useMutation({
    mutationFn: (teamId: string) => api.post("/api/admin/drop-team", { teamId }),
    onSuccess: () => {
      setDropTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-teams"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
    },
  });

  const verifyTeamMutation = useMutation({
    mutationFn: (teamId: string) => api.post("/api/admin/verify-team", { teamId }),
    onSuccess: () => {
      setApproveTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-teams"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
    },
  });

  const sortedTeams = useMemo(() => {
    if (!teamsList) return [];
    const copy = [...teamsList];
    copy.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "rank":
          return ((a.originalRank ?? 0) - (b.originalRank ?? 0)) * dir;
        case "name":
          return String(a.teamName ?? "").localeCompare(String(b.teamName ?? "")) * dir;
        case "code":
          return String(a.teamCode ?? "").localeCompare(String(b.teamCode ?? "")) * dir;
        case "status":
          return String(a.status ?? "").localeCompare(String(b.status ?? "")) * dir;
        case "category":
          return String(a.category ?? "").localeCompare(String(b.category ?? "")) * dir;
        default:
          return 0;
      }
    });
    return copy;
  }, [teamsList, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-border">
        <h1 className="text-3xl font-extrabold text-text-primary">All Qualified Teams</h1>
        <p className="text-xs text-text-secondary mt-1">
          Review, verify, and monitor qualifications for all 100 teams.
        </p>
      </div>

      {/* Filter Toolbar */}
      <GlassPanel className="p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by team code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded bg-bg-surface border border-border text-xs text-text-primary focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto items-center">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 rounded bg-bg-surface border border-border text-xs text-text-secondary focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="NATIONAL">National</option>
            <option value="MIX">Mix</option>
            <option value="INTERNATIONAL">International</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 rounded bg-bg-surface border border-border text-xs text-text-secondary focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="TOP30">Top 30</option>
            <option value="AWAITING_CONFIRMATION">Awaiting Confirmation</option>
            <option value="VERIFICATION_PENDING">Reviewing Submission</option>
            <option value="VERIFIED">Verified & Confirmed</option>
            <option value="WAITLIST">Waitlist</option>
            <option value="DROPPED">Dropped</option>
          </select>

          {/* View toggle */}
          <div className="flex items-center gap-1 p-1 rounded bg-bg-surface border border-border">
            <button
              type="button"
              onClick={() => setView("card")}
              aria-label="Card view"
              aria-pressed={view === "card"}
              className={cn(
                "p-1.5 rounded transition-all",
                view === "card"
                  ? "bg-brand-primary text-bg-primary"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              aria-label="List view"
              aria-pressed={view === "list"}
              className={cn(
                "p-1.5 rounded transition-all",
                view === "list"
                  ? "bg-brand-primary text-bg-primary"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </GlassPanel>

      {/* Result count */}
      {!isLoading && teamsList && (
        <div className="flex items-center justify-between text-[10px] text-text-muted uppercase tracking-widest font-bold">
          <span>
            {teamsList.length} {teamsList.length === 1 ? "team" : "teams"} found
          </span>
          <span>
            View: <span className="text-brand-primary">{view === "card" ? "Cards" : "List"}</span>
          </span>
        </div>
      )}

      {/* Grid of Teams */}
      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sortedTeams.length > 0 ? (
        view === "card" ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedTeams.map((team, idx) => (
              <Link
                key={idx}
                to={`/admin/teams/${team.id}`}
                className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60 rounded-lg"
              >
                <GlassPanel
                  hoverEffect
                  className="border border-border flex flex-col justify-between p-5 h-full"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-bold text-brand-primary uppercase tracking-wider bg-brand-dim px-2 py-0.5 rounded">
                        {team.teamCode}
                      </span>
                      <StatusBadge status={team.status as TeamStatus} />
                    </div>
                    <h4 className="font-bold text-text-primary text-base line-clamp-1 group-hover:text-brand-primary transition-colors">
                      {team.teamName}
                    </h4>
                    <div className="space-y-1 text-xs text-text-secondary">
                      <div className="flex justify-between">
                        <span className="text-text-muted">Rank</span>
                        <span className="font-mono">#{team.originalRank}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Category</span>
                        <span
                          className={cn(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded border",
                            CATEGORY_BADGE[team.category as TeamCategory] ??
                              "bg-bg-surface text-text-secondary border-border"
                          )}
                        >
                          {team.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-6 border-t border-border/40 pt-4">
                    <span className="text-[10px] text-text-muted group-hover:text-brand-primary transition-colors flex items-center gap-1">
                      View detail
                      <ChevronRight className="w-3 h-3" />
                    </span>

                    <div
                      className="flex gap-2"
                      onClick={(e) => e.preventDefault()}
                    >
                      {team.status === "VERIFICATION_PENDING" && (
                        <NeonButton
                          onClick={() => setApproveTarget(team)}
                          disabled={verifyTeamMutation.isPending}
                          size="sm"
                        >
                          Approve
                        </NeonButton>
                      )}
                      {["NEW", "TOP30", "AWAITING_CONFIRMATION", "VERIFICATION_PENDING", "VERIFIED"].includes(
                        team.status
                      ) && (
                        <NeonButton
                          onClick={() => setDropTarget(team)}
                          variant="destructive"
                          size="sm"
                        >
                          Drop
                        </NeonButton>
                      )}
                    </div>
                  </div>
                </GlassPanel>
              </Link>
            ))}
          </div>
        ) : (
          <GlassPanel className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-bg-surface/40 border-b border-border">
                    {(
                      [
                        { key: "rank", label: "Rank" },
                        { key: "code", label: "Code" },
                        { key: "name", label: "Team Name" },
                        { key: "category", label: "Category" },
                        { key: "status", label: "Status" },
                      ] as { key: SortKey; label: string }[]
                    ).map((col) => (
                      <th
                        key={col.key}
                        className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-muted"
                      >
                        <button
                          type="button"
                          onClick={() => handleSort(col.key)}
                          className={cn(
                            "inline-flex items-center gap-1 hover:text-text-primary transition-colors",
                            sortKey === col.key && "text-brand-primary"
                          )}
                        >
                          {col.label}
                          <ArrowUpDown
                            className={cn(
                              "w-3 h-3 transition-opacity",
                              sortKey === col.key ? "opacity-100" : "opacity-40"
                            )}
                          />
                          {sortKey === col.key && (
                            <span className="text-[9px] font-mono">
                              {sortDir === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </button>
                      </th>
                    ))}
                    <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {sortedTeams.map((team) => (
                    <tr
                      key={team.id}
                      className="group hover:bg-bg-surface/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-text-secondary">
                        #{team.originalRank}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-bold text-brand-primary bg-brand-dim px-2 py-0.5 rounded uppercase">
                          {team.teamCode}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/teams/${team.id}`}
                          className="font-bold text-text-primary hover:text-brand-primary transition-colors"
                        >
                          {team.teamName}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded border",
                            CATEGORY_BADGE[team.category as TeamCategory] ??
                              "bg-bg-surface text-text-secondary border-border"
                          )}
                        >
                          {team.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={team.status as TeamStatus} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {team.status === "VERIFICATION_PENDING" && (
                            <NeonButton
                              onClick={() => setApproveTarget(team)}
                              disabled={verifyTeamMutation.isPending}
                              size="sm"
                            >
                              Approve
                            </NeonButton>
                          )}
                          {[
                            "NEW",
                            "TOP30",
                            "AWAITING_CONFIRMATION",
                            "VERIFICATION_PENDING",
                            "VERIFIED",
                          ].includes(team.status) && (
                            <NeonButton
                              onClick={() => setDropTarget(team)}
                              variant="destructive"
                              size="sm"
                            >
                              Drop
                            </NeonButton>
                          )}
                          <Link
                            to={`/admin/teams/${team.id}`}
                            className="p-1.5 rounded text-text-muted hover:text-brand-primary hover:bg-bg-surface transition-colors"
                            aria-label="View detail"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassPanel>
        )
      ) : (
        <p className="text-xs text-text-muted text-center py-12">No teams found matching criteria.</p>
      )}

      {/* ── Drop Team Confirmation Modal ── */}
      {dropTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setDropTarget(null)}
        >
          <div
            className="w-full max-w-md mx-4 rounded-xl border border-red-900/40 bg-bg-secondary shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-5">
              {/* Icon + Title */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-950/60 border border-red-900/50 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-text-primary">Drop Team?</h3>
                  <p className="text-xs text-red-400/80">This action cannot be undone.</p>
                </div>
              </div>

              {/* Team Summary */}
              <div className="rounded-lg border border-border/60 bg-bg-surface/50 p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Team</span>
                  <span className="text-xs font-bold text-text-primary">{dropTarget.teamName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Code</span>
                  <span className="text-xs font-mono text-brand-primary">{dropTarget.teamCode}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Rank</span>
                  <span className="text-xs font-mono text-text-secondary">#{dropTarget.originalRank}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Category</span>
                  <span className="text-xs text-text-secondary">{dropTarget.category}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Status</span>
                  <StatusBadge status={dropTarget.status as TeamStatus} />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setDropTarget(null)}
                  className="flex-1 py-2.5 rounded-lg border border-border text-xs font-bold text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => dropTeamMutation.mutate(dropTarget.id)}
                  disabled={dropTeamMutation.isPending}
                  className="flex-1 py-2.5 rounded-lg border border-red-900/50 bg-red-950/40 text-xs font-bold text-red-400 hover:bg-red-900/40 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {dropTeamMutation.isPending ? "Dropping..." : "Yes, Drop Team"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Approve Team Confirmation Modal ── */}
      {approveTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setApproveTarget(null)}
        >
          <div
            className="w-full max-w-md mx-4 rounded-xl border border-green-900/40 bg-bg-secondary shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-5">
              {/* Icon + Title */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-950/60 border border-green-900/50 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-text-primary">Approve Team?</h3>
                  <p className="text-xs text-green-400/80">This will verify the team and approve their payment submission automatically.</p>
                </div>
              </div>

              {/* Team Summary */}
              <div className="rounded-lg border border-border/60 bg-bg-surface/50 p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Team</span>
                  <span className="text-xs font-bold text-text-primary">{approveTarget.teamName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Code</span>
                  <span className="text-xs font-mono text-brand-primary">{approveTarget.teamCode}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Rank</span>
                  <span className="text-xs font-mono text-text-secondary">#{approveTarget.originalRank}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Category</span>
                  <span className="text-xs text-text-secondary">{approveTarget.category}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Status</span>
                  <StatusBadge status={approveTarget.status as TeamStatus} />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setApproveTarget(null)}
                  className="flex-1 py-2.5 rounded-lg border border-border text-xs font-bold text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => verifyTeamMutation.mutate(approveTarget.id)}
                  disabled={verifyTeamMutation.isPending}
                  className="flex-1 py-2.5 rounded-lg border border-green-900/50 bg-green-950/40 text-xs font-bold text-green-400 hover:bg-green-900/40 hover:text-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifyTeamMutation.isPending ? "Approving..." : "Yes, Approve Team"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
