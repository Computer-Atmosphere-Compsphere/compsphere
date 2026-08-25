import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { NeonButton } from "@/components/compsphere/NeonButton";
import { Shield, Link, Copy, Check, Users, AlertTriangle } from "lucide-react";

export function Team() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: myTeam, isLoading } = useQuery<any>({
    queryKey: ["my-team"],
    queryFn: () => api.get("/api/teams/my-team"),
  });

  const generateInviteMutation = useMutation({
    mutationFn: () => api.post<any>("/api/members/invite"),
    onSuccess: (data) => {
      const origin = window.location.origin;
      setInviteUrl(`${origin}/onboarding/participant?invite=${data.token}`);
      queryClient.invalidateQueries({ queryKey: ["my-team"] });
    },
  });

  const handleCopy = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!myTeam) return null;

  const { team, members } = myTeam;
  const isLeader = user?.memberRole === "TEAM_LEADER";

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-border">
        <h1 className="text-3xl font-extrabold text-text-primary">Team Space</h1>
        <p className="text-xs text-text-secondary mt-1">
          Manage team members and workspace invitation links.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Members List */}
        <div className="md:col-span-2 space-y-4">
          <GlassPanel className="space-y-6">
            <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-primary" />
              <span>Workspace Members</span>
            </h3>

            <div className="divide-y divide-border/40">
              {members.map((m: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    {m.user?.avatarUrl ? (
                      <img src={m.user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full border border-border" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-brand-dim flex items-center justify-center font-bold text-brand-primary">
                        {m.user?.fullName?.[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-sm text-text-primary">{m.user?.fullName}</p>
                      <p className="text-xs text-text-secondary mt-0.5">{m.user?.email}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    m.role === "TEAM_LEADER" 
                      ? "bg-brand-dim text-brand-primary border border-brand-primary/10" 
                      : "bg-bg-surface text-text-secondary border border-border"
                  }`}>
                    {m.role === "TEAM_LEADER" ? "Leader" : "Member"}
                  </span>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>

        {/* Action Panel / Invite Links */}
        <div className="space-y-4">
          {isLeader ? (
            <GlassPanel className="space-y-6 border border-brand-dim">
              <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
                <Link className="w-4 h-4 text-brand-primary" />
                <span>Invite Members</span>
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Generate a unique invitation link and share it with your team members to add them to your workspace.
              </p>

              {inviteUrl ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={inviteUrl}
                      className="w-full text-xs px-2.5 py-2 rounded bg-bg-surface border border-border text-text-secondary focus:outline-none"
                    />
                    <button
                      onClick={handleCopy}
                      className="p-2 rounded bg-brand-primary text-bg-primary hover:bg-brand-secondary active:scale-95 transition-all"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-text-muted">
                    This link expires in 48 hours and can only be used by authenticated users.
                  </p>
                </div>
              ) : (
                <NeonButton
                  onClick={() => generateInviteMutation.mutate()}
                  disabled={generateInviteMutation.isPending}
                  size="sm"
                  className="w-full"
                >
                  Generate Invitation Link
                </NeonButton>
              )}
            </GlassPanel>
          ) : (
            <GlassPanel className="space-y-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              <h3 className="font-bold text-sm text-text-primary">Member Limitations</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Only the team leader (<strong>{members.find((m: any) => m.role === "TEAM_LEADER")?.user?.fullName || "Leader"}</strong>) can generate invitation links or change the workspace configurations.
              </p>
            </GlassPanel>
          )}
        </div>
      </div>
    </div>
  );
}
