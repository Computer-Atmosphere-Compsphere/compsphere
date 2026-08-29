import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import { SectionHeading } from "./SectionHeading";
import { subEvents, type SubEvent } from "./events.data";
import { Testimonials } from "@/components/ui/twitter-testimonial-cards";
import type { TestimonialCardProps } from "@/components/ui/twitter-testimonial-cards";
import { ArrowRight, CalendarDays, MapPin, X } from "lucide-react";
import { GlitterFinal } from "@/components/ui/animated-hero-with-web-gl-glitter";
import { scrollToHash } from "@/lib/smooth-scroll";

/** Stack order (back → front): Festsphere → Hacksphere → Talksphere → Exposphere */
const stackOrderIds = ["festsphere", "hacksphere", "talksphere", "exposphere"];

/**
 * Tailwind literal strings (JIT-safe), ordered by stack depth 0→3.
 * EVERY card is dark by default (grayscale + overlay) — only the hovered card
 * lights up, revealing the ones behind like a transparent ledger.
 */
const stackBaseClasses = [
  // 0 · Festsphere (back)
  "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-3xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/60 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-500 hover:grayscale-0 before:left-0 before:top-0",
  // 1 · Hacksphere
  "[grid-area:stack] translate-x-6 sm:translate-x-10 translate-y-4 sm:translate-y-6 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-3xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/60 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-500 hover:grayscale-0 before:left-0 before:top-0",
  // 2 · Talksphere
  "[grid-area:stack] translate-x-12 sm:translate-x-20 translate-y-8 sm:translate-y-12 hover:translate-y-1 sm:hover:translate-y-2 before:absolute before:w-[100%] before:outline-1 before:rounded-3xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/60 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-500 hover:grayscale-0 before:left-0 before:top-0",
  // 3 · Exposphere (front)
  "[grid-area:stack] translate-x-14 sm:translate-x-28 translate-y-12 sm:translate-y-16 hover:translate-y-4 sm:hover:translate-y-6 before:absolute before:w-[100%] before:outline-1 before:rounded-3xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/60 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-500 hover:grayscale-0 before:left-0 before:top-0",
];

function scrollToBlock(id: string) {
  scrollToHash(`#${id}`, { block: "center" });
}

