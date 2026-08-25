import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { Link } from "react-router-dom";
import { FileText, ExternalLink } from "lucide-react";

export function Proposals() {
  const { data, isLoading } = useQuery<any>({
    queryKey: ["judge-proposals"],
    queryFn: () => api.get("/api/judges/proposals"),
  });

  const proposals: any[] = data?.proposals ?? [];

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-border">
        <h1 className="text-3xl font-extrabold text-text-primary">Proposal Review</h1>
        <p className="text-xs text-text-secondary mt-1">
          Download and review proposals submitted by your assigned teams.
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="w-7 h-7 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : proposals.length === 0 ? (
        <GlassPanel className="text-center py-14 space-y-3">
          <FileText className="w-10 h-10 text-brand-primary mx-auto" />
          <p className="text-sm font-bold text-text-primary">No Proposals Yet</p>
          <p className="text-xs text-text-muted">Proposals will appear here once teams submit them.</p>
        </GlassPanel>
      ) : (
        <div className="space-y-4">
          {proposals.map((p: any) => (
            <GlassPanel key={p.id} className="flex flex-wrap justify-between items-start gap-4">
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-text-primary">{p.teamName}</h4>
                <p className="text-[10px] text-text-muted font-mono">{p.teamCode}</p>
              </div>
              <div className="flex items-center gap-3">
                {p.fileStorageKey && (
                  <a
                    href={`/api/uploads/${p.fileStorageKey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-brand-primary hover:underline"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {p.filename || "Download PDF"}
                  </a>
                )}
                {p.linkUrl && (
                  <a
                    href={p.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-brand-primary hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Link
                  </a>
                )}
                <Link
                  to={`/judge/scoring/${p.teamId}`}
                  className="text-xs font-bold text-brand-primary hover:underline"
                >
                  Score →
                </Link>
              </div>
            </GlassPanel>
          ))}
        </div>
      )}
    </div>
  );
}
