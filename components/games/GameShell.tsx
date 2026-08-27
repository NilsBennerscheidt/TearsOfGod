"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { GoldText } from "@/components/brand/GoldText";
import { RegMarks } from "@/components/brand/RegMarks";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { useGameKeys } from "@/lib/games/input";
import { Scoreboard } from "./Scoreboard";

/**
 * The lifecycle every game in the arcade shares.
 *
 * Lives here rather than in lib/games because GameShell is what gives
 * each state its meaning on screen — the shell renders an overlay per
 * status, and a game that invented a sixth status would have nothing to
 * draw for it. The type is the shell's contract.
 */
export type GameStatus = "idle" | "playing" | "paused" | "over";

interface GameShellProps {
  eyebrow: string;
  title: string;
  /** Shown on the idle overlay — how to play, scoring rules. */
  instructions: ReactNode;
  /** Rendered on the idle overlay between the instructions and the Start button — e.g. Snake's mode picker. Absent for every other game; purely additive, no layout change without it. */
  idleExtra?: ReactNode;
  status: GameStatus;
  score: number;
  best: number | null;
  /** Optional third HUD readout, e.g. a round timer. */
  extraLabel?: string;
  extraValue?: string;
  onStart: () => void;
  onResume: () => void;
  onPause: () => void;
  /** The game-over overlay. Supplied by the game (it owns the final score); rendered by the shell so every game's overlay sits in the same place. */
  gameOver?: ReactNode;
  /** The play surface itself. */
  children: ReactNode;
}

/**
 * Brand frame + lifecycle chrome around a play surface: title, HUD,
 * idle/paused overlays, keyboard controls, and the back link to the
 * arcade index.
 *
 * Shared chrome strings are read from the `Games` namespace here rather
 * than passed down from each game — every game renders the identical
 * "Start" / "Paused" / "Resume" copy, and threading four more props
 * through every game to say the same thing is duplication with extra
 * steps. That namespace is registered in the client-messages allow-list
 * in app/[locale]/layout.tsx; without it, this throws at runtime.
 */
export function GameShell({
  eyebrow,
  title,
  instructions,
  idleExtra,
  status,
  score,
  best,
  extraLabel,
  extraValue,
  onStart,
  onResume,
  onPause,
  gameOver,
  children,
}: GameShellProps) {
  const t = useTranslations("Games");

  useGameKeys(
    status !== "over",
    (intent) => {
      if (intent === "pause") {
        if (status === "playing") onPause();
        else if (status === "paused") onResume();
        return;
      }
      if (intent === "primary") {
        if (status === "idle") onStart();
        else if (status === "paused") onResume();
      }
    },
    // Escape has to reach the game even while a mole button holds focus;
    // no native control treats it as activation, so allowing it through
    // can't double-fire. "primary" is not in this list precisely because
    // Space/Enter on a focused button already activates it.
    { alwaysAllow: ["pause"] },
  );

  return (
    <section className="gutter-x py-8 md:py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-meta text-blood-text font-mono tracking-widest uppercase">{eyebrow}</p>
          <Link
            href="/games"
            className="text-meta text-steel-text inline-flex min-h-11 items-center font-mono tracking-wide uppercase hover:text-gold"
          >
            {t("backToArcade")}
          </Link>
        </div>

        <GoldText as="h1" glow className="font-display mt-1 text-4xl leading-none uppercase md:text-5xl">
          {title}
        </GoldText>

        <Scoreboard
          className="mt-6"
          scoreLabel={t("scoreLabel")}
          score={score}
          bestLabel={t("bestLabel")}
          best={best}
          extraLabel={extraLabel}
          extraValue={extraValue}
        />

        <div className="tog-gold-glow-box relative mt-4 border border-gold bg-ink">
          {/* RegMarks renders plain positioned divs with no pointer-events
              opt-out of its own; unwrapped, its corner marks would sit on
              top of the surface and swallow taps aimed at whatever is
              underneath them. */}
          <div className="pointer-events-none absolute inset-0 text-ash">
            <RegMarks inset={6} len={10} />
          </div>
          {children}

          {status === "idle" && (
            <Overlay>
              <div className="text-body max-w-sm text-center text-bone/85">{instructions}</div>
              {idleExtra}
              <OverlayButton onClick={onStart}>{t("start")}</OverlayButton>
              <OverlayHint>{t("startHint")}</OverlayHint>
            </Overlay>
          )}

          {status === "paused" && (
            <Overlay>
              <p className="font-display text-3xl text-gold uppercase">{t("paused")}</p>
              <p className="text-body max-w-sm text-center text-steel-text">{t("pausedBody")}</p>
              <OverlayButton onClick={onResume}>{t("resume")}</OverlayButton>
            </Overlay>
          )}

          {status === "over" && gameOver}
        </div>
      </div>
    </section>
  );
}

/**
 * Overlays sit inside the bordered surface and cover it completely.
 * `bg-pitch/92` rather than a solid fill so the board stays faintly
 * visible underneath — it reads as paused, not as a different screen.
 */
export function Overlay({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-pitch/92 px-6 text-center",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Matches CtaButton's solid variant, but as a real <button> — CtaButton
 * is an <a> by design (it exists to stop styled non-interactive divs
 * standing in for links) and these actions navigate nowhere.
 */
export function OverlayButton({
  children,
  onClick,
  autoFocus = false,
  variant = "solid",
}: {
  children: ReactNode;
  onClick: () => void;
  autoFocus?: boolean;
  variant?: "solid" | "outline";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      // autoFocus is right here, not the usual anti-pattern: this button
      // only ever mounts inside an overlay that has just replaced the play
      // surface. Without it, focus is stranded on a disabled mole button
      // the player can no longer act on.
      autoFocus={autoFocus}
      className={cn(
        "font-display inline-flex min-h-11 items-center px-5 py-2.5 text-xs tracking-wide uppercase",
        variant === "solid"
          ? "tog-gold-sheen tog-gold-cta bg-gold text-pitch hover:bg-gold-hi"
          : "border border-bone text-bone hover:border-gold hover:text-gold",
      )}
    >
      {children}
    </button>
  );
}

function OverlayHint({ children }: { children: ReactNode }) {
  return <p className="text-meta text-steel-text font-mono tracking-wide uppercase">{children}</p>;
}
