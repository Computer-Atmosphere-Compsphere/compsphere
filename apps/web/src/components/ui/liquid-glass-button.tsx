import React from "react";
import { cn } from "@/lib/utils";

interface LiquidGlassButtonProps {
  label: string;
  onClick?: () => void;
  size?: "sm" | "lg";
  variant?: "glass" | "register" | "destructive";
  className?: string;
  icon?: React.ReactNode;
}

/**
 * LiquidGlassButton — soft glassmorphism pill button.
 * Translucent glass body, top sheen, liquid highlight blob, light text.
 * variant="register" adds a blue-green gradient accent.
 */
export function LiquidGlassButton({
  label,
  onClick,
  size = "sm",
  variant = "glass",
  className,
  icon,
}: LiquidGlassButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden rounded-full border font-semibold transition-all duration-300 ease-out",
        variant === "destructive" ? "text-red-300/90" : "text-white",
        variant === "register"
          ? "border-sky-300/30 bg-gradient-to-r from-sky-400/25 via-cyan-400/15 to-emerald-400/30 shadow-[0_2px_16px_rgba(0,0,0,0.25),0_0_20px_rgba(56,189,248,0.12),inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-2xl backdrop-saturate-150"
          : variant === "destructive"
          ? "border-red-400/20 bg-white/[0.06] shadow-[0_2px_16px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-2xl backdrop-saturate-150"
          : "border-white/15 bg-white/[0.07] shadow-[0_2px_16px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-2xl backdrop-saturate-150",
        variant === "register"
          ? "hover:border-sky-300/50 hover:shadow-[0_4px_28px_rgba(56,189,248,0.3),inset_0_1px_0_rgba(255,255,255,0.35)] hover:-translate-y-0.5"
          : variant === "destructive"
          ? "hover:border-red-400/40 hover:bg-red-500/10 hover:shadow-[0_4px_28px_rgba(239,68,68,0.15),inset_0_1px_0_rgba(255,255,255,0.2)] hover:-translate-y-0.5"
          : "hover:border-white/30 hover:bg-white/[0.11] hover:shadow-[0_4px_24px_rgba(0,245,200,0.12),inset_0_1px_0_rgba(255,255,255,0.25)] hover:-translate-y-0.5",
        "active:translate-y-0 active:scale-[0.97]",
        size === "sm" ? "h-9 px-5 text-xs" : "h-12 px-8 text-sm",
        className,
      )}
    >
      {/* Top sheen */}
      <span
        className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
        aria-hidden
      />
      {/* Liquid highlight blob */}
      <span
        className={cn(
          "pointer-events-none absolute -top-8 left-1/2 h-16 w-24 -translate-x-1/2 rounded-full blur-2xl transition-all duration-500 group-hover:bg-white/30",
          variant === "register" ? "bg-sky-300/40" : variant === "destructive" ? "bg-red-400/30" : "bg-white/20",
        )}
        aria-hidden
      />
      {icon}
      <span className="relative">{label}</span>
    </button>
  );
}