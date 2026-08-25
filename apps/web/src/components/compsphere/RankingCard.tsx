import React from "react";
import { GlassPanel } from "./GlassPanel";
import { Trophy, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface RankingCardProps {
  originalRank: number;
  effectiveRank?: number;
  className?: string;
}

export function RankingCard({
  originalRank,
  effectiveRank,
  className,
}: RankingCardProps) {
  return (
    <GlassPanel className={cn("border border-border flex items-center justify-between p-4", className)}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-md bg-purple-950/40 border border-purple-900/50 flex items-center justify-center text-purple-400">
          <Trophy className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Devpost Rank
          </h4>
          <span className="text-2xl font-black font-mono text-text-primary">
            #{originalRank}
          </span>
        </div>
      </div>

      {effectiveRank && (
        <div className="flex items-center gap-3 border-l border-border pl-6">
          <div className="w-10 h-10 rounded-md bg-brand-dim border border-brand-primary/20 flex items-center justify-center text-brand-primary">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Effective Rank
            </h4>
            <span className="text-2xl font-black font-mono text-brand-primary text-glow-sm">
              #{effectiveRank}
            </span>
          </div>
        </div>
      )}
    </GlassPanel>
  );
}
