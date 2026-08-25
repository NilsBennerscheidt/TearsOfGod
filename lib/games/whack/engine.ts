import { at, pickRandom } from "@/lib/games/collections";

/**
 * What a single hole is doing right now.
 *
 * "escaped" and "penalty" are kept apart rather than folded into one
 * "miss": a mole whose timer ran out costs the player nothing but the
 * points they didn't take, while striking an empty hole is an actual
 * scoring penalty. They look different on screen and they mean different
 * things, so they're different states.
 */
export type HoleState = "empty" | "up" | "hit" | "escaped" | "penalty";

/** Common gold mask, or the rarer, faster, higher-scoring blood mask. */
export type MoleVariant = "gold" | "blood";

export interface HoleView {
  readonly state: HoleState;
  readonly variant: MoleVariant;
}

export interface WhackSnapshot {
  readonly holes: readonly HoleView[];
  readonly score: number;
  /** Whole seconds remaining, for display. The engine keeps the fractional value internally. */
  readonly secondsLeft: number;
  readonly finished: boolean;
}

export type WhackResult = "hit" | "penalty" | "ignored";

/** 9 because the board is rendered as a fixed 3×3 grid — see WhackGame. */
export const HOLE_COUNT = 9;
export const ROUND_SECONDS = 60;

const POINTS: Readonly<Record<MoleVariant, number>> = { gold: 10, blood: 25 };
const PENALTY = 5;
const BLOOD_CHANCE = 0.18;

/** How long a hit/escaped/penalty state stays on screen before the hole resets. */
const FEEDBACK_SECONDS = 0.22;

/**
 * Difficulty endpoints, interpolated linearly across the round. The
 * numbers are tuned so the first ten seconds are winnable one-handed on
 * a phone and the last ten are not.
 */
const SPAWN_INTERVAL = { start: 0.85, end: 0.3 };
const LIFETIME = {
  gold: { start: 1.3, end: 0.62 },
  blood: { start: 0.9, end: 0.48 },
};
const MAX_CONCURRENT = { start: 2, end: 4 };

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

interface Hole {
  state: HoleState;
  variant: MoleVariant;
  /** Seconds remaining in the current state. Meaningless while "empty". */
  timer: number;
}

/**
 * The whack-a-mole simulation, as a plain mutable object with no React
 * in it.
 *
 * Mutable and snapshot-based on purpose. The loop runs `step` 60×/s, but
 * what a player can actually see changes far less often — a hole popping
 * up, a score changing, the timer crossing a whole second. `step`
 * returns whether anything visible changed, so the React layer re-renders
 * on those transitions instead of sixty times a second. That split is
 * the pattern the canvas games will need too, which is why it's
 * established here on the simplest game.
 *
 * Randomness comes from Math.random, not lib/seededRandom. That helper
 * exists to stop server and client rolling different values during SSR
 * (see its doc comment), and this engine is only ever constructed inside
 * a client-only, ssr:false component after mount — there is no server
 * render to disagree with. Seeding it would make every round identical,
 * which is the opposite of what this game wants.
 */
export class WhackEngine {
  private holes: Hole[];
  private score = 0;
  private secondsLeft = ROUND_SECONDS;
  private displayedSeconds = ROUND_SECONDS;
  private spawnTimer = 0.4;
  private finished = false;
  private dirty = true;

  constructor() {
    this.holes = Array.from({ length: HOLE_COUNT }, () => ({
      state: "empty" as HoleState,
      variant: "gold" as MoleVariant,
      timer: 0,
    }));
  }

  /** 0 at the start of the round, 1 at the end. Drives every difficulty curve. */
  private get difficulty(): number {
    return 1 - Math.max(0, this.secondsLeft) / ROUND_SECONDS;
  }

