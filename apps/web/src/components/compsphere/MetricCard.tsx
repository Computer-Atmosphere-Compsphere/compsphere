import React from "react";
import { GlassPanel } from "./GlassPanel";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  icon,
  description,
  className,
}: MetricCardProps) {
  return (
    <GlassPanel className={cn("flex flex-col justify-between h-32 border border-border hover:border-brand-dim transition-all duration-300", className)}>
      <div className="flex justify-between items-start">
        <span className="text-xs font-semibold tracking-wider text-text-muted uppercase">
          {title}
        </span>
        <div className="text-brand-primary opacity-80">{icon}</div>
      </div>
      <div className="mt-2">
        <div className="text-3xl font-extrabold tracking-tight text-glow-sm text-text-primary">
          {value}
        </div>
        {description && (
          <span className="text-[10px] text-text-muted mt-1 block font-medium">
            {description}
          </span>
        )}
      </div>
    </GlassPanel>
  );
}
