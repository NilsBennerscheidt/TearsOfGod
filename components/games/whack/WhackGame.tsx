"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { MaskGlyph } from "@/components/brand/MaskGlyph";
import { GameOverCard } from "@/components/games/GameOverCard";
import { GameShell, type GameStatus } from "@/components/games/GameShell";
import { cn } from "@/lib/cn";
import { pressHandlers } from "@/lib/games/input";
import { useGameLoop } from "@/lib/games/useGameLoop";
import { useHighscore } from "@/lib/games/useHighscore";
import {
  formatClock,
  type HoleView,
  idleSnapshot,
  ROUND_SECONDS,
  WhackEngine,
  type WhackSnapshot,
} from "@/lib/games/whack/engine";

const MOLE_COLORS = {
  gold: "var(--color-gold)",
  blood: "var(--color-blood-text)",
} as const;

/**
 * Whack-a-Mole — the arcade's template game.
 *
 * Plain DOM and CSS transforms rather than a canvas: nine sprites that
 * only ever slide on one axis need no per-frame drawing, and real
 * <button> elements give keyboard focus, hit-testing, and an
 * accessibility tree for free — all of which a canvas would have to
 * reimplement badly.
 *
 * The simulation lives in WhackEngine, outside React. This component
 * only re-renders when the engine reports that something visible
 * changed, so a 60Hz loop does not mean 60 renders a second.
 */
export function WhackGame() {
  const t = useTranslations("Games");
  const [status, setStatus] = useState<GameStatus>("idle");
  const [view, setView] = useState<WhackSnapshot>(idleSnapshot);
  const [isNewBest, setIsNewBest] = useState(false);
  const { best, submit } = useHighscore("whack");

  const engineRef = useRef<WhackEngine | null>(null);
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const step = useCallback(
    (deltaSeconds: number) => {
      const engine = engineRef.current;
      if (engine === null) return;
      if (!engine.step(deltaSeconds)) return;

      const snapshot = engine.snapshot();
      setView(snapshot);

      if (snapshot.finished) {
        setStatus("over");
        // submit() returns whether this beat the stored best; it is
        // called exactly once because the engine's step() short-circuits
        // on every call after it sets `finished`.
        setIsNewBest(submit(snapshot.score));
      }
    },
    [submit],
  );

  const handleAutoPause = useCallback(() => {
    setStatus((current) => (current === "playing" ? "paused" : current));
  }, []);

  useGameLoop(status === "playing", step, { onAutoPause: handleAutoPause });

  const handleStart = useCallback(() => {
    const engine = new WhackEngine();
    engineRef.current = engine;
    setView(engine.snapshot());
    setIsNewBest(false);
    setStatus("playing");
  }, []);

  const handleWhack = useCallback((index: number) => {
    const engine = engineRef.current;
    // The hole buttons are already disabled outside "playing"; this is
    // the second lock, for a pointer event that was already in flight
    // when the round ended.
    if (engine === null || statusRef.current !== "playing") return;
    if (engine.whack(index) !== "ignored") setView(engine.snapshot());
  }, []);

  const playing = status === "playing";

  return (
    <GameShell
      eyebrow={t("whack.eyebrow")}
      title={t("whack.title")}
      instructions={t("whack.instructions", { seconds: ROUND_SECONDS })}
      status={status}
      score={view.score}
      best={best}
      extraLabel={t("timeLabel")}
      extraValue={formatClock(view.secondsLeft)}
      onStart={handleStart}
      onResume={() => setStatus("playing")}
      onPause={() => setStatus("paused")}
      gameOver={
        <GameOverCard score={view.score} best={best} isNewBest={isNewBest} onRestart={handleStart} />
      }
    >
      {/*
        touch-action: none stops a fast tap sequence from being read as a
        scroll or a pinch, and kills the text-selection / tap-highlight
        flicker that rapid tapping otherwise produces on iOS. See
        .tog-game-surface in globals.css.
      */}
      {/* 3 columns × HOLE_COUNT (9) in the engine — the two are a pair; changing one means changing the other. */}
      <div className="tog-game-surface grid grid-cols-3 gap-2 p-3 sm:gap-3 sm:p-4">
        {view.holes.map((hole, index) => (
          <Hole
            key={index}
            hole={hole}
            label={t("whack.holeLabel", { index: index + 1 })}
            disabled={!playing}
            onWhack={() => handleWhack(index)}
          />
        ))}
      </div>
    </GameShell>
  );
}

interface HoleProps {
  hole: HoleView;
  label: string;
  disabled: boolean;
  onWhack: () => void;
}

/**
 * One hole. The mask is a MaskGlyph — the same CSS-masked sprite the
 * header logo and every other brand mark use, so the mole is literally
 * the band's own sigil and tints per variant without a second asset.
 *
 * The accessible name is static ("Hole 3"), not state-derived. A name
 * that changed every time a mole popped would make a screen reader
 * announce the board continuously; the rules live in the idle overlay's
 * instructions instead.
 */
function Hole({ hole, label, disabled, onWhack }: HoleProps) {
  const visible = hole.state === "up" || hole.state === "hit";

  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      className={cn(
        "relative aspect-square border border-ash bg-pitch",
        hole.state === "hit" && "tog-hole-hit",
        hole.state === "penalty" && "tog-hole-penalty",
        !disabled && "cursor-pointer",
      )}
      {...pressHandlers(onWhack)}
    >
      {/*
        Explicit edges rather than `inset-0` plus a bottom override —
        both would compile to same-specificity rules and the winner would
        depend on Tailwind's output order. This clip box is what hides
        the mask when it's down: the sprite translates fully below it.
      */}
      <span className="pointer-events-none absolute top-0 right-0 bottom-[20%] left-0 overflow-hidden">
        <span
          className={cn(
            "tog-mole absolute top-[6%] right-[16%] bottom-0 left-[16%]",
            visible && "tog-mole-up",
            hole.state === "hit" && "tog-mole-struck",
          )}
        >
          <MaskGlyph color={MOLE_COLORS[hole.variant]} />
        </span>
      </span>

      {/* The pit rim, drawn in front of the clip box so the mask reads as rising out of it. */}
      <span className="pointer-events-none absolute right-[6%] bottom-[12%] left-[6%] h-[16%] rounded-[50%] border border-gold/25 bg-bruise" />
    </button>
  );
}
