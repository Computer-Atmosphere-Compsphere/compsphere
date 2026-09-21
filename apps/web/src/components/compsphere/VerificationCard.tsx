import React, { useMemo, useState } from "react";
import { GlassPanel } from "./GlassPanel";
import { StatusBadge } from "./StatusBadge";
import { NeonButton } from "./NeonButton";
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Upload,
  MessageCircle,
  Building2,
  Copy,
  Check,
  QrCode,
  ZoomIn,
  X,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { getUploadUrl } from "@/lib/api";
import { usePublicConfig } from "@/hooks/usePublicConfig";
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
  const { data: publicConfig } = usePublicConfig();
  const [copied, setCopied] = useState(false);
  const [qrisModalOpen, setQrisModalOpen] = useState(false);

  const bankName = publicConfig?.payment_bank_name || "BCA";
  const bankAccountNumber = publicConfig?.payment_bank_account_number || "";
  const bankAccountName = publicConfig?.payment_bank_account_name || "";
  const qrisImageKey = publicConfig?.payment_qris_image_key || "";
  const qrisUrl = qrisImageKey ? getUploadUrl(qrisImageKey) : null;

  const targetAmount = isInternational
    ? 0
    : team.category === "MIX"
    ? Number(publicConfig?.payment_amount_mix || 120000)
    : Number(publicConfig?.payment_amount_national || 120000);

  const handleCopyAccount = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!bankAccountNumber) return;
    navigator.clipboard.writeText(bankAccountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Build auto-filled WhatsApp message with team details
  const whatsappUrl = useMemo(() => {
    if (isInternational) return "#";
    const msg = [
      `Hi Compsphere Committee`,
      ``,
      `I have transferred ${formatRupiah(targetAmount)} for slot confirmation.`,
      ``,
      `Team: ${team.teamName || "-"}`,
      `Code: ${team.teamCode || "-"}`,
      `Category: ${team.category || "-"}`,
      ``,
      `Please verify my payment. Thank you!`,
    ].join("\n");
    return `https://wa.me/6282134561960?text=${encodeURIComponent(msg)}`;
  }, [team, isInternational, targetAmount]);

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
                  : `Please transfer ${formatRupiah(targetAmount)} to confirm your slot and upload receipt proof.`}
              </p>
            </div>
          </div>

          {!isInternational && (bankAccountNumber || qrisImageKey) && (
            <div className="p-3.5 rounded-xl bg-bg-surface/60 border border-border/60 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-text-secondary">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{bankName}</span>
                </div>
                {qrisUrl && (
                  <button
                    type="button"
                    onClick={() => setQrisModalOpen(true)}
                    className="inline-flex items-center gap-1 text-[10px] font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-800/40 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                  >
                    <QrCode className="w-3 h-3" />
                    <span>Scan QRIS</span>
                    <ZoomIn className="w-2.5 h-2.5 ml-0.5 opacity-70" />
                  </button>
                )}
              </div>

              {bankAccountNumber && (
                <div className="flex items-center justify-between pt-1 border-t border-border/40">
                  <span className="font-mono text-sm font-bold text-brand-primary">
                    {bankAccountNumber}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    className="p-1 rounded bg-bg-surface hover:bg-white/10 text-text-secondary hover:text-brand-primary border border-border transition-colors flex items-center gap-1 text-[10px] font-mono px-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {bankAccountName && (
                <p className="text-[10px] text-text-muted">
                  a.n. <span className="font-semibold text-text-primary">{bankAccountName}</span>
                </p>
              )}
            </div>
          )}

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
            {formatRupiah(targetAmount)}
          </span>
        </div>
      )}

      {renderStatusInfo()}

      {/* QRIS Full Zoom Modal */}
      {qrisModalOpen && qrisUrl && (
        <div
          onClick={() => setQrisModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-sm w-full bg-bg-secondary border border-brand-primary/30 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center space-y-4"
          >
            <button
              type="button"
              onClick={() => setQrisModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-bg-surface border border-border text-text-muted hover:text-text-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-cyan-400" />
              <h4 className="font-bold text-base text-text-primary">
                Official Compsphere QRIS
              </h4>
            </div>

            <p className="text-xs text-text-muted">
              Scan with GoPay, OVO, Dana, BCA, Livin, or any QRIS mobile banking app.
            </p>

            <div className="w-64 h-64 sm:w-72 sm:h-72 bg-white rounded-xl p-3 shadow-inner flex items-center justify-center border border-white/20">
              <img
                src={qrisUrl}
                alt="QRIS Barcode Full"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="w-full pt-2 border-t border-border/40 text-[11px] text-text-secondary flex justify-between items-center">
              <span>Fee: <strong className="text-text-primary font-mono">{formatRupiah(targetAmount)}</strong></span>
              <span>Team: <strong className="text-brand-primary font-mono">{team.teamCode}</strong></span>
            </div>
          </div>
        </div>
      )}
    </GlassPanel>
  );
}

