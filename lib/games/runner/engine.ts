import { rectsOverlap, type Rect } from "@/lib/games/geometry";

/**
 * The Runner simulation — pure logic, no canvas/React, on the same split
 * Invaders uses: `step()`'s return value is "did the HUD (score digit,
 * speed multiplier, or game-over) change", not "did anything move" — the
 * canvas redraws every frame regardless, since the scroll itself is the
 * game.
 *
 * Unlike Whack (a 60s round) and Invaders (ends when a fixed wave-based
 * threat resolves), this is genuinely endless: there is no round timer
 * and no win condition, only a run that gets faster until the player
 * misses one obstacle. That's the defining trait of the genre the
 * original request asked for, so GameShell's third HUD slot shows the
 * current speed multiplier here instead of a countdown or a lives count.
 */

export const LOGICAL_WIDTH = 480;
export const LOGICAL_HEIGHT = 200;

export const GROUND_Y = 160;

export const PLAYER_X = 70;
export const PLAYER_W = 26;
export const PLAYER_STAND_H = 32;
export const PLAYER_DUCK_H = 16;

const GRAVITY = 1000;
const JUMP_VELOCITY = -360;
/**
 * Holding duck while airborne multiplies gravity — a fast-fall, the
 * genre-standard way to hand the player agency over the back half of an
 * otherwise fully deterministic jump arc. Applied uniformly whenever
 * duck is held and airborne, not gated to "past the apex": pressed
 * early it also cuts a jump short (a smaller, tighter hop), pressed at
 * or after the peak it just drops you faster — one multiplier, no extra
 * branching for which phase of the arc you're in.
 */
const FAST_FALL_GRAVITY_MULTIPLIER = 2.6;

// Exported, not just internal constants: render.ts draws obstacles at
// exactly these dimensions, so what the player sees and what
// checkCollision tests against can never silently drift apart.
export const GROUND_OBSTACLE_W = 20;
export const GROUND_OBSTACLE_H = 26;
export const OVERHEAD_OBSTACLE_W = 30;
export const OVERHEAD_OBSTACLE_H = 22;
/** Clearance above a ducking player's head — see the geometry note by checkCollision for why this and PLAYER_DUCK_H together guarantee a duck actually clears it. */
const OVERHEAD_CLEARANCE = 6;
export const OVERHEAD_BOTTOM_Y = GROUND_Y - PLAYER_DUCK_H - OVERHEAD_CLEARANCE;

const BASE_SPEED = 150;
const SPEED_RAMP_PER_SECOND = 4;
const MAX_SPEED = 420;

/**
 * The floor on spawn timing. Air time for a full jump is
 * `2 * -JUMP_VELOCITY / GRAVITY` = 0.72s; this leaves roughly another
 * 0.35s of margin on top so a player who just landed still has a beat to
 * read the next obstacle, even at MAX_SPEED where the distance-based
 * formula below would otherwise crowd obstacles arbitrarily close
 * together.
 */
const MIN_SPAWN_INTERVAL_SECONDS = 1.1;
const MIN_GAP_UNITS = 170;
const GAP_JITTER_UNITS = 150;

const SCORE_PER_UNIT = 0.1;

/** Spacing between scrolling ground-texture ticks, in logical units — render.ts draws them at the same pitch groundOffset is modulo'd against below. */
export const GROUND_TICK_SPACING = 24;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export type ObstacleKind = "ground" | "overhead";

interface Obstacle {
  x: number;
  kind: ObstacleKind;
}

export interface ObstacleView {
  readonly x: number;
  readonly kind: ObstacleKind;
}

export interface RunnerSnapshot {
  readonly playerY: number;
  readonly isDucking: boolean;
  readonly isGrounded: boolean;
  readonly obstacles: readonly ObstacleView[];
  readonly groundOffset: number;
  readonly score: number;
  readonly speedMultiplier: number;
  readonly finished: boolean;
}

export class RunnerEngine {
  /** Vertical displacement from the grounded baseline; 0 = grounded, negative = airborne. */
  private airOffset = 0;
  private velocityY = 0;
  private isGrounded = true;
  /** The raw held-duck input, tracked regardless of grounded state — airborne it drives fast-fall, grounded it drives isDucking below. */
  private duckHeld = false;
  /** Derived each step from duckHeld && isGrounded — the crouch hitbox only ever applies on the ground (see the class doc on PLAYER_DUCK_H), never mid-air. */
  private isDucking = false;

  private obstacles: Obstacle[] = [];
  private spawnTimer = 1.4;

  private elapsedSeconds = 0;
  private distance = 0;
  private lastScore = 0;
  private groundOffset = 0;

  private finished = false;

  /** Grounded jumps only — mid-air presses are silently ignored rather than double-jumping. */
  jump(): void {
    if (!this.isGrounded || this.finished) return;
    this.velocityY = JUMP_VELOCITY;
    this.isGrounded = false;
    this.isDucking = false;
  }

