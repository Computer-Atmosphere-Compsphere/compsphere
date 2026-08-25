import React, { useEffect, useRef, useState } from "react";
import { ReactLenis, type LenisRef } from "lenis/react";
import "lenis/dist/lenis.css";
import { setActiveLenis } from "@/lib/smooth-scroll";

/**
 * Buttery Lenis smooth-scroll (lerped inertia) for the whole public surface —
 * the signature feel of modern web3 sites. Respects prefers-reduced-motion.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const ref = useRef<LenisRef>(null);
  const [reduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (reduced) return;
    const lenis = ref.current?.lenis;
    if (lenis) {
      setActiveLenis(lenis);
      return () => setActiveLenis(null);
    }
    // Lenis may not be mounted yet (child effects run first, but be safe).
    const t = window.setTimeout(() => {
      const later = ref.current?.lenis;
      if (later) setActiveLenis(later);
    }, 120);
    return () => {
      window.clearTimeout(t);
      setActiveLenis(null);
    };
  }, [reduced]);

  if (reduced) return <>{children}</>;

  return (
    <ReactLenis
      ref={ref}
      root
      options={{
        lerp: 0.06,
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.25,
        autoRaf: true,
      }}
    >
      {children}
    </ReactLenis>
  );
}