"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { GameCanvas } from "@/components/games/GameCanvas";
import { GameOverCard } from "@/components/games/GameOverCard";
import { GameShell, type GameStatus } from "@/components/games/GameShell";
import { useGameKeys, useHeldIntent } from "@/lib/games/input";
import { LOGICAL_HEIGHT, LOGICAL_WIDTH, RunnerEngine } from "@/lib/games/runner/engine";
import { drawRunner, type RunnerSprites } from "@/lib/games/runner/render";
import { loadTintedMaskSprite, readCssColor } from "@/lib/games/sprites";
import { useGameLoop } from "@/lib/games/useGameLoop";
import { useHighscore } from "@/lib/games/useHighscore";

interface Hud {
  score: number;
  speedMultiplier: number;
}

const IDLE_HUD: Hud = { score: 0, speedMultiplier: 1 };

const FALLBACK_SPRITES: RunnerSprites = {
  player: null,
  colors: { gold: "#d9b25a", bloodText: "#e0483f", bone: "#f1ece0", ash: "#2d2824" },
};

/**
 * Endless Runner — the mask auto-runs, the player only ever decides
 * jump-or-duck-or-neither. Genuinely endless: no round timer and no win
 * state (unlike Whack's 60s round or Invaders' waves), it ends the
 * instant one obstacle is missed, which is why GameShell's third HUD
 * slot shows the live speed multiplier here instead of a countdown.
 *
 * Controls split across two input styles on purpose: jump is a one-shot
 * edge event (press to jump, holding does nothing extra — no double
 * jump), duck is a held state (must keep holding to stay low). Keyboard
 * gets both natively (useGameKeys for the edge, useHeldIntent for the
 * hold); touch maps the same distinction onto vertical position —
 * tapping the upper half of the canvas jumps, holding the lower half
 * ducks — rather than needing an on-screen button for each.
 */
export function RunnerGame() {
  const t = useTranslations("Games");
  const [status, setStatus] = useState<GameStatus>("idle");
  const [hud, setHud] = useState<Hud>(IDLE_HUD);
  const [isNewBest, setIsNewBest] = useState(false);
  const { best, submit } = useHighscore("runner");

  const engineRef = useRef<RunnerEngine | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const spritesRef = useRef<RunnerSprites>(FALLBACK_SPRITES);
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const duckHeldRef = useHeldIntent(status === "playing", "down");
  const touchDuckRef = useRef(false);

  // Jump is edge-triggered — "up"/"primary" (Space) via the same
  // one-shot keydown model GameShell's own start/pause handling uses.
  // Enabled only while playing, so this instance can't fire during
  // idle/paused; GameShell's own "primary" handling there is unaffected
  // since these are two independent listeners.
  useGameKeys(status === "playing", (intent) => {
    if (intent === "primary" || intent === "up") engineRef.current?.jump();
  });

  useEffect(() => {
    const colors = {
      gold: readCssColor("--color-gold"),
      bloodText: readCssColor("--color-blood-text"),
      bone: readCssColor("--color-bone"),
      ash: readCssColor("--color-ash"),
    };
    spritesRef.current = { ...spritesRef.current, colors };
    loadTintedMaskSprite(colors.gold).then((sprite) => {
      spritesRef.current = { ...spritesRef.current, player: sprite };
    });
  }, []);

  const step = useCallback(
    (deltaSeconds: number) => {
      const engine = engineRef.current;
      if (engine === null) return;

      engine.setDucking(duckHeldRef.current || touchDuckRef.current);

      const hudChanged = engine.step(deltaSeconds);
      const snapshot = engine.snapshot();

      const ctx = ctxRef.current;
      if (ctx !== null) drawRunner(ctx, snapshot, spritesRef.current);

      if (hudChanged) {
        setHud({ score: snapshot.score, speedMultiplier: snapshot.speedMultiplier });
      }

      if (snapshot.finished) {
        setStatus("over");
        setIsNewBest(submit(snapshot.score));
      }
    },
    [duckHeldRef, submit],
  );

  const handleAutoPause = useCallback(() => {
    setStatus((current) => (current === "playing" ? "paused" : current));
  }, []);

  useGameLoop(status === "playing", step, { onAutoPause: handleAutoPause });

  const handleStart = useCallback(() => {
    const engine = new RunnerEngine();
    engineRef.current = engine;
    touchDuckRef.current = false;
    const snapshot = engine.snapshot();
    setHud({ score: snapshot.score, speedMultiplier: snapshot.speedMultiplier });
    setIsNewBest(false);
    setStatus("playing");
  }, []);

  return (
    <GameShell
      eyebrow={t("runner.eyebrow")}
      title={t("runner.title")}
      instructions={t("runner.instructions")}
      status={status}
      score={hud.score}
      best={best}
      extraLabel={t("speedLabel")}
      extraValue={`${hud.speedMultiplier.toFixed(1)}×`}
      onStart={handleStart}
      onResume={() => setStatus("playing")}
      onPause={() => setStatus("paused")}
      gameOver={<GameOverCard score={hud.score} best={best} isNewBest={isNewBest} onRestart={handleStart} />}
    >
      <GameCanvas
        logicalWidth={LOGICAL_WIDTH}
        logicalHeight={LOGICAL_HEIGHT}
        className="mx-auto h-full max-w-full border border-ash bg-pitch"
        onContext={(ctx) => {
          ctxRef.current = ctx;
        }}
        onPointerActive={(_x, y, isNewPress) => {
          if (statusRef.current !== "playing") return;
          if (y < LOGICAL_HEIGHT / 2) {
            // Upper half: a tap jumps, once, on press. Dragging up
            // from a lower-half hold isn't treated as a second jump —
            // only the initial press edge fires it.
            if (isNewPress) engineRef.current?.jump();
          } else {
            touchDuckRef.current = true;
          }
        }}
        onPointerRelease={() => {
          touchDuckRef.current = false;
        }}
      />
    </GameShell>
  );
}
