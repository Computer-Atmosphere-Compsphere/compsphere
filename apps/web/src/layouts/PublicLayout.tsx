import React, { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button";
import { SmoothScroll } from "@/components/compsphere/SmoothScroll";
import { CinematicFooter } from "@/components/ui/motion-footer";
import { GlitterFinal } from "@/components/ui/animated-hero-with-web-gl-glitter";
import { scrollToTop } from "@/lib/smooth-scroll";
import { subEvents } from "@/components/landing/events.data";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CalendarDays, ChevronDown, LogOut, Menu, X, ArrowRight } from "lucide-react";

function PublicNavbar() {
  const { isAuthenticated, user, signInWithGoogle, logout, isAuthenticating } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  // Fetch public config to check if login buttons should be hidden
  const { data: publicConfig } = useQuery<Record<string, string>>({
    queryKey: ["public-config"],
    queryFn: () => api.get("/api/config/public"),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
  const showLogin = publicConfig?.show_login_buttons !== "false";
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isSubEvent = location.pathname.startsWith("/events/");
  const isTransparentHeroPage = isHome || isSubEvent;
  const isFloating = scrolled || !isTransparentHeroPage;

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setScrolled(window.scrollY > 24);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Close menus on navigation
  useEffect(() => {
    setSubOpen(false);
    setMobileOpen(false);
  }, [location]);

  const openSub = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setSubOpen(true);
  };
  const scheduleCloseSub = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setSubOpen(false), 160);
  };

  const dashboardPath =
    user?.role === "ADMIN" ? "/admin" : user?.role === "JUDGE" ? "/judge" : "/dashboard";

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className={`px-2.5 transition-[padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-6 ${scrolled ? "pt-2.5 sm:pt-3" : "pt-2 sm:pt-3"}`}>
        <div
          className={`mx-auto flex items-center justify-between rounded-2xl sm:rounded-3xl border transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isFloating
              ? "h-12 sm:h-14 md:h-16 max-w-5xl px-3 sm:px-4 md:px-6 border-white/20 bg-[#0a0a0a]/80 shadow-[0_8px_40px_rgba(0,0,0,0.55),0_0_40px_rgba(0,245,200,0.06),inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-2xl backdrop-saturate-[1.8]"
              : "h-14 sm:h-16 max-w-5xl px-3 sm:px-5 border-transparent bg-transparent shadow-none"
          }`}
        >
        {/* Logo */}
        <Link to="/" className="group flex items-center">
          <img
            src="/compsphere-logo.png"
            alt="Compsphere"
            className={`w-auto transition-all duration-500 group-hover:scale-105 ${
              isFloating ? "h-7 sm:h-8 md:h-9" : "h-8 sm:h-9 md:h-10"
            }`}
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 md:flex">
          <Link
            to="/"
            onClick={(e) => {
              if (location.pathname === "/") {
                e.preventDefault();
                scrollToTop();
              }
            }}
            className="text-sm font-semibold text-text-secondary transition-colors hover:text-brand-primary"
          >
            Home
          </Link>
          <Link
            to="/#sponsors"
            className="text-sm font-semibold text-text-secondary transition-colors hover:text-brand-primary"
          >
            Sponsors
          </Link>
          <Link
            to="/#speakers"
            className="text-sm font-semibold text-text-secondary transition-colors hover:text-brand-primary"
          >
            Speakers
          </Link>

          {/* Sub-events dropdown */}
          <div
            className="relative"
            onMouseEnter={openSub}
            onMouseLeave={scheduleCloseSub}
          >
            <button
              onClick={() => setSubOpen((o) => !o)}
              className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${
                subOpen ? "text-brand-primary" : "text-text-secondary hover:text-brand-primary"
              }`}
            >
              Sub-Events
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${subOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {subOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute right-0 top-full z-50 mt-3 w-[276px] overflow-hidden rounded-2xl border border-white/20 bg-[#0D0D0D]/95 p-2.5 shadow-[0_16px_60px_rgba(0,0,0,0.85),0_0_30px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl"
                >
                  <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                  <div aria-hidden className="pointer-events-none absolute -top-16 left-1/2 h-32 w-3/4 -translate-x-1/2 rounded-full bg-white/[0.06] blur-3xl" />
                  <div className="relative grid gap-1">
                    {subEvents.map((e) => {
                      return (
                        <Link
                          key={e.id}
                          to={`/events/${e.id}`}
                          className="group flex items-center gap-3.5 rounded-xl p-2 transition-colors hover:bg-white/[0.08]"
                        >
                          <img
                            src={e.iconSrc}
                            alt={e.name}
                            className="h-14 w-14 shrink-0 object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-110"
                          />
                          <span className="min-w-0 space-y-0.5">
                            <span className="block text-sm font-bold text-white">
                              {e.name}
                            </span>
                            <span className="flex items-center gap-1.5 text-[10px] text-white/60">
                              <CalendarDays className="h-3 w-3" />
                              {e.date}
                            </span>
                          </span>
                          <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 text-white/50 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" />
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link
            to="/#timeline"
            className="text-sm font-semibold text-text-secondary transition-colors hover:text-brand-primary"
          >
            Timeline
          </Link>
          <Link
            to="/#partners"
            className="text-sm font-semibold text-text-secondary transition-colors hover:text-brand-primary"
          >
            Partners
          </Link>
        </nav>

        {/* Right actions */}
        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticating ? (
            <span className="mono-chip text-[10px] uppercase tracking-widest text-text-muted">
              sync…
            </span>
          ) : isAuthenticated && user ? (
            <>
              <Link to={dashboardPath}>
                <LiquidGlassButton label="Dashboard" />
              </Link>
              <LiquidGlassButton
                label="Sign Out"
                variant="destructive"
                onClick={() => setSignOutOpen(true)}
                icon={<LogOut className="h-3.5 w-3.5" />}
              />
            </>
          ) : showLogin ? (
            <>
              <LiquidGlassButton label="Log in" onClick={signInWithGoogle} />
              <LiquidGlassButton label="Register" variant="register" onClick={signInWithGoogle} />
            </>
          ) : null}
        </div>

        {/* Mobile hamburger — animated icon swap */}
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-text-secondary transition-all duration-300 hover:border-white/25 hover:bg-white/[0.10] hover:text-white active:scale-95 md:hidden"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span className="relative flex h-5 w-5 items-center justify-center">
            <span
              className={`absolute block h-[1.5px] w-4 bg-current transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                mobileOpen ? "rotate-45 translate-y-0 opacity-100" : "-translate-y-[3px] opacity-100"
              }`}
            />
            <span
              className={`absolute block h-[1.5px] w-4 bg-current transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                mobileOpen ? "-rotate-45 translate-y-0 opacity-100" : "translate-y-[3px] opacity-100"
              }`}
            />
          </span>
        </button>
      </div>

      {/* Mobile panel */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden md:hidden"
          >
            <div
              className={`mx-2.5 sm:mx-6 mt-1 rounded-2xl border border-white/[0.12] shadow-[0_16px_60px_rgba(0,0,0,0.6),0_0_40px_rgba(0,245,200,0.04)] backdrop-blur-2xl backdrop-saturate-[1.8] ${
                isFloating
                  ? "bg-[#0a0a0a]/90"
                  : "bg-[#0a0a0a]/95"
              }`}
            >
              {/* Glass sheen */}
              <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              <div className="px-4 py-4">
                {/* Nav links — staggered entrance */}
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04, delayChildren: 0.06 } } }}
                  className="flex flex-col gap-0.5"
                >
                  {[
                    { label: "Home", to: "/", onClick: () => { if (location.pathname === "/") scrollToTop(); } },
                    { label: "Sponsors", to: "/#sponsors" },
                    { label: "Speakers", to: "/#speakers" },
                    { label: "Timeline", to: "/#timeline" },
                    { label: "Partners", to: "/#partners" },
                  ].map((link) => (
                    <motion.div
                      key={link.label}
                      variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0, transition: { duration: 0.3 } } }}
                    >
                      <Link
                        to={link.to}
                        onClick={link.onClick}
                        className="flex items-center rounded-xl px-3 py-2.5 text-sm font-semibold text-white/70 transition-all duration-200 hover:bg-white/[0.06] hover:text-white active:bg-white/[0.10]"
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Sub-Events section */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                  className="mt-3 border-t border-white/[0.08] pt-3"
                >
                  <p className="mono-chip mb-2 px-3 text-[9px] uppercase tracking-[0.3em] text-white/30">
                    Sub-Events
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {subEvents.map((e, idx) => (
                      <motion.div
                        key={e.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + idx * 0.04, duration: 0.3 }}
                      >
                        <Link
                          to={`/events/${e.id}`}
                          className="flex items-center gap-3 rounded-xl px-3 py-2 transition-all duration-200 hover:bg-white/[0.06] active:bg-white/[0.10]"
                        >
                          <img
                            src={e.iconSrc}
                            alt={e.name}
                            className="h-8 w-8 shrink-0 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                          />
                          <div className="min-w-0">
                            <span className="block text-xs font-bold text-white/80">{e.name}</span>
                            <span className="block text-[10px] text-white/35">{e.date}</span>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Auth actions */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                  className="mt-3 border-t border-white/[0.08] pt-3"
                >
                  {isAuthenticating ? (
                    <span className="mono-chip px-3 text-[10px] uppercase tracking-widest text-white/30">sync…</span>
                  ) : isAuthenticated && user ? (
                    <div className="flex flex-col gap-2">
                      <Link to={dashboardPath} className="w-full">
                        <LiquidGlassButton label="Dashboard" className="w-full justify-center" />
                      </Link>
                      <LiquidGlassButton
                        label="Sign Out"
                        variant="destructive"
                        onClick={() => setSignOutOpen(true)}
                        icon={<LogOut className="h-3.5 w-3.5" />}
                        className="w-full justify-center"
                      />
                    </div>
                  ) : showLogin ? (
                    <div className="flex flex-col gap-2">
                      <LiquidGlassButton label="Log in" onClick={signInWithGoogle} className="w-full justify-center" />
                      <LiquidGlassButton label="Register" variant="register" onClick={signInWithGoogle} className="w-full justify-center" />
                    </div>
                  ) : null}
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* Sign-out confirmation dialog */}
      <AlertDialog.Root open={signOutOpen} onOpenChange={setSignOutOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[101] w-[min(90vw,400px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/15 bg-[#0D0D0D]/95 p-6 shadow-[0_16px_60px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl">
            <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <AlertDialog.Title className="text-lg font-bold text-white">Sign out of Compsphere?</AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-white/60">
              You will need to sign in again to access your dashboard and team data.
            </AlertDialog.Description>
            <div className="mt-6 flex justify-end gap-3">
              <AlertDialog.Cancel asChild>
                <button className="rounded-full border border-white/15 bg-white/[0.07] px-5 py-2 text-xs font-semibold text-white/80 backdrop-blur-xl transition-all hover:border-white/30 hover:bg-white/[0.11] hover:text-white active:scale-95">
                  Cancel
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  onClick={logout}
                  className="rounded-full border border-red-400/30 bg-red-500/15 px-5 py-2 text-xs font-semibold text-red-300 backdrop-blur-xl transition-all hover:border-red-400/50 hover:bg-red-500/25 hover:text-red-200 active:scale-95"
                >
                  Yes, Sign Out
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </header>
  );
}

function PublicFooter() {
  const { signInWithGoogle } = useAuth();
  const location = useLocation();
  const { data: publicConfig } = useQuery<Record<string, string>>({
    queryKey: ["public-config"],
    queryFn: () => api.get("/api/config/public"),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
  const showLogin = publicConfig?.show_login_buttons !== "false";

  return (
    <CinematicFooter key={location.pathname} onHiddenLogin={!showLogin ? signInWithGoogle : undefined} />
  );
}

export function PublicLayout() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isSubEvent = location.pathname.startsWith("/events/");
  const noTopPad = isHome || isSubEvent;

  return (
    <SmoothScroll>
      <div className="flex min-h-screen flex-col bg-bg-primary text-text-primary noise-bg">
        <PublicNavbar />
        <main className={`flex-1 ${noTopPad ? "" : "pt-16"}`}>
          <Outlet />
        </main>

        {/* Breathing space before the footer reveals — the page keeps going deeper */}
        <div aria-hidden className="pointer-events-none relative h-[42vh] min-h-64 w-full overflow-hidden bg-black">
          <GlitterFinal speed={0.75} intensity={6} />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 50% 100%, rgba(59,130,246,0.08), transparent 60%), radial-gradient(ellipse 60% 40% at 50% 40%, rgba(99,102,241,0.05), transparent 60%)",
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black" />
        </div>
        <PublicFooter />
      </div>
    </SmoothScroll>
  );
}