  /**
   * Held state, not an instant hitbox toggle: while airborne this drives
   * fast-fall (see advancePhysics) rather than being ignored outright —
   * only the grounded crouch hitbox waits for landing. Recomputes
   * isDucking immediately against the *current* isGrounded, so a caller
   * that reads a snapshot right after this call (without an intervening
   * step()) sees a value consistent with what they just set — step()
   * recomputes it again after advancePhysics for the one case this call
   * alone can't catch: landing completes mid-step with duckHeld already
   * unchanged from the frame before.
   */
  setDucking(ducking: boolean): void {
    this.duckHeld = ducking;
    this.recomputeDucking();
  }

  private recomputeDucking(): void {
    this.isDucking = this.duckHeld && this.isGrounded;
  }

  private currentSpeed(): number {
    return Math.min(MAX_SPEED, BASE_SPEED + this.elapsedSeconds * SPEED_RAMP_PER_SECOND);
  }

  /**
   * Advances the simulation by `deltaSeconds`. Returns true when the
   * integer score changed or the run just ended — see the class doc for
   * why drawing doesn't wait on this.
   */
  step(deltaSeconds: number): boolean {
    if (this.finished) return false;

    this.elapsedSeconds += deltaSeconds;
    const speed = this.currentSpeed();

    this.distance += speed * deltaSeconds;
    this.groundOffset = (this.groundOffset + speed * deltaSeconds) % GROUND_TICK_SPACING;

    this.advancePhysics(deltaSeconds);
    // Recomputed after advancePhysics, not before: a jump landing this
    // very frame flips isGrounded mid-step, and duck should be able to
    // take effect the instant the player is grounded again rather than
    // waiting one extra frame.
    this.recomputeDucking();
    this.advanceObstacles(deltaSeconds, speed);

    if (this.checkCollision()) {
      this.finished = true;
      return true;
    }

    const score = Math.floor(this.distance * SCORE_PER_UNIT);
    const hudChanged = score !== this.lastScore;
    this.lastScore = score;
    return hudChanged;
  }

  private advancePhysics(deltaSeconds: number): void {
    if (this.isGrounded) return;

    const gravity = this.duckHeld ? GRAVITY * FAST_FALL_GRAVITY_MULTIPLIER : GRAVITY;
    this.velocityY += gravity * deltaSeconds;
    this.airOffset += this.velocityY * deltaSeconds;

    if (this.airOffset >= 0) {
      this.airOffset = 0;
      this.velocityY = 0;
      this.isGrounded = true;
    }
  }

  private advanceObstacles(deltaSeconds: number, speed: number): void {
    for (const obstacle of this.obstacles) obstacle.x -= speed * deltaSeconds;
    this.obstacles = this.obstacles.filter((obstacle) => obstacle.x + OVERHEAD_OBSTACLE_W > 0);

    this.spawnTimer -= deltaSeconds;
    if (this.spawnTimer <= 0) {
      const kind: ObstacleKind = Math.random() < 0.5 ? "ground" : "overhead";
      this.obstacles.push({ x: LOGICAL_WIDTH + 10, kind });
      const gapUnits = MIN_GAP_UNITS + Math.random() * GAP_JITTER_UNITS;
      this.spawnTimer = Math.max(MIN_SPAWN_INTERVAL_SECONDS, gapUnits / speed);
    }
  }

  /**
   * A ground obstacle must be jumped (standing/ducking hitboxes both sit
   * on the ground and would hit it); an overhead one must be ducked
   * (OVERHEAD_BOTTOM_Y is set below the ducking player's head, above the
   * standing player's — see the constant's derivation). Geometry
   * verified by hand against PLAYER_DUCK_H/PLAYER_STAND_H before tuning
   * MIN_SPAWN_INTERVAL_SECONDS, not just eyeballed.
   */
  private checkCollision(): boolean {
    const playerRect: Rect = {
      x: PLAYER_X,
      y: GROUND_Y + this.airOffset - (this.isDucking ? PLAYER_DUCK_H : PLAYER_STAND_H),
      w: PLAYER_W,
      h: this.isDucking ? PLAYER_DUCK_H : PLAYER_STAND_H,
    };

    return this.obstacles.some((obstacle) => {
      const rect: Rect =
        obstacle.kind === "ground"
          ? { x: obstacle.x, y: GROUND_Y - GROUND_OBSTACLE_H, w: GROUND_OBSTACLE_W, h: GROUND_OBSTACLE_H }
          : {
              x: obstacle.x,
              y: OVERHEAD_BOTTOM_Y - OVERHEAD_OBSTACLE_H,
              w: OVERHEAD_OBSTACLE_W,
              h: OVERHEAD_OBSTACLE_H,
            };
      return rectsOverlap(playerRect, rect);
    });
  }

  snapshot(): RunnerSnapshot {
    return {
      playerY: GROUND_Y + this.airOffset,
      isDucking: this.isDucking,
      isGrounded: this.isGrounded,
      obstacles: this.obstacles.map((obstacle) => ({ x: obstacle.x, kind: obstacle.kind })),
      groundOffset: this.groundOffset,
      score: this.lastScore,
      speedMultiplier: this.currentSpeed() / BASE_SPEED,
      finished: this.finished,
    };
  }
}
