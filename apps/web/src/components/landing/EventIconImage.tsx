import React from "react";

interface EventIconImageProps {
  src: string;
  alt?: string;
  className?: string;
  glow?: boolean;
}

export function EventIconImage({ src, alt = "", className = "", glow = true }: EventIconImageProps) {
  return (
    <span
      aria-hidden
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-white/[0.04] p-1.5 backdrop-blur-xl ${
        glow ? "shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_24px_rgba(0,245,200,0.09)]" : ""
      } ${className}`}
    >
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,245,200,0.14),transparent_70%)]" />
      <img
        src={src}
        alt={alt}
        className="relative h-full w-full object-contain drop-shadow-[0_0_14px_rgba(0,245,200,0.22)]"
      />
    </span>
  );
}