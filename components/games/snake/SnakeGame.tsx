"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { GameCanvas } from "@/components/games/GameCanvas";
import { GameOverCard } from "@/components/games/GameOverCard";
import { GameShell, type GameStatus } from "@/components/games/GameShell";
import { useGameKeys } from "@/lib/games/input";
import { drawSnake, type SnakeSprites } from "@/lib/games/snake/render";
import { type Direction, LOGICAL_HEIGHT, LOGICAL_WIDTH, SnakeEngine } from "@/lib/games/snake/engine";
import { loadTintedMaskSprite, readCssColor } from "@/lib/games/sprites";
import { useGameLoop } from "@/lib/games/useGameLoop";
import { useHighscore } from "@/lib/games/useHighscore";

interface Hud {
  score: number;
  length: number;
}

const IDLE_HUD: Hud = { score: 0, length: 3 };

const FALLBACK_SPRITES: SnakeSprites = {
  head: null,
  food: null,
  foodRare: null,
  colors: { gold: "#d9b25a", bloodText: "#e0483f", ash: "#2d2824" },
};

/** Minimum drag distance, in logical units, before a touch gesture counts as a swipe rather than noise — same threshold family as PhotoLightbox's SWIPE_THRESHOLD, scaled down for this canvas's much smaller cell size. */
const SWIPE_THRESHOLD = 10;

/**
 * Snake — the classic mechanic, played with the mask as the head and
 * little masks as food. Grid-based, tick-driven movement (see engine.ts)
 * rather than the continuous motion Invaders/Runner use.
 *
 * Keyboard reuses useGameKeys as-is: a turn is a single edge-triggered
 * event per keydown, exactly the "one queued direction change" grid
 * movement wants — no held-state hook needed here, unlike Runner's duck.
 * Touch is a swipe gesture tracked locally against GameCanvas's existing
 * pointer callbacks; a swipe re-arms after firing so a continued drag
 * can queue several turns without lifting the finger.
 */
export function SnakeGame() {
  const t = useTranslations("Games");
  const [status, setStatus] = useState<GameStatus>("idle");
  const [hud, setHud] = useState<Hud>(IDLE_HUD);
  const [isNewBest, setIsNewBest] = useState(false);
  const { best, submit } = useHighscore("snake");

  const engineRef = useRef<SnakeEngine | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const spritesRef = useRef<SnakeSprites>(FALLBACK_SPRITES);
  const swipeOriginRef = useRef<[number, number] | null>(null);

  useGameKeys(status === "playing", (intent) => {
    if (intent === "up" || intent === "down" || intent === "left" || intent === "right") {
      engineRef.current?.setDirection(intent);
    }
  });

  useEffect(() => {
    const colors = {
      gold: readCssColor("--color-gold"),
      bloodText: readCssColor("--color-blood-text"),
      ash: readCssColor("--color-ash"),
    };
    spritesRef.current = { ...spritesRef.current, colors };
    loadTintedMaskSprite(colors.gold).then((sprite) => {
      spritesRef.current = { ...spritesRef.current, head: sprite, food: sprite };
    });
    loadTintedMaskSprite(colors.bloodText).then((sprite) => {
      spritesRef.current = { ...spritesRef.current, foodRare: sprite };
    });
  }, []);

  const step = useCallback(
    (deltaSeconds: number) => {
      const engine = engineRef.current;
      if (engine === null) return;

      const hudChanged = engine.step(deltaSeconds);
      const snapshot = engine.snapshot();

      const ctx = ctxRef.current;
      if (ctx !== null) drawSnake(ctx, snapshot, spritesRef.current);

      if (hudChanged) {
        setHud({ score: snapshot.score, length: snapshot.length });
      }

      if (snapshot.finished) {
        setStatus("over");
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
    const engine = new SnakeEngine();
    engineRef.current = engine;
    swipeOriginRef.current = null;
    const snapshot = engine.snapshot();
    setHud({ score: snapshot.score, length: snapshot.length });
    setIsNewBest(false);
    setStatus("playing");
  }, []);

  return (
    <GameShell
      eyebrow={t("snake.eyebrow")}
      title={t("snake.title")}
      instructions={t("snake.instructions")}
      status={status}
      score={hud.score}
      best={best}
      extraLabel={t("lengthLabel")}
      extraValue={String(hud.length)}
      onStart={handleStart}
      onResume={() => setStatus("playing")}
      onPause={() => setStatus("paused")}
      gameOver={<GameOverCard score={hud.score} best={best} isNewBest={isNewBest} onRestart={handleStart} />}
    >
      <div className="p-3 sm:p-4">
        <GameCanvas
          logicalWidth={LOGICAL_WIDTH}
          logicalHeight={LOGICAL_HEIGHT}
          className="mx-auto max-w-xs border border-ash bg-pitch"
          onContext={(ctx) => {
            ctxRef.current = ctx;
          }}
          onPointerActive={(x, y, isNewPress) => {
            if (status !== "playing") return;
            if (isNewPress) {
              swipeOriginRef.current = [x, y];
              return;
            }
            const origin = swipeOriginRef.current;
            if (!origin) return;
            const dx = x - origin[0];
            const dy = y - origin[1];
            if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return;

            const direction: Direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
            engineRef.current?.setDirection(direction);
            // Re-arm from the new point rather than requiring a fresh
            // press, so one continuous drag can chain several turns.
            swipeOriginRef.current = [x, y];
          }}
          onPointerRelease={() => {
            swipeOriginRef.current = null;
          }}
        />
      </div>
    </GameShell>
  );
}
