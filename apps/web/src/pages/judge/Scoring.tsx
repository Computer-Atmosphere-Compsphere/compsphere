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
  Clock,
  CheckCircle2,
  Download,
  Users,
  Trophy,
  RefreshCw,
  Info,
  Maximize2,
  BookOpen,
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
    description: "Evaluates system architecture logic, tech stack selection, scalability, security, and execution feasibility into a production MVP.",
  },
  {
    key: "problemScore" as const,
    label: "Problem Relevance & Solution Fit",
    weight: "20%",
    weightValue: 0.20,
    description: "Evaluates real-world urgency, data-backed problem validation, and logical problem-solution alignment.",
  },
  {
    key: "innovationScore" as const,
    label: "Innovation & Value Proposition",
    weight: "25%",
    weightValue: 0.25,
    description: "Evaluates originality, technological novelty, unique selling proposition (USP), and competitive advantage.",
  },
  {
    key: "marketScore" as const,
    label: "Market & Impact Viability",
    weight: "15%",
    weightValue: 0.15,
    description: "Evaluates target market size, real-world societal impact, financial sustainability, and growth scaling model.",
  },
  {
    key: "documentScore" as const,
    label: "Document Clarity & Structure",
    weight: "10%",
    weightValue: 0.10,
    description: "Evaluates document completeness, clarity, structural flow, technical diagram rigor, and proposal format adherence.",
  },
];

