import { MaskGlyph } from "./MaskGlyph";

interface TearHaloProps {
  size?: number;
  color?: string;
  strokeW?: number;
  /** Accessible name. Omit when decorative — see MaskEmblem. */
  title?: string;
  className?: string;
}

/** The mask glyph ringed with a dotted halo and 32 ray ticks. */
export function TearHalo({
  size = 140,
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
      <svg viewBox="0 0 160 160" width={size} height={size} style={{ position: "absolute", inset: 0 }} aria-hidden="true">
        <circle cx="80" cy="80" r="72" fill="none" stroke={color} strokeWidth={strokeW} />
        <circle
          cx="80"
          cy="80"
          r="64"
          fill="none"
          stroke={color}
          strokeWidth={strokeW * 0.5}
          strokeDasharray="1.5 2.5"
          opacity="0.6"
        />
        {rays.map((r, i) => (
          <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke={color} strokeWidth={strokeW * 0.8} />
        ))}
      </svg>
      <div style={{ position: "absolute", inset: "18%" }}>
        <MaskGlyph color={color} />
      </div>
    </div>
  );
}
