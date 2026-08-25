import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { NeonButton } from "@/components/compsphere/NeonButton";
import { StatusBadge } from "@/components/compsphere/StatusBadge";
import {
  CheckCircle2,
  XCircle,
  FileImage,
  Clock,
  Banknote,
  Users,
  Trophy,
  Eye,
  FileText,
  XCircleIcon,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Payments() {
  const queryClient = useQueryClient();
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [viewerFile, setViewerFile] = useState<{ url: string; name: string } | null>(null);

  const { data: queueData, isLoading } = useQuery<any>({
    queryKey: ["admin-payments-queue"],
    queryFn: () => api.get("/api/payments/queue"),
    refetchInterval: 30_000,
  });

  const verifyMutation = useMutation({
    mutationFn: ({ paymentId, action, rejectionReason }: any) =>
      api.post("/api/payments/verify", { paymentId, action, rejectionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payments-queue"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
    },
  });

  const queue: any[] = queueData ?? [];
  const pending = queue.filter((p: any) => p.status === "PENDING");
  const processed = queue.filter((p: any) => p.status !== "PENDING");

  const formatRupiah = (v: number) =>
    v === 0 ? "Document / ID Letter" : `Rp${v.toLocaleString("id-ID")}`;

  const formatDeadline = (iso: string | null) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const now = new Date();
    const hoursLeft = Math.max(0, Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60)));
    return {
      text: d.toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      hoursLeft,
      expired: hoursLeft <= 0,
    };
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "NATIONAL": return "bg-sky-950/40 text-sky-400 border-sky-900/50";
      case "MIX": return "bg-amber-950/40 text-amber-400 border-amber-900/50";
      case "INTERNATIONAL": return "bg-purple-950/40 text-purple-400 border-purple-900/50";
      default: return "bg-bg-surface text-text-secondary border-border";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-border flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary">Payment Verification</h1>
          <p className="text-xs text-text-secondary mt-1">
            Review payment proofs and international documents submitted by teams.
          </p>
        </div>
        <div className="text-right">
          <span className="text-brand-primary font-mono font-bold text-3xl">{pending.length}</span>
          <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold mt-0.5">Pending Review</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="w-7 h-7 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : pending.length === 0 ? (
        <GlassPanel className="text-center py-14 space-y-3">
          <CheckCircle2 className="w-10 h-10 text-brand-primary mx-auto" />
          <p className="text-sm font-bold text-text-primary">Queue Empty</p>
          <p className="text-xs text-text-muted">All submitted proofs have been processed.</p>
        </GlassPanel>
      ) : (
        <div className="space-y-4">
          {pending.map((payment: any) => {
            const team = payment.team;
            const deadline = formatDeadline(team?.confirmationDeadline);
            return (
              <GlassPanel key={payment.id} className="space-y-4">
                {/* Team info header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {team?.teamCode && (
                        <span className="text-[10px] font-bold text-brand-primary bg-brand-dim px-2 py-0.5 rounded uppercase">
                          {team.teamCode}
                        </span>
                      )}
                      {team?.category && (
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded border uppercase", getCategoryBadge(team.category))}>
                          {team.category}
                        </span>
                      )}
                      {team?.originalRank && (
                        <span className="text-[10px] text-text-muted font-mono">
                          Rank #{team.originalRank}
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-sm text-text-primary">
                      {team?.teamName || payment.teamId}
                    </p>
                    <div className="flex flex-wrap gap-3 text-[10px] text-text-muted">
                      <span className="flex items-center gap-1">
                        <Banknote className="w-3 h-3" />
                        {formatRupiah(payment.amount)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(payment.submittedAt).toLocaleString("id-ID")}
                      </span>
                      {payment.submittedBy?.fullName && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {payment.submittedBy.fullName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={payment.status} />
                  </div>
                </div>

                {/* Deadline warning */}
                {deadline && (
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded text-[10px]",
                    deadline.expired
                      ? "bg-red-950/30 border border-red-900/40 text-red-400"
                      : deadline.hoursLeft <= 12
                      ? "bg-amber-950/30 border border-amber-900/40 text-amber-400"
                      : "bg-bg-surface border border-border/40 text-text-muted"
                  )}>
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    {deadline.expired ? (
                      <span>Confirmation window <strong>expired</strong> — deadline was {deadline.text}</span>
                    ) : (
                      <span>Confirmation deadline: <strong>{deadline.text}</strong> ({deadline.hoursLeft}h remaining)</span>
                    )}
                  </div>
                )}

                {/* Proof file */}
                {payment.proofStorageKey && (
                  <button
                    onClick={() => setViewerFile({ url: `/api/uploads/${payment.proofStorageKey}`, name: payment.proofFilename || "Payment Proof" })}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded bg-bg-surface border border-border/60 hover:border-brand-primary/40 transition-colors text-left"
                  >
                    <FileImage className="w-4 h-4 text-brand-primary shrink-0" />
                    <span className="text-xs text-text-primary">{payment.proofFilename || "View Proof / Document"}</span>
                    <Eye className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  </button>
                )}

                {/* Action buttons */}
                <div className="space-y-2 pt-3 border-t border-border/40">
                  <input
                    type="text"
                    placeholder="Rejection reason (required if rejecting)..."
                    value={rejectionReasons[payment.id] ?? ""}
                    onChange={(e) =>
                      setRejectionReasons((prev) => ({ ...prev, [payment.id]: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded bg-bg-surface border border-border text-xs text-text-primary focus:outline-none focus:border-brand-primary"
                  />
                  <div className="flex gap-3">
                    <NeonButton
                      onClick={() =>
                        verifyMutation.mutate({ paymentId: payment.id, action: "APPROVE" })
                      }
                      disabled={verifyMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve
                    </NeonButton>
                    <NeonButton
                      onClick={() =>
                        verifyMutation.mutate({
                          paymentId: payment.id,
                          action: "REJECT",
                          rejectionReason: rejectionReasons[payment.id],
                        })
                      }
                      disabled={verifyMutation.isPending || !rejectionReasons[payment.id]}
                      variant="destructive"
                      className="flex-1 flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </NeonButton>
                  </div>
                </div>
              </GlassPanel>
            );
          })}
        </div>
      )}

      {/* Processed section */}
      {processed.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-text-secondary flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Processed ({processed.length})
          </h3>
          <div className="space-y-2">
            {processed.slice(0, 30).map((payment: any) => {
              const team = payment.team;
              return (
                <div
                  key={payment.id}
                  className="flex items-center justify-between px-4 py-3 rounded border border-border/40 bg-bg-surface/30 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {team?.teamCode && (
                      <span className="text-[10px] font-bold text-brand-primary bg-brand-dim px-1.5 py-0.5 rounded shrink-0">
                        {team.teamCode}
                      </span>
                    )}
                    <span className="font-semibold text-text-primary truncate">
                      {team?.teamName || payment.teamId}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-text-muted">{formatRupiah(payment.amount)}</span>
                    <StatusBadge status={payment.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Document Viewer Modal (portal) */}
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
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              {viewerFile.name.toLowerCase().endsWith(".pdf") ? (
                <iframe src={viewerFile.url} className="w-full h-full border-0" title={viewerFile.name} />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 overflow-auto bg-neutral-950/60">
                  <img
                    src={viewerFile.url}
                    alt={viewerFile.name}
                    className="max-w-full max-h-full object-contain rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />
                  <div className="hidden flex-col items-center gap-2 text-text-muted">
                    <FileText className="w-10 h-10" />
                    <p className="text-sm font-bold">Cannot preview this file</p>
                    <a href={viewerFile.url} target="_blank" rel="noreferrer" className="text-xs text-brand-primary hover:underline">
                      Download instead
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
