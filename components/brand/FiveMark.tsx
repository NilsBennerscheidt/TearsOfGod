interface FiveMarkProps {
  color?: string;
  size?: number;
  className?: string;
}

/** "V · FÜNF" — the five-members mark. Real text, no accessibility treatment needed. */
export function FiveMark({ color = "var(--color-bone)", size = 80, className }: FiveMarkProps) {
  return (
    <div
      className={className}
      style={{
        fontFamily: "'Archivo Black', sans-serif",
        fontSize: size,
        color,
        lineHeight: 0.9,
        letterSpacing: "-0.04em",
        display: "inline-flex",
        alignItems: "baseline",
        gap: size * 0.08,
      }}
    >
      <span>V</span>
      <span
        style={{
          fontSize: size * 0.22,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "0.2em",
          alignSelf: "center",
          opacity: 0.7,
        }}
      >
        FÜNF
      </span>
    </div>
  );
}
