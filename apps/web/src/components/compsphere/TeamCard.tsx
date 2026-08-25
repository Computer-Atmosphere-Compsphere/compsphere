import React from "react";
import { GlassPanel } from "./GlassPanel";
import { StatusBadge } from "./StatusBadge";
import { Globe, Users, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompetitionTeam } from "@compsphere/types";

interface TeamCardProps {
  team: CompetitionTeam;
  onClick?: () => void;
  className?: string;
}

export function TeamCard({ team, onClick, className }: TeamCardProps) {
  return (
    <GlassPanel
      hoverEffect={!!onClick}
      onClick={onClick}
      className={cn(
        "border border-border flex flex-col justify-between cursor-pointer",
        onClick && "hover:border-brand-primary/30",
        className
      )}
    >
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider bg-brand-dim px-2 py-0.5 rounded">
            {team.teamCode}
          </span>
          <h4 className="font-bold text-lg text-text-primary mt-2 line-clamp-1">
            {team.teamName}
          </h4>
        </div>
        <StatusBadge status={team.status} />
      </div>

      <div className="flex gap-4 mt-6 text-xs text-text-secondary border-t border-border pt-4">
        <div className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-text-muted" />
          <span>{team.category}</span>
        </div>
        {team.countryMix && (
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-text-muted" />
            <span className="truncate max-w-[120px]">{team.countryMix}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 ml-auto">
          <Trophy className="w-3.5 h-3.5 text-text-muted" />
          <span>Devpost Rank: {team.originalRank}</span>
        </div>
      </div>
    </GlassPanel>
  );
}
