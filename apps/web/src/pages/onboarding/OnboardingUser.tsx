import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { NeonButton } from "@/components/compsphere/NeonButton";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { AlertCircle, ArrowLeft, User } from "lucide-react";

export function OnboardingUser() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { refetch, googleUser } = useAuth();

  const handleConfirmOnboard = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await api.post("/api/onboarding/user");
      await refetch();
      navigate("/", { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to complete regular user onboarding.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-6 flex flex-col justify-center min-h-[80vh]">
      <NeonButton
        onClick={() => navigate("/onboarding")}
        variant="ghost"
        size="sm"
        className="w-fit mb-6 text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </NeonButton>

      <GlassPanel className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-text-primary flex items-center gap-2">
            <User className="w-5 h-5 text-brand-primary" />
            <span>Regular User Onboarding</span>
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            Confirm your profile details to finalize onboarding as a standard user.
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
            <span className="text-text-muted">Full Name</span>
            <span className="font-bold text-text-primary truncate max-w-[200px]">{googleUser?.name}</span>
          </div>
          <div className="flex justify-between pb-1">
            <span className="text-text-muted">Email Address</span>
            <span className="font-bold text-text-primary truncate max-w-[200px]">{googleUser?.email}</span>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-text-muted leading-relaxed">
            By confirming, you will be onboarded with a standard visitor profile. You will not have access to specific team workspaces, administrative panels, or judging boards unless authorized by the committee.
          </p>
          <NeonButton onClick={handleConfirmOnboard} disabled={isLoading} className="w-full">
            {isLoading ? "Onboarding..." : "Confirm Onboarding"}
          </NeonButton>
        </div>
      </GlassPanel>
    </div>
  );
}
