import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api, getUploadUrl } from "@/lib/api";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { StatusBadge } from "@/components/compsphere/StatusBadge";
import { FileText, Globe } from "lucide-react";

export function Verification() {
  const { data: teams = [], isLoading } = useQuery<any[]>({
    queryKey: ["admin-international-verification"],
    queryFn: () => api.get("/api/admin/international-teams"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-text-primary">International Verification</h1>
        <p className="text-xs text-text-muted mt-1">Review commitment letters & student ID scans for international teams.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-primary" />
        </div>
      ) : teams.length === 0 ? (
        <GlassPanel className="p-8 text-center text-text-muted text-xs">
          No international teams pending document verification.
        </GlassPanel>
      ) : (
        <div className="space-y-3">
          {teams.map((team: any) => (
            <GlassPanel key={team.id} className="flex flex-wrap justify-between items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-brand-primary" />
                  <h4 className="font-bold text-sm text-text-primary">{team.teamName}</h4>
                </div>
                <p className="text-[10px] text-text-muted font-mono">{team.teamCode} · Rank #{team.originalRank}</p>
              </div>

              <div className="flex items-center gap-4">
                {team.latestDocumentKey && (
                  <a
                    href={getUploadUrl(team.latestDocumentKey)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-brand-primary hover:underline"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    View Document
                  </a>
                )}
                <StatusBadge status={team.status} />
              </div>
            </GlassPanel>
          ))}
        </div>
      )}
    </div>
  );
}
