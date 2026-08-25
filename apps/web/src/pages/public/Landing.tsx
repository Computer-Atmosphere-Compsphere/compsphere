import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { HeroSection } from "@/components/landing/HeroSection";
import { LogoTicker } from "@/components/landing/LogoTicker";
import { SpeakersSection } from "@/components/landing/SpeakersSection";
import { SubEventsSection } from "@/components/landing/SubEventsSection";
import { TimelineSection } from "@/components/landing/TimelineSection";
import { PartnersSection } from "@/components/landing/PartnersSection";
import { sponsors } from "@/components/landing/events.data";
import { scrollToHash } from "@/lib/smooth-scroll";

const sectionIds = [
  "home",
  "sponsors",
  "speakers",
  "events",
  "timeline",
  "partners",
  "hacksphere",
  "talksphere",
  "festsphere",
  "exposphere",
];

/** Smooth-scrolls to #hash targets coming from the navbar (also cross-page). */
function useHashScroll() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const id = hash.replace("#", "");
    if (!sectionIds.includes(id)) return;
    // Wait a tick for the destination page to render, then glide to it.
    const t = window.setTimeout(() => {
      scrollToHash(`#${id}`, { offset: -88 });
    }, 80);
    return () => window.clearTimeout(t);
  }, [hash]);
}

export function Landing() {
  useHashScroll();

  return (
    <div className="relative">
      <HeroSection />

      {/* Hero → Sponsors smooth fade transition */}
      <div
        aria-hidden
        className="pointer-events-none relative z-30 -mt-40 h-40"
        style={{ background: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.15) 30%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.85) 80%, #000 100%)" }}
      />

      <LogoTicker
        title="OUR SPONSORS"
        subtitle="Official partners supporting the Compsphere ecosystem, building together, transparent like a distributed ledger."
        items={sponsors}
      />
      <SpeakersSection />
      <SubEventsSection />
      <TimelineSection />
      <PartnersSection />
    </div>
  );
}