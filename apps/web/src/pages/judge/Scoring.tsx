import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ScoreForm {
  mvpScore: number;
  impactScore: number;
  creativeScore: number;
  pitchScore: number;
  notes: string;
}

const CRITERIA = [
  {
    key: "mvpScore" as const,
    label: "MVP / Technical Quality",
    weight: "35%",
    weightValue: 0.35,
    description: "Completeness, technical depth, architecture quality, and prototype sophistication.",
  },
  {
    key: "impactScore" as const,
    label: "Impact & Scalability",
    weight: "30%",
    weightValue: 0.30,
    description: "Potential reach, societal value, real-world applicability, and growth potential.",
  },
  {
    key: "creativeScore" as const,
    label: "Creativity & Innovation",
    weight: "20%",
    weightValue: 0.20,
    description: "Novelty, uniqueness, originality of the solution approach.",
  },
  {
    key: "pitchScore" as const,
    label: "Pitch & Presentation",
    weight: "15%",
    weightValue: 0.15,
    description: "Clarity of communication, slide design, narrative flow, and delivery.",
  },
];

export function Scoring() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showProposal, setShowProposal] = useState(true);

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
  const deadline = assignmentData?.deadline;

  const { control, handleSubmit, watch, formState: { errors } } = useForm<ScoreForm>({
    defaultValues: {
      mvpScore: existingScore?.mvpScore ?? 70,
      impactScore: existingScore?.impactScore ?? 70,
      creativeScore: existingScore?.creativeScore ?? 70,
      pitchScore: existingScore?.pitchScore ?? 70,
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
      <div className="text-center py-16 space-y-3">
        <p className="text-sm font-bold text-text-primary">Team not found</p>
        <NeonButton onClick={() => navigate("/judge/dashboard")} size="sm">
          Back to Dashboard
        </NeonButton>
      </div>
    );
  }

  const proposalFile = team.proposal?.files?.[0];
  const proposalUrl = proposalFile ? `/api/uploads/${proposalFile.storageKey}` : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded hover:bg-bg-surface transition text-text-muted hover:text-text-primary"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-brand-primary bg-brand-dim px-2 py-0.5 rounded">
              {team.teamCode}
            </span>
            {existingScore && (
              <span className="text-[10px] text-green-400 bg-green-950/40 px-2 py-0.5 rounded border border-green-900/50 font-bold">
                Already Scored
              </span>
            )}
          </div>
          <h1 className="text-xl font-extrabold text-text-primary truncate mt-1">{team.teamName}</h1>
        </div>
        {/* Code freeze indicator */}
        {isFrozen && (
          <div className="flex items-center gap-2 px-3 py-2 rounded bg-red-950/30 border border-red-900/40 text-red-400 text-xs shrink-0">
            <Lock className="w-4 h-4" />
            <span className="font-bold">Code Freeze Active</span>
          </div>
        )}
      </div>

      {/* Side-by-side layout */}
      <div className="grid lg:grid-cols-2 gap-4 min-h-[calc(100vh-200px)]">
        {/* Left: PDF Viewer */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-primary" />
              Proposal Document
            </h3>
            {proposalUrl && (
              <a
                href={proposalUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[10px] text-brand-primary hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Open full
              </a>
            )}
          </div>

          {proposalUrl ? (
            <div className="rounded-xl border border-border/60 overflow-hidden bg-white" style={{ height: "calc(100vh - 280px)" }}>
              <iframe
                src={proposalUrl}
                className="w-full h-full border-0"
                title={`Proposal - ${team.teamName}`}
              />
            </div>
          ) : (
            <GlassPanel className="flex flex-col items-center justify-center py-16 space-y-3">
              <FileText className="w-10 h-10 text-text-muted" />
              <p className="text-sm font-bold text-text-primary">No Proposal Uploaded</p>
              <p className="text-xs text-text-muted">This team has not uploaded a proposal document yet.</p>
            </GlassPanel>
          )}
        </div>

        {/* Right: Scoring Form */}
        <div className="space-y-4">
          {/* Weighted score preview */}
          <GlassPanel className="flex items-center justify-between p-4">
            <div className="text-xs text-text-secondary">
              <p className="font-semibold text-text-primary">Weighted Score</p>
              <p className="text-text-muted mt-0.5">Final calculated score</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-extrabold font-mono text-brand-primary">{weightedPreview}</span>
              <span className="text-text-muted text-sm"> / 100</span>
            </div>
          </GlassPanel>

          <form onSubmit={handleSubmit((data) => scoreMutation.mutate(data))} className="space-y-3">
            {CRITERIA.map(({ key, label, weight, weightValue, description }) => (
              <GlassPanel key={key} className="space-y-3 p-4">
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-text-primary">{label}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">{description}</p>
                  </div>
                  <span className="text-[10px] font-bold text-brand-primary bg-brand-dim px-2 py-0.5 rounded shrink-0 ml-2">
                    {weight}
                  </span>
                </div>

                <Controller
                  name={key}
                  control={control}
                  rules={{ min: 1, max: 100 }}
                  render={({ field }) => (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-text-muted">
                        <span>0</span>
                        <span className="font-mono font-bold text-text-primary text-base">{field.value}</span>
                        <span>100</span>
                      </div>
                      <input
                        type="range"
                        min={0}
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
            <GlassPanel className="space-y-2 p-4">
              <p className="font-bold text-xs text-text-primary">Evaluation Notes</p>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    rows={3}
                    placeholder="Technical feedback, strengths, areas for improvement..."
                    className="w-full px-3 py-2 rounded bg-bg-surface border border-border text-xs text-text-primary focus:outline-none focus:border-brand-primary resize-none"
                  />
                )}
              />
            </GlassPanel>

            <NeonButton
              type="submit"
              disabled={scoreMutation.isPending || isFrozen}
              className="w-full flex items-center justify-center gap-2 py-3"
            >
              {isFrozen ? (
                <>
                  <Lock className="w-4 h-4" />
                  Code Freeze Active
                </>
              ) : scoreMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-bg-primary border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : existingScore ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Update Evaluation
                </>
              ) : (
                <>
                  <Gavel className="w-4 h-4" />
                  Submit Evaluation
                </>
              )}
            </NeonButton>

            {scoreMutation.isSuccess && (
              <p className="text-xs text-green-400 text-center">
                Score submitted successfully!
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
