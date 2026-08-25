import React from "react";
import { GlassPanel } from "./GlassPanel";
import { NeonButton } from "./NeonButton";
import { AlertCircle, CheckCircle, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { calculateFinalScore } from "@compsphere/types";

interface ScoreFormValues {
  mvpScore: number;
  impactScore: number;
  creativeScore: number;
  pitchScore: number;
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
    formState: { errors, isDirty },
  } = useForm<ScoreFormValues>({
    defaultValues: initialScores || {
      mvpScore: 50,
      impactScore: 50,
      creativeScore: 50,
      pitchScore: 50,
    },
  });

  const watchAll = watch();

  const currentFinalScore = calculateFinalScore({
    mvpScore: Number(watchAll.mvpScore || 0),
    impactScore: Number(watchAll.impactScore || 0),
    creativeScore: Number(watchAll.creativeScore || 0),
    pitchScore: Number(watchAll.pitchScore || 0),
  });

  return (
    <GlassPanel className={className}>
      <h3 className="font-bold text-lg text-text-primary mb-6">Score Team: {teamName}</h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* MVP & Live Demo */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-text-secondary">
            <span>Functional MVP & Live Demo (35%)</span>
            <span className="font-mono text-brand-primary">{watchAll.mvpScore || 50} / 100</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            className="w-full h-1.5 bg-bg-surface rounded-lg appearance-none cursor-pointer accent-brand-primary"
            {...register("mvpScore", { valueAsNumber: true })}
          />
        </div>

        {/* Problem-Solution Fit */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-text-secondary">
            <span>Problem-Solution Fit & Public Impact (30%)</span>
            <span className="font-mono text-brand-primary">{watchAll.impactScore || 50} / 100</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            className="w-full h-1.5 bg-bg-surface rounded-lg appearance-none cursor-pointer accent-brand-primary"
            {...register("impactScore", { valueAsNumber: true })}
          />
        </div>

        {/* Creative Tech-Implementation */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-text-secondary">
            <span>Creative Tech-Implementation (20%)</span>
            <span className="font-mono text-brand-primary">{watchAll.creativeScore || 50} / 100</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            className="w-full h-1.5 bg-bg-surface rounded-lg appearance-none cursor-pointer accent-brand-primary"
            {...register("creativeScore", { valueAsNumber: true })}
          />
        </div>

        {/* Pitching & Defense */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-text-secondary">
            <span>Pitching & Q&A Defense (15%)</span>
            <span className="font-mono text-brand-primary">{watchAll.pitchScore || 50} / 100</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            className="w-full h-1.5 bg-bg-surface rounded-lg appearance-none cursor-pointer accent-brand-primary"
            {...register("pitchScore", { valueAsNumber: true })}
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
