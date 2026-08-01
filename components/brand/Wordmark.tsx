import { cn } from "@/lib/cn";

/**
 * Intrinsic aspect of the real artwork. The supplied export had ~11-19%
 * empty padding baked into its viewBox; public/brand/wordmark.svg is
 * re-cropped to the actual ink bounds so a given width maps to visible
 * logo rather than to invisible margin.
 */
const W = 992.6;
const H = 570.9;

interface WordmarkProps {
  /** Any CSS color, or "currentColor" (default) to inherit. Ignored when `shiny`. */
  color?: string;
  /** Fill with the animated gold-foil gradient instead of a flat color. */
  shiny?: boolean;
  /** Explicit px width. Omit to size via `className` (e.g. `w-[76vw]`) — an inline width would otherwise beat any class. */
  width?: number;
  className?: string;
  title?: string;
}

/**
 * The real band logotype, applied as a CSS mask so it stays tintable to
 * any brand color from a single shape asset — the same technique the
 * source brand system used, and the reason the file is referenced rather
 * than inlined: at ~79KB (32KB gzipped) inlining it would land in the
 * HTML of every page, uncached, once per instance. As a mask it is
 * fetched once and shared by the header, hero, and footer.
 *
 * The mask's eye holes are true geometry, so whatever sits behind shows
 * through correctly on any background.
 */
export function Wordmark({
  color = "currentColor",
  shiny = false,
  width,
  className,
  title = "Tears of God",
}: WordmarkProps) {
  return (
    <div
      role="img"
      aria-label={title}
      className={cn("w-60", shiny && "tog-gold-foil", className)}
      style={{
        width,
        aspectRatio: `${W} / ${H}`,
        WebkitMaskImage: "url(/brand/wordmark.svg)",
        maskImage: "url(/brand/wordmark.svg)",
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
