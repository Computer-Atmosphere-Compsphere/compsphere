"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import createGlobe from "cobe";

interface AnalyticsMarker {
  id: string;
  location: [number, number];
  visitors: number;
  label: string;
}

interface GlobeAnalyticsProps {
  markers?: AnalyticsMarker[];
  className?: string;
  speed?: number;
}

/**
 * 300 participants total from 20+ countries.
 * Indonesia as host has the largest delegation.
 */
const defaultMarkers: AnalyticsMarker[] = [
  // Indonesia — Host Country (68)
  { id: "id-1", location: [-6.21, 106.85], visitors: 48, label: "Indonesia" },
  { id: "id-2", location: [-7.25, 112.75], visitors: 14, label: "Indonesia" },
  { id: "id-3", location: [-8.34, 115.09], visitors: 6, label: "Indonesia" },

  // India (52)
  { id: "in-1", location: [28.61, 77.21], visitors: 32, label: "India" },
  { id: "in-2", location: [19.08, 72.88], visitors: 12, label: "India" },
  { id: "in-3", location: [12.97, 77.59], visitors: 8, label: "India" },

  // China (28)
  { id: "cn-1", location: [39.90, 116.40], visitors: 18, label: "China" },
  { id: "cn-2", location: [31.23, 121.47], visitors: 10, label: "China" },

  // Pakistan (20)
  { id: "pk-1", location: [24.86, 67.01], visitors: 13, label: "Pakistan" },
  { id: "pk-2", location: [31.55, 74.35], visitors: 7, label: "Pakistan" },

  // USA (22)
  { id: "us-1", location: [37.77, -122.42], visitors: 10, label: "USA" },
  { id: "us-2", location: [40.71, -74.01], visitors: 8, label: "USA" },
  { id: "us-3", location: [30.27, -97.74], visitors: 4, label: "USA" },

  // Nigeria (10)
  { id: "ng-1", location: [6.52, 3.38], visitors: 10, label: "Nigeria" },

  // Philippines (8)
  { id: "ph-1", location: [14.60, 120.98], visitors: 8, label: "Philippines" },

  // Bangladesh (8)
  { id: "bd-1", location: [23.81, 90.41], visitors: 8, label: "Bangladesh" },

  // UK (7)
  { id: "uk-1", location: [51.51, -0.13], visitors: 7, label: "UK" },

  // Japan (6)
  { id: "jp-1", location: [35.68, 139.65], visitors: 6, label: "Japan" },

  // South Africa (6)
  { id: "za-1", location: [-26.20, 28.04], visitors: 6, label: "South Africa" },

  // Kenya (5)
  { id: "ke-1", location: [-1.29, 36.82], visitors: 5, label: "Kenya" },

  // Germany (5)
  { id: "de-1", location: [52.52, 13.41], visitors: 5, label: "Germany" },

  // South Korea (5)
  { id: "kr-1", location: [37.57, 126.98], visitors: 5, label: "South Korea" },

  // Malaysia (5)
  { id: "my-1", location: [3.14, 101.69], visitors: 5, label: "Malaysia" },

  // Vietnam (5)
  { id: "vn-1", location: [10.82, 106.63], visitors: 5, label: "Vietnam" },

  // Singapore (4)
  { id: "sg-1", location: [1.35, 103.82], visitors: 4, label: "Singapore" },

  // France (4)
  { id: "fr-1", location: [48.86, 2.35], visitors: 4, label: "France" },

  // Netherlands (4)
  { id: "nl-1", location: [52.37, 4.90], visitors: 4, label: "Netherlands" },

  // Egypt (4)
  { id: "eg-1", location: [30.04, 31.24], visitors: 4, label: "Egypt" },

  // Taiwan (3)
  { id: "tw-1", location: [25.03, 121.57], visitors: 3, label: "Taiwan" },

  // Thailand (3)
  { id: "th-1", location: [13.76, 100.50], visitors: 3, label: "Thailand" },

  // Spain (3)
  { id: "es-1", location: [40.42, -3.70], visitors: 3, label: "Spain" },

  // Brazil (3)
  { id: "br-1", location: [-23.55, -46.63], visitors: 3, label: "Brazil" },

  // Turkey (3)
  { id: "tr-1", location: [41.01, 28.98], visitors: 3, label: "Turkey" },

  // Mexico (3)
  { id: "mx-1", location: [19.43, -99.13], visitors: 3, label: "Mexico" },

  // Cambodia (2)
  { id: "kh-1", location: [11.56, 104.92], visitors: 2, label: "Cambodia" },

  // Sri Lanka (2)
  { id: "lk-1", location: [6.93, 79.84], visitors: 2, label: "Sri Lanka" },

  // Morocco (2)
  { id: "ma-1", location: [33.57, -7.59], visitors: 2, label: "Morocco" },

  // Australia (3)
  { id: "au-1", location: [-33.87, 151.21], visitors: 3, label: "Australia" },

  // Canada (2)
  { id: "ca-1", location: [43.65, -79.38], visitors: 2, label: "Canada" },
];

