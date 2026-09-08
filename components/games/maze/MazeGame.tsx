"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { GameCanvas } from "@/components/games/GameCanvas";
import { GameOverCard } from "@/components/games/GameOverCard";
import { GameShell, Overlay, type GameStatus } from "@/components/games/GameShell";
import { useGameKeys } from "@/lib/games/input";
import { type Direction, INITIAL_LIVES, LOGICAL_HEIGHT, LOGICAL_WIDTH, MazeEngine } from "@/lib/games/maze/engine";
import { drawMaze, type MazeSprites } from "@/lib/games/maze/render";
import { loadTintedMaskSprite, readCssColor } from "@/lib/games/sprites";
import { useGameLoop } from "@/lib/games/useGameLoop";
import { useHighscore } from "@/lib/games/useHighscore";

interface Hud {
  score: number;
  lives: number;
  levelClearActive: boolean;
}

const IDLE_HUD: Hud = { score: 0, lives: INITIAL_LIVES, levelClearActive: false };

const FALLBACK_SPRITES: MazeSprites = {
  ghosts: [null, null, null],
  frightened: null,
  player: null,
  colors: { gold: "#d9b25a", bloodText: "#e0483f", steelText: "#9a9086", goldDeep: "#8a5e1d", ash: "#2d2824" },
};

/** Same threshold family as Snake's SWIPE_THRESHOLD — small cells, small gestures. */
const SWIPE_THRESHOLD = 10;

/**
 * Mask Maze — the maze-chase mechanic, not named after its inspiration
 * (that name is trademarked; the homage is in the mechanic, the same
 * way "Mask Invasion" plays Space Invaders without borrowing its name).
 *
 * Tick-based grid movement like Snake, but with buffered turning: a
 * direction is queued and adopted the instant it's legal, rather than
 * requiring a precisely-timed keypress at the exact tick a corridor
 * opens — the control feel this genre is built on. See engine.ts for
 * what's deliberately simplified (no tunnel, no ghost house).
 */
export function MazeGame() {
  const t = useTranslations("Games");
  const [status, setStatus] = useState<GameStatus>("idle");
  const [hud, setHud] = useState<Hud>(IDLE_HUD);
  const [isNewBest, setIsNewBest] = useState(false);
  const { best, submit } = useHighscore("maze");

  const engineRef = useRef<MazeEngine | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const spritesRef = useRef<MazeSprites>(FALLBACK_SPRITES);
  const swipeOriginRef = useRef<[number, number] | null>(null);
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useGameKeys(status === "playing", (intent) => {
    if (intent === "up" || intent === "down" || intent === "left" || intent === "right") {
      engineRef.current?.setDirection(intent);
    }
  });

  useEffect(() => {
    const colors = {
      gold: readCssColor("--color-gold"),
      bloodText: readCssColor("--color-blood-text"),
      steelText: readCssColor("--color-steel-text"),
      goldDeep: readCssColor("--color-gold-deep"),
      ash: readCssColor("--color-ash"),
    };
    spritesRef.current = { ...spritesRef.current, colors };
    loadTintedMaskSprite(colors.gold).then((sprite) => {
      spritesRef.current = { ...spritesRef.current, player: sprite };
    });
    loadTintedMaskSprite(colors.steelText).then((sprite) => {
      spritesRef.current = { ...spritesRef.current, frightened: sprite };
    });
    Promise.all([colors.bloodText, colors.steelText, colors.goldDeep].map(loadTintedMaskSprite)).then((ghostSprites) => {
      spritesRef.current = { ...spritesRef.current, ghosts: ghostSprites };
    });
  }, []);

  const step = useCallback(
    (deltaSeconds: number) => {
      const engine = engineRef.current;
      if (engine === null) return;

      const hudChanged = engine.step(deltaSeconds);
      const snapshot = engine.snapshot();

      const ctx = ctxRef.current;
      if (ctx !== null) drawMaze(ctx, snapshot, spritesRef.current);

      if (hudChanged) {
        setHud({ score: snapshot.score, lives: snapshot.lives, levelClearActive: snapshot.levelClearActive });
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
    const engine = new MazeEngine();
    engineRef.current = engine;
    swipeOriginRef.current = null;
    const snapshot = engine.snapshot();
    setHud({ score: snapshot.score, lives: snapshot.lives, levelClearActive: snapshot.levelClearActive });
    setIsNewBest(false);
    setStatus("playing");
  }, []);

  return (
    <GameShell
      eyebrow={t("maze.eyebrow")}
      title={t("maze.title")}
      instructions={t("maze.instructions")}
      status={status}
      score={hud.score}
      best={best}
      extraLabel={t("livesLabel")}
      extraValue={String(hud.lives)}
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
        onPointerActive={(x, y, isNewPress) => {
          if (statusRef.current !== "playing") return;
          if (isNewPress) {
            swipeOriginRef.current = [x, y];
            return;
          }
          const origin = swipeOriginRef.current;
          if (!origin) return;
          const dx = x - origin[0];
          const dy = y - origin[1];
          if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return;

          const direction: Direction =
            Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
          engineRef.current?.setDirection(direction);
          swipeOriginRef.current = [x, y];
        }}
        onPointerRelease={() => {
          swipeOriginRef.current = null;
        }}
      />

      {status === "playing" && hud.levelClearActive && (
        <Overlay className="bg-pitch/70">
          <p className="font-display text-2xl text-gold uppercase">{t("maze.levelClear")}</p>
        </Overlay>
      )}
    </GameShell>
  );
}
