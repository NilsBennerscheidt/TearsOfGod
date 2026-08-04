"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const MIN_DELAY_MS = 60_000;
const MAX_DELAY_MS = 300_000;
const GLOW_DURATION_MS = 2200;

// Eye-hole centers as a % of the mask's own box — measured directly off
// public/brand/mask.png (512×512): left hole ~(190,415), right ~(325,415).
const EYES = [
  { left: "37.1%", top: "81.4%" },
  { left: "63.5%", top: "81.4%" },
];

/**
 * Ambient easter egg for MaskGlyph's `eyes` prop: the mask's eye holes
 * light up with a brief ember-red glow at a random 60–300s interval, then
 * fade out and reschedule. A dedicated Client Component rather than
 * making MaskGlyph itself "use client" — most mask instances across the
 * site don't pass `eyes` and stay fully server-rendered.
 */
export function MaskEyesGlow() {
  const [glowing, setGlowing] = useState(false);

  useEffect(() => {
    // Decorative-only motion — under reduced motion, the eyes simply
    // never light up, same as .tog-gold-glow going static elsewhere.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let glowTimeout: ReturnType<typeof setTimeout>;
    let scheduleTimeout: ReturnType<typeof setTimeout>;

    const schedule = () => {
      const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
      scheduleTimeout = setTimeout(() => {
        setGlowing(true);
        glowTimeout = setTimeout(() => {
          setGlowing(false);
          schedule();
        }, GLOW_DURATION_MS);
      }, delay);
    };

    schedule();
    return () => {
      clearTimeout(scheduleTimeout);
      clearTimeout(glowTimeout);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0">
      {EYES.map((pos, i) => (
        <span
          key={i}
          className={cn("tog-mask-eye", glowing && "tog-mask-eye-glowing")}
          style={{ left: pos.left, top: pos.top }}
        />
      ))}
    </div>
  );
}
