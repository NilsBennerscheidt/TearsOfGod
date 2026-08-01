interface RegMarksProps {
  inset?: number;
  len?: number;
  color?: string;
  weight?: number;
}

/** Corner crosshair registration marks (print-chrome motif). Decorative. */
export function RegMarks({ inset = 10, len = 14, color = "currentColor", weight = 1 }: RegMarksProps) {
  const corners: { top?: number; right?: number; bottom?: number; left?: number; r: number }[] = [
    { top: inset, left: inset, r: 0 },
    { top: inset, right: inset, r: 90 },
    { bottom: inset, right: inset, r: 180 },
    { bottom: inset, left: inset, r: 270 },
  ];

  return (
    <div aria-hidden="true">
      {corners.map((c, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: c.top,
            left: c.left,
            right: c.right,
            bottom: c.bottom,
            width: len,
            height: len,
            transform: `rotate(${c.r}deg)`,
          }}
        >
          <div style={{ position: "absolute", top: 0, left: 0, width: len, height: weight, background: color }} />
          <div style={{ position: "absolute", top: 0, left: 0, width: weight, height: len, background: color }} />
        </div>
      ))}
    </div>
  );
}

interface RegCrossProps {
  size?: number;
  color?: string;
  weight?: number;
  className?: string;
}

/** Full registration-cross target (crosshair inside a ring). Decorative. */
export function RegCross({ size = 18, color = "currentColor", weight = 1, className }: RegCrossProps) {
  return (
    <div
      aria-hidden="true"
      className={className}
      style={{ position: "relative", width: size, height: size, display: "inline-block", verticalAlign: "middle" }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          width: size,
          height: weight,
          background: color,
          transform: "translateY(-50%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          height: size,
          width: weight,
          background: color,
          transform: "translateX(-50%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: size * 0.25,
          border: `${weight}px solid ${color}`,
          borderRadius: "50%",
        }}
      />
    </div>
  );
}
