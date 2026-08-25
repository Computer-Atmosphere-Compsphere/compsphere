import React from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { User, Trophy, Shield, UserCheck, ArrowRight } from "lucide-react";

export function Onboarding() {
  const { isAuthenticating, hasGoogleSession, user } = useAuth();

  if (isAuthenticating) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary text-text-primary">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Guard: Must have a Google session to see onboarding roles
  // (brand-new users may not have a Compsphere profile yet)
  if (!hasGoogleSession) {
    return <Navigate to="/" replace />;
  }

  // Guard: If already onboarded, send directly to dashboard
  if (user && user.onboardingStatus === "COMPLETE") {
    if (user.role === "ADMIN") return <Navigate to="/admin" replace />;
    if (user.role === "JUDGE") return <Navigate to="/judge" replace />;
    if (user.role === "PARTICIPANT") return <Navigate to="/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  const options = [
    {
      label: "Participant Top 30",
      desc: "Activate your qualified Devpost team slot or join an activated team using an invitation link.",
      path: "/onboarding/participant",
      icon: <Trophy className="w-5 h-5 text-brand-primary" />,
    },
    {
      label: "Committee / Admin",
      desc: "Access administrative operations dashboard using your unique committee token.",
      path: "/onboarding/admin",
      icon: <Shield className="w-5 h-5 text-red-400" />,
    },
    {
      label: "Judge",
      desc: "Review proposal files and score Phase 2 deliverables using your judge token.",
      path: "/onboarding/judge",
      icon: <UserCheck className="w-5 h-5 text-purple-400" />,
    },
    {
      label: "Regular User",
      desc: "Onboard as a regular user to browse guidebook details, timeline and public logs.",
      path: "/onboarding/user",
      icon: <User className="w-5 h-5 text-text-secondary" />,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 flex flex-col items-center justify-center min-h-[80vh]">
      <div className="space-y-4 text-center max-w-lg mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-glow text-text-primary">
          Welcome to Compsphere
        </h1>
        <p className="text-sm text-text-secondary">
          Select how you are joining the competition today. Your role selection requires verification access tokens where applicable.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 w-full">
        {options.map((opt, idx) => (
          <Link key={idx} to={opt.path} className="block group">
            <GlassPanel hoverEffect className="border border-border group-hover:border-brand-primary/30 h-full flex flex-col justify-between p-6">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-lg bg-bg-surface border border-border flex items-center justify-center group-hover:shadow-brand-glow-sm transition-all duration-300">
                  {opt.icon}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
                    <span>{opt.label}</span>
                    <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-brand-primary" />
                  </h3>
                  <p className="text-xs text-text-muted mt-2 leading-relaxed">{opt.desc}</p>
                </div>
              </div>
            </GlassPanel>
          </Link>
        ))}
      </div>
    </div>
  );
}
