import React, { useState, useEffect } from "react";
import { GlassPanel } from "./GlassPanel";
import { AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountdownCardProps {
  deadline: string | null;
  onExpiry?: () => void;
  className?: string;
}

export function CountdownCard({ deadline, onExpiry, className }: CountdownCardProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    if (!deadline) return;

    const target = new Date(deadline).getTime();

    const calculate = () => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
        onExpiry?.();
        return true;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, isExpired: false });
      return false;
    };

    // Initial run
    calculate();
    const interval = setInterval(calculate, 1000);

    return () => clearInterval(interval);
  }, [deadline, onExpiry]);

  if (!deadline) {
    return null;
  }

  return (
    <GlassPanel
      className={cn(
        "relative overflow-hidden border border-brand-dim",
        timeLeft.isExpired ? "border-red-950/40" : "border-brand-dim",
        className
      )}
    >
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Clock className="w-36 h-36" />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          {timeLeft.isExpired ? (
            <AlertTriangle className="w-5 h-5 text-red-400" />
          ) : (
            <Clock className="w-5 h-5 text-brand-primary animate-pulse" />
          )}
          <h3 className="font-semibold text-sm tracking-wider uppercase text-text-secondary">
            {timeLeft.isExpired ? "Confirmation Expired" : "Time Remaining to Confirm"}
          </h3>
        </div>

        {timeLeft.isExpired ? (
          <div className="text-left">
            <div className="text-3xl font-extrabold text-red-500 tracking-tight">00 : 00 : 00</div>
            <p className="text-xs text-text-muted mt-2">
              The 48-hour confirmation window for your team has closed.
            </p>
          </div>
        ) : (
          <div className="flex items-baseline gap-3">
            <div className="flex gap-2 text-4xl font-black font-mono tracking-tight text-glow text-brand-primary">
              <span>{String(timeLeft.hours).padStart(2, "0")}</span>
              <span className="opacity-50 animate-pulse">:</span>
              <span>{String(timeLeft.minutes).padStart(2, "0")}</span>
              <span className="opacity-50 animate-pulse">:</span>
              <span>{String(timeLeft.seconds).padStart(2, "0")}</span>
            </div>
            <span className="text-xs font-semibold text-text-muted">Left</span>
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
