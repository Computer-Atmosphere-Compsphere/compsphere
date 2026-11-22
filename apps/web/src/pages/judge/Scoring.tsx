import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getUploadUrl } from "@/lib/api";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { NeonButton } from "@/components/compsphere/NeonButton";
import { useForm, Controller } from "react-hook-form";
import {
  ArrowLeft,
  Gavel,
  FileText,
  ExternalLink,
  Lock,
  CheckCircle2,
  Download,
  Users,
  Info,
  Maximize2,
  BookOpen,
  Github,
  Globe,
  Presentation,
  ChevronDown,
  ChevronUp,
  Star,
  AlertTriangle,
} from "lucide-react";

interface ScoreForm {
  technicalScore: number;
  problemScore: number;
  innovationScore: number;
  marketScore: number;
  documentScore: number;
  notes: string;
}

const CRITERIA = [
  {
    key: "technicalScore" as const,
    label: "Technical Architecture & Feasibility",
    weight: "30%",
    weightValue: 0.30,
    description:
      "Evaluates system architecture logic, tech stack selection, scalability, security, and execution feasibility into a production MVP.",
  },
  {
    key: "problemScore" as const,
    label: "Problem Relevance & Solution Fit",
    weight: "20%",
    weightValue: 0.20,
    description:
      "Evaluates real-world urgency, data-backed problem validation, and logical problem-solution alignment.",
  },
  {
    key: "innovationScore" as const,
    label: "Innovation & Value Proposition",
    weight: "25%",
    weightValue: 0.25,
    description:
      "Evaluates originality, technological novelty, unique selling proposition (USP), and competitive advantage.",
  },
  {
    key: "marketScore" as const,
    label: "Market & Impact Viability",
    weight: "15%",
    weightValue: 0.15,
    description:
      "Evaluates target market size, real-world societal impact, financial sustainability, and growth scaling model.",
  },
  {
    key: "documentScore" as const,
    label: "Document Clarity & Structure",
    weight: "10%",
    weightValue: 0.10,
    description:
      "Evaluates document completeness, clarity, structural flow, technical diagram rigor, and proposal format adherence.",
  },
];

// Collapsible section wrapper
function Section({
  title,
  badge,
  badgeColor = "text-brand-primary",
  icon,
  defaultOpen = true,
  children,
  actions,
}: {
  title: string;
  badge?: string;
  badgeColor?: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.02)",
      }}
    >
      {/* Section header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors"
      >
        {icon && <span className="shrink-0 opacity-70">{icon}</span>}
        <span className="flex-1 text-xs font-bold text-text-primary tracking-wide">{title}</span>
        {badge && (
          <span className={`text-[9px] font-bold uppercase tracking-wider ${badgeColor} opacity-80`}>
            {badge}
          </span>
        )}
        <span className="shrink-0 text-text-muted ml-2">
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </span>
      </button>

      {/* Actions row (only when open) */}
      {open && actions && (
        <div
          className="flex items-center gap-2 px-4 py-2 border-t border-b"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}
        >
          {actions}
        </div>
      )}

      {/* Content */}
      {open && <div>{children}</div>}
    </div>
  );
}

