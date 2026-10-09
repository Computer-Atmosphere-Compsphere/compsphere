import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getUploadUrl } from "@/lib/api";
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
  Link2,
  QrCode,
  Upload,
  Image as ImageIcon,
  Trash2,
  ExternalLink,
  Calendar,
  CalendarDays,
  Sparkles,
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
    label: "Countdown & Timeline Launch",
    description: "Control countdown timer toggles and dynamic target dates on the public landing page",
    icon: <Clock className="w-4 h-4" />,
    color: "text-cyan-400",
    keys: [
      "countdown_compsphere_enabled",
      "countdown_compsphere_date",
      "countdown_talksphere_enabled",
      "countdown_talksphere_date",
      "countdown_exposphere_enabled",
      "countdown_exposphere_date",
      "countdown_enabled",
      "countdown_hacksphere_date",
      "countdown_24h_enabled",
      "countdown_24h_end_date",
      "countdown_festsphere_enabled",
      "countdown_festsphere_date",
    ],
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
    id: "hacksphere_links",
    label: "Hacksphere Links",
    description: "Dynamic URLs shown on the Hacksphere sub-event page (Devpost, Discord, Guidebook)",
    icon: <Link2 className="w-4 h-4" />,
    color: "text-green-400",
    keys: ["hacksphere_devpost_url", "hacksphere_discord_url", "hacksphere_guidebook_url"],
  },
  {
    id: "payment",
    label: "Payment & Transfer Details",
    description: "Slot confirmation fees, Bank Transfer details, and QRIS barcode image",
    icon: <CreditCard className="w-4 h-4" />,
    color: "text-emerald-400",
    keys: [
      "payment_amount_national",
      "payment_amount_mix",
      "payment_amount_international",
      "payment_bank_name",
      "payment_bank_account_number",
      "payment_bank_account_name",
      "payment_qris_image_key",
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
    id: "scoring_phase1",
    label: "Judging Criteria: Online Evaluation",
    description: "Online Evaluation - Phase 1",
    icon: <BarChart3 className="w-4 h-4" />,
    color: "text-purple-400",
    keys: [
      "scoring_weight_technical",
      "scoring_weight_problem",
      "scoring_weight_innovation",
      "scoring_weight_market",
      "scoring_weight_document",
    ],
  },
  {
    id: "scoring_phase2",
    label: "Judging Criteria: Live Evaluation",
    description: "Live Evaluation - Phase 2",
    icon: <BarChart3 className="w-4 h-4" />,
    color: "text-indigo-400",
    keys: [
      "scoring_weight_p2_mvp",
      "scoring_weight_p2_impact",
      "scoring_weight_p2_creative",
      "scoring_weight_p2_pitch",
    ],
  },
  {
    id: "scoring_limits",
    label: "Scoring Range & Limits",
    description: "Batas nilai minimum dan maksimum yang dapat diberikan juri",
    icon: <Settings className="w-4 h-4" />,
    color: "text-fuchsia-400",
    keys: [
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
  payment_bank_name: "Bank Name",
  payment_bank_account_number: "Account Number (No Rekening)",
  payment_bank_account_name: "Account Holder Name (Atas Nama)",
  payment_qris_image_key: "QRIS Image Upload",
  top30_total_slots: "Total Slots",
  allocation_national_mix_ratio: "National + Mix Ratio",
  allocation_international_ratio: "International Ratio",
  max_team_members: "Max Team Members",

  // Phase 1 Judging Criteria
  scoring_weight_technical: "Technical Architecture & Feasibility (30%)",
  scoring_weight_problem: "Problem Relevance & Solution Fit (20%)",
  scoring_weight_innovation: "Innovation & Value Proposition (25%)",
  scoring_weight_market: "Market & Impact Viability (15%)",
  scoring_weight_document: "Document Clarity & Structure (10%)",

  // Phase 2 Judging Criteria
  scoring_weight_p2_mvp: "Functional MVP & Live Demo (35%)",
  scoring_weight_p2_impact: "Problem-Solution Fit & Public Impact (30%)",
  scoring_weight_p2_creative: "Creative Tech-Implementation (20%)",
  scoring_weight_p2_pitch: "Pitching & Q&A Defense (15%)",

  score_min: "Min Score Limit",
  score_max: "Max Score Limit",

  // Countdown Toggles & Dates
  countdown_compsphere_enabled: "Compsphere Countdown (Active/Off)",
  countdown_compsphere_date: "Compsphere Target Date (ISO 8601)",
  countdown_talksphere_enabled: "TalkSphere Countdown (Active/Off)",
  countdown_talksphere_date: "TalkSphere Target Date (ISO 8601)",
  countdown_exposphere_enabled: "ExpoSphere Countdown (Active/Off)",
  countdown_exposphere_date: "ExpoSphere Target Date (ISO 8601)",
  countdown_enabled: "Hacksphere Countdown (Active/Off)",
  countdown_hacksphere_date: "Hacksphere Target Date (ISO 8601)",
  countdown_24h_enabled: "24-Hour Hackathon Countdown (Active/Off)",
  countdown_24h_end_date: "24-Hour End Target Date (ISO 8601)",
  countdown_festsphere_enabled: "FestSphere Countdown (Active/Off)",
  countdown_festsphere_date: "FestSphere Target Date (ISO 8601)",

  battle_royale_enabled: "Battle Royale",
  show_login_buttons: "Show Login & Register",
  hacksphere_devpost_url: "Devpost URL",
  hacksphere_discord_url: "Discord URL",
  hacksphere_guidebook_url: "Guidebook & Proposal URL",
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
  payment_bank_name: "Name of target bank (e.g. BCA, Bank Mandiri, SeaBank)",
  payment_bank_account_number: "Target bank account number for registration fee transfer",
  payment_bank_account_name: "Registered account holder or organization name",
  payment_qris_image_key: "Upload and manage the official QRIS barcode image for participant scanning",
  top30_total_slots: "Number of confirmed Top 30 slots available",
  allocation_national_mix_ratio: "Proportion of slots allocated to National + Mix teams (0-1)",
  allocation_international_ratio: "Proportion of slots allocated to International teams (0-1)",
  max_team_members: "Maximum number of members per team",

  // Phase 1 Descriptions
  scoring_weight_technical: "Evaluates the logic of the system architecture, the suitability of the chosen tech stack, and the practical feasibility of the system design to be fully executed into a working MVP within a 24-hour timeframe.",
  scoring_weight_problem: "Evaluates the extent to which the addressed problem is real, urgent, and validated by supporting data, as well as whether the proposed solution logically and effectively solves the problem.",
  scoring_weight_innovation: "Evaluates the level of idea originality, novelty, technological innovation, and the unique selling proposition.",
  scoring_weight_market: "Potential real-world impact of the solution within the ecosystem, the clarity of the target market, its long-term sustainability, and the scalability level of the application.",
  scoring_weight_document: "Evaluates the clarity, completeness, neatness, logical flow of thought, and strict adherence to the mandatory proposal anatomy format.",

  // Phase 2 Descriptions
  scoring_weight_p2_mvp: "Evaluates the stability and functionality of the product. Teams that successfully achieve a Live Deployment (e.g., Cloud, Testnet, Web3 Public network) will receive higher consideration points compared to teams that only demonstrate their product via Localhost.",
  scoring_weight_p2_impact: "Ensures the proposed solution is effective, highly relevant to real-world problems, and possesses significant potential for public impact and large-scale adoption within society.",
  scoring_weight_p2_creative: "Tests the team's agility and technical creativity in seamlessly integrating cutting-edge technologies (such as Web3, AI, IoT, etc.) within the strict constraints of the 24-hour marathon timeframe.",
  scoring_weight_p2_pitch: "Evaluates the fluency of the idea delivery (Slides & Live Demo), team coordination during the presentation, and the sharpness of logical arguments provided during the Q&A session with the judging panel.",

  score_min: "Minimum score a judge can give (default 1)",
  score_max: "Maximum score a judge can give (default 100)",

  countdown_compsphere_enabled: "Show countdown to Compsphere opening on the landing page",
  countdown_compsphere_date: "Target start date & time for Compsphere opening (e.g. 2026-10-05T08:00:00+07:00)",
  countdown_talksphere_enabled: "Show countdown to TalkSphere on the landing page",
  countdown_talksphere_date: "Target start date & time for TalkSphere session (e.g. 2026-10-07T08:00:00+07:00)",
  countdown_exposphere_enabled: "Show countdown to ExpoSphere (Oct 30) on the landing page",
  countdown_exposphere_date: "Target start date & time for ExpoSphere (e.g. 2026-10-30T08:00:00+07:00)",
  countdown_enabled: "Show countdown to Hacksphere on the landing page",
  countdown_hacksphere_date: "Target start date & time for Hacksphere main event (e.g. 2026-11-21T08:00:00+07:00)",
  countdown_24h_enabled: "Show 24-hour hackathon timer on the landing page",
  countdown_24h_end_date: "Target end date & time for 24-hour hackathon marathon (e.g. 2026-11-22T09:00:00+07:00)",
  countdown_festsphere_enabled: "Show countdown to FestSphere on the landing page",
  countdown_festsphere_date: "Target start date & time for FestSphere closing celebration (e.g. 2026-11-22T14:00:00+07:00)",

  battle_royale_enabled: "Enable Battle Royale slot claiming for waitlisted teams (true/false)",
  show_login_buttons: "Show the Login and Register buttons on the landing page. When disabled, buttons are hidden and a discreet login link appears in the footer.",
  hacksphere_devpost_url: "Full URL to the Hacksphere Devpost registration page (e.g. https://hacksphere2026.devpost.com). Leave empty to show Coming Soon.",
  hacksphere_discord_url: "Full URL to the official Compsphere Discord server invite (e.g. https://discord.gg/xxx). Leave empty to show Coming Soon.",
  hacksphere_guidebook_url: "Full URL to the Google Drive folder/file containing the Hacksphere Guidebook and Proposal Template. Leave empty to show Coming Soon.",
};

/** Format value for display */
function formatValue(key: string, value: string): string {
  if (KEY_LABELS[key]?.includes("Fee")) {
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

/** Convert ISO 8601 string to YYYY-MM-DDTHH:mm for datetime-local input */
function isoToDatetimeLocal(isoStr?: string): string {
  if (!isoStr) return "";
  try {
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = date.getDate();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return "";
  }
}

/** Convert YYYY-MM-DDTHH:mm from datetime-local input to full ISO string with timezone offset */
function datetimeLocalToIso(localStr: string): string {
  if (!localStr) return "";
  try {
    const date = new Date(localStr);
    if (isNaN(date.getTime())) return "";
    const offsetMinutes = -date.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? "+" : "-";
    const pad = (n: number) => String(Math.abs(n)).padStart(2, "0");
    const offsetHours = pad(Math.floor(Math.abs(offsetMinutes) / 60));
    const offsetMins = pad(Math.abs(offsetMinutes) % 60);
    const offsetStr = `${sign}${offsetHours}:${offsetMins}`;

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = date.getDate();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = "00";

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetStr}`;
  } catch {
    return localStr;
  }
}

/** Format ISO timestamp to easy-to-read date & time string */
function formatHumanDateTime(isoStr?: string): string {
  if (!isoStr) return "-";
  try {
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return isoStr;
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return isoStr;
  }
}

interface CountdownGroup {
  id: string;
  name: string;
  badge: string;
  description: string;
  toggleKey: string;
  dateKey: string;
}

const COUNTDOWN_GROUPS: CountdownGroup[] = [
  {
    id: "compsphere",
    name: "Compsphere Opening",
    badge: "October 5, 2026",
    description: "Countdown timer to Compsphere official opening on the landing page",
    toggleKey: "countdown_compsphere_enabled",
    dateKey: "countdown_compsphere_date",
  },
  {
    id: "talksphere",
    name: "TalkSphere",
    badge: "October 7, 2026",
    description: "Countdown timer to TalkSphere seminars and tech talk sessions",
    toggleKey: "countdown_talksphere_enabled",
    dateKey: "countdown_talksphere_date",
  },
  {
    id: "exposphere",
    name: "ExpoSphere",
    badge: "October 30 to November 8, 2026",
    description: "Countdown timer to ExpoSphere exhibition and innovation showcase (Oct 30)",
    toggleKey: "countdown_exposphere_enabled",
    dateKey: "countdown_exposphere_date",
  },
  {
    id: "hacksphere",
    name: "HackSphere (Main Hackathon)",
    badge: "November 21, 2026",
    description: "Countdown timer to HackSphere competition day kickoff",
    toggleKey: "countdown_enabled",
    dateKey: "countdown_hacksphere_date",
  },
  {
    id: "hackathon_24h",
    name: "24-Hour Hackathon Timer",
    badge: "November 21 to 22, 2026",
    description: "Live 24-hour sprint timer until final project submission deadline",
    toggleKey: "countdown_24h_enabled",
    dateKey: "countdown_24h_end_date",
  },
  {
    id: "festsphere",
    name: "FestSphere",
    badge: "November 22, 2026",
    description: "Countdown timer to FestSphere awarding night and closing celebration",
    toggleKey: "countdown_festsphere_enabled",
    dateKey: "countdown_festsphere_date",
  },
];

export function Config() {
  const queryClient = useQueryClient();
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [qrisUploadError, setQrisUploadError] = useState<string | null>(null);
  const qrisFileInputRef = useRef<HTMLInputElement>(null);

  const { data: configs, isLoading } = useQuery<ConfigItem[]>({
    queryKey: ["admin-config"],
    queryFn: () => api.get("/api/config"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      api.put("/api/config", [{ key, value }]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-config"] });
      queryClient.invalidateQueries({ queryKey: ["public-config"] });
    },
  });

  const qrisUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("qris", file);
      return api.post<{ success: boolean; data: { storageKey: string; url: string } }>(
        "/api/config/upload-qris",
        formData
      );
    },
    onSuccess: () => {
      setQrisUploadError(null);
      queryClient.invalidateQueries({ queryKey: ["admin-config"] });
      queryClient.invalidateQueries({ queryKey: ["public-config"] });
    },
    onError: (err: any) => {
      setQrisUploadError(err.message || "Failed to upload QRIS image.");
    },
  });

  const handleSave = (key: string) => {
    if (edits[key] !== undefined) {
      updateMutation.mutate({ key, value: edits[key] });
    }
  };

  const handleQrisFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      qrisUploadMutation.mutate(file);
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
                  <div>
                    {cat.id === "countdown" ? (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {COUNTDOWN_GROUPS.map((group) => {
                          const toggleCfg = configsByKey[group.toggleKey] ?? { key: group.toggleKey, value: "false" };
                          const dateCfg = configsByKey[group.dateKey] ?? { key: group.dateKey, value: "" };

                          const currentToggle = edits[group.toggleKey] ?? toggleCfg.value;
                          const currentDate = edits[group.dateKey] ?? dateCfg.value;

                          const isToggleActive = currentToggle === "true";
                          const isDateDirty = edits[group.dateKey] !== undefined && edits[group.dateKey] !== dateCfg.value;

                          return (
                            <div
                              key={group.id}
                              className={cn(
                                "p-5 rounded-xl border transition-all flex flex-col justify-between",
                                isToggleActive
                                  ? "border-brand-primary/40 bg-brand-dim/10 shadow-lg shadow-brand-primary/5"
                                  : "border-border/50 bg-bg-surface/30 opacity-90"
                              )}
                            >
                              <div>
                                {/* Event Header */}
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <div>
                                    <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                                      {group.name}
                                    </h4>
                                    <span className="inline-block text-[10px] font-semibold text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-2 py-0.5 rounded-full mt-1">
                                      {group.badge}
                                    </span>
                                  </div>
                                  <div className="shrink-0">
                                    <span
                                      className={cn(
                                        "text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider",
                                        isToggleActive
                                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                          : "bg-bg-surface text-text-muted border border-border"
                                      )}
                                    >
                                      {isToggleActive ? "Live ON" : "OFF"}
                                    </span>
                                  </div>
                                </div>

                                <p className="text-[11px] text-text-muted mb-4 leading-relaxed">
                                  {group.description}
                                </p>

                                {/* Toggle Switch */}
                                <div className="mb-4 pt-3 border-t border-border/40">
                                  <label className="text-[11px] font-semibold text-text-secondary block mb-1.5">
                                    Landing Page Visibility:
                                  </label>
                                  <button
                                    onClick={() => {
                                      const newVal = isToggleActive ? "false" : "true";
                                      setEdits((prev) => ({ ...prev, [group.toggleKey]: newVal }));
                                      updateMutation.mutate({ key: group.toggleKey, value: newVal });
                                    }}
                                    disabled={updateMutation.isPending}
                                    className={cn(
                                      "w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border transition-all",
                                      isToggleActive
                                        ? "bg-green-950/40 border-green-800/60 hover:bg-green-950/60"
                                        : "bg-bg-surface border-border/50 hover:bg-bg-surface/80"
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        "text-xs font-bold",
                                        isToggleActive ? "text-green-400" : "text-text-muted"
                                      )}
                                    >
                                      {isToggleActive ? "Active (Visible)" : "Inactive (Hidden)"}
                                    </span>
                                    <div
                                      className={cn(
                                        "w-9 h-5 rounded-full transition-colors relative",
                                        isToggleActive ? "bg-green-500/40" : "bg-border/60"
                                      )}
                                    >
                                      <div
                                        className={cn(
                                          "absolute top-0.5 w-4 h-4 rounded-full transition-all",
                                          isToggleActive
                                            ? "left-[18px] bg-green-400 shadow-sm shadow-green-400/50"
                                            : "left-0.5 bg-text-muted"
                                        )}
                                      />
                                    </div>
                                  </button>
                                </div>

                                {/* Date & Time Picker */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-semibold text-text-secondary flex items-center gap-1.5">
                                      <Calendar className="w-3.5 h-3.5 text-brand-primary" />
                                      Target Date & Time:
                                    </label>
                                    {isDateDirty && (
                                      <span className="text-[9px] text-amber-400 font-bold bg-amber-950/50 px-1.5 py-0.5 rounded">
                                        Unsaved
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex gap-2 items-center">
                                    <input
                                      type="datetime-local"
                                      value={isoToDatetimeLocal(currentDate)}
                                      onChange={(e) => {
                                        const iso = datetimeLocalToIso(e.target.value);
                                        setEdits((prev) => ({ ...prev, [group.dateKey]: iso }));
                                      }}
                                      className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-bg-surface border border-border text-xs text-text-primary font-mono focus:outline-none focus:border-brand-primary [color-scheme:dark]"
                                    />
                                    <NeonButton
                                      onClick={() => handleSave(group.dateKey)}
                                      disabled={updateMutation.isPending || !isDateDirty}
                                      size="sm"
                                      className="shrink-0 h-9 px-3"
                                    >
                                      <Save className="w-3.5 h-3.5 mr-1" />
                                      Save
                                    </NeonButton>
                                  </div>

                                  {/* Formatted Date Preview */}
                                  <div className="p-2 rounded-lg bg-bg-surface/50 border border-border/30 text-[10px] text-text-muted flex items-center justify-between">
                                    <span className="truncate">
                                      {formatHumanDateTime(currentDate)}
                                    </span>
                                    <span className="font-mono text-[9px] text-brand-primary/80 shrink-0 ml-1">
                                      WIB (+07:00)
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {cat.keys.map((key) => {
                          const cfg = configsByKey[key];
                          // Fallback for newly added keys before seeding
                          const fallback = { key, value: "", type: "STRING", updatedAt: undefined };
                          const effectiveCfg = cfg ?? fallback;
                          const isDirty =
                            edits[key] !== undefined && edits[key] !== effectiveCfg.value;
                          const displayValue = formatValue(key, edits[key] ?? effectiveCfg.value);

                          // Special Handler: QRIS Image Upload Card
                          if (key === "payment_qris_image_key") {
                            const currentKey = effectiveCfg.value;
                            const hasQris = Boolean(currentKey && currentKey.trim().length > 0);
                            const qrisUrl = hasQris ? getUploadUrl(currentKey) : null;

                            return (
                              <div
                                key={key}
                                className={cn(
                                  "p-4 rounded-lg border transition-colors md:col-span-2 lg:col-span-3",
                                  "border-brand-primary/20 bg-brand-dim/5"
                                )}
                              >
                                <div className="flex items-start justify-between gap-4 mb-3">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <QrCode className="w-4 h-4 text-brand-primary" />
                                      <p className="text-xs font-bold text-text-primary">
                                        {KEY_LABELS[key]}
                                      </p>
                                    </div>
                                    <p className="text-[10px] text-text-muted mt-1">
                                      {KEY_DESCRIPTIONS[key]}
                                    </p>
                                  </div>
                                  {hasQris && (
                                    <button
                                      onClick={() => updateMutation.mutate({ key, value: "" })}
                                      disabled={updateMutation.isPending}
                                      className="inline-flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 font-semibold px-2 py-1 rounded bg-red-950/20 border border-red-900/40"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      Remove QRIS
                                    </button>
                                  )}
                                </div>

                                {qrisUploadError && (
                                  <p className="text-xs text-red-400 mb-3">{qrisUploadError}</p>
                                )}

                                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-lg bg-bg-surface/40 border border-border/40">
                                  {hasQris && qrisUrl ? (
                                    <div className="relative group shrink-0">
                                      <div className="w-32 h-32 rounded-xl bg-white p-2 flex items-center justify-center border border-white/20 shadow-md">
                                        <img
                                          src={qrisUrl}
                                          alt="QRIS Preview"
                                          className="w-full h-full object-contain rounded-lg"
                                        />
                                      </div>
                                      <a
                                        href={qrisUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 text-xs text-brand-primary font-semibold transition-opacity backdrop-blur-xs"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        View Full
                                      </a>
                                    </div>
                                  ) : (
                                    <div className="w-32 h-32 rounded-xl border-2 border-dashed border-border/60 bg-bg-surface flex flex-col items-center justify-center gap-2 text-text-muted shrink-0">
                                      <ImageIcon className="w-8 h-8 opacity-40" />
                                      <span className="text-[10px] font-semibold">No QRIS Image</span>
                                    </div>
                                  )}

                                  <div className="space-y-3 flex-1 text-center sm:text-left">
                                    <div>
                                      <p className="text-xs font-semibold text-text-primary">
                                        {hasQris ? "Replace QRIS Barcode" : "Upload Official QRIS Barcode"}
                                      </p>
                                      <p className="text-[10px] text-text-muted mt-0.5">
                                        PNG, JPG, or WEBP up to 5MB. This QRIS will be shown directly to participants on their payment dashboard.
                                      </p>
                                    </div>

                                    <input
                                      type="file"
                                      ref={qrisFileInputRef}
                                      onChange={handleQrisFileChange}
                                      accept="image/png,image/jpeg,image/webp"
                                      className="hidden"
                                    />

                                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                                      <NeonButton
                                        type="button"
                                        size="sm"
                                        onClick={() => qrisFileInputRef.current?.click()}
                                        disabled={qrisUploadMutation.isPending}
                                      >
                                        <Upload className="w-3.5 h-3.5 mr-1.5" />
                                        {qrisUploadMutation.isPending
                                          ? "Uploading to Server..."
                                          : hasQris
                                          ? "Upload New Image"
                                          : "Select Image to Upload"}
                                      </NeonButton>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          const isDateField = key.includes("deadline") || key.includes("date");

                          return (
                            <div
                              key={key}
                              className={cn(
                                "p-4 rounded-lg border transition-colors flex flex-col justify-between",
                                isDirty
                                  ? "border-amber-500/40 bg-amber-950/10"
                                  : "border-border/40 bg-bg-surface/20"
                              )}
                            >
                              <div>
                                {/* Label + description */}
                                <div className="flex items-start gap-2 mb-2">
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
                                )}
                              </div>

                              <div>
                                {/* Boolean toggle button */}
                                {key.includes("enabled") || key.includes("show_login") ? (
                                  <button
                                    onClick={() => {
                                      const currentVal = edits[key] ?? effectiveCfg.value;
                                      const newVal = currentVal === "true" ? "false" : "true";
                                      setEdits((prev) => ({ ...prev, [key]: newVal }));
                                      // Auto-save immediately for toggles
                                      updateMutation.mutate({ key, value: newVal });
                                    }}
                                    disabled={updateMutation.isPending}
                                    className={cn(
                                      "w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all",
                                      (edits[key] ?? effectiveCfg.value) === "true"
                                        ? "bg-green-950/30 border-green-900/50 hover:bg-green-950/50"
                                        : "bg-bg-surface border-border/40 hover:bg-bg-surface/80"
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        "text-xs font-bold",
                                        (edits[key] ?? effectiveCfg.value) === "true" ? "text-green-400" : "text-text-muted"
                                      )}
                                    >
                                      {(edits[key] ?? effectiveCfg.value) === "true" ? "Active" : "Inactive"}
                                    </span>
                                    <div
                                      className={cn(
                                        "w-10 h-5 rounded-full transition-colors relative",
                                        (edits[key] ?? effectiveCfg.value) === "true" ? "bg-green-500/40" : "bg-bg-surface"
                                      )}
                                    >
                                      <div
                                        className={cn(
                                          "absolute top-0.5 w-4 h-4 rounded-full transition-all",
                                          (edits[key] ?? effectiveCfg.value) === "true"
                                            ? "left-[22px] bg-green-400"
                                            : "left-0.5 bg-text-muted"
                                        )}
                                      />
                                    </div>
                                  </button>
                                ) : isDateField ? (
                                  <div className="space-y-2">
                                    <div className="flex gap-2 items-center">
                                      <input
                                        type="datetime-local"
                                        value={isoToDatetimeLocal(edits[key] ?? effectiveCfg.value)}
                                        onChange={(e) => {
                                          const iso = datetimeLocalToIso(e.target.value);
                                          setEdits((prev) => ({ ...prev, [key]: iso }));
                                        }}
                                        className="flex-1 min-w-0 px-3 py-1.5 rounded bg-bg-surface border border-border text-xs text-text-primary font-mono focus:outline-none focus:border-brand-primary [color-scheme:dark]"
                                      />
                                      <NeonButton
                                        onClick={() => handleSave(key)}
                                        disabled={updateMutation.isPending || edits[key] === undefined || edits[key] === effectiveCfg.value}
                                        size="sm"
                                        className="shrink-0"
                                      >
                                        <Save className="w-3 h-3" />
                                      </NeonButton>
                                    </div>
                                    <div className="p-1.5 rounded bg-bg-surface/50 border border-border/30 text-[10px] text-text-muted flex items-center justify-between">
                                      <span className="truncate">
                                        {formatHumanDateTime(edits[key] ?? effectiveCfg.value)}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    {/* Current formatted value */}
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Current</span>
                                      <span className="text-xs font-mono text-brand-primary font-semibold">{displayValue || "-"}</span>
                                    </div>
                                    {/* Input + Save row */}
                                    <div className="flex gap-2 items-center">
                                      <input
                                        type="text"
                                        value={edits[key] ?? effectiveCfg.value}
                                        onChange={(e) => setEdits((prev) => ({ ...prev, [key]: e.target.value }))}
                                        className="flex-1 min-w-0 px-3 py-1.5 rounded bg-bg-surface border border-border text-xs text-text-primary font-mono focus:outline-none focus:border-brand-primary"
                                      />
                                      <NeonButton
                                        onClick={() => handleSave(key)}
                                        disabled={updateMutation.isPending || edits[key] === undefined || edits[key] === effectiveCfg.value}
                                        size="sm"
                                        className="shrink-0"
                                      >
                                        <Save className="w-3 h-3" />
                                      </NeonButton>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
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

