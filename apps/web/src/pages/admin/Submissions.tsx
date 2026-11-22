import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, getUploadUrl } from "@/lib/api";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { NeonButton } from "@/components/compsphere/NeonButton";
import { StatusBadge } from "@/components/compsphere/StatusBadge";
import {
  Code2,
  Github,
  Globe,
  FileText,
  Presentation,
  Download,
  ExternalLink,
  Copy,
  Check,
  Search,
  Filter,
  RefreshCw,
  FolderGit2,
  Clock,
  Lock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  X,
  Eye,
  Users,
  Layers,
  FileDown,
  Mail,
  UserCheck,
  Sparkles,
  Maximize2,
  ArrowUpDown,
  FileCode2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeamStatus } from "@compsphere/types";

interface SubmissionItem {
  id: string;
  teamId: string;
  repositoryUrl: string;
  deploymentUrl: string | null;
  slideStorageKey: string | null;
  slideFilename: string | null;
  slideSizeBytes: number | null;
  submittedAt: string;
  status: string;
  slideUrl: string | null;
  team: {
    id: string;
    teamCode: string;
    teamName: string;
    category: string;
    countryMix: string | null;
    originalRank: number;
    status: TeamStatus;
  } | null;
  proposal: {
    id: string;
    title: string;
    description: string | null;
    devpostUrl: string | null;
    files: Array<{
      id: string;
      originalFilename: string;
      storageKey: string;
      sizeBytes: number;
    }>;
  } | null;
  leader: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  members: Array<{
    id: string;
    role: string;
    status: string;
    user: {
      id: string;
      fullName: string;
      email: string;
      avatarUrl: string | null;
    } | null;
  }>;
}

