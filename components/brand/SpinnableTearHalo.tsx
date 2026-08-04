"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { TearHalo } from "./TearHalo";

interface SpinnableTearHaloProps {
  size?: number;
  strokeW?: number;
  /** Forwarded to TearHalo/MaskGlyph — see MaskGlyph's `eyes` prop. */
  eyes?: boolean;
  title?: string;
  className?: string;
}

/**
 * TearHalo with a tap/click-triggered full turn — a small, delightful
 * response to a touch rather than pure decoration. Layers on top of
 * TearHalo's own ambient ring spin (see .tog-halo-rays/.tog-halo-ring in
 * globals.css); this animates the whole mark, mask included, via
 * .tog-mask-spin on the wrapping element.
 *
 * A real <button>, but only when `title` gives it a genuine accessible
 * name and destination-free action worth exposing to assistive tech —
 * every current call site (Header, Hero) omits `title`, i.e. this is a
 * second, purely decorative copy of the mark that already appears
 * elsewhere on the page with its own accessible name. Making *that* a
 * `<button>` would mean an interactive control with no name and no
 * effect other than a visual flourish, reachable by keyboard and screen
 * reader alike for no reason — worse than a plain `<div onClick>`, which
 * a mouse/touch user can still activate (this is a bonus interaction, not
 * the only way to reach any functionality) while assistive tech is never
 * told a focusable, actionable control exists here at all.
 */
export function SpinnableTearHalo({
  size = 90,
  strokeW = 1.4,
  eyes = false,
  title,
  className,
}: SpinnableTearHaloProps) {
  const [spinning, setSpinning] = useState(false);
  const spin = () => setSpinning(true);
  const onAnimationEnd = () => setSpinning(false);
  const classes = cn("tog-mask-spin-btn border-0 bg-transparent p-0", spinning && "tog-mask-spin", className);

  if (!title) {
    return (
      <div aria-hidden="true" onClick={spin} onAnimationEnd={onAnimationEnd} className={classes}>
        <TearHalo size={size} shiny strokeW={strokeW} eyes={eyes} className="tog-gold-glow" />
      </div>
    );
  }

  return (
    <button type="button" onClick={spin} onAnimationEnd={onAnimationEnd} className={classes}>
      <TearHalo size={size} shiny strokeW={strokeW} eyes={eyes} title={title} className="tog-gold-glow" />
    </button>
  );
}
