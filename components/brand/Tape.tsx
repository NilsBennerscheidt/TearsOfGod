interface TapeProps {
  width?: number;
  rotate?: number;
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
  color?: string;
}

/** Zine-style tape strip. Decorative. */
export function Tape({ width = 80, rotate = -6, top, left, right, bottom, color = "rgba(236,230,214,0.55)" }: TapeProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        top,
        left,
        right,
        bottom,
        width,
        height: 22,
        background: color,
        border: "1px solid rgba(0,0,0,0.08)",
        backdropFilter: "blur(0.5px)",
        transform: `rotate(${rotate}deg)`,
        boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
        backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.2) 0 4px, transparent 4px 8px)",
        zIndex: 20,
      }}
    />
  );
}
