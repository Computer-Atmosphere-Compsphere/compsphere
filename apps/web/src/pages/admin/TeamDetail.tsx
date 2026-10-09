import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { api, getUploadUrl } from "@/lib/api";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { NeonButton } from "@/components/compsphere/NeonButton";
import { StatusBadge } from "@/components/compsphere/StatusBadge";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  User,
  Trophy,
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  FileText,
  ExternalLink,
  Calendar,
  Clock,
  CreditCard,
  Send,
  ScanLine,
  AlertCircle,
  ShieldAlert,
  Eye,
  FileImage,
  Edit3,
  Save,
  Mail,
  Globe,
  Award,
  AlertTriangle,
  UserCheck,
  Hash,
  Sparkles,
  Scale,
  Lock,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  TeamStatus,
  TeamCategory,
  TokenStatus,
  PaymentStatus,
  SubmissionStatus,
  AttendanceType,
} from "@compsphere/types";

type RundownKind =
  | "TEAM_REGISTERED"
  | "TOKEN_ISSUED"
  | "TOKEN_ACTIVATED"
  | "PAYMENT_SUBMITTED"
  | "PAYMENT_VERIFIED"
  | "PAYMENT_REJECTED"
  | "TEAM_VERIFIED"
  | "TEAM_DROPPED"
  | "SUBMISSION_SUBMITTED"
  | "ATTENDANCE_SCANNED";

interface RundownEvent {
  id: string;
  kind: RundownKind;
  title: string;
  description: string;
  timestamp: string;
  actorName?: string | null;
  meta?: Record<string, string | number | null>;
}

const STATUS_STYLE: Record<TokenStatus, string> = {
  ISSUED: "bg-blue-950/40 text-blue-400 border-blue-900/50",
  ACTIVATED: "bg-brand-dim text-brand-primary border-brand-primary/20",
  REVOKED: "bg-red-950/40 text-red-400 border-red-900/50",
  EXPIRED: "bg-zinc-800 text-zinc-400 border-zinc-700",
};

const PAYMENT_STATUS_STYLE: Record<PaymentStatus, string> = {
  PENDING: "bg-yellow-950/40 text-yellow-400 border-yellow-900/50",
  APPROVED: "bg-brand-dim text-brand-primary border-brand-primary/20",
  REJECTED: "bg-red-950/40 text-red-400 border-red-900/50",
};

const SUBMISSION_STATUS_STYLE: Record<SubmissionStatus, string> = {
  DRAFT: "bg-zinc-800 text-zinc-400 border-zinc-700",
  SUBMITTED: "bg-cyan-950/40 text-cyan-400 border-cyan-900/50",
  LOCKED: "bg-brand-dim text-brand-primary border-brand-primary/20",
};

const ATTENDANCE_LABEL: Record<AttendanceType, string> = {
  DAY1: "Day 1 Check-in",
  DAY2: "Day 2 Check-in",
  CEREMONY: "Closing Ceremony",
};