export function SubEventsSection() {
  const navigate = useNavigate();
  const [openEvent, setOpenEvent] = useState<SubEvent | null>(null);
  // Kept while the dialog is animating out, so the content stays visible
  // during the close animation instead of leaving an empty card behind.
  const [renderEvent, setRenderEvent] = useState<SubEvent | null>(null);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);

  const openDialog = (e: SubEvent) => {
    setRenderEvent(e);
    setOpenEvent(e);
  };

  const eventsByPosition: SubEvent[] = stackOrderIds.map(
    (id) => subEvents.find((s) => s.id === id)!
  );

  // Default preview = the front card (Exposphere)
  const previewEvent = eventsByPosition[previewIdx ?? eventsByPosition.length - 1];

  const stackCards: TestimonialCardProps[] = stackOrderIds.map((id, index) => {
    const e = subEvents.find((s) => s.id === id)!;
    return {
      avatar: e.iconSrc,
      username: e.name,
      content: e.description,
      date: e.date,
      horizontal: true,
      className: stackBaseClasses[index],
    };
  });

  return (
    <section id="events" className="relative scroll-mt-24 overflow-hidden py-24 bg-black">
      <GlitterFinal speed={0.75} intensity={3} uvScale={2.0} />
      <div className="relative mx-auto max-w-6xl px-6">
        <SectionHeading
          title="OUR SUB-EVENTS"
          subtitle="Hover over the cards on the right to preview each block, then click to open the full details."
        />

        {/* Two-column layout: readable text on the left, card stack on the right */}
        <div className="mt-16 grid items-center gap-12 lg:grid-cols-2">
          {/* ── Left: live preview text (driven by hovered card) ───── */}
          <div className="order-2 lg:order-1 lg:-translate-x-5 [perspective:1200px]">
            <div className="relative overflow-hidden rounded-[26px] border border-white/20 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55),0_6px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.16),inset_0_-1px_0_rgba(255,255,255,0.06)] backdrop-blur-3xl [transform:perspective(1200px)_rotateX(2deg)] ring-1 ring-white/10 sm:p-8">
              {/* Neutral glass tint — keeps the glass clear, never green */}
              <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(160,200,220,0.07),transparent_60%)]" />
              {/* Glass sheen & reflections */}
              <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[26px]">
                <div className="absolute -top-20 left-1/2 h-40 w-[80%] -translate-x-1/2 rounded-full bg-white/[0.14] blur-3xl" />
                <div className="absolute -bottom-24 -right-12 h-48 w-48 rounded-full bg-white/[0.06] blur-3xl" />
                <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={previewEvent.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                  className="relative flex flex-col items-center justify-center py-2 text-center"
                >
                  {/* Large raw icon — no nested card */}
                  <img
                    src={previewEvent.iconSrc}
                    alt={previewEvent.name}
                    className="h-36 w-auto max-w-full object-contain drop-shadow-[0_14px_40px_rgba(0,0,0,0.4)] sm:h-44"
                  />

                  {/* Title */}
                  <h3 className="mt-5 font-display text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
                    {previewEvent.name}
                  </h3>

                  {/* Date */}
                  <p className="mt-3 flex items-center gap-2.5 text-xs text-white/60">
                    <CalendarDays className="h-3.5 w-3.5 text-white/40" />
                    {previewEvent.date}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* ── Right: stacked cards ─────────────────────────────── */}
          <div className="order-1 lg:order-2">
            <div className="relative flex min-h-[440px] items-start justify-center pt-16 sm:min-h-[480px] sm:pt-24">
              <Testimonials
                cards={stackCards}
                onSelect={(i) => {
                  setPreviewIdx(i);
                  openDialog(eventsByPosition[i]);
                }}
                onPreviewChange={(i) => {
                  // Keep focus on the last hovered/tapped card instead of
                  // snapping back to the front card when the mouse leaves.
                  if (i !== null) setPreviewIdx(i);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Glassmorphism detail popup ─────────────────────────────── */}
      <Dialog.Root open={!!openEvent} onOpenChange={(o) => !o && setOpenEvent(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-700 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-250" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-[80] w-[calc(100vw-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-white/25 bg-gradient-to-b from-white/[0.09] to-white/[0.03] p-5 sm:p-8 shadow-[0_24px_120px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-1px_0_rgba(255,255,255,0.05)] backdrop-blur-3xl backdrop-saturate-[1.8] ring-1 ring-white/10 data-[state=open]:animate-modal-in data-[state=closed]:animate-modal-out max-h-[90vh] overflow-y-auto"
            aria-describedby={undefined}
          >
            {renderEvent && (
              <>
                {/* Glass sheen & reflections */}
                <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
                  <div className="absolute -top-28 left-1/2 h-56 w-[85%] -translate-x-1/2 rounded-full bg-white/[0.12] blur-3xl" />
                  <div className="absolute -bottom-32 -right-16 h-64 w-64 rounded-full bg-white/[0.05] blur-3xl" />
                  <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                </div>
 
                <Dialog.Close className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white/70 backdrop-blur-md transition-colors hover:border-white/30 hover:text-white">
                  <X className="h-4 w-4" />
                </Dialog.Close>
 
                <div className="relative grid items-center gap-5 sm:gap-10 sm:grid-cols-[auto_1fr]">
                  {/* Icon — big, raw, floating */}
                  <div className="mx-auto sm:mx-0">
                    <img
                      src={renderEvent.iconSrc}
                      alt={renderEvent.name}
                      className="h-28 w-28 object-contain drop-shadow-[0_20px_70px_rgba(255,255,255,0.08)] sm:h-80 sm:w-80"
                    />
                  </div>
 
                  {/* Details */}
                  <div className="min-w-0 space-y-3 sm:space-y-4">
                    <p className="mono-chip text-[10px] uppercase tracking-[0.35em] text-white/40">
                      {renderEvent.block} · {renderEvent.tag}
                    </p>
 
                    <div className="space-y-1">
                      <Dialog.Title className="font-display text-2xl font-black uppercase tracking-tight text-white sm:text-4xl">
                        {renderEvent.name}
                      </Dialog.Title>
                      <p className="text-xs sm:text-sm font-medium text-white/60">{renderEvent.tagline}</p>
                    </div>
 
                    <p className="text-xs sm:text-sm leading-relaxed text-white/70">{renderEvent.description}</p>
 
                    <div className="space-y-1 pt-1 text-xs text-white/50">
                      <p className="flex items-center gap-2">
                        <CalendarDays className="h-3.5 w-3.5 text-white/40" />
                        {renderEvent.date}
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-white/40" />
                        {renderEvent.venue}
                      </p>
                    </div>
                  </div>
                </div>
 
                {/* Actions */}
                <div className="relative mt-5 sm:mt-8 flex flex-col gap-2 sm:gap-3 sm:flex-row">
                  <button
                    onClick={() => {
                      setOpenEvent(null);
                      navigate(`/events/${renderEvent.id}`);
                    }}
                    className="group inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:border-white/40 hover:bg-white/15"
                  >
                    Explore {renderEvent.name}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                  <button
                    onClick={() => {
                      setOpenEvent(null);
                      scrollToBlock(renderEvent.id);
                    }}
                    className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-white/60 backdrop-blur-md transition-colors hover:border-white/25 hover:text-white"
                  >
                    View in Timeline
                  </button>
                  <Dialog.Close className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-white/60 backdrop-blur-md transition-colors hover:border-white/25 hover:text-white">
                    Close
                  </Dialog.Close>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}