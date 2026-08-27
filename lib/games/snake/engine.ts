/**
 * The Snake simulation — pure logic, no canvas/React.
 *
 * Unlike the three continuous-motion games (Invaders/Runner move in
 * real units every frame), Snake and Pac-Man both move on a discrete
 * grid at a fixed tick rate — classic arcade movement, not physics.
 * `step(dt)` is still called every simulated 1/60s frame by the shared
 * game loop; internally it just accumulates time in `moveTimer` and
 * only advances the grid once that crosses the current tick interval,
 * the same "accumulate, then act" shape spawnTimer already uses in
 * Invaders/Runner.
 *
 * Rendering still interpolates smoothly between grid cells (via
 * `moveProgress` in the snapshot) rather than snapping instantly, so
 * this doesn't feel like an outlier next to the other three games' fluid
 * motion — see render.ts for how that's used.
 */

export const COLS = 20;
export const ROWS = 20;
export const CELL = 15;
export const LOGICAL_WIDTH = COLS * CELL;
export const LOGICAL_HEIGHT = ROWS * CELL;

const START_LENGTH = 3;
const START_COL = 10;
const START_ROW = 10;

const TICK_START_MS = 160;
const TICK_MIN_MS = 75;
const TICK_STEP_MS = 3;

const FOOD_POINTS = { gold: 10, blood: 30 } as const;
const BLOOD_CHANCE = 0.15;

export type Direction = "up" | "down" | "left" | "right";
export type FoodVariant = "gold" | "blood";

/** "walls" is the classic rule (edge = death); "wraparound" lets the snake pass through an edge and reappear on the opposite side instead. */
export type WallMode = "walls" | "wraparound";
export type SpeedPreset = "slow" | "normal" | "fast";

export interface SnakeOptions {
  wallMode: WallMode;
  speedPreset: SpeedPreset;
}

export const DEFAULT_SNAKE_OPTIONS: SnakeOptions = { wallMode: "walls", speedPreset: "normal" };

/**
 * Multiplies both TICK_START_MS and TICK_MIN_MS uniformly, so every
 * preset keeps the same relative growth-based ramp shape (TICK_STEP_MS
 * is left alone) — just shifted faster or slower as a whole, rather than
 * changing how steeply speed increases as the snake grows.
 */
const SPEED_MULTIPLIERS: Record<SpeedPreset, number> = { slow: 1.3, normal: 1, fast: 0.75 };

/**
 * One highscore per mode combination, not one shared best across all
 * six — see lib/games/scores.ts's `variant` parameter. A single shared
 * best would always be dominated by whichever combination is easiest
 * (wraparound + slow), which makes it meaningless as something to beat
 * in any other mode. Stable, storage-key-safe strings (no spaces/colons
 * beyond the one separator scores.ts itself adds).
 */
export function modeVariantKey(options: SnakeOptions): string {
  return `${options.wallMode}-${options.speedPreset}`;
}

const DELTAS: Record<Direction, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

function isOpposite(a: Direction, b: Direction): boolean {
  return DELTAS[a].dx === -DELTAS[b].dx && DELTAS[a].dy === -DELTAS[b].dy;
}

interface Segment {
  col: number;
  row: number;
  prevCol: number;
  prevRow: number;
}

export interface SegmentView {
  readonly x: number;
  readonly y: number;
}

export interface FoodView {
  readonly col: number;
  readonly row: number;
  readonly variant: FoodVariant;
}

export interface SnakeSnapshot {
  readonly segments: readonly SegmentView[];
  readonly food: FoodView | null;
  /** The snake's current heading — the direction the last completed tick actually moved in, not necessarily `setDirection`'s most recent call (a queued reversal is rejected and never applied). Lets the renderer orient the head sprite, and callers reason about legal next moves. */
  readonly direction: Direction;
  readonly score: number;
  readonly length: number;
  readonly finished: boolean;
}

export class SnakeEngine {
  private readonly options: SnakeOptions;

  private body: Segment[] = [];
  private direction: Direction = "right";
  private queuedDirection: Direction = "right";

  private food: { col: number; row: number; variant: FoodVariant } | null = null;

  private moveTimer: number;
  private score = 0;
  private finished = false;

  constructor(options: SnakeOptions = DEFAULT_SNAKE_OPTIONS) {
    this.options = options;
    this.body = Array.from({ length: START_LENGTH }, (_, i) => ({
      col: START_COL - i,
      row: START_ROW,
      prevCol: START_COL - i,
      prevRow: START_ROW,
    }));
    this.moveTimer = TICK_START_MS * SPEED_MULTIPLIERS[options.speedPreset] * 0.001;
    this.spawnFood();
  }

  private tickIntervalSeconds(): number {
    const growth = this.body.length - START_LENGTH;
    const multiplier = SPEED_MULTIPLIERS[this.options.speedPreset];
    return Math.max(TICK_MIN_MS * multiplier, TICK_START_MS * multiplier - growth * TICK_STEP_MS) / 1000;
  }

