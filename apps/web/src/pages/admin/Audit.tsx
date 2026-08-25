import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { NeonButton } from "@/components/compsphere/NeonButton";
import { ScrollText, Search, ChevronLeft, ChevronRight, User, Clock, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

const ACTION_STYLE: Record<string, { color: string; badge: string; label: string }> = {
  // Payment
  PAYMENT_APPROVED: { color: "text-green-400", badge: "bg-green-950/40 border-green-900/50", label: "Payment Approved" },
  PAYMENT_REJECTED: { color: "text-red-400", badge: "bg-red-950/40 border-red-900/50", label: "Payment Rejected" },
  CONFIRMATION_SUBMITTED: { color: "text-amber-400", badge: "bg-amber-950/40 border-amber-900/50", label: "Confirmation Submitted" },

  // Team
  TEAM_LEADER_ACTIVATED: { color: "text-purple-400", badge: "bg-purple-950/40 border-purple-900/50", label: "Team Leader Activated" },
  TEAM_MEMBER_JOINED: { color: "text-sky-400", badge: "bg-sky-950/40 border-sky-900/50", label: "Team Member Joined" },
  TEAM_TOKEN_REGENERATED: { color: "text-cyan-400", badge: "bg-cyan-950/40 border-cyan-900/50", label: "Token Regenerated" },
  TEAM_VERIFIED: { color: "text-green-400", badge: "bg-green-950/40 border-green-900/50", label: "Team Verified" },
  TEAM_DROPPED: { color: "text-red-500", badge: "bg-red-950/40 border-red-900/50", label: "Team Dropped" },

  // Onboarding
  ONBOARD_REGULAR_USER: { color: "text-blue-400", badge: "bg-blue-950/40 border-blue-900/50", label: "User Onboarded" },

  // Roles
  ROLE_ASSIGNED_ADMIN: { color: "text-amber-400", badge: "bg-amber-950/40 border-amber-900/50", label: "Role: Admin" },
  ROLE_ASSIGNED_JUDGE: { color: "text-amber-400", badge: "bg-amber-950/40 border-amber-900/50", label: "Role: Judge" },
  ROLE_ASSIGNED_PARTICIPANT: { color: "text-sky-400", badge: "bg-sky-950/40 border-sky-900/50", label: "Role: Participant" },
  ROLE_ASSIGNED_USER: { color: "text-blue-400", badge: "bg-blue-950/40 border-blue-900/50", label: "Role: User" },

  // Submissions
  SUBMISSION_UPDATED: { color: "text-blue-400", badge: "bg-blue-950/40 border-blue-900/50", label: "Submission Updated" },
  SUBMISSION_LOCKED: { color: "text-blue-400", badge: "bg-blue-950/40 border-blue-900/50", label: "Submission Locked" },

  // Attendance
  ATTENDANCE_SCANNED: { color: "text-teal-400", badge: "bg-teal-950/40 border-teal-900/50", label: "Attendance Scanned" },

  // Scoring
  SCORE_SUBMITTED: { color: "text-indigo-400", badge: "bg-indigo-950/40 border-indigo-900/50", label: "Score Submitted" },

  // Battle Royale
  BATTLE_ROYALE_INITIATED: { color: "text-orange-400", badge: "bg-orange-950/40 border-orange-900/50", label: "Battle Royale Started" },
  BATTLE_ROYALE_SLOT_CLAIMED: { color: "text-orange-400", badge: "bg-orange-950/40 border-orange-900/50", label: "Slot Claimed" },

  // System
  SYSTEM_CONFIG_UPDATED: { color: "text-yellow-400", badge: "bg-yellow-950/40 border-yellow-900/50", label: "Config Updated" },
};

const DEFAULT_STYLE = { color: "text-text-secondary", badge: "bg-bg-surface border-border", label: "" };

function formatMetadata(meta: Record<string, unknown> | null | undefined): string {
  if (!meta || Object.keys(meta).length === 0) return "";
  // Filter out noisy fields
  const filtered = Object.entries(meta).filter(
    ([k]) => !["tokenId", "teamId", "userId"].includes(k) || typeof meta[k] === "string"
  );
  return filtered
    .map(([k, v]) => {
      const val = typeof v === "string" ? v : typeof v === "number" ? String(v) : JSON.stringify(v);
      // Truncate long values
      return `${k}: ${val.length > 40 ? val.slice(0, 40) + "…" : val}`;
    })
    .join(" · ");
}

export function Audit() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 30;

  const { data, isLoading } = useQuery<{
    logs: any[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>({
    queryKey: ["admin-audit", search, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", String(limit));
      return api.get(`/api/audit?${params.toString()}`);
    },
    refetchInterval: 15_000,
  });

  const logs = data?.logs ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div className="pb-6 border-b border-border flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary">Audit Log</h1>
          <p className="text-xs text-text-secondary mt-1">
            Immutable history of all admin and system actions.
          </p>
        </div>
        {pagination && (
          <span className="text-[10px] text-text-muted font-mono">
            {pagination.total.toLocaleString()} total entries
          </span>
        )}
      </div>

      {/* Search + Pagination Controls */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by action, entity type, entity ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 rounded bg-bg-surface border border-border text-xs text-text-primary focus:outline-none focus:border-brand-primary"
          />
        </div>
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center gap-2">
            <NeonButton
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              variant="ghost"
              size="sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </NeonButton>
            <span className="text-xs text-text-muted font-mono">
              {page} / {pagination.totalPages}
            </span>
            <NeonButton
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              variant="ghost"
              size="sm"
            >
              <ChevronRight className="w-4 h-4" />
            </NeonButton>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="w-7 h-7 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length > 0 ? (
        <div className="space-y-2">
          {logs.map((log: any, idx: number) => {
            const style = ACTION_STYLE[log.action] ?? DEFAULT_STYLE;
            const metaStr = formatMetadata(log.metadata);
            const actorName = log.actor?.fullName ?? null;
            const actorEmail = log.actor?.email ?? null;

            return (
              <div
                key={log.id ?? idx}
                className="px-4 py-3 rounded border border-border/40 bg-bg-surface/30 hover:border-border/80 transition space-y-2"
              >
                {/* Row 1: Timestamp + Action Badge + Entity */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1.5 text-text-muted shrink-0 font-mono text-[10px]">
                    <Clock className="w-3 h-3" />
                    {new Date(log.createdAt).toLocaleString("id-ID", {
                      day: "2-digit", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit", second: "2-digit",
                    })}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded border uppercase shrink-0",
                      style.badge,
                      style.color
                    )}
                  >
                    {style.label || log.action}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    {log.entityType}
                    {log.entityId && (
                      <span className="font-mono ml-1">
                        {log.entityId.length > 12
                          ? `${log.entityId.slice(0, 8)}…`
                          : log.entityId}
                      </span>
                    )}
                  </span>
                </div>

                {/* Row 2: Actor + Metadata */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  {actorName && (
                    <span className="flex items-center gap-1.5 text-[10px] text-text-secondary">
                      <User className="w-3 h-3 text-brand-primary" />
                      <span className="font-semibold">{actorName}</span>
                      {actorEmail && (
                        <span className="text-text-muted">({actorEmail})</span>
                      )}
                    </span>
                  )}
                  {!actorName && log.actorId && (
                    <span className="flex items-center gap-1.5 text-[10px] text-text-muted font-mono">
                      <User className="w-3 h-3" />
                      {log.actorId.slice(0, 8)}…
                    </span>
                  )}
                  {metaStr && (
                    <span className="flex items-center gap-1.5 text-[10px] text-text-muted">
                      <Tag className="w-3 h-3" />
                      {metaStr}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <GlassPanel className="text-center py-14 space-y-3">
          <ScrollText className="w-10 h-10 text-brand-primary mx-auto" />
          <p className="text-sm font-bold text-text-primary">No Logs Found</p>
          <p className="text-xs text-text-muted">
            {search ? `No results for "${search}"` : "Activity will appear here as operations run."}
          </p>
        </GlassPanel>
      )}
    </div>
  );
}
