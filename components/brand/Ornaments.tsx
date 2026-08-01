import type { CSSProperties } from "react";

interface OrnamentProps {
  size?: number;
  color?: string;
  stroke?: number;
  style?: CSSProperties;
}

/** Top corner flourish (default = top-left; mirror with scaleX(-1)). Decorative. */
export function OrnamentCorner({ size = 140, color = "currentColor", stroke = 1.4, style }: OrnamentProps) {
  return (
    <svg viewBox="0 0 200 120" width={size} height={(size * 120) / 200} style={{ overflow: "visible", ...style }} aria-hidden="true">
      <g fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round">
        <path d="M 6,60 C 30,60 50,52 70,40 C 86,30 102,28 120,32 C 138,36 152,42 168,40 C 180,38 188,34 196,28" />
        <path d="M 168,40 C 174,52 170,64 158,68 C 148,72 138,68 138,58 C 138,52 142,48 148,48 C 154,48 158,52 158,58" />
        <path d="M 90,38 C 88,28 82,22 72,22 C 80,28 84,36 84,46" />
        <path d="M 50,52 C 42,46 32,44 22,48 C 30,48 38,52 44,60" />
        <path d="M 120,32 C 118,22 124,14 134,14 C 130,22 130,30 132,38" />
        <path d="M 6,60 C -2,72 2,86 16,90 C 26,92 36,86 38,76" strokeOpacity="0.7" />
      </g>
    </svg>
  );
}

/** Bottom corner flourish (mirror vertically for bottom edges). Decorative. */
export function OrnamentBottom({ size = 200, color = "currentColor", stroke = 1.4, style }: OrnamentProps) {
  return (
    <svg viewBox="0 0 300 80" width={size} height={(size * 80) / 300} style={{ overflow: "visible", ...style }} aria-hidden="true">
      <g fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round">
        <path d="M 10,40 C 60,40 100,30 150,30 C 200,30 240,40 290,40" />
        <path d="M 150,30 L 156,20 L 150,10 L 144,20 Z" />
        <path d="M 150,30 L 150,52" />
        <path d="M 60,40 C 50,32 40,30 28,34 C 36,36 42,42 46,52" />
        <path d="M 100,30 C 94,22 86,18 76,20 C 84,24 88,32 90,42" />
        <path d="M 240,40 C 250,32 260,30 272,34 C 264,36 258,42 254,52" />
        <path d="M 200,30 C 206,22 214,18 224,20 C 216,24 212,32 210,42" />
        <path d="M 28,34 L 18,30 M 272,34 L 282,30" />
      </g>
    </svg>
  );
}

/** Central "horn crown" flourish. Decorative. */
export function OrnamentCrown({ size = 280, color = "currentColor", stroke = 1.4, style }: OrnamentProps) {
  return (
    <svg viewBox="0 0 400 80" width={size} height={(size * 80) / 400} style={{ overflow: "visible", ...style }} aria-hidden="true">
      <g fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round">
        <path d="M 10,50 C 80,50 130,40 180,40 L 220,40 C 270,40 320,50 390,50" />
        <path d="M 180,40 C 160,22 130,12 100,16 C 120,20 134,32 140,46" />
        <path d="M 140,46 C 128,36 110,32 92,36 C 106,40 116,48 120,58" />
        <path d="M 100,16 L 88,8" />
        <path d="M 220,40 C 240,22 270,12 300,16 C 280,20 266,32 260,46" />
        <path d="M 260,46 C 272,36 290,32 308,36 C 294,40 284,48 280,58" />
        <path d="M 300,16 L 312,8" />
        <path d="M 196,40 L 200,30 L 204,40" />
      </g>
    </svg>
  );
}

/** Vertical side tendril flourish. Decorative. */
export function OrnamentSide({ size = 240, color = "currentColor", stroke = 1.4, style }: OrnamentProps) {
  return (
    <svg viewBox="0 0 60 400" width={(size * 60) / 400} height={size} style={{ overflow: "visible", ...style }} aria-hidden="true">
      <g fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round">
        <path d="M 30,10 C 24,80 36,140 30,210 C 24,270 36,330 30,390" />
        <path d="M 30,80 C 18,84 12,92 12,104 C 12,114 20,118 26,114" />
        <path d="M 30,180 C 42,184 48,192 48,204 C 48,214 40,218 34,214" />
        <path d="M 30,280 C 18,284 12,292 12,304 C 12,314 20,318 26,314" />
        <path d="M 30,10 L 26,2 M 30,390 L 26,398" />
      </g>
    </svg>
  );
}