const CATEGORY_BADGE: Record<TeamCategory, string> = {
  NATIONAL: "bg-sky-950/40 text-sky-400 border-sky-900/50",
  MIX: "bg-amber-950/40 text-amber-400 border-amber-900/50",
  INTERNATIONAL: "bg-purple-950/40 text-purple-400 border-purple-900/50",
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TeamDetail() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [lastRegeneratedToken, setLastRegeneratedToken] = useState<string | null>(null);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showDropConfirm, setShowDropConfirm] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showScorePassword, setShowScorePassword] = useState(false);
  const [initialScore, setInitialScore] = useState<string>("");
  const [viewerFile, setViewerFile] = useState<{ url: string; name: string } | null>(null);

  const [editForm, setEditForm] = useState<{
    teamName: string;
    category: TeamCategory;
    countryMix: string;
    originalRank: number;
    status: TeamStatus;
    paymentRequired: boolean;
    paymentAmount: number;
    leaderMemberId: string;
    leaderName: string;
    leaderEmail: string;
    scoreOverride: string;
    scoreAuthPassword: string;
    riskAcknowledged: boolean;
  }>({
    teamName: "",
    category: "NATIONAL",
    countryMix: "",
    originalRank: 1,
    status: "NEW",
    paymentRequired: true,
    paymentAmount: 0,
    leaderMemberId: "",
    leaderName: "",
    leaderEmail: "",
    scoreOverride: "",
    scoreAuthPassword: "",
    riskAcknowledged: false,
  });

  const { data, isLoading } = useQuery<any>({
    queryKey: ["admin-team-detail", teamId],
    queryFn: () => api.get(`/api/teams/${teamId}`),
    enabled: !!teamId,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });

  const isScoreBeingModified =
    editForm.scoreOverride.trim() !== "" &&
    (editForm.scoreOverride.trim() !== initialScore.trim() || editForm.scoreAuthPassword.trim() !== "");

  const updateTeamMutation = useMutation({
    mutationFn: (form: typeof editForm) => {
      const payload: Record<string, any> = {
        teamId,
        teamName: form.teamName.trim(),
        category: form.category,
        countryMix: form.countryMix.trim() || null,
        originalRank: form.originalRank,
        status: form.status,
        paymentRequired: form.paymentRequired,
        paymentAmount: form.paymentAmount,
      };
      if (form.leaderMemberId) {
        payload.leaderMemberId = form.leaderMemberId;
      }
      if (form.leaderName && form.leaderName.trim()) {
        payload.leaderName = form.leaderName.trim();
      }
      if (form.leaderEmail && form.leaderEmail.trim()) {
        payload.leaderEmail = form.leaderEmail.trim();
      }
      if (isScoreBeingModified) {
        payload.scoreOverride = Number(form.scoreOverride);
        payload.scoreAuthPassword = form.scoreAuthPassword.trim();
      }
      return api.put("/api/admin/update-team", payload);
    },
    onSuccess: () => {
      setShowEditModal(false);
      queryClient.invalidateQueries({ queryKey: ["admin-team-detail", teamId] });
      queryClient.invalidateQueries({ queryKey: ["admin-teams"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["admin-leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["admin-judges"] });
    },
  });

  const handleOpenEdit = () => {
    if (!data?.team) return;
    const t = data.team;
    const membersList = data.members || [];
    const currentLeader = membersList.find((m: any) => m.role === "TEAM_LEADER") || membersList[0];

    const currentScore =
      data.averageScore !== null && data.averageScore !== undefined
        ? String(data.averageScore)
        : data.scores && data.scores.length > 0
        ? String(data.scores[0].finalScore)
        : "";

    setInitialScore(currentScore);
    setEditForm({
      teamName: t.teamName || "",
      category: t.category || "NATIONAL",
      countryMix: t.countryMix || "",
      originalRank: t.originalRank ?? 1,
      status: t.status || "NEW",
      paymentRequired: Boolean(t.paymentRequired),
      paymentAmount: t.paymentAmount ?? 0,
      leaderMemberId: currentLeader?.id || "",
      leaderName: currentLeader?.user?.fullName || "",
      leaderEmail: currentLeader?.user?.email || "",
      scoreOverride: currentScore,
      scoreAuthPassword: "",
      riskAcknowledged: false,
    });
    setShowScorePassword(false);
    setShowEditModal(true);
  };

  const verifyMutation = useMutation({
    mutationFn: () => api.post("/api/admin/verify-team", { teamId }),
    onSuccess: () => {
      setShowApproveConfirm(false);
      queryClient.invalidateQueries({ queryKey: ["admin-team-detail", teamId] });
      queryClient.invalidateQueries({ queryKey: ["admin-teams"] });
    },
  });

  const dropMutation = useMutation({
    mutationFn: () => api.post("/api/admin/drop-team", { teamId }),
    onSuccess: () => {
      setShowDropConfirm(false);
      queryClient.invalidateQueries({ queryKey: ["admin-team-detail", teamId] });
      queryClient.invalidateQueries({ queryKey: ["admin-teams"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
    },
  });

  const regenerateTokenMutation = useMutation({
    mutationFn: () => api.post<{ rawToken: string; expiresAt: string }>(
      "/api/admin/regenerate-team-token",
      { teamId }
    ),
    onSuccess: (res: any) => {
      setLastRegeneratedToken(res.rawToken);
      queryClient.invalidateQueries({ queryKey: ["admin-team-detail", teamId] });
    },
  });

  const rundown = useMemo<RundownEvent[]>(() => {
    if (!data) return [];
    const events: RundownEvent[] = [];
    const { team, payments = [], submissions = [], attendance = [], token } = data;

    if (team?.createdAt) {
      events.push({
        id: `created-${team.id}`,
        kind: "TEAM_REGISTERED",
        title: "Team registered / imported",
        description: `Imported with rank #${team.originalRank} as ${team.category}.`,
        timestamp: team.createdAt,
      });
    }

    if (token) {
      events.push({
        id: `token-${token.id}`,
        kind: token.status === "ACTIVATED" ? "TOKEN_ACTIVATED" : "TOKEN_ISSUED",
        title:
          token.status === "ACTIVATED"
            ? "Activation token redeemed"
            : token.status === "REVOKED"
            ? "Activation token revoked"
            : token.status === "EXPIRED"
            ? "Activation token expired"
            : "Activation token issued",
        description: token.status === "ACTIVATED"
          ? "Team leader redeemed the token and accepted the slot."
          : "Token generated and ready for the team leader to redeem.",
        timestamp: token.activatedAt ?? token.createdAt,
      });
    }

    if (team?.confirmationStartedAt) {
      events.push({
        id: `confirm-${team.id}-start`,
        kind: "TOKEN_ACTIVATED",
        title: "Confirmation window started",
        description: `48-hour countdown began on this date.`,
        timestamp: team.confirmationStartedAt,
      });
    }

    for (const p of payments) {
      events.push({
        id: `payment-${p.id}-submitted`,
        kind: "PAYMENT_SUBMITTED",
        title:
          p.amount === 0
            ? "Document / ID letter submitted"
            : `Payment proof submitted (Rp${p.amount.toLocaleString("id-ID")})`,
        description: p.proofFilename
          ? `File: ${p.proofFilename}`
          : "Awaiting committee review.",
        timestamp: p.submittedAt,
      });
      if (p.verifiedAt) {
        events.push({
          id: `payment-${p.id}-verified`,
          kind: p.status === "APPROVED" ? "PAYMENT_VERIFIED" : "PAYMENT_REJECTED",
          title: p.status === "APPROVED" ? "Payment approved" : "Payment rejected",
          description:
            p.status === "REJECTED" && p.rejectionReason
              ? `Reason: ${p.rejectionReason}`
              : "Committee review completed.",
          timestamp: p.verifiedAt,
        });
      }
    }

    if (team?.status === "VERIFIED") {
      events.push({
        id: `team-verified-${team.id}`,
        kind: "TEAM_VERIFIED",
        title: "Team verified & confirmed",
        description: "All checks passed. The team advances to Phase 2.",
        timestamp: team.updatedAt,
      });
    }
    if (team?.status === "DROPPED") {
      events.push({
        id: `team-dropped-${team.id}`,
        kind: "TEAM_DROPPED",
        title: "Team dropped from competition",
        description: "Slot has been returned to the waitlist pool.",
        timestamp: team.updatedAt,
      });
    }

    for (const s of submissions) {
      events.push({
        id: `submission-${s.id}`,
        kind: "SUBMISSION_SUBMITTED",
        title:
          s.status === "LOCKED"
            ? "Final deliverables locked"
            : "Phase 2 deliverables submitted",
        description: s.repositoryUrl
          ? `Repo: ${s.repositoryUrl}`
          : "Repository link pending.",
        timestamp: s.submittedAt,
      });
    }

    for (const a of attendance) {
      events.push({
        id: `att-${a.id}`,
        kind: "ATTENDANCE_SCANNED",
        title: `${ATTENDANCE_LABEL[a.attendanceType as AttendanceType] ?? a.attendanceType} — attendance recorded`,
        description: a.profile?.fullName
          ? `Member: ${a.profile.fullName}`
          : "Member attendance scanned.",
        timestamp: a.scannedAt,
      });
    }

    return events.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 space-y-2">
        <AlertCircle className="w-8 h-8 text-text-muted mx-auto" />
        <p className="text-sm font-bold text-text-primary">Team not found</p>
        <p className="text-xs text-text-muted">The team may have been removed.</p>
        <NeonButton size="sm" onClick={() => navigate("/admin/teams")} className="mt-3">
          Back to All Teams
        </NeonButton>
      </div>
    );
  }

  const { team, members = [], payments = [], submissions = [], attendance = [], proposal, token } = data;
  const leader = members.find((m: any) => m.role === "TEAM_LEADER");

  const copyToClipboard = async (value: string, field?: string) => {
    try {
      await navigator.clipboard.writeText(value);
      if (field) {
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
      } else {
        setCopiedToken(value);
        setTimeout(() => setCopiedToken(null), 2000);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/admin/teams")}
          className="p-2 rounded hover:bg-bg-surface transition text-text-muted hover:text-text-primary"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider bg-brand-dim px-2 py-0.5 rounded">
              {team?.teamCode}
            </span>
            <span
              className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded border",
                CATEGORY_BADGE[team?.category as TeamCategory] ??
                  "bg-bg-surface text-text-secondary border-border"
              )}
            >
              {team?.category}
            </span>
            {team && <StatusBadge status={team.status as TeamStatus} />}
          </div>
          <h1 className="text-2xl font-extrabold text-text-primary truncate">{team?.teamName}</h1>
        </div>

        <div className="flex gap-2 shrink-0">
          <NeonButton
            onClick={handleOpenEdit}
            variant="secondary"
            size="sm"
          >
            <Edit3 className="w-4 h-4 mr-1.5" />
            Edit Team
          </NeonButton>
          {team?.status === "VERIFICATION_PENDING" && (
            <NeonButton
              onClick={() => setShowApproveConfirm(true)}
              disabled={verifyMutation.isPending}
              size="sm"
            >
              <CheckCircle className="w-4 h-4 mr-1.5" />
              Approve
            </NeonButton>
          )}
          {!["DROPPED", "WAITLIST"].includes(team?.status) && (
            <NeonButton
              onClick={() => setShowDropConfirm(true)}
              disabled={dropMutation.isPending}
              variant="destructive"
              size="sm"
            >
              <XCircle className="w-4 h-4 mr-1.5" />
              Drop
            </NeonButton>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Left column: core info + members ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Team Info */}
          <GlassPanel className="space-y-5">
            <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
              <Trophy className="w-4 h-4 text-brand-primary" />
              Team Information
            </h3>
            <div className="grid sm:grid-cols-2 gap-y-3 gap-x-6 text-xs">
              <Detail label="Original Rank" value={`#${team?.originalRank}`} mono />
              <Detail
                label="Category"
                value={
                  team?.countryMix
                    ? `${team?.category} (${team?.countryMix})`
                    : team?.category
                }
              />
              <Detail label="Status" value={team?.status} />
              <Detail
                label="Phase 1 Judge Score"
                value={
                  data?.averageScore !== null && data?.averageScore !== undefined
                    ? `${Number(data.averageScore).toFixed(2)} (${data.judgeCount ?? 0} judge${(data.judgeCount ?? 0) === 1 ? "" : "s"})`
                    : team?.status === "JUDGED"
                    ? "Judged (score pending)"
                    : "Not judged yet"
                }
                mono
              />
              <Detail
                label="Team Leader"
                value={
                  leader ? (
                    <span>
                      <span className="font-semibold text-text-primary">{leader.user?.fullName}</span>
                      <span className="text-text-muted text-[11px] block">{leader.user?.email}</span>
                    </span>
                  ) : (
                    "No leader assigned"
                  )
                }
              />
              <Detail
                label="Payment Required"
                value={team?.paymentRequired ? `Yes (Rp${team?.paymentAmount.toLocaleString("id-ID")})` : "No"}
              />
              <Detail
                label="Confirmation Started"
                value={formatDate(team?.confirmationStartedAt)}
              />
              <Detail
                label="Confirmation Deadline"
                value={formatDate(team?.confirmationDeadline)}
              />
              <Detail label="Created" value={formatDate(team?.createdAt)} />
              <Detail label="Last Update" value={formatDate(team?.updatedAt)} />
            </div>
          </GlassPanel>

          {/* Proposal Preview */}
          <GlassPanel className="space-y-4">
            <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-primary" />
              Proposal Preview
            </h3>
            {proposal ? (
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">
                    Title
                  </p>
                  <p className="text-sm font-bold text-text-primary mt-1">{proposal.title}</p>
                </div>
                {proposal.description && (
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">
                      Abstract
                    </p>
                    <p className="text-xs text-text-secondary leading-relaxed mt-1 whitespace-pre-line">
                      {proposal.description}
                    </p>
                  </div>
                )}
                {proposal.devpostUrl && (
                  <a
                    href={proposal.devpostUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-brand-primary hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View on Devpost
                  </a>
                )}
                {proposal.files && proposal.files.length > 0 && (
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold mb-2">
                      Proposal Files
                    </p>
                    <div className="space-y-1.5">
                      {proposal.files.map((f: any) => (
                        <button
                          key={f.id}
                          onClick={() => setViewerFile({ url: getUploadUrl(f.storageKey), name: f.originalFilename })}
                          className="w-full flex items-center justify-between p-2.5 rounded bg-bg-surface border border-border/60 hover:border-brand-primary/40 transition-colors text-left"
                        >
                          <span className="flex items-center gap-2 text-xs text-text-primary">
                            <FileText className="w-3.5 h-3.5 text-brand-primary" />
                            {f.originalFilename}
                          </span>
                          <span className="text-[10px] text-text-muted font-mono">
                            {formatBytes(f.sizeBytes)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {(!proposal.files || proposal.files.length === 0) && (
                  <p className="text-[10px] text-text-muted italic">
                    No proposal files uploaded.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-text-muted">No proposal linked to this team yet.</p>
            )}
          </GlassPanel>

          {/* Members */}
          <GlassPanel className="space-y-4">
            <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
              <User className="w-4 h-4 text-brand-primary" />
              Members ({members.length})
            </h3>
            <div className="divide-y divide-border/40">
              {members.map((m: any) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {m.user?.avatarUrl ? (
                      <img
                        src={m.user.avatarUrl}
                        alt="Avatar"
                        className="w-8 h-8 rounded-full border border-border"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-bg-surface border border-border flex items-center justify-center text-xs font-bold text-brand-primary">
                        {m.user?.fullName?.[0] ?? "?"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-text-primary truncate">
                        {m.user?.fullName}
                      </p>
                      <p className="text-xs text-text-muted truncate">{m.user?.email}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded uppercase border shrink-0",
                      m.role === "TEAM_LEADER"
                        ? "bg-brand-dim text-brand-primary border-brand-primary/20"
                        : "bg-bg-surface text-text-secondary border-border"
                    )}
                  >
                    {m.role === "TEAM_LEADER" ? "Leader" : "Member"}
                  </span>
                </div>
              ))}
              {members.length === 0 && (
                <p className="text-xs text-text-muted py-3">No active members.</p>
              )}
            </div>
          </GlassPanel>
        </div>

        {/* ── Right column: token + rundown + payments + submissions ── */}
        <div className="space-y-6">
          {/* Team Token */}
          <GlassPanel
            className={cn(
              "space-y-4",
              token && "border-brand-primary/20"
            )}
          >
            <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-brand-primary" />
              Team Activation Token
            </h3>

            {token ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">
                    Current Status
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded border uppercase",
                      STATUS_STYLE[token.status as TokenStatus]
                    )}
                  >
                    {token.status}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  {/* Token ID with copy button */}
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">
                      Token ID
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-text-primary font-mono break-all flex-1">
                        {token.id}
                      </p>
                      <button
                        onClick={() => copyToClipboard(token.id, "tokenId")}
                        className="p-1.5 rounded bg-bg-surface border border-border hover:border-brand-primary/40 text-text-muted hover:text-brand-primary transition-colors shrink-0"
                        aria-label="Copy token ID"
                      >
                        {copiedField === "tokenId" ? (
                          <Check className="w-3.5 h-3.5 text-brand-primary" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <Detail
                    label="Issued At"
                    value={formatDate(token.createdAt)}
                  />
                  <Detail
                    label="Expires At"
                    value={formatDate(token.expiresAt)}
                  />
                  <Detail
                    label="Activated At"
                    value={formatDate(token.activatedAt)}
                  />
                </div>

                {/* Regenerate action — available for any token status */}
                <div className="pt-3 border-t border-border/40 space-y-2">
                  <NeonButton
                    onClick={() => setShowRegenerateConfirm(true)}
                    disabled={regenerateTokenMutation.isPending}
                    size="sm"
                    variant="secondary"
                    className="w-full"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Regenerate Token
                  </NeonButton>
                  <p className="text-[10px] text-text-muted leading-relaxed">
                    {token.status === "ACTIVATED"
                      ? "Generates a new token for members who haven't joined the team yet. The existing activated token will remain valid."
                      : "Revokes the current token and issues a new one. The new raw token will be shown only once."}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-text-muted">
                No activation token has been issued (e.g. waitlist team).
              </p>
            )}

            {/* Newly regenerated token reveal — show once */}
            {lastRegeneratedToken && (
              <div className="space-y-2 pt-3 border-t border-brand-primary/30">
                <p className="text-[10px] text-brand-primary uppercase tracking-widest font-bold">
                  New Token (copy now — shown only once)
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={lastRegeneratedToken}
                    className="w-full text-[10px] font-mono px-2.5 py-2 rounded bg-bg-surface border border-brand-primary/30 text-text-primary focus:outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(lastRegeneratedToken)}
                    className="p-2 rounded bg-brand-primary text-bg-primary hover:bg-brand-secondary active:scale-95 transition-all"
                    aria-label="Copy token"
                  >
                    {copiedToken === lastRegeneratedToken ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </GlassPanel>

          {/* Payments */}
          <GlassPanel className="space-y-3">
            <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand-primary" />
              Payments & Documents
            </h3>
            {payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((p: any) => {
                  const fileUrl = p.proofStorageKey ? getUploadUrl(p.proofStorageKey) : null;
                  const fileName = p.proofFilename || "Payment Proof";
                  const isPdf = fileName.toLowerCase().endsWith(".pdf") || (p.proofStorageKey || "").toLowerCase().endsWith(".pdf");

                  return (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-lg bg-bg-surface border border-border/60 space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-primary font-bold">
                          {p.amount === 0
                            ? "Document / ID letter"
                            : `Rp${p.amount.toLocaleString("id-ID")}`}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase",
                            PAYMENT_STATUS_STYLE[p.status as PaymentStatus]
                          )}
                        >
                          {p.status}
                        </span>
                      </div>

                      {p.proofStorageKey && fileUrl && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] text-text-muted">
                            <span className="truncate max-w-[180px] font-medium">{fileName}</span>
                            <button
                              onClick={() => setViewerFile({ url: fileUrl, name: fileName })}
                              className="text-brand-primary hover:underline font-semibold flex items-center gap-1 shrink-0"
                            >
                              <Eye className="w-3 h-3" /> Full View
                            </button>
                          </div>

                          {isPdf ? (
                            <button
                              onClick={() => setViewerFile({ url: fileUrl, name: fileName })}
                              className="w-full flex items-center gap-2.5 p-2.5 rounded bg-bg-surface/80 border border-border/80 hover:border-brand-primary/40 transition-colors text-left"
                            >
                              <FileText className="w-4 h-4 text-red-400 shrink-0" />
                              <span className="text-xs text-text-primary font-medium truncate flex-1">{fileName}</span>
                              <Eye className="w-3.5 h-3.5 text-text-muted shrink-0" />
                            </button>
                          ) : (
                            <div
                              onClick={() => setViewerFile({ url: fileUrl, name: fileName })}
                              className="relative group cursor-pointer overflow-hidden rounded border border-border/80 bg-neutral-950/80 max-h-48 flex items-center justify-center transition-all hover:border-brand-primary/50"
                            >
                              <img
                                src={fileUrl}
                                alt={fileName}
                                className="w-full max-h-48 object-contain rounded transition-transform duration-300 group-hover:scale-[1.02]"
                                loading="lazy"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                  const parent = target.parentElement;
                                  if (parent) {
                                    const fallback = parent.querySelector(".img-fallback") as HTMLElement;
                                    if (fallback) fallback.style.display = "flex";
                                  }
                                }}
                              />
                              <div className="img-fallback hidden flex-col items-center justify-center p-4 text-center text-text-muted space-y-1">
                                <FileText className="w-6 h-6 text-brand-primary" />
                                <p className="text-xs font-bold text-text-primary">{fileName}</p>
                                <span className="text-[10px] text-brand-primary">Click to view</span>
                              </div>
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold backdrop-blur-[2px]">
                                <Eye className="w-3.5 h-3.5 text-brand-primary" />
                                <span>View Image</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <p className="text-[10px] text-text-muted">
                        Submitted {formatDate(p.submittedAt)}
                      </p>
                      {p.rejectionReason && (
                        <p className="text-[10px] text-red-400 italic bg-red-950/30 p-2 rounded border border-red-900/40">
                          Rejected: {p.rejectionReason}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-text-muted">No payments or documents submitted.</p>
            )}
          </GlassPanel>

          {/* Submissions (Phase 2) */}
          {submissions.length > 0 && (
            <GlassPanel className="space-y-3">
              <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
                <Send className="w-4 h-4 text-brand-primary" />
                Phase 2 Submissions
              </h3>
              <div className="space-y-2">
                {submissions.map((s: any) => (
                  <div
                    key={s.id}
                    className="p-3 rounded bg-bg-surface border border-border/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-primary font-semibold">Deliverables</span>
                      <span
                        className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase",
                          SUBMISSION_STATUS_STYLE[s.status as SubmissionStatus]
                        )}
                      >
                        {s.status}
                      </span>
                    </div>
                    <a
                      href={s.repositoryUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-[10px] text-brand-primary hover:underline truncate"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {s.repositoryUrl}
                    </a>
                    {s.deploymentUrl && (
                      <a
                        href={s.deploymentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[10px] text-brand-primary hover:underline truncate"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {s.deploymentUrl}
                      </a>
                    )}
                    <p className="text-[10px] text-text-muted">
                      Submitted {formatDate(s.submittedAt)}
                    </p>
                  </div>
                ))}
              </div>
            </GlassPanel>
          )}

          {/* Attendance summary */}
          {attendance.length > 0 && (
            <GlassPanel className="space-y-3">
              <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
                <ScanLine className="w-4 h-4 text-brand-primary" />
                Attendance Log
              </h3>
              <div className="space-y-1.5 text-xs">
                {attendance.slice(0, 6).map((a: any) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between text-text-secondary"
                  >
                    <span>
                      {ATTENDANCE_LABEL[a.attendanceType as AttendanceType] ?? a.attendanceType}
                      {a.profile?.fullName ? ` — ${a.profile.fullName}` : ""}
                    </span>
                    <span className="text-[10px] text-text-muted font-mono">
                      {formatDate(a.scannedAt)}
                    </span>
                  </div>
                ))}
                {attendance.length > 6 && (
                  <p className="text-[10px] text-text-muted">
                    +{attendance.length - 6} more entries
                  </p>
                )}
              </div>
            </GlassPanel>
          )}
        </div>
      </div>

      {/* ── Synthetic Rundown Timeline (full width) ── */}
      <GlassPanel className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-primary" />
            Team Rundown
          </h3>
          <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">
            {rundown.length} {rundown.length === 1 ? "event" : "events"}
          </span>
        </div>

        {rundown.length === 0 ? (
          <p className="text-xs text-text-muted">No events recorded for this team yet.</p>
        ) : (
          <ol className="relative border-l border-border/60 ml-2 space-y-5">
            {rundown.map((ev) => (
              <li key={ev.id} className="pl-6 relative">
                <span
                  className={cn(
                    "absolute -left-2 top-1 w-4 h-4 rounded-full flex items-center justify-center",
                    ev.kind === "TEAM_DROPPED" || ev.kind === "PAYMENT_REJECTED"
                      ? "bg-red-950/60 border border-red-900"
                      : ev.kind === "TEAM_VERIFIED" || ev.kind === "PAYMENT_VERIFIED"
                      ? "bg-brand-dim border border-brand-primary/40"
                      : "bg-bg-surface border border-brand-primary/40"
                  )}
                >
                  <Clock className="w-2.5 h-2.5 text-brand-primary" />
                </span>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-text-primary">{ev.title}</p>
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    {ev.description}
                  </p>
                  <p className="text-[10px] text-text-muted font-mono">
                    {formatDate(ev.timestamp)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </GlassPanel>

      {/* ── Regenerate Token Confirmation Modal ── */}
      {showRegenerateConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowRegenerateConfirm(false)}
        >
          <div
            className="w-full max-w-md mx-4 rounded-xl border border-brand-primary/40 bg-bg-secondary shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-5">
              {/* Icon + Title */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-950/60 border border-amber-900/50 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-text-primary">
                    Regenerate Access Token?
                  </h3>
                  <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">
                    {token?.status === "ACTIVATED" ? "New token for remaining members" : "This will revoke the current token"}
                  </p>
                </div>
              </div>

              {/* Team summary */}
              <div className="p-3 rounded-lg bg-bg-surface border border-border/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">
                    Team
                  </span>
                  <span className="text-[10px] font-bold text-brand-primary bg-brand-dim px-2 py-0.5 rounded uppercase">
                    {team?.teamCode}
                  </span>
                </div>
                <p className="text-sm font-bold text-text-primary truncate">
                  {team?.teamName}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-text-muted">
                  <span>Rank #{team?.originalRank}</span>
                  <span>·</span>
                  <span>{team?.category}</span>
                  <span>·</span>
                  <span>{team?.status}</span>
                </div>
              </div>

              {/* Current token status info */}
              <div className="p-3 rounded-lg border space-y-2">
                {token?.status === "ACTIVATED" ? (
                  <>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-text-secondary leading-relaxed">
                        This team already has a <strong className="text-green-400">leader activated</strong> with the current token.
                      </p>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      A new access token will be generated so that <strong>remaining members</strong> who haven't joined yet can redeem it to join the team.
                    </p>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-text-muted leading-relaxed">
                        The existing activated token will <strong className="text-text-primary">remain valid</strong> for the current leader.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-text-secondary leading-relaxed">
                        The current <strong className="text-amber-400">{token?.status}</strong> token will be <strong className="text-red-400">revoked</strong> and a brand new token will be issued.
                      </p>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Share the new raw token with the team leader securely — it will only be shown once.
                    </p>
                  </>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-1">
                <NeonButton
                  onClick={() => setShowRegenerateConfirm(false)}
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                >
                  Cancel
                </NeonButton>
                <NeonButton
                  onClick={() => {
                    setShowRegenerateConfirm(false);
                    regenerateTokenMutation.mutate();
                  }}
                  disabled={regenerateTokenMutation.isPending}
                  variant="primary"
                  size="sm"
                  className="flex-1"
                >
                  {regenerateTokenMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-bg-primary border-t-transparent rounded-full animate-spin mr-1.5" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-1.5" />
                      {token?.status === "ACTIVATED" ? "Generate New Token" : "Yes, Regenerate"}
                    </>
                  )}
                </NeonButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Approve Team Confirmation Modal ── */}
      {showApproveConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowApproveConfirm(false)}
        >
          <div
            className="w-full max-w-md mx-4 rounded-xl border border-green-900/40 bg-bg-secondary shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-950/60 border border-green-900/50 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-text-primary">Approve & Verify Team?</h3>
                  <p className="text-xs text-green-400/80">This will approve the team and update their status to VERIFIED.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-bg-surface border border-border/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Team</span>
                  <span className="text-[10px] font-bold text-brand-primary bg-brand-dim px-2 py-0.5 rounded uppercase">
                    {team?.teamCode}
                  </span>
                </div>
                <p className="text-sm font-bold text-text-primary truncate">{team?.teamName}</p>
                <div className="flex items-center gap-2 text-[10px] text-text-muted">
                  <span>Rank #{team?.originalRank}</span>
                  <span>·</span>
                  <span>{team?.category}</span>
                  <span>·</span>
                  <span>{team?.status}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowApproveConfirm(false)}
                  className="flex-1 py-2.5 rounded-lg border border-border text-xs font-bold text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => verifyMutation.mutate()}
                  disabled={verifyMutation.isPending}
                  className="flex-1 py-2.5 rounded-lg border border-green-900/50 bg-green-950/40 text-xs font-bold text-green-400 hover:bg-green-900/40 hover:text-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {verifyMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Yes, Approve Team
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Drop Team Confirmation Modal ── */}
      {showDropConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowDropConfirm(false)}
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
                  <h3 className="font-bold text-sm text-text-primary">
                    Drop Team?
                  </h3>
                  <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              {/* Team summary */}
              <div className="p-3 rounded-lg bg-bg-surface border border-border/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">
                    Team
                  </span>
                  <span className="text-[10px] font-bold text-brand-primary bg-brand-dim px-2 py-0.5 rounded uppercase">
                    {team?.teamCode}
                  </span>
                </div>
                <p className="text-sm font-bold text-text-primary truncate">
                  {team?.teamName}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-text-muted">
                  <span>Rank #{team?.originalRank}</span>
                  <span>·</span>
                  <span>{team?.category}</span>
                  <span>·</span>
                  <span>{team?.status}</span>
                </div>
              </div>

              {/* Warning text */}
              <p className="text-xs text-text-secondary leading-relaxed">
                Dropping this team will return their slot to the waitlist pool.
                The team will be notified immediately. If you are sure, confirm
                below.
              </p>

              {/* Action buttons */}
              <div className="flex gap-3 pt-1">
                <NeonButton
                  onClick={() => setShowDropConfirm(false)}
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                >
                  Cancel
                </NeonButton>
                <NeonButton
                  onClick={() => dropMutation.mutate()}
                  disabled={dropMutation.isPending}
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                >
                  {dropMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-bg-primary border-t-transparent rounded-full animate-spin mr-1.5" />
                      Dropping...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-1.5" />
                      Yes, Drop Team
                    </>
                  )}
                </NeonButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Document Viewer Modal (portal to body) ── */}
      {viewerFile && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md"
          style={{ zIndex: 2147483647, position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh" }}
          onClick={() => setViewerFile(null)}
        >
          <div
            className="relative w-[90vw] max-w-4xl h-[85vh] flex flex-col rounded-xl border border-white/15 bg-[#0D0D0D]/95 shadow-[0_16px_60px_rgba(0,0,0,0.85)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-brand-primary shrink-0" />
                <span className="text-sm font-bold text-white truncate">{viewerFile.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={viewerFile.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-white/50 hover:text-white transition-colors"
                >
                  Open in new tab
                </a>
                <button
                  onClick={() => setViewerFile(null)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            {/* Content */}
            <div className="flex-1 min-h-0">
              {(viewerFile.name.toLowerCase().endsWith(".pdf") || viewerFile.url.toLowerCase().includes(".pdf")) ? (
                <iframe
                  src={viewerFile.url}
                  className="w-full h-full border-0"
                  title={viewerFile.name}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 overflow-auto bg-neutral-950/80">
                  <img
                    src={viewerFile.url}
                    alt={viewerFile.name}
                    className="max-w-full max-h-full object-contain rounded shadow-2xl"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />
                  <div className="hidden flex-col items-center gap-2 text-text-muted">
                    <FileText className="w-10 h-10 text-brand-primary" />
                    <p className="text-sm font-bold text-white">Cannot preview image directly</p>
                    <a
                      href={viewerFile.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-brand-primary hover:underline"
                    >
                      Open in new tab / Download
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      , document.body)}

      {/* ── Enhanced Edit Team Modal ── */}
      {showEditModal && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-border/80 bg-bg-secondary shadow-2xl overflow-hidden my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-border/40 bg-gradient-to-r from-bg-surface/90 to-bg-secondary flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-dim border border-brand-primary/30 flex items-center justify-center text-brand-primary shadow-inner">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-text-primary">
                    Edit Team & Score Configuration
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Administrative override for team identity, leader credentials, and judging scores
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-mono font-bold text-brand-primary bg-brand-dim border border-brand-primary/20 px-3 py-1 rounded-md block">
                  {team?.teamCode}
                </span>
                <span className="text-[10px] text-text-muted font-mono mt-1 block">
                  ID: {team?.id?.slice(0, 8)}...
                </span>
              </div>
            </div>

            {/* Modal Body / Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editForm.riskAcknowledged) return;
                updateTeamMutation.mutate(editForm);
              }}
              className="p-6 space-y-6 max-h-[75vh] overflow-y-auto"
            >
              {/* High-Risk Warning Callout */}
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200/90 text-xs space-y-1.5 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-300">High-Risk Administrative Override</p>
                  <p className="text-amber-200/80 leading-relaxed text-[11px]">
                    Modifications made here bypass normal participant and judge workflows. Updating team status, leader email, or score overrides directly alters live leaderboards, authentication tokens, and tournament progression.
                  </p>
                </div>
              </div>

              {/* Section 1: Team Identity & Category */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                  <Trophy className="w-4 h-4 text-brand-primary" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                    1. Team Identity & Lifecycle
                  </h4>
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-secondary uppercase block mb-1.5">
                    Team Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.teamName}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, teamName: e.target.value }))}
                    placeholder="e.g. Alpha Cybernetics"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-bg-surface border border-border text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase block mb-1.5">
                      Category
                    </label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value as TeamCategory }))}
                      className="w-full px-3 py-2.5 rounded-lg bg-bg-surface border border-border text-sm text-text-primary focus:outline-none focus:border-brand-primary font-medium"
                    >
                      <option value="NATIONAL">NATIONAL</option>
                      <option value="MIX">MIX</option>
                      <option value="INTERNATIONAL">INTERNATIONAL</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase block mb-1.5">
                      Country Mix (Optional)
                    </label>
                    <input
                      type="text"
                      value={editForm.countryMix}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, countryMix: e.target.value }))}
                      placeholder="e.g. ID, SG, MY"
                      className="w-full px-3 py-2.5 rounded-lg bg-bg-surface border border-border text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-brand-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase block mb-1.5">
                      Original Rank (#)
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={editForm.originalRank}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, originalRank: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2.5 rounded-lg bg-bg-surface border border-border text-sm font-mono text-text-primary focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-secondary uppercase block mb-1.5">
                    Team Lifecycle Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value as TeamStatus }))}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-bg-surface border border-border text-sm text-text-primary focus:outline-none focus:border-brand-primary font-mono font-medium"
                  >
                    <option value="NEW">NEW — Initial imported state</option>
                    <option value="TOP30">TOP30 — Selected for qualification</option>
                    <option value="AWAITING_CONFIRMATION">AWAITING_CONFIRMATION — 48h acceptance countdown</option>
                    <option value="PAYMENT_PENDING">PAYMENT_PENDING — National/Mix awaiting fee transfer</option>
                    <option value="DOCUMENT_PENDING">DOCUMENT_PENDING — International ID verification</option>
                    <option value="VERIFICATION_PENDING">VERIFICATION_PENDING — Committee review underway</option>
                    <option value="VERIFIED">VERIFIED — Confirmed for Phase 2</option>
                    <option value="SUBMISSION_OPEN">SUBMISSION_OPEN — Phase 2 submission window active</option>
                    <option value="SUBMITTED">SUBMITTED — Final deliverables provided</option>
                    <option value="JUDGED">JUDGED — Evaluated by scoring panel</option>
                    <option value="FINALIST">FINALIST — Advanced to grand finals</option>
                    <option value="WAITLIST">WAITLIST — Standby pool</option>
                    <option value="DROPPED">DROPPED — Revoked from competition</option>
                  </select>
                </div>
              </div>

              {/* Section 2: Team Leader & Contact Details */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                  <UserCheck className="w-4 h-4 text-brand-primary" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                    2. Team Leader & Contact Credentials
                  </h4>
                </div>

                {members && members.length > 1 && (
                  <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase block mb-1.5">
                      Assign Leader Role to Member
                    </label>
                    <select
                      value={editForm.leaderMemberId}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        const targetMember = members.find((m: any) => m.id === selectedId);
                        setEditForm((prev) => ({
                          ...prev,
                          leaderMemberId: selectedId,
                          leaderName: targetMember?.user?.fullName || prev.leaderName,
                          leaderEmail: targetMember?.user?.email || prev.leaderEmail,
                        }));
                      }}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-bg-surface border border-border text-sm text-text-primary focus:outline-none focus:border-brand-primary"
                    >
                      {members.map((m: any) => (
                        <option key={m.id} value={m.id}>
                          {m.user?.fullName} ({m.user?.email}) — {m.role === "TEAM_LEADER" ? "Current Leader" : "Member"}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase block mb-1.5">
                      Leader Full Name
                    </label>
                    <input
                      type="text"
                      value={editForm.leaderName}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, leaderName: e.target.value }))}
                      placeholder="e.g. Jane Doe"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-bg-surface border border-border text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-brand-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase block mb-1.5">
                      Leader Account Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={editForm.leaderEmail}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, leaderEmail: e.target.value }))}
                        placeholder="leader@gmail.com"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-bg-surface border border-border text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-brand-primary"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-text-muted">
                  Note: Updating the email directly updates the Google user account associated with the team leader in the system database.
                </p>
              </div>

              {/* Section 3: Financial & Payment Settings */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                  <CreditCard className="w-4 h-4 text-brand-primary" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                    3. Financial & Fee Requirements
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase block mb-1.5">
                      Registration Fee Amount (IDR)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={5000}
                      value={editForm.paymentAmount}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, paymentAmount: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-bg-surface border border-border text-sm font-mono text-text-primary focus:outline-none focus:border-brand-primary"
                    />
                  </div>

                  <div className="p-3.5 rounded-lg bg-bg-surface border border-border flex items-center justify-between mt-auto">
                    <div>
                      <span className="text-xs font-bold text-text-primary block">Payment Mandatory</span>
                      <span className="text-[11px] text-text-muted">Enforces payment verification before qualification</span>
                    </div>
                    <input
                      type="checkbox"
                      id="paymentRequiredCheckbox"
                      checked={editForm.paymentRequired}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, paymentRequired: e.target.checked }))}
                      className="w-5 h-5 rounded border-border bg-bg-surface text-brand-primary focus:ring-brand-primary cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Phase 1 Judging & Score Override */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                  <Scale className="w-4 h-4 text-brand-primary" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                    4. Phase 1 Score Override
                  </h4>
                </div>

                <div className="p-4 rounded-xl bg-bg-surface border border-border/70 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="text-xs font-semibold text-text-secondary uppercase block">
                        Final Score Override (0.00 — 100.00)
                      </label>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        Sets the manual score across all judge scorecards for this team
                      </p>
                    </div>
                    {data?.averageScore !== null && data?.averageScore !== undefined && (
                      <span className="text-xs font-mono font-bold text-brand-primary bg-brand-dim px-2.5 py-1 rounded border border-brand-primary/20 shrink-0">
                        Current Avg: {Number(data.averageScore).toFixed(2)}
                      </span>
                    )}
                  </div>

                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={editForm.scoreOverride}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, scoreOverride: e.target.value }))}
                    placeholder="e.g. 87.50"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-bg-secondary border border-border text-sm font-mono font-bold text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-brand-primary"
                  />

                  {/* Password gate for score modifications */}
                  {editForm.scoreOverride.trim() !== "" && (
                    <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/30 space-y-2.5 mt-2">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-red-400" />
                        <label className="text-xs font-bold text-red-300 uppercase tracking-wider">
                          Committee Security Password <span className="text-red-400">*</span>
                        </label>
                      </div>
                      <p className="text-[11px] text-text-muted">
                        Modifying score data requires committee security clearance. Please enter the committee password to apply score changes.
                      </p>
                      <div className="relative">
                        <input
                          type={showScorePassword ? "text" : "password"}
                          required={editForm.scoreOverride.trim() !== ""}
                          value={editForm.scoreAuthPassword}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, scoreAuthPassword: e.target.value }))}
                          placeholder="Enter authorization password"
                          className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-bg-surface border border-red-500/40 text-sm font-mono text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-red-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowScorePassword(!showScorePassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition"
                        >
                          {showScorePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* High-Risk Checkbox Confirmation */}
              <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 space-y-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="riskAcknowledgedCheckbox"
                    required
                    checked={editForm.riskAcknowledged}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, riskAcknowledged: e.target.checked }))}
                    className="w-5 h-5 rounded border-red-500/50 bg-bg-surface text-red-500 focus:ring-red-500 cursor-pointer mt-0.5"
                  />
                  <label htmlFor="riskAcknowledgedCheckbox" className="text-xs font-semibold text-text-primary cursor-pointer leading-relaxed">
                    I confirm that I have reviewed these modifications and understand that saving will immediately alter competition records, scores, and access permissions.
                  </label>
                </div>
              </div>

              {/* Mutation Error Display */}
              {updateTeamMutation.isError && (
                <div className="p-3.5 bg-red-950/40 border border-red-800 text-red-300 text-xs rounded-lg flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-200">
                      {(updateTeamMutation.error as any)?.message || "Failed to update team details."}
                    </p>
                    {((updateTeamMutation.error as any)?.message?.toLowerCase().includes("password") ||
                      (updateTeamMutation.error as any)?.code === "INVALID_SCORE_AUTH_PASSWORD") && (
                      <p className="text-[11px] text-red-300/80 mt-1">
                        Please re-enter the correct committee authorization password and try again.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Modal Footer / Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-border/40">
                <NeonButton
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  variant="secondary"
                  size="md"
                  className="flex-1"
                >
                  Cancel
                </NeonButton>
                <NeonButton
                  type="submit"
                  disabled={
                    updateTeamMutation.isPending ||
                    !editForm.riskAcknowledged ||
                    !editForm.teamName.trim() ||
                    (isScoreBeingModified && !editForm.scoreAuthPassword.trim())
                  }
                  size="md"
                  className="flex-1"
                >
                  {updateTeamMutation.isPending ? "Saving Changes..." : "Apply High-Risk Overrides"}
                </NeonButton>
              </div>
            </form>
          </div>
        </div>
      , document.body)}
    </div>
  );
}

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">
        {label}
      </p>
      <p
        className={cn(
          "text-xs text-text-primary",
          mono && "font-mono break-all"
        )}
      >
        {value ?? "—"}
      </p>
    </div>
  );
}
