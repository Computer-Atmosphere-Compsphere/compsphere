import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { NeonButton } from "@/components/compsphere/NeonButton";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { AlertCircle, ArrowLeft, UserCheck } from "lucide-react";

interface JudgeTokenForm {
  token: string;
}

export function OnboardingJudge() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { refetch } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JudgeTokenForm>();

  const onSubmit = async (data: JudgeTokenForm) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await api.post("/api/onboarding/redeem-role", {
        token: data.token.trim(),
        role: "JUDGE",
      });
      await refetch();
      navigate("/judge", { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to validate judge access token.");
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
            <UserCheck className="w-5 h-5 text-purple-400" />
            <span>Judge Portal Onboarding</span>
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            Enter your judge validation credential token to verify your panel invitation and assign the Judge role.
          </p>
        </div>

        {errorMsg && (
          <div className="flex gap-2 items-start p-3 bg-red-950/20 border border-red-900/30 text-red-400 text-xs rounded">
            <AlertCircle className="w-4.5 h-4.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="token" className="text-xs font-semibold text-text-secondary uppercase">
              Judge Access Token
            </label>
            <input
              id="token"
              type="password"
              autoComplete="off"
              placeholder="••••••••••••••••"
              className="w-full px-3 py-2 rounded bg-bg-surface border border-border text-sm text-text-primary focus:outline-none focus:border-brand-primary"
              {...register("token", { required: "Access token is required" })}
            />
            {errors.token && (
              <span className="text-[10px] text-red-400 font-semibold">{errors.token.message}</span>
            )}
          </div>

          <NeonButton type="submit" disabled={isLoading} className="w-full mt-4">
            {isLoading ? "Authenticating..." : "Assign Judge Role"}
          </NeonButton>
        </form>
      </GlassPanel>
    </div>
  );
}
