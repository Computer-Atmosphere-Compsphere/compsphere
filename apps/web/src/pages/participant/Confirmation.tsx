import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CountdownCard } from "@/components/compsphere/CountdownCard";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { NeonButton } from "@/components/compsphere/NeonButton";
import { StatusBadge } from "@/components/compsphere/StatusBadge";
import { CheckCircle, AlertTriangle, FileText, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function Confirmation() {
  const { data: myTeam, isLoading } = useQuery<any>({
    queryKey: ["my-team"],
    queryFn: () => api.get("/api/teams/my-team"),
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });

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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary">Confirmation Space</h1>
          <p className="text-xs text-text-secondary mt-1">
            Confirm your slot details and upload documentation to secure your team.
          </p>
        </div>
        <StatusBadge status={team.status} className="text-sm px-4 py-1.5" />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <CountdownCard deadline={team.confirmationDeadline} />

          <GlassPanel className="space-y-6">
            <h3 className="font-bold text-sm text-text-primary uppercase tracking-wider">
              Verification Guidelines
            </h3>

            <div className="space-y-4 text-xs text-text-secondary leading-relaxed">
              <p>
                To officially join Phase 2, the team leader must submit verification files within 48 hours of activating the team. Failure to complete this process will lead to the slot being dropped.
              </p>
              
              {isInternational ? (
                <div className="space-y-2 border-l-2 border-brand-primary pl-4 py-1 bg-brand-dim/5">
                  <p className="font-bold text-brand-primary">International Category Rules</p>
                  <p>
                    No payment is required. You must upload your passport/national ID scan or an official competition commitment letter signed by your advisor.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 border-l-2 border-brand-primary pl-4 py-1 bg-brand-dim/5">
                  <p className="font-bold text-brand-primary">National / Mix Category Rules</p>
                  <p>
                    A confirmation fee of Rp120,000 is required. Please transfer the amount to the official account and upload the transaction receipt.
                  </p>
                </div>
              )}
            </div>

            <Link to="/dashboard/payment" className="block">
              <NeonButton className="w-full">
                Go to Upload Console <ArrowRight className="w-4 h-4 ml-2" />
              </NeonButton>
            </Link>
          </GlassPanel>
        </div>

        {/* Status Tracker */}
        <GlassPanel className="space-y-6">
          <h3 className="font-bold text-sm text-text-primary">Status Timeline</h3>
          
          <div className="relative border-l border-border pl-6 space-y-6 text-xs">
            {/* Step 1: Activated */}
            <div className="relative">
              <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-brand-primary border-2 border-brand-primary text-bg-primary flex items-center justify-center">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              </span>
              <div>
                <p className="font-bold text-text-primary">Team Activated</p>
                <p className="text-[10px] text-text-muted mt-0.5">Leader redeemed team access token.</p>
              </div>
            </div>

            {/* Step 2: Verification Pending */}
            <div className="relative">
              <span className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                payment ? "bg-brand-primary border-brand-primary text-bg-primary" : "bg-bg-primary border-border"
              }`}>
                {payment && <CheckCircle className="w-3.5 h-3.5 shrink-0" />}
              </span>
              <div>
                <p className={`font-bold ${payment ? "text-text-primary" : "text-text-muted"}`}>
                  Verification Uploaded
                </p>
                <p className="text-[10px] text-text-muted mt-0.5">Proof submitted to committee queue.</p>
              </div>
            </div>

            {/* Step 3: Verified */}
            <div className="relative">
              <span className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                team.status === "VERIFIED" || team.status === "SUBMITTED" || team.status === "JUDGED" 
                  ? "bg-brand-primary border-brand-primary text-bg-primary" 
                  : "bg-bg-primary border-border"
              }`}>
                {(team.status === "VERIFIED" || team.status === "SUBMITTED" || team.status === "JUDGED") && (
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                )}
              </span>
              <div>
                <p className={`font-bold ${
                  team.status === "VERIFIED" || team.status === "SUBMITTED" || team.status === "JUDGED"
                    ? "text-text-primary"
                    : "text-text-muted"
                }`}>
                  Confirmed & Verified
                </p>
                <p className="text-[10px] text-text-muted mt-0.5">Permanent Slot secured for Phase 2.</p>
              </div>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
