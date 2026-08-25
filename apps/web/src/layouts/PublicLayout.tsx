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
      <div className={`px-3 transition-[padding-top] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-6 ${scrolled ? "pt-3" : "pt-0"}`}>
        <div
          className={`mx-auto flex h-16 max-w-7xl items-center justify-between rounded-3xl border px-4 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-6 ${
            isFloating
              ? "border-white/20 bg-white/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.55),0_0_40px_rgba(0,245,200,0.08),inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-2xl backdrop-saturate-[1.8]"
              : "border-transparent bg-transparent shadow-none"
          }`}
        >
        {/* Logo */}
        <Link to="/" className="group flex items-center">
          <img
            src="/compsphere-logo.png"
            alt="Compsphere"
            className="h-9 w-auto transition-transform duration-500 group-hover:scale-105 sm:h-10"
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
        <button
          className="flex h-10 w-10 items-center justify-center rounded-md border border-border text-text-secondary md:hidden"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile panel */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden ${
              isFloating
                ? "mx-auto max-w-7xl rounded-b-3xl border-x border-b border-white/20 bg-white/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.55)] backdrop-blur-2xl backdrop-saturate-[1.8]"
                : "border-t border-border bg-bg-secondary/95 backdrop-blur-xl"
            }`}
          >
            <div className="space-y-4 px-6 py-5">
              <div className="flex flex-col gap-1 text-sm font-semibold">
                <Link to="/" onClick={(e) => { if (location.pathname === "/") { e.preventDefault(); scrollToTop(); } }} className="rounded-md px-3 py-2 text-text-secondary hover:bg-bg-surface hover:text-brand-primary">Home</Link>
                <Link to="/#sponsors" className="rounded-md px-3 py-2 text-text-secondary hover:bg-bg-surface hover:text-brand-primary">Sponsors</Link>
                <Link to="/#speakers" className="rounded-md px-3 py-2 text-text-secondary hover:bg-bg-surface hover:text-brand-primary">Speakers</Link>
                <Link to="/#timeline" className="rounded-md px-3 py-2 text-text-secondary hover:bg-bg-surface hover:text-brand-primary">Timeline</Link>
                <Link to="/#partners" className="rounded-md px-3 py-2 text-text-secondary hover:bg-bg-surface hover:text-brand-primary">Partners</Link>
              </div>

              <div className="border-t border-border pt-3">
                <p className="mono-chip mb-2 px-3 text-[9px] uppercase tracking-[0.3em] text-text-muted">
                  Sub-Events
                </p>
                <div className="grid gap-1">
                  {subEvents.map((e) => {
                    return (
                      <Link
                        key={e.id}
                        to={`/events/${e.id}`}
                        className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-bg-surface"
                      >
                        <img
                          src={e.iconSrc}
                          alt={e.name}
                          className="h-9 w-9 shrink-0 object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.5)]"
                        />
                        <span className="space-y-0.5">
                          <span className="block text-xs font-bold text-text-primary">{e.name}</span>
                          <span className="block text-[10px] text-text-muted">{e.date}</span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-border pt-4">
                {isAuthenticating ? (
                  <span className="mono-chip px-3 text-[10px] uppercase tracking-widest text-text-muted">sync…</span>
                ) : isAuthenticated && user ? (
                  <>
                    <Link to={dashboardPath} className="w-full">
                      <LiquidGlassButton label="Dashboard" className="w-full" />
                    </Link>
                    <LiquidGlassButton label="Sign Out" variant="destructive" onClick={() => setSignOutOpen(true)} icon={<LogOut className="h-3.5 w-3.5" />} className="w-full" />
                  </>
                ) : showLogin ? (
                  <>
                    <div className="flex justify-center">
                      <LiquidGlassButton label="Log in" onClick={signInWithGoogle} />
                    </div>
                    <div className="flex justify-center">
                      <LiquidGlassButton label="Register" variant="register" onClick={signInWithGoogle} />
                    </div>
                  </>
                ) : null}
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