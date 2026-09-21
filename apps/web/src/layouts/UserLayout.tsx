import React, { useState } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { NeonButton } from "@/components/compsphere/NeonButton";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import {
  Compass,
  BookOpen,
  Calendar,
  Layers,
  LogOut,
  ExternalLink,
  ShieldCheck,
  User,
  Sparkles,
  ChevronRight,
} from "lucide-react";

export function UserLayout() {
  const { isAuthenticated, isAuthenticating, user, logout } = useAuth();
  const location = useLocation();
  const [signOutOpen, setSignOutOpen] = useState(false);

  if (isAuthenticating) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary text-text-primary">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto shadow-brand-glow" />
          <p className="text-xs text-text-muted tracking-wider uppercase">Loading Explorer Portal...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // If user has upgraded role, redirect to appropriate console
  if (user.role === "ADMIN") return <Navigate to="/admin" replace />;
  if (user.role === "JUDGE") return <Navigate to="/judge" replace />;
  if (user.role === "PARTICIPANT") return <Navigate to="/dashboard" replace />;

  const navLinks = [
    { label: "Dashboard", path: "/user", icon: <Compass className="w-4 h-4" /> },
    { label: "Guidebook", path: "/guidebook", icon: <BookOpen className="w-4 h-4" /> },
    { label: "Timeline", path: "/timeline", icon: <Calendar className="w-4 h-4" /> },
    { label: "Announcements", path: "/announcements", icon: <Layers className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#07090E] text-text-primary noise-bg flex flex-col selection:bg-brand-primary/30 selection:text-brand-primary">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07090E]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Status Pill */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <img
                src="/compsphere-logo.png"
                alt="Compsphere"
                className="h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
              <div className="hidden sm:flex flex-col leading-none">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-text-primary">
                  Compsphere
                </span>
                <span className="text-[8px] font-semibold text-brand-primary uppercase tracking-wider">
                  2026 Atmosphere
                </span>
              </div>
            </Link>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-primary/10 text-brand-primary border border-brand-primary/30">
              <Sparkles className="w-2.5 h-2.5 animate-pulse" />
              Regular Explorer
            </span>
          </div>

          {/* Center Nav Links */}
          <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] border border-white/10 rounded-full px-3 py-1">
            {navLinks.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-brand-primary/20 text-brand-primary border border-brand-primary/30 shadow-sm"
                      : "text-text-secondary hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-text-muted hover:text-white hover:bg-white/5 transition-all"
            >
              Public Site <ExternalLink className="w-3 h-3" />
            </Link>
          </nav>

          {/* User Profile Pill & Sign Out */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 pl-2 pr-3 py-1 rounded-full bg-white/[0.04] border border-white/10">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-7 h-7 rounded-full object-cover border border-brand-primary/40"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary font-bold text-xs">
                  {user.fullName ? user.fullName[0].toUpperCase() : "U"}
                </div>
              )}
              <div className="hidden sm:flex flex-col text-left leading-tight">
                <span className="text-xs font-bold text-white max-w-[120px] truncate">
                  {user.fullName}
                </span>
                <span className="text-[9px] text-text-muted max-w-[120px] truncate">
                  {user.email}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSignOutOpen(true)}
              title="Sign Out"
              className="flex items-center justify-center w-8 h-8 rounded-full border border-white/10 bg-white/5 text-text-muted hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Sign Out Confirmation Modal */}
      <AlertDialog.Root open={signOutOpen} onOpenChange={setSignOutOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-fade-in" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/15 bg-[#0D0F17] p-6 shadow-2xl space-y-4 focus:outline-none">
            <AlertDialog.Title className="text-lg font-bold text-white flex items-center gap-2">
              <LogOut className="w-5 h-5 text-red-400" />
              Sign Out Confirmation
            </AlertDialog.Title>
            <AlertDialog.Description className="text-xs text-text-secondary leading-relaxed">
              Are you sure you want to end your current session? You can sign back in anytime with your Google account.
            </AlertDialog.Description>
            <div className="flex justify-end gap-3 pt-3">
              <AlertDialog.Cancel asChild>
                <button className="px-4 py-2 text-xs font-semibold text-text-muted hover:text-white rounded-lg border border-white/10 hover:bg-white/5 transition-colors">
                  Cancel
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  onClick={() => logout()}
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-lg shadow-red-600/30 transition-all"
                >
                  Sign Out
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