export function GlobeAnalytics({
  markers: initialMarkers = defaultMarkers,
  className = "",
  speed = 0.003,
}: GlobeAnalyticsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null);
  const dragOffset = useRef({ phi: 0, theta: 0 });
  const phiOffsetRef = useRef(0);
  const thetaOffsetRef = useRef(0);
  const isPausedRef = useRef(false);
  const [data] = useState(initialMarkers);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerInteracting.current = { x: e.clientX, y: e.clientY };
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
    isPausedRef.current = true;
  }, []);

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiOffsetRef.current += dragOffset.current.phi;
      thetaOffsetRef.current += dragOffset.current.theta;
      dragOffset.current = { phi: 0, theta: 0 };
    }
    pointerInteracting.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = "grab";
    isPausedRef.current = false;
  }, []);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (pointerInteracting.current !== null) {
        dragOffset.current = {
          phi: (e.clientX - pointerInteracting.current.x) / 300,
          theta: (e.clientY - pointerInteracting.current.y) / 1000,
        };
      }
    };
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handlePointerUp]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    let globe: ReturnType<typeof createGlobe> | null = null;
    let animationId: number;
    let phi = 0;

    function init() {
      const width = canvas.offsetWidth;
      if (width === 0 || globe) return;

      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width,
        height: width,
        phi: 0,
        theta: 0.2,
        dark: 0,
        diffuse: 1.5,
        mapSamples: 16000,
        mapBrightness: 10,
        baseColor: [1, 1, 1],
        markerColor: [0.3, 0.85, 0.45],
        glowColor: [0.94, 0.93, 0.91],
        markerElevation: 0,
        markers: initialMarkers.map((m) => ({ location: m.location, size: 0.04, id: m.id })),
        arcs: [],
        arcColor: [0.25, 0.9, 0.5],
        arcWidth: 0.5,
        arcHeight: 0.25,
        opacity: 0.7,
      });

      function animate() {
        if (!isPausedRef.current) phi += speed;
        globe!.update({
          phi: phi + phiOffsetRef.current + dragOffset.current.phi,
          theta: 0.2 + thetaOffsetRef.current + dragOffset.current.theta,
        });
        animationId = requestAnimationFrame(animate);
      }
      animate();
      setTimeout(() => canvas && (canvas.style.opacity = "1"));
    }

    if (canvas.offsetWidth > 0) {
      init();
    } else {
      const ro = new ResizeObserver((entries) => {
        if (entries[0]?.contentRect.width > 0) {
          ro.disconnect();
          init();
        }
      });
      ro.observe(canvas);
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (globe) globe.destroy();
    };
  }, [initialMarkers, speed]);

  return (
    <div className={`relative aspect-square select-none ${className}`}>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        style={{
          width: "100%",
          height: "100%",
          cursor: "grab",
          opacity: 0,
          transition: "opacity 1.2s ease",
          borderRadius: "50%",
          touchAction: "none",
        }}
      />
      {data.map((m) => (
        <div
          key={m.id}
          style={{
            position: "absolute",
            positionAnchor: `--cobe-${m.id}` as any,
            bottom: "anchor(top)",
            left: "anchor(center)",
            translate: "-50% 0",
            marginBottom: 6,
            display: "flex",
            alignItems: "baseline",
            gap: "0.25rem",
            padding: "0.2rem 0.4rem",
            background: "rgba(0,0,0,0.80)",
            borderRadius: 3,
            pointerEvents: "none" as const,
            whiteSpace: "nowrap" as const,
            opacity: `var(--cobe-visible-${m.id}, 0)`,
            filter: `blur(calc((1 - var(--cobe-visible-${m.id}, 0)) * 8px))`,
            transition: "opacity 0.3s, filter 0.3s",
          }}
        >
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.55rem",
              fontWeight: 600,
              color: "rgba(255,255,255,0.75)",
              letterSpacing: "0.01em",
            }}
          >
            {m.label}
          </span>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "0.5rem",
              fontWeight: 500,
              color: "rgba(255,255,255,0.4)",
            }}
          >
            {m.visitors}
          </span>
        </div>
      ))}
    </div>
  );
}
