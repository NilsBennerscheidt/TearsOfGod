import type { CSSProperties } from "react";

interface RuneDotProps {
  size?: number;
  color?: string;
  style?: CSSProperties;
}

/** Rotated-square separator dot, used between runic words. Decorative. */
export function RuneDot({ size = 6, color = "currentColor", style }: RuneDotProps) {
  return (
    <span
      aria-hidden="true"
      style={{ display: "inline-block", width: size, height: size, transform: "rotate(45deg)", background: color, ...style }}
    />
  );
}