  /**
   * Queues a turn for the next grid tick — never applied immediately.
   * Only the most recent call before the next tick wins (no multi-turn
   * buffer), and a direction that would reverse the snake into its own
   * neck is silently rejected: the classic Snake rule that stops a fast
   * double-tap from being an instant, unavoidable self-collision.
   */
  setDirection(direction: Direction): void {
    if (isOpposite(direction, this.direction)) return;
    this.queuedDirection = direction;
  }

  /**
   * Advances the simulation. Returns true when the score changed or the
   * run just ended — the only HUD-relevant events; a tick that only
   * moves the snake without eating doesn't need to reach React (drawing
   * still happens every frame regardless, via the interpolated
   * moveProgress in the snapshot).
   */
  step(deltaSeconds: number): boolean {
    if (this.finished) return false;

    this.moveTimer -= deltaSeconds;
    if (this.moveTimer > 0) return false;
    this.moveTimer += this.tickIntervalSeconds();

    return this.advanceGrid();
  }

  private advanceGrid(): boolean {
    this.direction = this.queuedDirection;
    const head = this.body[0];
    if (!head) return false;

    const { dx, dy } = DELTAS[this.direction];
    let nextCol = head.col + dx;
    let nextRow = head.row + dy;

    const outOfBounds = nextCol < 0 || nextCol >= COLS || nextRow < 0 || nextRow >= ROWS;
    if (outOfBounds) {
      if (this.options.wallMode === "walls") {
        this.finished = true;
        return true;
      }
      // Wraparound: reappear on the opposite edge. `((n % m) + m) % m`
      // rather than a plain `%` — nextCol/nextRow are only ever exactly
      // one cell past an edge (COLS or -1), so this normalizes that one
      // step of overshoot in either direction without needing a general
      // modulo-for-negatives helper.
      nextCol = ((nextCol % COLS) + COLS) % COLS;
      nextRow = ((nextRow % ROWS) + ROWS) % ROWS;
    }

    const ateFood = this.food !== null && this.food.col === nextCol && this.food.row === nextRow;

    // Self-collision check excludes the current tail cell when not
    // eating — the tail is about to vacate that cell this tick, so
    // moving into it isn't actually a collision (the classic "chase your
    // own tail closely" case).
    const tailWillMove = !ateFood;
    const bodyToCheck = tailWillMove ? this.body.slice(0, -1) : this.body;
    if (bodyToCheck.some((segment) => segment.col === nextCol && segment.row === nextRow)) {
      this.finished = true;
      return true;
    }

    for (const segment of this.body) {
      segment.prevCol = segment.col;
      segment.prevRow = segment.row;
    }

    if (ateFood) {
      const eaten = this.food;
      // On a wrap tick, prevCol/prevRow are set to the *new* position
      // rather than the old one — an interpolated slide from one edge to
      // the opposite edge would otherwise render as the head sweeping
      // backward across almost the entire board for that tick, instead
      // of reappearing on the far side the way wraparound should look.
      this.body.unshift({
        col: nextCol,
        row: nextRow,
        prevCol: outOfBounds ? nextCol : head.col,
        prevRow: outOfBounds ? nextRow : head.row,
      });
      if (eaten) this.score += FOOD_POINTS[eaten.variant];
      this.spawnFood();
      return true;
    }

    // Shift every segment one step toward the segment ahead of it,
    // head included, then place the new head — the standard
    // "everyone follows the one in front" snake-movement model.
    for (let i = this.body.length - 1; i > 0; i--) {
      const segment = this.body[i];
      const ahead = this.body[i - 1];
      if (!segment || !ahead) continue;
      segment.col = ahead.col;
      segment.row = ahead.row;
    }
    head.col = nextCol;
    head.row = nextRow;
    // Same wrap-snap treatment as the eating branch above.
    if (outOfBounds) {
      head.prevCol = nextCol;
      head.prevRow = nextRow;
    }

    return false;
  }

  private spawnFood(): void {
    const occupied = new Set(this.body.map((s) => `${s.col},${s.row}`));
    let col = 0;
    let row = 0;
    let attempts = 0;
    do {
      col = Math.floor(Math.random() * COLS);
      row = Math.floor(Math.random() * ROWS);
      attempts += 1;
      // COLS*ROWS=400 cells and the snake is short for the vast
      // majority of a run — this loop resolves in one or two tries
      // almost always. The cap only matters in the near-impossible case
      // of a snake filling nearly the whole board.
    } while (occupied.has(`${col},${row}`) && attempts < 200);

    this.food = { col, row, variant: Math.random() < BLOOD_CHANCE ? "blood" : "gold" };
  }

  snapshot(): SnakeSnapshot {
    const progress = 1 - this.moveTimer / this.tickIntervalSeconds();
    const t = Math.min(1, Math.max(0, progress));

    return {
      segments: this.body.map((s) => ({
        x: (s.prevCol + (s.col - s.prevCol) * t) * CELL,
        y: (s.prevRow + (s.row - s.prevRow) * t) * CELL,
      })),
      food: this.food ? { col: this.food.col, row: this.food.row, variant: this.food.variant } : null,
      direction: this.direction,
      score: this.score,
      length: this.body.length,
      finished: this.finished,
    };
  }
}
