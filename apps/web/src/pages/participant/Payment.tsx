import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { NeonButton } from "@/components/compsphere/NeonButton";
import { AlertCircle, CheckCircle, FileText, Upload, MessageCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { formatRupiah } from "@/lib/utils";

interface PaymentForm {
  amount?: number;
  proof?: FileList;
}

export function Payment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { data: myTeam, isLoading } = useQuery<any>({
    queryKey: ["my-team"],
    queryFn: () => api.get("/api/teams/my-team"),
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<PaymentForm>();

  const submitMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const endpoint = myTeam?.team?.category === "INTERNATIONAL"
        ? "/api/payments/submit-document"
        : "/api/payments/submit";

      // Use direct fetch to avoid api wrapper header issues with FormData
      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Upload failed (HTTP ${res.status})`);
      }
      return json.data;
    },
    onSuccess: () => {
      setSuccessMsg("Payment proof submitted successfully! The committee will review it shortly.");
      setErrorMsg(null);
      reset();
      queryClient.invalidateQueries({ queryKey: ["my-team"] });
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Failed to submit verification file.");
      setSuccessMsg(null);
    },
  });

  const onSubmit = (data: PaymentForm) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!myTeam) return;

    const formData = new FormData();

    if (myTeam.team.category !== "INTERNATIONAL") {
      formData.append("amount", String(data.amount || 120000));
    }

    if (data.proof && data.proof[0]) {
      formData.append("proof", data.proof[0]);
    } else {
      setErrorMsg("Please select a file to upload.");
      return;
    }

    submitMutation.mutate(formData);
  };

  // Build WhatsApp message with team details
  const whatsappUrl = useMemo(() => {
    if (!myTeam?.team) return "#";
    const t = myTeam.team;
    const msg = [
      `Hi Compsphere`,
      ``,
      `I have transferred Rp120,000 for slot confirmation.`,
      ``,
      `Team: ${t.teamName || "-"}`,
      `Code: ${t.teamCode || "-"}`,
      `Category: ${t.category || "-"}`,
      ``,
      `Please verify my payment. Thank you!`,
    ].join("\n");
    return `https://wa.me/6282134561960?text=${encodeURIComponent(msg)}`;
  }, [myTeam]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!myTeam) return null;
  const { team, payments } = myTeam;
  const payment = payments?.[0] ?? null;
  const isInternational = team.category === "INTERNATIONAL";
  const isLeader = user?.memberRole === "TEAM_LEADER";

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-border">
        <h1 className="text-3xl font-extrabold text-text-primary">
          {isInternational ? "Verification Document Upload" : "Payment Receipt Upload"}
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          {isInternational
            ? "Upload passport, national ID scan, or commitment letter."
            : "Submit Rp120,000 confirmation proof."}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Form */}
          <GlassPanel className="space-y-6">
            <h3 className="font-bold text-sm text-text-primary">Upload Form</h3>

            {errorMsg && (
              <div className="flex gap-2 p-3 bg-red-950/20 border border-red-900/30 text-red-400 text-xs rounded">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex gap-2 p-3 bg-brand-dim border border-brand-primary/10 text-brand-primary text-xs rounded">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {!isLeader ? (
              <div className="p-4 bg-bg-surface border border-border text-xs text-text-muted rounded flex gap-2">
                <AlertCircle className="w-4.5 h-4.5 text-yellow-500 shrink-0" />
                <span>
                  Only the team leader is authorized to upload verification receipts or documents.
                </span>
              </div>
            ) : payment && payment.status === "PENDING" ? (
              <div className="p-4 bg-orange-950/20 border border-orange-900/30 text-orange-400 text-xs rounded flex gap-2">
                <Upload className="w-4.5 h-4.5 shrink-0 animate-pulse" />
                <span>
                  Your document has been submitted and is currently in the review queue. You cannot upload a new one unless the current document is rejected by the committee.
                </span>
              </div>
            ) : payment && payment.status === "APPROVED" ? (
              <div className="p-4 bg-brand-dim border border-brand-primary/10 text-brand-primary text-xs rounded flex gap-2">
                <CheckCircle className="w-4.5 h-4.5 shrink-0" />
                <span>
                  Verification approved! No further upload is required.
                </span>
              </div>
            ) : (
              <>
                <form id="payment-upload-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {!isInternational && (
                    <div className="space-y-1">
                      <label htmlFor="amount" className="text-xs font-semibold text-text-secondary uppercase">
                        Payment Amount
                      </label>
                      <input
                        id="amount"
                        type="text"
                        readOnly
                        value={formatRupiah(120000)}
                        className="w-full px-3 py-2 rounded bg-bg-surface border border-border text-sm text-text-primary focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label htmlFor="proof" className="text-xs font-semibold text-text-secondary uppercase">
                      {isInternational ? "ID Scan or Commitment Letter (PDF/JPG)" : "Payment Proof Image / PDF"}
                    </label>
                    <input
                      id="proof"
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      className="w-full px-3 py-2 rounded bg-bg-surface border border-border text-sm text-text-secondary focus:outline-none file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-brand-dim file:text-brand-primary cursor-pointer"
                      {...register("proof", { required: "Document file is required" })}
                    />
                    {errors.proof && (
                      <span className="text-[10px] text-red-400 font-semibold">{errors.proof.message}</span>
                    )}
                  </div>

                  <NeonButton
                    type="submit"
                    disabled={submitMutation.isPending}
                    className="w-full mt-6"
                  >
                    {submitMutation.isPending ? "Uploading..." : "Submit File for Review"}
                  </NeonButton>
                </form>

                {!isInternational && (
                  <>
                    <div className="flex items-center gap-3 text-text-muted">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[10px] font-semibold uppercase tracking-widest">Or</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    <p className="text-[11px] text-text-muted text-center leading-relaxed">
                      You can also confirm your payment directly via WhatsApp to the committee.
                      Your team details will be sent automatically.
                    </p>

                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400 text-xs font-semibold transition-all duration-300 hover:border-emerald-500/40 hover:bg-emerald-500/15 hover:-translate-y-0.5 active:scale-[0.97]"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Confirm via WhatsApp
                    </a>
                  </>
                )}
              </>
            )}
          </GlassPanel>
        </div>

        {/* Info Box */}
        <GlassPanel className="space-y-6">
          <h3 className="font-bold text-sm text-text-primary">Upload Details</h3>
          {payment ? (
            <div className="space-y-4 text-xs">
              {/* Status with visual indicator */}
              <div className="p-3 rounded-md border flex items-center gap-2.5">
                {payment.status === "APPROVED" ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)] shrink-0" />
                    <div>
                      <p className="font-bold text-emerald-400">Verified & Approved</p>
                      <p className="text-[10px] text-text-muted mt-0.5">Your payment has been confirmed by the committee.</p>
                    </div>
                  </>
                ) : payment.status === "PENDING" ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(251,191,36,0.5)] shrink-0" />
                    <div>
                      <p className="font-bold text-amber-400">Under Review</p>
                      <p className="text-[10px] text-text-muted mt-0.5">Your upload is in the committee review queue.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)] shrink-0" />
                    <div>
                      <p className="font-bold text-red-400">Rejected</p>
                      <p className="text-[10px] text-text-muted mt-0.5">Please re-upload a valid document.</p>
                    </div>
                  </>
                )}
              </div>

              {payment.proofFilename && (
                <div className="space-y-1.5">
                  <span className="text-text-muted block">Uploaded File</span>
                  <div className="flex items-center gap-1.5 bg-bg-surface p-2 rounded border border-border">
                    <FileText className="w-3.5 h-3.5 text-text-secondary" />
                    <span className="truncate max-w-[150px] font-semibold text-text-primary">
                      {payment.proofFilename}
                    </span>
                  </div>
                </div>
              )}
              {payment.rejectionReason && (
                <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-400 rounded">
                  <p className="font-bold">Rejection Reason:</p>
                  <p className="mt-1">{payment.rejectionReason}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-text-muted">No documents uploaded yet.</p>
          )}

          {/* Team info for quick reference */}
          <div className="pt-4 border-t border-border/40 space-y-2">
            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Your Team</h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-text-muted">Name</span>
                <span className="font-semibold text-text-primary truncate max-w-[120px]">{team.teamName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Code</span>
                <span className="font-bold font-mono text-brand-primary">{team.teamCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Category</span>
                <span className="font-semibold text-text-primary">{team.category}</span>
              </div>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
