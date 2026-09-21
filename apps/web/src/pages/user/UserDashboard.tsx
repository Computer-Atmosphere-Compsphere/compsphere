import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { NeonButton } from "@/components/compsphere/NeonButton";
import { subEvents } from "@/components/landing/events.data";
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
  Compass,
  Trophy,
  Calendar,
  Layers,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Flame,
  Globe2,
  Code2,
  FileText,
  Lightbulb,
  Building2,
  Clock,
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
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeStage, setActiveStage] = useState<number>(0);

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
      setErrorMsg("Please enter a valid access token or key.");
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
        message: response.message || "Token redeemed successfully!",
      });
    } catch (err: any) {
      setErrorMsg(
        err.message || "Invalid or expired access token. Please check and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const competitionStages = [
    {
      step: "01",
      title: "Account & Role Claiming",
      status: "CURRENT STEP",
      badge: "Open Now",
      desc: "Create your Compsphere profile and redeem your unique access token (Team Token, Member Invite, Judge Pass, or Committee Key) to unlock your custom event portal.",
      actionText: "Use the Token Terminal above",
    },
    {
      step: "02",
      title: "Team Confirmation & SLA",
      status: "TOP 30 HACKATHON",
      badge: "48-Hour SLA",
      desc: "Qualified Top 30 teams confirm attendance by paying the commitment deposit and uploading required verification documents within the 48-hour countdown window.",
      actionText: "Unlocked for Team Leaders",
    },
    {
      step: "03",
      title: "Phase 1: Idea Proposal & Scoring",
      status: "PRELIMINARY ROUND",
      badge: "Two-Judge System",
      desc: "Teams submit comprehensive architecture proposals evaluated across 5 official judging criteria (Technical, Innovation, Problem Fit, Market Viability, Documentation).",
      actionText: "Evaluated by Official Judges",
    },
    {
      step: "04",
      title: "Phase 2: 24H Offline Hackathon",
      status: "MAIN STAGE",
      badge: "Oct 10-11, 2026",
      desc: "Top finalist teams gather at President University for a 24-hour continuous coding sprint, live prototype deployment, code freeze, and live stage pitching.",
      actionText: "Live on Campus",
    },
    {
      step: "05",
      title: "Grand Awarding & Festsphere Gala",
      status: "FINALE",
      badge: "Prize Distribution",
      desc: "Awarding ceremony with IDR 50M+ total prize distribution, trophies, partner perks, and celebratory cultural performances.",
      actionText: "Grand Auditorium",
    },
  ];

  const scoringPillars = [
    {
      weight: "30%",
      name: "Technical Architecture & Feasibility",
      icon: <Code2 className="w-5 h-5 text-emerald-400" />,
      color: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-300",
      desc: "System design, tech stack choice, scalability, security considerations, and implementation feasibility.",
    },
    {
      weight: "25%",
      name: "Innovation & Value Proposition",
      icon: <Lightbulb className="w-5 h-5 text-amber-400" />,
      color: "from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-300",
      desc: "Novelty of the concept, differentiation from existing solutions, and creative leverage of technology.",
    },
    {
      weight: "20%",
      name: "Problem Relevance & Solution Fit",
      icon: <Globe2 className="w-5 h-5 text-sky-400" />,
      color: "from-sky-500/20 to-sky-500/5 border-sky-500/30 text-sky-300",
      desc: "Understanding the problem statement, user empathy, target demographic alignment, and direct problem solving.",
    },
    {
      weight: "15%",
      name: "Market Viability & Impact",
      icon: <Building2 className="w-5 h-5 text-purple-400" />,
      color: "from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-300",
      desc: "Real-world applicability, business model sustainability, scalability potential, and social/industry impact.",
    },
    {
      weight: "10%",
      name: "Document Clarity & Presentation",
      icon: <FileText className="w-5 h-5 text-rose-400" />,
      color: "from-rose-500/20 to-rose-500/5 border-rose-500/30 text-rose-300",
      desc: "Structured proposal format, clear diagrams, concise pitch, and adherence to submission guidelines.",
    },
  ];

  const faqs = [
    {
      q: "Where do I get an Access Token?",
      a: "Access tokens are distributed through official channels: Team Leaders receive Team Tokens via registration confirmation email/WhatsApp. Team Members receive invite codes generated by their Team Leader. Judges and Committee members receive official keys directly from the executive committee.",
    },
    {
      q: "What happens after I enter my Access Token?",
      a: "The system automatically detects your token type (Committee, Judge, Team Leader, or Team Member) and updates your account permissions in real-time, redirecting you directly to your specialized portal.",
    },
    {
      q: "Can I explore CompSphere as a Regular Explorer without a token?",
      a: "Absolutely! Regular users can explore the comprehensive event guidebook, public timeline, announcements, sub-event showcases (Exposphere, Talksphere, Hacksphere, Festsphere), and visit on-site public exhibitions.",
    },
    {
      q: "I am a registered team member, how do I join my leader's team?",
      a: "Ask your Team Leader to open their Participant Dashboard, navigate to 'Team Space', and generate an invite code for you. You can then paste that code into the Token Terminal above or click the direct invite link.",
    },
  ];

  return (
    <div className="space-y-12 pb-16">
      {/* ── Top Welcome & Header ─────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-brand-primary/10 via-[#0E121E] to-[#080B12] p-6 sm:p-10 shadow-2xl">
        {/* Glow orb */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/30 text-brand-primary text-xs font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              CompSphere 2026 Atmosphere
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-teal-300 to-sky-400">{user?.fullName || "Explorer"}</span>!
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              You are currently logged in with a <span className="text-white font-semibold">Standard Explorer Account</span>. Enter your access token below to automatically upgrade your account to a <span className="text-brand-primary font-semibold">Hackathon Participant</span>, <span className="text-amber-400 font-semibold">Judge</span>, or <span className="text-purple-400 font-semibold">Committee Member</span>.
            </p>
          </div>

          <div className="shrink-0 flex sm:flex-col items-center sm:items-end gap-3">
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md text-right w-full sm:w-auto">
              <div className="text-[10px] uppercase font-bold text-text-muted tracking-widest">
                Current Access Role
              </div>
              <div className="text-lg font-black text-white flex items-center justify-end gap-2 mt-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                Regular User
              </div>
              <div className="text-[10px] text-text-secondary mt-1">
                {user?.email}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Universal Access Token Terminal ──────────────── */}
      <section className="relative">
        <GlassPanel className="relative overflow-hidden border-brand-primary/30 bg-[#0C101A]/90 p-6 sm:p-8 shadow-[0_0_50px_rgba(0,245,200,0.06)]">
          {/* Cyber Accent Line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-brand-primary to-transparent" />

          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-brand-primary/10 border border-brand-primary/25 text-brand-primary mb-1">
                <KeyRound className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Universal Access Token Terminal
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary max-w-xl mx-auto">
                Enter any official CompSphere access token or passphrase. Our authentication system will instantly identify your role and unlock your workspace.
              </p>
            </div>

            {/* Token Types Supported Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
                <Rocket className="w-4 h-4 text-brand-primary shrink-0" />
                <div className="min-w-0">
                  <div className="font-bold text-white text-[11px] truncate">Team Token</div>
                  <div className="text-[9px] text-text-muted truncate">Leader Activation</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
                <Users className="w-4 h-4 text-sky-400 shrink-0" />
                <div className="min-w-0">
                  <div className="font-bold text-white text-[11px] truncate">Member Invite</div>
                  <div className="text-[9px] text-text-muted truncate">Join Hacksphere Team</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
                <Scale className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <div className="font-bold text-white text-[11px] truncate">Judge Key</div>
                  <div className="text-[9px] text-text-muted truncate">Evaluation Portal</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
                <Shield className="w-4 h-4 text-purple-400 shrink-0" />
                <div className="min-w-0">
                  <div className="font-bold text-white text-[11px] truncate">Committee Key</div>
                  <div className="text-[9px] text-text-muted truncate">Admin Control Room</div>
                </div>
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleRedeem} className="space-y-4 pt-2">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => {
                    setTokenInput(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="Paste or enter access token here..."
                  className="w-full h-14 pl-12 pr-28 rounded-2xl bg-black/50 border-2 border-white/15 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 text-sm font-mono tracking-wider text-white placeholder:text-text-muted transition-all duration-200 outline-none"
                  autoComplete="off"
                  spellCheck="false"
                />
                <KeyRound className="absolute left-4 w-5 h-5 text-text-muted" />

                <div className="absolute right-3 flex items-center gap-1.5">
                  {tokenInput ? (
                    <button
                      type="button"
                      onClick={() => setTokenInput("")}
                      className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/10 transition-colors"
                      title="Clear"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePaste}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-text-secondary hover:text-white transition-all"
                      title="Paste from Clipboard"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5" />
                      Paste
                    </button>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold">{errorMsg}</p>
                    <p className="text-[11px] text-red-400/80">
                      Please ensure your token is copied correctly without extra spaces. Contact your team leader or committee if you need a new code.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Submit Button */}
              <NeonButton
                type="submit"
                disabled={isLoading || !tokenInput.trim()}
                className="w-full h-12 text-sm font-extrabold uppercase tracking-wider"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Validating & Upgrading Role...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Activate Token & Upgrade Role</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </NeonButton>
            </form>
          </div>
        </GlassPanel>
      </section>

      {/* ── Success Celebration Modal ─────────────────────── */}
      <AnimatePresence>
        {successData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border-2 border-brand-primary/50 bg-[#0E1322] p-8 text-center shadow-[0_0_80px_rgba(0,245,200,0.25)] space-y-6"
            >
              <div className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-brand-primary/20 blur-3xl" />

              <div className="relative inline-flex p-4 rounded-3xl bg-brand-primary/10 border border-brand-primary/40 text-brand-primary shadow-brand-glow">
                <CheckCircle2 className="w-12 h-12 animate-bounce" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white">
                  Access Granted!
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {successData.message}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2 text-xs">
                <div className="flex justify-between items-center text-text-muted">
                  <span>Assigned Role</span>
                  <span className="font-extrabold text-brand-primary uppercase tracking-wider">
                    {successData.role} {successData.memberRole ? `(${successData.memberRole})` : ""}
                  </span>
                </div>
                {successData.teamName && (
                  <div className="flex justify-between items-center text-text-muted pt-2 border-t border-white/10">
                    <span>Team Workspace</span>
                    <span className="font-bold text-white truncate max-w-[180px]">
                      {successData.teamName}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <NeonButton
                  onClick={() => navigate(successData.redirectUrl, { replace: true })}
                  className="w-full h-11 text-xs font-bold uppercase tracking-wider"
                >
                  Enter Workspace Now ({redirectCountdown}s)
                </NeonButton>
                <p className="text-[10px] text-text-muted">
                  Automatically redirecting in {redirectCountdown} seconds...
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CompSphere Concept & Ecosystem Section ────────── */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">
              Event Architecture
            </div>
            <h2 className="text-xl sm:text-3xl font-extrabold text-white mt-1">
              The CompSphere 2026 Ecosystem
            </h2>
          </div>
          <p className="text-xs text-text-secondary max-w-md">
            Organized by PUFA Computing (President University Faculty of Computer Science), creating an inclusive technological atmosphere for builders, creators, and leaders.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassPanel className="space-y-3 p-5 border-white/10 bg-white/[0.02]">
            <div className="w-9 h-9 rounded-xl bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center text-brand-primary">
              <Rocket className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Innovation & AI</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Fostering breakthrough engineering, AI integration, and next-generation software architecture solving real industry bottlenecks.
            </p>
          </GlassPanel>

          <GlassPanel className="space-y-3 p-5 border-white/10 bg-white/[0.02]">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Globe2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Global Collaboration</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Uniting cross-border talent across National, Mixed, and International tracks with participants from over 15+ countries.
            </p>
          </GlassPanel>

          <GlassPanel className="space-y-3 p-5 border-white/10 bg-white/[0.02]">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Competitive Excellence</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              A dual-phase rigorous qualification with Two-Judge Overlap scoring, on-site 24-hour hackathon, and live stage pitching.
            </p>
          </GlassPanel>

          <GlassPanel className="space-y-3 p-5 border-white/10 bg-white/[0.02]">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Industry Mentorship</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Direct access to technology practitioners, founders, and career mentors from prominent tech companies and sponsor networks.
            </p>
          </GlassPanel>
        </div>
      </section>

      {/* ── Sub-Events Explorer ───────────────────────────── */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">
              Sub-Events Series
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              Explore All 4 Event Chains
            </h2>
          </div>
          <Link
            to="/guidebook"
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline"
          >
            Full Guidebook <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {subEvents.map((evt) => (
            <GlassPanel
              key={evt.id}
              className="group relative overflow-hidden p-6 border-white/10 bg-[#0C0F1A]/80 hover:border-white/25 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={evt.iconSrc}
                      alt={evt.name}
                      className="w-12 h-12 object-contain rounded-xl drop-shadow-md group-hover:scale-110 transition-transform duration-300"
                    />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                        {evt.block}
                      </span>
                      <h3 className="text-lg font-extrabold text-white group-hover:text-brand-primary transition-colors">
                        {evt.name}
                      </h3>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${evt.chip} ${evt.accent}`}>
                    {evt.tag}
                  </span>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">
                  {evt.description}
                </p>

                <div className="space-y-1.5 pt-2 border-t border-white/10 text-xs">
                  <div className="flex items-center gap-2 text-text-muted">
                    <Calendar className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                    <span>{evt.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-muted">
                    <Compass className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span className="truncate">{evt.venue}</span>
                  </div>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-white/5 flex items-center justify-between">
                <Link
                  to={`/events/${evt.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:text-teal-300 transition-colors"
                >
                  Explore Details & Schedule <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                {evt.sponsorNames && evt.sponsorNames.length > 0 && (
                  <div className="text-[10px] text-text-muted truncate max-w-[150px]">
                    Supported by {evt.sponsorNames.slice(0, 2).join(", ")}
                  </div>
                )}
              </div>
            </GlassPanel>
          ))}
        </div>
      </section>

      {/* ── 5-Stage Competition Journey Timeline ──────────── */}
      <section className="space-y-6">
        <div>
          <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
            Roadmap & Flow
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
            5-Stage Participant Journey
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Click on any phase below to inspect the step-by-step requirements.
          </p>
        </div>

        <div className="grid gap-3">
          {competitionStages.map((stg, idx) => {
            const isExpanded = activeStage === idx;
            return (
              <div
                key={stg.step}
                onClick={() => setActiveStage(isExpanded ? -1 : idx)}
                className={`cursor-pointer rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isExpanded
                    ? "border-brand-primary/40 bg-brand-primary/5 shadow-lg"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                }`}
              >
                <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <span className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center font-mono font-black text-sm text-brand-primary">
                      {stg.step}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{stg.title}</h4>
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-text-secondary">
                          {stg.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted mt-0.5 line-clamp-1 sm:line-clamp-none">
                        {stg.badge}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-text-muted">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-brand-primary" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-5 pb-5 pt-1 border-t border-white/10 text-xs space-y-3"
                    >
                      <p className="text-text-secondary leading-relaxed">
                        {stg.desc}
                      </p>
                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-white/5">
                        <span className="text-text-muted">Action:</span>
                        <span className="font-semibold text-brand-primary">
                          {stg.actionText}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Official Judging Matrix & Scoring Weights ─────── */}
      <section className="space-y-6">
        <div>
          <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
            Evaluation Matrix
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
            Official 5-Pillar Judging Criteria
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Standardized evaluation framework applied by professional judges in the preliminary proposal and final pitch phases.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {scoringPillars.map((p) => (
            <div
              key={p.name}
              className={`p-5 rounded-2xl border bg-gradient-to-b ${p.color} space-y-3 flex flex-col justify-between`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                    {p.icon}
                  </div>
                  <span className="font-mono font-black text-lg text-white">
                    {p.weight}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-white">{p.name}</h4>
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                {p.desc}
              </p>
            </div>
          ))}

          {/* Aggregate Card */}
          <div className="p-5 rounded-2xl border border-brand-primary/30 bg-brand-primary/10 space-y-3 flex flex-col justify-between sm:col-span-2 lg:col-span-1">
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-widest text-brand-primary">
                Two-Judge Overlap
              </div>
              <h4 className="text-base font-black text-white">Fair & Balanced Scoring</h4>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Every proposal is independently evaluated by at least two distinct domain experts. Automated discrepancy detection flags variance above 20 points for chief judge review.
            </p>
            <div className="text-[10px] font-semibold text-brand-primary">
              100% Transparent Evaluation
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ & Support Hub ─────────────────────────────── */}
      <section className="space-y-6">
        <div>
          <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">
            Assistance & Guidelines
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div
                key={index}
                className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left hover:bg-white/[0.03] transition-colors"
                >
                  <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-brand-primary shrink-0" />
                    {faq.q}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-brand-primary shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />
                  )}
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-5 pb-5 pt-0 text-xs text-text-secondary leading-relaxed border-t border-white/5"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Quick Resource Hub ────────────────────────────── */}
      <section className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-gradient-to-r from-brand-primary/5 via-sky-500/5 to-purple-500/5 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg font-bold text-white">Need Official Documentation & Rulebooks?</h3>
          <p className="text-xs text-text-secondary max-w-xl">
            Download the official CompSphere guidebook, check the public competition schedule, or view recent committee announcements.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
          <Link to="/guidebook">
            <NeonButton size="sm" variant="ghost" className="text-xs">
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              Guidebook
            </NeonButton>
          </Link>
          <Link to="/timeline">
            <NeonButton size="sm" variant="ghost" className="text-xs">
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              Timeline
            </NeonButton>
          </Link>
          <Link to="/announcements">
            <NeonButton size="sm" className="text-xs">
              <Layers className="w-3.5 h-3.5 mr-1.5" />
              Announcements
            </NeonButton>
          </Link>
        </div>
      </section>
    </div>
  );
}
