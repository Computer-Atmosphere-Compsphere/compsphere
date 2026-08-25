import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { CountdownCard } from "@/components/compsphere/CountdownCard";
import { StatusBadge } from "@/components/compsphere/StatusBadge";
import { RankingCard } from "@/components/compsphere/RankingCard";
import { VerificationCard } from "@/components/compsphere/VerificationCard";
import { SubmissionCard } from "@/components/compsphere/SubmissionCard";
import { Trophy, ShieldAlert, CheckCircle, Bell, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function Dashboard() {
  const { user } = useAuth();

  const { data: myTeam, isLoading } = useQuery<any>({
    queryKey: ["my-team"],
    queryFn: () => api.get("/api/teams/my-team"),
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });

  const { data: notifications } = useQuery<any[]>({
    queryKey: ["notifications"],
    queryFn: () => api.get("/api/notifications"),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!myTeam) {
    return (
      <GlassPanel className="text-center p-12 max-w-md mx-auto space-y-4">
        <ShieldAlert className="w-12 h-12 text-yellow-500 mx-auto" />
        <h3 className="text-lg font-bold text-text-primary">No Team Context Found</h3>
        <p className="text-xs text-text-secondary leading-relaxed">
          Your profile has not been linked to a valid qualified team workspace. If you entered a token, contact your leader.
        </p>
      </GlassPanel>
    );
  }

  const { team, members, proposal, payments, submissions } = myTeam;
  // Derive latest payment & submission from the arrays the API returns
  const payment = payments?.[0] ?? null;
  const submission = submissions?.[0] ?? null;
  const deadlineExpired = team.confirmationDeadline ? new Date() >= new Date(team.confirmationDeadline) : false;

  return (
    <div className="space-y-8">
      {/* Header Block */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-border">
        <div>
          <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider bg-brand-dim px-2.5 py-0.5 rounded">
            {team.teamCode}
          </span>
          <h1 className="text-3xl font-extrabold text-text-primary mt-2">{team.teamName}</h1>
          <p className="text-xs text-text-secondary mt-1">Category: {team.category}</p>
        </div>
        <StatusBadge status={team.status} className="text-sm px-4 py-1.5" />
      </div>

      {/* Grid of SLA Countdown / Rank / Alerts */}
      <div className="grid md:grid-cols-2 gap-6">
        <CountdownCard deadline={team.confirmationDeadline} className="w-full" />
        <RankingCard originalRank={team.originalRank} className="w-full" />
      </div>

      {/* Main Grid Options */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left column: Verification status card */}
        <VerificationCard
          team={team}
          payment={payment}
          onUploadClick={() => window.location.href = "/dashboard/payment"}
          className="md:col-span-2"
        />

        {/* Right column: Unread Notifications / Members list */}
        <GlassPanel className="space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-text-primary flex items-center justify-between">
              <span>Recent Activity</span>
              <Bell className="w-4 h-4 text-text-secondary" />
            </h3>
            {notifications && notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.slice(0, 3).map((notif, idx) => (
                  <div key={idx} className="text-xs border-b border-border/40 pb-2">
                    <p className="font-semibold text-text-primary">{notif.title}</p>
                    <p className="text-text-muted mt-0.5 line-clamp-2">{notif.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted">No recent notifications.</p>
            )}
          </div>
          <Link to="/dashboard/notifications" className="text-xs text-brand-primary font-bold hover:underline flex items-center gap-1 mt-4">
            View All Activity <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </GlassPanel>
      </div>

      {/* Submissions Section */}
      <div className="grid md:grid-cols-3 gap-6">
        <SubmissionCard
          team={team}
          submission={submission}
          onSubmitClick={() => window.location.href = "/dashboard/submission"}
          isExpired={false} // Deadline checks handled inside
          className="md:col-span-2"
        />

        <GlassPanel className="space-y-4">
          <h3 className="font-bold text-sm text-text-primary">Workspace Members</h3>
          <div className="space-y-3">
            {members.map((m: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                {m.user?.avatarUrl ? (
                  <img src={m.user.avatarUrl} alt="Avatar" className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-bg-surface flex items-center justify-center font-bold text-text-primary">
                    {m.user?.fullName?.[0]}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-text-primary">{m.user?.fullName}</p>
                  <p className="text-[10px] text-text-muted capitalize">
                    {m.role === "TEAM_LEADER" ? "Leader" : "Member"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