interface MissingTeam {
  teamId: string;
  teamCode: string;
  teamName: string;
  category: string;
  countryMix: string | null;
  status: TeamStatus;
  leader: {
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  proposalTitle: string | null;
  memberCount: number;
}

interface SubmissionMetrics {
  totalSubmissions: number;
  totalEligible: number;
  submissionRate: number;
  withRepository: number;
  withDeployment: number;
  withSlide: number;
  completeDeliverables: number;
  missingCount: number;
  deadline: string;
  isExpired: boolean;
}

export function Submissions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"SUBMISSIONS" | "MISSING" | "ALL_ELIGIBLE">("SUBMISSIONS");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [completenessFilter, setCompletenessFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"NEWEST" | "OLDEST" | "CODE_ASC" | "NAME_ASC">("NEWEST");
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionItem | null>(null);
  const [previewSlide, setPreviewSlide] = useState<{ url: string; title: string; filename: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (previewSlide) setPreviewSlide(null);
        else if (selectedSubmission) setSelectedSubmission(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewSlide, selectedSubmission]);

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (selectedSubmission || previewSlide) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedSubmission, previewSlide]);

  const { data: responseData, isLoading, isFetching, refetch } = useQuery<any>({
    queryKey: ["admin-submissions"],
    queryFn: () => api.get("/api/admin/submissions"),
    refetchInterval: 30_000,
  });

  // Handle both array fallback and structured object
  const submissions: SubmissionItem[] = useMemo(() => {
    if (!responseData) return [];
    if (Array.isArray(responseData)) return responseData;
    return responseData.submissions ?? [];
  }, [responseData]);

  const missingTeams: MissingTeam[] = useMemo(() => {
    if (!responseData || Array.isArray(responseData)) return [];
    return responseData.missingTeams ?? [];
  }, [responseData]);

  const metrics: SubmissionMetrics = useMemo(() => {
    if (responseData && !Array.isArray(responseData) && responseData.metrics) {
      return responseData.metrics;
    }
    const totalSub = submissions.length;
    const withRepo = submissions.filter((s) => !!s.repositoryUrl?.trim()).length;
    const withDep = submissions.filter((s) => !!s.deploymentUrl?.trim()).length;
    const withSli = submissions.filter((s) => !!s.slideStorageKey).length;
    const comp = submissions.filter((s) => !!s.repositoryUrl?.trim() && !!s.deploymentUrl?.trim() && !!s.slideStorageKey).length;
    return {
      totalSubmissions: totalSub,
      totalEligible: totalSub + missingTeams.length,
      submissionRate: totalSub + missingTeams.length > 0 ? Math.round((totalSub / (totalSub + missingTeams.length)) * 100) : 0,
      withRepository: withRepo,
      withDeployment: withDep,
      withSlide: withSli,
      completeDeliverables: comp,
      missingCount: missingTeams.length,
      deadline: "2026-10-11T10:00:00+07:00",
      isExpired: false,
    };
  }, [responseData, submissions, missingTeams]);

  // Copy helper
  const handleCopy = (text: string, key: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 2000);
  };

  // Format date and relative time
  const formatDateTime = (iso: string | null | undefined) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRelativeTime = (iso: string | null | undefined) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes || bytes <= 0) return "-";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getCategoryBadgeClass = (category: string | undefined) => {
    switch (category) {
      case "NATIONAL":
        return "bg-sky-950/40 text-sky-400 border-sky-900/50";
      case "MIX":
        return "bg-amber-950/40 text-amber-400 border-amber-900/50";
      case "INTERNATIONAL":
        return "bg-purple-950/40 text-purple-400 border-purple-900/50";
      default:
        return "bg-bg-surface text-text-secondary border-border";
    }
  };

  // Export submissions to CSV
  const handleExportCSV = () => {
    if (submissions.length === 0) return;
    const headers = [
      "Team Code",
      "Team Name",
      "Category",
      "Status",
      "Project Title",
      "Repository URL",
      "Deployment URL",
      "Slide Filename",
      "Slide Size",
      "Submitted At",
      "Leader Name",
      "Leader Email",
    ];

    const rows = submissions.map((s) => [
      `"${s.team?.teamCode || ""}"`,
      `"${(s.team?.teamName || "").replace(/"/g, '""')}"`,
      `"${s.team?.category || ""}"`,
      `"${s.status || ""}"`,
      `"${(s.proposal?.title || "").replace(/"/g, '""')}"`,
      `"${s.repositoryUrl || ""}"`,
      `"${s.deploymentUrl || ""}"`,
      `"${(s.slideFilename || "").replace(/"/g, '""')}"`,
      `"${formatFileSize(s.slideSizeBytes)}"`,
      `"${s.submittedAt || ""}"`,
      `"${(s.leader?.fullName || "").replace(/"/g, '""')}"`,
      `"${s.leader?.email || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `compsphere-submissions-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered & sorted submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        (s.team?.teamName || "").toLowerCase().includes(q) ||
        (s.team?.teamCode || "").toLowerCase().includes(q) ||
        (s.proposal?.title || "").toLowerCase().includes(q) ||
        (s.repositoryUrl || "").toLowerCase().includes(q) ||
        (s.deploymentUrl || "").toLowerCase().includes(q) ||
        (s.leader?.fullName || "").toLowerCase().includes(q);

      const matchCategory = categoryFilter === "ALL" || s.team?.category === categoryFilter;

      let matchCompleteness = true;
      const hasRepo = !!s.repositoryUrl?.trim();
      const hasDemo = !!s.deploymentUrl?.trim();
      const hasSlide = !!s.slideStorageKey;

      if (completenessFilter === "COMPLETE") {
        matchCompleteness = hasRepo && hasDemo && hasSlide;
      } else if (completenessFilter === "HAS_REPO") {
        matchCompleteness = hasRepo;
      } else if (completenessFilter === "HAS_DEMO") {
        matchCompleteness = hasDemo;
      } else if (completenessFilter === "HAS_SLIDE") {
        matchCompleteness = hasSlide;
      } else if (completenessFilter === "MISSING_DEMO") {
        matchCompleteness = !hasDemo;
      } else if (completenessFilter === "MISSING_SLIDE") {
        matchCompleteness = !hasSlide;
      }

      return matchSearch && matchCategory && matchCompleteness;
    }).sort((a, b) => {
      if (sortBy === "NEWEST") {
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      }
      if (sortBy === "OLDEST") {
        return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      }
      if (sortBy === "CODE_ASC") {
        return (a.team?.teamCode || "").localeCompare(b.team?.teamCode || "");
      }
      if (sortBy === "NAME_ASC") {
        return (a.team?.teamName || "").localeCompare(b.team?.teamName || "");
      }
      return 0;
    });
  }, [submissions, searchTerm, categoryFilter, completenessFilter, sortBy]);

  // Filtered missing teams
  const filteredMissingTeams = useMemo(() => {
    return missingTeams.filter((t) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        t.teamName.toLowerCase().includes(q) ||
        t.teamCode.toLowerCase().includes(q) ||
        (t.proposalTitle || "").toLowerCase().includes(q) ||
        (t.leader?.name || "").toLowerCase().includes(q) ||
        (t.leader?.email || "").toLowerCase().includes(q);

      const matchCategory = categoryFilter === "ALL" || t.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [missingTeams, searchTerm, categoryFilter]);

  const hasActiveFilters = searchTerm !== "" || categoryFilter !== "ALL" || completenessFilter !== "ALL" || sortBy !== "NEWEST";

  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("ALL");
    setCompletenessFilter("ALL");
    setSortBy("NEWEST");
  };

  // Helper for slide viewer URL
  const getSlideViewerUrl = (url: string | null | undefined, filename: string | null | undefined) => {
    if (!url) return null;
    const isPpt = !!filename?.toLowerCase().match(/\.(ppt|pptx)$/);
    if (isPpt) {
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
    }
    return url;
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="pb-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary">
                Deliverables & Submissions
              </h1>
              <p className="text-xs text-text-secondary mt-0.5">
                Monitor and inspect Phase 2 deliverables: Git repositories, live demos, and presentation slide decks.
              </p>
            </div>
          </div>
        </div>

        {/* Actions & Deadline Status */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {metrics.isExpired ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-950/40 border border-red-900/50 text-red-400">
              <Lock className="w-3.5 h-3.5" />
              <span>Code Freeze Active</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-brand-dim border border-brand-primary/20 text-brand-primary">
              <Clock className="w-3.5 h-3.5" />
              <span>Submission Active</span>
            </div>
          )}

          <button
            onClick={handleExportCSV}
            disabled={submissions.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-surface border border-border text-xs font-semibold text-text-secondary hover:text-text-primary hover:border-border-hover transition disabled:opacity-40 disabled:cursor-not-allowed"
            title="Export submissions table to CSV"
          >
            <FileDown className="w-3.5 h-3.5 text-brand-primary" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 p-2 rounded-lg bg-bg-surface border border-border text-xs text-text-muted hover:text-text-primary hover:border-border-hover transition disabled:opacity-50"
            title="Refresh submissions"
          >
            <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin text-brand-primary")} />
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <GlassPanel className="p-4 space-y-2">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Submissions</span>
            <FolderGit2 className="w-4 h-4 text-brand-primary" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-mono text-text-primary">{metrics.totalSubmissions}</span>
              <span className="text-xs text-text-muted font-mono">/ {metrics.totalEligible}</span>
            </div>
            <div className="w-full bg-border/40 h-1 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-brand-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, metrics.submissionRate)}%` }}
              />
            </div>
            <p className="text-[10px] text-brand-primary font-semibold mt-1">
              {metrics.submissionRate}% turnout
            </p>
          </div>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Complete</span>
            <Sparkles className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <span className="text-2xl font-black font-mono text-green-400">{metrics.completeDeliverables}</span>
            <p className="text-[10px] text-text-muted mt-1">Repo + Demo + Slide</p>
          </div>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Repositories</span>
            <Github className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <span className="text-2xl font-black font-mono text-purple-300">{metrics.withRepository}</span>
            <p className="text-[10px] text-text-muted mt-1">Git links verified</p>
          </div>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Live Demos</span>
            <Globe className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <span className="text-2xl font-black font-mono text-emerald-400">{metrics.withDeployment}</span>
            <p className="text-[10px] text-text-muted mt-1">Deployed products</p>
          </div>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Slide Decks</span>
            <Presentation className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <span className="text-2xl font-black font-mono text-yellow-400">{metrics.withSlide}</span>
            <p className="text-[10px] text-text-muted mt-1">PDF / PPT uploads</p>
          </div>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <span className="text-2xl font-black font-mono text-amber-400">{metrics.missingCount}</span>
            <p className="text-[10px] text-text-muted mt-1">Teams not yet submitted</p>
          </div>
        </GlassPanel>
      </div>

      {/* Tabs and Filters Navigation */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-bg-surface/80 border border-border">
            <button
              onClick={() => setActiveTab("SUBMISSIONS")}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition",
                activeTab === "SUBMISSIONS"
                  ? "bg-brand-primary text-black shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Submissions</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
                  activeTab === "SUBMISSIONS" ? "bg-black/20 text-black font-black" : "bg-bg-surface text-text-muted"
                )}
              >
                {submissions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("MISSING")}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition",
                activeTab === "MISSING"
                  ? "bg-brand-primary text-black shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Missing Deliverables</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
                  activeTab === "MISSING" ? "bg-black/20 text-black font-black" : "bg-bg-surface text-text-muted"
                )}
              >
                {missingTeams.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("ALL_ELIGIBLE")}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition",
                activeTab === "ALL_ELIGIBLE"
                  ? "bg-brand-primary text-black shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              <Users className="w-3.5 h-3.5" />
              <span>All Eligible</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
                  activeTab === "ALL_ELIGIBLE" ? "bg-black/20 text-black font-black" : "bg-bg-surface text-text-muted"
                )}
              >
                {metrics.totalEligible}
              </span>
            </button>
          </div>

          {/* Quick Info */}
          <div className="text-xs text-text-muted flex items-center gap-2">
            <span>Deadline:</span>
            <span className="font-mono text-text-secondary font-semibold">
              {metrics.deadline ? formatDateTime(metrics.deadline) : "Oct 11, 2026, 10:00"}
            </span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search team, code, project title, repo, demo..."
              className="w-full pl-9 pr-8 py-2 bg-bg-surface/80 border border-border rounded-xl text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary/60 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-bg-surface/80 border border-border rounded-xl text-xs text-text-secondary focus:outline-none focus:border-brand-primary/60 transition"
          >
            <option value="ALL">All Categories</option>
            <option value="NATIONAL">National Track</option>
            <option value="MIX">Mix Track</option>
            <option value="INTERNATIONAL">International Track</option>
          </select>

          {/* Deliverables Completeness Filter (for submissions view) */}
          {activeTab !== "MISSING" && (
            <select
              value={completenessFilter}
              onChange={(e) => setCompletenessFilter(e.target.value)}
              className="px-3 py-2 bg-bg-surface/80 border border-border rounded-xl text-xs text-text-secondary focus:outline-none focus:border-brand-primary/60 transition"
            >
              <option value="ALL">All Deliverable Statuses</option>
              <option value="COMPLETE">Complete (Repo + Demo + Slide)</option>
              <option value="HAS_REPO">Has Repository</option>
              <option value="HAS_DEMO">Has Live Demo</option>
              <option value="HAS_SLIDE">Has Presentation Slide</option>
              <option value="MISSING_DEMO">Missing Live Demo</option>
              <option value="MISSING_SLIDE">Missing Slide</option>
            </select>
          )}

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-bg-surface/80 border border-border rounded-xl text-xs text-text-secondary focus:outline-none focus:border-brand-primary/60 transition"
          >
            <option value="NEWEST">Newest Submitted</option>
            <option value="OLDEST">Oldest Submitted</option>
            <option value="CODE_ASC">Team Code (A-Z)</option>
            <option value="NAME_ASC">Team Name (A-Z)</option>
          </select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-brand-primary hover:underline transition"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-3">
          <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-text-muted">Loading submissions and deliverables...</p>
        </div>
      ) : activeTab === "MISSING" ? (
        /* MISSING TEAMS TAB */
        <div>
          {filteredMissingTeams.length === 0 ? (
            <GlassPanel className="p-12 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto" />
              <p className="text-sm font-bold text-text-primary">
                {missingTeams.length === 0 ? "All verified teams have submitted!" : "No missing teams match your filter."}
              </p>
              <p className="text-xs text-text-muted">
                {missingTeams.length === 0
                  ? "Every eligible team has submitted Phase 2 deliverables."
                  : "Try loosening your search or category filter."}
              </p>
            </GlassPanel>
          ) : (
            <div className="border border-border rounded-2xl bg-bg-surface/50 overflow-hidden shadow-xl backdrop-blur-sm">
              <div className="px-5 py-3.5 border-b border-border bg-bg-surface/60 flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  Teams Pending Phase 2 Submission ({filteredMissingTeams.length})
                </span>
                <span className="text-[11px] text-text-muted">
                  These verified teams have not yet submitted required deliverables.
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-bg-surface border-b border-border font-bold uppercase text-[10px] text-text-muted tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Team</th>
                      <th className="px-4 py-3.5">Category</th>
                      <th className="px-4 py-3.5">Team Leader / Contact</th>
                      <th className="px-4 py-3.5">Phase 1 Project Title</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 text-text-secondary">
                    {filteredMissingTeams.map((team) => (
                      <tr key={team.teamId} className="hover:bg-bg-surface/40 transition">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-bg-surface border border-border text-brand-primary">
                              {team.teamCode}
                            </span>
                            <div>
                              <p className="font-bold text-text-primary">{team.teamName}</p>
                              <span className="text-[10px] text-text-muted">{team.memberCount} members</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase",
                              getCategoryBadgeClass(team.category)
                            )}
                          >
                            {team.category}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {team.leader ? (
                            <div className="space-y-0.5">
                              <p className="font-semibold text-text-primary">{team.leader.name}</p>
                              <div className="flex items-center gap-1.5 text-text-muted">
                                <a
                                  href={`mailto:${team.leader.email}`}
                                  className="text-[11px] hover:text-brand-primary truncate max-w-[180px]"
                                  title={team.leader.email}
                                >
                                  {team.leader.email}
                                </a>
                                <button
                                  onClick={(e) => handleCopy(team.leader!.email, `mail-${team.teamId}`, e)}
                                  className="text-text-muted hover:text-brand-primary"
                                  title="Copy email"
                                >
                                  {copiedKey === `mail-${team.teamId}` ? (
                                    <Check className="w-3 h-3 text-green-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-text-muted italic">No leader assigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="max-w-[240px] truncate font-medium text-text-primary" title={team.proposalTitle || "-"}>
                            {team.proposalTitle || <span className="text-text-muted italic">-</span>}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={team.status} />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link
                            to={`/admin/teams/${team.teamId}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-bg-surface border border-border text-xs font-semibold text-text-secondary hover:text-text-primary hover:border-brand-primary/40 transition"
                          >
                            <span>Team Profile</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* SUBMISSIONS TAB & ALL ELIGIBLE */
        <div className="space-y-6">
          {filteredSubmissions.length === 0 ? (
            <GlassPanel className="p-12 text-center space-y-3">
              <FolderGit2 className="w-12 h-12 text-text-muted mx-auto opacity-40" />
              <p className="text-base font-bold text-text-primary">
                {submissions.length === 0 ? "No submissions recorded" : "No submissions match your filter."}
              </p>
              <p className="text-xs text-text-secondary max-w-md mx-auto">
                {submissions.length === 0
                  ? "Phase 2 deliverables (repositories, live demo deployments, and presentation decks) will appear here once submitted by teams."
                  : "Try clearing your search query or adjusting your category/completeness filter."}
              </p>
              {hasActiveFilters && (
                <div className="pt-2">
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 rounded-lg bg-brand-primary text-black font-bold text-xs"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </GlassPanel>
          ) : (
            <div className="border border-border rounded-2xl bg-bg-surface/50 overflow-hidden shadow-xl backdrop-blur-sm">
              <div className="px-5 py-3.5 border-b border-border bg-bg-surface/60 flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-brand-primary" />
                  Recorded Deliverables ({filteredSubmissions.length})
                </span>
                <span className="text-[11px] text-text-muted">
                  Click any row or "View Details" to open full submission information & slide viewer.
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-bg-surface border-b border-border font-bold uppercase text-[10px] text-text-muted tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Team</th>
                      <th className="px-4 py-3.5">Project / Proposal</th>
                      <th className="px-4 py-3.5">Source Repository</th>
                      <th className="px-4 py-3.5">Live Demo</th>
                      <th className="px-4 py-3.5">Presentation Slide</th>
                      <th className="px-4 py-3.5">Submitted</th>
                      <th className="px-4 py-3.5">Completeness</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 text-text-secondary">
                    {filteredSubmissions.map((s) => {
                      const hasRepo = !!s.repositoryUrl?.trim();
                      const hasDemo = !!s.deploymentUrl?.trim();
                      const hasSlide = !!s.slideStorageKey;
                      const isComplete = hasRepo && hasDemo && hasSlide;

                      return (
                        <tr
                          key={s.id}
                          onClick={() => setSelectedSubmission(s)}
                          className="hover:bg-bg-surface/60 transition cursor-pointer group"
                        >
                          {/* Team Code & Name */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-bg-surface border border-border text-brand-primary group-hover:border-brand-primary/50 transition">
                                {s.team?.teamCode ?? s.teamId.slice(0, 8)}
                              </span>
                              <div>
                                <p className="font-bold text-text-primary group-hover:text-brand-primary transition">
                                  {s.team?.teamName || "Team"}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {s.team?.category && (
                                    <span
                                      className={cn(
                                        "text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase",
                                        getCategoryBadgeClass(s.team.category)
                                      )}
                                    >
                                      {s.team.category}
                                    </span>
                                  )}
                                  {s.leader && (
                                    <span className="text-[10px] text-text-muted truncate max-w-[120px]">
                                      by {s.leader.fullName}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Project Title */}
                          <td className="px-4 py-3.5 max-w-[200px]">
                            {s.proposal?.title ? (
                              <div className="truncate" title={s.proposal.title}>
                                <span className="font-semibold text-text-primary">{s.proposal.title}</span>
                              </div>
                            ) : (
                              <span className="text-text-muted italic text-[11px]">No proposal</span>
                            )}
                          </td>

                          {/* Repository */}
                          <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                            {hasRepo ? (
                              <div className="flex items-center gap-1.5">
                                <a
                                  href={s.repositoryUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-bg-surface border border-border text-[11px] font-semibold text-brand-primary hover:border-brand-primary/60 hover:underline transition max-w-[150px] truncate"
                                  title={s.repositoryUrl}
                                >
                                  <Github className="w-3 h-3 shrink-0" />
                                  <span className="truncate">Repo</span>
                                  <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
                                </a>
                                <button
                                  onClick={(e) => handleCopy(s.repositoryUrl, `repo-${s.id}`, e)}
                                  className="p-1 rounded text-text-muted hover:text-text-primary transition"
                                  title="Copy repository link"
                                >
                                  {copiedKey === `repo-${s.id}` ? (
                                    <Check className="w-3 h-3 text-green-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-text-muted italic">Missing</span>
                            )}
                          </td>

                          {/* Live Demo */}
                          <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                            {hasDemo ? (
                              <div className="flex items-center gap-1.5">
                                <a
                                  href={s.deploymentUrl!}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-bg-surface border border-border text-[11px] font-semibold text-emerald-400 hover:border-emerald-500/60 hover:underline transition max-w-[140px] truncate"
                                  title={s.deploymentUrl!}
                                >
                                  <Globe className="w-3 h-3 shrink-0" />
                                  <span className="truncate">Live Demo</span>
                                  <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
                                </a>
                                <button
                                  onClick={(e) => handleCopy(s.deploymentUrl!, `demo-${s.id}`, e)}
                                  className="p-1 rounded text-text-muted hover:text-text-primary transition"
                                  title="Copy live demo link"
                                >
                                  {copiedKey === `demo-${s.id}` ? (
                                    <Check className="w-3 h-3 text-green-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-text-muted italic">Not provided</span>
                            )}
                          </td>

                          {/* Presentation Slide */}
                          <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                            {hasSlide ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() =>
                                    setPreviewSlide({
                                      url: s.slideUrl || getUploadUrl(s.slideStorageKey),
                                      title: s.team?.teamName || "Presentation Slides",
                                      filename: s.slideFilename || "slides.pdf",
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-yellow-950/30 border border-yellow-800/40 text-[11px] font-semibold text-yellow-300 hover:border-yellow-500/60 transition max-w-[140px] truncate"
                                  title={`Preview: ${s.slideFilename}`}
                                >
                                  <Presentation className="w-3 h-3 shrink-0 text-yellow-400" />
                                  <span className="truncate">{s.slideFilename || "Slide"}</span>
                                </button>
                                {s.slideUrl && (
                                  <a
                                    href={s.slideUrl}
                                    download={s.slideFilename || `slide_${s.team?.teamCode || "deck"}`}
                                    className="p-1 rounded text-text-muted hover:text-yellow-400 transition"
                                    title="Download slide deck"
                                  >
                                    <Download className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-text-muted italic">No slide</span>
                            )}
                          </td>

                          {/* Submitted At */}
                          <td className="px-4 py-3.5">
                            <div>
                              <p className="font-mono text-text-primary text-[11px] font-medium">
                                {formatDateTime(s.submittedAt)}
                              </p>
                              <span className="text-[10px] text-text-muted">{getRelativeTime(s.submittedAt)}</span>
                            </div>
                          </td>

                          {/* Deliverables Completeness */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1">
                              <span
                                className={cn(
                                  "w-2 h-2 rounded-full",
                                  hasRepo ? "bg-purple-400" : "bg-border"
                                )}
                                title={hasRepo ? "Repository linked" : "Repository missing"}
                              />
                              <span
                                className={cn(
                                  "w-2 h-2 rounded-full",
                                  hasDemo ? "bg-emerald-400" : "bg-border"
                                )}
                                title={hasDemo ? "Live demo deployed" : "Live demo not provided"}
                              />
                              <span
                                className={cn(
                                  "w-2 h-2 rounded-full",
                                  hasSlide ? "bg-yellow-400" : "bg-border"
                                )}
                                title={hasSlide ? "Slide deck uploaded" : "Slide deck missing"}
                              />
                              <span className="text-[10px] font-mono text-text-muted ml-1">
                                {isComplete ? (
                                  <span className="text-green-400 font-bold">3/3</span>
                                ) : (
                                  `${(hasRepo ? 1 : 0) + (hasDemo ? 1 : 0) + (hasSlide ? 1 : 0)}/3`
                                )}
                              </span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedSubmission(s)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-bg-surface border border-border text-xs font-semibold text-text-secondary hover:text-text-primary hover:border-brand-primary/40 transition"
                              >
                                <Eye className="w-3.5 h-3.5 text-brand-primary" />
                                <span>Detail</span>
                              </button>
                              {s.team && (
                                <Link
                                  to={`/admin/teams/${s.team.id}`}
                                  className="p-1 rounded text-text-muted hover:text-text-primary transition"
                                  title="Open Team Admin Profile"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBMISSION DETAIL MODAL / DRAWER                                          */}
      {/* ========================================================================= */}
      {selectedSubmission &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
            onClick={() => setSelectedSubmission(null)}
          >
            <div
              className="relative w-full max-w-4xl bg-bg-surface border border-border rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 my-auto max-h-[92vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 pb-5 border-b border-border">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 rounded font-mono font-bold text-sm bg-brand-primary/10 border border-brand-primary/30 text-brand-primary">
                      {selectedSubmission.team?.teamCode || "TEAM"}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary">
                      {selectedSubmission.team?.teamName || "Submission Details"}
                    </h2>
                    {selectedSubmission.team?.category && (
                      <span
                        className={cn(
                          "text-xs font-bold px-2 py-0.5 rounded-full border uppercase",
                          getCategoryBadgeClass(selectedSubmission.team.category)
                        )}
                      >
                        {selectedSubmission.team.category}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted flex items-center gap-2">
                    <span>Submitted on: {formatDateTime(selectedSubmission.submittedAt)}</span>
                    <span>•</span>
                    <span className="text-brand-primary font-semibold">
                      {getRelativeTime(selectedSubmission.submittedAt)}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {selectedSubmission.team && (
                    <Link
                      to={`/admin/teams/${selectedSubmission.team.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-surface border border-border text-xs font-semibold text-text-secondary hover:text-text-primary hover:border-brand-primary/40 transition"
                    >
                      <span>Team Admin</span>
                      <ExternalLink className="w-3.5 h-3.5 text-brand-primary" />
                    </Link>
                  )}
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="p-1.5 rounded-lg bg-bg-surface border border-border text-text-muted hover:text-text-primary hover:border-border-hover transition"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Deliverables Overview Cards */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brand-primary" />
                  Phase 2 Deliverables
                </h3>

                <div className="grid sm:grid-cols-3 gap-3">
                  {/* Repository Box */}
                  <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-900/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Github className="w-3.5 h-3.5" /> Source Code
                      </span>
                      {selectedSubmission.repositoryUrl ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">
                          Linked
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-950/40 text-red-400">
                          Missing
                        </span>
                      )}
                    </div>
                    {selectedSubmission.repositoryUrl ? (
                      <div className="space-y-2">
                        <p className="text-xs font-mono text-purple-200 truncate" title={selectedSubmission.repositoryUrl}>
                          {selectedSubmission.repositoryUrl}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <a
                            href={selectedSubmission.repositoryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-purple-900/40 border border-purple-800/50 text-[11px] font-bold text-purple-200 hover:bg-purple-800/50 transition"
                          >
                            <span>Open Repo</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <button
                            onClick={() => handleCopy(selectedSubmission.repositoryUrl, "modal-repo")}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-bg-surface border border-border text-[11px] text-text-secondary hover:text-text-primary transition"
                          >
                            {copiedKey === "modal-repo" ? (
                              <>
                                <Check className="w-3 h-3 text-green-400" />
                                <span className="text-green-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-text-muted italic">No repository URL submitted</p>
                    )}
                  </div>

                  {/* Deployment Box */}
                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" /> Live Demo
                      </span>
                      {selectedSubmission.deploymentUrl ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                          Active
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-border text-text-muted">
                          None
                        </span>
                      )}
                    </div>
                    {selectedSubmission.deploymentUrl ? (
                      <div className="space-y-2">
                        <p className="text-xs font-mono text-emerald-200 truncate" title={selectedSubmission.deploymentUrl}>
                          {selectedSubmission.deploymentUrl}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <a
                            href={selectedSubmission.deploymentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-900/40 border border-emerald-800/50 text-[11px] font-bold text-emerald-200 hover:bg-emerald-800/50 transition"
                          >
                            <span>Launch Demo</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <button
                            onClick={() => handleCopy(selectedSubmission.deploymentUrl!, "modal-demo")}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-bg-surface border border-border text-[11px] text-text-secondary hover:text-text-primary transition"
                          >
                            {copiedKey === "modal-demo" ? (
                              <>
                                <Check className="w-3 h-3 text-green-400" />
                                <span className="text-green-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-text-muted italic">Optional deployment URL not provided</p>
                    )}
                  </div>

                  {/* Presentation Slide Box */}
                  <div className="p-4 rounded-xl bg-yellow-950/20 border border-yellow-900/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Presentation className="w-3.5 h-3.5" /> Presentation Deck
                      </span>
                      {selectedSubmission.slideStorageKey ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-yellow-500/20 text-yellow-300">
                          Uploaded
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-950/40 text-red-400">
                          Missing
                        </span>
                      )}
                    </div>
                    {selectedSubmission.slideFilename ? (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-yellow-200 truncate" title={selectedSubmission.slideFilename}>
                          {selectedSubmission.slideFilename}
                        </p>
                        <p className="text-[10px] text-text-muted">
                          Size: {formatFileSize(selectedSubmission.slideSizeBytes)}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          {selectedSubmission.slideUrl && (
                            <a
                              href={selectedSubmission.slideUrl}
                              download={selectedSubmission.slideFilename}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-yellow-900/40 border border-yellow-800/50 text-[11px] font-bold text-yellow-200 hover:bg-yellow-800/50 transition"
                            >
                              <Download className="w-3 h-3" />
                              <span>Download</span>
                            </a>
                          )}
                          <button
                            onClick={() =>
                              setPreviewSlide({
                                url: selectedSubmission.slideUrl || getUploadUrl(selectedSubmission.slideStorageKey),
                                title: selectedSubmission.team?.teamName || "Presentation Slides",
                                filename: selectedSubmission.slideFilename || "slides.pdf",
                              })
                            }
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-bg-surface border border-border text-[11px] text-text-secondary hover:text-text-primary transition"
                          >
                            <Maximize2 className="w-3 h-3" />
                            <span>Preview</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-text-muted italic">No slide deck uploaded</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Embedded Presentation Slide Viewer (if slide available) */}
              {selectedSubmission.slideUrl && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                      <Presentation className="w-4 h-4 text-yellow-400" />
                      In-Page Slide Viewer
                    </h3>
                    <div className="flex items-center gap-2">
                      <a
                        href={selectedSubmission.slideUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-brand-primary hover:underline flex items-center gap-1"
                      >
                        <span>Full Window</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="border border-border/80 rounded-xl overflow-hidden bg-black/40">
                    {(() => {
                      const isPpt = selectedSubmission.slideFilename?.toLowerCase().match(/\.(ppt|pptx)$/);
                      const absUrl = selectedSubmission.slideUrl!.startsWith("http")
                        ? selectedSubmission.slideUrl!
                        : `${window.location.origin}${selectedSubmission.slideUrl!}`;
                      return isPpt ? (
                        <iframe
                          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absUrl)}`}
                          className="w-full border-0"
                          style={{ height: "420px" }}
                          title={`Presentation - ${selectedSubmission.team?.teamName}`}
                          allowFullScreen
                        />
                      ) : (
                        <object
                          data={selectedSubmission.slideUrl!}
                          type="application/pdf"
                          className="w-full border-0"
                          style={{ height: "420px", background: "#1a1a1a" }}
                        >
                          <iframe
                            src={selectedSubmission.slideUrl!}
                            className="w-full border-0"
                            style={{ height: "420px" }}
                            title={`Presentation - ${selectedSubmission.team?.teamName}`}
                          >
                            <div className="p-8 text-center space-y-3">
                              <Presentation className="w-8 h-8 text-yellow-400 mx-auto" />
                              <p className="text-xs text-text-secondary">
                                Embedded preview not supported by your browser for this file.
                              </p>
                              <a
                                href={selectedSubmission.slideUrl!}
                                download={selectedSubmission.slideFilename || "slide"}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-primary text-black font-bold text-xs"
                              >
                                <Download className="w-3.5 h-3.5" /> Download Slide Deck
                              </a>
                            </div>
                          </iframe>
                        </object>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Project & Proposal Info (Phase 1) */}
              {selectedSubmission.proposal && (
                <div className="space-y-3 pt-2 border-t border-border/60">
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-400" />
                    Phase 1 Proposal & Concept
                  </h3>
                  <div className="p-4 rounded-xl bg-bg-surface/60 border border-border space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-bold text-sm text-text-primary">
                        {selectedSubmission.proposal.title}
                      </h4>
                      {selectedSubmission.proposal.devpostUrl && (
                        <a
                          href={selectedSubmission.proposal.devpostUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary hover:underline shrink-0"
                        >
                          <span>Devpost</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    {selectedSubmission.proposal.description ? (
                      <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {selectedSubmission.proposal.description}
                      </p>
                    ) : (
                      <p className="text-xs text-text-muted italic">No proposal description provided.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Team Members Roster */}
              <div className="space-y-3 pt-2 border-t border-border/60">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand-primary" />
                  Team Roster & Contacts
                </h3>

                <div className="grid sm:grid-cols-2 gap-3">
                  {/* Leader Card */}
                  {selectedSubmission.leader && (
                    <div className="p-3.5 rounded-xl bg-brand-primary/5 border border-brand-primary/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center text-brand-primary font-bold text-xs uppercase">
                          {selectedSubmission.leader.fullName.slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-text-primary">
                              {selectedSubmission.leader.fullName}
                            </span>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-brand-primary/20 text-brand-primary uppercase">
                              Leader
                            </span>
                          </div>
                          <p className="text-[11px] text-text-muted">{selectedSubmission.leader.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopy(selectedSubmission.leader!.email, "leader-email")}
                        className="p-1.5 rounded-lg text-text-muted hover:text-brand-primary transition"
                        title="Copy leader email"
                      >
                        {copiedKey === "leader-email" ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Other Members */}
                  {selectedSubmission.members
                    .filter((m) => m.user && m.user.email !== selectedSubmission.leader?.email)
                    .map((m) => (
                      <div
                        key={m.id}
                        className="p-3.5 rounded-xl bg-bg-surface/50 border border-border flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-bg-surface border border-border flex items-center justify-center text-text-muted font-bold text-xs uppercase">
                            {m.user?.fullName.slice(0, 2) || "M"}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-xs text-text-primary">
                                {m.user?.fullName || "Member"}
                              </span>
                              <span className="text-[9px] text-text-muted capitalize">Member</span>
                            </div>
                            <p className="text-[11px] text-text-muted">{m.user?.email}</p>
                          </div>
                        </div>
                        {m.user?.email && (
                          <button
                            onClick={() => handleCopy(m.user!.email, `member-${m.id}`)}
                            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary transition"
                            title="Copy email"
                          >
                            {copiedKey === `member-${m.id}` ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              {/* Technical Metadata Footer */}
              <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3 text-[11px] text-text-muted">
                <span className="font-mono">Submission ID: {selectedSubmission.id}</span>
                <span className="font-mono">Team ID: {selectedSubmission.teamId}</span>
                <span className="font-semibold text-brand-primary">Status: {selectedSubmission.status}</span>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================================= */}
      {/* FULLSCREEN SLIDE PREVIEW MODAL                                            */}
      {/* ========================================================================= */}
      {previewSlide &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setPreviewSlide(null)}
          >
            <div
              className="relative w-full max-w-5xl h-[85vh] bg-bg-surface border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Slide Viewer Header */}
              <div className="px-5 py-3 border-b border-border bg-bg-surface/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Presentation className="w-4 h-4 text-yellow-400" />
                  <span className="font-bold text-sm text-text-primary">{previewSlide.title}</span>
                  <span className="text-xs text-text-muted font-mono">({previewSlide.filename})</span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={previewSlide.url}
                    download={previewSlide.filename}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-bg-surface border border-border text-xs font-semibold text-text-secondary hover:text-text-primary transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                  <a
                    href={previewSlide.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-bg-surface border border-border text-xs font-semibold text-text-secondary hover:text-text-primary transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>New Tab</span>
                  </a>
                  <button
                    onClick={() => setPreviewSlide(null)}
                    className="p-1.5 rounded-lg bg-bg-surface border border-border text-text-muted hover:text-text-primary transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Viewer Frame */}
              <div className="flex-1 bg-black/90 w-full overflow-hidden">
                {(() => {
                  const isPpt = previewSlide.filename?.toLowerCase().match(/\.(ppt|pptx)$/);
                  const absUrl = previewSlide.url.startsWith("http")
                    ? previewSlide.url
                    : `${window.location.origin}${previewSlide.url}`;
                  return isPpt ? (
                    <iframe
                      src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absUrl)}`}
                      className="w-full h-full border-0"
                      title={previewSlide.title}
                      allowFullScreen
                    />
                  ) : (
                    <object
                      data={previewSlide.url}
                      type="application/pdf"
                      className="w-full h-full border-0"
                    >
                      <iframe
                        src={previewSlide.url}
                        className="w-full h-full border-0"
                        title={previewSlide.title}
                      >
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-3">
                          <Presentation className="w-12 h-12 text-yellow-400" />
                          <p className="text-sm font-semibold text-text-primary">
                            Preview not supported for this format in browser.
                          </p>
                          <a
                            href={previewSlide.url}
                            download={previewSlide.filename}
                            className="px-4 py-2 rounded-lg bg-brand-primary text-black font-bold text-xs"
                          >
                            Download Presentation
                          </a>
                        </div>
                      </iframe>
                    </object>
                  );
                })()}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
