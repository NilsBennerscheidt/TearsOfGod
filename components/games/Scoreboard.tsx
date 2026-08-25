import { cn } from "@/lib/cn";

interface ScoreboardProps {
  scoreLabel: string;
  score: number;
  bestLabel: string;
  /** null while the stored best is still being read — renders as a dash rather than a 0 that flips. */
  best: number | null;
  /** Optional third readout, e.g. the whack round timer. */
  extraLabel?: string;
  extraValue?: string;
  className?: string;
}

/**
 * The HUD readout shared by every game — label above value, mono for the
 * label, Archivo Black for the number.
 *
 * `font-brutal` rather than a bold weight: the self-hosted families ship
 * weight 400 only (see app/fonts.css), so `font-bold` on Oswald or
 * JetBrains Mono renders browser-synthesised faux-bold. Archivo Black is
 * a genuinely heavy face and is the project's answer for loud numerals.
 *
 * Deliberately not a live region. A whack score changes several times a
 * second; an aria-live on it would turn a screen reader into a stream of
 * interruptions. The score that matters is announced once, at the end,
 * by GameOverCard.
 */
export function Scoreboard({
  scoreLabel,
  score,
  bestLabel,
  best,
  extraLabel,
  extraValue,
  className,
}: ScoreboardProps) {
  return (
    <div className={cn("flex items-end justify-between gap-6", className)}>
      <Readout label={scoreLabel} value={score.toLocaleString("de-DE")} tone="gold" />
      {extraLabel !== undefined && extraValue !== undefined && (
        <Readout label={extraLabel} value={extraValue} tone="bone" />
      )}
      <Readout label={bestLabel} value={best === null ? "—" : best.toLocaleString("de-DE")} tone="steel" />
    </div>
  );
}

const TONES = {
  gold: "text-gold",
  bone: "text-bone",
  steel: "text-steel-text",
} as const;

function Readout({ label, value, tone }: { label: string; value: string; tone: keyof typeof TONES }) {
  return (
    <div className="min-w-0">
      <p className="text-meta text-steel-text font-mono tracking-widest uppercase">{label}</p>
      <p className={cn("font-brutal mt-1 text-2xl leading-none tabular-nums md:text-3xl", TONES[tone])}>{value}</p>
    </div>
  );
}
