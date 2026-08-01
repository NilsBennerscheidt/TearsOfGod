import type { CSSProperties } from "react";
import { RUNE_PATHS } from "@/lib/runes";

interface RuneProps {
  char: string;
  size?: number;
  color?: string;
  gold?: boolean;
  stroke?: number;
  style?: CSSProperties;
}

/** A single runic glyph. Building block only — always aria-hidden; the string it spells out is exposed as real text by RunicLine/RunicVertical/RunicBar. */
export function Rune({ char, size = 28, color = "currentColor", gold = false, stroke = 9, style }: RuneProps) {
  const path = RUNE_PATHS[String(char).toUpperCase()] ?? "";
  const strokeColor = gold ? "url(#togGoldFoil)" : color;
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{ display: "inline-block", verticalAlign: "middle", overflow: "visible", ...style }}
      aria-hidden="true"
    >
      {path && (
        <path d={path} fill="none" stroke={strokeColor} strokeWidth={stroke} strokeLinecap="square" strokeLinejoin="miter" />
      )}
    </svg>
  );
}

interface RunicLineProps {
  children: string;
  size?: number;
  gap?: number;
  color?: string;
  gold?: boolean;
  stroke?: number;
  style?: CSSProperties;
}

/** Horizontal runic transliteration of `children`. The runes are decorative; the real text is exposed to assistive tech via a visually-hidden span. */
export function RunicLine({ children, size = 24, gap = 4, color = "currentColor", gold = false, stroke = 9, style }: RunicLineProps) {
  const text = children;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap, ...style }}>
      <span aria-hidden="true" style={{ display: "inline-flex", alignItems: "center", gap }}>
        {text.split("").map((c, i) => (
          <Rune key={i} char={c} size={size} color={color} gold={gold} stroke={stroke} />
        ))}
      </span>
      <span className="sr-only">{text}</span>
    </span>
  );
}

interface RunicVerticalProps {
  children: string;
  size?: number;
  gap?: number;
  color?: string;
  gold?: boolean;
  stroke?: number;
  align?: "center" | "start";
  style?: CSSProperties;
}

/** Vertical runic transliteration of `children` — the right-side writing-bar motif. Same accessibility treatment as RunicLine. */
export function RunicVertical({
  children,
  size = 32,
  gap = 2,
  color = "currentColor",
  gold = false,
  stroke = 9,
  align = "center",
  style,
}: RunicVerticalProps) {
  const text = children;
  return (
    <div style={{ display: "flex", flexDirection: "column", lineHeight: 0, ...style }}>
      <div
        aria-hidden="true"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: align === "center" ? "center" : "flex-start",
          gap,
        }}
      >
        {text.split("").map((c, i) => (
          <Rune key={i} char={c} size={size} color={color} gold={gold} stroke={stroke} />
        ))}
      </div>
      <span className="sr-only">{text}</span>
    </div>
  );
}

interface RunicBarProps {
  text?: string;
  height?: number | string;
  width?: number;
  ruleColor?: string;
  runeColor?: string;
  gold?: boolean;
  runeSize?: number;
  stroke?: number;
  side?: "left" | "right";
  showCaps?: boolean;
  style?: CSSProperties;
}

/** The signature vertical writing-bar: a thin rule with runic text running down it. */
export function RunicBar({
  text = "TEARS·OF·GOD",
  height = "100%",
  width = 64,
  ruleColor = "currentColor",
  runeColor = "currentColor",
  gold = false,
  runeSize = 30,
  stroke = 8,
  side = "right",
  showCaps = true,
  style,
}: RunicBarProps) {
  const rule = (
    <div aria-hidden="true" style={{ width: 1.2, height: "100%", background: ruleColor, position: "relative" }}>
      {showCaps && (
        <>
          <div style={{ position: "absolute", top: 0, left: -5, width: 11, height: 1.2, background: ruleColor }} />
          <div style={{ position: "absolute", bottom: 0, left: -5, width: 11, height: 1.2, background: ruleColor }} />
        </>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "stretch", gap: 14, width, height, ...style }}>
      {side === "left" && rule}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          padding: "14px 0",
        }}
      >
        <RunicVertical size={runeSize} stroke={stroke} color={runeColor} gold={gold}>
          {text}
        </RunicVertical>
      </div>
      {side === "right" && rule}
    </div>
  );
}
