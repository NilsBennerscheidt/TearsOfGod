import type { CSSProperties } from "react";

interface PhotoPlaceholderProps {
  label?: string;
  aspect?: string;
  dark?: boolean;
  rotate?: number;
  style?: CSSProperties;
  className?: string;
}

/** Diagonal-stripe stand-in for a real photo, labeled with what belongs there. Real text, not hidden — the label is genuinely informative until a photo replaces it. */
export function PhotoPlaceholder({
  label = "PHOTO",
  aspect,
  dark = true,
  rotate = 0,
  style,
  className,
}: PhotoPlaceholderProps) {
  const bg = dark ? "var(--color-ash)" : "var(--color-bone-dim)";
  const fg = dark ? "var(--color-bone)" : "var(--color-ash)";
  const stripe = dark ? "var(--color-bruise)" : "var(--color-bone)";

  return (
    <div
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        background: `repeating-linear-gradient(45deg, ${bg} 0 8px, ${stripe} 8px 16px)`,
        color: fg,
        aspectRatio: aspect,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        ...style,
      }}
    >
      <div style={{ position: "absolute", inset: 10, border: `1px dashed ${fg}`, opacity: 0.5 }} />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          letterSpacing: "0.18em",
          padding: "4px 8px",
          background: bg,
          color: fg,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
    </div>
  );
}
