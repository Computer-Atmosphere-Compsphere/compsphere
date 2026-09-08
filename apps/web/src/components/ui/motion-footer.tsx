"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import { scrollToTop } from "@/lib/smooth-scroll";
import { GlitterFinal } from "@/components/ui/animated-hero-with-web-gl-glitter";
import {
  ArrowUp,
  Instagram,
  Linkedin,
  Twitter,
  Facebook,
} from "lucide-react";

// Inline SVG icons for platforms not in Lucide
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.73a4.85 4.85 0 0 1-1.01-.04z" />
    </svg>
  );
}

function ThreadsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.473 12.01v-.017c.027-3.579.878-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.594 12c.022 3.086.714 5.494 2.051 7.158 1.432 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.7-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.808-1.062-.695-1.685-1.763-1.752-3.013-.144-2.705 1.87-4.699 5.089-4.927.573-.04 1.109-.065 1.658-.082V8.417c0-.01 0-.02-.001-.032-.065-.97-.753-1.546-1.891-1.546-.803 0-1.515.317-2.08.918l-1.476-1.382C9.976 5.474 11.037 5 12.365 5c2.075 0 3.389 1.079 3.508 2.89.01.153.015.308.015.462v2.082c.506-.042 1.027-.083 1.584-.083.376 0 .748.015 1.113.044l.012.001c.067.006.133.013.199.021l.035.005-.017-.005v.005l.017-.005c1.637.264 3.116 1.016 4.088 2.095 1.114 1.237 1.567 2.913 1.271 4.698-.534 3.246-2.976 5.498-7.004 5.772a14.012 14.012 0 0 1-.998.018zm.495-7.587c-.34.002-.675.02-1.005.054-1.716.167-2.585.976-2.516 2.292.041.771.424 1.346 1.136 1.709.48.246 1.064.36 1.686.326 1.068-.058 1.875-.458 2.399-1.19.523-.728.772-1.762.737-3.074-.147-.05-.298-.091-.455-.119a8.07 8.07 0 0 0-.982-.003l-.001.005z" />
    </svg>
  );
}

// Register ScrollTrigger safely for React
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// -------------------------------------------------------------------------
// 1. THEME-ADAPTIVE INLINE STYLES
// -------------------------------------------------------------------------
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');

.cinematic-footer-wrapper {
  font-family: 'Plus Jakarta Sans', sans-serif;
  -webkit-font-smoothing: antialiased;

  /* Dynamic Variables using standard shadcn/tailwind v4 tokens */
  --pill-bg-1: color-mix(in oklch, var(--foreground) 3%, transparent);
  --pill-bg-2: color-mix(in oklch, var(--foreground) 1%, transparent);
  --pill-shadow: color-mix(in oklch, var(--background) 50%, transparent);
  --pill-highlight: color-mix(in oklch, var(--foreground) 10%, transparent);
  --pill-inset-shadow: color-mix(in oklch, var(--background) 80%, transparent);
  --pill-border: color-mix(in oklch, var(--foreground) 8%, transparent);

  --pill-bg-1-hover: color-mix(in oklch, var(--foreground) 8%, transparent);
  --pill-bg-2-hover: color-mix(in oklch, var(--foreground) 2%, transparent);
  --pill-border-hover: color-mix(in oklch, var(--foreground) 20%, transparent);
  --pill-shadow-hover: color-mix(in oklch, var(--background) 70%, transparent);
  --pill-highlight-hover: color-mix(in oklch, var(--foreground) 20%, transparent);
}

@keyframes footer-breathe {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
  100% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
}

@keyframes footer-heartbeat {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 5px color-mix(in oklch, var(--destructive) 50%, transparent)); }
  15%, 45% { transform: scale(1.2); filter: drop-shadow(0 0 10px color-mix(in oklch, var(--destructive) 80%, transparent)); }
  30% { transform: scale(1); }
}

.animate-footer-breathe {
  animation: footer-breathe 8s ease-in-out infinite alternate;
}

.animate-footer-heartbeat {
  animation: footer-heartbeat 2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
}

