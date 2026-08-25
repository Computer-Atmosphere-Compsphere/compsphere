import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { StatusBadge } from "@/components/compsphere/StatusBadge";
import { FileCode2, Link as LinkIcon, Package } from "lucide-react";

export function Submissions() {
  const { data, isLoading } = useQuery<any[]>({
    queryKey: ["admin-submissions"],
    queryFn: () => api.get("/api/admin/submissions"),
    refetchInterval: 30_000,
  });

  const submissions: any[] = data ?? [];
  const submitted = submissions.filter((s) => s.status === "SUBMITTED" || s.status === "LOCKED");
  const pending = submissions.filter((s) => s.status === "PENDING");

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-border flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary">Submissions Monitor</h1>
          <p className="text-xs text-text-secondary mt-1">
            Track Phase 2 deliverables: proposals, PPTs, prototypes, and videos.
          </p>
        </div>
        <div className="flex gap-6 text-center text-xs">
          <div>
            <p className="text-brand-primary font-mono font-bold text-2xl">{submitted.length}</p>
            <p className="text-text-muted">Submitted</p>
          </div>
          <div>
            <p className="text-yellow-400 font-mono font-bold text-2xl">{pending.length}</p>
            <p className="text-text-muted">Missing</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="w-7 h-7 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-border">
          <table className="min-w-full text-xs text-left">
            <thead className="bg-bg-surface text-text-muted uppercase border-b border-border">
              <tr>
                <th className="px-4 py-3">Team</th>
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
                        href={`/api/uploads/${s.fileStorageKey}`}
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
