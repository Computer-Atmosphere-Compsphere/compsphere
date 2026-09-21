import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { subEvents, sponsors } from "@/components/landing/events.data";
import { SectionHeading } from "@/components/landing/SectionHeading";
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button";
import { GlitterFinal } from "@/components/ui/animated-hero-with-web-gl-glitter";
import { motion, AnimatePresence } from "framer-motion";
import {
  KeyRound,
  Shield,
  Scale,
  Rocket,
  Users,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ClipboardPaste,
  X,
  CalendarDays,
  MapPin,
  Code2,
  FileText,
  Lightbulb,
  Building2,
  Globe2,
  Award,
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

  // Auto redirect timer when token redeemed successfully
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
      // Ignore clipboard read error if permission denied
    }
  };

  const handleRedeem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tokenInput.trim()) {
      setErrorMsg("Please enter an access key or invite token.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await api.post<any>("/api/user/redeem-token", {
        token: tokenInput.trim(),
      });

      // Refetch auth state so new role propagates
      await refetch();

      setSuccessData({
        role: response.data?.role || "PARTICIPANT",
        memberRole: response.data?.memberRole,
        teamName: response.data?.teamName,
        redirectUrl: response.data?.redirectUrl || "/dashboard",
        message: response.message || "Access key redeemed successfully.",
      });
    } catch (err: any) {
      setErrorMsg(
        err.message || "Invalid or expired access key. Please verify your token."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const evaluationMatrix = [
    {
      percentage: "30%",
      label: "Technical Architecture",
      icon: <Code2 className="w-5 h-5 text-emerald-400" />,
      desc: "Robustness, scalability, security, tech stack suitability, and code viability.",
    },
    {
      percentage: "25%",
      label: "Innovation & AI",
      icon: <Lightbulb className="w-5 h-5 text-amber-400" />,
      desc: "Novelty of approach, differentiation, and creative integration of modern tech.",
    },
    {
      percentage: "20%",
      label: "Problem & Solution Fit",
      icon: <Globe2 className="w-5 h-5 text-sky-400" />,
      desc: "Understanding domain bottlenecks, user empathy, and practical effectiveness.",
    },
    {
      percentage: "15%",
      label: "Market & Impact Viability",
      icon: <Building2 className="w-5 h-5 text-purple-400" />,
      desc: "Business model scalability, sustainability, and tangible industry impact.",
    },
    {
      percentage: "10%",
      label: "Proposal & Presentation",
      icon: <FileText className="w-5 h-5 text-rose-400" />,
      desc: "Clarity of technical documentation, diagrams, and live pitch execution.",
    },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Background WebGL Glitter Canvas */}
      <GlitterFinal speed={0.65} intensity={2.5} uvScale={2.0} />

      {/* ── Hero & Access Terminal Section ────────────────── */}
      <section className="relative mx-auto max-w-6xl px-6 pt-8 pb-20">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-xs font-semibold text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-xl">
            <span className="h-2 w-2 rounded-full bg-brand-primary animate-pulse" />
            CompSphere 2026 Atmosphere · Regular Explorer
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight">
            Unlock Your <span className="bg-white-gradient bg-clip-text text-transparent">Workspace</span>
          </h1>

          <p className="text-sm sm:text-base text-text-secondary leading-relaxed max-w-2xl mx-auto">
            Welcome, <span className="text-white font-bold">{user?.fullName}</span>. Enter your official access key below to instantly transition into a <span className="text-brand-primary font-semibold">Hackathon Participant</span>, <span className="text-amber-400 font-semibold">Judge</span>, or <span className="text-purple-400 font-semibold">Committee Member</span>.
          </p>
        </div>

        {/* ── Liquid Glass Terminal Container ─────────────── */}
        <div className="mt-10 max-w-2xl mx-auto">
          <div className="relative overflow-hidden rounded-[28px] border border-white/20 bg-gradient-to-b from-white/[0.09] to-white/[0.02] p-6 sm:p-8 shadow-[0_30px_90px_rgba(0,0,0,0.65),0_6px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-3xl ring-1 ring-white/10">
            {/* Top glass sheen */}
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            <div className="pointer-events-none absolute -top-24 left-1/2 h-40 w-3/4 -translate-x-1/2 rounded-full bg-white/[0.12] blur-3xl" />

            <form onSubmit={handleRedeem} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-text-muted flex items-center justify-between">
                  <span>Enter Access Key / Invite Token</span>
                  <span className="text-[10px] text-white/50">Case-sensitive</span>
                </label>

                <div className="relative flex items-center">
                  <KeyRound className="absolute left-4 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    value={tokenInput}
                    onChange={(e) => {
                      setTokenInput(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="e.g. HACK-2026-XXXX or ACCESS_KEY"
                    className="w-full h-13 pl-11 pr-28 rounded-2xl bg-black/60 border border-white/20 focus:border-brand-primary/80 focus:ring-4 focus:ring-brand-primary/10 text-sm font-mono tracking-wider text-white placeholder:text-text-muted transition-all outline-none"
                    autoComplete="off"
                    spellCheck="false"
                  />

                  <div className="absolute right-2.5 flex items-center gap-1">
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
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-[11px] font-semibold text-white transition-all"
                        title="Paste from clipboard"
                      >
                        <ClipboardPaste className="w-3 h-3" />
                        Paste
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Error feedback */}
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <div className="space-y-0.5 leading-relaxed">
                    <p className="font-semibold">{errorMsg}</p>
                    <p className="text-[11px] text-red-400/80">
                      Ensure your token is copied correctly from your email, leader invite, or committee notification.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Submit CTA */}
              <div className="pt-2">
                <LiquidGlassButton
                  label={isLoading ? "Authenticating Key..." : "Redeem & Activate Access"}
                  variant="register"
                  size="lg"
                  className="w-full h-12 text-sm font-bold tracking-wide"
                  icon={
                    isLoading ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )
                  }
                />
              </div>

              {/* Key Classification Ledger */}
              <div className="pt-3 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                <div className="flex items-center gap-1.5 text-text-muted">
                  <Rocket className="w-3 h-3 text-brand-primary shrink-0" />
                  <span className="truncate">Team Leader Key</span>
                </div>
                <div className="flex items-center gap-1.5 text-text-muted">
                  <Users className="w-3 h-3 text-sky-400 shrink-0" />
                  <span className="truncate">Member Invite Code</span>
                </div>
                <div className="flex items-center gap-1.5 text-text-muted">
                  <Scale className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="truncate">Judge Evaluation Key</span>
                </div>
                <div className="flex items-center gap-1.5 text-text-muted">
                  <Shield className="w-3 h-3 text-purple-400 shrink-0" />
                  <span className="truncate">Committee Admin Key</span>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ── Success Transition Modal ───────────────────────── */}
      <AnimatePresence>
        {successData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/30 bg-[#0D0D0D]/95 p-8 text-center shadow-[0_20px_80px_rgba(0,0,0,0.85),0_0_50px_rgba(0,245,200,0.15)] backdrop-blur-3xl space-y-6"
            >
              <div className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-white/[0.1] blur-3xl" />

              <div className="relative inline-flex p-4 rounded-full bg-white/[0.08] border border-white/20 text-brand-primary shadow-lg">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-2xl font-black text-white">
                  Access Key Verified
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {successData.message}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2 text-xs text-left">
                <div className="flex justify-between items-center text-text-muted">
                  <span>Assigned Permission</span>
                  <span className="font-extrabold text-brand-primary uppercase tracking-wider">
                    {successData.role} {successData.memberRole ? `(${successData.memberRole})` : ""}
                  </span>
                </div>
                {successData.teamName && (
                  <div className="flex justify-between items-center text-text-muted pt-2 border-t border-white/10">
                    <span>Competition Team</span>
                    <span className="font-bold text-white truncate max-w-[180px]">
                      {successData.teamName}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-2">
                <LiquidGlassButton
                  label={`Launch Workspace Now (${redirectCountdown}s)`}
                  variant="register"
                  onClick={() => navigate(successData.redirectUrl, { replace: true })}
                  className="w-full h-11 text-xs font-bold"
                />
                <p className="text-[10px] text-text-muted">
                  Redirecting automatically in {redirectCountdown} seconds...
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Sub-Events Series Section ─────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-6 py-16 border-t border-white/10">
        <SectionHeading
          title="COMPSPHERE SUB-EVENTS"
          subtitle="Discover all four major pillars of the CompSphere ecosystem held across President University and premier venues."
        />

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {subEvents.map((e) => (
            <div
              key={e.id}
              className="group relative overflow-hidden rounded-[26px] border border-white/15 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-2xl transition-all duration-300 hover:border-white/30 hover:from-white/[0.10] flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={e.iconSrc}
                      alt={e.name}
                      className="h-14 w-14 shrink-0 object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-105"
                    />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                        {e.block}
                      </span>
                      <h3 className="text-xl font-extrabold text-white group-hover:text-brand-primary transition-colors">
                        {e.name}
                      </h3>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${e.chip} ${e.accent}`}>
                    {e.tag}
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-text-secondary line-clamp-3">
                  {e.description}
                </p>

                <div className="space-y-1.5 pt-3 border-t border-white/10 text-xs">
                  <div className="flex items-center gap-2 text-white/80">
                    <CalendarDays className="h-3.5 w-3.5 text-brand-primary shrink-0" />
                    <span>{e.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-muted">
                    <MapPin className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                    <span className="truncate">{e.venue}</span>
                  </div>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-white/10 flex items-center justify-between">
                <Link
                  to={`/events/${e.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-brand-primary transition-colors"
                >
                  View Event Overview <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>

                {e.sponsorNames && e.sponsorNames.length > 0 && (
                  <span className="text-[10px] text-text-muted truncate max-w-[160px]">
                    Supported by {e.sponsorNames.slice(0, 2).join(", ")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Hacksphere Competition Blueprint ──────────────── */}
      <section className="relative mx-auto max-w-6xl px-6 py-16 border-t border-white/10">
        <SectionHeading
          title="COMPETITION MAINNET"
          subtitle="Hacksphere operates a two-phase qualification framework to ensure world-class software deliverables."
        />

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {/* Phase 1 Box */}
          <div className="relative overflow-hidden rounded-[26px] border border-white/15 bg-gradient-to-b from-white/[0.06] to-white/[0.01] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-sky-400 border border-sky-400/30 bg-sky-400/10 px-3 py-1 rounded-full">
                Phase 01 · Qualifier
              </span>
              <span className="text-xs font-mono text-text-muted">Aug 25 – Sep 30</span>
            </div>

            <h3 className="text-xl font-bold text-white">Idea Proposal & Architecture Submission</h3>
            <p className="text-xs leading-relaxed text-text-secondary">
              Teams submit an end-to-end technical proposal in PDF format covering system architecture, problem identification, innovation value proposition, and market viability.
            </p>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5 text-xs">
              <div className="font-semibold text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-brand-primary" /> Two-Judge Overlap Protocol
              </div>
              <p className="text-[11px] text-text-muted">
                Each submission is independently scored by two professional domain evaluators. Scores with significant variance are automatically escalated to the Chief Judge.
              </p>
            </div>
          </div>

          {/* Phase 2 Box */}
          <div className="relative overflow-hidden rounded-[26px] border border-white/15 bg-gradient-to-b from-white/[0.06] to-white/[0.01] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 rounded-full">
                Phase 02 · Main Stage
              </span>
              <span className="text-xs font-mono text-text-muted">Oct 10 – 11, 2026</span>
            </div>

            <h3 className="text-xl font-bold text-white">24-Hour Offline Hackathon & Live Pitch</h3>
            <p className="text-xs leading-relaxed text-text-secondary">
              Qualified Top 30 finalist teams gather at President University, Cikarang for an intense 24-hour coding sprint, live prototype deployment, code freeze, and live stage pitching.
            </p>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5 text-xs">
              <div className="font-semibold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" /> IDR 50M+ Total Ecosystem Prize Pool
              </div>
              <p className="text-[11px] text-text-muted">
                Prizes, championship trophies, partner cloud credits, and direct investor/startup networking opportunities across all tracks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Standardized Judging Matrix ───────────────────── */}
      <section className="relative mx-auto max-w-6xl px-6 py-16 border-t border-white/10">
        <SectionHeading
          title="OFFICIAL EVALUATION MATRIX"
          subtitle="Standardized 5-pillar evaluation criteria applied across all tracks by our panel of industry judges."
        />

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {evaluationMatrix.map((item) => (
            <div
              key={item.label}
              className="relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5 shadow-lg backdrop-blur-xl space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-white/10 border border-white/10">
                    {item.icon}
                  </div>
                  <span className="font-mono font-black text-lg text-white">
                    {item.percentage}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white">{item.label}</h4>
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
