import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function AuthCallback() {
  const { isAuthenticated, isAuthenticating, isLoading, hasGoogleSession, needsOnboarding, user, refetch } = useAuth();
  const navigate = useNavigate();

  console.log("🔍 [AuthCallback] Debug State:", {
    isAuthenticating,
    isLoading,
    hasGoogleSession,
    needsOnboarding,
    isAuthenticated,
    user: user ? { email: user.email, role: user.role, onboardingStatus: user.onboardingStatus } : null
  });

  useEffect(() => {
    // Refetch COMPSPHERE user session info once OAuth session is validated by better-auth
    refetch();
  }, [refetch]);

  useEffect(() => {
    // Wait until both better-auth session AND compsphere profile query are resolved
    if (isAuthenticating || isLoading) return;

    // Case 1: New user or profile query failed — Google session exists but no profile → onboarding
    if (hasGoogleSession && (needsOnboarding || !user)) {
      navigate("/onboarding", { replace: true });
      return;
    }

    // Case 2: No Google session at all → back to landing
    if (!isAuthenticated || !user) {
      const timer = setTimeout(() => navigate("/", { replace: true }), 3000);
      return () => clearTimeout(timer);
    }

    // Case 3: Existing user with profile — route by onboarding status then role
    if (user.onboardingStatus === "INCOMPLETE") {
      navigate("/onboarding", { replace: true });
      return;
    }

    if (user.role === "ADMIN") {
      navigate("/admin", { replace: true });
    } else if (user.role === "JUDGE") {
      navigate("/judge", { replace: true });
    } else if (user.role === "PARTICIPANT") {
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/onboarding", { replace: true }); // USER role → finish onboarding
    }
  }, [isAuthenticated, isAuthenticating, isLoading, hasGoogleSession, needsOnboarding, user, navigate]);

  return (
    <div className="flex h-screen items-center justify-center bg-bg-primary text-text-primary">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto shadow-brand-glow" />
        <div className="space-y-1">
          <p className="font-bold text-sm text-text-primary uppercase tracking-wider">
            Authenticating
          </p>
          <p className="text-xs text-text-muted">Resolving competition session profiles...</p>
        </div>
      </div>
    </div>
  );
}
