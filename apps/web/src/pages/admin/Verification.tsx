import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { StatusBadge } from "@/components/compsphere/StatusBadge";
import { Globe, FileText, Download } from "lucide-react";

export function Verification() {
  const { data, isLoading } = useQuery<any>({
    queryKey: ["admin-verification"],
    queryFn: () => api.get("/api/admin/teams?category=INTERNATIONAL"),
  });

  const teams: any[] = data ?? [];

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-border">
        <h1 className="text-3xl font-extrabold text-text-primary">International Verification</h1>
        <p className="text-xs text-text-secondary mt-1">
          Review identity and commitment letter documents submitted by international teams.
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="w-7 h-7 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : teams.length === 0 ? (
        <GlassPanel className="text-center py-14 space-y-3">
          <Globe className="w-10 h-10 text-brand-primary mx-auto" />
          <p className="text-sm font-bold text-text-primary">No International Teams</p>
          <p className="text-xs text-text-muted">No international category submissions found.</p>
        </GlassPanel>
      ) : (
        <div className="space-y-4">
          {teams.map((team: any) => (
            <GlassPanel key={team.id} className="flex flex-wrap justify-between items-start gap-4">
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
                    href={`/api/uploads/${team.latestDocumentKey}`}
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
