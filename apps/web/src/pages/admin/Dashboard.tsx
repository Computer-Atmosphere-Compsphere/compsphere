import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSSE } from "@/hooks/useSSE";
import { MetricCard } from "@/components/compsphere/MetricCard";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import {
  Trophy,
  FileCheck,
  ShieldAlert,
  Database,
  Users,
  CreditCard,
  Send,
  ScanLine,
  Gavel,
  Clock,
  Activity,
  Wifi,
  WifiOff,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Upload,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const CATEGORY_COLORS: Record<string, string> = {
  NATIONAL: "#38bdf8",
  MIX: "#fbbf24",
  INTERNATIONAL: "#c084fc",
};

const ACTION_LABELS: Record<string, string> = {
  TEAM_VERIFIED: "Team Verified",
  TEAM_DROPPED: "Team Dropped",
  TEAM_LEADER_ACTIVATED: "Leader Activated",
  TEAM_MEMBER_JOINED: "Member Joined",
  TEAM_TOKEN_REGENERATED: "Token Regenerated",
  PAYMENT_APPROVED: "Payment Approved",
  PAYMENT_REJECTED: "Payment Rejected",
  CONFIRMATION_SUBMITTED: "Payment Submitted",
  SCORE_SUBMITTED: "Score Submitted",
  ATTENDANCE_SCANNED: "Attendance Scanned",
  PHASE1_JUDGING_GENERATED: "Phase 1 Generated",
  SYSTEM_CONFIG_UPDATED: "Config Updated",
  JUDGE_ADDED: "Judge Added",
  JUDGE_REMOVED: "Judge Removed",
  ONBOARD_REGULAR_USER: "User Onboarded",
};

function formatAction(action: string): string {
  return ACTION_LABELS[action] || action.replace(/_/g, " ").toLowerCase();
}

export function Dashboard() {
  const { isConnected, isReconnecting } = useSSE();

  const { data: metrics, isLoading } = useQuery<any>({
    queryKey: ["admin-metrics"],
    queryFn: () => api.get("/api/admin/metrics"),
    refetchInterval: 10_000, // Poll every 10s for faster updates
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Chart data for operational funnel
  const funnelData = [
    { name: "New", value: Number(metrics?.new_count ?? 0) },
    { name: "Awaiting", value: Number(metrics?.awaiting_confirmation ?? 0) },
    { name: "Payment", value: Number(metrics?.payment_pending ?? 0) },
    { name: "Reviewing", value: Number(metrics?.verification_pending ?? 0) },
    { name: "Verified", value: Number(metrics?.verified ?? 0) },
    { name: "Dropped", value: Number(metrics?.dropped ?? 0) },
  ];

  // Category pie data
  const categoryData = (metrics?.categories ?? []).map((c: any) => ({
    name: c.category,
    value: Number(c.count),
    verified: Number(c.verified_count),
  }));

  // Judging progress
  const judging = metrics?.judging ?? {};
  const judgingPercentage = judging.totalAssignments
    ? Math.round((judging.totalScores / judging.totalAssignments) * 100)
    : 0;

  // Payments
  const payments = metrics?.payments ?? {};

  const total = Number(metrics?.total_imported ?? 0);
  const verified = Number(metrics?.verified ?? 0);
  const confirmedPct = total ? Math.round((verified / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header with connection status */}
      <div className="pb-6 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary">Admin Operations Console</h1>
          <p className="text-xs text-text-secondary mt-1">
            Real-time competition overview. All data updates automatically via SSE.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border",
            isConnected
              ? "bg-green-950/40 text-green-400 border-green-900/50"
              : isReconnecting
              ? "bg-amber-950/40 text-amber-400 border-amber-900/50"
              : "bg-red-950/40 text-red-400 border-red-900/50"
          )}>
            {isConnected ? (
              <><Wifi className="w-3 h-3" /> Live</>
            ) : isReconnecting ? (
              <><Clock className="w-3 h-3 animate-spin" /> Reconnecting...</>
            ) : (
              <><WifiOff className="w-3 h-3" /> Offline</>
            )}
          </div>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Teams"
          value={total}
          icon={<Database className="w-5 h-5 text-purple-400" />}
          description={`${confirmedPct}% confirmed`}
        />
        <MetricCard
          title="Verified & Confirmed"
          value={verified}
          icon={<FileCheck className="w-5 h-5 text-brand-primary" />}
          description={`Phase 2 qualified seats`}
        />
        <MetricCard
          title="Awaiting Confirmation"
          value={metrics?.awaiting_confirmation ?? 0}
          icon={<Trophy className="w-5 h-5 text-yellow-400" />}
          description="In SLA countdown"
        />
        <MetricCard
          title="Dropped"
          value={metrics?.dropped ?? 0}
          icon={<ShieldAlert className="w-5 h-5 text-red-400" />}
          description="Expired or manually dropped"
        />
      </div>

      {/* Second Stats Row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Payment Pending"
          value={payments.pending ?? 0}
          icon={<CreditCard className="w-5 h-5 text-amber-400" />}
          description={`${payments.approved ?? 0} approved, ${payments.rejected ?? 0} rejected`}
        />
        <MetricCard
          title="Submissions"
          value={metrics?.submission_count ?? 0}
          icon={<Send className="w-5 h-5 text-cyan-400" />}
          description={`Phase 2 deliverables`}
        />
        <MetricCard
          title="Active Judges"
          value={judging.activeJudges ?? 0}
          icon={<Gavel className="w-5 h-5 text-indigo-400" />}
          description={`${judging.totalScores ?? 0}/${judging.totalAssignments ?? 0} scored (${judgingPercentage}%)`}
        />
        <MetricCard
          title="Check-ins"
          value={metrics?.attendance_count ?? 0}
          icon={<ScanLine className="w-5 h-5 text-teal-400" />}
          description="Venue attendance logged"
        />
      </div>

      {/* Charts + Details */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Operational Funnel Chart */}
        <GlassPanel className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-brand-primary" />
              Operational Funnel
            </h3>
            <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
              <Activity className="w-3 h-3 text-green-400 animate-pulse" />
              Auto-refresh 10s
            </div>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} barGap={4}>
                <XAxis dataKey="name" stroke="#607873" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#607873" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#051715", borderColor: "rgba(0, 245, 200, 0.12)", borderRadius: "8px", fontSize: "12px" }}
                  itemStyle={{ color: "#F4FFFC" }}
                  cursor={{ fill: "rgba(0,245,200,0.04)" }}
                />
                <Bar dataKey="value" fill="#00F5C8" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        {/* Category Breakdown */}
        <GlassPanel className="space-y-4">
          <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-primary" />
            By Category
          </h3>
          {categoryData.length > 0 ? (
            <>
              <div className="h-40 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {categoryData.map((entry: any) => (
                        <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || "#666"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#051715", borderColor: "rgba(0, 245, 200, 0.12)", borderRadius: "8px", fontSize: "12px" }}
                      itemStyle={{ color: "#F4FFFC" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {categoryData.map((c: any) => (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[c.name] }} />
                      <span className="text-text-secondary">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-text-primary">{c.value}</span>
                      <span className="text-text-muted text-[10px]">({c.verified} verified)</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-text-muted text-center py-8">No data</p>
          )}
        </GlassPanel>
      </div>

      {/* Bottom Row: Judging Progress + Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Judging Progress */}
        <GlassPanel className="space-y-4">
          <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
            <Gavel className="w-4 h-4 text-brand-primary" />
            Judging Progress
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-text-secondary">Phase 1 Scoring</span>
                <span className="font-mono font-bold text-brand-primary">{judgingPercentage}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-bg-surface overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-primary transition-all duration-500"
                  style={{ width: `${judgingPercentage}%` }}
                />
              </div>
              <p className="text-[10px] text-text-muted mt-1">
                {judging.totalScores ?? 0} of {judging.totalAssignments ?? 0} assignments scored
              </p>
            </div>

            <div className="h-px bg-border/40" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Submissions</p>
                <p className="text-lg font-extrabold font-mono text-text-primary mt-0.5">
                  {metrics?.submission_count ?? 0}
                  <span className="text-text-muted text-xs font-normal"> / {verified}</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Venue Check-ins</p>
                <p className="text-lg font-extrabold font-mono text-text-primary mt-0.5">
                  {metrics?.attendance_count ?? 0}
                </p>
              </div>
            </div>
          </div>
        </GlassPanel>

        {/* Recent Activity Feed */}
        <GlassPanel className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-primary" />
              Recent Activity
            </h3>
            <span className="text-[10px] text-text-muted">Last 10 events</span>
          </div>
          <div className="space-y-0 max-h-[320px] overflow-y-auto">
            {(metrics?.recentActivity ?? []).length > 0 ? (
              (metrics.recentActivity as any[]).map((log: any, idx: number) => {
                const isApproval = log.action?.includes("APPROVED") || log.action?.includes("VERIFIED");
                const isRejection = log.action?.includes("REJECTED") || log.action?.includes("DROPPED");
                return (
                  <div key={idx} className="flex items-start gap-3 py-2.5 border-b border-border/30 last:border-0">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      isApproval ? "bg-green-950/40" : isRejection ? "bg-red-950/40" : "bg-bg-surface"
                    )}>
                      {isApproval ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      ) : isRejection ? (
                        <XCircle className="w-3.5 h-3.5 text-red-400" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-brand-primary" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-text-primary">
                        <span className="font-bold">{formatAction(log.action)}</span>
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-text-muted mt-0.5">
                        {log.actor_name && <span>{log.actor_name}</span>}
                        {log.entity_type && <span className="font-mono">{log.entity_type}</span>}
                        {log.created_at && (
                          <span>{new Date(log.created_at).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <Activity className="w-8 h-8 text-text-muted mx-auto mb-2" />
                <p className="text-xs text-text-muted">No recent activity</p>
              </div>
            )}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
