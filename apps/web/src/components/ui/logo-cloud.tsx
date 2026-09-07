import React from "react";
import { cn } from "@/lib/utils";

type Logo = {
  src: string;
  alt: string;
  imgClassName?: string;
};

type LogoCloudProps = React.ComponentProps<"div"> & {
  logos: Logo[];
};

/**
 * Glassmorphic centered arrangement of sponsor/partner logos.
 * Top 3 headline logos (Threepoint, Featherless AI, NordVPN) are centered in a prominent top row.
 * Remaining logos are neatly flex-centered in balanced rows below.
 */
export function LogoCloud({ logos, className, ...props }: LogoCloudProps) {
  const topLogos = logos.slice(0, 3);
  const remainingLogos = logos.slice(3);

  return (
    <div className={cn("mx-auto max-w-5xl space-y-5 sm:space-y-6", className)} {...props}>
      {/* Top Tier Sponsors (Top 3: Threepoint, Featherless AI, NordVPN) */}
      {topLogos.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {topLogos.map((logo) => (
            <div
              key={logo.alt}
              className="group relative flex h-28 sm:h-32 w-full sm:w-[calc(33.333%-1.25rem)] min-w-[240px] max-w-[320px] items-center justify-center overflow-hidden rounded-[24px] border border-white/20 bg-gradient-to-b from-white/[0.09] to-white/[0.03] px-8 py-6 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.37)] transition-all duration-300 hover:scale-[1.03] hover:border-brand-primary/40 hover:bg-white/[0.10] hover:shadow-[0_16px_48px_rgba(124,58,237,0.25)]"
            >
              {/* Subtle top sheen */}
              <div className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
              <img
                alt={logo.alt}
                className={cn(
                  "max-h-16 md:max-h-20 w-auto max-w-[88%] object-contain opacity-90 transition-all duration-300 group-hover:opacity-100 group-hover:scale-105 filter drop-shadow-md",
                  logo.imgClassName
                )}
                loading="lazy"
                src={logo.src}
              />
            </div>
          ))}
        </div>
      )}

      {/* Remaining Sponsors (Centered Flex Grid) */}
      {remainingLogos.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3.5 sm:gap-5">
          {remainingLogos.map((logo) => (
            <div
              key={logo.alt}
              className="group flex h-24 sm:h-28 w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.85rem)] md:w-[calc(25%-1rem)] min-w-[170px] max-w-[240px] items-center justify-center overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.04] px-6 py-5 backdrop-blur-md transition-all duration-300 hover:border-white/25 hover:bg-white/[0.08] hover:shadow-[0_12px_30px_rgba(0,0,0,0.4)]"
            >
              <img
                alt={logo.alt}
                className={cn(
                  "max-h-12 md:max-h-14 w-auto max-w-[85%] object-contain opacity-85 transition-all duration-300 group-hover:opacity-100 group-hover:scale-105",
                  logo.imgClassName
                )}
                loading="lazy"
                src={logo.src}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LogoCloud;