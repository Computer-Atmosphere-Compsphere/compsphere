import { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  maxOpacity: number;
  life: number;
  maxLife: number;
  color: string;
  twinkleSpeed: number;
  twinkleOffset: number;
}

interface InteractiveGlitterBgProps {
  className?: string;
  /** Base particle count (auto-scaled with canvas area) */
  density?: number;
  /** Mouse influence radius in px */
  mouseRadius?: number;
  /** Mouse repulsion / attraction strength */
  mouseStrength?: number;
  /** Color palette for sparkles */
  colors?: string[];
}

const DEFAULT_COLORS = [
  "255,255,255",   // white
  "180,200,255",   // cool blue
  "200,170,255",   // soft purple
  "0,245,200",     // brand teal
  "160,230,255",   // ice blue
];

/**
 * InteractiveGlitterBg
 * Canvas-based dark glitter background with mouse-reactive sparkle particles.
 * Particles are attracted towards the cursor and twinkle independently.
 */
export function InteractiveGlitterBg({
  className = "",
  density = 120,
  mouseRadius = 140,
  mouseStrength = 0.45,
  colors = DEFAULT_COLORS,
}: InteractiveGlitterBgProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const particlesRef = useRef<Particle[]>([]);
  const timeRef = useRef(0);

  const makeParticle = useCallback(
    (w: number, h: number): Particle => {
      const life = 120 + Math.random() * 240;
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: 0.5 + Math.random() * 1.8,
        opacity: 0,
        maxOpacity: 0.25 + Math.random() * 0.65,
        life: 0,
        maxLife: life,
        color: colors[Math.floor(Math.random() * colors.length)],
        twinkleSpeed: 0.02 + Math.random() * 0.04,
        twinkleOffset: Math.random() * Math.PI * 2,
      };
    },
    [colors]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w;
      canvas.height = h;
    };
    resize();

    // Populate initial particles spread across the canvas
    const count = Math.round((w * h) / (1920 * 1080 / density));
    particlesRef.current = Array.from({ length: count }, () => {
      const p = makeParticle(w, h);
      // Start at random life point so canvas isn't empty on mount
      p.life = Math.random() * p.maxLife;
      p.opacity = p.maxOpacity * Math.sin((p.life / p.maxLife) * Math.PI);
      return p;
    });

    const ro = new ResizeObserver(() => {
      resize();
    });
    ro.observe(canvas.parentElement!);

    // Spawn burst of sparkles near cursor on move
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };

      // Occasionally spawn a quick sparkle at cursor
      if (Math.random() < 0.18) {
        const p = makeParticle(w, h);
        p.x = mouseRef.current.x + (Math.random() - 0.5) * 24;
        p.y = mouseRef.current.y + (Math.random() - 0.5) * 24;
        p.size = 0.8 + Math.random() * 2.2;
        p.maxOpacity = 0.6 + Math.random() * 0.35;
        p.maxLife = 60 + Math.random() * 80;
        p.life = 0;
        p.vx = (Math.random() - 0.5) * 0.8;
        p.vy = (Math.random() - 0.5) * 0.8;
        particlesRef.current.push(p);
        // Keep under hard cap
        if (particlesRef.current.length > count + 180) {
          particlesRef.current.splice(0, particlesRef.current.length - (count + 180));
        }
      }
    };

    const onMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    window.addEventListener("mousemove", onMouseMove);
    canvas.parentElement!.addEventListener("mouseleave", onMouseLeave);

    const draw = () => {
      timeRef.current += 1;
      ctx.clearRect(0, 0, w, h);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];

        // Life cycle
        p.life += 1;
        if (p.life >= p.maxLife) {
          // Recycle particle
          const fresh = makeParticle(w, h);
          particlesRef.current[i] = fresh;
          continue;
        }

        // Fade in / fade out using a sine envelope
        const lifePct = p.life / p.maxLife;
        const envelope = Math.sin(lifePct * Math.PI);

        // Twinkle modulation on top of the envelope
        const twinkle =
          0.7 + 0.3 * Math.sin(timeRef.current * p.twinkleSpeed + p.twinkleOffset);
        p.opacity = p.maxOpacity * envelope * twinkle;

        // Mouse attraction: pull particles gently toward cursor
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouseRadius && dist > 0.5) {
          const force = (1 - dist / mouseRadius) * mouseStrength;
          p.vx += (dx / dist) * force * 0.12;
          p.vy += (dy / dist) * force * 0.12;
        }

        // Gentle drag so they don't fly off
        p.vx *= 0.96;
        p.vy *= 0.96;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < 0) p.x += w;
        if (p.x > w) p.x -= w;
        if (p.y < 0) p.y += h;
        if (p.y > h) p.y -= h;

        // Draw the sparkle as a glowing dot with cross flare
        if (p.opacity <= 0) continue;

        const r = p.size;
        const alpha = p.opacity;

        // Outer soft glow
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3.5);
        grd.addColorStop(0, `rgba(${p.color},${alpha})`);
        grd.addColorStop(0.4, `rgba(${p.color},${alpha * 0.4})`);
        grd.addColorStop(1, `rgba(${p.color},0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Core bright dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${Math.min(1, alpha * 1.6)})`;
        ctx.fill();

        // Cross lens flare for larger sparkles
        if (r > 1.1) {
          ctx.save();
          ctx.globalAlpha = alpha * 0.55;
          ctx.strokeStyle = `rgba(${p.color},1)`;
          ctx.lineWidth = 0.4;
          const fl = r * 5;
          ctx.beginPath();
          ctx.moveTo(p.x - fl, p.y);
          ctx.lineTo(p.x + fl, p.y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - fl);
          ctx.lineTo(p.x, p.y + fl);
          ctx.stroke();
          ctx.restore();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      canvas.parentElement?.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [density, mouseRadius, mouseStrength, makeParticle]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
