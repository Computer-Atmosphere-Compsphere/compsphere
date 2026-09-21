import React from "react";
import { motion } from "framer-motion";
import { SectionHeading } from "./SectionHeading";
import { partnerTop, partnerBottom, type Partner } from "./events.data";
import { GlitterFinal } from "@/components/ui/animated-hero-with-web-gl-glitter";
import { cn } from "@/lib/utils";

function PartnerCard({ partner, className }: { partner: Partner; className?: string }) {
  const isLink = Boolean(partner.url);
  const Tag = isLink ? "a" : "div";
  const linkProps = isLink
    ? {
        href: partner.url,
        target: "_blank",
        rel: "noopener noreferrer",
        title: `Visit ${partner.name}`,
      }
    : {};

  return (
    <Tag
      {...linkProps}
      className={cn(
        "group relative flex h-24 sm:h-28 w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.85rem)] md:w-[220px] min-w-[150px] sm:min-w-[170px] max-w-[220px] sm:max-w-[240px] items-center justify-center overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-md transition-all duration-300 hover:border-white/25 hover:bg-white/[0.08] hover:shadow-[0_0_25px_rgba(255,255,255,0.08)]",
        isLink && "cursor-pointer hover:border-brand-primary/40 hover:shadow-brand-glow-sm",
        className
      )}
    >
      {/* Top edge sheen */}
      <div className="absolute top-0 inset-x-4 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="flex items-center justify-center w-full h-full transition-transform duration-300 group-hover:scale-105">
        <img
          alt={partner.name}
          className={cn(
            "max-h-14 sm:max-h-16 w-auto max-w-[88%] object-contain opacity-85 transition-opacity duration-300 group-hover:opacity-100",
            partner.imgClassName
          )}
          loading="lazy"
          src={partner.image}
        />
      </div>
    </Tag>
  );
}

export function PartnersSection() {
  return (
    <section id="partners" className="relative scroll-mt-24 overflow-hidden py-24 bg-black">
      <GlitterFinal speed={0.75} intensity={5} />
      <div className="relative mx-auto max-w-6xl px-6">
        <SectionHeading
          title="OUR PARTNERS"
          subtitle="Supporting organizations, media partners, and student associations that form the community nodes of the Compsphere network."
        />

        <div className="mt-12 flex flex-col items-center gap-4 sm:gap-6">
          {/* Top Row: MNC */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5 }}
            className="flex justify-center w-full"
          >
            <PartnerCard partner={partnerTop} />
          </motion.div>

          {/* Bottom Row: Remaining Partners */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-wrap items-center justify-center gap-3.5 sm:gap-5 w-full"
          >
            {partnerBottom.map((partner) => (
              <PartnerCard key={partner.name} partner={partner} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}