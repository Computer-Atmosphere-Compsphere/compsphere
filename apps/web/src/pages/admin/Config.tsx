import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { NeonButton } from "@/components/compsphere/NeonButton";
import {
  Settings,
  Save,
  Trophy,
  Clock,
  CreditCard,
  Users,
  BarChart3,
  Zap,
  ChevronDown,
  ChevronRight,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfigItem {
  key: string;
  value: string;
  type: string;
  description?: string;
  updatedAt?: string;
}

interface ConfigCategory {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  keys: string[];
}

const CATEGORIES: ConfigCategory[] = [
  {
    id: "competition",
    label: "Competition Info",
    description: "General competition branding and current phase settings",
    icon: <Trophy className="w-4 h-4" />,
    color: "text-brand-primary",
    keys: ["competition_name", "competition_phase"],
  },
  {
    id: "countdown",
    label: "Countdown & Launch",
    description: "Control live countdown timers on the public landing page",
    icon: <Clock className="w-4 h-4" />,
    color: "text-cyan-400",
    keys: ["countdown_compsphere_enabled", "countdown_talksphere_enabled", "countdown_enabled", "countdown_24h_enabled"],
  },
  {
    id: "landing",
    label: "Landing Page",
    description: "Control visibility of elements on the public landing page",
    icon: <EyeOff className="w-4 h-4" />,
    color: "text-pink-400",
    keys: ["show_login_buttons"],
  },
  {
    id: "timeline",
    label: "Timeline & Deadlines",
    description: "Time windows, expiry durations, and submission deadlines",
    icon: <Clock className="w-4 h-4" />,
    color: "text-amber-400",
    keys: [
      "confirmation_window_hours",
      "submission_deadline",
      "qr_token_expiry_hours",
      "invite_expiry_hours",
    ],
  },
  {
    id: "payment",
    label: "Payment & Fees",
    description: "Slot confirmation fees per team category",
    icon: <CreditCard className="w-4 h-4" />,
    color: "text-emerald-400",
    keys: [
      "payment_amount_national",
      "payment_amount_mix",
      "payment_amount_international",
    ],
  },
  {
    id: "slots",
    label: "Slots & Allocation",
    description: "Total slot counts, category ratios, and team size limits",
    icon: <Users className="w-4 h-4" />,
    color: "text-sky-400",
    keys: [
      "top30_total_slots",
      "allocation_national_mix_ratio",
      "allocation_international_ratio",
      "max_team_members",
    ],
  },
  {
    id: "scoring",
    label: "Scoring & Judging",
    description: "Score weights per criterion and min/max score range",
    icon: <BarChart3 className="w-4 h-4" />,
    color: "text-purple-400",
    keys: [
      "scoring_weight_mvp",
      "scoring_weight_impact",
      "scoring_weight_creative",
      "scoring_weight_pitch",
      "score_min",
      "score_max",
    ],
  },
  {
    id: "features",
    label: "Feature Flags",
    description: "Toggle optional competition features on or off",
    icon: <Zap className="w-4 h-4" />,
    color: "text-orange-400",
    keys: ["battle_royale_enabled"],
  },
];

/** Friendly label for each config key */
const KEY_LABELS: Record<string, string> = {
  competition_name: "Competition Name",
  competition_phase: "Current Phase",
  confirmation_window_hours: "Confirmation Window",
  submission_deadline: "Submission Deadline",
  qr_token_expiry_hours: "QR Token Expiry",
  invite_expiry_hours: "Invite Expiry",
  payment_amount_national: "National Fee",
  payment_amount_mix: "Mix Fee",
  payment_amount_international: "International Fee",
  top30_total_slots: "Total Slots",
  allocation_national_mix_ratio: "National + Mix Ratio",
  allocation_international_ratio: "International Ratio",
  max_team_members: "Max Team Members",
  scoring_weight_mvp: "MVP Weight",
  scoring_weight_impact: "Impact Weight",
  scoring_weight_creative: "Creative Weight",
  scoring_weight_pitch: "Pitch Weight",
  score_min: "Min Score",
  score_max: "Max Score",
  countdown_compsphere_enabled: "Compsphere (Oct 5)",
  countdown_talksphere_enabled: "TalkSphere (Oct 7)",
  countdown_enabled: "Hacksphere (Oct 10)",
  countdown_24h_enabled: "24-Hour Hackathon (Oct 10–11)",
  battle_royale_enabled: "Battle Royale",
  show_login_buttons: "Show Login & Register",
};

/** Description for each config key */
const KEY_DESCRIPTIONS: Record<string, string> = {
  competition_name: "Display name used across all pages and emails",
  competition_phase: "Current competition phase number (1 = Registration, 2 = Submission, etc.)",
  confirmation_window_hours: "Hours after leader activation to confirm slot and upload payment",
  submission_deadline: "Final deadline for Phase 2 deliverable submissions",
  qr_token_expiry_hours: "Hours before an attendance QR token expires",
  invite_expiry_hours: "Hours before a team member invite link expires",
  payment_amount_national: "Slot confirmation fee for National teams (Rp)",
  payment_amount_mix: "Slot confirmation fee for Mix teams (Rp)",
  payment_amount_international: "Slot confirmation fee for International teams (Rp)",
  top30_total_slots: "Number of confirmed Top 30 slots available",
  allocation_national_mix_ratio: "Proportion of slots allocated to National + Mix teams (0-1)",
  allocation_international_ratio: "Proportion of slots allocated to International teams (0-1)",
  max_team_members: "Maximum number of members per team",
  scoring_weight_mvp: "Weight for MVP / Technical quality criterion (sum of all weights = 1.0)",
  scoring_weight_impact: "Weight for Impact / Real-world value criterion",
  scoring_weight_creative: "Weight for Creativity / Innovation criterion",
  scoring_weight_pitch: "Weight for Pitch / Presentation criterion",
  score_min: "Minimum score a judge can give",
  score_max: "Maximum score a judge can give",
  countdown_compsphere_enabled: "Show countdown to Oct 5 (Compsphere opening) on the landing page",
  countdown_talksphere_enabled: "Show countdown to Oct 7 (TalkSphere session day) on the landing page",
  countdown_enabled: "Show countdown to Oct 10 (Hacksphere hackathon day) on the landing page",
  countdown_24h_enabled: "Show 24-hour hackathon timer (Oct 10 → Oct 11) on the landing page",
  battle_royale_enabled: "Enable Battle Royale slot claiming for waitlisted teams (true/false)",
  show_login_buttons: "Show the Login and Register buttons on the landing page. When disabled, buttons are hidden and a discreet login link appears in the footer.",
};

/** Format value for display */
function formatValue(key: string, value: string): string {
  if (KEY_LABELS[key]?.includes("Fee") || KEY_LABELS[key]?.includes("Fee")) {
    const num = Number(value);
    if (!isNaN(num) && num > 0) return `Rp${num.toLocaleString("id-ID")}`;
    if (num === 0) return "Free";
  }
  if (KEY_LABELS[key]?.includes("Ratio")) {
    const num = Number(value);
    if (!isNaN(num)) return `${(num * 100).toFixed(0)}%`;
  }
  if (KEY_LABELS[key]?.includes("Weight")) {
    const num = Number(value);
    if (!isNaN(num)) return `${(num * 100).toFixed(0)}%`;
  }
  if (KEY_LABELS[key]?.includes("Hours")) {
    const num = Number(value);
    if (!isNaN(num)) return `${num}h`;
  }
  if (key.includes("enabled") || key.includes("show_login")) {
    return value === "true" ? "ON" : "OFF";
  }
  return value;
}

export function Config() {
  const queryClient = useQueryClient();
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const { data: configs, isLoading } = useQuery<ConfigItem[]>({
    queryKey: ["admin-config"],
    queryFn: () => api.get("/api/config"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      api.put("/api/config", [{ key, value }]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-config"] });
      setEdits((prev) => {
        const next = { ...prev };
        // Remove the saved key from edits
        return next;
      });
    },
  });

  const handleSave = (key: string) => {
    if (edits[key] !== undefined) {
      updateMutation.mutate({ key, value: edits[key] });
    }
  };

  const configsByKey: Record<string, ConfigItem> = {};
  if (configs) {
    for (const cfg of configs) {
      configsByKey[cfg.key] = cfg;
    }
  }

  const totalChanges = Object.keys(edits).filter(
    (k) => edits[k] !== undefined && configsByKey[k] && edits[k] !== configsByKey[k].value
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-6 border-b border-border flex items-center justify-between max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary">System Configuration</h1>
          <p className="text-xs text-text-secondary mt-1">
            Edit dynamic runtime parameters without redeployment.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {totalChanges > 0 && (
            <>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                {totalChanges} unsaved change{totalChanges > 1 ? "s" : ""}
              </span>
              <NeonButton onClick={() => setEdits({})} variant="ghost" size="sm">
                Discard All
              </NeonButton>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="w-7 h-7 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4 max-w-7xl mx-auto">
          {CATEGORIES.map((cat) => {
            const isCollapsed = collapsed[cat.id];
            const catEdits = cat.keys.filter(
              (k) => edits[k] !== undefined && configsByKey[k] && edits[k] !== configsByKey[k].value
            ).length;

            return (
              <GlassPanel key={cat.id} className="overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => setCollapsed((prev) => ({ ...prev, [cat.id]: !prev[cat.id] }))}
                  className="w-full flex items-center justify-between gap-3 -mx-1 px-1 py-1 rounded hover:bg-bg-surface/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("shrink-0", cat.color)}>
                      {cat.icon}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-text-primary">{cat.label}</h3>
                        {catEdits > 0 && (
                          <span className="text-[9px] text-amber-400 font-bold bg-amber-950/40 px-1.5 py-0.5 rounded">
                            {catEdits} unsaved
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-text-muted mt-0.5">{cat.description}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-text-muted">
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {/* Config Items Grid */}
                {!isCollapsed && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cat.keys.map((key) => {
                      const cfg = configsByKey[key];
                      if (!cfg) return null;
                      const isDirty =
                        edits[key] !== undefined && edits[key] !== cfg.value;
                      const displayValue = formatValue(key, edits[key] ?? cfg.value);

                      return (
                        <div
                          key={key}
                          className={cn(
                            "p-4 rounded-lg border transition-colors",
                            isDirty
                              ? "border-amber-500/40 bg-amber-950/10"
                              : "border-border/40 bg-bg-surface/20"
                          )}
                        >
                          {/* Label + description */}
                          <div className="flex items-start gap-2 mb-3">
                            <p className="text-xs font-bold text-text-primary flex-1">
                              {KEY_LABELS[key] ?? key}
                              {isDirty && (
                                <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 inline-block relative -top-px" />
                              )}
                            </p>
                          </div>
                          {KEY_DESCRIPTIONS[key] && (
                            <p className="text-[10px] text-text-muted mb-3 leading-relaxed">
                              {KEY_DESCRIPTIONS[key]}
                            </p>
                          )}                          {/* Boolean toggle button */}
                          {key.includes("enabled") || key.includes("show_login") ? (
                            <button
                              onClick={() => {
                                const currentVal = edits[key] ?? cfg.value;
                                const newVal = currentVal === "true" ? "false" : "true";
                                setEdits((prev) => ({ ...prev, [key]: newVal }));
                                // Auto-save immediately for toggles
                                updateMutation.mutate({ key, value: newVal });
                              }}
                              disabled={updateMutation.isPending}
                              className={cn(
                                "w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all",
                                (edits[key] ?? cfg.value) === "true"
                                  ? "bg-green-950/30 border-green-900/50 hover:bg-green-950/50"
                                  : "bg-bg-surface border-border/40 hover:bg-bg-surface/80"
                              )}
                            >
                              <span className={cn(
                                "text-xs font-bold",
                                (edits[key] ?? cfg.value) === "true" ? "text-green-400" : "text-text-muted"
                              )}>
                                {(edits[key] ?? cfg.value) === "true" ? "ON — Active" : "OFF — Inactive"}
                              </span>
                              <div className={cn(
                                "w-10 h-5 rounded-full transition-colors relative",
                                (edits[key] ?? cfg.value) === "true" ? "bg-green-500/40" : "bg-bg-surface"
                              )}>
                                <div className={cn(
                                  "absolute top-0.5 w-4 h-4 rounded-full transition-all",
                                  (edits[key] ?? cfg.value) === "true"
                                    ? "left-[22px] bg-green-400"
                                    : "left-0.5 bg-text-muted"
                                )} />
                              </div>
                            </button>
                          ) : (
                            <>
                              {/* Current formatted value */}
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Current</span>
                                <span className="text-xs font-mono text-brand-primary font-semibold">{displayValue}</span>
                              </div>
                              {/* Input + Save row */}
                              <div className="flex gap-2 items-center">
                                <input
                                  type="text"
                                  value={edits[key] ?? cfg.value}
                                  onChange={(e) => setEdits((prev) => ({ ...prev, [key]: e.target.value }))}
                                  className="flex-1 min-w-0 px-3 py-1.5 rounded bg-bg-surface border border-border text-xs text-text-primary font-mono focus:outline-none focus:border-brand-primary"
                                />
                                <NeonButton
                                  onClick={() => handleSave(key)}
                                  disabled={updateMutation.isPending || edits[key] === undefined || edits[key] === cfg.value}
                                  size="sm"
                                  className="shrink-0"
                                >
                                  <Save className="w-3 h-3" />
                                </NeonButton>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </GlassPanel>
            );
          })}
        </div>
      )}
    </div>
  );
}
