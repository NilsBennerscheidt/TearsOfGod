import { cn } from "@/lib/cn";
import { MaskEyesGlow } from "./MaskEyesGlow";

interface MaskGlyphProps {
  color?: string;
  shiny?: boolean;
  /**
   * Adds two ember-glow dots over the mask's eye holes that light up
   * briefly at a random interval (60–300s), then fade back out — an
   * ambient easter egg, off by default. See MaskEyesGlow for the timer
   * and .tog-mask-eye/-glowing in globals.css for the glow itself.
   */
  eyes?: boolean;
  className?: string;
}

/**
 * The horned mask sigil, applied as a CSS mask so it tints to any brand
 * color — consumed by MaskEmblem, LogoMonogram, and TearHalo, so the
 * artwork lives in exactly one place.
 *
 * KNOWN GAP: this is the only brand mark still sourced from raster. The
 * supplied wordmark is true vector, but the standalone mask exists only
 * as a PNG, and it cannot be lifted out of the wordmark SVG — there, the
 * mask and the central letterform stem are a single merged path
 * (verified by per-path bounding boxes), so no clean subset of paths
 * isolates it. public/brand/mask.png is that PNG cropped to its ink
 * bounds and squared, which is fine at emblem/favicon sizes but will
 * soften if ever rendered very large. Swap in a vector here when one
 * exists; nothing outside this file changes.
 *
 * The masked shape and the (optional) eye glow are two sibling layers,
 * not one — a `mask-image` clips its own descendants too, and the eye
 * holes are exactly the *transparent* part of that mask, so a glow dot
 * placed inside the masked element would itself be masked away. `eyes`
 * therefore renders MaskEyesGlow as an unmasked sibling, positioned over
 * the same box via the shared `relative` wrapper.
 */
export function MaskGlyph({ color = "currentColor", shiny = false, eyes = false, className }: MaskGlyphProps) {
  return (
    <div aria-hidden="true" className={cn("relative h-full w-full", className)}>
      <div
        className={cn("absolute inset-0", shiny && "tog-gold-foil")}
        style={{
          WebkitMaskImage: "url(/brand/mask.png)",
          maskImage: "url(/brand/mask.png)",
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          background: shiny ? undefined : color,
        }}
      />
      {eyes && <MaskEyesGlow />}
    </div>
  );
}
