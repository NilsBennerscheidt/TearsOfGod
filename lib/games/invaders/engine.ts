import { pickRandom } from "@/lib/games/collections";

/**
 * The Invaders simulation — pure logic, no canvas or React in it, on the
 * same split WhackEngine uses.
 *
 * The one real difference from Whack: there, `step()`'s "did anything
 * visible change" boolean gated a React re-render, because the DOM *is*
 * the visible state — nothing to redraw between discrete pop/hit events.
 * Here the canvas has to be redrawn every single frame regardless (that
 * continuous motion is the game), so `step()`'s return value means
 * something narrower: "did the HUD's score/lives, or the wave-clear
 * banner, change" — the only state that ever needs to reach React. The
 * canvas draw call happens unconditionally, every frame, from the
 * component's game-loop callback.
 *
 * Movement is not treated as decorative motion subject to
 * prefers-reduced-motion, unlike the shimmer/spin effects in
 * globals.css — the invaders advancing *is* the mechanic, the same way
 * reduced motion doesn't stop a platformer's camera scrolling.
 */

export const LOGICAL_WIDTH = 300;
export const LOGICAL_HEIGHT = 400;

const GRID_COLS = 6;
const GRID_ROWS = 4;
const TOTAL_INVADERS = GRID_COLS * GRID_ROWS;

export const INVADER_W = 28;
export const INVADER_H = 20;
const GAP_X = 10;
const GAP_Y = 16;
const FORMATION_W = GRID_COLS * INVADER_W + (GRID_COLS - 1) * GAP_X;
const MARGIN_X = (LOGICAL_WIDTH - FORMATION_W) / 2;
const FORMATION_TOP = 36;
const EDGE_MARGIN = 6;
const STEP_DOWN = 16;

export const PLAYER_W = 26;
export const PLAYER_H = 14;
export const PLAYER_Y = LOGICAL_HEIGHT - 34;
const PLAYER_SPEED = 210;
const PLAYER_MARGIN_X = 4;

export const BULLET_W = 3;
export const BULLET_H = 10;
const PLAYER_BULLET_SPEED = 300;
const ENEMY_BULLET_SPEED = 160;
const MAX_ENEMY_BULLETS = 4;

const BASE_H_SPEED = 34;
const WAVE_SPEED_STEP = 7;
/** How much faster the formation gets as it thins out — the classic Space Invaders "last one's a sprinter" feel. */
const THIN_OUT_RAMP = 1.6;

const POINTS = { gold: 15, blood: 35 } as const;

export const INITIAL_LIVES = 3;
const INVULN_SECONDS = 1.1;
const WAVE_CLEAR_FLASH_SECONDS = 1.3;
const WAVE_CLEAR_BONUS_PER_WAVE = 40;

function autoFireIntervalSeconds(wave: number): number {
  return Math.max(0.28, 0.55 - (wave - 1) * 0.03);
}

