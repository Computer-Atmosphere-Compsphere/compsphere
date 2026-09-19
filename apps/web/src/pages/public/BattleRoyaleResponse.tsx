import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { NeonButton } from "@/components/compsphere/NeonButton";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trophy,
  ShieldCheck,
  Flame,
  ArrowRight,
  Clock,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function BattleRoyaleResponse() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const initialAction = searchParams.get("action"); // 'CLAIM' | 'REJECT' | null

  const [confirmModal, setConfirmModal] = useState<"CLAIM" | "REJECT" | null>(
    initialAction === "CLAIM" || initialAction === "REJECT" ? initialAction : null
  );
  const [rejectReason, setRejectReason] = useState("");
  const [submittedDecision, setSubmittedDecision] = useState<"CONFIRMED" | "REJECTED" | null>(null);

  // Lock body scroll when confirm modal is active
  useEffect(() => {
    if (confirmModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [confirmModal]);

  // Fetch token verification data
  const { data, isLoading, error } = useQuery<any>({
    queryKey: ["verify-br-token", token],
    queryFn: () => api.get(`/api/battle-royale/verify-token?token=${encodeURIComponent(token)}`),
    enabled: Boolean(token),
    retry: false,
  });

  const teamData = data?.data || data;
  const existingDecision = teamData?.existingDecision?.decision || submittedDecision;

  // Mutation for submitting response
  const submitMutation = useMutation({
    mutationFn: (decision: "CLAIM" | "REJECT") =>
      api.post("/api/battle-royale/respond-slot", {
        token,
        decision,
        notes: decision === "REJECT" ? rejectReason : undefined,
      }),
    onSuccess: (res: any) => {
      const dec = res?.data?.decision || (confirmModal === "CLAIM" ? "CONFIRMED" : "REJECTED");
      setSubmittedDecision(dec);
      setConfirmModal(null);
    },
  });

  if (!token) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <GlassPanel className="max-w-md w-full p-8 text-center space-y-4 border-border">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto opacity-80" />
          <h1 className="text-xl font-bold text-text-primary">Missing Action Token</h1>
          <p className="text-xs text-text-muted leading-relaxed">
            The link you followed does not include a valid verification token. Please click the button directly from the official invitation email sent to your team leader.
          </p>
          <div className="pt-2">
            <Link to="/">
              <NeonButton variant="secondary" size="sm" className="w-full text-xs">
                Return to CompSphere Home
              </NeonButton>
            </Link>
          </div>
        </GlassPanel>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-text-muted">Verifying invitation credentials...</p>
        </div>
      </div>
    );
  }

  if (error || !teamData) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <GlassPanel className="max-w-md w-full p-8 text-center space-y-4 border-red-500/30">
          <XCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h1 className="text-xl font-bold text-text-primary">Invalid or Expired Link</h1>
          <p className="text-xs text-text-muted leading-relaxed">
            {(error as any)?.message ||
              "This invitation link has expired or has already been used. Please contact the CompSphere committee if you believe this is an error."}
          </p>
          <div className="pt-2">
            <Link to="/">
              <NeonButton variant="secondary" size="sm" className="w-full text-xs">
                Go to CompSphere Portal
              </NeonButton>
            </Link>
          </div>
        </GlassPanel>
      </div>
    );
  }

  const isTop30 = Number(teamData.originalRank) <= 30;
  const isInternational = teamData.category === "INTERNATIONAL";

  return (
    <div className="min-h-screen bg-bg-primary py-12 px-4 flex items-center justify-center">
      <div className="max-w-lg w-full space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
            <Sparkles className="w-3.5 h-3.5" /> CompSphere 12 Phase 2 Invitation
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Slot Participation Confirmation</h1>
          <p className="text-xs text-text-muted">
            Official response portal for qualified and waiting-list candidate teams.
          </p>
        </div>

        {/* Team Details Card */}
        <GlassPanel className="p-6 border-border space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="space-y-0.5">
              <span className="text-[10px] text-text-muted uppercase font-mono tracking-wider">Target Team</span>
              <h2 className="text-lg font-bold text-text-primary">{teamData.teamName}</h2>
            </div>
            <span className="px-2.5 py-1 rounded bg-bg-primary border border-border font-mono text-xs font-bold text-text-secondary">
              {teamData.teamCode}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-bg-primary/60 border border-border space-y-0.5">
              <span className="text-[10px] text-text-muted uppercase">Category</span>
              <p className="font-semibold text-text-primary">{teamData.category}</p>
            </div>

            <div className="p-3 rounded-lg bg-bg-primary/60 border border-border space-y-0.5">
              <span className="text-[10px] text-text-muted uppercase">Qualification Status</span>
              <p className="font-bold text-emerald-400 font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                {Number(teamData.originalRank || 1) <= 30 ? "Phase 2 Finalist (Qualified)" : "Waiting List Pool"}
              </p>
            </div>
          </div>

          {/* Payment info notice */}
          <div className="p-3.5 rounded-lg bg-bg-primary/40 border border-border flex items-start gap-2.5 text-xs text-text-muted">
            <ShieldCheck className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-medium text-text-primary">Registration Requirement</p>
              <p className="text-[11px] leading-relaxed">
                {isInternational
                  ? "International teams qualify with free registration (No payment required)."
                  : "National and Mix teams require payment confirmation (Rp 120,000) to complete slot validation."}
              </p>
            </div>
          </div>

          {/* Decision Status Display */}
          {existingDecision ? (
            <div
              className={cn(
                "p-4 rounded-xl border text-center space-y-2",
                existingDecision === "CONFIRMED"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              )}
            >
              <div className="flex items-center justify-center gap-2">
                {existingDecision === "CONFIRMED" ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                <span className="font-bold text-sm">
                  {existingDecision === "CONFIRMED" ? "Slot Successfully Confirmed" : "Slot Declined / Rejected"}
                </span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                {existingDecision === "CONFIRMED"
                  ? "Your confirmation has been officially logged in the system. The committee has verified your participation for Phase 2."
                  : "You have declined this slot. Your position has been released to the next team on the waiting list."}
              </p>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <p className="text-xs text-text-muted text-center">
                Please select your team's decision regarding participation in Phase 2:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmModal("CLAIM")}
                  className="flex items-center justify-center gap-2 p-3.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-bg-primary transition shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Claim & Confirm Slot
                </button>

                <button
                  type="button"
                  onClick={() => setConfirmModal("REJECT")}
                  className="flex items-center justify-center gap-2 p-3.5 rounded-xl font-medium text-xs bg-bg-primary hover:bg-bg-surface text-red-400 border border-red-500/30 transition hover:border-red-500/50 active:scale-[0.98]"
                >
                  <XCircle className="w-4 h-4" />
                  Decline / Reject Slot
                </button>
              </div>
            </div>
          )}
        </GlassPanel>

        {/* Committee Contact & Back */}
        <div className="text-center text-xs text-text-muted space-y-2">
          <p className="flex items-center justify-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" /> Need assistance? Contact the committee at{" "}
            <a href="mailto:support@compsphere12.id" className="text-brand-primary underline">
              support@compsphere12.id
            </a>
          </p>
          <div>
            <Link to="/" className="text-text-muted hover:text-text-primary transition inline-flex items-center gap-1">
              Back to CompSphere Home <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 overflow-hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitMutation.isPending) {
              setConfirmModal(null);
            }
          }}
        >
          <div className="w-full max-w-md p-6 rounded-xl bg-[#141822] border border-border shadow-2xl space-y-4 text-left">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border",
                  confirmModal === "CLAIM"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                )}
              >
                {confirmModal === "CLAIM" ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              </div>
              <div className="space-y-0.5">
                <h3 className="font-bold text-sm text-text-primary">
                  {confirmModal === "CLAIM" ? "Confirm Phase 2 Participation" : "Decline Participation Slot"}
                </h3>
                <p className="text-xs text-text-muted">
                  {confirmModal === "CLAIM"
                    ? "Validate and lock your slot for Phase 2"
                    : "Release slot to the waiting list"}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-bg-primary/50 border border-border space-y-2 text-xs text-text-muted leading-relaxed">
              <p>
                <strong>Team:</strong> <span className="text-text-primary">{teamData.teamName}</span> ({teamData.teamCode})
              </p>
              {confirmModal === "CLAIM" ? (
                <p>
                  By confirming, you commit to participating in Phase 2 of CompSphere 12. If your category requires payment, please ensure your registration proof is submitted on your dashboard.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-red-400">
                    Warning: Declining this slot is irreversible. The slot will immediately become available to candidate teams in the Battle Royale waiting list.
                  </p>
                  <input
                    type="text"
                    placeholder="Optional reason (e.g. scheduling conflict)..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-bg-surface border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-red-500/50"
                  />
                </div>
              )}
            </div>

            {submitMutation.isError && (
              <div className="p-2.5 rounded bg-red-950/30 border border-red-900/40 text-red-400 text-xs">
                {(submitMutation.error as any)?.message || "Failed to submit response. Please try again."}
              </div>
            )}

            <div className="flex gap-2.5 pt-1">
              <NeonButton
                onClick={() => setConfirmModal(null)}
                variant="secondary"
                size="sm"
                className="flex-1 text-xs"
                disabled={submitMutation.isPending}
              >
                Cancel
              </NeonButton>

              <button
                type="button"
                onClick={() => submitMutation.mutate(confirmModal)}
                disabled={submitMutation.isPending}
                className={cn(
                  "flex-1 py-2 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition text-bg-primary",
                  confirmModal === "CLAIM"
                    ? "bg-emerald-500 hover:bg-emerald-400"
                    : "bg-red-500 hover:bg-red-400 text-white"
                )}
              >
                {submitMutation.isPending ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
                    Submitting...
                  </>
                ) : confirmModal === "CLAIM" ? (
                  "Confirm Slot"
                ) : (
                  "Confirm Decline"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BattleRoyaleResponse;
