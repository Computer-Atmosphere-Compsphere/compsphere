import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button";
import { ShaderBackground } from "@/components/ui/manu";
import { CountdownTimer } from "./CountdownTimer";
import { ArrowRight } from "lucide-react";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
};

// Target dates
const COMPSPHERE_DATE = "2026-10-05T08:00:00+07:00"; // Oct 5, 8am WIB
const TALKSPHERE_DATE = "2026-10-07T08:00:00+07:00"; // Oct 7, 8am WIB
const HACKSPHERE_DATE = "2026-10-10T08:00:00+07:00"; // Oct 10, 8am WIB
const HACKATHON_24H_END = "2026-10-11T09:00:00+07:00"; // Oct 11, 9am WIB

export function HeroSection() {
  const { isAuthenticated, user, signInWithGoogle } = useAuth();

  // Fetch public countdown config
  const { data: countdownConfig } = useQuery<Record<string, string>>({
    queryKey: ["public-countdown"],
    queryFn: () => api.get("/api/config/public"),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const showCompsphere = countdownConfig?.countdown_compsphere_enabled === "true";
  const showTalkSphere = countdownConfig?.countdown_talksphere_enabled === "true";
  const showHacksphere = countdownConfig?.countdown_enabled === "true";
  const show24hTimer = countdownConfig?.countdown_24h_enabled === "true";
  const showLogin = countdownConfig?.show_login_buttons !== "false";

  const consolePath =
    isAuthenticated && user
      ? user.role === "ADMIN"
        ? "/admin"
        : user.role === "JUDGE"
          ? "/judge"
          : "/dashboard"
      : null;

  return (
    <section
      id="home"
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden scroll-mt-16"
    >
      {/* Shader background */}
      <ShaderBackground className="absolute inset-0 h-full w-full" />

      {/* Readability scrims */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.97),rgba(0,0,0,0.55)_40%,rgba(0,0,0,0.15)_62%,rgba(0,0,0,0.8)_100%)]"
        aria-hidden
      />
      <div
        className="absolute left-1/2 top-1/2 h-[420px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/40 blur-[130px]"
        aria-hidden
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto max-w-4xl px-6 py-24 text-center"
      >
        {/* Logo */}
        <motion.div variants={item} className="mb-6 flex justify-center">
          <img
            src="/compsphere-logo.png"
            alt="Compsphere"
            className="h-24 w-auto drop-shadow-[0_6px_30px_rgba(0,0,0,0.55)] sm:h-28"
          />
        </motion.div>

        <motion.h1
          variants={item}
          className="font-display text-6xl font-black uppercase tracking-tight sm:text-7xl md:text-8xl"
        >
          <span className="bg-white-gradient bg-clip-text text-transparent drop-shadow-[0_2px_20px_rgba(255,255,255,0.15)]">
            COMPSPHERE
          </span>
        </motion.h1>

        <motion.p
          variants={item}
          className="mt-5 font-display text-lg font-bold uppercase tracking-[0.35em] text-text-secondary sm:text-xl"
        >
          International <span className="text-brand-accent">Web3</span> Hackathon
        </motion.p>

        {/* Countdown Timers */}
        {showCompsphere && (
          <motion.div variants={item} className="mt-8">
            <CountdownTimer
              targetDate={COMPSPHERE_DATE}
              label="Compsphere"
              variant="compsphere"
            />
          </motion.div>
        )}

        {showTalkSphere && (
          <motion.div variants={item} className="mt-5">
            <CountdownTimer
              targetDate={TALKSPHERE_DATE}
              label="TalkSphere"
              variant="talksphere"
            />
          </motion.div>
        )}

        {showHacksphere && (
          <motion.div variants={item} className="mt-5">
            <CountdownTimer
              targetDate={HACKSPHERE_DATE}
              label="Hacksphere"
              variant="hacksphere"
            />
          </motion.div>
        )}

        {show24hTimer && (
          <motion.div variants={item} className="mt-5">
            <CountdownTimer
              targetDate={HACKATHON_24H_END}
              label="24-Hour Hackathon"
              variant="24h"
            />
          </motion.div>
        )}

        {/* CTAs */}
        <motion.div
          variants={item}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          {isAuthenticated && consolePath ? (
            <Link to={consolePath} className="w-full sm:w-auto">
              <LiquidGlassButton label="Open Console" size="lg" className="w-full" icon={<ArrowRight className="h-4 w-4" />} />
            </Link>
          ) : showLogin ? (
            <>
              <LiquidGlassButton label="Register Now" size="lg" variant="register" onClick={signInWithGoogle} />
              <LiquidGlassButton label="Log in" size="lg" onClick={signInWithGoogle} />
            </>
          ) : null}
        </motion.div>

      </motion.div>
    </section>
  );
}