  /**
   * Advances the simulation. Returns true when something the player can
   * see has changed and a re-render is warranted.
   */
  step(deltaSeconds: number): boolean {
    if (this.finished) return false;

    this.dirty = false;

    this.secondsLeft -= deltaSeconds;

    const displayed = Math.max(0, Math.ceil(this.secondsLeft));
    if (displayed !== this.displayedSeconds) {
      this.displayedSeconds = displayed;
      this.dirty = true;
    }

    if (this.secondsLeft <= 0) {
      this.secondsLeft = 0;
      this.finished = true;
      // Clear the board so the game-over overlay isn't sitting on top of
      // a mole frozen mid-pop.
      for (const hole of this.holes) {
        hole.state = "empty";
        hole.timer = 0;
      }
      return true;
    }

    this.advanceHoles(deltaSeconds);

    this.spawnTimer -= deltaSeconds;
    if (this.spawnTimer <= 0) {
      this.spawn();
      this.spawnTimer = lerp(SPAWN_INTERVAL.start, SPAWN_INTERVAL.end, this.difficulty);
    }

    return this.dirty;
  }

  private advanceHoles(deltaSeconds: number): void {
    for (const hole of this.holes) {
      if (hole.state === "empty") continue;

      hole.timer -= deltaSeconds;
      if (hole.timer > 0) continue;

      if (hole.state === "up") {
        // Nobody got to it in time. No penalty — just the points missed.
        hole.state = "escaped";
        hole.timer = FEEDBACK_SECONDS;
      } else {
        hole.state = "empty";
        hole.timer = 0;
      }
      this.dirty = true;
    }
  }

  private spawn(): void {
    const maxConcurrent = Math.round(lerp(MAX_CONCURRENT.start, MAX_CONCURRENT.end, this.difficulty));
    const active = this.holes.reduce((count, hole) => (hole.state === "up" ? count + 1 : count), 0);
    if (active >= maxConcurrent) return;

    // Only fully empty holes — spawning into one still showing hit or
    // penalty feedback would swap the sprite out from under the player's
    // eye mid-flash.
    const candidates: number[] = [];
    this.holes.forEach((hole, index) => {
      if (hole.state === "empty") candidates.push(index);
    });

    const index = pickRandom(candidates);
    if (index === undefined) return;

    const hole = at(this.holes, index);
    if (hole === undefined) return;

    const variant: MoleVariant = Math.random() < BLOOD_CHANCE ? "blood" : "gold";
    hole.state = "up";
    hole.variant = variant;
    hole.timer = lerp(LIFETIME[variant].start, LIFETIME[variant].end, this.difficulty);
    this.dirty = true;
  }

  /**
   * Registers a strike on one hole. Safe to call with any index — an out
   * of range value is simply ignored rather than throwing, since this is
   * driven by pointer events on real DOM nodes and a stray one shouldn't
   * take the game down.
   */
  whack(index: number): WhackResult {
    if (this.finished) return "ignored";

    const hole = at(this.holes, index);
    if (hole === undefined) return "ignored";

    if (hole.state === "up") {
      this.score += POINTS[hole.variant];
      hole.state = "hit";
      hole.timer = FEEDBACK_SECONDS;
      this.dirty = true;
      return "hit";
    }

    if (hole.state === "empty") {
      this.score = Math.max(0, this.score - PENALTY);
      hole.state = "penalty";
      hole.timer = FEEDBACK_SECONDS;
      this.dirty = true;
      return "penalty";
    }

    // Mid-feedback (hit / escaped / penalty). Struck holes stay
    // untouched for a couple of frames on purpose: punishing the second
    // tap of an over-eager double-tap would read as the game being
    // broken, not as the player being greedy.
    return "ignored";
  }

  snapshot(): WhackSnapshot {
    return {
      holes: this.holes.map((hole) => ({ state: hole.state, variant: hole.variant })),
      score: this.score,
      secondsLeft: this.displayedSeconds,
      finished: this.finished,
    };
  }
}

/** The board a fresh, unstarted game shows behind the idle overlay. */
export function idleSnapshot(): WhackSnapshot {
  return new WhackEngine().snapshot();
}

export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
