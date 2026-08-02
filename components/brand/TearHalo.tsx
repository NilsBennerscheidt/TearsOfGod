import { cn } from "@/lib/cn";
import { MaskGlyph } from "./MaskGlyph";

interface TearHaloProps {
  /** Explicit px size. Omit to size via `className` (e.g. `aspect-square w-[56vw]`) — an inline size would otherwise beat any class. */
  size?: number;
  color?: string;
  /**
   * Gold-foil gradient instead of a flat `color`, on both the ring/rays
   * (SVG stroke, via the togGoldFoil <linearGradient> from GoldFoilDefs)
   * and the mask glyph (CSS mask, via MaskGlyph's own `shiny`/tog-gold-foil
   * treatment — see the note below on why these can't share one value).
   */
  shiny?: boolean;
  /**
   * Ring stroke in viewBox units, so it scales with `size` and the mark
   * keeps its proportions from favicon to full-bleed hero.
   */
  strokeW?: number;
  /**
   * Swaps the ambient 48s/32s ring loop for a ~1.4s/1s one — too slow to
   * read as "loading" at a glance otherwise. Used by LoadingSpinner; leave
   * false for decorative placements. Under prefers-reduced-motion this
   * still animates (a pulse, not a spin) rather than stopping outright —
   * unlike the ambient rings, this loop is the only signal that work is
   * still happening, so it can't just go static.
   */
  fast?: boolean;
  /** Accessible name. Omit when decorative — see MaskEmblem. */
  title?: string;
  className?: string;
}

/**
 * The mask glyph ringed with a dotted halo and 32 ray ticks. The two
 * rings counter-rotate (see .tog-halo-rays / .tog-halo-ring in
 * globals.css, which also stops them under prefers-reduced-motion); the
 * mask itself stays fixed so the face never reads as upside down.
 */
export function TearHalo({
  size,
  color = "var(--color-bone)",
  shiny = false,
  strokeW = 1.2,
  fast = false,
  title,
  className,
}: TearHaloProps) {
  // Ring/rays are real SVG paint, where "url(#togGoldFoil)" is valid as a
  // stroke value. MaskGlyph is a CSS `mask-image`, tinted via a plain
  // `background` color — the same url() there would set an unresolvable
  // background-image and render nothing, which is exactly what broke when
  // `color` was passed straight through to both. So `shiny` picks the
  // gradient stroke here and MaskGlyph's own `shiny` prop (its
  // .tog-gold-foil CSS background) for the glyph, instead of forwarding
  // one value to two incompatible rendering paths.
  const strokeColor = shiny ? "url(#togGoldFoil)" : color;

  const rays = Array.from({ length: 32 }, (_, i) => {
    const a = (i / 32) * Math.PI * 2;
    const r1 = 72;
    const r2 = 78;
    return {
      x1: 80 + Math.cos(a) * r1,
      y1: 80 + Math.sin(a) * r1,
      x2: 80 + Math.cos(a) * r2,
      y2: 80 + Math.sin(a) * r2,
    };
  });

  return (
    <div
      className={className}
      style={{ position: "relative", width: size, height: size, display: "inline-block" }}
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}
    >
      <svg
        viewBox="0 0 160 160"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        aria-hidden="true"
      >
        <circle cx="80" cy="80" r="72" fill="none" stroke={strokeColor} strokeWidth={strokeW} />
        <circle
          className={cn("tog-halo-ring", fast && "tog-halo-ring-fast")}
          cx="80"
          cy="80"
          r="64"
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeW * 0.5}
          strokeDasharray="1.5 2.5"
          opacity="0.6"
        />
        {/* One group, one animation — 32 individually animated lines would be 32 times the work for identical motion. */}
        <g className={cn("tog-halo-rays", fast && "tog-halo-rays-fast")}>
          {rays.map((r, i) => (
            <line
              key={i}
              x1={r.x1}
              y1={r.y1}
              x2={r.x2}
              y2={r.y2}
              stroke={strokeColor}
              strokeWidth={strokeW * 0.8}
            />
          ))}
        </g>
      </svg>
      <div style={{ position: "absolute", inset: "18%" }}>
        <MaskGlyph color={color} shiny={shiny} />
      </div>
    </div>
  );
}
