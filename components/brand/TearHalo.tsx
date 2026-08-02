import { MaskGlyph } from "./MaskGlyph";

interface TearHaloProps {
  /** Explicit px size. Omit to size via `className` (e.g. `aspect-square w-[56vw]`) — an inline size would otherwise beat any class. */
  size?: number;
  color?: string;
  /**
   * Ring stroke in viewBox units, so it scales with `size` and the mark
   * keeps its proportions from favicon to full-bleed hero.
   */
  strokeW?: number;
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
  strokeW = 1.2,
  title,
  className,
}: TearHaloProps) {
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
        <circle cx="80" cy="80" r="72" fill="none" stroke={color} strokeWidth={strokeW} />
        <circle
          className="tog-halo-ring"
          cx="80"
          cy="80"
          r="64"
          fill="none"
          stroke={color}
          strokeWidth={strokeW * 0.5}
          strokeDasharray="1.5 2.5"
          opacity="0.6"
        />
        {/* One group, one animation — 32 individually animated lines would be 32 times the work for identical motion. */}
        <g className="tog-halo-rays">
          {rays.map((r, i) => (
            <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke={color} strokeWidth={strokeW * 0.8} />
          ))}
        </g>
      </svg>
      <div style={{ position: "absolute", inset: "18%" }}>
        <MaskGlyph color={color} />
      </div>
    </div>
  );
}