function enemyFireRatePerSecond(wave: number): number {
  return 0.55 + (wave - 1) * 0.16;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export type InvaderVariant = "gold" | "blood";

interface Invader {
  x: number;
  y: number;
  variant: InvaderVariant;
}

interface Bullet {
  x: number;
  y: number;
}

export interface InvaderView {
  readonly x: number;
  readonly y: number;
  readonly variant: InvaderVariant;
}

export interface BulletView {
  readonly x: number;
  readonly y: number;
}

export interface InvadersSnapshot {
  readonly invaders: readonly InvaderView[];
  readonly playerBullets: readonly BulletView[];
  readonly enemyBullets: readonly BulletView[];
  readonly playerX: number;
  readonly playerInvulnerable: boolean;
  readonly score: number;
  readonly lives: number;
  readonly wave: number;
  readonly waveClearActive: boolean;
  readonly finished: boolean;
}

type Phase = "formation" | "waveClear";

export class InvadersEngine {
  private invaders: Invader[] = [];
  private playerBullets: Bullet[] = [];
  private enemyBullets: Bullet[] = [];

  private playerX = (LOGICAL_WIDTH - PLAYER_W) / 2;
  private keyboardDir: -1 | 0 | 1 = 0;
  private pointerTargetX: number | null = null;

  private formationDir: 1 | -1 = 1;
  private fireTimer = autoFireIntervalSeconds(1);
  private enemyFireTimer = 1 / enemyFireRatePerSecond(1);
  private invulnSecondsLeft = 0;

  private score = 0;
  private lives = INITIAL_LIVES;
  private wave = 1;
  private phase: Phase = "formation";
  private waveFlashSecondsLeft = 0;
  private finished = false;

  constructor() {
    this.spawnWave();
  }

  /** Called every frame regardless of `enabled` — a stale direction/target from before a pause must not silently resume once play does. */
  setDirection(dir: -1 | 0 | 1): void {
    this.keyboardDir = dir;
  }

  /** Logical-space x the player is steering toward (pointer/touch), or null when no pointer is held — see advancePlayer for how the two input modes combine. */
  setTargetX(x: number | null): void {
    this.pointerTargetX = x;
  }

  /**
   * Advances the simulation by `deltaSeconds`. Returns true when the
   * score, lives, or wave-clear banner changed — the only things the
   * component needs to know about outside of drawing, which happens
   * unconditionally every frame regardless of this return value.
   */
  step(deltaSeconds: number): boolean {
    if (this.finished) return false;

    if (this.phase === "waveClear") {
      this.waveFlashSecondsLeft -= deltaSeconds;
      if (this.waveFlashSecondsLeft > 0) return false;

      this.waveFlashSecondsLeft = 0;
      this.wave += 1;
      this.fireTimer = autoFireIntervalSeconds(this.wave);
      this.enemyFireTimer = 1 / enemyFireRatePerSecond(this.wave);
      this.spawnWave();
      this.phase = "formation";
      return true;
    }

    this.advancePlayer(deltaSeconds);
    this.advanceFormation(deltaSeconds);
    this.advanceFiring(deltaSeconds);
    if (this.invulnSecondsLeft > 0) {
      this.invulnSecondsLeft = Math.max(0, this.invulnSecondsLeft - deltaSeconds);
    }

    for (const invader of this.invaders) {
      if (invader.y + INVADER_H >= PLAYER_Y - 4) {
        this.finished = true;
        return true;
      }
    }

    const hudChanged = this.resolveCollisions();
    if (this.finished) return true;

    if (this.invaders.length === 0) {
      this.score += WAVE_CLEAR_BONUS_PER_WAVE * this.wave;
      this.phase = "waveClear";
      this.waveFlashSecondsLeft = WAVE_CLEAR_FLASH_SECONDS;
      return true;
    }

    return hudChanged;
  }

  private spawnWave(): void {
    const invaders: Invader[] = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        invaders.push({
          x: MARGIN_X + col * (INVADER_W + GAP_X),
          // The front row is the rare, high-value variant — the classic
          // Space Invaders "top row scores most" pattern, just inverted
          // to the row closest to the player rather than furthest, since
          // it's the row a sloppy player sees least of.
          y: FORMATION_TOP + row * (INVADER_H + GAP_Y),
          variant: row === GRID_ROWS - 1 ? "blood" : "gold",
        });
      }
    }
    this.invaders = invaders;
    this.formationDir = 1;
  }

  private advancePlayer(deltaSeconds: number): void {
    if (this.pointerTargetX !== null) {
      const targetLeft = this.pointerTargetX - PLAYER_W / 2;
      const delta = targetLeft - this.playerX;
      const maxStep = PLAYER_SPEED * deltaSeconds;
      this.playerX += Math.sign(delta) * Math.min(Math.abs(delta), maxStep);
    } else if (this.keyboardDir !== 0) {
      this.playerX += this.keyboardDir * PLAYER_SPEED * deltaSeconds;
    }
    this.playerX = clamp(this.playerX, PLAYER_MARGIN_X, LOGICAL_WIDTH - PLAYER_W - PLAYER_MARGIN_X);
  }

  private formationSpeed(): number {
    const base = BASE_H_SPEED + (this.wave - 1) * WAVE_SPEED_STEP;
    const aliveRatio = this.invaders.length / TOTAL_INVADERS;
    return base * (1 + (1 - aliveRatio) * THIN_OUT_RAMP);
  }

  private advanceFormation(deltaSeconds: number): void {
    if (this.invaders.length === 0) return;

    let minX = Infinity;
    let maxX = -Infinity;
    for (const invader of this.invaders) {
      minX = Math.min(minX, invader.x);
      maxX = Math.max(maxX, invader.x + INVADER_W);
    }

    const speed = this.formationSpeed();
    let dx = this.formationDir * speed * deltaSeconds;
    let dy = 0;

    if (this.formationDir > 0 && maxX + dx >= LOGICAL_WIDTH - EDGE_MARGIN) {
      this.formationDir = -1;
      dx = 0;
      dy = STEP_DOWN;
    } else if (this.formationDir < 0 && minX + dx <= EDGE_MARGIN) {
      this.formationDir = 1;
      dx = 0;
      dy = STEP_DOWN;
    }

    for (const invader of this.invaders) {
      invader.x += dx;
      invader.y += dy;
    }
  }

  private advanceFiring(deltaSeconds: number): void {
    this.fireTimer -= deltaSeconds;
    if (this.fireTimer <= 0) {
      this.playerBullets.push({ x: this.playerX + PLAYER_W / 2 - BULLET_W / 2, y: PLAYER_Y - BULLET_H });
      this.fireTimer = autoFireIntervalSeconds(this.wave);
    }
    for (const bullet of this.playerBullets) bullet.y -= PLAYER_BULLET_SPEED * deltaSeconds;
    this.playerBullets = this.playerBullets.filter((bullet) => bullet.y + BULLET_H > 0);

    this.enemyFireTimer -= deltaSeconds;
    if (this.enemyFireTimer <= 0) {
      this.enemyFireTimer = 1 / enemyFireRatePerSecond(this.wave);
      if (this.enemyBullets.length < MAX_ENEMY_BULLETS) {
        const shooter = pickRandom(this.invaders);
        if (shooter) {
          this.enemyBullets.push({ x: shooter.x + INVADER_W / 2 - BULLET_W / 2, y: shooter.y + INVADER_H });
        }
      }
    }
    for (const bullet of this.enemyBullets) bullet.y += ENEMY_BULLET_SPEED * deltaSeconds;
    this.enemyBullets = this.enemyBullets.filter((bullet) => bullet.y < LOGICAL_HEIGHT);
  }

  /**
   * Bullet-vs-invader and bullet-vs-player collision. Removal is by
   * object identity via `.filter((x) => x !== hit)` rather than by
   * index — under `noUncheckedIndexedAccess`, indexing back into the
   * array after `.find()` would still type as possibly-undefined, and
   * every entity here is a unique object reference, so identity
   * comparison is both simpler and exactly as correct.
   */
  private resolveCollisions(): boolean {
    let hudChanged = false;

    const survivingBullets: Bullet[] = [];
    for (const bullet of this.playerBullets) {
      const bulletRect: Rect = { x: bullet.x, y: bullet.y, w: BULLET_W, h: BULLET_H };
      const hit = this.invaders.find((invader) =>
        overlaps(bulletRect, { x: invader.x, y: invader.y, w: INVADER_W, h: INVADER_H }),
      );
      if (!hit) {
        survivingBullets.push(bullet);
        continue;
      }
      this.invaders = this.invaders.filter((invader) => invader !== hit);
      this.score += POINTS[hit.variant];
      hudChanged = true;
    }
    this.playerBullets = survivingBullets;

    if (this.invulnSecondsLeft <= 0) {
      const playerRect: Rect = { x: this.playerX, y: PLAYER_Y, w: PLAYER_W, h: PLAYER_H };
      const hitBullet = this.enemyBullets.find((bullet) =>
        overlaps({ x: bullet.x, y: bullet.y, w: BULLET_W, h: BULLET_H }, playerRect),
      );
      if (hitBullet) {
        this.enemyBullets = this.enemyBullets.filter((bullet) => bullet !== hitBullet);
        this.lives -= 1;
        this.invulnSecondsLeft = INVULN_SECONDS;
        hudChanged = true;
        if (this.lives <= 0) this.finished = true;
      }
    }

    return hudChanged;
  }

  snapshot(): InvadersSnapshot {
    return {
      invaders: this.invaders.map((invader) => ({ x: invader.x, y: invader.y, variant: invader.variant })),
      playerBullets: this.playerBullets.map((bullet) => ({ x: bullet.x, y: bullet.y })),
      enemyBullets: this.enemyBullets.map((bullet) => ({ x: bullet.x, y: bullet.y })),
      playerX: this.playerX,
      playerInvulnerable: this.invulnSecondsLeft > 0,
      score: this.score,
      lives: this.lives,
      wave: this.wave,
      waveClearActive: this.phase === "waveClear",
      finished: this.finished,
    };
  }
}
