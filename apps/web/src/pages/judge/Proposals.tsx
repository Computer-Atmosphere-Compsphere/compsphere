import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, getUploadUrl } from "@/lib/api";
import { Link } from "react-router-dom";
import {
  FileText,
  ExternalLink,
  Search,
  Sparkles,
  BookOpen,
  Tag,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export function Proposals() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = useQuery<any>({
    queryKey: ["judge-proposals"],
    queryFn: () => api.get("/api/judges/proposals"),
  });

  const rawProposals: any[] = data?.proposals ?? [];

  const proposals = rawProposals.filter((p) => {
    const q = searchTerm.toLowerCase();
    return (
      !searchTerm ||
      p.teamName?.toLowerCase().includes(q) ||
      p.teamCode?.toLowerCase().includes(q) ||
      p.proposalTitle?.toLowerCase().includes(q) ||
      p.title?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full max-w-none px-0 pb-16 min-h-screen">
      {/* Top Header & Search Bar */}
      <div
        className="sticky top-0 z-20 flex flex-col gap-0"
        style={{
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,245,200,0.09)",
        }}
      >
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-brand-primary uppercase tracking-widest opacity-80">
              <ShieldCheck className="w-3.5 h-3.5" /> Judge Review Console
            </span>
            <span className="text-border">│</span>
            <h1 className="text-base font-bold text-text-primary tracking-tight">
              Proposal Document Registry
            </h1>
            <span
              className="text-[11px] font-mono font-bold px-2 py-0.5 rounded"
              style={{
                background: "rgba(0,245,200,0.08)",
                border: "1px solid rgba(0,245,200,0.2)",
                color: "#00f5c8",
              }}
            >
              {rawProposals.length} DOCUMENTS
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search proposal title, team..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-[11px] rounded border focus:outline-none focus:border-brand-primary/50 transition-colors"
              style={{
                width: "240px",
                background: "rgba(255,255,255,0.04)",
                borderColor: "rgba(255,255,255,0.08)",
                color: "#fff",
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Registry View */}
      <div className="px-6 pt-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div
              className="w-7 h-7 rounded-full border-2 animate-spin"
              style={{ borderColor: "rgba(0,245,200,0.2)", borderTopColor: "#00f5c8" }}
            />
            <span className="text-xs text-text-muted font-mono">Loading proposal documents...</span>
          </div>
        ) : proposals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
            <BookOpen className="w-10 h-10 text-text-muted" />
            <p className="text-sm font-bold text-text-primary">No Matching Proposals</p>
            <p className="text-xs text-text-muted max-w-xs">
              Try modifying your search query to inspect assigned team proposals.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {proposals.map((p: any) => {
              const fileKey = p.fileStorageKey || p.storageKey;
              const pdfUrl = fileKey ? getUploadUrl(fileKey) : null;
              const title = p.proposalTitle || p.title || `Proposal Inovasi ${p.teamName}`;

              return (
                <div
                  key={p.id || p.teamId}
                  className="group relative flex flex-col justify-between p-5 rounded-xl transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(0,245,200,0.04)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,245,200,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.025)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
                  }}
                >
                  <div className="space-y-3">
                    {/* Top tags */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                        style={{
                          background: "rgba(0,245,200,0.08)",
                          border: "1px solid rgba(0,245,200,0.2)",
                          color: "#00f5c8",
                        }}
                      >
                        {p.teamCode}
                      </span>
                      {pdfUrl ? (
                        <span className="text-[10px] font-mono text-green-400 flex items-center gap-1 bg-green-950/40 border border-green-900/50 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" /> PDF Storage Verified
                        </span>
                      ) : (
                        <span className="text-[10px] text-yellow-500 flex items-center gap-1 bg-yellow-950/40 border border-yellow-900/40 px-2 py-0.5 rounded">
                          <AlertTriangle className="w-3 h-3" /> PDF Pending
                        </span>
                      )}
                    </div>

                    {/* Team & Proposal Title */}
                    <div>
                      <h3 className="text-sm font-extrabold text-text-primary group-hover:text-brand-primary transition-colors">
                        {p.teamName}
                      </h3>
                      <p className="text-xs text-text-secondary font-medium mt-1 line-clamp-2 leading-relaxed">
                        <FileText className="w-3.5 h-3.5 inline mr-1 text-brand-primary" />
                        {title}
                      </p>
                    </div>
                  </div>

                  {/* Footer Action Links */}
                  <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between gap-2">
                    {pdfUrl ? (
                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-brand-primary hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> View PDF
                      </a>
                    ) : (
                      <span className="text-[11px] text-text-muted">—</span>
                    )}

                    <Link
                      to={`/judge/scoring/${p.teamId}`}
                      className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded transition-all"
                      style={{
                        background: "rgba(0,245,200,0.1)",
                        border: "1px solid rgba(0,245,200,0.25)",
                        color: "#00f5c8",
                      }}
                    >
                      <Sparkles className="w-3 h-3" /> Evaluate Team <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
