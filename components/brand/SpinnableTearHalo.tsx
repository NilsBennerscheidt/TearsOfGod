"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { TearHalo } from "./TearHalo";

interface SpinnableTearHaloProps {
  size?: number;
  strokeW?: number;
  title?: string;
  className?: string;
}

/**
 * TearHalo with a tap/click-triggered full turn — a small, delightful
 * response to a touch rather than pure decoration. Layers on top of
 * TearHalo's own ambient ring spin (see .tog-halo-rays/.tog-halo-ring in
 * globals.css); this animates the whole mark, mask included, via
 * .tog-mask-spin on the wrapping button.
 *
 * A real <button>, not a click handler on a <div>: it needs to be
 * reachable and activatable by keyboard, and a button gets that (focus,
 * Enter/Space) for free.
 */
export function SpinnableTearHalo({ size = 90, strokeW = 1.4, title, className }: SpinnableTearHaloProps) {
  const [spinning, setSpinning] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setSpinning(true)}
      onAnimationEnd={() => setSpinning(false)}
      aria-hidden={title ? undefined : true}
      tabIndex={title ? undefined : -1}
      className={cn("tog-mask-spin-btn border-0 bg-transparent p-0", spinning && "tog-mask-spin", className)}
    >
      <TearHalo size={size} shiny strokeW={strokeW} title={title} className="tog-gold-glow" />
    </button>
  );
}
