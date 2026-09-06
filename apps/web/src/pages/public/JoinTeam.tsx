import React, { useEffect, useState } from "react";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { NeonButton } from "@/components/compsphere/NeonButton";
import { Users, AlertCircle, CheckCircle2 } from "lucide-react";

export function JoinTeam() {
  const [searchParams] = useSearchParams();
  const params = useParams<{ token?: string }>();
  const navigate = useNavigate();
  const { hasGoogleSession, isLoading: isAuthLoading, signInWithGoogle, refetch, user } = useAuth();

  const token = params.token || searchParams.get("invite") || searchParams.get("token");
  const [status, setStatus] = useState<"INITIAL" | "REDEEMING" | "SUCCESS" | "ERROR">("INITIAL");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      sessionStorage.setItem("compsphere_pending_invite", token);
      localStorage.setItem("compsphere_pending_invite", token);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthLoading) return;

    const activeToken = token || sessionStorage.getItem("compsphere_pending_invite") || localStorage.getItem("compsphere_pending_invite");

    if (!activeToken) {
      navigate("/", { replace: true });
      return;
    }

    if (!hasGoogleSession) {
      // User not logged in -> trigger Google SSO login/register
      signInWithGoogle();
      return;
    }

    // User logged in with Google -> auto-redeem invite
    handleRedeem(activeToken);
  }, [isAuthLoading, hasGoogleSession]);

  const handleRedeem = async (inviteToken: string) => {
    setStatus("REDEEMING");
    setErrorMsg(null);
    try {
      await api.post("/api/members/redeem-invite", { token: inviteToken });
      sessionStorage.removeItem("compsphere_pending_invite");
      localStorage.removeItem("compsphere_pending_invite");
      await refetch();
      setStatus("SUCCESS");
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1200);
    } catch (err: any) {
      sessionStorage.removeItem("compsphere_pending_invite");
      localStorage.removeItem("compsphere_pending_invite");

      if (err.data?.code === "ALREADY_IN_TEAM" || err.message?.includes("already a member")) {
        await refetch();
        navigate("/dashboard", { replace: true });
        return;
      }

      setStatus("ERROR");
      setErrorMsg(err.message || "Failed to join team. The invitation link may be invalid or expired.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4 py-12 text-text-primary">
      <GlassPanel className="w-full max-w-md space-y-6 text-center">
        <div className="w-12 h-12 rounded-full bg-brand-dim border border-brand-primary/30 flex items-center justify-center mx-auto text-brand-primary">
          <Users className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-text-primary">Team Workspace Invitation</h1>
          <p className="text-xs text-text-secondary">
            You have been invited to join a competition team workspace on Compsphere.
          </p>
        </div>

        {!hasGoogleSession && !isAuthLoading && (
          <div className="space-y-4 pt-2">
            <div className="p-3 rounded bg-brand-dim/30 border border-brand-primary/20 text-xs text-brand-primary font-medium">
              Redirecting to Google Sign-In to register & join team...
            </div>
            <NeonButton onClick={signInWithGoogle} className="w-full justify-center">
              Sign in with Google to Accept Invitation
            </NeonButton>
          </div>
        )}

        {(isAuthLoading || status === "REDEEMING") && (
          <div className="space-y-3 py-4">
            <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-text-muted">
              {status === "REDEEMING" ? "Joining team workspace..." : "Verifying Google session..."}
            </p>
          </div>
        )}

        {status === "SUCCESS" && (
          <div className="space-y-3 py-4 text-green-400">
            <CheckCircle2 className="w-10 h-10 mx-auto animate-bounce text-brand-primary" />
            <p className="text-sm font-bold text-text-primary">Successfully Joined Team!</p>
            <p className="text-xs text-text-muted">Redirecting to your team workspace dashboard...</p>
          </div>
        )}

        {status === "ERROR" && (
          <div className="space-y-4 pt-2">
            <div className="flex gap-2 items-start p-3 bg-red-950/30 border border-red-900/40 text-red-400 text-xs rounded text-left">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
            <NeonButton
              onClick={() => navigate(user ? "/dashboard" : "/")}
              variant="secondary"
              className="w-full justify-center"
            >
              Go to Dashboard
            </NeonButton>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
