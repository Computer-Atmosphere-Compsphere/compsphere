import React from "react";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { Book, Award, Code, CheckSquare, ShieldCheck } from "lucide-react";

export function Guidebook() {
  return (
    <div className="space-y-12 max-w-4xl mx-auto py-6">
      <div className="space-y-4 text-center">
        <div className="w-12 h-12 rounded-full bg-brand-dim border border-brand-primary/20 flex items-center justify-center mx-auto text-brand-primary">
          <Book className="w-6 h-6" />
        </div>
        <h1 className="text-4xl font-extrabold text-glow text-text-primary">Competition Guidebook</h1>
        <p className="text-sm text-text-secondary max-w-xl mx-auto">
          Official guidelines, deliverables, SLA times, and criteria for COMPSPHERE Phase 2.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <GlassPanel className="space-y-4">
          <Award className="w-5 h-5 text-purple-400" />
          <h3 className="font-bold text-sm text-text-primary">Qualification Categories</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            <strong>National:</strong> Fee Rp120,000. Verification via payment receipt.<br />
            <strong>Mix:</strong> Indonesian & foreign mix. Uses National rules.<br />
            <strong>International:</strong> Fee free. Verification via ID or commitment letter.
          </p>
        </GlassPanel>

        <GlassPanel className="space-y-4">
          <CheckSquare className="w-5 h-5 text-yellow-400" />
          <h3 className="font-bold text-sm text-text-primary">SLA Deadlines</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            Teams have exactly <strong>48 hours</strong> from activation to submit verification proofs. Expired teams are dropped, opening slots for Battle Royale waitlists.
          </p>
        </GlassPanel>

        <GlassPanel className="space-y-4">
          <Code className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-sm text-text-primary">Phase 2 Deliverables</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            Must include: a valid GitHub/GitLab repository and presentation slides (PDF/PPT/PPTX, max 10MB). A deployment URL is optional but recommended.
          </p>
        </GlassPanel>
      </div>

      {/* RLS/Security Note */}
      <GlassPanel className="border-brand-dim border">
        <div className="flex gap-4 items-start">
          <ShieldCheck className="w-6 h-6 text-brand-primary shrink-0" />
          <div>
            <h4 className="font-bold text-text-primary">Security & RLS Policies</h4>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              COMPSPHERE respects privacy. Payment proofs, ID cards, and commitment documents are stored privately in encrypted storage folders. Access is authorized via Row Level Security (RLS) and restricted strictly to team leaders and verified administrators.
            </p>
          </div>
        </div>
      </GlassPanel>

      {/* Judging Rubrics */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-text-primary">Evaluation Rubrics</h2>
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-bg-surface border border-border flex justify-between items-center text-sm">
            <div>
              <span className="font-semibold text-text-primary">Functional MVP & Live Demo</span>
              <p className="text-xs text-text-muted mt-0.5">Stability, feature completion, and execution quality during live defense.</p>
            </div>
            <span className="font-black text-brand-primary">35% Weight</span>
          </div>

          <div className="p-4 rounded-lg bg-bg-surface border border-border flex justify-between items-center text-sm">
            <div>
              <span className="font-semibold text-text-primary">Problem-Solution Fit & Public Impact</span>
              <p className="text-xs text-text-muted mt-0.5">Value proposition, validation details, and alignment with target groups.</p>
            </div>
            <span className="font-black text-brand-primary">30% Weight</span>
          </div>

          <div className="p-4 rounded-lg bg-bg-surface border border-border flex justify-between items-center text-sm">
            <div>
              <span className="font-semibold text-text-primary">Creative Tech-Implementation</span>
              <p className="text-xs text-text-muted mt-0.5">Novelty in code structure, package reuse, and architecture selection.</p>
            </div>
            <span className="font-black text-brand-primary">20% Weight</span>
          </div>

          <div className="p-4 rounded-lg bg-bg-surface border border-border flex justify-between items-center text-sm">
            <div>
              <span className="font-semibold text-text-primary">Pitching & Q&A Defense</span>
              <p className="text-xs text-text-muted mt-0.5">Clarity in presentation, defense quality, and structured answers.</p>
            </div>
            <span className="font-black text-brand-primary">15% Weight</span>
          </div>
        </div>
      </section>
    </div>
  );
}
