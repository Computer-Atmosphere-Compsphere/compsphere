import React from "react";
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm mx-4 rounded-xl border border-border bg-bg-secondary/95 backdrop-blur-xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-text-primary">{title}</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-md text-xs font-semibold text-text-secondary bg-bg-surface border border-border hover:text-text-primary transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200",
              variant === "danger" &&
                "bg-red-950/60 text-red-400 border border-red-900/30 hover:bg-red-950 hover:border-red-500 hover:shadow-[0_0_12px_rgba(239,68,68,0.15)]",
              variant === "info" &&
                "bg-brand-primary text-bg-primary border border-transparent hover:shadow-[0_0_15px_rgba(0,245,200,0.3)]"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
