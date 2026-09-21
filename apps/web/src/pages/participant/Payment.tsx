import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getUploadUrl } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { usePublicConfig } from "@/hooks/usePublicConfig";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { NeonButton } from "@/components/compsphere/NeonButton";
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
  CreditCard,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { formatRupiah } from "@/lib/utils";

interface PaymentForm {
  amount?: number;
  proof?: FileList;
}

export function Payment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: publicConfig } = usePublicConfig();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrisModalOpen, setQrisModalOpen] = useState(false);

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

      const res = await api.post<any>(endpoint, formData);
      return res;
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

  const bankName = publicConfig?.payment_bank_name || "BCA";
  const bankAccountNumber = publicConfig?.payment_bank_account_number || "";
  const bankAccountName = publicConfig?.payment_bank_account_name || "";
  const qrisImageKey = publicConfig?.payment_qris_image_key || "";
  const qrisUrl = qrisImageKey ? getUploadUrl(qrisImageKey) : null;

  const isInternational = myTeam?.team?.category === "INTERNATIONAL";
  const targetAmount = isInternational
    ? 0
    : myTeam?.team?.category === "MIX"
    ? Number(publicConfig?.payment_amount_mix || 120000)
    : Number(publicConfig?.payment_amount_national || 120000);

  const onSubmit = (data: PaymentForm) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!myTeam) return;

    const formData = new FormData();

    if (!isInternational) {
      formData.append("amount", String(data.amount || targetAmount));
    }

    if (data.proof && data.proof[0]) {
      formData.append("proof", data.proof[0]);
    } else {
      setErrorMsg("Please select a file to upload.");
      return;
    }

    submitMutation.mutate(formData);
  };

  const handleCopyAccount = () => {
    if (!bankAccountNumber) return;
    navigator.clipboard.writeText(bankAccountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Build WhatsApp message with team details
  const whatsappUrl = useMemo(() => {
    if (!myTeam?.team) return "#";
    const t = myTeam.team;
    const msg = [
      `Hi Compsphere Committee`,
      ``,
      `I have transferred ${formatRupiah(targetAmount)} for slot confirmation.`,
      ``,
      `Team: ${t.teamName || "-"}`,
      `Code: ${t.teamCode || "-"}`,
      `Category: ${t.category || "-"}`,
      ``,
      `Please verify my payment. Thank you!`,
    ].join("\n");
    return `https://wa.me/6282134561960?text=${encodeURIComponent(msg)}`;
  }, [myTeam, targetAmount]);

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
  const isLeader = user?.memberRole === "TEAM_LEADER";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-border">
        <h1 className="text-3xl font-extrabold text-text-primary">
          {isInternational ? "Verification Document Upload" : "Payment & Slot Confirmation"}
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          {isInternational
            ? "Upload passport, national ID scan, or commitment letter to confirm your team."
            : `Complete payment of ${formatRupiah(targetAmount)} via Bank Transfer or QRIS, then upload your receipt.`}
        </p>
      </div>

      {/* Main Content */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Payment Option Details (Bank Info & QRIS) for Non-International Teams */}
          {!isInternational && (
            <GlassPanel className="space-y-6 border-brand-primary/20 bg-brand-dim/5">
              <div className="flex items-center justify-between pb-3 border-b border-border/40">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-5 h-5 text-brand-primary" />
                  <h3 className="font-bold text-sm text-text-primary">
                    Payment Options & Transfer Details
                  </h3>
                </div>
                <span className="text-[11px] font-mono font-bold text-brand-primary bg-brand-dim px-2.5 py-1 rounded-full border border-brand-primary/20">
                  {formatRupiah(targetAmount)}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                {/* 1. Bank Information Card */}
                <div className="p-4 rounded-xl bg-bg-surface/60 border border-border/60 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                        Bank Transfer
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] text-text-muted block uppercase tracking-wider">Bank</span>
                        <span className="text-sm font-black text-text-primary">{bankName || "BCA"}</span>
                      </div>

                      {bankAccountNumber && (
                        <div>
                          <span className="text-[10px] text-text-muted block uppercase tracking-wider">Account Number</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-base font-bold text-brand-primary">
                              {bankAccountNumber}
                            </span>
                            <button
                              type="button"
                              onClick={handleCopyAccount}
                              className="p-1 rounded bg-bg-surface hover:bg-white/10 text-text-secondary hover:text-brand-primary border border-border transition-colors flex items-center gap-1 text-[10px] font-mono px-2"
                              title="Copy account number"
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
                        </div>
                      )}

                      {bankAccountName && (
                        <div>
                          <span className="text-[10px] text-text-muted block uppercase tracking-wider">Account Holder</span>
                          <span className="text-xs font-semibold text-text-primary">{bankAccountName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/40 text-[10px] text-text-muted">
                    *Please include your team code <span className="font-mono font-bold text-brand-primary">{team.teamCode}</span> in transfer notes.
                  </div>
                </div>

                {/* 2. QRIS Payment Card */}
                <div className="p-4 rounded-xl bg-bg-surface/60 border border-border/60 flex flex-col items-center justify-between text-center space-y-3">
                  <div className="w-full flex items-center justify-center gap-2">
                    <QrCode className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                      QRIS Instant Payment
                    </span>
                  </div>

                  {qrisUrl ? (
                    <div
                      onClick={() => setQrisModalOpen(true)}
                      className="group relative cursor-pointer rounded-xl bg-white p-2.5 border border-white/20 shadow-md transition-all duration-300 hover:scale-[1.03] hover:shadow-brand-glow-sm"
                    >
                      <img
                        src={qrisUrl}
                        alt="QRIS Barcode"
                        className="w-32 h-32 object-contain rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 text-xs text-brand-primary font-semibold transition-opacity backdrop-blur-xs">
                        <ZoomIn className="w-4 h-4" />
                        <span>Click to Enlarge</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-xl border-2 border-dashed border-border/60 bg-bg-surface flex flex-col items-center justify-center gap-1.5 text-text-muted p-2">
                      <QrCode className="w-8 h-8 opacity-40" />
                      <span className="text-[10px] font-semibold text-center">QRIS Available Soon</span>
                    </div>
                  )}

                  <p className="text-[10px] text-text-muted leading-tight">
                    Scan via BCA Mobile, GoPay, OVO, Dana, ShopeePay, or any mobile banking app.
                  </p>
                </div>
              </div>
            </GlassPanel>
          )}

          {/* Upload Form */}
          <GlassPanel className="space-y-6">
            <h3 className="font-bold text-sm text-text-primary">
              {isInternational ? "Verification Document Upload" : "Submit Transfer Receipt"}
            </h3>

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
                  Verification approved! Your team slot is officially confirmed.
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
                        value={formatRupiah(targetAmount)}
                        className="w-full px-3 py-2 rounded bg-bg-surface border border-border text-sm font-mono text-text-primary focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label htmlFor="proof" className="text-xs font-semibold text-text-secondary uppercase">
                      {isInternational ? "ID Scan or Commitment Letter (PDF/JPG)" : "Payment Proof Image / PDF Receipt"}
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
          <h3 className="font-bold text-sm text-text-primary">Verification Status</h3>
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

      {/* QRIS Fullscreen Zoom Modal */}
      {qrisModalOpen && qrisUrl && (
        <div
          onClick={() => setQrisModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-bg-surface border border-border rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center"
          >
            <button
              onClick={() => setQrisModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-text-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-base font-bold text-text-primary">Scan QRIS to Pay</h3>
              <p className="text-xs text-text-muted mt-1">
                Amount: <span className="font-mono font-bold text-brand-primary">{formatRupiah(targetAmount)}</span>
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl inline-block mx-auto border border-white/30 shadow-lg">
              <img
                src={qrisUrl}
                alt="QRIS Barcode Full"
                className="w-64 h-64 object-contain rounded-lg"
              />
            </div>

            <div className="space-y-1 text-xs text-text-muted">
              {bankName && <p className="font-semibold text-text-primary">{bankName} / QRIS</p>}
              {bankAccountName && <p>{bankAccountName}</p>}
            </div>

            <NeonButton
              type="button"
              size="sm"
              onClick={() => setQrisModalOpen(false)}
              className="w-full"
            >
              Close
            </NeonButton>
          </div>
        </div>
      )}
    </div>
  );
}

