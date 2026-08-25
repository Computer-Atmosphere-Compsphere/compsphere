import React from "react";
import { cn } from "@/lib/utils";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export function GlassPanel({
  children,
  className,
  hoverEffect = false,
  ...props
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        "glass-panel rounded-lg p-6 transition-all duration-300",
        hoverEffect && "glass-panel-hover",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
