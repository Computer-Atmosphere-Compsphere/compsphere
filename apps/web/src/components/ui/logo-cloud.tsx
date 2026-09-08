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
function getRows(remaining: Logo[]) {
  if (remaining.length === 10) {
    return [
      remaining.slice(0, 2),
      remaining.slice(2, 5),
      remaining.slice(5, 8),
      remaining.slice(8, 10),
    ];
  }

  // Fallback row chunking for sub-events or other sponsor list sizes
  const rows: Logo[][] = [];
  let i = 0;
  while (i < remaining.length) {
    const chunkSize = (remaining.length - i) % 3 === 0 ? 3 : 2;
    rows.push(remaining.slice(i, i + Math.min(chunkSize, remaining.length - i)));
    i += chunkSize;
  }
  return rows;
}

export function LogoCloud({ logos, className, ...props }: LogoCloudProps) {
  // Find Three Point logo for top center position
  const threepointLogo = logos.find((l) =>
    l.alt.toLowerCase().includes("threepoint")
  );

  // Exclude Three Point from remaining logos list
  const remainingLogos = logos.filter(
    (l) => !threepointLogo || l.alt !== threepointLogo.alt
  );

  const remainingRows = getRows(remainingLogos);

  return (
    <div className={cn("mx-auto max-w-5xl space-y-4 sm:space-y-6", className)} {...props}>
      {/* ── Row 1: Headline Sponsor (Three Point - Larger & Neutral Glass) ── */}
      {threepointLogo && (
        <div className="flex justify-center w-full">
          <div
            key={threepointLogo.alt}
            className="group relative flex h-36 sm:h-44 md:h-48 w-full max-w-[340px] sm:max-w-[460px] md:max-w-[520px] items-center justify-center overflow-hidden rounded-[26px] border border-white/20 bg-gradient-to-b from-white/10 via-white/[0.05] to-white/[0.02] px-8 py-6 backdrop-blur-2xl transition-all duration-300 hover:border-white/35 hover:bg-white/[0.12] shadow-[0_0_30px_rgba(255,255,255,0.06)] hover:shadow-[0_0_45px_rgba(255,255,255,0.12)]"
          >
            {/* Neutral top edge sheen */}
            <div className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

            <img
              alt={threepointLogo.alt}
              className={cn(
                "max-h-24 sm:max-h-32 md:max-h-36 w-auto max-w-[90%] object-contain opacity-95 transition-all duration-300 group-hover:opacity-100 group-hover:scale-105 filter drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]",
                threepointLogo.imgClassName
              )}
              loading="lazy"
              src={threepointLogo.src}
            />
          </div>
        </div>
      )}

      {/* ── Rows 2 to 5: Remaining Sponsors in Balanced Rows ── */}
      {remainingRows.map((rowLogos, rowIndex) => (
        <div
          key={rowIndex}
          className="flex flex-wrap items-center justify-center gap-3.5 sm:gap-5"
        >
          {rowLogos.map((logo) => (
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
      ))}
    </div>
  );
}

export default LogoCloud;