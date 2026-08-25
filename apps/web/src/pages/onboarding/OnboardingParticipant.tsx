import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { NeonButton } from "@/components/compsphere/NeonButton";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { AlertCircle, ArrowLeft, Trophy, Users } from "lucide-react";
import { z } from "zod";

interface TokenForm {
  token: string;
}

interface TeamPreview {
  tokenId: string;
  team: {
    id: string;
    teamName: string;
    teamCode: string;
    category: "NATIONAL" | "MIX" | "INTERNATIONAL";
    originalRank: number;
    paymentAmount: number;
  };
  alreadyHasLeader: boolean;
}

export function OnboardingParticipant() {
  const [step, setStep] = useState<"token" | "preview">("token");
  const [preview, setPreview] = useState<TeamPreview | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { refetch } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TokenForm>();

  const onTokenSubmit = async (data: TokenForm) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.post<TeamPreview>("/api/onboarding/redeem-token", {
        token: data.token.trim(),
      });
      setPreview(res);
      setStep("preview");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to validate team access token.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivateLeader = async () => {
    if (!preview) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await api.post("/api/onboarding/activate-leader", {
        teamId: preview.team.id,
        tokenId: preview.tokenId,
      });
      await refetch();
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to activate team leader membership.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinMember = async () => {
    if (!preview) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await api.post("/api/onboarding/join-member", {
        teamId: preview.team.id,
        tokenId: preview.tokenId,
      });
      await refetch();
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to join team.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-6 flex flex-col justify-center min-h-[80vh]">
      <NeonButton
        onClick={() => {
          if (step === "preview") {
            setStep("token");
          } else {
            navigate("/onboarding");
          }
        }}
        variant="ghost"
        size="sm"
        className="w-fit mb-6 text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </NeonButton>

      {step === "token" ? (
        <GlassPanel className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-text-primary flex items-center gap-2">
              <Trophy className="w-5 h-5 text-brand-primary" />
              <span>Redeem Team Access Token</span>
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              Enter the unique activation token printed on your team migration certificate to verify and claim your slot.
            </p>
          </div>

          {errorMsg && (
            <div className="flex gap-2 items-start p-3 bg-red-950/20 border border-red-900/30 text-red-400 text-xs rounded">
              <AlertCircle className="w-4.5 h-4.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onTokenSubmit)} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="token" className="text-xs font-semibold text-text-secondary uppercase">
                Activation Token
              </label>
              <input
                id="token"
                type="text"
                autoComplete="off"
                placeholder="Paste your hex token here"
                className="w-full px-3 py-2 rounded bg-bg-surface border border-border text-sm text-text-primary focus:outline-none focus:border-brand-primary"
                {...register("token", { required: "Access token is required" })}
              />
              {errors.token && (
                <span className="text-[10px] text-red-400 font-semibold">{errors.token.message}</span>
              )}
            </div>

            <NeonButton type="submit" disabled={isLoading} className="w-full mt-4">
              {isLoading ? "Validating..." : "Verify Token"}
            </NeonButton>
          </form>
        </GlassPanel>
      ) : (
        preview && (
          <GlassPanel className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-text-primary flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-primary" />
                <span>Verified Team Preview</span>
              </h2>
              <p className="text-xs text-text-secondary">
                Verify the team details below are correct before onboarding as a leader.
              </p>
            </div>

            {errorMsg && (
              <div className="flex gap-2 items-start p-3 bg-red-950/20 border border-red-900/30 text-red-400 text-xs rounded">
                <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-3 p-4 rounded bg-bg-surface border border-border text-sm">
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-text-muted">Team Code</span>
                <span className="font-bold text-text-primary">{preview.team.teamCode}</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-text-muted">Team Name</span>
                <span className="font-bold text-text-primary truncate max-w-[200px]">
                  {preview.team.teamName}
                </span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-text-muted">Category</span>
                <span className="font-bold text-brand-primary">{preview.team.category}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-text-muted">Devpost Rank</span>
                <span className="font-bold text-text-primary">#{preview.team.originalRank}</span>
              </div>
            </div>

            {preview.alreadyHasLeader ? (
              <div className="space-y-4">
                <div className="p-3 bg-yellow-950/20 border border-yellow-900/30 text-yellow-400 text-xs rounded flex gap-2 items-start leading-relaxed">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                  <span>
                    <strong>Leader Already Active:</strong> This team already has a leader. You can join as a team member below.
                  </span>
                </div>
                <NeonButton onClick={handleJoinMember} disabled={isLoading} className="w-full">
                  {isLoading ? "Joining..." : "Join as Team Member"}
                </NeonButton>
                <NeonButton onClick={() => navigate("/onboarding")} variant="secondary" className="w-full">
                  Return to Role Selection
                </NeonButton>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-text-muted leading-relaxed">
                  Onboarding as the <strong>Team Leader</strong> will activate the team, start your 48-hour slot confirmation SLA window, and allow you to generate member invitation links.
                </p>
                <NeonButton onClick={handleActivateLeader} disabled={isLoading} className="w-full">
                  {isLoading ? "Activating..." : "Confirm & Onboard as Leader"}
                </NeonButton>
              </div>
            )}
          </GlassPanel>
        )
      )}
    </div>
  );
}
