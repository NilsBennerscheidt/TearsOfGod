import { MaskGlyph } from "./MaskGlyph";

interface MaskEmblemProps {
  color?: string;
  size?: number;
  ring?: boolean;
  ringColor?: string;
  shiny?: boolean;
  /** Accessible name. Omit when this instance is decorative (e.g. paired with a visible Wordmark) — it's then hidden from assistive tech instead. */
  title?: string;
  className?: string;
}

export function MaskEmblem({
  color = "var(--color-bone)",
  size = 120,
  ring = false,
  ringColor,
  shiny = false,
  title,
  className,
}: MaskEmblemProps) {
  const rc = ringColor || color;
  return (
    <div
      className={className}
      style={{ position: "relative", width: size, height: size, display: "inline-block" }}
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}
    >
      {ring && (
        <svg
          viewBox="0 0 100 100"
          width={size}
          height={size}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden="true"
        >
          <circle cx="50" cy="50" r="48" fill="none" stroke={rc} strokeWidth="0.8" />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke={rc}
            strokeWidth="0.4"
            strokeDasharray="1.5 2"
            opacity="0.6"
          />
        </svg>
      )}
      <div style={{ position: "absolute", inset: ring ? "8%" : 0 }}>
        <MaskGlyph color={color} shiny={shiny} />
      </div>
    </div>
  );
}
