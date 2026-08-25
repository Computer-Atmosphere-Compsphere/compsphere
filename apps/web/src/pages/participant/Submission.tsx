import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { NeonButton } from "@/components/compsphere/NeonButton";
import { AlertCircle, CheckCircle, FileText, Upload, Lock } from "lucide-react";
import { useForm } from "react-hook-form";

interface SubmissionForm {
  repositoryUrl: string;
  deploymentUrl?: string;
  slide?: FileList;
}

export function Submission() {
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { data: myTeam, isLoading } = useQuery<any>({
    queryKey: ["my-team"],
    queryFn: () => api.get("/api/teams/my-team"),
  });

  const { data: deadlineData } = useQuery<any>({
    queryKey: ["submission-deadline"],
    queryFn: () => api.get("/api/submissions/deadline"),
  });

  const submitMutation = useMutation({
    mutationFn: (formData: FormData) => api.post("/api/submissions/submit", formData),
    onSuccess: () => {
      setSuccessMsg("Deliverables submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ["my-team"] });
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Failed to submit deliverables.");
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<SubmissionForm>();

  const onSubmit = (data: SubmissionForm) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append("repositoryUrl", data.repositoryUrl.trim());
    if (data.deploymentUrl) {
      formData.append("deploymentUrl", data.deploymentUrl.trim());
    }

    if (data.slide && data.slide[0]) {
      formData.append("slide", data.slide[0]);
    } else if (!myTeam?.submission) {
      setErrorMsg("Presentation slides (PDF/PPT/PPTX) are required for your initial submission.");
      return;
    }

    submitMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!myTeam) return null;
  const { team, submissions } = myTeam;
  const submission = submissions?.[0] ?? null;
  const isLocked = deadlineData?.isExpired || team.status === "JUDGED";

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary">Deliverables Portal</h1>
          <p className="text-xs text-text-secondary mt-1">
            Submit your Phase 2 code repository and presentation slides.
          </p>
        </div>
        {isLocked ? (
          <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-950/40 border border-red-900/50 px-4 py-1.5 rounded-full">
            <Lock className="w-4.5 h-4.5" /> Locked
          </span>
        ) : (
          <span className="text-xs font-semibold text-brand-primary bg-brand-dim border border-brand-primary/20 px-4 py-1.5 rounded-full">
            Active
          </span>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <GlassPanel className="space-y-6">
            <h3 className="font-bold text-sm text-text-primary">Phase 2 Deliverables Form</h3>

            {errorMsg && (
              <div className="flex gap-2 p-3 bg-red-950/20 border border-red-900/30 text-red-400 text-xs rounded">
                <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex gap-2 p-3 bg-brand-dim border border-brand-primary/10 text-brand-primary text-xs rounded">
                <CheckCircle className="w-4.5 h-4.5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {isLocked ? (
              <div className="p-4 bg-red-950/20 border border-red-900/30 text-red-400 text-xs rounded flex gap-2">
                <Lock className="w-4.5 h-4.5 shrink-0" />
                <span>
                  The submission window has closed. All mutations or updates are locked server-side.
                </span>
              </div>
            ) : !["VERIFIED", "SUBMISSION_OPEN", "SUBMITTED"].includes(team.status) ? (
              <div className="p-4 bg-bg-surface border border-border text-xs text-text-muted rounded flex gap-2">
                <AlertCircle className="w-4.5 h-4.5 text-yellow-500 shrink-0" />
                <span>
                  You must confirm your team slot and have payment verification approved before you can submit Phase 2 deliverables.
                </span>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="repositoryUrl" className="text-xs font-semibold text-text-secondary uppercase">
                    Git Repository URL (GitHub / GitLab) *
                  </label>
                  <input
                    id="repositoryUrl"
                    type="url"
                    defaultValue={submission?.repositoryUrl}
                    placeholder="https://github.com/your-username/your-repo"
                    className="w-full px-3 py-2 rounded bg-bg-surface border border-border text-sm text-text-primary focus:outline-none focus:border-brand-primary"
                    {...register("repositoryUrl", { required: "Repository URL is required" })}
                  />
                  {errors.repositoryUrl && (
                    <span className="text-[10px] text-red-400 font-semibold">{errors.repositoryUrl.message}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label htmlFor="deploymentUrl" className="text-xs font-semibold text-text-secondary uppercase">
                    Live Deployment URL (Vercel / Netlify / Cloudflare - Optional)
                  </label>
                  <input
                    id="deploymentUrl"
                    type="url"
                    defaultValue={submission?.deploymentUrl || ""}
                    placeholder="https://your-app.vercel.app"
                    className="w-full px-3 py-2 rounded bg-bg-surface border border-border text-sm text-text-primary focus:outline-none focus:border-brand-primary"
                    {...register("deploymentUrl")}
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="slide" className="text-xs font-semibold text-text-secondary uppercase">
                    Presentation Slides (PDF / PPT / PPTX, Max 10MB) {submission ? "" : "*"}
                  </label>
                  <input
                    id="slide"
                    type="file"
                    accept="application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                    className="w-full px-3 py-2 rounded bg-bg-surface border border-border text-sm text-text-secondary focus:outline-none file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-brand-dim file:text-brand-primary cursor-pointer"
                    {...register("slide", { required: !submission && "Slides file is required" })}
                  />
                  {errors.slide && (
                    <span className="text-[10px] text-red-400 font-semibold">{errors.slide.message}</span>
                  )}
                </div>

                <NeonButton
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="w-full mt-6"
                >
                  {submitMutation.isPending ? "Submitting..." : submission ? "Update Submission" : "Submit Deliverables"}
                </NeonButton>
              </form>
            )}
          </GlassPanel>
        </div>

        {/* Info */}
        <GlassPanel className="space-y-6">
          <h3 className="font-bold text-sm text-text-primary">Submission Deadline</h3>
          {deadlineData?.deadline && (
            <div className="space-y-4 text-xs">
              <div className="bg-bg-surface p-4 rounded border border-border">
                <span className="text-text-muted block">Hard Lock Time</span>
                <span className="text-sm font-bold text-text-primary">
                  {new Date(deadlineData.deadline).toLocaleString("id-ID", {
                    timeZone: "Asia/Jakarta",
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
                <span className="text-[10px] text-brand-primary font-semibold block mt-1">Asia/Jakarta Timezone</span>
              </div>

              {submission && (
                <div className="space-y-2">
                  <span className="text-text-muted block font-semibold">Active Submission Details</span>
                  <div className="space-y-1.5 p-3 rounded bg-bg-surface border border-border">
                    <p className="font-semibold text-text-primary truncate">{submission.repositoryUrl}</p>
                    {submission.slideFilename && (
                      <div className="flex items-center gap-1.5 mt-2 bg-brand-dim/5 p-1 rounded text-brand-accent">
                        <FileText className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[130px]">{submission.slideFilename}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </GlassPanel>
      </div>
    </div>
  );
}
