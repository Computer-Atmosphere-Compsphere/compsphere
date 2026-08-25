import React from "react";
import { useSSE } from "@/hooks/useSSE";
import { cn } from "@/lib/utils";

export function SSEStatusIndicator() {
  const { isConnected, isReconnecting } = useSSE();

  const status = isConnected
    ? "online"
    : isReconnecting
    ? "reconnecting"
    : "offline";

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-surface/60 border border-border/50 select-none">
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full shrink-0",
          status === "online" &&
            "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]",
          status === "reconnecting" &&
            "bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(251,191,36,0.5)]",
          status === "offline" &&
            "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]"
        )}
      />
      <span
        className={cn(
          "text-[10px] font-semibold tracking-wide uppercase",
          status === "online" && "text-emerald-400/80",
          status === "reconnecting" && "text-amber-400/80",
          status === "offline" && "text-red-400/80"
        )}
      >
        {status === "online"
          ? "Online"
          : status === "reconnecting"
          ? "Reconnect"
          : "Offline"}
      </span>
    </div>
  );
}