/* Elegant blue-teal-mint Aurora (no neon green, no grid lines) */
.footer-aurora {
  background:
    radial-gradient(ellipse 75% 55% at 50% 130%, rgba(59, 130, 246, 0.15) 0%, transparent 60%),
    radial-gradient(ellipse 70% 50% at 78% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 55%),
    radial-gradient(ellipse 60% 50% at 18% 65%, rgba(139, 92, 246, 0.08) 0%, transparent 55%),
    radial-gradient(ellipse 45% 40% at 50% 55%, rgba(59, 130, 246, 0.06) 0%, transparent 60%);
}

/* Glass Pill Theming */
.footer-glass-pill {
  background: linear-gradient(145deg, var(--pill-bg-1) 0%, var(--pill-bg-2) 100%);
  box-shadow:
      0 10px 30px -10px var(--pill-shadow),
      inset 0 1px 1px var(--pill-highlight),
      inset 0 -1px 2px var(--pill-inset-shadow);
  border: 1px solid var(--pill-border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.footer-glass-pill:hover {
  background: linear-gradient(145deg, var(--pill-bg-1-hover) 0%, var(--pill-bg-2-hover) 100%);
  border-color: var(--pill-border-hover);
  box-shadow:
      0 20px 40px -10px var(--pill-shadow-hover),
      inset 0 1px 1px var(--pill-highlight-hover);
  color: var(--foreground);
}

/* Giant Background Text Masking */
.footer-giant-bg-text {
  font-size: 24vw;
  line-height: 0.78;
  font-weight: 900;
  letter-spacing: -0.05em;
  color: transparent;
  -webkit-text-stroke: 1px color-mix(in oklch, var(--foreground) 5%, transparent);
  background: linear-gradient(180deg, color-mix(in oklch, var(--foreground) 10%, transparent) 0%, transparent 60%);
  -webkit-background-clip: text;
  background-clip: text;
}

/* Metallic Text Glow */
.footer-text-glow {
  background: linear-gradient(180deg, var(--foreground) 0%, color-mix(in oklch, var(--foreground) 40%, transparent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0px 0px 20px color-mix(in oklch, var(--foreground) 15%, transparent));
}

/* Brand word — hero font + bold yet elegant flowing gradient */
.footer-brand-text {
  font-family: 'Plus Jakarta Sans', Inter, sans-serif;
  font-weight: 900;
  letter-spacing: -0.02em;
  background: linear-gradient(
    160deg,
    #FFFFFF 0%,
    #70E0F8 25%,
    #71FFE7 50%,
    #70E0F8 75%,
    #FFFFFF 100%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  animation:
    footer-brand-shift 14s cubic-bezier(0.45, 0, 0.25, 1) infinite alternate,
    footer-brand-glow 5s ease-in-out infinite alternate;
}

@keyframes footer-brand-shift {
  0%   { background-position: 0% 50%; }
  100% { background-position: 100% 50%; }
}

@keyframes footer-brand-glow {
  from {
    filter: drop-shadow(0 0 16px rgba(112, 224, 248, 0.45))
            drop-shadow(0 0 42px rgba(113, 255, 231, 0.25));
  }
  to {
    filter: drop-shadow(0 0 26px rgba(113, 255, 231, 0.6))
            drop-shadow(0 0 60px rgba(112, 224, 248, 0.35));
  }
}
`;

// -------------------------------------------------------------------------
// 2. MAGNETIC BUTTON PRIMITIVE (Zero Dependency)
// -------------------------------------------------------------------------
export type MagneticButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    as?: React.ElementType;
  };

const MagneticButton = React.forwardRef<HTMLElement, MagneticButtonProps>(
  ({ className, children, as: Component = "button", ...props }, forwardedRef) => {
    const localRef = useRef<HTMLElement>(null);

    useEffect(() => {
      if (typeof window === "undefined") return;
      const element = localRef.current;
      if (!element) return;

      const ctx = gsap.context(() => {
        const handleMouseMove = (e: MouseEvent) => {
          const rect = element.getBoundingClientRect();
          const h = rect.width / 2;
          const w = rect.height / 2;
          const x = e.clientX - rect.left - h;
          const y = e.clientY - rect.top - w;

          gsap.to(element, {
            x: x * 0.4,
            y: y * 0.4,
            rotationX: -y * 0.15,
            rotationY: x * 0.15,
            scale: 1.05,
            ease: "power2.out",
            duration: 0.4,
          });
        };

        const handleMouseLeave = () => {
          gsap.to(element, {
            x: 0,
            y: 0,
            rotationX: 0,
            rotationY: 0,
            scale: 1,
            ease: "elastic.out(1, 0.3)",
            duration: 1.2,
          });
        };

        element.addEventListener("mousemove", handleMouseMove as any);
        element.addEventListener("mouseleave", handleMouseLeave);

        return () => {
          element.removeEventListener("mousemove", handleMouseMove as any);
          element.removeEventListener("mouseleave", handleMouseLeave);
        };
      }, element);

      return () => ctx.revert();
    }, []);

    return (
      <Component
        ref={(node: HTMLElement) => {
          (localRef as any).current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) (forwardedRef as any).current = node;
        }}
        className={cn("cursor-pointer", className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
MagneticButton.displayName = "MagneticButton";

// -------------------------------------------------------------------------
// 3. MAIN COMPONENT
// -------------------------------------------------------------------------
const SOCIAL_LINKS = [
  { label: "Instagram",  href: "https://instagram.com/compsphere",             icon: Instagram },
  { label: "LinkedIn",   href: "https://linkedin.com/company/compshere",       icon: Linkedin },
  { label: "X",          href: "https://x.com/compsphere_",                    icon: Twitter },
  { label: "Facebook",   href: "https://facebook.com/Comp-Sphere",             icon: Facebook },
  { label: "TikTok",     href: "https://tiktok.com/@compsphere",               icon: TikTokIcon },
  { label: "Threads",    href: "https://threads.net/@compsphere",              icon: ThreadsIcon },
];

export function CinematicFooter({ onHiddenLogin }: { onHiddenLogin?: () => void } = {}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const giantTextRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const bottomBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!wrapperRef.current) return;

    // Start with pointer-events disabled so the footer doesn't block clicks
    // on elements above it (hero buttons, navbar, etc.)
    if (contentRef.current) contentRef.current.style.pointerEvents = "none";
    if (bottomBarRef.current) bottomBarRef.current.style.pointerEvents = "none";

    // React strict mode compatible GSAP context cleanup
    const ctx = gsap.context(() => {
      // Background Parallax
      gsap.fromTo(
        giantTextRef.current,
        { y: "10vh", scale: 0.8, opacity: 0 },
        {
          y: "0vh",
          scale: 1,
          opacity: 1,
          ease: "power1.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 80%",
            end: "bottom bottom",
            scrub: 1,
          },
        }
      );

      // Staggered Content Reveal
      gsap.fromTo(
        [headingRef.current, linksRef.current],
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 40%",
            end: "bottom bottom",
            scrub: 1,
          },
        }
      );

      // Toggle pointer-events: the fixed footer covers the whole viewport,
      // so we only enable clicks when the footer is actually in view.
      ScrollTrigger.create({
        trigger: wrapperRef.current,
        start: "top 70%",
        end: "bottom top",
        onEnter: () => {
          if (contentRef.current) contentRef.current.style.pointerEvents = "auto";
          if (bottomBarRef.current) bottomBarRef.current.style.pointerEvents = "auto";
        },
        onLeaveBack: () => {
          if (contentRef.current) contentRef.current.style.pointerEvents = "none";
          if (bottomBarRef.current) bottomBarRef.current.style.pointerEvents = "none";
        },
        onLeave: () => {
          if (contentRef.current) contentRef.current.style.pointerEvents = "none";
          if (bottomBarRef.current) bottomBarRef.current.style.pointerEvents = "none";
        },
        onEnterBack: () => {
          if (contentRef.current) contentRef.current.style.pointerEvents = "auto";
          if (bottomBarRef.current) bottomBarRef.current.style.pointerEvents = "auto";
        },
      });
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/*
        The "Curtain Reveal" Wrapper:
        It sits in standard flow. Because it has clip-path, its contents
        are ONLY visible within its bounding box.
      */}
      <div
        ref={wrapperRef}
        className="relative h-screen w-full"
        style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        {/* The actual footer stays fixed to the viewport underneath everything */}
        <footer className="pointer-events-none fixed bottom-0 left-0 flex h-screen w-full flex-col justify-between overflow-hidden bg-black text-foreground cinematic-footer-wrapper">

          {/* Ambient Light (elegant blue-teal aurora) */}
          <div className="footer-aurora absolute left-1/2 top-1/2 h-[70vh] w-[85vw] -translate-x-1/2 -translate-y-1/2 animate-footer-breathe rounded-[50%] blur-[80px] pointer-events-none z-0" />
          {/* Soft neutral top light, echoes the glass sections above it */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0"
            style={{ background: "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(255,255,255,0.045), transparent 65%)" }}
          />
          {/* Interactive glitter — same living background as every landing section */}
          <GlitterFinal speed={0.75} intensity={3} uvScale={2.0} className="z-0" />

          {/* Giant background text */}
          <div
            ref={giantTextRef}
            className="footer-giant-bg-text absolute -bottom-[5vh] left-1/2 -translate-x-1/2 whitespace-nowrap z-0 pointer-events-none select-none"
          >
            COMPSPHERE
          </div>

          {/* 2. Main Center Content */}
          <div ref={contentRef} className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 mt-0 w-full max-w-5xl mx-auto">
            <img
              src="/compsphere-logo.png"
              alt="Compsphere"
              className="h-20 md:h-32 w-auto mb-8 drop-shadow-[0_10px_40px_rgba(0,245,200,0.25)]"
            />

            <h2
              ref={headingRef}
              className="relative z-20 -translate-y-10 text-3xl sm:text-5xl md:text-8xl font-black footer-text-glow tracking-tighter mb-5 text-center"
            >
              Ready to join <span className="footer-brand-text">COMPSPHERE</span>?
            </h2>
            <p className="text-muted-foreground text-sm md:text-base font-medium max-w-lg text-center mb-5">
              Be the part of our journey & sphere your spirit!
            </p>

            {/* Interactive Magnetic Pills Layout */}
            <div ref={linksRef} className="flex flex-col items-center gap-6 w-full">
              {/* Primary CTAs */}
              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-4 w-full">
                <MagneticButton
                  as="a"
                  href="/#events"
                  className="footer-glass-pill px-6 sm:px-10 py-4 sm:py-5 rounded-full text-foreground font-bold text-sm md:text-base flex items-center gap-3 group w-full sm:w-auto justify-center"
                >
                  <img
                    src="/compsphere-logo.png"
                    alt="Compsphere"
                    className="h-6 w-auto drop-shadow-[0_0_14px_rgba(0,245,200,0.35)] transition-transform duration-300 group-hover:scale-110"
                  />
                  Join the Event
                </MagneticButton>

              </div>

              {/* Social Media Links */}
              <div className="flex flex-wrap justify-center gap-3 md:gap-4 w-full mt-2">
                {SOCIAL_LINKS.map((s) => (
                  <MagneticButton
                    key={s.label}
                    as="a"
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-glass-pill px-5 py-3 rounded-full text-muted-foreground font-medium text-xs md:text-sm flex items-center gap-2 hover:text-foreground"
                  >
                    <s.icon className="w-4 h-4" />
                    {s.label}
                  </MagneticButton>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Bottom Bar / Credits */}
          <div ref={bottomBarRef} className="relative z-20 w-full pb-8 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6">

            {/* Copyright */}
            <div className="text-muted-foreground text-[10px] md:text-xs font-semibold tracking-widest uppercase order-2 md:order-1">
              © 2026 {onHiddenLogin ? (
                <button onClick={onHiddenLogin} className="cursor-pointer bg-transparent border-0 p-0 text-[inherit] text-[inherit] hover:text-white/40 transition-colors duration-500" aria-label="Staff login">
                  Compsphere
                </button>
              ) : (
                <>Compsphere</>
              )}. All rights reserved.
            </div>

            {/* Back to top */}
            <MagneticButton
              as="button"
              onClick={scrollToTop}
              className="w-12 h-12 rounded-full footer-glass-pill flex items-center justify-center text-muted-foreground hover:text-foreground group order-3"
            >
              <ArrowUp className="w-5 h-5 transform group-hover:-translate-y-1.5 transition-transform duration-300" />
            </MagneticButton>

          </div>
        </footer>
      </div>
    </>
  );
}