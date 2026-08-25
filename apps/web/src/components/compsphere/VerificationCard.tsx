import React, { useMemo } from "react";
import { GlassPanel } from "./GlassPanel";
import { StatusBadge } from "./StatusBadge";
import { NeonButton } from "./NeonButton";
import { AlertCircle, CheckCircle, FileText, Upload, MessageCircle } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import type { CompetitionTeam, Payment } from "@compsphere/types";

interface VerificationCardProps {
  team: CompetitionTeam;
  payment: Payment | null;
  onUploadClick: () => void;
  className?: string;
}

export function VerificationCard({
  team,
  payment,
  onUploadClick,
  className,
}: VerificationCardProps) {
  const isInternational = team.category === "INTERNATIONAL";

  // Build auto-filled WhatsApp message with team details
  const whatsappUrl = useMemo(() => {
    if (isInternational) return "#";
    const msg = [
      `Hi Compsphere`,
      ``,
      `I have transferred Rp120,000 for slot confirmation.`,
      ``,
      `Team: ${team.teamName || "-"}`,
      `Code: ${team.teamCode || "-"}`,
      `Category: ${team.category || "-"}`,
      ``,
      `Please verify my payment. Thank you!`,
    ].join("\n");
    return `https://wa.me/6282134561960?text=${encodeURIComponent(msg)}`;
  }, [team, isInternational]);

  const renderStatusInfo = () => {
    if (!payment) {
      return (
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 items-start text-sm text-text-secondary">
            <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0" />
            <div>
              <p className="font-semibold text-text-primary">Action Required</p>
              <p className="text-xs text-text-muted mt-0.5">
                {isInternational
                  ? "Upload ID verification or your competition commitment letter to qualify."
                  : `Please transfer Rp120,000 to confirm your slot and upload receipt proof.`}
              </p>
            </div>
          </div>
          <NeonButton onClick={onUploadClick} size="sm" className="w-full">
            <Upload className="w-4 h-4 mr-2" />
            {isInternational ? "Upload Documents" : "Upload Payment Proof"}
          </NeonButton>
          {!isInternational && (
            <>
              <div className="flex items-center gap-3 text-text-muted">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] font-semibold uppercase tracking-widest">Or</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <p className="text-[11px] text-text-muted text-center leading-relaxed">
                Confirm your payment directly via WhatsApp.
                Your team details will be sent automatically.
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400 text-xs font-semibold transition-all duration-300 hover:border-emerald-500/40 hover:bg-emerald-500/15 hover:-translate-y-0.5 active:scale-[0.97]"
              >
                <MessageCircle className="w-4 h-4" />
                Confirm via WhatsApp
              </a>
            </>
          )}
        </div>
      );
    }

    if (payment.status === "PENDING") {
      return (
        <div className="flex gap-3 items-start bg-orange-950/20 border border-orange-900/30 p-4 rounded-md text-sm text-orange-400">
          <Upload className="w-5 h-5 animate-pulse shrink-0" />
          <div>
            <p className="font-semibold">Review in Progress</p>
            <p className="text-xs text-text-muted mt-0.5">
              The committee is verifying your upload. This usually takes less than 24 hours.
            </p>
            {payment.proofFilename && (
              <div className="flex items-center gap-1.5 mt-3 text-xs text-orange-300 bg-orange-950/40 px-2.5 py-1 rounded w-fit">
                <FileText className="w-3.5 h-3.5" />
                <span className="truncate max-w-[200px]">{payment.proofFilename}</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (payment.status === "APPROVED") {
      return (
        <div className="flex gap-3 items-start bg-brand-dim border border-brand-primary/10 p-4 rounded-md text-sm text-brand-primary">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold">Verified & Confirmed</p>
            <p className="text-xs text-text-muted mt-0.5">
              Your qualification status is verified! Your slot is permanently secured.
            </p>
          </div>
        </div>
      );
    }

    if (payment.status === "REJECTED") {
      return (
        <div className="flex flex-col gap-4 bg-red-950/20 border border-red-900/30 p-4 rounded-md text-sm">
          <div className="flex gap-3 items-start text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">Verification Rejected</p>
              <p className="text-xs text-red-300 mt-1">
                Reason: {payment.rejectionReason || "Uploaded file was invalid or unclear."}
              </p>
            </div>
          </div>
          <NeonButton onClick={onUploadClick} size="sm" variant="destructive" className="w-full">
            <Upload className="w-4 h-4 mr-2" />
            Re-upload Documents
          </NeonButton>
          {!isInternational && (
            <>
              <div className="flex items-center gap-3 text-text-muted">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] font-semibold uppercase tracking-widest">Or</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <p className="text-[11px] text-text-muted text-center leading-relaxed">
                Confirm your payment directly via WhatsApp.
                Your team details will be sent automatically.
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400 text-xs font-semibold transition-all duration-300 hover:border-emerald-500/40 hover:bg-emerald-500/15 hover:-translate-y-0.5 active:scale-[0.97]"
              >
                <MessageCircle className="w-4 h-4" />
                Confirm via WhatsApp
              </a>
            </>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <GlassPanel className={className}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-lg text-text-primary">
          {isInternational ? "Identity & Slot Verification" : "Payment Verification"}
        </h3>
        <StatusBadge status={team.status} />
      </div>

      {!isInternational && (
        <div className="mb-6 p-4 rounded-md bg-bg-surface border border-border">
          <span className="text-xs text-text-muted block">Total Fee Required</span>
          <span className="text-2xl font-black font-mono text-text-primary">
            {formatRupiah(120000)}
          </span>
        </div>
      )}

      {renderStatusInfo()}
    </GlassPanel>
  );
}
