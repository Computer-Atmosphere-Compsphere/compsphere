import React, { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { subEvents, sponsors } from "@/components/landing/events.data";
import { scrollToTop } from "@/lib/smooth-scroll";
import { ShaderBackground } from "@/components/ui/manu";
import { GlitterFinal } from "@/components/ui/animated-hero-with-web-gl-glitter";
import { SectionHeading } from "@/components/landing/SectionHeading";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  Clock,
  MapPin,
  Mic2,
  Users,
  Zap,
} from "lucide-react";
import { RoadmapCard } from "@/components/ui/roadmap-card";
import { GlobeAnalytics } from "@/components/ui/cobe-globe-analytics";
import AdmitOneTicket from "@/components/ui/admit-one-ticket";
import { FeatureCard } from "@/components/ui/grid-feature-cards";
import { Rocket, Handshake, Trophy, Globe, Mic, Lightbulb, Network, Award, Music, PartyPopper } from "lucide-react";
import { usePublicConfig } from "@/hooks/usePublicConfig";

// ── Animation variants ──────────────────────────────────────────────────────
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.10, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" as const } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

// ── Brand accent — unified, matches landing page ───────────────────────────
const GLASS = {
  card: {
    borderColor: "rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(48px)",
    WebkitBackdropFilter: "blur(48px)",
    boxShadow:
      "0 0 0 1px rgba(255,255,255,0.04) inset, 0 32px 80px rgba(0,0,0,0.65)",
  } as React.CSSProperties,
  cardHover:
    "transition-all duration-500 hover:-translate-y-1 hover:border-white/22",
};

