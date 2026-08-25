import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { NeonButton } from "@/components/compsphere/NeonButton";
import { AlertCircle, CheckCircle, Database, FileText, Users, Upload, Clock, Wifi } from "lucide-react";
import { useForm } from "react-hook-form";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface MemberInput {
  fullName: string;
  email: string;
}

interface ManualMigrationForm {
  teamName: string;
  category: "NATIONAL" | "MIX" | "INTERNATIONAL";
  proposalTitle: string;
  proposalDescription: string;
  devpostUrl: string;
  members: MemberInput[];
}

/**
 * Direct fetch wrapper for multipart FormData requests.
 * Bypasses the api.ts wrapper to avoid Content-Type header conflicts
 * that can occur with the Headers() constructor.
 */
async function fetchFormData<T>(endpoint: string, formData: FormData): Promise<T> {
  const url = API_BASE + endpoint;
  const response = await fetch(url, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  let json: any;
  try {
    json = await response.json();
  } catch {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }

  if (!response.ok || !json.success) {
    throw new Error(json.error || response.statusText || "Request failed");
  }

  return json.data as T;
}

export function Migration() {
  const queryClient = useQueryClient();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [extractedTitle, setExtractedTitle] = useState<string>("");

  const { register, handleSubmit, reset, setValue } = useForm<ManualMigrationForm>({
    defaultValues: {
      category: "NATIONAL",
      proposalTitle: "",
      proposalDescription: "",
      devpostUrl: "",
      members: [
        { fullName: "", email: "" },
        { fullName: "", email: "" },
        { fullName: "", email: "" },
      ],
    },
  });

  // Query to fetch recently migrated teams — auto-refreshes via SSE migration:team_added event
  const { data: recentTeams, isLoading: isRecentLoading } = useQuery<any[]>({
    queryKey: ["admin-recent-teams"],
    queryFn: () => api.get("/api/migration/recent-teams"),
    staleTime: 0,
  });

  const submitTeamMutation = useMutation({
    mutationFn: (formData: FormData) => fetchFormData<any>("/api/migration/submit-team", formData),
    onSuccess: (res: any) => {
      setSuccessMsg(
        `Team "${res.team.teamName}" registered! Token: ${res.token}`
      );
      setErrorMsg(null);
      reset();
      setPdfFile(null);
      setExtractedTitle("");
      queryClient.invalidateQueries({ queryKey: ["admin-recent-teams"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Failed to register team. Please check inputs.");
      setSuccessMsg(null);
    },
  });

  // Auto-fill title from filename (without extension)
  const extractTitleFromPdf = (file: File) => {
    setErrorMsg(null);
    const title = file.name.replace(/\.pdf$/i, "").replace(/[_-]/g, " ");
    setExtractedTitle(title);
    setValue("proposalTitle", title);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        setErrorMsg("Only PDF files are allowed.");
        setPdfFile(null);
        return;
      }
      setPdfFile(file);
      // Auto-extract title from PDF
      extractTitleFromPdf(file);
    }
  };

  const onSubmit = (data: ManualMigrationForm) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!pdfFile) {
      setErrorMsg("Please upload the team's proposal PDF document.");
      return;
    }

    // Leader (index 0) must be filled
    const leader = data.members[0];
    if (!leader?.fullName.trim() || !leader?.email.trim()) {
      setErrorMsg("Team Leader (Member 1) name and email are required.");
      return;
    }

    // Validate optional member 2 and 3: if one field is filled, both must be filled
    for (let i = 1; i < data.members.length; i++) {
      const m = data.members[i];
      const hasName = !!m.fullName.trim();
      const hasEmail = !!m.email.trim();
      if ((hasName && !hasEmail) || (!hasName && hasEmail)) {
        setErrorMsg(`Please complete both Name and Email for Member ${i + 1}, or leave both empty.`);
        return;
      }
    }

    // Filter out completely empty members
    const filledMembers = data.members.filter(
      (m) => m.fullName.trim() !== "" && m.email.trim() !== ""
    );

    const formData = new FormData();
    formData.append("teamName", data.teamName);
    formData.append("category", data.category);
    formData.append("proposalTitle", data.proposalTitle || extractedTitle || "");
    if (data.proposalDescription?.trim()) {
      formData.append("proposalDescription", data.proposalDescription.trim());
    }
    if (data.devpostUrl?.trim()) {
      formData.append("devpostUrl", data.devpostUrl.trim());
    }
    formData.append("members", JSON.stringify(filledMembers));
    formData.append("proposalFile", pdfFile);

    submitTeamMutation.mutate(formData);
  };


  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-border">
        <h1 className="text-3xl font-extrabold text-text-primary">Team Migration Manager</h1>
        <p className="text-xs text-text-secondary mt-1">
          Register new teams manually, specify members, upload proposal PDFs, and generate activation tokens.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            <GlassPanel className="space-y-6">
              <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
                <Database className="w-4 h-4 text-brand-primary" />
                <span>Team Registration Form</span>
              </h3>

              {errorMsg && (
                <div className="flex gap-2 p-3 bg-red-950/20 border border-red-900/30 text-red-400 text-xs rounded">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex gap-2 p-3 bg-brand-dim border border-brand-primary/20 text-brand-primary text-xs rounded">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* SECTION 1: TEAM BASIC INFO */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-brand-primary uppercase tracking-widest border-b border-border/40 pb-2">
                  1. Team Information
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="teamName" className="text-[10px] font-semibold text-text-secondary uppercase">
                      Team Name
                    </label>
                    <input
                      id="teamName"
                      type="text"
                      {...register("teamName", { required: true })}
                      placeholder="e.g. Cyber Guardians"
                      className="w-full px-3 py-2 rounded bg-bg-surface border border-border text-sm text-text-primary focus:outline-none focus:border-brand-primary/60 transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="category" className="text-[10px] font-semibold text-text-secondary uppercase">
                      Category
                    </label>
                    <select
                      id="category"
                      {...register("category", { required: true })}
                      className="w-full px-3 py-2 rounded bg-bg-surface border border-border text-sm text-text-primary focus:outline-none focus:border-brand-primary/60 transition"
                    >
                      <option value="NATIONAL">National</option>
                      <option value="MIX">Mix</option>
                      <option value="INTERNATIONAL">International</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: TEAM MEMBERS */}
              <div className="space-y-4 pt-2">
                <h4 className="text-[11px] font-bold text-brand-primary uppercase tracking-widest border-b border-border/40 pb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>2. Team Members</span>
                </h4>

                <div className="space-y-4 divide-y divide-border/20">
                  {/* Leader */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-text-primary bg-brand-dim px-2 py-0.5 rounded">
                      Member 1 (Team Leader) <span className="text-red-400">*</span>
                    </span>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-semibold text-text-muted uppercase">Full Name</label>
                        <input
                          type="text"
                          {...register("members.0.fullName", { required: true })}
                          placeholder="Leader Full Name"
                          className="w-full px-3 py-1.5 rounded bg-bg-surface border border-border text-xs text-text-primary focus:outline-none focus:border-brand-primary/60 transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-semibold text-text-muted uppercase">Email Address</label>
                        <input
                          type="email"
                          {...register("members.0.email", { required: true })}
                          placeholder="leader@email.com"
                          className="w-full px-3 py-1.5 rounded bg-bg-surface border border-border text-xs text-text-primary focus:outline-none focus:border-brand-primary/60 transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Member 2 */}
                  {/* <div className="space-y-2 pt-3">
                    <span className="text-[10px] font-bold text-text-secondary bg-bg-surface border border-border px-2 py-0.5 rounded flex items-center gap-1.5 w-max">
                      Member 2 <span className="text-[9px] text-text-muted font-normal">(Optional)</span>
                    </span>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-semibold text-text-muted uppercase">Full Name</label>
                        <input
                          type="text"
                          {...register("members.1.fullName")}
                          placeholder="Member 2 Full Name"
                          className="w-full px-3 py-1.5 rounded bg-bg-surface border border-border text-xs text-text-primary focus:outline-none focus:border-brand-primary/60 transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-semibold text-text-muted uppercase">Email Address</label>
                        <input
                          type="email"
                          {...register("members.1.email")}
                          placeholder="member2@email.com"
                          className="w-full px-3 py-1.5 rounded bg-bg-surface border border-border text-xs text-text-primary focus:outline-none focus:border-brand-primary/60 transition"
                        />
                      </div>
                    </div>
                  </div> */}

                  {/* Member 3 */}
                  {/* <div className="space-y-2 pt-3">
                    <span className="text-[10px] font-bold text-text-secondary bg-bg-surface border border-border px-2 py-0.5 rounded flex items-center gap-1.5 w-max">
                      Member 3 <span className="text-[9px] text-text-muted font-normal">(Optional)</span>
                    </span>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-semibold text-text-muted uppercase">Full Name</label>
                        <input
                          type="text"
                          {...register("members.2.fullName")}
                          placeholder="Member 3 Full Name"
                          className="w-full px-3 py-1.5 rounded bg-bg-surface border border-border text-xs text-text-primary focus:outline-none focus:border-brand-primary/60 transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-semibold text-text-muted uppercase">Email Address</label>
                        <input
                          type="email"
                          {...register("members.2.email")}
                          placeholder="member3@email.com"
                          className="w-full px-3 py-1.5 rounded bg-bg-surface border border-border text-xs text-text-primary focus:outline-none focus:border-brand-primary/60 transition"
                        />
                      </div>
                    </div>
                  </div> */}

                </div>
              </div>

              {/* SECTION 3: PROPOSAL UPLOAD — Title auto-extracted from PDF */}
              <div className="space-y-4 pt-2">
                <h4 className="text-[11px] font-bold text-brand-primary uppercase tracking-widest border-b border-border/40 pb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>3. Proposal Submission</span>
                </h4>

                <div className="space-y-4">
                  {/* Proposal title — always visible, auto-filled after PDF upload */}
                  <div className="space-y-1">
                    <label htmlFor="proposalTitle" className="text-[10px] font-semibold text-text-secondary uppercase">
                      Proposal Title <span className="text-red-400">*</span>
                      {extractedTitle && (
                        <span className="text-brand-primary ml-1">(auto-filled from PDF)</span>
                      )}
                    </label>
                    <input
                      id="proposalTitle"
                      type="text"
                      {...register("proposalTitle", { required: true })}
                      placeholder="Enter or auto-fill proposal title"
                      className={`w-full px-3 py-2 rounded text-sm text-text-primary focus:outline-none focus:border-brand-primary/60 transition ${
                        extractedTitle
                          ? "bg-brand-dim/30 border border-brand-primary/20 font-medium"
                          : "bg-bg-surface border border-border"
                      }`}
                    />
                    <p className="text-[9px] text-text-muted">
                      {extractedTitle
                        ? "Title auto-extracted from PDF. You can still edit it."
                        : "Upload a PDF to auto-fill, or type the title manually."}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="proposalFile" className="text-[10px] font-semibold text-text-secondary uppercase flex items-center gap-1">
                      <Upload className="w-3 h-3 text-brand-primary" />
                      <span>Upload Proposal Document (PDF Only) <span className="text-red-400">*</span></span>
                    </label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-border/80 rounded-lg cursor-pointer bg-bg-surface/50 hover:bg-bg-surface hover:border-brand-primary/40 transition">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                          <p className="text-xs text-text-secondary">
                            {pdfFile ? (
                              <span className="text-brand-primary font-semibold">{pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                            ) : (
                              <span>Click to upload proposal PDF</span>
                            )}
                          </p>
                          <p className="text-[10px] text-text-muted mt-1">PDF max 10MB • Title auto-filled from filename</p>
                        </div>
                        <input
                          id="proposalFile"
                          type="file"
                          accept=".pdf"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Devpost URL — optional */}
                  <div className="space-y-1">
                    <label htmlFor="devpostUrl" className="text-[10px] font-semibold text-text-secondary uppercase flex items-center gap-1.5">
                      Devpost URL
                      <span className="text-[9px] font-normal text-text-muted normal-case">(optional)</span>
                    </label>
                    <input
                      id="devpostUrl"
                      type="url"
                      {...register("devpostUrl")}
                      placeholder="https://devpost.com/software/your-project"
                      className="w-full px-3 py-2 rounded bg-bg-surface border border-border text-sm text-text-primary focus:outline-none focus:border-brand-primary/60 transition placeholder:text-text-muted/50"
                    />
                    <p className="text-[9px] text-text-muted">Link to the team's Devpost project page, if available.</p>
                  </div>

                  {/* Proposal Description — optional */}
                  <div className="space-y-1">
                    <label htmlFor="proposalDescription" className="text-[10px] font-semibold text-text-secondary uppercase flex items-center gap-1.5">
                      Proposal Description
                      <span className="text-[9px] font-normal text-text-muted normal-case">(optional)</span>
                    </label>
                    <textarea
                      id="proposalDescription"
                      rows={3}
                      {...register("proposalDescription")}
                      placeholder="Brief summary of the proposal — what problem it solves, key features, target users, etc."
                      className="w-full px-3 py-2 rounded bg-bg-surface border border-border text-sm text-text-primary focus:outline-none focus:border-brand-primary/60 transition resize-none placeholder:text-text-muted/50"
                    />
                    <p className="text-[9px] text-text-muted">Short description of the project. Leave blank to skip.</p>
                  </div>
                </div>
              </div>

              <NeonButton
                type="submit"
                disabled={submitTeamMutation.isPending}
                className="w-full py-2.5 mt-4"
              >
                {submitTeamMutation.isPending ? "Registering & Uploading..." : "Submit Manual Migration"}
              </NeonButton>
            </GlassPanel>
          </form>
        </div>

        {/* ── RIGHT PANEL: Real-time Recent Teams ── */}
        <GlassPanel className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-primary" />
              <span>Recently Added Teams</span>
            </h3>
            {/* SSE live dot */}
            <span className="flex items-center gap-1.5 text-[9px] font-semibold text-brand-primary bg-brand-dim px-2 py-0.5 rounded-full">
              <Wifi className="w-3 h-3 animate-pulse" />
              LIVE
            </span>
          </div>

          {isRecentLoading ? (
            <div className="w-5 h-5 border border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
          ) : recentTeams && recentTeams.length > 0 ? (
            <div className="space-y-2.5 overflow-y-auto max-h-[640px] pr-1.5">
              {recentTeams.map((t: any, idx: number) => {
                const categoryColor =
                  t.category === "NATIONAL"
                    ? "bg-sky-950/40 text-sky-400"
                    : t.category === "INTERNATIONAL"
                      ? "bg-purple-950/40 text-purple-400"
                      : "bg-amber-950/40 text-amber-400";

                const statusColor =
                  t.status === "TOP30"
                    ? "bg-brand-dim text-brand-primary"
                    : t.status === "NEW"
                      ? "bg-slate-950/40 text-slate-400"
                      : "bg-zinc-800 text-zinc-400";

                const timeAgo = (() => {
                  const diff = Date.now() - new Date(t.created_at).getTime();
                  const mins = Math.floor(diff / 60000);
                  if (mins < 1) return "just now";
                  if (mins < 60) return `${mins}m ago`;
                  const hrs = Math.floor(mins / 60);
                  if (hrs < 24) return `${hrs}h ago`;
                  return `${Math.floor(hrs / 24)}d ago`;
                })();

                return (
                  <div
                    key={t.id ?? idx}
                    className={`text-xs bg-bg-surface border border-border/80 rounded-lg p-3 space-y-2 transition-all ${idx === 0 ? "ring-1 ring-brand-primary/20" : ""
                      }`}
                  >
                    {/* Top row: name + time */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-text-primary leading-tight">{t.team_name}</p>
                      <span className="text-[9px] text-text-muted whitespace-nowrap shrink-0">{timeAgo}</span>
                    </div>

                    {/* Proposal title */}
                    {t.proposal_title && (
                      <p className="text-[10px] text-text-secondary truncate" title={t.proposal_title}>
                        {t.proposal_title}
                      </p>
                    )}

                    {/* Badges row */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[9px] text-text-muted bg-bg-surface border border-border/60 px-1.5 py-0.5 rounded">
                        {t.team_code}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${categoryColor}`}>
                        {t.category}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${statusColor}`}>
                        {t.status}
                      </span>
                      <span className="text-[9px] text-text-muted ml-auto">
                        {t.member_count ?? 0} member{(t.member_count ?? 0) !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 space-y-2">
              <Users className="w-8 h-8 text-text-muted mx-auto" />
              <p className="text-xs text-text-muted">No teams registered yet.</p>
              <p className="text-[10px] text-text-muted/60">Submit the form to add the first team.</p>
            </div>
          )}
        </GlassPanel>
      </div>
    </div>
  );
}
