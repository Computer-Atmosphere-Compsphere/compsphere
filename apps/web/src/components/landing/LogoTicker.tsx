import React from "react";
import { motion } from "framer-motion";
import { SectionHeading } from "./SectionHeading";
import { LogoCloud } from "@/components/ui/logo-cloud";
import { GlitterFinal } from "@/components/ui/animated-hero-with-web-gl-glitter";



interface LogoTickerProps {
  title: string;
  subtitle: string;
  items: { name: string; monogram: string; style: string; image: string }[];
  icon?: React.ReactNode;
}

export function LogoTicker({ title, subtitle, items, icon }: LogoTickerProps) {
  const logos = items.map((item) => ({
    src: item.image,
    alt: item.name,
    imgClassName: undefined,
  }));

  return (
    <section id="sponsors" className="relative z-40 scroll-mt-24 overflow-hidden py-16 bg-black">
      <GlitterFinal speed={0.75} intensity={5} />
      <div className="relative mx-auto max-w-6xl px-6">
        <SectionHeading
          title={title}
          subtitle={subtitle}
          icon={icon}
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="relative mt-10"
        >
          <LogoCloud logos={logos} />
        </motion.div>
      </div>
    </section>
  );
}