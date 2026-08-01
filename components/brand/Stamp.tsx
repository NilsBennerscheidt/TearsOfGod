import type { CSSProperties, ReactNode } from "react";

interface StampProps {
  children: ReactNode;
  rotate?: number;
  /**
   * Defaults to --color-blood, which is only AA-readable on light
   * surfaces (the mockup's own usage was on near-white letterhead paper).
   * On a dark/pitch background, pass color="var(--color-blood-text)"
   * explicitly — see the contrast note in app/globals.css.
   */
  color?: string;
  style?: CSSProperties;
}

/** Oxblood rubber-stamp mark. Real text content. */
export function Stamp({ children, rotate = -8, color = "var(--color-blood)", style }: StampProps) {
  return (
    <div
      style={{
        display: "inline-block",
        padding: "4px 10px",
        border: `2px solid ${color}`,
        color,
        fontFamily: "'Archivo Black', sans-serif",
        letterSpacing: "0.15em",
        fontSize: 11,
        textTransform: "uppercase",
        transform: `rotate(${rotate}deg)`,
        opacity: 0.85,
        boxShadow: "inset 0 0 0 1px rgba(179,27,27,0.3)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
