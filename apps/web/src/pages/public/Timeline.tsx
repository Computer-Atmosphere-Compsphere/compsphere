import React from "react";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { Calendar, CheckCircle } from "lucide-react";

export function Timeline() {
  const schedule = [
    { date: "Oct 1 - Oct 5, 2026", title: "Top 30 Team Activation", desc: "Redeem tokens, create leader/member profiles, and initialize workspaces.", done: true },
    { date: "Oct 5 - Oct 7, 2026", title: "Slot Confirmation & SLA Checks", desc: "Upload payments (National/Mix) or ID letters (International). Waitlist teams claiming slots via Battle Royale FCFS.", done: true },
    { date: "Oct 11, 2026 (10:00 AM)", title: "Hard Submission Lock", desc: "Deliverables portal closes globally. Rejections on late mutations enforced server-side.", done: false },
    { date: "Oct 12 - Oct 13, 2026", title: "Evaluation & Judging", desc: "Assigned judges evaluation. Dynamic weighted averages compiled in admin panels.", done: false },
    { date: "Oct 15, 2026", title: "Day 1 Registration & Venue check-in", desc: "Offline registration, catering token claims, and setup verification.", done: false },
    { date: "Oct 16, 2026", title: "Day 2 Evaluation & Defense", desc: "Live defense panel evaluations and pitching session.", done: false },
  ];

  return (
    <div className="space-y-12 max-w-2xl mx-auto py-6">
      <div className="space-y-4 text-center">
        <div className="w-12 h-12 rounded-full bg-brand-dim border border-brand-primary/20 flex items-center justify-center mx-auto text-brand-primary">
          <Calendar className="w-6 h-6" />
        </div>
        <h1 className="text-4xl font-extrabold text-glow text-text-primary">Competition Schedule</h1>
        <p className="text-sm text-text-secondary">
          Track deadlines, events, and deliverables portal status for Phase 2.
        </p>
      </div>

      <div className="relative border-l border-border pl-6 space-y-8">
        {schedule.map((item, idx) => (
          <div key={idx} className="relative">
            <span className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
              item.done 
                ? "bg-brand-primary border-brand-primary text-bg-primary shadow-[0_0_10px_rgba(0,245,200,0.5)]" 
                : "bg-bg-primary border-border"
            }`}>
              {item.done && <CheckCircle className="w-3.5 h-3.5 shrink-0" />}
            </span>

            <div className="space-y-1">
              <span className={`text-[10px] font-bold tracking-wider uppercase ${item.done ? "text-brand-primary" : "text-text-muted"}`}>
                {item.date}
              </span>
              <h3 className="font-bold text-sm text-text-primary">{item.title}</h3>
              <p className="text-xs text-text-secondary leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
