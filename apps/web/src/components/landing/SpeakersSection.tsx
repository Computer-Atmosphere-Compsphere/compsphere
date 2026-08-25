import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SectionHeading } from "./SectionHeading";
import { GlitterFinal } from "@/components/ui/animated-hero-with-web-gl-glitter";
import { BadgeCheck, Lock, LockOpen, Mic2, Sparkles, Users } from "lucide-react";

interface SpeakerSlot {
  name: string;
  role: string;
  org: string;
}

/**
 * Speaker slots overlaid inside the revealed image — left / center / right.
 * Fill in the names and titles of the compsphere speakers here.
 */
const speakerSlots: SpeakerSlot[] = [
  {
    name: "Avip Syaifulloh",
    role: "CEO WPU Course",
    org: "WPU Course",
  },
  {
    name: "Sandhika Galih",
    role: "Tech Creator",
    org: "WPU Course - Youtube",
  },
  {
    name: "M.Agung Rizkyana",
    role: "CTO WPU Course",
    org: "WPU Course",
  },
];

const smooth = [0.22, 1, 0.36, 1] as const;

export function SpeakersSection() {
  const [unlocked, setUnlocked] = useState(false);

  return (
    <section id="speakers" className="relative scroll-mt-24 overflow-hidden py-24 bg-black">
      <GlitterFinal speed={0.75} intensity={3} uvScale={2.0} />
      <div className="relative mx-auto max-w-6xl px-6">
        <SectionHeading
          title="OUR SPEAKERS"
          subtitle="Speakers who will bring industry insights, web technology, and the future of the decentralized internet to the Compsphere stage."
        />

        {/* Interactive stage card — image only */}
        <div className="mx-auto mt-14 max-w-2xl [perspective:1400px]">
          <motion.button
            type="button"
            onClick={() => setUnlocked((u) => !u)}
            whileTap={{ scale: 0.99 }}
            className="group relative block w-full cursor-pointer overflow-hidden rounded-[2rem] border border-white/25 bg-gradient-to-b from-white/[0.09] to-white/[0.03] p-3 text-left shadow-[0_30px_90px_rgba(0,0,0,0.55),0_6px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.16),inset_0_-1px_0_rgba(255,255,255,0.06)] backdrop-blur-3xl backdrop-saturate-[1.5] ring-1 ring-white/10 outline-none transition-all duration-500 hover:border-white/40 hover:bg-white/[0.07] [transform:perspective(1400px)_rotateX(1.5deg)]"
            aria-pressed={unlocked}
            aria-label={unlocked ? "Relock the speaker reveal" : "Unveil the speaker"}
          >
            {/* Glass sheen & reflections */}
            <div aria-hidden className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[2rem]">
              <div className="absolute -top-24 left-1/2 h-48 w-[85%] -translate-x-1/2 rounded-full bg-white/[0.1] blur-3xl" />
              <div className="absolute -bottom-28 -right-14 h-56 w-56 rounded-full bg-white/[0.05] blur-3xl" />
              <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            </div>

            {/* Web3 stage label */}

            <div className="relative aspect-[10/7] overflow-hidden rounded-[1.55rem]">
              <AnimatePresence initial={false}>
                {!unlocked ? (
                  <motion.div
                    key="locked"
                    exit={{ scale: 1.07, opacity: 0, filter: "blur(10px)" }}
                    transition={{ duration: 0.65, ease: smooth }}
                    className="absolute inset-0"
                  >
                    {/* Silhouette — kept clear, no heavy effect */}
                    <img
                      src="/unlocked-speaker.png"
                      alt=""
                      aria-hidden
                      className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.03]"
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-bg-primary/45 via-transparent to-transparent"
                      aria-hidden
                    />

                    {/* Minimal hint — silhouette stays visible */}
                    <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2.5 pb-6">
                      <span className="mono-chip inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.07] px-3.5 py-1 text-[9px] uppercase tracking-[0.3em] text-white/70 backdrop-blur-2xl transition-colors duration-500 group-hover:text-white">
                        Whos will be our innovative speaker?
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="unlocked"
                    initial={{ opacity: 0, scale: 1.045 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.9, ease: smooth }}
                    className="absolute inset-0"
                  >
                    {/* Revealed stage shot */}
                    <img
                      src="/speaker-image.png"
                      alt="Compsphere speakers unveiled"
                      className="h-full w-full object-cover"
                    />
                    {/* Readability scrim for the plaques */}
                    <div
                      className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-bg-primary/85 via-bg-primary/40 to-transparent"
                      aria-hidden
                    />

                    {/* Unveil wipe */}
                    <motion.span
                      initial={{ y: "-101%" }}
                      animate={{ y: "101%" }}
                      transition={{ duration: 1.05, ease: smooth, delay: 0.05 }}
                      className="absolute inset-x-0 inset-y-0 bg-gradient-to-b from-transparent via-bg-primary/20 to-transparent backdrop-blur-[3px]"
                      aria-hidden
                    />
                    {/* Soft light sweep */}
                    <motion.span
                      initial={{ x: "-140%", opacity: 0.5 }}
                      animate={{ x: "240%", opacity: 0 }}
                      transition={{ duration: 1.2, delay: 0.5, ease: smooth }}
                      className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                      aria-hidden
                    />

                    {/* Name plaques — inside the image */}
                    <div className="absolute inset-x-0 bottom-0 grid grid-cols-3 items-end gap-1.5 px-2 pb-2 sm:gap-3 sm:px-4 sm:pb-4 md:gap-4 md:px-5 md:pb-5">
                      {speakerSlots.map((s, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 22, filter: "blur(6px)" }}
                          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                          transition={{
                            duration: 0.8,
                            delay: 0.75 + idx * 0.16,
                            ease: smooth,
                          }}
                          className={`rounded-xl sm:rounded-2xl border border-white/20 bg-black/35 px-1.5 py-1.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:px-3 sm:py-2.5 md:px-4 md:py-3 ${idx === 1 ? "border-white/35 bg-white/[0.12]" : ""
                            }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            {idx === 1 ? (
                              <BadgeCheck className="hidden h-3 w-3 shrink-0 text-brand-primary md:block" />
                            ) : (
                              <Mic2 className="hidden h-3 w-3 shrink-0 text-text-muted md:block" />
                            )}
                            <h3
                              className={`font-display font-extrabold leading-tight tracking-tight ${idx === 1
                                ? "text-[10px] text-text-primary sm:text-sm md:text-lg"
                                : "text-[9px] text-text-secondary sm:text-xs md:text-sm"
                                }`}
                            >
                              {s.name}
                            </h3>
                          </div>
                          <p
                            className={`mt-0.5 text-[7px] font-semibold uppercase tracking-wider sm:text-[9px] md:text-[10px] ${idx === 1 ? "text-brand-accent" : "text-text-muted"
                              }`}
                          >
                            {s.role}
                          </p>
                          <p className="mt-0.5 hidden text-[8px] text-text-muted/80 sm:block sm:text-[9px] md:text-[10px]">
                            {s.org}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.button>
        </div>
      </div>
    </section>
  );
}