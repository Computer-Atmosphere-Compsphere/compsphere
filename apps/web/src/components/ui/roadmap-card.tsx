"use client";
import React from "react";
import { motion } from "framer-motion";

export interface RoadmapItem {
  quarter: string;
  title: string;
  description: string;
  status?: "done" | "in-progress" | "upcoming";
}

export interface RoadmapCardProps {
  title?: string;
  description?: string;
  items: RoadmapItem[];
}

const smooth = [0.22, 1, 0.36, 1] as const;

export function RoadmapCard({ title, description, items }: RoadmapCardProps) {
  return (
    <div className="w-full">
      {/* Header */}
      {(title || description) && (
        <div className="mb-10 text-center">
          {title && (
            <h3 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-2 text-sm text-white/40">{description}</p>
          )}
        </div>
      )}

      {/* Timeline container */}
      <div className="relative mx-auto w-full max-w-6xl">
        {/* Glass background */}
        <div
          className="relative overflow-hidden rounded-[24px] border border-white/[0.08] py-10"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.05) inset, 0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          {/* Top sheen */}
          <div className="pointer-events-none absolute inset-x-14 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <div
            className="pointer-events-none absolute -top-20 -left-20 h-40 w-40 rounded-full blur-[80px]"
            style={{ background: "rgba(255,255,255,0.03)" }}
          />

          {/* Scrollable wrapper for mobile */}
          <div className="overflow-x-auto scrollbar-none px-6 sm:px-10 md:px-14">
            {/* Timeline rail — min-width ensures items don't compress on mobile */}
            <div className="relative" style={{ minWidth: items.length > 4 ? `${items.length * 160}px` : undefined }}>
              {/* Horizontal line */}
              <div className="absolute left-0 right-0 top-[18px] h-px bg-gradient-to-r from-white/[0.04] via-white/[0.12] to-white/[0.04]" />

              {/* Progress line */}
              <div
                className="absolute top-[18px] h-px transition-all duration-700"
                style={{
                  left: 0,
                  width: `${(() => {
                    const lastActive = items.reduce(
                      (acc, item, i) =>
                        item.status === "done" || item.status === "in-progress"
                          ? i
                          : acc,
                      -1,
                    );
                    if (lastActive < 0) return "0%";
                    return `${((lastActive + 0.5) / Math.max(items.length - 1, 1)) * 100}%`;
                  })()}`,
                  background:
                    "linear-gradient(to right, rgba(255,255,255,0.25), rgba(255,255,255,0.10))",
                }}
              />

              {/* Items */}
              <div className="flex justify-between">
                {items.map((item, index) => {
                  const isActive =
                    item.status === "done" || item.status === "in-progress";

                  return (
                    <motion.div
                      key={index}
                      className="relative flex-1 text-center min-w-[140px]"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{
                        duration: 0.5,
                        delay: index * 0.12,
                        ease: smooth,
                      }}
                    >
                      {/* Dot */}
                      <div className="absolute left-1/2 top-[12px] z-10 -translate-x-1/2">
                        <div
                          className={`relative h-3.5 w-3.5 rounded-full transition-shadow duration-300 ${
                            isActive
                              ? "shadow-[0_0_8px_rgba(255,255,255,0.25)]"
                              : ""
                          }`}
                        >
                          <div
                            className={`absolute inset-0 rounded-full transition-all duration-300 ${
                              isActive
                                ? "bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.3)]"
                                : "bg-white/15 ring-1 ring-white/10"
                            }`}
                          />
                          {isActive && (
                            <div
                              className="absolute inset-0 rounded-full bg-white/40"
                              style={{ clipPath: "inset(0 0 50% 0)" }}
                            />
                          )}
                        </div>
                      </div>

                      {/* Content below dot */}
                      <div className="mt-10 mx-auto px-2">
                        {/* Quarter badge */}
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${
                            isActive
                              ? "border border-white/20 bg-white/[0.08] text-white/80"
                              : "border border-white/[0.10] bg-white/[0.04] text-white/50"
                          }`}
                        >
                          {item.quarter}
                        </span>

                        {/* Title */}
                        <h4
                          className={`mt-3 text-xs font-bold leading-tight sm:text-sm ${
                            isActive ? "text-white/90" : "text-white/70"
                          }`}
                        >
                          {item.title}
                        </h4>

                        {/* Short description */}
                        <p
                          className={`mt-1.5 text-[10px] leading-relaxed sm:text-[11px] ${
                            isActive ? "text-white/40" : "text-white/35"
                          }`}
                        >
                          {item.description}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
