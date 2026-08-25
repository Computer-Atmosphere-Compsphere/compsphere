import React from "react";
import { motion } from "framer-motion";
import { SectionHeading } from "./SectionHeading";
import { partners } from "./events.data";
import { GlitterFinal } from "@/components/ui/animated-hero-with-web-gl-glitter";



export function PartnersSection() {
  return (
    <section id="partners" className="relative scroll-mt-24 overflow-hidden py-24 bg-black">
      <GlitterFinal speed={0.75} intensity={5} />
      <div className="relative mx-auto max-w-6xl px-6">
        <SectionHeading
          title="OUR PARTNERS"
          subtitle="Supporting organizations, media partners, and student associations that form the community nodes of the Compsphere network."
        />

        <div className="mx-auto mt-12 flex flex-wrap justify-center gap-3">
          {partners.map((p, idx) => (
            <motion.div
              key={p}
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: (idx % 8) * 0.05 }}
              className="group flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 backdrop-blur-md transition-all duration-300 hover:border-brand-primary/40 hover:bg-white/[0.06] hover:shadow-brand-glow-sm"
            >
              <span className="mono-chip flex h-7 w-7 items-center justify-center rounded-full bg-brand-gradient/15 text-[10px] font-bold text-brand-primary ring-1 ring-brand-primary/25">
                {p.replace(/[^A-Z]/g, "").slice(0, 3) || p.slice(0, 2)}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary transition-colors group-hover:text-text-primary">
                {p}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}