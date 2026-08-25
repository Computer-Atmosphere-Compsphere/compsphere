import React, { useState } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SSEStatusIndicator } from "@/components/compsphere/SSEStatusIndicator";
import { NeonButton } from "@/components/compsphere/NeonButton";
import { ConfirmModal } from "@/components/compsphere/ConfirmModal";
import { 
  LayoutDashboard, 
  Trophy, 
  BookOpen, 
  LogOut,
  ChevronRight,
  ExternalLink
} from "lucide-react";

export function JudgeLayout() {
  const { isAuthenticated, isAuthenticating, user, logout } = useAuth();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (isAuthenticating) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary text-text-primary">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-text-muted">Loading Judge session...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated or not correct role
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== "JUDGE") {
    return <Navigate to="/onboarding" replace />;
  }

  const navItems = [
    { label: "Overview", path: "/judge", icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: "Assigned Teams", path: "/judge/teams", icon: <Trophy className="w-4 h-4" /> },
    { label: "Proposal Review", path: "/judge/proposals", icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <div className="flex min-h-screen bg-bg-primary text-text-primary noise-bg">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-border bg-bg-secondary/60 flex flex-col fixed h-full z-45">
        {/* Brand Header */}
        <div className="h-16 border-b border-border px-5 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <img
              src="/compsphere-logo.png"
              alt="Compsphere"
              className="w-9 h-9 object-contain rounded"
            />
            <div className="flex flex-col leading-tight">
              <span className="font-extrabold tracking-widest text-text-primary text-[10px] uppercase">
                Judge Panel
              </span>
              <span className="text-[8px] font-semibold text-text-muted tracking-wider uppercase">
                Compsphere
              </span>
            </div>
          </Link>
          <div className="ml-auto">
            <SSEStatusIndicator />
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-border bg-bg-surface/20">
          <div className="flex items-center gap-2.5">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full border border-purple-900/30" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-purple-950/40 border border-purple-900/30 flex items-center justify-center text-xs font-bold text-purple-400">
                J
              </div>
            )}
            <div className="truncate flex-1">
              <p className="font-bold text-xs text-text-primary truncate">{user.fullName}</p>
              <span className="text-[9px] font-bold text-purple-400 bg-purple-950/40 border border-purple-900/30 px-1.5 py-0.5 rounded mt-1 inline-block uppercase">
                Evaluator Judge
              </span>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-md text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${
                  isActive
                    ? "bg-purple-950/20 text-purple-400 border border-purple-900/20 shadow-[0_0_10px_rgba(168,85,247,0.05)]"
                    : "text-text-secondary hover:bg-bg-surface hover:text-text-primary border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border mt-auto space-y-2">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full px-3 py-1.5 rounded-md text-xs font-semibold text-text-secondary bg-bg-surface border border-border hover:text-text-primary hover:border-border transition-all duration-200"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Back to Home
          </Link>
          <NeonButton onClick={() => setShowLogoutConfirm(true)} variant="ghost" size="sm" className="w-full text-xs">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </NeonButton>
        </div>
      </aside>

      <ConfirmModal
        open={showLogoutConfirm}
        title="Sign Out"
        description="Are you sure you want to sign out? You will need to log in again to access the judge panel."
        confirmLabel="Yes, Sign Out"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {/* Main Panel Outlet */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        <main className="flex-1 p-8 max-w-5xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