// ══════════════════════════════════════════════════════════════════════════════
export function SubEventDetail() {
  const { id } = useParams();
  const event = subEvents.find((e) => e.id === id);

  // Scroll to top whenever navigating to a sub-event page
  useEffect(() => {
    scrollToTop({ duration: 0 });
  }, [id]);

  if (!event) return <Navigate to="/" replace />;

  const eventSponsors = sponsors.filter((s) => event.sponsorNames.includes(s.name));

  return (
    <div className="relative overflow-x-hidden bg-bg-primary">

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden">
        <ShaderBackground className="absolute inset-0 h-full w-full" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(2,8,7,0.95) 0%, rgba(2,8,7,0.55) 35%, rgba(2,8,7,0.20) 60%, rgba(2,8,7,0.88) 100%)",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute left-1/2 top-1/3 h-[440px] w-[540px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[160px]"
          style={{ background: `rgba(0,245,200,0.08)` }}
          aria-hidden
        />

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="relative z-10 mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 sm:py-28 text-center"
        >
          <motion.div variants={item} className="mb-4 sm:mb-8 flex justify-center">
            <img
              src={event.iconSrc}
              alt={event.name}
              className="h-14 w-auto object-contain drop-shadow-[0_10px_60px_rgba(0,0,0,0.7)] sm:h-28 md:h-36"
            />
          </motion.div>

          <motion.h1
            variants={item}
            className="font-display text-3xl font-black uppercase tracking-tight sm:text-6xl md:text-8xl"
          >
            <span className="bg-white-gradient bg-clip-text text-transparent drop-shadow-[0_2px_20px_rgba(255,255,255,0.12)]">
              {event.name}
            </span>
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-text-secondary sm:mt-4 sm:text-lg sm:tracking-[0.3em]"
          >
            {event.tagline}
          </motion.p>

          <motion.div
            variants={item}
            className="mt-4 sm:mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/50"
          >
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-white/35" />
              {event.date}
            </span>
            <span className="hidden h-3 w-px bg-white/15 sm:block" aria-hidden />
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-white/35" />
              {event.venue}
            </span>
          </motion.div>


        </motion.div>

        {/* Progressive blur transition */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 h-36"
          style={{
            background: "linear-gradient(to top, #000 0%, rgba(0,0,0,0.88) 35%, rgba(0,0,0,0.45) 65%, transparent 100%)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            maskImage: "linear-gradient(to top, black 30%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to top, black 30%, transparent 100%)",
          }}
        />
      </section>

      {/* ══ CONTENT ═══════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden bg-black">

        <div className="pb-24 space-y-0 pt-10">

          {/* ── 1. ABOUT ──────────────────────────────────────────────── */}
          <AboutSection event={event} />

          {/* ── 2. SPECIAL BLOCK (per-event) ─────────────────────────── */}
          {event.id === "talksphere" && event.speakers && (
            <SpeakersBlock speakers={event.speakers} />
          )}
          {event.id === "hacksphere" && event.globalStats && (
            <GlobeBlock />
          )}
          {event.id === "hacksphere" && (
            <HacksphereJoinBlock />
          )}
          {event.id === "exposphere" && event.partnerPerks && (
            <PartnerBlock perks={event.partnerPerks} />
          )}

          {/* ── 3. TIMELINE ───────────────────────────────────────────── */}
          <TimelineBlock activities={event.activities} />

          {/* ── 4. BENEFITS ───────────────────────────────────────────── */}
          <BenefitsBlock benefits={event.benefits} eventName={event.name} />

          {/* ── 5. SPONSORS ───────────────────────────────────────────── */}
          {eventSponsors.length > 0 && (
            <SponsorsBlock sponsors={eventSponsors} />
          )}

          {/* ── 6. CTA HOOK ───────────────────────────────────────────── */}
          <CtaBlock eventId={event.id} eventName={event.name} tagline={event.tagline} />

        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. ABOUT
// ══════════════════════════════════════════════════════════════════════════════
function AboutSection({ event }: { event: typeof subEvents[number] }) {
  const e = event;
  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
      className="relative overflow-hidden py-24"
    >
      <GlitterFinal speed={0.65} intensity={4} uvScale={1.8} />
      <div className="relative z-10 mx-auto max-w-5xl px-6">
        <SectionHeading title={`ABOUT ${e.name.toUpperCase()}`} />

        <div className="mt-10 grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          {/* Left — Large Floating Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative flex items-center justify-center py-8"
          >
            {/* Ambient glow */}
            <div
              className="absolute h-[320px] w-[320px] rounded-full blur-[120px] animate-pulse"
              style={{ background: "rgba(0,245,200,0.08)" }}
            />

            {/* Large floating icon */}
            <style>{`
              @keyframes about-float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-14px); }
              }
            `}</style>
            <img
              src={e.iconSrc}
              alt={e.name}
              className="relative z-10 h-56 w-auto object-contain drop-shadow-[0_24px_80px_rgba(0,0,0,0.6)] sm:h-72 md:h-80"
              style={{ animation: "about-float 5s ease-in-out infinite" }}
            />
          </motion.div>

          {/* Right — Description */}
          <div className="space-y-5">
            <motion.p
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="text-base sm:text-lg md:text-xl leading-[2] text-white/65 font-medium text-justify"
            >
              {e.description}
            </motion.p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SPECIAL: Talksphere — Speaker Cards
// ══════════════════════════════════════════════════════════════════════════════
const smooth = [0.22, 1, 0.36, 1] as const;

function SpeakersBlock({ speakers }: { speakers: NonNullable<typeof subEvents[number]["speakers"]> }) {
  const [unlocked, setUnlocked] = useState(false);

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
      className="relative overflow-hidden py-24"
    >
      <GlitterFinal speed={0.55} intensity={5} uvScale={2.2} />
      <div className="relative z-10 mx-auto max-w-5xl px-6">
        <SectionHeading
          title="OUR SPEAKERS"
          subtitle="Industry leaders who will bring technology, Web3, and digital career insights to the Talksphere stage."
        />

        {/* Interactive reveal card — matches landing page concept */}
        <div className="mx-auto mt-14 max-w-2xl [perspective:1400px]">
          <motion.button
            type="button"
            onClick={() => setUnlocked((u) => !u)}
            whileTap={{ scale: 0.99 }}
            className="group relative block w-full cursor-pointer overflow-hidden rounded-[2rem] border border-white/25 bg-gradient-to-b from-white/[0.09] to-white/[0.03] p-3 text-left shadow-[0_30px_90px_rgba(0,0,0,0.55),0_6px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.16),inset_0_-1px_0_rgba(255,255,255,0.06)] backdrop-blur-3xl backdrop-saturate-[1.5] ring-1 ring-white/10 outline-none transition-all duration-500 hover:border-white/40 hover:bg-white/[0.07] [transform:perspective(1400px)_rotateX(1.5deg)]"
            aria-pressed={unlocked}
            aria-label={unlocked ? "Relock the speaker reveal" : "Unveil the speakers"}
          >
            {/* Glass sheen & reflections */}
            <div aria-hidden className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[2rem]">
              <div className="absolute -top-24 left-1/2 h-48 w-[85%] -translate-x-1/2 rounded-full bg-white/[0.1] blur-3xl" />
              <div className="absolute -bottom-28 -right-14 h-56 w-56 rounded-full bg-white/[0.05] blur-3xl" />
              <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            </div>

            <div className="relative aspect-[10/7] overflow-hidden rounded-[1.55rem]">
              <AnimatePresence initial={false}>
                {!unlocked ? (
                  <motion.div
                    key="locked"
                    exit={{ scale: 1.07, opacity: 0, filter: "blur(10px)" }}
                    transition={{ duration: 0.65, ease: smooth }}
                    className="absolute inset-0"
                  >
                    {/* Silhouette */}
                    <img
                      src="/unlocked-speaker.png"
                      alt=""
                      aria-hidden
                      className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.03]"
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-bg-primary/45 via-transparent to-transparent"
                      aria-hidden
                    />

                    {/* Hint */}
                    <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2.5 pb-6">
                      <span className="mono-chip inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.07] px-3.5 py-1 text-[9px] uppercase tracking-[0.3em] text-white/70 backdrop-blur-2xl transition-colors duration-500 group-hover:text-white">
                        Who will be our innovative speaker?
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="unlocked"
                    initial={{ opacity: 0, scale: 1.045 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.9, ease: smooth }}
                    className="absolute inset-0"
                  >
                    {/* Revealed stage shot */}
                    <img
                      src="/speaker-image.png"
                      alt="Compsphere speakers unveiled"
                      className="h-full w-full object-cover"
                    />
                    {/* Readability scrim */}
                    <div
                      className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-bg-primary/85 via-bg-primary/40 to-transparent"
                      aria-hidden
                    />

                    {/* Unveil wipe */}
                    <motion.span
                      initial={{ y: "-101%" }}
                      animate={{ y: "101%" }}
                      transition={{ duration: 1.05, ease: smooth, delay: 0.05 }}
                      className="absolute inset-x-0 inset-y-0 bg-gradient-to-b from-transparent via-bg-primary/20 to-transparent backdrop-blur-[3px]"
                      aria-hidden
                    />
                    {/* Light sweep */}
                    <motion.span
                      initial={{ x: "-140%", opacity: 0.5 }}
                      animate={{ x: "240%", opacity: 0 }}
                      transition={{ duration: 1.2, delay: 0.5, ease: smooth }}
                      className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                      aria-hidden
                    />

                    {/* Name plaques */}
                    <div className="absolute inset-x-0 bottom-0 grid items-end gap-1.5 px-2 pb-2 sm:gap-3 sm:px-4 sm:pb-4 md:gap-4 md:px-5 md:pb-5"
                      style={{ gridTemplateColumns: `repeat(${Math.min(speakers.length, 3)}, 1fr)` }}
                    >
                      {speakers.map((s, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 22, filter: "blur(6px)" }}
                          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                          transition={{
                            duration: 0.8,
                            delay: 0.75 + idx * 0.16,
                            ease: smooth,
                          }}
                          className={`rounded-xl sm:rounded-2xl border border-white/20 bg-black/35 px-1.5 py-1.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:px-3 sm:py-2.5 md:px-4 md:py-3 ${idx === 1 ? "border-white/35 bg-white/[0.12]" : ""}`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            {idx === 1 ? (
                              <BadgeCheck className="hidden h-3 w-3 shrink-0 text-brand-primary md:block" />
                            ) : (
                              <Mic2 className="hidden h-3 w-3 shrink-0 text-text-muted md:block" />
                            )}
                            <h3
                              className={`font-display font-extrabold leading-tight tracking-tight ${idx === 1
                                ? "text-[10px] text-text-primary sm:text-sm md:text-lg"
                                : "text-[9px] text-text-secondary sm:text-xs md:text-sm"
                              }`}
                            >
                              {s.name}
                            </h3>
                          </div>
                          <p
                            className={`mt-0.5 text-[7px] font-semibold uppercase tracking-wider sm:text-[9px] md:text-[10px] ${idx === 1 ? "text-brand-accent" : "text-text-muted"}`}
                          >
                            {s.role}
                          </p>
                          <p className="mt-0.5 hidden text-[8px] text-text-muted/80 sm:block sm:text-[9px] md:text-[10px]">
                            {s.org}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SPECIAL: Hacksphere — CSS 3D Globe
// ══════════════════════════════════════════════════════════════════════════════
function GlobeBlock() {
  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
      className="relative overflow-hidden py-24"
    >
      <GlitterFinal speed={0.7} intensity={6} uvScale={2.5} />
      <div className="relative z-10 mx-auto max-w-5xl px-6">
        <SectionHeading
          title="INTERNATIONAL REACH"
          subtitle="Participants from 20+ countries gear up to compete in the biggest 24-hour build marathon."
        />

        <div className="mt-10 flex justify-center">
          <GlobeAnalytics className="w-full max-w-[420px]" speed={0.004} />
        </div>
      </div>
    </motion.section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SPECIAL: Hacksphere — How to Join Section
// ══════════════════════════════════════════════════════════════════════════════

/** Devpost SVG logo */
function DevpostIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 0C22.4 0 0 22.4 0 50s22.4 50 50 50 50-22.4 50-50S77.6 0 50 0zm-8.3 67.5H28.3V32.5h13.4c9.8 0 17.8 7.9 17.8 17.5s-8 17.5-17.8 17.5zm0-27.1h-5.6v19.1h5.6c5.3 0 9.6-4.3 9.6-9.6s-4.3-9.5-9.6-9.5zm29.1 27.1H58.4V32.5h12.4c9.8 0 17.8 7.9 17.8 17.5s-8 17.5-17.8 17.5zm0-27.1h-4.4v19.1h4.4c5.3 0 9.6-4.3 9.6-9.6s-4.3-9.5-9.6-9.5z" />
    </svg>
  );
}

/** Discord SVG logo */
function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z" />
    </svg>
  );
}

/** Google Drive SVG logo */
function GoogleDriveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 87.3 78" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
    </svg>
  );
}

function HacksphereJoinBlock() {
  const { data: publicConfig, isLoading } = usePublicConfig();

  const devpostUrl = publicConfig?.hacksphere_devpost_url || "";
  const discordUrl = publicConfig?.hacksphere_discord_url || "";
  const guidebookUrl = publicConfig?.hacksphere_guidebook_url || "";

  const buttons = [
    {
      key: "devpost",
      label: "Register on Devpost",
      sublabel: "Join the hackathon",
      url: devpostUrl,
      icon: <DevpostIcon className="h-6 w-6" />,
      color: "from-[#003E54] to-[#0d3349]",
      border: "border-[#00a4d3]/30",
      glow: "rgba(0,164,211,0.15)",
      accentColor: "#00a4d3",
    },
    {
      key: "discord",
      label: "Join Discord",
      sublabel: "Community & updates",
      url: discordUrl,
      icon: <DiscordIcon className="h-6 w-6" />,
      color: "from-[#1e1f4b] to-[#2b2d6e]",
      border: "border-[#5865F2]/30",
      glow: "rgba(88,101,242,0.15)",
      accentColor: "#5865F2",
    },
    {
      key: "guidebook",
      label: "Guidebook & Proposal",
      sublabel: "Download from Drive",
      url: guidebookUrl,
      icon: <GoogleDriveIcon className="h-6 w-6" />,
      color: "from-[#1a2640] to-[#0f1e35]",
      border: "border-white/10",
      glow: "rgba(255,186,0,0.10)",
      accentColor: "#FFBA00",
    },
  ];

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
      className="relative overflow-hidden py-24"
    >
      <GlitterFinal speed={0.6} intensity={5} uvScale={2.0} />
      <div className="relative z-10 mx-auto max-w-5xl px-6">
        <SectionHeading
          title="HOW TO JOIN HACKSPHERE"
          subtitle="Register your team, download the guidebook, and join our Discord community for the latest updates on Hacksphere 2026."
        />

        {/* Steps summary */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="mt-10 rounded-[24px] border border-white/10 bg-white/[0.03] p-6 sm:p-8 backdrop-blur-xl"
        >
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <ol className="space-y-4">
            {[
              { step: "01", title: "Create an Individual Account", desc: "Sign up at compsphere.id by filling out the identity form and verifying your email." },
              { step: "02", title: "Form a Team & Register for Hacksphere", desc: "The team leader registers the team (max. 3 members) and invites members via username/email. Free entry for Phase 1." },
              { step: "03", title: "Download the Guidebook & Prepare Your Proposal", desc: "Download the official Guidebook and Idea Proposal Template (.docx) from Google Drive, then craft your proposal based on the given theme." },
              { step: "04", title: "Upload Proposal before Sep 18, 23:59 WIB", desc: "Submit your Idea Proposal (PDF) on your team dashboard before the submission portal closes automatically." },
              { step: "05", title: "Wait for Top 30 Announcement (Sep 26)", desc: "Selected teams will advance to the Offline Round at President University, Cikarang on Oct 10–11, 2026." },
            ].map((s, i) => (
              <li key={s.step} className="flex items-start gap-4">
                <span
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-brand-primary/30 bg-brand-primary/10 font-mono text-[10px] font-bold text-brand-primary"
                >
                  {s.step}
                </span>
                <div>
                  <p className="text-sm font-bold text-white">{s.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/50">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </motion.div>

        {/* Action buttons */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {buttons.map((btn, i) => {
            const isAvailable = !isLoading && btn.url.length > 0;
            const ButtonWrapper = isAvailable ? "a" : "div";
            const wrapperProps = isAvailable
              ? { href: btn.url, target: "_blank", rel: "noopener noreferrer" }
              : {};

            return (
              <motion.div
                key={btn.key}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
              >
                <ButtonWrapper
                  {...(wrapperProps as any)}
                  className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl px-4 py-3 transition-all duration-300 ${
                    isAvailable
                      ? "cursor-pointer hover:bg-white/[0.08] hover:border-white/20"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  {/* Icon */}
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]"
                    style={{ color: btn.accentColor }}
                  >
                    {btn.icon}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{btn.label}</p>
                    <p className="text-[11px] text-white/40">{btn.sublabel}</p>
                  </div>

                  {/* Arrow / Badge */}
                  {isAvailable && (
                    <span className="text-xs text-white/30 group-hover:text-white/60 transition-colors shrink-0">
                      →
                    </span>
                  )}
                  {!isAvailable && !isLoading && (
                    <span className="text-[9px] uppercase tracking-widest text-white/30 shrink-0">
                      Soon
                    </span>
                  )}
                </ButtonWrapper>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SPECIAL: Exposphere — Aeon Deltamas Partner Perks
// ══════════════════════════════════════════════════════════════════════════════
function PartnerBlock({ perks }: { perks: NonNullable<typeof subEvents[number]["partnerPerks"]> }) {
  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
      className="relative overflow-hidden py-24"
    >
      <GlitterFinal speed={0.6} intensity={3.5} uvScale={1.5} />
      <div className="relative z-10 mx-auto max-w-5xl px-6">
        <SectionHeading
          title="AEON DELTAMAS PARTNERSHIP"
          subtitle="A strategic collaboration with Aeon Deltamas gives Exposphere unmatched location advantages, exposure, and business networking."
        />

        {/* AEON Deltamas Cikarang feature card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="mt-10 relative overflow-hidden rounded-[28px] border border-white/10 mb-5 bg-white/[0.03] backdrop-blur-xl"
        >
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/[0.03] blur-[100px]" />
          <div className="relative p-10 sm:p-12">
            <div className="flex flex-col sm:flex-row items-center gap-10">
              {/* AEON MALL logo — white background, bigger size */}
              <div
                className="shrink-0 flex h-36 w-48 items-center justify-center rounded-3xl bg-white p-6 shadow-[0_8px_60px_rgba(255,255,255,0.1)]"
              >
                <img
                  src="/aeon-logo.png"
                  alt="AEON MALL Logo"
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = document.createElement('span');
                    fallback.textContent = 'AEON';
                    fallback.className = 'text-4xl font-black tracking-tight';
                    fallback.style.color = '#00A0E3';
                    target.parentElement?.appendChild(fallback);
                  }}
                />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="font-display text-2xl font-black text-white uppercase tracking-tight sm:text-3xl">
                  AEON Deltamas Cikarang
                </h3>
                <p className="mt-3 text-sm sm:text-base leading-relaxed text-white/50 max-w-lg">
                  One of the largest AEON Malls in Southeast Asia, situated in the strategic Bekasi-Cikarang corridor. With millions of visitors monthly, it brings unmatched foot traffic and premium infrastructure to host Exposphere's innovation hub.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Perks grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {perks.map((perk, idx) => (
            <motion.div
              key={perk.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: idx * 0.08 }}
              className={`group relative overflow-hidden rounded-[22px] border p-6 ${GLASS.cardHover}`}
              style={GLASS.card}
            >
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              {perk.stat && (
                <span
                  className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[10px] uppercase tracking-wider font-bold text-white/60"
                >
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/40" />
                  {perk.stat}
                </span>
              )}
              <h4 className="font-display text-base font-black text-white uppercase tracking-wide">{perk.title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{perk.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. TIMELINE
// ══════════════════════════════════════════════════════════════════════════════
function TimelineBlock({ activities }: { activities: typeof subEvents[number]["activities"] }) {
  const roadmapItems = activities.map((a, idx) => ({
    quarter: a.time,
    title: a.title,
    description: a.desc,
    status: "done" as const,
  }));

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.05 }}
      className="relative overflow-hidden py-24"
    >
      <GlitterFinal speed={0.8} intensity={3.5} uvScale={1.6} />
      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <SectionHeading title="EVENT RUNDOWN" />

        <div className="mt-10">
          <RoadmapCard items={roadmapItems} />
        </div>
      </div>
    </motion.section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. BENEFITS
// ══════════════════════════════════════════════════════════════════════════════
/** Map emoji icons from benefits data to Lucide React icons */
const EMOJI_TO_LUCIDE: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  "\u{1F680}": Rocket,
  "\u{1F91D}": Handshake,
  "\u{1F3C6}": Trophy,
  "\u{1F310}": Globe,
  "\u{1F3A4}": Mic,
  "\u{1F4A1}": Lightbulb,
  "\u{1F3C5}": Award,
  "\u{1F3B5}": Music,
  "\u{1F389}": PartyPopper,
};

function BenefitsBlock({ benefits, eventName }: { benefits: typeof subEvents[number]["benefits"]; eventName: string }) {
  const features = benefits.map((b) => ({
    title: b.title,
    icon: EMOJI_TO_LUCIDE[b.icon] ?? Zap,
    description: b.desc,
  }));

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
      className="relative overflow-hidden py-24"
    >
      <GlitterFinal speed={0.7} intensity={4.5} uvScale={2} />
      <div className="relative z-10 mx-auto max-w-5xl px-6">
        <SectionHeading
          title="WHY SHOULD YOU JOIN?"
          subtitle={`The strongest reasons to attend and participate in ${eventName}.`}
        />

        {/* Individual glass cards grid */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, filter: "blur(4px)", y: -8 }}
              whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.6 }}
              className="group relative overflow-hidden rounded-[20px] border border-white/[0.08] p-6 transition-all duration-500 hover:border-white/[0.15] hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset, 0 16px 48px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              {/* Top sheen */}
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
              {/* Grid pattern */}
              <div className="pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 h-full w-full [mask-image:linear-gradient(white,transparent)]">
                <div className="absolute inset-0 bg-gradient-to-r from-white/[0.03] to-white/[0.01] [mask-image:radial-gradient(farthest-side_at_top,white,transparent)]">
                  <svg aria-hidden className="absolute inset-0 h-full w-full mix-blend-overlay fill-white/[0.03] stroke-white/[0.06]">
                    <defs>
                      <pattern id={`benefit-grid-${i}`} width={20} height={20} patternUnits="userSpaceOnUse" x="-12" y="4">
                        <path d="M.5 20V.5H20" fill="none" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" strokeWidth={0} fill={`url(#benefit-grid-${i})`} />
                  </svg>
                </div>
              </div>

              {/* Content */}
              <feature.icon className="relative z-10 text-white/60 size-6" strokeWidth={1} aria-hidden />
              <h3 className="relative z-10 mt-8 text-sm font-bold text-white md:text-base">{feature.title}</h3>
              <p className="relative z-10 mt-2 text-xs leading-relaxed text-white/40 font-light">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 5. SPONSORS
// ══════════════════════════════════════════════════════════════════════════════
function SponsorsBlock({ sponsors: eventSponsors }: { sponsors: typeof sponsors }) {
  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
      className="relative overflow-hidden py-24"
    >
      <GlitterFinal speed={0.5} intensity={4.5} uvScale={2.3} />
      <div className="relative z-10 mx-auto max-w-5xl px-6">
        <SectionHeading title="SUPPORTED BY" />

        <div className="mt-10 flex flex-wrap items-stretch justify-center gap-5">
          {eventSponsors.map((s, idx) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.06 }}
              className={`group relative flex w-[140px] items-center justify-center overflow-hidden rounded-[24px] border px-4 py-6 sm:w-[180px] sm:px-6 sm:py-8 md:w-[200px] md:px-8 md:py-10 ${GLASS.cardHover}`}
              style={{ ...GLASS.card }}
            >
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
              {s.image ? (
                <img
                  src={s.image}
                  alt={s.name}
                  className="h-14 w-auto max-w-[180px] object-contain opacity-45 grayscale transition-all duration-400 group-hover:opacity-90 group-hover:grayscale-0 sm:h-16 md:h-20"
                />
              ) : (
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-xl font-black text-white/50 ${s.style ?? ""}`}
                >
                  {s.monogram}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 6. CTA HOOK
// ══════════════════════════════════════════════════════════════════════════════
/**
 * Per-event ticket styles — each sub-event gets its own color palette.
 */
const TICKET_STYLES: Record<string, { texture: any; gradient: any }> = {
  exposphere: {
    texture: {
      engine: "generative" as const,
      colorBack: "#1a0a2e",
      colorFront: "#7c3aed",
      colorHighlight: "#a78bfa",
      shape: "warp" as const,
      type: "4x4" as const,
      size: 0.5,
      colorSteps: 4,
      originalColors: true,
      scale: 1,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
      speed: 0.3,
    },
    gradient: {
      centreX: 0.62,
      centreY: 0.3,
      radius: 0.58,
      midStop: 0.45,
      colorLight: "#c4b5fd",
      colorMid: "#8b5cf6",
      colorDark: "#4c1d95",
    },
  },
  talksphere: {
    texture: {
      engine: "generative" as const,
      colorBack: "#0c1445",
      colorFront: "#3b82f6",
      colorHighlight: "#93c5fd",
      shape: "swirl" as const,
      type: "8x8" as const,
      size: 0.4,
      colorSteps: 5,
      originalColors: true,
      scale: 1,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
      speed: 0.25,
    },
    gradient: {
      centreX: 0.55,
      centreY: 0.35,
      radius: 0.55,
      midStop: 0.42,
      colorLight: "#bfdbfe",
      colorMid: "#60a5fa",
      colorDark: "#1e3a8a",
    },
  },
  hacksphere: {
    texture: {
      engine: "generative" as const,
      colorBack: "#022c22",
      colorFront: "#10b981",
      colorHighlight: "#6ee7b7",
      shape: "ripple" as const,
      type: "2x2" as const,
      size: 0.6,
      colorSteps: 4,
      originalColors: true,
      scale: 1,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
      speed: 0.35,
    },
    gradient: {
      centreX: 0.58,
      centreY: 0.28,
      radius: 0.6,
      midStop: 0.48,
      colorLight: "#a7f3d0",
      colorMid: "#34d399",
      colorDark: "#064e3b",
    },
  },
  festsphere: {
    texture: {
      engine: "generative" as const,
      colorBack: "#450a0a",
      colorFront: "#f43f5e",
      colorHighlight: "#fda4af",
      shape: "dots" as const,
      type: "random" as const,
      size: 0.7,
      colorSteps: 3,
      originalColors: true,
      scale: 1,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
      speed: 0.4,
    },
    gradient: {
      centreX: 0.5,
      centreY: 0.32,
      radius: 0.55,
      midStop: 0.4,
      colorLight: "#fecdd3",
      colorMid: "#fb7185",
      colorDark: "#881337",
    },
  },
};

function CtaBlock({ eventId, eventName, tagline }: { eventId: string; eventName: string; tagline: string }) {
  const style = TICKET_STYLES[eventId] ?? TICKET_STYLES.hacksphere;

  // Bright, modern text colors for dark ticket backgrounds
  const brightLayout = {
    padding: 57 / 741,
    labelTop: 58 / 741,
    labelSize: 19.72 / 741,
    labelLead: 28 / 741,
    labelTracking: 0.016,
    nameTop: 185 / 741,
    nameSize: 64.79 / 741,
    nameLead: 65 / 741,
    nameTracking: -0.01,
    footerTop: 348 / 741,
    footerSize: 19.72 / 741,
    footerTracking: 0.016,
    stubSize: 67.61 / 741,
    stubTracking: 0,
    stubOpacity: 0.88,
    watermarkSize: 144 / 741,
    watermarkOpacity: 0.4,
    watermarkColor: "rgba(255,255,255,0.25)",
    inkColor: "rgba(255,255,255,0.92)",
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.65 }}
      className="relative overflow-hidden py-24"
    >
      <GlitterFinal speed={0.6} intensity={4.5} uvScale={2.0} />
      <div className="relative z-10 mx-auto max-w-5xl px-6 flex flex-col items-center">
        {/* Ticket — scales down on mobile via wrapper */}
        <div className="w-full max-w-[580px] overflow-hidden">
          <div className="origin-top scale-[0.65] sm:scale-75 md:scale-90 lg:scale-100">
            <AdmitOneTicket
              name={eventName}
              presenter="Compsphere 2026 presents"
              event={eventName}
              venue="President University, Cikarang"
              dates="Oct 2026"
              stubText="Admit one"
              watermark="2026"
              width={580}
              texture={style.texture}
              gradient={style.gradient}
              layout={brightLayout}
              tilt={undefined}
            />
          </div>
        </div>

        {/* CTA text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-white/50 max-w-md">
            {tagline}. Be part of the best journey with Compsphere 2026.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/#home"
              className="group inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-6 py-3 text-sm font-bold text-white/80 backdrop-blur-md transition-all duration-300 hover:border-white/40 hover:bg-white/[0.10]"
            >
              Register Now
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              to="/#events"
              className="inline-flex items-center gap-1.5 text-xs text-white/35 transition-colors hover:text-white/60"
            >
              <ArrowLeft className="h-3 w-3" />
              Other Sub-Events
            </Link>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

// ── Shared helpers ──────────────────────────────────────────────────────────
function InfoRow({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 rounded-[16px] border p-4"
      style={{
        borderColor: accent ? "rgba(0,245,200,0.16)" : "rgba(255,255,255,0.08)",
        background: accent ? "rgba(0,245,200,0.03)" : "rgba(255,255,255,0.025)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={accent ? "text-brand-primary/80" : "text-white/35"}>{icon}</span>
        <span className="mono-chip text-[9px] uppercase tracking-wider text-white/35 truncate">{label}</span>
      </div>
      <span className={`text-xs font-bold truncate max-w-[180px] ${accent ? "text-brand-primary" : "text-white/75"}`}>
        {value}
      </span>
    </div>
  );
}
