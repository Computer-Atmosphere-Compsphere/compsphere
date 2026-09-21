import React, { useEffect, useRef, useState } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button";
import { CinematicFooter } from "@/components/ui/motion-footer";
import { subEvents } from "@/components/landing/events.data";
import { ChevronDown, LogOut, ArrowRight, CalendarDays } from "lucide-react";

export function UserLayout() {
  const { isAuthenticated, isAuthenticating, user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const location = useLocation();

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

  if (isAuthenticating) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <div className="text-center space-y-3">
          <div className="w-9 h-9 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto shadow-brand-glow" />
          <p className="text-xs text-text-muted tracking-widest uppercase">Connecting Session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // Redirect to respective console if user has specialized role
  if (user.role === "ADMIN") return <Navigate to="/admin" replace />;
  if (user.role === "JUDGE") return <Navigate to="/judge" replace />;
  if (user.role === "PARTICIPANT") return <Navigate to="/dashboard" replace />;

  const isFloating = scrolled;

  return (
    <div className="min-h-screen bg-black text-text-primary selection:bg-brand-primary/30 selection:text-brand-primary flex flex-col font-sans">
      {/* ── Fixed Floating Navigation Header (Landing Page Aesthetic) ── */}
      <header className="fixed inset-x-0 top-0 z-50">
        <div
          className={`px-2.5 transition-[padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-6 ${
            scrolled ? "pt-2.5 sm:pt-3" : "pt-2 sm:pt-3"
          }`}
        >
          <div
            className={`mx-auto flex items-center justify-between rounded-2xl sm:rounded-3xl border transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isFloating
                ? "h-12 sm:h-14 md:h-16 max-w-5xl px-3 sm:px-4 md:px-6 border-white/20 bg-[#0a0a0a]/85 shadow-[0_8px_40px_rgba(0,0,0,0.65),0_0_40px_rgba(0,245,200,0.06),inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-2xl backdrop-saturate-[1.8]"
                : "h-14 sm:h-16 max-w-5xl px-3 sm:px-5 border-white/10 bg-[#0a0a0a]/60 shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-xl"
            }`}
          >
            {/* Logo */}
            <Link to="/" className="group flex items-center gap-2.5">
              <img
                src="/compsphere-logo.png"
                alt="Compsphere"
                className={`w-auto transition-all duration-500 group-hover:scale-105 ${
                  isFloating ? "h-7 sm:h-8 md:h-9" : "h-8 sm:h-9 md:h-10"
                }`}
              />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden items-center gap-7 md:flex">
              <Link
                to="/"
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
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-300 ${
                      subOpen ? "rotate-180" : ""
                    }`}
                  />
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
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"
                      />
                      <div
                        aria-hidden
                        className="pointer-events-none absolute -top-16 left-1/2 h-32 w-3/4 -translate-x-1/2 rounded-full bg-white/[0.06] blur-3xl"
                      />
                      <div className="relative grid gap-1">
                        {subEvents.map((e) => (
                          <Link
                            key={e.id}
                            to={`/events/${e.id}`}
                            className="group flex items-center gap-3.5 rounded-xl p-2 transition-colors hover:bg-white/[0.08]"
                          >
                            <img
                              src={e.iconSrc}
                              alt={e.name}
                              className="h-12 w-12 shrink-0 object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-110"
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
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link
                to="/#partners"
                className="text-sm font-semibold text-text-secondary transition-colors hover:text-brand-primary"
              >
                Partners
              </Link>
            </nav>

            {/* Right User Actions */}
            <div className="hidden items-center gap-3 md:flex">
              {/* User Avatar & Name Tag */}
              <div className="flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.06] py-1 pl-1.5 pr-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-xl">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="h-6 w-6 rounded-full object-cover border border-brand-primary/40"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary/20 text-xs font-bold text-brand-primary">
                    {user.fullName ? user.fullName[0].toUpperCase() : "U"}
                  </div>
                )}
                <span className="max-w-[130px] truncate text-xs font-semibold text-white">
                  {user.fullName}
                </span>
              </div>

              {/* Sign Out Button */}
              <LiquidGlassButton
                label="Sign Out"
                variant="destructive"
                onClick={() => setSignOutOpen(true)}
                icon={<LogOut className="h-3.5 w-3.5" />}
              />
            </div>

            {/* Mobile Hamburger */}
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

          {/* Mobile dropdown panel */}
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden md:hidden"
              >
                <div className="mx-2.5 sm:mx-6 mt-1.5 rounded-2xl border border-white/[0.15] bg-[#0a0a0a]/95 p-4 shadow-[0_16px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.fullName}
                          className="h-7 w-7 rounded-full object-cover border border-brand-primary/40"
                        />
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary/20 text-xs font-bold text-brand-primary">
                          {user.fullName ? user.fullName[0].toUpperCase() : "U"}
                        </div>
                      )}
                      <div className="leading-tight">
                        <div className="text-xs font-bold text-white truncate max-w-[160px]">{user.fullName}</div>
                        <div className="text-[10px] text-brand-primary">Regular Account</div>
                      </div>
                    </div>
                  </div>

                  <nav className="grid gap-1">
                    <Link
                      to="/"
                      className="rounded-xl px-3 py-2 text-sm font-semibold text-text-secondary hover:bg-white/10 hover:text-white"
                    >
                      Home
                    </Link>
                    <Link
                      to="/#sponsors"
                      className="rounded-xl px-3 py-2 text-sm font-semibold text-text-secondary hover:bg-white/10 hover:text-white"
                    >
                      Sponsors
                    </Link>
                    <Link
                      to="/#speakers"
                      className="rounded-xl px-3 py-2 text-sm font-semibold text-text-secondary hover:bg-white/10 hover:text-white"
                    >
                      Speakers
                    </Link>
                    <Link
                      to="/#partners"
                      className="rounded-xl px-3 py-2 text-sm font-semibold text-text-secondary hover:bg-white/10 hover:text-white"
                    >
                      Partners
                    </Link>
                  </nav>

                  <div className="pt-2 border-t border-white/10">
                    <LiquidGlassButton
                      label="Sign Out"
                      variant="destructive"
                      onClick={() => setSignOutOpen(true)}
                      className="w-full"
                      icon={<LogOut className="h-3.5 w-3.5" />}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* ── Main Dashboard Body ── */}
      <main className="flex-1 pt-20 sm:pt-24">
        <Outlet />
      </main>

      {/* Cinematic Footer matching the landing page */}
      <CinematicFooter />

      {/* Sign Out Confirmation Modal */}
      <AlertDialog.Root open={signOutOpen} onOpenChange={setSignOutOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md animate-fade-in" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/20 bg-[#0D0D0D]/95 p-6 shadow-2xl space-y-4 focus:outline-none backdrop-blur-2xl">
            <AlertDialog.Title className="text-base font-bold text-white flex items-center gap-2">
              <LogOut className="w-4 h-4 text-red-400" />
              Sign Out Confirmation
            </AlertDialog.Title>
            <AlertDialog.Description className="text-xs text-text-secondary leading-relaxed">
              Are you sure you want to end your session? You can sign back in at any time with your Google account.
            </AlertDialog.Description>
            <div className="flex justify-end gap-3 pt-3">
              <AlertDialog.Cancel asChild>
                <LiquidGlassButton label="Cancel" />
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <LiquidGlassButton
                  label="Sign Out"
                  variant="destructive"
                  onClick={() => logout()}
                />
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
