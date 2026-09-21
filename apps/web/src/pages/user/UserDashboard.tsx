import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { subEvents } from "@/components/landing/events.data";
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button";
import { GlitterFinal } from "@/components/ui/animated-hero-with-web-gl-glitter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ClipboardPaste,
  X,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  MapPin,
} from "lucide-react";

export function UserDashboard() {
  const { user, refetch } = useAuth();
  const navigate = useNavigate();

  const [tokenInput, setTokenInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    role: string;
    memberRole?: string;
    teamName?: string;
    redirectUrl: string;
    message: string;
  } | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  useEffect(() => {
    if (!successData) return;

    const timer = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate(successData.redirectUrl, { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [successData, navigate]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setTokenInput(text.trim());
        setErrorMsg(null);
      }
    } catch {
      // Ignore if permission denied
    }
  };

  const handleRedeem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tokenInput.trim()) {
      setErrorMsg("Please enter a valid access token.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await api.post<any>("/api/user/redeem-token", {
        token: tokenInput.trim(),
      });

      await refetch();

      setSuccessData({
        role: response.data?.role || "PARTICIPANT",
        memberRole: response.data?.memberRole,
        teamName: response.data?.teamName,
        redirectUrl: response.data?.redirectUrl || "/dashboard",
        message: response.message || "Access key verified successfully.",
      });
    } catch (err: any) {
      setErrorMsg(
        err.message || "Invalid or expired access key. Please check and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const criteriaList = [
    { weight: "30%", name: "Technical Feasibility" },
    { weight: "25%", name: "Innovation & AI" },
    { weight: "20%", name: "Problem Fit" },
    { weight: "15%", name: "Market Viability" },
    { weight: "10%", name: "Presentation" },
  ];

  return (
    <div className="relative min-h-screen">
      {/* Background WebGL Glitter */}
      <GlitterFinal speed={0.6} intensity={2.2} uvScale={2.0} />

      {/* ── Section 1: Hero & Access Key Terminal ───────────── */}
      <section className="relative mx-auto max-w-5xl px-6 pt-10 pb-20 text-center">
        {/* User Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-xs font-semibold text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-xl mb-4">
          <span className="h-2 w-2 rounded-full bg-brand-primary animate-pulse" />
          <span>Explorer Portal</span>
          <span className="text-white/40">·</span>
          <span className="text-text-secondary">{user?.fullName}</span>
        </div>

        {/* Title */}
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white">
          Access <span className="bg-white-gradient bg-clip-text text-transparent">Terminal</span>
        </h1>
        <p className="mt-3 text-sm text-text-secondary max-w-xl mx-auto">
          Enter your team token, member invite code, judge pass, or committee key to unlock your workspace.
        </p>

        {/* Minimalist Access Key Card */}
        <div className="mt-10 max-w-xl mx-auto">
          <div className="relative overflow-hidden rounded-[26px] border border-white/15 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-6 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-2xl">
            {/* Top sheen */}
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

            <form onSubmit={handleRedeem} className="space-y-4">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => {
                    setTokenInput(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="Paste access key or invite code..."
                  className="w-full h-12 pl-4 pr-24 rounded-2xl bg-black/50 border border-white/15 focus:border-brand-primary/80 focus:ring-2 focus:ring-brand-primary/20 text-sm font-mono tracking-wide text-white placeholder:text-text-muted transition-all outline-none"
                  autoComplete="off"
                  spellCheck="false"
                />

                <div className="absolute right-2 flex items-center gap-1">
                  {tokenInput ? (
                    <button
                      type="button"
                      onClick={() => setTokenInput("")}
                      className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                      title="Clear"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePaste}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] font-semibold text-white/90 transition-all"
                      title="Paste from clipboard"
                    >
                      <ClipboardPaste className="w-3 h-3" />
                      Paste
                    </button>
                  )}
                </div>
              </div>

              {/* Error message */}
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs text-left"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}

              {/* Submit Button */}
              <LiquidGlassButton
                label={isLoading ? "Verifying Token..." : "Redeem Key"}
                variant="register"
                size="lg"
                className="w-full h-11 text-xs font-bold uppercase tracking-wider"
                icon={
                  isLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5" />
                  )
                }
              />

              {/* Supported tokens hint */}
              <div className="pt-2 text-[11px] text-text-muted flex items-center justify-center gap-2 flex-wrap">
                <span>Supports:</span>
                <span className="text-white/70">Leader Token</span>
                <span>·</span>
                <span className="text-white/70">Member Invite</span>
                <span>·</span>
                <span className="text-white/70">Judge Key</span>
                <span>·</span>
                <span className="text-white/70">Committee Key</span>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ── Section 2: Sub-Events Grid ──────────────────────── */}
      <section className="relative mx-auto max-w-5xl px-6 py-16 border-t border-white/10">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
            CompSphere <span className="bg-white-gradient bg-clip-text text-transparent">Series</span>
          </h2>
          <p className="text-xs text-text-secondary">
            Explore all four events happening across President University.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {subEvents.map((e) => (
            <div
              key={e.id}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/[0.05] flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={e.iconSrc}
                      alt={e.name}
                      className="h-12 w-12 shrink-0 object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                        {e.block}
                      </span>
                      <h3 className="text-base font-bold text-white group-hover:text-brand-primary transition-colors">
                        {e.name}
                      </h3>
                    </div>
                  </div>

                  <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${e.chip} ${e.accent}`}>
                    {e.tag}
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-text-secondary line-clamp-2">
                  {e.description}
                </p>

                <div className="pt-2 text-[11px] text-text-muted flex items-center justify-between border-t border-white/5">
                  <span className="flex items-center gap-1.5 text-white/70">
                    <CalendarDays className="h-3 w-3 text-brand-primary" />
                    {e.date}
                  </span>
                  <span className="flex items-center gap-1.5 truncate max-w-[180px]">
                    <MapPin className="h-3 w-3 text-sky-400" />
                    {e.venue.split(",")[0]}
                  </span>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between">
                <Link
                  to={`/events/${e.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-white/90 hover:text-brand-primary transition-colors"
                >
                  Details <ArrowRight className="h-3 w-3" />
                </Link>
                {e.sponsorNames && e.sponsorNames.length > 0 && (
                  <span className="text-[10px] text-text-muted">
                    {e.sponsorNames.slice(0, 2).join(", ")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 3: Hacksphere Summary & Evaluation Strip ── */}
      <section className="relative mx-auto max-w-5xl px-6 py-16 border-t border-white/10">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Hackathon <span className="bg-white-gradient bg-clip-text text-transparent">Framework</span>
          </h2>
          <p className="text-xs text-text-secondary">
            Structured two-phase competition with standardized judging criteria.
          </p>
        </div>

        {/* Dual phase strip */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-2">
            <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Phase 01 · Online Qualifier</div>
            <h4 className="text-sm font-bold text-white">Idea Proposal & Two-Judge Overlap</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Teams submit architecture proposals in PDF format. Every submission is independently scored by two domain evaluators.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-2">
            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Phase 02 · Main Stage</div>
            <h4 className="text-sm font-bold text-white">24-Hour Offline Hackathon & Pitching</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Top 30 finalist teams build live on-site at President University, Cikarang for 24 hours with live stage pitch before judges.
            </p>
          </div>
        </div>

        {/* Criteria Strip */}
        <div className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-white/[0.02] flex flex-wrap items-center justify-around gap-4 text-center">
          {criteriaList.map((c) => (
            <div key={c.name} className="space-y-0.5">
              <div className="font-mono font-bold text-sm text-white">{c.weight}</div>
              <div className="text-[11px] text-text-muted">{c.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Success Modal ───────────────────────────────────── */}
      <AnimatePresence>
        {successData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm overflow-hidden rounded-[26px] border border-white/20 bg-[#0D0D0D]/95 p-6 text-center shadow-2xl backdrop-blur-3xl space-y-5"
            >
              <div className="relative inline-flex p-3 rounded-full bg-white/[0.08] border border-white/15 text-brand-primary">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Access Granted</h3>
                <p className="text-xs text-text-secondary">{successData.message}</p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-left space-y-1.5">
                <div className="flex justify-between text-text-muted">
                  <span>Role:</span>
                  <span className="font-bold text-brand-primary uppercase">
                    {successData.role} {successData.memberRole ? `(${successData.memberRole})` : ""}
                  </span>
                </div>
                {successData.teamName && (
                  <div className="flex justify-between text-text-muted pt-1 border-t border-white/5">
                    <span>Team:</span>
                    <span className="font-semibold text-white truncate max-w-[160px]">{successData.teamName}</span>
                  </div>
                )}
              </div>

              <LiquidGlassButton
                label={`Enter Dashboard (${redirectCountdown}s)`}
                variant="register"
                onClick={() => navigate(successData.redirectUrl, { replace: true })}
                className="w-full text-xs font-bold"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