export function Scoring() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: assignmentData, isLoading } = useQuery<any>({
    queryKey: ["judge-score", teamId],
    queryFn: () => api.get("/api/judges/my-assignments"),
    enabled: !!teamId,
  });

  const assignment = assignmentData?.assignments?.find((a: any) => a.teamId === teamId);
  const team = assignment?.team;
  const existingScore = assignment?.score;
  const isFrozen = assignmentData?.isFrozen;
  const phase = assignmentData?.phase;
  const isPhase2 = phase === "PHASE2_JUDGING";

  const { data: slideData, isLoading: slideLoading } = useQuery<any>({
    queryKey: ["slide-url", teamId],
    queryFn: () => api.get(`/api/submissions/slide-url/${teamId}`),
    enabled: !!teamId,
    retry: false,
  });

  const { control, handleSubmit, watch, reset } = useForm<ScoreForm>({
    defaultValues: {
      technicalScore: existingScore?.technicalScore ?? 75,
      problemScore: existingScore?.problemScore ?? 75,
      innovationScore: existingScore?.innovationScore ?? 75,
      marketScore: existingScore?.marketScore ?? 75,
      documentScore: existingScore?.documentScore ?? 75,
      notes: existingScore?.notes ?? "",
    },
  });

  // Reinitialize defaults once assignment loads
  React.useEffect(() => {
    if (existingScore) {
      reset({
        technicalScore: existingScore.technicalScore ?? 75,
        problemScore: existingScore.problemScore ?? 75,
        innovationScore: existingScore.innovationScore ?? 75,
        marketScore: existingScore.marketScore ?? 75,
        documentScore: existingScore.documentScore ?? 75,
        notes: existingScore.notes ?? "",
      });
    }
  }, [existingScore, reset]);

  const scoreMutation = useMutation({
    mutationFn: (scores: ScoreForm) =>
      api.post("/api/judges/submit-score", { teamId, ...scores }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["judge-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["judge-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["judge-score", teamId] });
    },
  });

  const watched = watch();
  const weightedPreview = CRITERIA.reduce((sum, c) => {
    return sum + ((watched as any)[c.key] ?? 0) * c.weightValue;
  }, 0).toFixed(1);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-16 space-y-3 max-w-md mx-auto">
        <Info className="w-10 h-10 text-yellow-400 mx-auto" />
        <p className="text-base font-bold text-text-primary">Team Not Found or Not Assigned</p>
        <p className="text-xs text-text-muted">
          You do not have active scoring permissions for this team.
        </p>
        <NeonButton onClick={() => navigate("/judge/teams")} size="sm" className="mt-4">
          Back to Assigned Teams
        </NeonButton>
      </div>
    );
  }

  const proposalFile = team.proposal?.files?.[0];
  const proposalUrl = proposalFile ? getUploadUrl(proposalFile.storageKey) : null;
  const submission = team?.submission ?? null;
  const rawSlideUrl: string | null = slideData?.slideUrl ?? null;
  const slideFilename: string | null = slideData?.slideFilename ?? submission?.slideFilename ?? null;
  const isPptSlide = !!slideFilename?.toLowerCase().match(/\.(ppt|pptx)$/);
  const slideViewerUrl: string | null = rawSlideUrl
    ? isPptSlide
      ? `https://docs.google.com/gviewer?url=${encodeURIComponent(rawSlideUrl)}&embedded=true`
      : rawSlideUrl
    : null;

  return (
    <div className="p-4 md:p-6 max-w-[1800px] mx-auto pb-16">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-6 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/judge/teams")}
            className="p-2 rounded-lg border border-border hover:bg-bg-surface transition text-text-muted hover:text-text-primary shrink-0"
            title="Back to assigned teams"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <span className="text-xs font-mono font-bold text-brand-primary bg-brand-dim px-2.5 py-0.5 rounded border border-brand-primary/30">
                {team.teamCode}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-900/50">
                {team.category || "NATIONAL"}
              </span>
              {isPhase2 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-950/30 text-amber-400 border border-amber-700/40 flex items-center gap-1">
                  <Star className="w-3 h-3" /> Phase 2 Final Judging
                </span>
              )}
              {existingScore && (
                <span className="text-xs font-bold text-green-400 bg-green-950/50 border border-green-900/50 px-2.5 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Scored ({Number(existingScore.finalScore).toFixed(1)})
                </span>
              )}
              {isFrozen && (
                <span className="text-xs font-bold text-red-400 bg-red-950/40 border border-red-900/50 px-2.5 py-0.5 rounded flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> Code Freeze Active
                </span>
              )}
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-text-primary truncate">
              {team.teamName}
            </h1>
            {team.proposal?.title && (
              <p className="text-xs text-text-muted mt-0.5">
                <FileText className="w-3 h-3 inline mr-1 opacity-50" />
                {team.proposal.title}
              </p>
            )}
          </div>
        </div>

        {/* Team meta */}
        <div className="flex items-center gap-4 text-xs text-text-muted shrink-0">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>{team.memberCount || 1} member{(team.memberCount || 1) > 1 ? "s" : ""}</span>
          </div>
          {team.leaderName && (
            <div className="flex items-center gap-1.5">
              <span className="text-text-secondary font-semibold">{team.leaderName}</span>
              {team.leaderEmail && <span className="opacity-60">({team.leaderEmail})</span>}
            </div>
          )}
        </div>
      </div>

      {/* ── 2-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── LEFT: Reference Materials (7 cols) ── */}
        <div className="lg:col-span-7 flex flex-col gap-4">

          {/* SECTION 1: Proposal PDF */}
          <Section
            title="Proposal Document"
            badge={proposalUrl ? "PDF Ready" : "Not Uploaded"}
            badgeColor={proposalUrl ? "text-green-400" : "text-yellow-500"}
            icon={<FileText className="w-3.5 h-3.5 text-brand-primary" />}
            defaultOpen={true}
            actions={
              proposalUrl ? (
                <>
                  <a
                    href={proposalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline bg-brand-dim px-2.5 py-1 rounded"
                  >
                    <Maximize2 className="w-3 h-3" /> Full Window
                  </a>
                  <a
                    href={proposalUrl}
                    download={`proposal_${team.teamCode}.pdf`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-text-primary hover:bg-bg-surface border border-border px-2.5 py-1 rounded"
                  >
                    <Download className="w-3 h-3 text-brand-primary" /> Download
                  </a>
                </>
              ) : undefined
            }
          >
            {proposalUrl ? (
              <div className="w-full" style={{ height: "520px", background: "#fff" }}>
                <object
                  data={proposalUrl}
                  type="application/pdf"
                  className="w-full border-0"
                  style={{ height: "520px" }}
                >
                  <iframe
                    src={proposalUrl}
                    className="w-full border-0"
                    style={{ height: "520px" }}
                    title={`Proposal Document - ${team.teamName}`}
                  >
                    <div className="flex flex-col items-center justify-center p-8 bg-bg-surface text-center space-y-3 h-full">
                      <FileText className="w-10 h-10 text-brand-primary" />
                      <p className="text-xs text-text-secondary">
                        Direct PDF preview not supported.
                      </p>
                      <a
                        href={proposalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> View PDF in New Tab
                      </a>
                    </div>
                  </iframe>
                </object>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
                <AlertTriangle className="w-8 h-8 text-yellow-500 opacity-60" />
                <p className="text-sm font-bold text-text-primary">No Proposal PDF</p>
                <p className="text-xs text-text-muted">The team has not uploaded a proposal document.</p>
              </div>
            )}
          </Section>

          {/* SECTION 2: Phase 2 Submission (Repo + Demo + Slide) */}
          <Section
            title="Phase 2 Submission"
            badge={submission ? "Submitted" : "Not Submitted"}
            badgeColor={submission ? "text-purple-400" : "text-text-muted"}
            icon={<Star className="w-3.5 h-3.5 text-amber-400" />}
            defaultOpen={isPhase2}
          >
            <div className="p-4 space-y-4">
              {/* Links row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Repository */}
                <div
                  className="p-3 rounded-lg space-y-1"
                  style={{
                    background: "rgba(0,245,200,0.04)",
                    border: "1px solid rgba(0,245,200,0.1)",
                  }}
                >
                  <p className="text-[9px] font-bold uppercase tracking-widest text-brand-primary mb-1.5">
                    GitHub Repository
                  </p>
                  {submission?.repositoryUrl ? (
                    <a
                      href={submission.repositoryUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-xs font-semibold text-brand-primary hover:underline break-all"
                    >
                      <Github className="w-4 h-4 shrink-0" />
                      <span className="line-clamp-1">{submission.repositoryUrl}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 ml-auto" />
                    </a>
                  ) : (
                    <span className="text-xs text-text-muted opacity-60 flex items-center gap-1.5">
                      <Github className="w-3.5 h-3.5" /> Not submitted
                    </span>
                  )}
                </div>

                {/* Live Demo */}
                <div
                  className="p-3 rounded-lg space-y-1"
                  style={{
                    background: "rgba(74,222,128,0.04)",
                    border: "1px solid rgba(74,222,128,0.12)",
                  }}
                >
                  <p className="text-[9px] font-bold uppercase tracking-widest text-green-400 mb-1.5">
                    Live Demo
                  </p>
                  {submission?.deploymentUrl ? (
                    <a
                      href={submission.deploymentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-xs font-semibold text-green-400 hover:underline break-all"
                    >
                      <Globe className="w-4 h-4 shrink-0" />
                      <span className="line-clamp-1">{submission.deploymentUrl}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 ml-auto" />
                    </a>
                  ) : (
                    <span className="text-xs text-text-muted opacity-60 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" /> Not submitted
                    </span>
                  )}
                </div>
              </div>

              {/* Submission date */}
              {submission?.submittedAt && (
                <p className="text-[10px] text-text-muted font-mono">
                  Submitted: {new Date(submission.submittedAt).toLocaleString("id-ID")}
                  {submission.status && (
                    <span
                      className={`ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        submission.status === "SUBMITTED"
                          ? "bg-green-950/50 text-green-400 border border-green-900/50"
                          : "bg-yellow-950/50 text-yellow-400 border border-yellow-900/50"
                      }`}
                    >
                      {submission.status}
                    </span>
                  )}
                </p>
              )}

              {!submission && (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                  <AlertTriangle className="w-7 h-7 text-text-muted opacity-40" />
                  <p className="text-xs text-text-muted">This team has not submitted Phase 2 deliverables.</p>
                </div>
              )}
            </div>

            {/* Presentation Slide sub-section */}
            <div
              className="border-t"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              <div className="px-4 pb-4 pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
                    <Presentation className="w-3.5 h-3.5" /> Presentation Slide
                  </p>
                  {rawSlideUrl && (
                    <div className="flex items-center gap-2">
                      <a
                        href={rawSlideUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-400 hover:underline bg-purple-950/30 px-2 py-0.5 rounded"
                      >
                        <Maximize2 className="w-3 h-3" /> Full Window
                      </a>
                      <a
                        href={rawSlideUrl}
                        download={slideFilename ?? `slide_${team.teamCode}`}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-text-primary hover:bg-bg-surface border border-border px-2 py-0.5 rounded"
                      >
                        <Download className="w-3 h-3 text-purple-400" /> Download
                      </a>
                    </div>
                  )}
                </div>

                {slideLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-7 h-7 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <span className="ml-3 text-xs text-text-muted">Loading slide...</span>
                  </div>
                ) : slideViewerUrl ? (
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{ border: "1px solid rgba(139,92,246,0.25)" }}
                  >
                    {isPptSlide ? (
                      <iframe
                        src={slideViewerUrl}
                        className="w-full border-0"
                        style={{ height: "480px" }}
                        title={`Presentation Slides - ${team.teamName}`}
                        allowFullScreen
                      />
                    ) : (
                      <object
                        data={slideViewerUrl}
                        type="application/pdf"
                        className="w-full border-0"
                        style={{ height: "480px", background: "#fff" }}
                      >
                        <iframe
                          src={slideViewerUrl}
                          className="w-full border-0"
                          style={{ height: "480px" }}
                          title={`Presentation Slides - ${team.teamName}`}
                        >
                          <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                            <Presentation className="w-10 h-10 text-purple-400" />
                            <p className="text-xs text-text-secondary">
                              Preview not supported. Use Full Window or Download above.
                            </p>
                            <a
                              href={rawSlideUrl ?? ""}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-bold text-purple-400 hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
                            </a>
                          </div>
                        </iframe>
                      </object>
                    )}
                    {/* Slide info bar */}
                    <div
                      className="px-3 py-2 flex items-center gap-3 text-xs text-text-muted"
                      style={{ background: "rgba(0,0,0,0.3)", borderTop: "1px solid rgba(139,92,246,0.15)" }}
                    >
                      <Presentation className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="font-semibold text-text-primary truncate">
                        {slideFilename || "presentation"}
                      </span>
                      {slideData?.slideSizeBytes && (
                        <span className="shrink-0">
                          ({(slideData.slideSizeBytes / (1024 * 1024)).toFixed(1)} MB)
                        </span>
                      )}
                      {slideData?.submittedAt && (
                        <span className="shrink-0 ml-auto">
                          Submitted {new Date(slideData.submittedAt).toLocaleString("id-ID")}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
                    <Presentation className="w-8 h-8 text-purple-400 opacity-30" />
                    <p className="text-sm font-bold text-text-primary">No Presentation Slides</p>
                    <p className="text-xs text-text-muted max-w-xs">
                      This team has not uploaded their Phase 2 presentation slides.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Section>

          {/* SECTION 3: Project Overview (proposal summary / devpost) */}
          {(team.proposal?.description || team.proposal?.devpostUrl) && (
            <Section
              title="Project Overview"
              icon={<BookOpen className="w-3.5 h-3.5 text-brand-primary" />}
              defaultOpen={false}
            >
              <div className="p-4 space-y-3">
                {team.proposal?.title && (
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1">Title</p>
                    <p className="text-sm font-extrabold text-text-primary">{team.proposal.title}</p>
                  </div>
                )}
                {team.proposal?.description && (
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1">Executive Summary</p>
                    <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">
                      {team.proposal.description}
                    </p>
                  </div>
                )}
                {team.proposal?.devpostUrl && (
                  <a
                    href={team.proposal.devpostUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View on Devpost
                  </a>
                )}
              </div>
            </Section>
          )}
        </div>

        {/* ── RIGHT: Scoring Form (5 cols) ── */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Weighted Score Preview Card */}
          <GlassPanel className="p-5 border-2 border-brand-primary/40 bg-brand-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                  Calculated Final Score
                </span>
                <p className="text-[11px] text-text-muted mt-0.5">
                  Weighted average · updates live
                </p>
              </div>
              <div className="text-right">
                <span className="text-4xl font-extrabold font-mono text-brand-primary tracking-tight">
                  {weightedPreview}
                </span>
                <span className="text-text-muted text-sm font-bold"> / 100</span>
              </div>
            </div>
            {/* Mini breakdown */}
            <div className="mt-3 grid grid-cols-5 gap-1">
              {CRITERIA.map((c) => {
                const val = Number((watched as any)[c.key]) || 0;
                return (
                  <div key={c.key} title={`${c.label}: ${val}`}>
                    <div
                      className="h-1.5 rounded-full overflow-hidden mb-1"
                      style={{ background: "rgba(255,255,255,0.08)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${val}%`,
                          background:
                            val >= 70 ? "#4ade80" : val >= 40 ? "#facc15" : "#f87171",
                        }}
                      />
                    </div>
                    <p className="text-[8px] font-mono text-text-muted text-center">{c.weight}</p>
                  </div>
                );
              })}
            </div>
          </GlassPanel>

          {/* Phase 2 notice */}
          {isPhase2 && (
            <GlassPanel className="p-3 bg-amber-950/20 border border-amber-700/30">
              <p className="text-xs text-amber-400 font-semibold flex items-start gap-2">
                <Star className="w-4 h-4 shrink-0 mt-0.5" />
                Phase 2 — Final Submission Judging. Evaluate the team's complete deliverables: proposal quality, live product, repository, and presentation slides.
              </p>
            </GlassPanel>
          )}

          {/* Scoring form */}
          <form onSubmit={handleSubmit((data) => scoreMutation.mutate(data))} className="space-y-3">
            {CRITERIA.map(({ key, label, weight, description }) => (
              <GlassPanel key={key} className="p-4 space-y-3 hover:border-brand-primary/30 transition">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-xs text-text-primary">{label}</h4>
                    <p className="text-[10px] text-text-muted mt-0.5 leading-snug">{description}</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-brand-primary bg-brand-dim border border-brand-primary/30 px-2 py-0.5 rounded shrink-0">
                    {weight}
                  </span>
                </div>

                <Controller
                  name={key}
                  control={control}
                  rules={{ min: 1, max: 100 }}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] text-text-muted font-mono">1 (Poor)</span>
                        <span className="font-mono font-extrabold text-text-primary text-base bg-bg-surface px-3 py-0.5 rounded border border-border">
                          {field.value} / 100
                        </span>
                        <span className="text-[10px] text-text-muted font-mono">100 (Exceptional)</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={100}
                        step={1}
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-brand-primary bg-bg-surface border border-border"
                      />
                    </div>
                  )}
                />
              </GlassPanel>
            ))}

            {/* Notes */}
            <GlassPanel className="p-4 space-y-2">
              <h4 className="font-bold text-xs text-text-primary">
                Qualitative Feedback & Evaluation Notes
              </h4>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    rows={4}
                    placeholder="Provide constructive feedback on technical feasibility, architecture, innovation strengths, or areas for improvement..."
                    className="w-full px-3 py-2.5 rounded-lg bg-bg-surface border border-border text-xs text-text-primary focus:outline-none focus:border-brand-primary resize-none leading-relaxed"
                  />
                )}
              />
            </GlassPanel>

            {/* Submit */}
            <NeonButton
              type="submit"
              disabled={scoreMutation.isPending || isFrozen}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-bold"
            >
              {isFrozen ? (
                <>
                  <Lock className="w-4 h-4" /> Code Freeze Active
                </>
              ) : scoreMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-bg-primary border-t-transparent rounded-full animate-spin" />
                  Submitting Evaluation...
                </>
              ) : existingScore ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-400" /> Update Team Score
                </>
              ) : (
                <>
                  <Gavel className="w-4 h-4" /> Submit Official Evaluation Score
                </>
              )}
            </NeonButton>

            {scoreMutation.isSuccess && (
              <p className="text-xs font-bold text-green-400 text-center p-2 rounded bg-green-950/40 border border-green-900/50">
                ✓ Evaluation score successfully recorded in system!
              </p>
            )}

            {scoreMutation.isError && (
              <p className="text-xs font-bold text-red-400 text-center p-2 rounded bg-red-950/40 border border-red-900/50">
                Error: {(scoreMutation.error as any)?.message || "Failed to submit score"}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
