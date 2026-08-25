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
 * Glassmorphic grid of sponsor/partner logos. Images are centered, sized to
 * fill clearly, with a subtle lift on hover. 6 logos → 3×3; 7-8 → 4 columns.
 */
export function LogoCloud({ logos, className, ...props }: LogoCloudProps) {
  const cols = logos.length >= 7
    ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
    : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-3";

  return (
    <div
      className={cn(
        "mx-auto grid max-w-5xl gap-5",
        cols,
        className
      )}
      {...props}
    >
      {logos.map((logo) => (
        <div
          className="group flex items-center justify-center overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.04] px-10 py-12 backdrop-blur-md transition-all duration-300 hover:border-white/25 hover:bg-white/[0.07] hover:shadow-[0_16px_40px_rgba(0,0,0,0.4)]"
          key={logo.alt}
        >
          <img
            alt={logo.alt}
            className={cn(
              "max-h-20 w-auto max-w-full object-contain transition-transform duration-500 group-hover:scale-110 md:max-h-24",
              logo.imgClassName
            )}
            loading="lazy"
            src={logo.src}
          />
        </div>
      ))}
    </div>
  );
}

export default LogoCloud;