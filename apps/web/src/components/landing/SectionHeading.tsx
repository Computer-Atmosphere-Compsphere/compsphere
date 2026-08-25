import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function SectionHeading({ title, subtitle, icon, className }: SectionHeadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.6 }}
      className={cn("relative text-center", className)}
    >
      <h2 className="font-display text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
        {icon && <span className="mr-2 inline-block align-middle">{icon}</span>}
        <span className="bg-white-gradient bg-clip-text text-transparent">{title}</span>
      </h2>
      {subtitle && (
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}