import React, { useState, useEffect } from "react";

interface CountdownTimerProps {
  targetDate: string;
  label: string;
  variant?: "compsphere" | "talksphere" | "hacksphere" | "24h";
}

function getTimeRemaining(targetDate: string) {
  const now = new Date().getTime();
  const target = new Date(targetDate).getTime();
  const diff = Math.max(0, target - now);
  return {
    total: diff,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isExpired: diff <= 0,
  };
}

function TimeBlock({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <div className="relative w-14 h-[68px] sm:w-[72px] sm:h-[80px] rounded-xl bg-white/[0.07] backdrop-blur-lg border border-white/[0.09] flex items-center justify-center">
        <span
          className="text-[26px] sm:text-[32px] font-bold font-mono tabular-nums text-white"
          style={{ textShadow: `0 0 20px ${color}40` }}
        >
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
        {label}
      </span>
    </div>
  );
}

function Colon({ color }: { color: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-1.5 sm:px-2.5 shrink-0 sm:h-[80px]" style={{ height: "68px", paddingTop: "14px" }}>
      <div className="w-[5px] h-[5px] rounded-full bg-white/50" />
      <div className="w-[5px] h-[5px] rounded-full bg-white/50" />
    </div>
  );
}

function Label({ text }: { text: string }) {
  return (
    <div className="px-4 py-1 rounded-full bg-white/[0.05] backdrop-blur-md border border-white/[0.08]">
      <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.25em] text-white/40">
        {text}
      </span>
    </div>
  );
}

export function CountdownTimer({ targetDate, label, variant = "compsphere" }: CountdownTimerProps) {
  const [time, setTime] = useState(() => getTimeRemaining(targetDate));

  useEffect(() => {
    const interval = setInterval(() => setTime(getTimeRemaining(targetDate)), 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const colorMap: Record<string, string> = {
    compsphere: "#00F5C8",
    talksphere: "#818cf8",
    hacksphere: "#f472b6",
    "24h": "#f59e0b",
  };
  const color = colorMap[variant ?? "compsphere"];

  if (time.isExpired) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="px-6 py-2.5 rounded-full bg-white/[0.06] backdrop-blur-lg border border-white/[0.10]">
          <span className="text-xs sm:text-sm font-semibold tracking-wide text-white">
            {variant === "24h" ? "Hackathon is Live!" : variant === "talksphere" ? "TalkSphere is Live!" : variant === "hacksphere" ? "Hacksphere Has Begun!" : "Compsphere is Live!"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Label text={label} />

      <div className="flex items-center">
        <TimeBlock value={time.days} label="Days" color={color} />
        <Colon color={color} />
        <TimeBlock value={time.hours} label="Hours" color={color} />
        <Colon color={color} />
        <TimeBlock value={time.minutes} label="Min" color={color} />
        <Colon color={color} />
        <TimeBlock value={time.seconds} label="Sec" color={color} />
      </div>
    </div>
  );
}
