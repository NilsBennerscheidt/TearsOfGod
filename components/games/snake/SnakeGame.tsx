"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { GameCanvas } from "@/components/games/GameCanvas";
import { GameOverCard } from "@/components/games/GameOverCard";
import { GameShell, type GameStatus } from "@/components/games/GameShell";
import { cn } from "@/lib/cn";
import { useGameKeys } from "@/lib/games/input";
import { drawSnake, type SnakeSprites } from "@/lib/games/snake/render";
import {
  type Direction,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  modeVariantKey,
  SnakeEngine,
  type SnakeOptions,
  type SpeedPreset,
  type WallMode,
} from "@/lib/games/snake/engine";
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

const WALL_MODES: readonly WallMode[] = ["walls", "wraparound"];
const SPEED_PRESETS: readonly SpeedPreset[] = ["slow", "normal", "fast"];

const WALL_MODE_LABEL_KEYS: Record<WallMode, string> = { walls: "snake.wallsOn", wraparound: "snake.wallsOff" };
const SPEED_PRESET_LABEL_KEYS: Record<SpeedPreset, string> = {
  slow: "snake.speedSlow",
  normal: "snake.speedNormal",
  fast: "snake.speedFast",
};

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
 *
 * Mode selection (walls on/off, speed) lives on the idle screen via
 * GameShell's idleExtra slot — plain React state, not persisted across a
 * reload, so it can't grow into a second storage concern alongside
 * highscores. Each of the six combinations gets its own highscore (see
 * modeVariantKey) rather than one shared best, which would always be
 * dominated by whichever combination is easiest.
 */
export function SnakeGame() {
  const t = useTranslations("Games");
  const [status, setStatus] = useState<GameStatus>("idle");
  const [hud, setHud] = useState<Hud>(IDLE_HUD);
  const [isNewBest, setIsNewBest] = useState(false);
  const [wallMode, setWallMode] = useState<WallMode>("walls");
  const [speedPreset, setSpeedPreset] = useState<SpeedPreset>("normal");

  const options: SnakeOptions = { wallMode, speedPreset };
  const { best, submit } = useHighscore("snake", modeVariantKey(options));

  const engineRef = useRef<SnakeEngine | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const spritesRef = useRef<SnakeSprites>(FALLBACK_SPRITES);
  const swipeOriginRef = useRef<[number, number] | null>(null);
  // handleStart reads the mode via this ref rather than closing over
  // `options` directly — it's a useCallback with an empty dependency
  // array (identity-stable across renders is what lets useGameKeys and
  // GameShell's own effects avoid resubscribing on every keystroke of
  // mode-picking), so it needs a live read, not a captured value.
  // Refreshed in an effect, not assigned during render — the same "no
  // dependency array, runs after every render" shape useGameLoop's own
  // ref-refresh effect uses, so this is never a render-time ref write.
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

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
    const engine = new SnakeEngine(optionsRef.current);
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
      idleExtra={
        <ModePicker
          wallMode={wallMode}
          onWallMode={setWallMode}
          speedPreset={speedPreset}
          onSpeedPreset={setSpeedPreset}
        />
      }
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
          className="mx-auto max-w-md border border-ash bg-pitch"
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

interface ModePickerProps {
  wallMode: WallMode;
  onWallMode: (mode: WallMode) => void;
  speedPreset: SpeedPreset;
  onSpeedPreset: (preset: SpeedPreset) => void;
}

/** The idle-screen mode picker: walls on/off, speed. Two toggle-button groups, each showing which of its options is currently selected. */
function ModePicker({ wallMode, onWallMode, speedPreset, onSpeedPreset }: ModePickerProps) {
  const t = useTranslations("Games");

  return (
    <div className="flex flex-col items-center gap-4">
      <ModeGroup label={t("snake.wallsLabel")}>
        {WALL_MODES.map((mode) => (
          <ModeOption key={mode} selected={mode === wallMode} onClick={() => onWallMode(mode)}>
            {t(WALL_MODE_LABEL_KEYS[mode])}
          </ModeOption>
        ))}
      </ModeGroup>
      <ModeGroup label={t("speedLabel")}>
        {SPEED_PRESETS.map((preset) => (
          <ModeOption key={preset} selected={preset === speedPreset} onClick={() => onSpeedPreset(preset)}>
            {t(SPEED_PRESET_LABEL_KEYS[preset])}
          </ModeOption>
        ))}
      </ModeGroup>
    </div>
  );
}

function ModeGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <p className="text-meta text-steel-text font-mono tracking-widest uppercase">{label}</p>
      <div className="flex gap-1.5" role="group" aria-label={label}>
        {children}
      </div>
    </div>
  );
}

function ModeOption({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "text-meta font-mono min-h-9 border px-3 py-1.5 tracking-wide uppercase",
        selected ? "border-gold bg-gold text-pitch" : "border-bone/40 text-bone/70 hover:border-bone hover:text-bone",
      )}
    >
      {children}
    </button>
  );
}
