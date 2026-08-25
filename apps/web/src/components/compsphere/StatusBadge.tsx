import React from "react";
import { cn } from "@/lib/utils";
import type { TeamStatus } from "@compsphere/types";

interface StatusBadgeProps {
  status: TeamStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const labelMap: Record<TeamStatus, string> = {
    NEW: "New",
    TOP30: "Top 30 Selected",
    AWAITING_CONFIRMATION: "Awaiting Confirmation",
    PAYMENT_PENDING: "Payment Pending",
    DOCUMENT_PENDING: "Verification Pending",
    VERIFICATION_PENDING: "Reviewing Submission",
    VERIFIED: "Verified & Confirmed",
    DROPPED: "Dropped",
    WAITLIST: "Waitlist",
    FINALIST: "Finalist",
    SUBMISSION_OPEN: "Submission Open",
    SUBMITTED: "Deliverables Submitted",
    JUDGED: "Judged",
  };

  const styleMap: Record<TeamStatus, string> = {
    NEW: "bg-slate-950/40 text-slate-400 border-slate-900/50",
    TOP30: "bg-purple-950/40 text-purple-400 border-purple-900/50",
    AWAITING_CONFIRMATION: "bg-blue-950/40 text-blue-400 border-blue-900/50",
    PAYMENT_PENDING: "bg-yellow-950/40 text-yellow-400 border-yellow-900/50",
    DOCUMENT_PENDING: "bg-yellow-950/40 text-yellow-400 border-yellow-900/50",
    VERIFICATION_PENDING: "bg-orange-950/40 text-orange-400 border-orange-900/50",
    VERIFIED: "bg-brand-dim text-brand-primary border-brand-primary/20",
    DROPPED: "bg-red-950/40 text-red-400 border-red-900/50",
    WAITLIST: "bg-purple-950/40 text-purple-400 border-purple-900/50",
    FINALIST: "bg-brand-dim text-brand-accent border-brand-accent/20 shadow-[0_0_10px_rgba(113,255,231,0.2)]",
    SUBMISSION_OPEN: "bg-cyan-950/40 text-cyan-400 border-cyan-900/50",
    SUBMITTED: "bg-cyan-950/40 text-cyan-400 border-cyan-900/50",
    JUDGED: "bg-green-950/40 text-green-400 border-green-900/50",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        styleMap[status] || "bg-bg-surface text-text-secondary border-border",
        className
      )}
    >
      {labelMap[status] || status}
    </span>
  );
}
