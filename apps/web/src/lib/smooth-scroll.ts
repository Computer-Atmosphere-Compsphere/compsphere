import type Lenis from "lenis";

let activeLenis: Lenis | null = null;

export function setActiveLenis(lenis: Lenis | null) {
  activeLenis = lenis;
}

export function getActiveLenis() {
  return activeLenis;
}

const easeInOutQuart = (t: number) =>
  t < 0.5 ? 8 * t * t * t * t : 1 - 8 * Math.pow(-t + 1, 4);

/**
 * Glides back to the very top of the page (Home).
 */
export function scrollToTop({ duration = 1.8 }: { duration?: number } = {}) {
  const lenis = getActiveLenis();
  if (lenis) {
    lenis.scrollTo(0, { duration, easing: easeInOutQuart });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

interface ScrollToOpts {
  block?: "start" | "center";
  offset?: number;
  duration?: number;
}

/**
 * Smooth-scrolls to a hash target. Prefers the Lenis instance (buttery lerped
 * scroll) and falls back to native smooth scrolling when it is unavailable.
 * Navigation glides are extra-long and silk-eased for a cinematic feel.
 */
export function scrollToHash(
  hash: string,
  { block = "start", offset = 0, duration = 1.8 }: ScrollToOpts = {}
) {
  const el = document.querySelector(hash);
  if (!el) return;

  const lenis = getActiveLenis();
  if (!lenis) {
    el.scrollIntoView({ behavior: "smooth", block });
    return;
  }

  if (block === "center") {
    const rect = el.getBoundingClientRect();
    const target = rect.top + window.scrollY - window.innerHeight / 2 + rect.height / 2;
    lenis.scrollTo(target, { duration, easing: easeInOutQuart });
  } else {
    const targetEl = el as HTMLElement;
    lenis.scrollTo(targetEl, { offset, duration, easing: easeInOutQuart });
  }
}