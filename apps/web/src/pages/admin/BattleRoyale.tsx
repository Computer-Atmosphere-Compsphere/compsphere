import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { NeonButton } from "@/components/compsphere/NeonButton";
import {
  Sword,
  Lock,
  Unlock,
  AlertTriangle,
  GripVertical,
  Trophy,
  CheckCircle2,
  ArrowUpDown,
  Search,
  Sparkles,
  ShieldCheck,
  Flame,
  RotateCcw,
  Mail,
  Send,
  XCircle,
  Clock,
  Check,
  X,
  Eye,
  FileText,
  Users,
  Copy,
  ExternalLink,
  ChevronRight,
  Info,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardTeam {
  team_id: string;
  team_name: string;
  team_code: string;
  category: string;
  team_status?: string;
  average_score: number;
  judge_count?: number;
  rank?: number;
  payment_status?: "VERIFIED" | "PENDING" | "REJECTED" | "UNPAID" | string;
  payment_amount?: number | null;
  slot_id?: string | null;
  slot_claimed_at?: string | null;
  is_payment_cleared?: boolean;
  leader_name?: string;
  leader_email?: string;
  email_status?: "NOT_SENT" | "SENT" | "CONFIRMED" | "REJECTED";
  email_sent_at?: string | null;
  slot_decision?: "CONFIRMED" | "REJECTED" | null;
  slot_decided_at?: string | null;
}

interface PendingMove {
  fromIndex: number;
  toIndex: number;
  team: LeaderboardTeam;
  targetTeam: LeaderboardTeam;
}

// Preset Email Templates
const EMAIL_PRESETS = [
  {
    id: "TOP30_CONFIRM",
    label: "Top 30: Phase 2 Slot Confirmation",
    type: "SLOT_CONFIRMATION" as const,
    defaultRecipient: "TOP30" as const,
    subject: "[CompSphere 12] Phase 2 Qualified Finalist Slot Confirmation - {{team_name}}",
    body: `Dear {{leader_name}} & Members of {{team_name}},

Congratulations! Based on the comprehensive Phase 1 judging evaluations, your team ({{team_code}}) has officially qualified as a Phase 2 Finalist in the {{category}} category for CompSphere 12!

To secure your place in Phase 2, please confirm your team's participation by clicking the confirmation button below.

Important Information:
• Qualification Status: Official Phase 2 Finalist (Direct Qualifier)
• Category: {{category}}
• Response Deadline: Within 72 hours of receiving this notification

If your team is unable to participate, please click the decline button so we may release the slot to eligible candidate teams on the waiting list.

Best regards,
CompSphere 12 Organizing Committee`,
  },
  {
    id: "WAITLIST_INFO",
    label: "Rank 31–100: Waiting List & Replacement Opportunity",
    type: "GENERAL_INFO" as const,
    defaultRecipient: "WAITLIST" as const,
    subject: "[CompSphere 12] Phase 2 Candidate Status & Waiting List Update - {{team_name}}",
    body: `Dear {{leader_name}} & Members of {{team_name}},

Thank you for your outstanding submission in CompSphere 12 Phase 1. Your team ({{team_code}}) has demonstrated exceptional performance in the {{category}} category and is currently positioned in the Battle Royale Waiting List Pool.

As Top 30 qualified finalist teams confirm or decline their slots, replacement opportunities will open on a First-Come, First-Served basis for waiting list candidate teams.

Please keep an eye on your CompSphere dashboard and email for real-time slot vacancy updates.

Best regards,
CompSphere 12 Organizing Committee`,
  },
  {
    id: "GENERAL_ANNOUNCE",
    label: "All Teams: General Announcement",
    type: "GENERAL_INFO" as const,
    defaultRecipient: "ALL" as const,
    subject: "[CompSphere 12] Important Update Regarding Phase 1 Results & Next Steps",
    body: `Dear {{leader_name}} & Team {{team_name}},

We would like to share an important operational update regarding CompSphere 12 Phase 1 results and the upcoming Phase 2 timeline.

Please log in to your CompSphere team dashboard to review your status, team details, and upcoming sub-event announcements.

If you have any questions, our helpdesk team is available to assist you.

Best regards,
CompSphere 12 Organizing Committee`,
  },
];

const AVAILABLE_PLACEHOLDERS = [
  { tag: "{{team_name}}", label: "Team Name" },
  { tag: "{{team_code}}", label: "Team Code" },
  { tag: "{{rank}}", label: "Rank" },
  { tag: "{{category}}", label: "Category" },
  { tag: "{{leader_name}}", label: "Leader Name" },
];

export function BattleRoyale() {
  const queryClient = useQueryClient();

  // Queries
  const {
    data: leaderboardResponse,
    isLoading: isLeaderboardLoading,
    isError: isLeaderboardError,
    error: leaderboardError,
    refetch: refetchLeaderboard,
  } = useQuery<any>({
    queryKey: ["admin-br-phase1-leaderboard"],
    queryFn: () => api.get("/api/battle-royale/phase1-leaderboard"),
  });

  const { data: slotsData, isLoading: isSlotsLoading } = useQuery<any>({
    queryKey: ["admin-br-slots"],
    queryFn: () => api.get("/api/battle-royale/slots"),
    refetchInterval: 10_000,
  });

  // Local state
  const [leaderboard, setLeaderboard] = useState<LeaderboardTeam[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [claimFilter, setClaimFilter] = useState<string>("ALL");
  const [emailStatusFilter, setEmailStatusFilter] = useState<string>("ALL");
  const [activeView, setActiveView] = useState<"leaderboard" | "slots">("leaderboard");

  // Selection state for emails
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);

  // Email Modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailTab, setEmailTab] = useState<"compose" | "preview" | "recipients">("compose");
  const [selectedPreset, setSelectedPreset] = useState<string>("TOP30_CONFIRM");
  const [recipientType, setRecipientType] = useState<"ALL" | "TOP30" | "WAITLIST" | "CUSTOM">("TOP30");
  const [emailType, setEmailType] = useState<"SLOT_CONFIRMATION" | "GENERAL_INFO">("SLOT_CONFIRMATION");
  const [emailSubject, setEmailSubject] = useState(EMAIL_PRESETS[0].subject);
  const [emailContent, setEmailContent] = useState(EMAIL_PRESETS[0].body);
  const [testEmailOverride, setTestEmailOverride] = useState("");
  const [sendSuccessResult, setSendSuccessResult] = useState<any | null>(null);
  const [recipientSearchQuery, setRecipientSearchQuery] = useState("");

  // Sync API data to local state
  useEffect(() => {
    const list =
      leaderboardResponse?.leaderboard ??
      leaderboardResponse?.data?.leaderboard ??
      (Array.isArray(leaderboardResponse) ? leaderboardResponse : []);
    if (Array.isArray(list) && list.length > 0) {
      setLeaderboard(list);
    }
  }, [leaderboardResponse]);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (isEmailModalOpen || pendingMove) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isEmailModalOpen, pendingMove]);

  // Handle Preset Change
  const applyPreset = (presetId: string) => {
    const preset = EMAIL_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedPreset(presetId);
    setEmailType(preset.type);
    setRecipientType(preset.defaultRecipient);
    setEmailSubject(preset.subject);
    setEmailContent(preset.body);
  };

  const insertPlaceholder = (tag: string) => {
    setEmailContent((prev) => prev + " " + tag);
  };

  // Mutations
  const syncLeaderboardMutation = useMutation({
    mutationFn: () => api.post("/api/battle-royale/sync-leaderboard"),
    onSuccess: (res: any) => {
      const list = res?.data ?? (Array.isArray(res) ? res : []);
      if (Array.isArray(list) && list.length > 0) {
        setLeaderboard(list);
      }
      queryClient.invalidateQueries({ queryKey: ["admin-br-phase1-leaderboard"] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (newLeaderboard: LeaderboardTeam[]) =>
      api.post("/api/battle-royale/reorder-leaderboard", { leaderboard: newLeaderboard }),
    onSuccess: (res: any) => {
      const updatedList =
        res?.leaderboard ??
        res?.data?.leaderboard ??
        res?.data ??
        res ??
        leaderboard;
      queryClient.setQueryData(["admin-br-phase1-leaderboard"], (old: any) => {
        if (old && typeof old === "object" && !Array.isArray(old)) {
          return {
            ...old,
            leaderboard: updatedList,
          };
        }
        return { isClosed: true, leaderboard: updatedList };
      });
      setPendingMove(null);
    },
  });

  const resetSlotMutation = useMutation({
    mutationFn: (slotId: string) => api.post("/api/admin/reset-br-slot", { slotId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-br-slots"] });
      queryClient.invalidateQueries({ queryKey: ["admin-br-phase1-leaderboard"] });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: (payload: {
      recipientType: "ALL" | "TOP30" | "WAITLIST" | "CUSTOM";
      selectedTeamIds?: string[];
      emailType: "SLOT_CONFIRMATION" | "GENERAL_INFO";
      subject: string;
      content: string;
      deadlineHours?: number;
      testEmailOverride?: string;
    }) => api.post("/api/battle-royale/send-emails", payload),
    onSuccess: (res: any) => {
      setSendSuccessResult(res?.data || res);
      queryClient.invalidateQueries({ queryKey: ["admin-br-phase1-leaderboard"] });
    },
  });

  // Derived active leaderboard
  const currentTeams: LeaderboardTeam[] =
    leaderboard.length > 0
      ? leaderboard
      : (leaderboardResponse?.leaderboard ??
          leaderboardResponse?.data?.leaderboard ??
          (Array.isArray(leaderboardResponse) ? leaderboardResponse : []));

  // Selection Helpers
  const toggleSelectTeam = (teamId: string) => {
    setSelectedTeamIds((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  const selectAll = () => {
    setSelectedTeamIds(currentTeams.map((t: LeaderboardTeam) => t.team_id));
  };

  const selectTop30 = () => {
    setSelectedTeamIds(currentTeams.slice(0, 30).map((t: LeaderboardTeam) => t.team_id));
  };

  const selectWaitlist = () => {
    setSelectedTeamIds(currentTeams.slice(30, 100).map((t: LeaderboardTeam) => t.team_id));
  };

  const clearSelection = () => {
    setSelectedTeamIds([]);
  };

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }

    setPendingMove({
      fromIndex: draggedIndex,
      toIndex: targetIndex,
      team: currentTeams[draggedIndex],
      targetTeam: currentTeams[targetIndex],
    });

    setDraggedIndex(null);
  };

  // Confirm Reorder
  const confirmMove = () => {
    if (!pendingMove) return;
    const { fromIndex, toIndex } = pendingMove;

    const updated = [...currentTeams];
    const [movedItem] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, movedItem);

    setLeaderboard(updated);
    reorderMutation.mutate(updated);
  };

  const cancelMove = () => {
    setPendingMove(null);
  };

  // Reset to original Phase 1 calculated score
  const handleResetToScore = () => {
    if (!window.confirm("Reset the leaderboard to the original Phase 1 average score rankings?")) return;
    const sorted = [...currentTeams].sort((a, b) => Number(b.average_score) - Number(a.average_score));
    setLeaderboard(sorted);
    reorderMutation.mutate(sorted);
  };

  // Slots calculation
  const slots: any[] = slotsData?.slots ?? slotsData?.data?.slots ?? (Array.isArray(slotsData) ? slotsData : []);
  const claimed = slots.filter((s) => s.claimedBy);
  const available = slots.filter((s) => !s.claimedBy);
  const isClosed = Boolean(leaderboardResponse?.isClosed ?? leaderboardResponse?.data?.isClosed);

  // Filtered leaderboard for search and filters
  const filteredTeams = currentTeams
    .map((team: LeaderboardTeam, originalIndex: number) => ({ ...team, originalIndex }))
    .filter((team: LeaderboardTeam & { originalIndex: number }) => {
      const matchesSearch =
        (team.team_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (team.team_code || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "ALL" || team.category === categoryFilter;
      const matchesClaim =
        claimFilter === "ALL" ||
        (claimFilter === "CLAIMED" && Boolean(team.slot_id)) ||
        (claimFilter === "UNCLAIMED" && !team.slot_id);
      const matchesEmailStatus =
        emailStatusFilter === "ALL" ||
        (emailStatusFilter === "CONFIRMED" && team.email_status === "CONFIRMED") ||
        (emailStatusFilter === "REJECTED" && team.email_status === "REJECTED") ||
        (emailStatusFilter === "SENT" && team.email_status === "SENT") ||
        (emailStatusFilter === "NOT_SENT" && (!team.email_status || team.email_status === "NOT_SENT"));

      return matchesSearch && matchesCategory && matchesClaim && matchesEmailStatus;
    });

  const isFilterActive = searchQuery !== "" || categoryFilter !== "ALL" || claimFilter !== "ALL" || emailStatusFilter !== "ALL";

  // Target recipients for modal review
  const modalTargetTeams: LeaderboardTeam[] = React.useMemo(() => {
    if (recipientType === "TOP30") return currentTeams.slice(0, 30);
    if (recipientType === "WAITLIST") return currentTeams.slice(30, 100);
    if (recipientType === "CUSTOM") return currentTeams.filter((t: LeaderboardTeam) => selectedTeamIds.includes(t.team_id));
    return currentTeams;
  }, [recipientType, currentTeams, selectedTeamIds]);

  const filteredModalRecipients = modalTargetTeams.filter((team) => {
    if (!recipientSearchQuery) return true;
    const q = recipientSearchQuery.toLowerCase();
    return (
      team.team_name.toLowerCase().includes(q) ||
      team.team_code.toLowerCase().includes(q) ||
      (team.leader_email && team.leader_email.toLowerCase().includes(q))
    );
  });

  // Preview sample team
  const sampleTeam = modalTargetTeams[0] || currentTeams[0] || {
    team_name: "Team Garuda Tech",
    team_code: "COMP-101",
    category: "NATIONAL",
    rank: 1,
    leader_name: "Budi Santoso",
  };

  const previewRenderedSubject = emailSubject
    .split("{{team_name}}").join(sampleTeam.team_name)
    .split("{{team_code}}").join(sampleTeam.team_code)
    .split("{{rank}}").join(String(sampleTeam.rank || 1));

  const previewRenderedBody = emailContent
    .split("{{team_name}}").join(sampleTeam.team_name)
    .split("{{team_code}}").join(sampleTeam.team_code)
    .split("{{category}}").join(sampleTeam.category)
    .split("{{rank}}").join(String(sampleTeam.rank || 1))
    .split("{{leader_name}}").join(sampleTeam.leader_name || "Team Leader");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-border flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-text-primary">Battle Royale & Phase 2 Management</h1>
            {isClosed ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> Phase 1 Finalized
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Flame className="w-3.5 h-3.5" /> Phase 1 Active
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted mt-1">
            Reorder rankings, allocate finalist slots, and broadcast slot confirmation or informational emails directly to team leaders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sync from DB Button */}
          <NeonButton
            onClick={() => syncLeaderboardMutation.mutate()}
            disabled={syncLeaderboardMutation.isPending}
            variant="secondary"
            size="sm"
            className="flex items-center gap-1.5 text-xs text-brand-primary border-brand-primary/30 hover:border-brand-primary"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", syncLeaderboardMutation.isPending && "animate-spin")} />
            {syncLeaderboardMutation.isPending ? "Syncing..." : "Sync from DB"}
          </NeonButton>

          {/* Email Blast Button */}
          <NeonButton
            onClick={() => {
              setSendSuccessResult(null);
              setIsEmailModalOpen(true);
            }}
            variant="primary"
            size="sm"
            className="flex items-center gap-1.5 text-xs bg-brand-primary text-bg-primary font-bold shadow-md shadow-brand-primary/20"
          >
            <Mail className="w-3.5 h-3.5" />
            Send Email / Slot Confirmation
          </NeonButton>

          <NeonButton
            onClick={handleResetToScore}
            disabled={reorderMutation.isPending || currentTeams.length === 0}
            variant="secondary"
            size="sm"
            className="flex items-center gap-1.5 text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Score Order
          </NeonButton>

          <div className="flex bg-bg-surface p-1 rounded-lg border border-border text-xs font-semibold">
            <button
              onClick={() => setActiveView("leaderboard")}
              className={cn(
                "px-3 py-1 rounded transition-all",
                activeView === "leaderboard"
                  ? "bg-bg-primary text-text-primary shadow-sm border border-border"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              Leaderboard ({currentTeams.length})
            </button>
            <button
              onClick={() => setActiveView("slots")}
              className={cn(
                "px-3 py-1 rounded transition-all",
                activeView === "slots"
                  ? "bg-bg-primary text-text-primary shadow-sm border border-border"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              BR Claim Slots ({claimed.length}/{slots.length || 0})
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <GlassPanel className="p-4 border-border space-y-1">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[11px] font-medium">Safe Zone</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold font-mono text-emerald-400">Top 30</p>
          <p className="text-[10px] text-text-muted">Direct Phase 2 Qualification</p>
        </GlassPanel>

        <GlassPanel className="p-4 border-border space-y-1">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[11px] font-medium">Battle Royale Pool</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-bold font-mono text-amber-400">Rank 31–100</p>
          <p className="text-[10px] text-text-muted">Waiting List (70 Teams)</p>
        </GlassPanel>

        <GlassPanel className="p-4 border-border space-y-1">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[11px] font-medium">Confirmed Slots</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-xl font-bold font-mono text-cyan-400">
            {currentTeams.filter((t: LeaderboardTeam) => t.email_status === "CONFIRMED" || t.slot_decision === "CONFIRMED").length} Teams
          </p>
          <p className="text-[10px] text-text-muted">Leader Confirmed Phase 2</p>
        </GlassPanel>

        <GlassPanel className="p-4 border-border space-y-1">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[11px] font-medium">Slots Claimed</span>
            <Sword className="w-4 h-4 text-text-secondary" />
          </div>
          <p className="text-xl font-bold font-mono text-text-primary">
            {claimed.length} / {slots.length || 0}
          </p>
          <p className="text-[10px] text-text-muted">BR Active Claims</p>
        </GlassPanel>
      </div>

      {/* Payment & Claim Policy Info */}
      <GlassPanel className="py-3 px-4 border-border bg-bg-surface/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-text-muted">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-text-secondary shrink-0" />
          <span>
            <strong>Claiming Requirement:</strong> <strong>National & Mix</strong> teams require confirmed <strong>Rp 120,000</strong> payment to claim slots. <strong>International</strong> teams are free.
          </span>
        </div>
        <span className="text-[11px] text-text-muted shrink-0 font-mono">
          Top 1–100 Full List Active
        </span>
      </GlassPanel>

      {activeView === "leaderboard" ? (
        <div className="space-y-3">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-lg bg-bg-surface border border-border">
            <div className="flex items-center gap-2 flex-1 min-w-[200px] px-2">
              <Search className="w-3.5 h-3.5 text-text-muted" />
              <input
                type="text"
                placeholder="Search team name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-text-muted">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2 py-1 rounded bg-bg-primary border border-border text-text-primary focus:outline-none focus:border-border-hover"
              >
                <option value="ALL">All Categories</option>
                <option value="NATIONAL">NATIONAL</option>
                <option value="MIX">MIX</option>
                <option value="INTERNATIONAL">INTERNATIONAL</option>
              </select>

              <span className="text-text-muted ml-1">Slot:</span>
              <select
                value={claimFilter}
                onChange={(e) => setClaimFilter(e.target.value)}
                className="px-2 py-1 rounded bg-bg-primary border border-border text-text-primary focus:outline-none focus:border-border-hover"
              >
                <option value="ALL">All Slots</option>
                <option value="CLAIMED">Claimed Only</option>
                <option value="UNCLAIMED">Unclaimed Only</option>
              </select>

              <span className="text-text-muted ml-1">Email / Slot Decision:</span>
              <select
                value={emailStatusFilter}
                onChange={(e) => setEmailStatusFilter(e.target.value)}
                className="px-2 py-1 rounded bg-bg-primary border border-border text-text-primary focus:outline-none focus:border-border-hover"
              >
                <option value="ALL">All Status</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="REJECTED">Declined / Rejected</option>
                <option value="SENT">Email Sent (Pending)</option>
                <option value="NOT_SENT">Not Sent</option>
              </select>
            </div>
          </div>

          {/* Bulk Selection Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 px-3 rounded-lg bg-bg-surface/50 border border-border text-xs">
            <div className="flex items-center gap-2">
              <span className="font-medium text-text-secondary">
                Select Teams for Bulk Email:
              </span>
              <button
                type="button"
                onClick={selectAll}
                className="px-2 py-0.5 rounded bg-bg-primary hover:bg-bg-surface border border-border text-[11px] text-text-primary transition"
              >
                All ({currentTeams.length})
              </button>
              <button
                type="button"
                onClick={selectTop30}
                className="px-2 py-0.5 rounded bg-bg-primary hover:bg-bg-surface border border-emerald-500/30 text-[11px] text-emerald-400 transition"
              >
                Top 30
              </button>
              <button
                type="button"
                onClick={selectWaitlist}
                className="px-2 py-0.5 rounded bg-bg-primary hover:bg-bg-surface border border-amber-500/30 text-[11px] text-amber-400 transition"
              >
                Waiting List (31–100)
              </button>
              {selectedTeamIds.length > 0 && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="px-2 py-0.5 rounded text-[11px] text-red-400 hover:text-red-300 transition"
                >
                  Clear Selection
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-text-primary text-[11px]">
                {selectedTeamIds.length} Selected
              </span>
              {selectedTeamIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setRecipientType("CUSTOM");
                    setIsEmailModalOpen(true);
                  }}
                  className="px-2.5 py-1 rounded bg-brand-primary text-bg-primary font-bold text-[11px] hover:opacity-90 transition flex items-center gap-1"
                >
                  <Mail className="w-3 h-3" /> Email Selected ({selectedTeamIds.length})
                </button>
              )}
            </div>
          </div>

          <p className="text-[11px] text-text-muted flex items-center gap-1.5 px-1">
            <GripVertical className="w-3.5 h-3.5 text-text-secondary" />
            {isFilterActive
              ? "Filtering active. Clear filters to enable drag & drop reordering."
              : "Drag and drop any team row to reorder rankings. A confirmation modal will appear to validate each rank update."}
          </p>

          {/* Leaderboard Table / List */}
          {isLeaderboardError ? (
            <GlassPanel className="text-center py-10 space-y-3 border-red-900/40 bg-red-950/20">
              <AlertTriangle className="w-9 h-9 mx-auto text-red-400" />
              <p className="text-sm font-semibold text-text-primary">Failed to Load Leaderboard</p>
              <p className="text-xs text-text-muted max-w-sm mx-auto">
                {(leaderboardError as any)?.message || "An unexpected error occurred while communicating with the server."}
              </p>
              <div className="pt-1 flex items-center justify-center gap-2">
                <NeonButton size="sm" variant="secondary" onClick={() => refetchLeaderboard()}>
                  Retry
                </NeonButton>
                <NeonButton
                  size="sm"
                  variant="primary"
                  onClick={() => syncLeaderboardMutation.mutate()}
                  disabled={syncLeaderboardMutation.isPending}
                >
                  <RefreshCw className={cn("w-3.5 h-3.5 mr-1", syncLeaderboardMutation.isPending && "animate-spin")} />
                  Sync from DB
                </NeonButton>
              </div>
            </GlassPanel>
          ) : isLeaderboardLoading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : currentTeams.length === 0 ? (
            <GlassPanel className="text-center py-12 space-y-3 border-border">
              <Trophy className="w-10 h-10 mx-auto text-text-muted opacity-40" />
              <p className="text-sm font-semibold text-text-primary">No Leaderboard Data Loaded</p>
              <p className="text-xs text-text-muted max-w-md mx-auto">
                No active leaderboard rankings found. Click the button below to synchronize all competition teams directly from the database.
              </p>
              <div className="pt-2">
                <NeonButton
                  onClick={() => syncLeaderboardMutation.mutate()}
                  disabled={syncLeaderboardMutation.isPending}
                  size="sm"
                  variant="primary"
                  className="inline-flex items-center gap-1.5"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", syncLeaderboardMutation.isPending && "animate-spin")} />
                  {syncLeaderboardMutation.isPending ? "Synchronizing..." : "Synchronize Leaderboard from DB"}
                </NeonButton>
              </div>
            </GlassPanel>
          ) : (
            <div className="space-y-1.5">
              {filteredTeams.map((team: LeaderboardTeam & { originalIndex: number }) => {
                const rank = team.originalIndex + 1;
                const isTop30 = rank <= 30;
                const isWaitingList = rank > 30 && rank <= 100;
                const isDragging = draggedIndex === team.originalIndex;
                const isOver = dragOverIndex === team.originalIndex;
                const isSlotClaimed = Boolean(team.slot_id);
                const isInternational = team.category === "INTERNATIONAL";
                const isPaid =
                  isInternational ||
                  team.payment_status === "VERIFIED" ||
                  team.payment_status === "APPROVED" ||
                  Boolean(team.is_payment_cleared);
                const isSelected = selectedTeamIds.includes(team.team_id);

                return (
                  <div
                    key={team.team_id}
                    draggable={!isFilterActive}
                    onDragStart={(e) => handleDragStart(e, team.originalIndex)}
                    onDragOver={(e) => handleDragOver(e, team.originalIndex)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, team.originalIndex)}
                    className={cn(
                      "group relative flex items-center justify-between p-3 rounded-lg border transition-all select-none",
                      !isFilterActive ? "cursor-grab active:cursor-grabbing" : "cursor-default",
                      "bg-bg-surface/50 border-border hover:border-border/80 hover:bg-bg-surface/80",
                      isSelected && "border-brand-primary/60 bg-brand-primary/5",
                      isDragging && "opacity-30 border-dashed border-text-muted",
                      isOver && "border-brand-primary/60 bg-bg-surface ring-1 ring-brand-primary/30"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Checkbox for Email Selection */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectTeam(team.team_id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-border bg-bg-primary text-brand-primary focus:ring-brand-primary shrink-0 cursor-pointer"
                      />

                      {/* Drag Handle */}
                      {!isFilterActive && (
                        <div className="text-text-muted group-hover:text-text-secondary transition-colors shrink-0">
                          <GripVertical className="w-4 h-4" />
                        </div>
                      )}

                      {/* Rank Badge */}
                      <div
                        className={cn(
                          "w-8 h-8 rounded-md flex items-center justify-center font-mono font-bold text-xs shrink-0 border border-border bg-bg-primary",
                          rank === 1
                            ? "text-yellow-400 border-yellow-500/30"
                            : rank === 2
                            ? "text-slate-300 border-slate-400/30"
                            : rank === 3
                            ? "text-amber-500 border-amber-600/30"
                            : "text-text-muted"
                        )}
                      >
                        {rank}
                      </div>

                      {/* Team Info */}
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-xs text-text-primary truncate">{team.team_name}</p>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-bg-primary border border-border text-text-muted">
                            {team.team_code}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-text-muted">
                          <span>{team.category}</span>
                          <span>•</span>
                          <span>Leader: {team.leader_name || "Team Leader"}</span>
                          {team.leader_email && (
                            <>
                              <span>•</span>
                              <span className="text-text-secondary truncate max-w-[140px]">
                                {team.leader_email}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Statuses & Score */}
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Email / Slot Confirmation Status Badge */}
                      <div className="hidden sm:block">
                        {team.email_status === "CONFIRMED" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Slot Confirmed
                          </span>
                        ) : team.email_status === "REJECTED" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                            <XCircle className="w-3 h-3" /> Declined
                          </span>
                        ) : team.email_status === "SENT" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock className="w-3 h-3" /> Email Sent (Pending)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-bg-primary text-text-muted border border-border">
                            No Email Sent
                          </span>
                        )}
                      </div>

                      {/* Payment Status Pill */}
                      <div className="hidden md:block">
                        {isInternational ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            Free (Intl)
                          </span>
                        ) : isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Paid 120k
                          </span>
                        ) : team.payment_status === "PENDING" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Pay Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                            Unpaid (120k)
                          </span>
                        )}
                      </div>

                      {/* Slot Claim Status */}
                      <div className="hidden lg:block">
                        {isSlotClaimed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            <Lock className="w-3 h-3" /> Slot Claimed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-bg-primary text-text-muted border border-border">
                            Not Claimed
                          </span>
                        )}
                      </div>

                      {/* Zone Status Tag */}
                      <div className="hidden xl:block">
                        {isTop30 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Safe Zone
                          </span>
                        ) : isWaitingList ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Waiting List
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                            Eliminated
                          </span>
                        )}
                      </div>

                      {/* Final Score */}
                      <div className="text-right min-w-[55px]">
                        <p className="text-[9px] text-text-muted uppercase font-mono">Score</p>
                        <p className="text-xs font-mono font-bold text-text-primary">
                          {Number(team.average_score || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Slots Tab View */
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Battle Royale Slot Claims</h2>
              <p className="text-xs text-text-muted">
                Monitor real-time slot claiming by waiting list teams.
              </p>
            </div>
            <div className="flex gap-3 text-xs font-mono">
              <div className="px-2.5 py-1 rounded bg-bg-surface border border-border text-text-secondary">
                Claimed: <strong className="text-text-primary">{claimed.length}</strong>
              </div>
              <div className="px-2.5 py-1 rounded bg-bg-surface border border-border text-text-secondary">
                Available: <strong className="text-text-primary">{available.length}</strong>
              </div>
            </div>
          </div>

          {isSlotsLoading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : slots.length === 0 ? (
            <GlassPanel className="text-center py-12 space-y-2 border-border">
              <Sword className="w-9 h-9 mx-auto text-text-muted opacity-40" />
              <p className="text-sm font-semibold text-text-primary">Slots Not Initialized</p>
              <p className="text-xs text-text-muted">
                Slots will appear once the Battle Royale claiming phase is started.
              </p>
            </GlassPanel>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {slots.map((slot: any) => (
                <GlassPanel
                  key={slot.id}
                  className={cn(
                    "flex flex-col items-center gap-2.5 p-3.5 text-center transition-all border-border",
                    slot.claimedBy ? "bg-bg-surface/80" : "bg-bg-surface/40"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs",
                      slot.claimedBy ? "bg-brand-primary/10 text-brand-primary" : "bg-bg-primary text-text-muted border border-border"
                    )}
                  >
                    {slot.claimedBy ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </div>

                  <div className="space-y-0.5">
                    <p className="font-mono font-bold text-xs text-text-primary">Slot {slot.slotNumber}</p>
                    {slot.claimedBy ? (
                      <p className="text-[10px] text-brand-primary font-mono truncate max-w-[90px]">
                        {slot.teamCode || "Claimed"}
                      </p>
                    ) : (
                      <p className="text-[10px] text-text-muted">Available</p>
                    )}
                  </div>

                  {slot.claimedBy && (
                    <button
                      onClick={() => resetSlotMutation.mutate(slot.id)}
                      disabled={resetSlotMutation.isPending}
                      className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-0.5 transition mt-0.5"
                    >
                      <AlertTriangle className="w-2.5 h-2.5" /> Reset
                    </button>
                  )}
                </GlassPanel>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reorder Validation Popup Modal */}
      {pendingMove &&
        createPortal(
          <div
            className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[9999] w-screen h-screen min-h-[100dvh] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150 overflow-hidden"
            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100vw", height: "100vh" }}
            onClick={(e) => {
              if (e.target === e.currentTarget) cancelMove();
            }}
          >
            <div className="w-full max-w-md p-6 rounded-xl bg-bg-surface border border-border shadow-2xl space-y-4 text-left">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-bg-primary border border-border text-text-primary">
                  <ArrowUpDown className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-bold text-sm text-text-primary">Confirm Ranking Change</h3>
                  <p className="text-xs text-text-muted">Validate leaderboard position update</p>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-bg-primary/50 border border-border space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-text-muted">Team:</span>
                  <span className="font-semibold text-text-primary">{pendingMove.team.team_name}</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-2.5 rounded bg-bg-surface border border-border text-center space-y-0.5">
                    <p className="text-[10px] text-text-muted uppercase">Original Position</p>
                    <p className="text-base font-mono font-bold text-text-muted">
                      Rank #{pendingMove.fromIndex + 1}
                    </p>
                  </div>

                  <div className="p-2.5 rounded bg-bg-surface border border-brand-primary/30 text-center space-y-0.5">
                    <p className="text-[10px] text-brand-primary uppercase">New Position</p>
                    <p className="text-base font-mono font-bold text-brand-primary">
                      Rank #{pendingMove.toIndex + 1}
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-text-muted text-center pt-0.5">
                  Confirm moving this team to the new rank? If canceled, the leaderboard will revert to its previous order.
                </p>
              </div>

              {reorderMutation.isError && (
                <div className="p-2.5 rounded bg-red-950/30 border border-red-900/40 text-red-400 text-xs">
                  {(reorderMutation.error as any)?.message || "Failed to update leaderboard ranking."}
                </div>
              )}

              <div className="flex gap-2.5 pt-1">
                <NeonButton
                  onClick={cancelMove}
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  disabled={reorderMutation.isPending}
                >
                  Cancel
                </NeonButton>
                <NeonButton
                  onClick={confirmMove}
                  disabled={reorderMutation.isPending}
                  size="sm"
                  variant="primary"
                  className="flex-1"
                >
                  {reorderMutation.isPending ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-bg-primary border-t-transparent rounded-full animate-spin mr-1.5" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      Confirm Move
                    </>
                  )}
                </NeonButton>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Email Dispatcher Modal */}
      {isEmailModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[9999] w-screen h-screen min-h-[100dvh] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-150 overflow-hidden"
            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100vw", height: "100vh" }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !sendEmailMutation.isPending) {
                setIsEmailModalOpen(false);
              }
            }}
          >
            <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl bg-[#11141c] border border-border shadow-2xl overflow-hidden text-left">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-border/80 flex items-center justify-between bg-[#141822]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand-primary/10 border border-brand-primary/20 text-brand-primary shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-text-primary tracking-tight">
                      Email Notification & Slot Confirmation Dispatcher
                    </h2>
                    <p className="text-[11px] text-text-muted">
                      Broadcast official announcements or Phase 2 qualification invitations to team leaders.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-primary/80 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Segmented Tabs */}
            <div className="flex items-center justify-between px-6 py-2.5 border-b border-border/70 bg-[#0e1118]">
              <div className="inline-flex bg-[#161a26] p-1 rounded-lg border border-border/70 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setEmailTab("compose")}
                  className={cn(
                    "py-1 px-3 rounded-md flex items-center gap-1.5 transition text-[11px]",
                    emailTab === "compose"
                      ? "bg-[#212638] text-text-primary shadow-sm border border-border"
                      : "text-text-muted hover:text-text-secondary"
                  )}
                >
                  <FileText className="w-3.5 h-3.5" /> Compose & Template
                </button>
                <button
                  type="button"
                  onClick={() => setEmailTab("preview")}
                  className={cn(
                    "py-1 px-3 rounded-md flex items-center gap-1.5 transition text-[11px]",
                    emailTab === "preview"
                      ? "bg-[#212638] text-text-primary shadow-sm border border-border"
                      : "text-text-muted hover:text-text-secondary"
                  )}
                >
                  <Eye className="w-3.5 h-3.5" /> Live Preview
                </button>
                <button
                  type="button"
                  onClick={() => setEmailTab("recipients")}
                  className={cn(
                    "py-1 px-3 rounded-md flex items-center gap-1.5 transition text-[11px]",
                    emailTab === "recipients"
                      ? "bg-[#212638] text-text-primary shadow-sm border border-border"
                      : "text-text-muted hover:text-text-secondary"
                  )}
                >
                  <Users className="w-3.5 h-3.5" /> Recipients ({modalTargetTeams.length})
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-[11px] text-text-muted font-mono">
                <span>Target: <strong>{recipientType}</strong></span>
                <span>•</span>
                <span>Mode: <strong className={emailType === "SLOT_CONFIRMATION" ? "text-emerald-400" : "text-sky-400"}>{emailType === "SLOT_CONFIRMATION" ? "Confirmation Buttons" : "Announcement"}</strong></span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs bg-[#11141c]">
              {sendSuccessResult ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-text-primary">Emails Dispatched Successfully</h3>
                    <p className="text-xs text-text-muted max-w-md mx-auto">
                      Dispatched {sendSuccessResult.totalRecipients || modalTargetTeams.length} email(s) with personalized verification links directly to team leaders.
                    </p>
                  </div>
                  <div className="pt-2">
                    <NeonButton
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSendSuccessResult(null);
                        setIsEmailModalOpen(false);
                      }}
                      className="px-6"
                    >
                      Done
                    </NeonButton>
                  </div>
                </div>
              ) : emailTab === "compose" ? (
                <div className="space-y-4">
                  {/* SMTP Status Notice */}
                  {leaderboardResponse?.isEmailConfigured === false && (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-2.5 text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                      <div className="space-y-0.5">
                        <strong className="text-amber-200">Development Simulation Mode Active:</strong>
                        <p className="text-[11px] text-amber-300/80 leading-relaxed">
                          SMTP credentials (or <code>RESEND_API_KEY</code>) are not yet configured in <code>.env</code>. Action links and email logs will be recorded in the system, but real external email packets won't reach inboxes until SMTP is configured.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Preset Selector */}
                  <div>
                    <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                      Template Preset
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {EMAIL_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => applyPreset(preset.id)}
                          className={cn(
                            "p-2.5 rounded-lg border text-left transition text-xs",
                            selectedPreset === preset.id
                              ? "bg-brand-primary/10 border-brand-primary text-text-primary font-semibold shadow-sm"
                              : "bg-[#161a26] border-border/80 text-text-muted hover:border-border hover:text-text-secondary"
                          )}
                        >
                          <p className="font-medium text-xs">{preset.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target Recipient Selector & Mode */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                        Target Recipients
                      </label>
                      <select
                        value={recipientType}
                        onChange={(e) => setRecipientType(e.target.value as any)}
                        className="w-full p-2.5 rounded-lg bg-[#161a26] border border-border/80 text-text-primary focus:outline-none focus:border-border text-xs"
                      >
                        <option value="TOP30">Top 30 Teams (Safe Zone Direct Finalists)</option>
                        <option value="WAITLIST">Rank 31–100 Teams (Waiting List Pool)</option>
                        <option value="ALL">All Teams ({currentTeams.length} Teams)</option>
                        <option value="CUSTOM">
                          Selected Checkbox Teams ({selectedTeamIds.length} Teams)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                        Email Action Mode
                      </label>
                      <select
                        value={emailType}
                        onChange={(e) => setEmailType(e.target.value as any)}
                        className="w-full p-2.5 rounded-lg bg-[#161a26] border border-border/80 text-text-primary focus:outline-none focus:border-border text-xs"
                      >
                        <option value="SLOT_CONFIRMATION">
                          Slot Confirmation (Includes Claim & Reject Action Buttons)
                        </option>
                        <option value="GENERAL_INFO">
                          General Announcement / Informational (No Decision Buttons)
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* Slot Confirmation Banner Notice */}
                  {emailType === "SLOT_CONFIRMATION" && (
                    <div className="p-3 rounded-lg bg-[#141d1a] border border-emerald-500/25 text-emerald-400 flex items-start gap-2.5 text-xs">
                      <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                      <div className="space-y-0.5">
                        <strong className="text-emerald-300">Automatic Interactive Action Buttons:</strong>
                        <p className="text-[11px] text-emerald-400/80 leading-relaxed">
                          The system will automatically attach secure, signed <strong>[Claim & Confirm Slot]</strong> and <strong>[Decline / Reject Slot]</strong> buttons to each email. Responses update the team status in real time.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Override Test Recipient Email */}
                  <div className="p-3 rounded-lg bg-[#141824] border border-border/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                        Testing / Override Recipient Address (Optional)
                      </label>
                      <span className="text-[10px] text-text-muted">For dev testing & dummy teams</span>
                    </div>
                    <input
                      type="email"
                      value={testEmailOverride}
                      onChange={(e) => setTestEmailOverride(e.target.value)}
                      placeholder="e.g. compsphere@president.ac.id or your-email@gmail.com"
                      className="w-full p-2.5 rounded-lg bg-[#11141c] border border-border/80 text-text-primary focus:outline-none focus:border-brand-primary/50 font-mono text-xs"
                    />
                    <p className="text-[10px] text-text-muted">
                      When provided, all selected team emails will be dispatched to this specific inbox (perfect for testing dummy teams that don't have registered leader emails).
                    </p>
                  </div>

                  {/* Subject Field */}
                  <div>
                    <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                      Email Subject
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="e.g. [CompSphere 12] Phase 2 Qualified Slot Confirmation - {{team_name}}"
                      className="w-full p-2.5 rounded-lg bg-[#161a26] border border-border/80 text-text-primary focus:outline-none focus:border-border font-mono text-xs"
                    />
                  </div>

                  {/* Content Field & Placeholders */}
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
                      <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                        Email Body Content
                      </label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-text-muted">Insert Tag:</span>
                        {AVAILABLE_PLACEHOLDERS.map((p) => (
                          <button
                            key={p.tag}
                            type="button"
                            onClick={() => insertPlaceholder(p.tag)}
                            className="px-1.5 py-0.5 rounded bg-[#1c2232] hover:bg-[#252c42] border border-border/70 text-[10px] font-mono text-text-secondary transition"
                            title={`Click to insert ${p.label}`}
                          >
                            {p.tag}
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      rows={8}
                      value={emailContent}
                      onChange={(e) => setEmailContent(e.target.value)}
                      className="w-full p-3 rounded-lg bg-[#161a26] border border-border/80 text-text-primary focus:outline-none focus:border-border font-mono text-xs leading-relaxed"
                    />
                  </div>
                </div>
              ) : emailTab === "preview" ? (
                /* Live Preview Tab */
                <div className="space-y-3">
                  <div className="p-2.5 rounded-lg bg-[#161a26] border border-border/70 flex items-center justify-between text-xs">
                    <span className="text-text-muted">
                      Previewing sample for: <strong className="text-text-primary">{sampleTeam.team_name}</strong> (Rank #{sampleTeam.rank || 1}, {sampleTeam.category})
                    </span>
                    <span className="text-[11px] font-mono text-text-muted">
                      Leader: {sampleTeam.leader_name || "Team Leader"}
                    </span>
                  </div>

                  {/* Realistic Email Client Frame */}
                  <div className="rounded-xl bg-[#0b0e14] border border-[#22283a] p-5 text-slate-300 space-y-4 shadow-xl max-w-2xl mx-auto">
                    <div className="pb-3 border-b border-[#1c2233] space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">From: <strong>CompSphere 12 Committee &lt;compsphere@president.ac.id&gt;</strong></span>
                        <span className="text-slate-500 font-mono">Today, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        To: <strong>{sampleTeam.leader_name || "Team Leader"} &lt;{testEmailOverride.trim() || sampleTeam.leader_email || "leader@team.com"}&gt;</strong>
                      </p>
                      <p className="text-xs text-slate-200 font-semibold pt-0.5">
                        Subject: {previewRenderedSubject}
                      </p>
                    </div>

                    <div className="p-6 rounded-lg bg-[#111520] border border-[#1f273b] space-y-4">
                      {/* Hero Header Branding */}
                      <div className="text-center pb-3.5 border-b border-[#1a2234] mb-4">
                        <div className="font-extrabold text-lg tracking-[2px] uppercase text-white leading-tight">
                          COMPSPHERE <span className="text-[#00f5c8]">12</span>
                        </div>
                        <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-[#94a3b8] mt-0.5">
                          INTERNATIONAL <span className="text-[#00f5c8]">WEB3</span> HACKATHON
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-white tracking-tight">{previewRenderedSubject}</h3>

                      <div className="text-xs leading-relaxed text-slate-300 whitespace-pre-line">
                        {previewRenderedBody}
                      </div>

                      {/* Team Verification Card */}
                      <div className="p-3.5 rounded-lg bg-[#0b0e16] border border-[#1a2234] space-y-2 text-xs">
                        <p className="text-[10px] font-bold text-[#00f5c8] uppercase tracking-wider">
                          Team Verification Details
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-500 text-[10px]">Team Name:</span>
                            <p className="font-semibold text-white">{sampleTeam.team_name}</p>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[10px]">Category:</span>
                            <p className="font-semibold text-white">{sampleTeam.category}</p>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[10px]">Team Code:</span>
                            <p className="font-mono font-semibold text-white">{sampleTeam.team_code}</p>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[10px]">Status:</span>
                            <p className="font-bold text-[#00f5c8] font-mono">
                              {Number(sampleTeam.rank || 1) <= 30 ? "Phase 2 Finalist (Qualified)" : "Waiting List Pool"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Buttons Preview */}
                      {emailType === "SLOT_CONFIRMATION" ? (
                        <div className="pt-2 text-center space-y-2">
                          <p className="text-[11px] text-slate-400">
                            Please confirm your participation status for Phase 2:
                          </p>
                          <div className="flex flex-wrap items-center justify-center gap-3">
                            <span className="px-5 py-2.5 rounded-lg bg-[#10b981] text-white font-bold text-xs shadow-md shadow-emerald-500/20 cursor-default">
                              ✓ Claim &amp; Confirm Slot
                            </span>
                            <span className="px-4 py-2.5 rounded-lg bg-[#232c3d] text-white border border-[#37445c] font-semibold text-xs cursor-default">
                              ✕ Decline / Reject Slot
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 pt-1">
                            Links to the official secure CompSphere response portal.
                          </p>
                        </div>
                      ) : (
                        <div className="pt-2 text-center">
                          <span className="px-5 py-2 rounded-lg bg-[#2563eb] text-white font-bold text-xs cursor-default">
                            Visit CompSphere Portal →
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Recipients Tab */
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border/70">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text-primary text-xs">
                        {modalTargetTeams.length} Team(s) in Target Group
                      </span>
                      <span className="text-text-muted text-[11px]">
                        Mode: <strong className="text-text-primary font-mono">{recipientType}</strong>
                      </span>
                    </div>

                    <div className="w-full sm:w-60">
                      <input
                        type="text"
                        placeholder="Filter recipients..."
                        value={recipientSearchQuery}
                        onChange={(e) => setRecipientSearchQuery(e.target.value)}
                        className="w-full px-2.5 py-1 rounded bg-[#161a26] border border-border/80 text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
                      />
                    </div>
                  </div>

                  {filteredModalRecipients.length === 0 ? (
                    <div className="py-12 text-center text-text-muted">
                      No recipients match this selection.
                    </div>
                  ) : (
                    <div className="max-h-[350px] overflow-y-auto space-y-1.5 pr-1">
                      {filteredModalRecipients.map((team: LeaderboardTeam, idx: number) => {
                        const destinationEmail = testEmailOverride.trim() || team.leader_email;
                        return (
                          <div
                            key={team.team_id}
                            className="flex items-center justify-between p-2.5 rounded-lg bg-[#161a26] border border-border/70 text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-6 h-6 rounded bg-[#1c2232] flex items-center justify-center font-mono font-bold text-[10px] text-text-muted shrink-0">
                                #{idx + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="font-semibold text-text-primary truncate">{team.team_name}</p>
                                <p className="text-[10px] text-text-muted">
                                  {team.team_code} • {team.category}
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              {destinationEmail ? (
                                <p className="text-[11px] font-mono text-emerald-400">
                                  {destinationEmail}
                                  {testEmailOverride.trim() && (
                                    <span className="ml-1 text-[9px] text-text-muted uppercase font-sans">(Override)</span>
                                  )}
                                </p>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono">
                                  No email in DB (Set override to test)
                                </span>
                              )}
                              <p className="text-[10px] text-text-muted">{team.leader_name || "Leader"}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            {!sendSuccessResult && (
              <div className="px-6 py-3.5 border-t border-border/80 bg-[#141822] flex items-center justify-between gap-3">
                <div className="text-xs text-text-muted">
                  Sending to <strong className="text-text-primary font-mono">{modalTargetTeams.length}</strong> team leader(s)
                  {testEmailOverride.trim() && (
                    <span className="ml-1.5 text-emerald-400 font-mono text-[11px]">
                      (Routing all to {testEmailOverride.trim()})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <NeonButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsEmailModalOpen(false)}
                    disabled={sendEmailMutation.isPending}
                  >
                    Cancel
                  </NeonButton>

                  <button
                    type="button"
                    onClick={() =>
                      sendEmailMutation.mutate({
                        recipientType,
                        selectedTeamIds: recipientType === "CUSTOM" ? selectedTeamIds : undefined,
                        emailType,
                        subject: emailSubject,
                        content: emailContent,
                        testEmailOverride: testEmailOverride.trim() || undefined,
                      })
                    }
                    disabled={sendEmailMutation.isPending || modalTargetTeams.length === 0}
                    className="py-2 px-4 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-bg-primary font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-brand-primary/20 disabled:opacity-50"
                  >
                    {sendEmailMutation.isPending ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-bg-primary border-t-transparent rounded-full animate-spin mr-1" />
                        Sending {modalTargetTeams.length} Emails...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Send Emails to {modalTargetTeams.length} Teams
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default BattleRoyale;
