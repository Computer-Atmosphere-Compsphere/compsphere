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
  // Find specific sponsors for layout hierarchy
  const threepointLogo = logos.find((l) =>
    l.alt.toLowerCase().includes("threepoint")
  );

  const secondaryLogos = logos.filter(
    (l) =>
      l.alt.toLowerCase().includes("featherless") ||
      l.alt.toLowerCase().includes("nordvpn")
  );

  // Exclude Tier 1 & Tier 2 logos from remaining
  const remainingLogos = logos.filter((l) => {
    if (threepointLogo && l.alt === threepointLogo.alt) return false;
    if (secondaryLogos.some((s) => s.alt === l.alt)) return false;
    return true;
  });

  return (
    <div className={cn("mx-auto max-w-5xl space-y-6 sm:space-y-8", className)} {...props}>
      {/* ── 1. Top Tier (Headline Sponsor: Three Point) ── */}
      {threepointLogo && (
        <div className="flex justify-center w-full">
          <div
            key={threepointLogo.alt}
            className="group relative flex h-36 sm:h-44 md:h-48 w-full max-w-[340px] sm:max-w-[460px] md:max-w-[520px] items-center justify-center overflow-hidden rounded-[26px] border border-purple-500/30 bg-gradient-to-b from-purple-500/10 via-white/[0.06] to-white/[0.02] px-8 py-6 backdrop-blur-2xl transition-all duration-300 hover:border-purple-400/50 hover:bg-purple-500/15 shadow-[0_0_35px_rgba(168,85,247,0.12)] hover:shadow-[0_0_50px_rgba(168,85,247,0.25)]"
          >
            {/* Top glowing edge sheen */}
            <div className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-purple-300/40 to-transparent" />

            <img
              alt={threepointLogo.alt}
              className={cn(
                "max-h-24 sm:max-h-32 md:max-h-36 w-auto max-w-[90%] object-contain opacity-95 transition-all duration-300 group-hover:opacity-100 group-hover:scale-105 filter drop-shadow-[0_0_12px_rgba(168,85,247,0.3)]",
                threepointLogo.imgClassName
              )}
              loading="lazy"
              src={threepointLogo.src}
            />
          </div>
        </div>
      )}

      {/* ── 2. Second Tier (Featherless AI & NordVPN side-by-side) ── */}
      {secondaryLogos.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {secondaryLogos.map((logo) => (
            <div
              key={logo.alt}
              className="group relative flex h-28 sm:h-34 w-[calc(50%-0.6rem)] sm:w-[calc(50%-0.85rem)] max-w-[260px] sm:max-w-[320px] items-center justify-center overflow-hidden rounded-[22px] border border-white/15 bg-white/[0.05] px-6 py-5 backdrop-blur-xl transition-all duration-300 hover:border-white/30 hover:bg-white/[0.09]"
            >
              <div className="absolute top-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              <img
                alt={logo.alt}
                className={cn(
                  "max-h-18 sm:max-h-22 md:max-h-24 w-auto max-w-[88%] object-contain opacity-90 transition-all duration-300 group-hover:opacity-100 group-hover:scale-105",
                  logo.imgClassName
                )}
                loading="lazy"
                src={logo.src}
              />
            </div>
          ))}
        </div>
      )}

      {/* ── 3. Remaining Sponsors ── */}
      {remainingLogos.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3.5 sm:gap-5">
          {remainingLogos.map((logo) => (
            <div
              key={logo.alt}
              className="group flex h-24 sm:h-28 w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.85rem)] md:w-[calc(25%-1rem)] min-w-[150px] sm:min-w-[170px] max-w-[220px] sm:max-w-[240px] items-center justify-center overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07]"
            >
              <img
                alt={logo.alt}
                className={cn(
                  "max-h-16 md:max-h-18 w-auto max-w-[88%] object-contain opacity-85 transition-opacity duration-300 group-hover:opacity-100",
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