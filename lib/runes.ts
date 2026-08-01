/**
 * Runic alphabet — stroke-based glyphs on a 100×100 viewBox, one Latin
 * letter per entry. Ported verbatim from the brand mockup's rune system;
 * paths are drawn as strokes so they tint via `currentColor` or a gradient
 * fill on the containing <path>.
 */
export const RUNE_PATHS: Record<string, string> = {
  A: "M30,82 L50,18 L70,82 M38,58 L62,58",
  B: "M32,18 L32,82 M32,18 L62,24 L66,38 L52,50 L32,50 M32,50 L60,54 L68,68 L60,82 L32,82",
  C: "M70,26 L42,22 L34,50 L42,78 L70,74",
  D: "M32,18 L60,28 L72,50 L60,72 L32,82 Z",
  E: "M32,18 L32,82 M32,18 L66,22 M32,50 L56,50 M32,82 L66,78",
  F: "M32,18 L32,82 M32,18 L66,18 M32,50 L54,50",
  G: "M70,26 L42,22 L34,50 L42,78 L70,74 M50,55 L70,55 L70,74",
  H: "M30,18 L30,82 M70,18 L70,82 M30,48 L70,52",
  I: "M50,18 L50,82 M42,18 L58,18 M42,82 L58,82",
  J: "M34,18 L70,18 M62,18 L60,68 L46,80 L30,72",
  K: "M30,18 L30,82 M30,50 L70,18 M30,50 L72,82",
  L: "M30,18 L32,82 L70,78",
  M: "M26,82 L30,18 L50,54 L70,18 L74,82",
  N: "M30,82 L30,18 L70,82 L70,18",
  O: "M50,14 L82,50 L50,86 L18,50 Z",
  P: "M30,18 L30,82 M30,18 L66,24 L66,46 L30,52",
  Q: "M50,14 L82,50 L50,86 L18,50 Z M56,68 L84,94",
  R: "M30,18 L30,82 M30,18 L62,24 L66,42 L40,52 M40,52 L74,82",
  S: "M70,24 L42,22 L42,46 L62,52 L62,76 L32,74",
  T: "M26,18 L74,18 M50,18 L50,82 M40,82 L60,82",
  U: "M30,18 L30,72 L50,86 L70,72 L70,18",
  V: "M24,18 L50,82 L76,18",
  W: "M14,18 L34,82 L50,42 L66,82 L86,18",
  X: "M24,18 L76,82 M76,18 L24,82",
  Y: "M26,18 L50,50 L74,18 M50,50 L50,82",
  Z: "M24,18 L70,18 L26,82 L76,82",
  // Punctuation
  ".": "M48,72 L52,72 L52,76 L48,76 Z",
  "·": "M46,48 L54,48 L54,56 L46,56 Z",
  " ": "",
};