export function Scoring() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"pdf" | "summary">("pdf");
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: assignmentData, isLoading } = useQuery<any>({
    queryKey: ["judge-score", teamId],
    queryFn: () => api.get("/api/judges/my-assignments"),
    enabled: !!teamId,
  });

  // Find the specific assignment for this team
  const assignment = assignmentData?.assignments?.find((a: any) => a.teamId === teamId);
  const team = assignment?.team;
  const existingScore = assignment?.score;
  const isFrozen = assignmentData?.isFrozen;

  const syncPdfMutation = useMutation({
    mutationFn: () => api.post("/api/judges/sync-dummy-pdfs"),
    onMutate: () => setIsSyncing(true),
    onSuccess: () => {
      setIsSyncing(false);
      queryClient.invalidateQueries({ queryKey: ["judge-score", teamId] });
      queryClient.invalidateQueries({ queryKey: ["judge-assignments"] });
    },
    onError: () => setIsSyncing(false),
  });

  const { control, handleSubmit, watch } = useForm<ScoreForm>({
    defaultValues: {
      technicalScore: existingScore?.technicalScore ?? 75,
      problemScore: existingScore?.problemScore ?? 75,
      innovationScore: existingScore?.innovationScore ?? 75,
      marketScore: existingScore?.marketScore ?? 75,
      documentScore: existingScore?.documentScore ?? 75,
      notes: existingScore?.notes ?? "",
    },
  });

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

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Navigation & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/judge/teams")}
            className="p-2 rounded-lg border border-border hover:bg-bg-surface transition text-text-muted hover:text-text-primary shrink-0"
            title="Back to assigned teams"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold text-brand-primary bg-brand-dim px-2.5 py-0.5 rounded border border-brand-primary/30">
                {team.teamCode}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-900/50">
                {team.category || "NATIONAL"}
              </span>

              {existingScore && (
                <span className="text-xs font-bold text-green-400 bg-green-950/50 border border-green-900/50 px-2.5 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Scored ({Number(existingScore.finalScore).toFixed(1)})
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-text-primary truncate mt-1">
              {team.teamName}
            </h1>
          </div>
        </div>

        {/* Action Controls & Code Freeze */}
        <div className="flex items-center gap-3">
          {isFrozen && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-900/50 text-red-400 text-xs font-bold">
              <Lock className="w-4 h-4" />
              <span>Code Freeze Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Main 2-Column Scoring Workspace */}
      <div className="grid lg:grid-cols-12 gap-6 min-h-[calc(100vh-220px)]">
        {/* Left Column: PDF & Proposal Document Viewer (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <GlassPanel className="p-4 flex flex-col flex-1 border border-border/80 rounded-2xl overflow-hidden shadow-2xl">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("pdf")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeTab === "pdf"
                      ? "bg-brand-primary text-bg-primary"
                      : "text-text-secondary hover:bg-bg-surface"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" /> PDF Document
                </button>
                <button
                  onClick={() => setActiveTab("summary")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeTab === "summary"
                      ? "bg-brand-primary text-bg-primary"
                      : "text-text-secondary hover:bg-bg-surface"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" /> Proposal Text & Meta
                </button>
              </div>

              {proposalUrl && (
                <div className="flex items-center gap-2">
                  <a
                    href={proposalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline bg-brand-dim px-2.5 py-1 rounded"
                    title="Open PDF in Full Screen"
                  >
                    <Maximize2 className="w-3 h-3" /> Full Window
                  </a>
                  <a
                    href={proposalUrl}
                    download={`proposal_${team.teamCode}.pdf`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-text-primary hover:bg-bg-surface border border-border px-2.5 py-1 rounded"
                    title="Download PDF File"
                  >
                    <Download className="w-3 h-3 text-brand-primary" /> Download
                  </a>
                </div>
              )}
            </div>

            {/* Content Area */}
            {activeTab === "pdf" ? (
              proposalUrl ? (
                <div className="flex-1 w-full min-h-[600px] rounded-xl overflow-hidden border border-border/60 bg-white">
                  <object
                    data={proposalUrl}
                    type="application/pdf"
                    className="w-full h-full border-0 min-h-[600px]"
                  >
                    <iframe
                      src={proposalUrl}
                      className="w-full h-full border-0 min-h-[600px]"
                      title={`Proposal Document - ${team.teamName}`}
                    >
                      <div className="flex flex-col items-center justify-center p-8 bg-bg-surface text-center space-y-3">
                        <FileText className="w-10 h-10 text-brand-primary" />
                        <p className="text-xs text-text-secondary">
                          Direct PDF preview is not supported by your browser viewer.
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
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-3">
                  <FileText className="w-10 h-10 text-text-muted" />
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">No PDF Attached</h3>
                    <p className="text-xs text-text-muted mt-0.5 max-w-xs">
                      Proposal document is pending upload by the team.
                    </p>
                  </div>
                </div>
              )
            ) : (
              /* Summary Tab */
              <div className="flex-1 space-y-4 overflow-y-auto pr-2 max-h-[700px]">
                <div className="p-4 rounded-xl bg-bg-surface border border-border space-y-2">
                  <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider">Project Title</h4>
                  <p className="text-base font-extrabold text-text-primary">
                    {team.proposal?.title || `${team.teamName} Innovation Proposal`}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-bg-surface border border-border space-y-2">
                  <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider">Executive Summary</h4>
                  <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">
                    {team.proposal?.description || `Platform inovatif dari ${team.teamName} untuk COMPSPHERE 2026.`}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-bg-surface border border-border grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-text-muted block text-[10px] font-bold uppercase">Team Members</span>
                    <span className="font-bold text-text-primary flex items-center gap-1 mt-0.5">
                      <Users className="w-3.5 h-3.5 text-brand-primary" /> {team.memberCount || 1} Active Member(s)
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px] font-bold uppercase">Leader Contact</span>
                    <span className="font-bold text-text-primary block mt-0.5 truncate">
                      {team.leaderName || "Team Leader"} ({team.leaderEmail || "N/A"})
                    </span>
                  </div>
                </div>

                {team.proposal?.devpostUrl && (
                  <div className="p-4 rounded-xl bg-bg-surface border border-border flex items-center justify-between">
                    <span className="text-xs text-text-muted">Devpost Submission URL:</span>
                    <a
                      href={team.proposal.devpostUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1"
                    >
                      View on Devpost <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </GlassPanel>
        </div>

        {/* Right Column: Scoring Form & Realtime Weighted Score Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Realtime Weighted Score Card */}
          <GlassPanel className="p-5 flex items-center justify-between border-2 border-brand-primary/40 bg-brand-primary/5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">Calculated Final Score</span>
              <p className="text-[11px] text-text-muted mt-0.5">Weighted average based on Phase 1 criteria weights</p>
            </div>
            <div className="text-right">
              <span className="text-4xl font-extrabold font-mono text-brand-primary tracking-tight">
                {weightedPreview}
              </span>
              <span className="text-text-muted text-sm font-bold"> / 100</span>
            </div>
          </GlassPanel>

          {/* Scoring Form */}
          <form onSubmit={handleSubmit((data) => scoreMutation.mutate(data))} className="space-y-4">
            {CRITERIA.map(({ key, label, weight, weightValue, description }) => (
              <GlassPanel key={key} className="p-4 space-y-3 hover:border-brand-primary/30 transition">
                <div className="flex justify-between items-start">
                  <div className="pr-2">
                    <h4 className="font-extrabold text-xs text-text-primary">{label}</h4>
                    <p className="text-[10px] text-text-muted mt-0.5 leading-snug">{description}</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-brand-primary bg-brand-dim border border-brand-primary/30 px-2 py-0.5 rounded shrink-0">
                    Weight: {weight}
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

            {/* Evaluation Feedback Notes */}
            <GlassPanel className="p-4 space-y-2">
              <h4 className="font-bold text-xs text-text-primary">Qualitative Feedback & Evaluation Notes</h4>
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

            {/* Submit Button */}
            <NeonButton
              type="submit"
              disabled={scoreMutation.isPending || isFrozen}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-bold"
            >
              {isFrozen ? (
                <>
                  <Lock className="w-4 h-4" />
                  Code Freeze Active
                </>
              ) : scoreMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-bg-primary border-t-transparent rounded-full animate-spin" />
                  Submitting Evaluation...
                </>
              ) : existingScore ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Update Team Score
                </>
              ) : (
                <>
                  <Gavel className="w-4 h-4" />
                  Submit Official Evaluation Score
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
