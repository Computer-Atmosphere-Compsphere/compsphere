import React from "react";
import { GlassPanel } from "./GlassPanel";
import { NeonButton } from "./NeonButton";
import { Shield, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminActionPanelProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => Promise<void>;
  isLoading?: boolean;
  variant?: "primary" | "destructive" | "secondary";
  className?: string;
}

export function AdminActionPanel({
  title,
  description,
  actionLabel,
  onAction,
  isLoading = false,
  variant = "primary",
  className,
}: AdminActionPanelProps) {
  return (
    <GlassPanel className={cn("border border-red-950/20 relative overflow-hidden", className)}>
      <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
        <Shield className="w-24 h-24 text-red-500" />
      </div>

      <div className="flex gap-4 items-start">
        <div className="w-10 h-10 rounded-md bg-red-950/30 border border-red-900/30 flex items-center justify-center text-red-400 shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        
        <div className="space-y-4 flex-1">
          <div>
            <h4 className="font-bold text-text-primary flex items-center gap-1.5">
              <span>{title}</span>
              <span className="text-[9px] font-bold text-red-400 bg-red-950/50 border border-red-900/50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                Admin
              </span>
            </h4>
            <p className="text-xs text-text-secondary mt-1">{description}</p>
          </div>

          <NeonButton
            onClick={onAction}
            disabled={isLoading}
            variant={variant === "destructive" ? "destructive" : variant === "secondary" ? "secondary" : "primary"}
            size="sm"
            className="w-full sm:w-fit"
          >
            {isLoading ? "Executing..." : actionLabel}
          </NeonButton>
        </div>
      </div>
    </GlassPanel>
  );
}
