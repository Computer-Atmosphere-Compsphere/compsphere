import React from "react";
import { motion } from "framer-motion";
import { SectionHeading } from "./SectionHeading";
import { GlitterFinal } from "@/components/ui/animated-hero-with-web-gl-glitter";
import { subEvents } from "./events.data";
import { CalendarDays, Link2, MapPin, ShieldCheck } from "lucide-react";

const prevHashes = ["GENESIS", "0xEXPO", "0xTALK", "0xH4CK"];

export function TimelineSection() {
  return (
    <section id="timeline" className="relative scroll-mt-24 overflow-hidden py-24 bg-black">
      {/* Tiled glitter: wrapper div covers full section, 6 tiles repeat the sparkle pattern vertically */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
        {([
          { top: "0%",   speed: 0.75, uvScale: 2.0 },
          { top: "17%",  speed: 0.65, uvScale: 2.2 },
          { top: "34%",  speed: 0.80, uvScale: 1.9 },
          { top: "51%",  speed: 0.70, uvScale: 2.1 },
          { top: "68%",  speed: 0.75, uvScale: 2.0 },
          { top: "83%",  speed: 0.68, uvScale: 1.8 },
        ] as const).map((tile, i) => (
          <div
            key={i}
            className="absolute w-full"
            style={{ top: tile.top, height: "20%" }}
          >
            <GlitterFinal
              speed={tile.speed}
              intensity={3}
              uvScale={tile.uvScale}
              className="!inset-0"
            />
          </div>
        ))}
      </div>


      <div className="relative mx-auto max-w-5xl px-6">
        <SectionHeading
          title="TIMELINE"
          subtitle="Every sub-event is a block in the Compsphere chain, sequenced and connected from the genesis block to the closing ceremony."
        />

        <div className="relative mt-16">
          {/* Glowing chain rail */}
          <div className="absolute bottom-4 left-[15px] top-0 w-px md:left-1/2" aria-hidden>
            <div className="h-full w-full bg-gradient-to-b from-white/30 via-white/10 to-transparent" />
            <div className="animate-pulse-glow absolute inset-0 rounded-full" />
          </div>

          <div className="space-y-12">
            {subEvents.map((e, idx) => {
              const isLeft = idx % 2 === 0;
              const hash = `0x${e.id.replace(/-/g, "").slice(0, 20)}`;
              return (
                <motion.div
                  key={e.id}
                  id={e.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.12 }}
                  transition={{ duration: 0.55, delay: idx * 0.08 }}
                  className={`relative flex scroll-mt-28 flex-col gap-4 pl-12 md:pl-0 ${isLeft
                    ? "md:flex-row md:items-center"
                    : "md:flex-row-reverse md:items-center"
                    }`}
                >
                  {/* Glass node */}
                  <div
                    className="absolute left-[8px] top-8 z-10 md:left-1/2 md:-translate-x-1/2 md:top-1/2 md:-translate-y-1/2"
                    aria-hidden
                  >
                    <div className="flex h-4 w-4 items-center justify-center rounded-md border border-white/30 bg-white/10 shadow-[0_0_14px_rgba(255,255,255,0.18)] backdrop-blur-md">
                      <span className="h-1 w-1 animate-pulse rounded-full bg-white" />
                    </div>
                  </div>

                  {/* Glass card — same model as the sub-event preview */}
                  <div className={`w-full md:w-1/2 ${isLeft ? "md:pr-14" : "md:pl-14"}`}>
                    <div
                      className={`relative overflow-hidden rounded-[26px] border border-white/25 bg-gradient-to-b from-white/[0.09] to-white/[0.03] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-1px_0_rgba(255,255,255,0.05)] backdrop-blur-3xl ring-1 ring-white/10 transition-all duration-500 hover:border-white/40 hover:bg-white/[0.07] [transform:perspective(1200px)_rotateY(2.5deg)] hover:[transform:perspective(1200px)_rotateY(0deg)] ${isLeft ? "" : "[transform:perspective(1200px)_rotateY(-2.5deg)] hover:[transform:perspective(1200px)_rotateY(0deg)]"
                        }`}
                    >
                      {/* Glass sheen */}
                      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[26px]">
                        <div className="absolute -top-20 left-1/2 h-40 w-[80%] -translate-x-1/2 rounded-full bg-white/[0.1] blur-3xl" />
                        <div className="absolute -bottom-24 -right-12 h-48 w-48 rounded-full bg-white/[0.05] blur-3xl" />
                        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                      </div>

                      {/* Icon — raw, floating */}
                      <img
                        src={e.iconSrc}
                        alt={e.name}
                        className="relative mx-auto mt-5 h-28 w-auto max-w-full object-contain drop-shadow-[0_14px_40px_rgba(0,0,0,0.4)]"
                      />

                      {/* Title */}
                      <h3 className="relative mt-4 text-center font-display text-2xl font-black uppercase tracking-tight text-white">
                        {e.name}
                      </h3>
                      <p className="relative mt-1 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-white/50">
                        {e.tagline}
                      </p>

                      <p className="relative mt-3 text-xs leading-relaxed text-white/60">{e.description}</p>

                      {/* Meta */}
                      <div className="relative mt-4 space-y-1.5 border-t border-white/10 pt-3.5 text-[11px] text-white/55">
                        <p className="flex items-center gap-2">
                          <CalendarDays className="h-3.5 w-3.5 text-white/40" />
                          {e.date}
                        </p>
                        <p className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-white/40" />
                          {e.venue}
                        </p>
                      </div>

                      {/* Chain footer */}
                      <div className="relative mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                        <span className="mono-chip flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-white/40">
                          <Link2 className="h-3 w-3" />
                          prev: {prevHashes[idx]}
                        </span>
                        <span className="mono-chip flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-white/40">
                          <ShieldCheck className="h-3 w-3 text-white/50" />
                          confirmed
                        </span>
                      </div>
                      <p className="relative mt-2 truncate font-mono text-[9px] text-white/30">
                        hash: {hash}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
