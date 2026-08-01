import { cn } from "@/lib/cn";

interface MaskGlyphProps {
  color?: string;
  shiny?: boolean;
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
 */
export function MaskGlyph({ color = "currentColor", shiny = false, className }: MaskGlyphProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("h-full w-full", shiny && "tog-gold-foil", className)}
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
  );
}
