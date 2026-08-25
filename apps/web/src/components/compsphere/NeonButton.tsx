import React from "react";
import { cn } from "@/lib/utils";

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "ghost";
  size?: "sm" | "md" | "lg";
  glowing?: boolean;
}

export function NeonButton({
  children,
  className,
  variant = "primary",
  size = "md",
  glowing = false,
  ...props
}: NeonButtonProps) {
  return (
    <button
      className={cn(
        "relative inline-flex items-center justify-center font-semibold rounded-md transition-all duration-300 active:scale-95 disabled:pointer-events-none disabled:opacity-50",
        // Sizes
        size === "sm" && "px-3 py-1.5 text-xs",
        size === "md" && "px-5 py-2 text-sm",
        size === "lg" && "px-8 py-3 text-base",
        // Variants
        variant === "primary" && 
          "bg-brand-primary text-bg-primary hover:bg-brand-secondary border border-transparent shadow-[0_0_15px_rgba(0,245,200,0.2)] hover:shadow-[0_0_25px_rgba(0,245,200,0.5)]",
        variant === "secondary" && 
          "bg-bg-surface text-brand-primary border border-brand-dim hover:border-brand-primary hover:shadow-[0_0_15px_rgba(0,245,200,0.2)]",
        variant === "destructive" && 
          "bg-red-950/40 text-red-400 border border-red-900/30 hover:border-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]",
        variant === "ghost" && 
          "bg-transparent text-text-secondary hover:bg-bg-surface hover:text-text-primary",
        glowing && "animate-pulse-glow",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
