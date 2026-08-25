import React, { useState } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SSEStatusIndicator } from "@/components/compsphere/SSEStatusIndicator";
import { NeonButton } from "@/components/compsphere/NeonButton";
import { ConfirmModal } from "@/components/compsphere/ConfirmModal";
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  CreditCard, 
  Code2, 
  QrCode, 
  Bell, 
  LogOut,
  ChevronRight,
  ExternalLink,
  Lock,
  ShieldCheck,
} from "lucide-react";

export function ParticipantLayout() {
  const { isAuthenticated, isAuthenticating, user, logout } = useAuth();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Fetch team data to check payment verification status
  const { data: myTeam } = useQuery<any>({
    queryKey: ["my-team"],
    queryFn: () => api.get("/api/teams/my-team"),
    enabled: isAuthenticated && user?.role === "PARTICIPANT",
  });

  if (isAuthenticating) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary text-text-primary">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-text-muted">Loading Compsphere session...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated or not correct role
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== "PARTICIPANT") {
    return <Navigate to="/onboarding" replace />;
  }

  // Determine if payment is verified (approved)
  const latestPayment = myTeam?.payments?.[0] ?? null;
  const isPaymentApproved = latestPayment?.status === "APPROVED";
  const teamStatus = myTeam?.team?.status;
  // Team is verified if payment is approved OR team status is already VERIFIED
  const isVerified = isPaymentApproved || teamStatus === "VERIFIED";

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" />, locked: false },
    { label: "Verification", path: "/dashboard/payment", icon: <CreditCard className="w-4 h-4" />, locked: false },
    { label: "SLA Countdown", path: "/dashboard/confirmation", icon: <Clock className="w-4 h-4" />, locked: false },
    { label: "Notifications", path: "/dashboard/notifications", icon: <Bell className="w-4 h-4" />, locked: false },
    { label: "Team Space", path: "/dashboard/team", icon: <Users className="w-4 h-4" />, locked: !isVerified },
    { label: "Submissions", path: "/dashboard/submission", icon: <Code2 className="w-4 h-4" />, locked: !isVerified },
    { label: "My QR Code", path: "/dashboard/qr", icon: <QrCode className="w-4 h-4" />, locked: !isVerified },
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
                Participant
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
              <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full border border-brand-dim" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-dim flex items-center justify-center text-xs font-bold text-brand-primary">
                {user.fullName[0]}
              </div>
            )}
            <div className="truncate flex-1">
              <p className="font-bold text-xs text-text-primary truncate">{user.fullName}</p>
              <span className="text-[10px] font-semibold text-text-muted bg-brand-dim px-1.5 py-0.5 rounded mt-1 inline-block uppercase">
                {user.memberRole === "TEAM_LEADER" ? "Leader" : "Member"}
              </span>
            </div>
          </div>
        </div>

        {/* Payment status banner */}
        {!isVerified && (
          <div className="mx-4 mt-4 p-3 rounded-lg bg-orange-950/30 border border-orange-900/30">
            <div className="flex items-start gap-2">
              <Lock className="w-3.5 h-3.5 text-orange-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-orange-300 uppercase tracking-wide">Payment Pending</p>
                <p className="text-[10px] text-orange-400/70 mt-0.5 leading-relaxed">
                  Complete payment verification to unlock all features.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const isLocked = item.locked;

            if (isLocked) {
              return (
                <div
                  key={item.path}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-md text-xs font-semibold tracking-wider uppercase text-text-muted/40 cursor-not-allowed border border-transparent"
                  title="Complete payment verification to unlock"
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  <Lock className="w-3 h-3 opacity-40" />
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-md text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${
                  isActive
                    ? "bg-brand-dim text-brand-primary border border-brand-primary/10 shadow-[0_0_10px_rgba(0,245,200,0.1)]"
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
        description="Are you sure you want to sign out? You will need to log in again to access your dashboard."
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
