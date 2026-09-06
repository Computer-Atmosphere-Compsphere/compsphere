import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api, getUploadUrl } from "@/lib/api";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { StatusBadge } from "@/components/compsphere/StatusBadge";
import { FileCode2, Package, Link as LinkIcon, RefreshCw, FolderGit2 } from "lucide-react";

export function Submissions() {
  const { data: submissions = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["admin-submissions"],
    queryFn: () => api.get("/api/admin/submissions"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary">Deliverables & Submissions</h1>
          <p className="text-xs text-text-muted mt-1">
            Track Phase 2 deliverables: proposals, PPTs, prototypes, and videos.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 rounded bg-bg-surface border border-border text-text-muted hover:text-text-primary transition"
          title="Refresh submissions"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-primary" />
        </div>
      ) : submissions.length === 0 ? (
        <GlassPanel className="p-8 text-center">
          <FolderGit2 className="w-10 h-10 text-text-muted mx-auto mb-2 opacity-50" />
          <p className="text-sm font-bold text-text-primary">No submissions recorded</p>
          <p className="text-xs text-text-muted mt-1">Deliverables submitted by teams will appear here.</p>
        </GlassPanel>
      ) : (
        <div className="border border-border rounded-xl bg-bg-surface/50 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg-surface border-b border-border font-bold uppercase text-[10px] text-text-muted">
              <tr>
                <th className="px-4 py-3">Team Code</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">File / Link</th>
                <th className="px-4 py-3">Submitted At</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-text-secondary">
              {submissions.map((s: any) => (
                <tr key={s.id} className="hover:bg-bg-surface/30 transition">
                  <td className="px-4 py-3 font-mono font-bold">{s.teamCode ?? s.teamId?.slice(0, 8)}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5">
                      {s.type === "PROPOSAL" && <FileCode2 className="w-3 h-3 text-purple-400" />}
                      {s.type === "VIDEO" && <Package className="w-3 h-3 text-yellow-400" />}
                      {s.type === "PROTOTYPE" && <LinkIcon className="w-3 h-3 text-brand-primary" />}
                      {s.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {s.fileStorageKey ? (
                      <a
                        href={getUploadUrl(s.fileStorageKey)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-primary hover:underline"
                      >
                        {s.filename || "Download"}
                      </a>
                    ) : s.linkUrl ? (
                      <a
                        href={s.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-primary hover:underline"
                      >
                        {s.linkUrl.slice(0, 40)}…
                      </a>
                    ) : (
                      <span className="text-text-muted italic">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {s.submittedAt
                      ? new Date(s.submittedAt).toLocaleString("id-ID")
                      : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
