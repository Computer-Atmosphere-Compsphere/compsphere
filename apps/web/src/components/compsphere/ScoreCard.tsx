import React from "react";
import { GlassPanel } from "./GlassPanel";
import { NeonButton } from "./NeonButton";
import { Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { calculateFinalScore } from "@compsphere/types";

interface ScoreFormValues {
  technicalScore: number;
  problemScore: number;
  innovationScore: number;
  marketScore: number;
  documentScore: number;
}

interface ScoreCardProps {
  teamName: string;
  initialScores?: ScoreFormValues | null;
  onSubmit: (scores: ScoreFormValues) => Promise<void>;
  isSubmitting?: boolean;
  className?: string;
}

export function ScoreCard({
  teamName,
  initialScores,
  onSubmit,
  isSubmitting = false,
  className,
}: ScoreCardProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { isDirty },
  } = useForm<ScoreFormValues>({
    defaultValues: initialScores || {
      technicalScore: 50,
      problemScore: 50,
      innovationScore: 50,
      marketScore: 50,
      documentScore: 50,
    },
  });

  const watchAll = watch();

  const currentFinalScore = calculateFinalScore({
    technicalScore: Number(watchAll.technicalScore || 0),
    problemScore: Number(watchAll.problemScore || 0),
    innovationScore: Number(watchAll.innovationScore || 0),
    marketScore: Number(watchAll.marketScore || 0),
    documentScore: Number(watchAll.documentScore || 0),
  });

  return (
    <GlassPanel className={className}>
      <h3 className="font-bold text-lg text-text-primary mb-6">Score Team: {teamName}</h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Technical Architecture & Feasibility (30%) */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-text-secondary">
            <span>Technical Architecture & Feasibility (30%)</span>
            <span className="font-mono text-brand-primary">{watchAll.technicalScore || 50} / 100</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            className="w-full h-1.5 bg-bg-surface rounded-lg appearance-none cursor-pointer accent-brand-primary"
            {...register("technicalScore", { valueAsNumber: true })}
          />
        </div>

        {/* Problem Relevance & Solution Fit (20%) */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-text-secondary">
            <span>Problem Relevance & Solution Fit (20%)</span>
            <span className="font-mono text-brand-primary">{watchAll.problemScore || 50} / 100</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            className="w-full h-1.5 bg-bg-surface rounded-lg appearance-none cursor-pointer accent-brand-primary"
            {...register("problemScore", { valueAsNumber: true })}
          />
        </div>

        {/* Innovation & Value Proposition (25%) */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-text-secondary">
            <span>Innovation & Value Proposition (25%)</span>
            <span className="font-mono text-brand-primary">{watchAll.innovationScore || 50} / 100</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            className="w-full h-1.5 bg-bg-surface rounded-lg appearance-none cursor-pointer accent-brand-primary"
            {...register("innovationScore", { valueAsNumber: true })}
          />
        </div>

        {/* Market & Impact Viability (15%) */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-text-secondary">
            <span>Market & Impact Viability (15%)</span>
            <span className="font-mono text-brand-primary">{watchAll.marketScore || 50} / 100</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            className="w-full h-1.5 bg-bg-surface rounded-lg appearance-none cursor-pointer accent-brand-primary"
            {...register("marketScore", { valueAsNumber: true })}
          />
        </div>

        {/* Document Clarity & Structure (10%) */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-text-secondary">
            <span>Document Clarity & Structure (10%)</span>
            <span className="font-mono text-brand-primary">{watchAll.documentScore || 50} / 100</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            className="w-full h-1.5 bg-bg-surface rounded-lg appearance-none cursor-pointer accent-brand-primary"
            {...register("documentScore", { valueAsNumber: true })}
          />
        </div>

        {/* Live Preview Calculator */}
        <div className="p-4 rounded-md bg-bg-surface border border-border flex justify-between items-center mt-8">
          <div>
            <span className="text-xs text-text-muted font-bold block uppercase tracking-wider">
              Weighted Final Score
            </span>
            <span className="text-sm text-text-muted mt-0.5 block">Calculated server-side on save</span>
          </div>
          <span className="text-3xl font-black font-mono text-brand-accent text-glow-accent">
            {currentFinalScore.toFixed(2)}
          </span>
        </div>

        <NeonButton
          type="submit"
          disabled={isSubmitting || (!isDirty && initialScores !== null)}
          className="w-full mt-4"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSubmitting ? "Saving Score..." : "Save Scores"}
        </NeonButton>
      </form>
    </GlassPanel>
  );
}
