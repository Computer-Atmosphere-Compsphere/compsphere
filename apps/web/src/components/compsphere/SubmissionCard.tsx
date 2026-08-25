import React from "react";
import { GlassPanel } from "./GlassPanel";
import { NeonButton } from "./NeonButton";
import { AlertCircle, CheckCircle2, FileText, Github, Globe, Lock, Upload } from "lucide-react";
import type { CompetitionTeam, Submission } from "@compsphere/types";

interface SubmissionCardProps {
  team: CompetitionTeam;
  submission: Submission | null;
  onSubmitClick: () => void;
  isExpired: boolean;
  className?: string;
}

export function SubmissionCard({
  team,
  submission,
  onSubmitClick,
  isExpired,
  className,
}: SubmissionCardProps) {
  const isSubmissionAllowed = 
    ["VERIFIED", "SUBMISSION_OPEN", "SUBMITTED", "JUDGED"].includes(team.status) && !isExpired;

  return (
    <GlassPanel className={className}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-lg text-text-primary">Phase 2 Deliverables</h3>
        {isExpired ? (
          <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-950/40 border border-red-900/50 px-2.5 py-0.5 rounded-full">
            <Lock className="w-3.5 h-3.5" /> Locked
          </span>
        ) : (
          <span className="text-xs font-semibold text-brand-primary bg-brand-dim border border-brand-primary/20 px-2.5 py-0.5 rounded-full">
            Open
          </span>
        )}
      </div>

      {!submission ? (
        <div className="flex flex-col gap-5 text-sm text-text-secondary">
          <div className="flex gap-2 items-start">
            <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0" />
            <div>
              <p className="font-semibold text-text-primary">No submission yet</p>
              <p className="text-xs text-text-muted mt-0.5">
                Prepare your Git repository link (GitHub/GitLab) and presentation slides (PDF/PPT/PPTX, max 10MB) to submit.
              </p>
            </div>
          </div>
          {isSubmissionAllowed ? (
            <NeonButton onClick={onSubmitClick} className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              Submit Deliverables
            </NeonButton>
          ) : (
            <div className="p-3 text-xs bg-bg-surface border border-border rounded text-text-muted text-center">
              {!isSubmissionAllowed && team.status !== "VERIFIED" 
                ? "Verify your team payment first to unlock submission."
                : "Submission window has closed."}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6 text-sm">
          <div className="flex gap-2.5 items-start text-brand-primary">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">Deliverables Submitted</p>
              <p className="text-xs text-text-muted mt-0.5">
                Last updated at {new Date(submission.submittedAt).toLocaleString("id-ID")}.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded bg-bg-surface border border-border">
              <div className="flex items-center gap-2">
                <Github className="w-4 h-4 text-text-secondary" />
                <span className="font-medium text-text-primary">Repository</span>
              </div>
              <a
                href={submission.repositoryUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-brand-accent hover:underline truncate max-w-[200px]"
              >
                {submission.repositoryUrl}
              </a>
            </div>

            {submission.deploymentUrl && (
              <div className="flex items-center justify-between p-3 rounded bg-bg-surface border border-border">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-text-secondary" />
                  <span className="font-medium text-text-primary">Deployment</span>
                </div>
                <a
                  href={submission.deploymentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-brand-accent hover:underline truncate max-w-[200px]"
                >
                  {submission.deploymentUrl}
                </a>
              </div>
            )}

            {submission.slideFilename && (
              <div className="flex items-center justify-between p-3 rounded bg-bg-surface border border-border">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-text-secondary" />
                  <span className="font-medium text-text-primary">Slides</span>
                </div>
                <span className="text-xs text-text-muted truncate max-w-[200px]">
                  {submission.slideFilename}
                </span>
              </div>
            )}
          </div>

          {isSubmissionAllowed && (
            <NeonButton onClick={onSubmitClick} variant="secondary" className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              Update Deliverables
            </NeonButton>
          )}
        </div>
      )}
    </GlassPanel>
  );
}
