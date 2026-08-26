import { pickRandom } from "@/lib/games/collections";

/**
 * The Mask Maze simulation — pure logic, no canvas/React, on the same
 * tick-based grid model Snake uses (see its engine doc comment for why
 * that's a different shape from Invaders/Runner's continuous motion).
 *
 * Deliberately simplified against the genre's full original: no
 * wraparound tunnel and no enclosed ghost house — both are the two
 * layout-sensitive features hardest to get right without being able to
 * see the maze rendered while building it, and this is a minigame, not
 * a faithful recreation. A caught ghost respawns at its own spawn point
 * after a short delay instead of "returning to the box." Everything
 * else — pellets, power pellets, chase/flee ghosts, lives, level
 * progression — is here.
 *
 * The maze itself is generated, not hand-authored: a wall border plus a
 * regular lattice of single-cell interior pillars (every even row/col in
 * the interior). Pillars are never adjacent to each other, so removing
 * them from an otherwise-full grid can never disconnect it — the layout
 * is correct by construction, not by eyeballing a hand-drawn grid.
 */

export const COLS = 19;
export const ROWS = 17;
export const CELL = 16;
export const LOGICAL_WIDTH = COLS * CELL;
export const LOGICAL_HEIGHT = ROWS * CELL;

export type Direction = "up" | "down" | "left" | "right";

const DELTAS: Record<Direction, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

const OPPOSITE: Record<Direction, Direction> = { up: "down", down: "up", left: "right", right: "left" };

/** Odd/odd so every one of these is guaranteed open regardless of the pillar lattice (a pillar only ever sits at row%2===0 && col%2===0). */
const PLAYER_SPAWN = { col: 9, row: 9 };
/**
 * None of these shares a row or column with PLAYER_SPAWN — verified the
 * hard way: an earlier layout put one ghost at (9,13), a straight
 * 4-cell corridor shot from spawn with no turn required, and a
 * play-through test (a "collect every pellet, avoid nearby chasing
 * ghosts" bot) died three times in the first 26 seconds, twice within
 * 2.6s of each other, because that ghost could close the distance
 * before RESPAWN_INVULN_S even ran out. A spawn sharing an axis with
 * the player is a beeline, not a chase.
 */
const GHOST_SPAWNS = [
  { col: 3, row: 3 },
  { col: 15, row: 3 },
  { col: 15, row: 13 },
];
const POWER_PELLET_CELLS = [
  { col: 1, row: 1 },
  { col: COLS - 2, row: 1 },
  { col: 1, row: ROWS - 2 },
  { col: COLS - 2, row: ROWS - 2 },
];

const PELLET_POINTS = 10;
const POWER_PELLET_POINTS = 50;
const GHOST_EAT_POINTS = 200;
const LEVEL_CLEAR_BONUS_PER_LEVEL = 100;

const PLAYER_TICK_FLOOR_MS = 110;
const GHOST_TICK_FLOOR_MS = 130;
const TICK_LEVEL_STEP_MS = 5;
/** Frightened ghosts always move slower than chasing ones — easier to catch, and a legible signal on its own even before the color change registers. */
const FRIGHTENED_TICK_BONUS_MS = 40;

const FRIGHTENED_DURATION_S = 6;
const GHOST_RESPAWN_DELAY_S = 2.5;
const RESPAWN_INVULN_S = 1.5;
const LEVEL_CLEAR_FLASH_SECONDS = 1.3;

/** Probability a ghost takes the distance-optimal move rather than a random legal one — enough bias to feel like a chase, not so much that it's inescapable. */
const CHASE_BIAS = 0.75;
const FLEE_BIAS = 0.8;

function playerTickSeconds(level: number): number {
  return Math.max(PLAYER_TICK_FLOOR_MS, 150 - (level - 1) * TICK_LEVEL_STEP_MS) / 1000;
}
function ghostTickSeconds(level: number): number {
  return Math.max(GHOST_TICK_FLOOR_MS, 170 - (level - 1) * TICK_LEVEL_STEP_MS) / 1000;
}
function frightenedGhostTickSeconds(level: number): number {
  return ghostTickSeconds(level) + FRIGHTENED_TICK_BONUS_MS / 1000;
}

interface Cell {
  wall: boolean;
  hasPellet: boolean;
  hasPower: boolean;
}

function buildMaze(): Cell[][] {
  const grid: Cell[][] = [];
  for (let row = 0; row < ROWS; row++) {
    const line: Cell[] = [];
    for (let col = 0; col < COLS; col++) {
      const isBorder = row === 0 || row === ROWS - 1 || col === 0 || col === COLS - 1;
      const isPillar =
        !isBorder && row % 2 === 0 && col % 2 === 0 && row >= 2 && row <= ROWS - 3 && col >= 2 && col <= COLS - 3;
      const wall = isBorder || isPillar;
      line.push({ wall, hasPellet: !wall, hasPower: false });
    }
    grid.push(line);
  }
  return grid;
}

function getCell(grid: Cell[][], col: number, row: number): Cell | undefined {
  return grid[row]?.[col];
}

function isWalkable(grid: Cell[][], col: number, row: number): boolean {
  const cell = getCell(grid, col, row);
  return cell !== undefined && !cell.wall;
}

/** Clears pellets from spawn cells and lays down power pellets — shared by the initial build and every level's refill, since the wall layout never changes but the pellets do. */
function populatePellets(grid: Cell[][]): void {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = getCell(grid, col, row);
      if (cell && !cell.wall) {
        cell.hasPellet = true;
        cell.hasPower = false;
      }
    }
  }
  const spawns = [PLAYER_SPAWN, ...GHOST_SPAWNS];
  for (const spawn of spawns) {
    const cell = getCell(grid, spawn.col, spawn.row);
    if (cell) cell.hasPellet = false;
  }
  for (const power of POWER_PELLET_CELLS) {
    const cell = getCell(grid, power.col, power.row);
    if (cell) {
      cell.hasPower = true;
      cell.hasPellet = false;
    }
  }
}

function countPellets(grid: Cell[][]): number {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell.hasPellet || cell.hasPower) count += 1;
    }
  }
  return count;
}

interface MovingEntity {
  col: number;
  row: number;
  prevCol: number;
  prevRow: number;
  moveTimer: number;
  direction: Direction;
}

type GhostState = "chase" | "frightened" | "eaten";

interface Ghost extends MovingEntity {
  spawnCol: number;
  spawnRow: number;
  state: GhostState;
  respawnTimer: number;
}

interface Player extends MovingEntity {
  queuedDirection: Direction;
}

export interface EntityView {
  readonly x: number;
  readonly y: number;
  readonly direction: Direction;
}

export interface GhostView extends EntityView {
  readonly state: GhostState;
}

export interface CellView {
  readonly wall: boolean;
  readonly hasPellet: boolean;
  readonly hasPower: boolean;
}

export interface MazeSnapshot {
  readonly grid: readonly (readonly CellView[])[];
  readonly player: EntityView;
  readonly playerInvulnerable: boolean;
  readonly ghosts: readonly GhostView[];
  readonly frightenedSecondsLeft: number;
  readonly score: number;
  readonly lives: number;
  readonly level: number;
  readonly levelClearActive: boolean;
  readonly finished: boolean;
}

type Phase = "playing" | "levelClear";

export const INITIAL_LIVES = 3;

export class MazeEngine {
  private grid: Cell[][];
  private totalPellets: number;
  private remainingPellets: number;

  private player: Player;
  private ghosts: Ghost[];

  private invulnSecondsLeft = 0;
  private frightenedSecondsLeft = 0;

  private score = 0;
  private lives = INITIAL_LIVES;
  private level = 1;
  private phase: Phase = "playing";
  private levelClearFlashSecondsLeft = 0;
  private finished = false;

  constructor() {
    this.grid = buildMaze();
    populatePellets(this.grid);
    this.totalPellets = countPellets(this.grid);
    this.remainingPellets = this.totalPellets;

    this.player = {
      col: PLAYER_SPAWN.col,
      row: PLAYER_SPAWN.row,
      prevCol: PLAYER_SPAWN.col,
      prevRow: PLAYER_SPAWN.row,
      moveTimer: playerTickSeconds(1),
      direction: "right",
      queuedDirection: "right",
    };

    this.ghosts = GHOST_SPAWNS.map((spawn) => ({
      col: spawn.col,
      row: spawn.row,
      prevCol: spawn.col,
      prevRow: spawn.row,
      moveTimer: ghostTickSeconds(1),
      direction: "up",
      spawnCol: spawn.col,
      spawnRow: spawn.row,
      state: "chase",
      respawnTimer: 0,
    }));
  }

  /** Buffered like a classic maze game: queues the turn, applied the moment it's legal (immediately if already at that intersection, otherwise as soon as the player reaches one) rather than requiring a precisely-timed keypress. */
  setDirection(direction: Direction): void {
    this.player.queuedDirection = direction;
  }

  /**
   * Advances the simulation. Returns true when the score, lives, or
   * level-clear banner changed — drawing happens unconditionally every
   * frame regardless (same contract as Invaders/Runner/Snake).
   */
  step(deltaSeconds: number): boolean {
    if (this.finished) return false;

    if (this.phase === "levelClear") {
      this.levelClearFlashSecondsLeft -= deltaSeconds;
      if (this.levelClearFlashSecondsLeft > 0) return false;
      this.levelClearFlashSecondsLeft = 0;
      this.level += 1;
      this.startLevel();
      this.phase = "playing";
      return true;
    }

    if (this.invulnSecondsLeft > 0) this.invulnSecondsLeft = Math.max(0, this.invulnSecondsLeft - deltaSeconds);
    if (this.frightenedSecondsLeft > 0) {
      this.frightenedSecondsLeft = Math.max(0, this.frightenedSecondsLeft - deltaSeconds);
      if (this.frightenedSecondsLeft === 0) {
        for (const ghost of this.ghosts) if (ghost.state === "frightened") ghost.state = "chase";
      }
    }

    let hudChanged = this.advancePlayer(deltaSeconds);
    for (const ghost of this.ghosts) this.advanceGhost(ghost, deltaSeconds);
    if (this.resolveCollisions()) hudChanged = true;
    if (this.finished) return true;

    if (this.remainingPellets === 0) {
      this.score += LEVEL_CLEAR_BONUS_PER_LEVEL * this.level;
      this.phase = "levelClear";
      this.levelClearFlashSecondsLeft = LEVEL_CLEAR_FLASH_SECONDS;
      hudChanged = true;
    }

    return hudChanged;
  }

  /** Returns true if a pellet/power pellet was eaten (score changed). */
  private advancePlayer(deltaSeconds: number): boolean {
    const player = this.player;
    player.moveTimer -= deltaSeconds;
    if (player.moveTimer > 0) return false;
    player.moveTimer += playerTickSeconds(this.level);

    const queuedDelta = DELTAS[player.queuedDirection];
    if (isWalkable(this.grid, player.col + queuedDelta.dx, player.row + queuedDelta.dy)) {
      player.direction = player.queuedDirection;
    }

    const { dx, dy } = DELTAS[player.direction];
    const nextCol = player.col + dx;
    const nextRow = player.row + dy;
    if (!isWalkable(this.grid, nextCol, nextRow)) return false;

    player.prevCol = player.col;
    player.prevRow = player.row;
    player.col = nextCol;
    player.row = nextRow;

    const cell = getCell(this.grid, nextCol, nextRow);
    if (!cell) return false;

    if (cell.hasPellet) {
      cell.hasPellet = false;
      this.remainingPellets -= 1;
      this.score += PELLET_POINTS;
      return true;
    }
    if (cell.hasPower) {
      cell.hasPower = false;
      this.remainingPellets -= 1;
      this.score += POWER_PELLET_POINTS;
      this.frightenedSecondsLeft = FRIGHTENED_DURATION_S;
      for (const ghost of this.ghosts) if (ghost.state !== "eaten") ghost.state = "frightened";
      return true;
    }
    return false;
  }

  private advanceGhost(ghost: Ghost, deltaSeconds: number): void {
    if (ghost.state === "eaten") {
      ghost.respawnTimer -= deltaSeconds;
      if (ghost.respawnTimer <= 0) {
        ghost.col = ghost.spawnCol;
        ghost.row = ghost.spawnRow;
        ghost.prevCol = ghost.col;
        ghost.prevRow = ghost.row;
        ghost.state = "chase";
        ghost.moveTimer = ghostTickSeconds(this.level);
      }
      return;
    }

    ghost.moveTimer -= deltaSeconds;
    if (ghost.moveTimer > 0) return;
    ghost.moveTimer +=
      ghost.state === "frightened" ? frightenedGhostTickSeconds(this.level) : ghostTickSeconds(this.level);

    const allDirections: Direction[] = ["up", "down", "left", "right"];
    const legal = allDirections.filter((dir) => {
      const { dx, dy } = DELTAS[dir];
      return isWalkable(this.grid, ghost.col + dx, ghost.row + dy);
    });
    if (legal.length === 0) return; // unreachable in a fully-connected maze, but never trust that blindly

    // Forbid an immediate reversal unless it's the only legal move (a
    // dead end) — without this, ghosts jitter back and forth in place
    // instead of committing to a corridor.
    const nonReversing = legal.filter((dir) => dir !== OPPOSITE[ghost.direction]);
    const pool = nonReversing.length > 0 ? nonReversing : legal;

    const distanceAfter = (dir: Direction): number => {
      const { dx, dy } = DELTAS[dir];
      return Math.abs(this.player.col - (ghost.col + dx)) + Math.abs(this.player.row - (ghost.row + dy));
    };

    let chosen: Direction | undefined;
    if (ghost.state === "frightened") {
      chosen = Math.random() < FLEE_BIAS ? maxBy(pool, distanceAfter) : pickRandom(pool);
    } else {
      chosen = Math.random() < CHASE_BIAS ? minBy(pool, distanceAfter) : pickRandom(pool);
    }
    if (!chosen) return;

    ghost.direction = chosen;
    ghost.prevCol = ghost.col;
    ghost.prevRow = ghost.row;
    ghost.col += DELTAS[chosen].dx;
    ghost.row += DELTAS[chosen].dy;
  }

  /** Cell-equality collision — appropriate for a grid game (both entities occupy exactly one cell at a time), not an AABB check. Passing "through" each other mid-tick without landing on the same cell is a known, accepted simplification. */
  private resolveCollisions(): boolean {
    let changed = false;

    for (const ghost of this.ghosts) {
      if (ghost.state === "eaten") continue;
      if (ghost.col !== this.player.col || ghost.row !== this.player.row) continue;

      if (ghost.state === "frightened") {
        this.score += GHOST_EAT_POINTS;
        ghost.state = "eaten";
        ghost.respawnTimer = GHOST_RESPAWN_DELAY_S;
        changed = true;
      } else if (this.invulnSecondsLeft <= 0) {
        this.lives -= 1;
        changed = true;
        if (this.lives <= 0) {
          this.finished = true;
        } else {
          this.resetPositions();
          this.invulnSecondsLeft = RESPAWN_INVULN_S;
        }
      }
    }

    return changed;
  }

  private resetPositions(): void {
    Object.assign(this.player, {
      col: PLAYER_SPAWN.col,
      row: PLAYER_SPAWN.row,
      prevCol: PLAYER_SPAWN.col,
      prevRow: PLAYER_SPAWN.row,
      direction: "right",
      queuedDirection: "right",
      moveTimer: playerTickSeconds(this.level),
    });
    for (const ghost of this.ghosts) {
      Object.assign(ghost, {
        col: ghost.spawnCol,
        row: ghost.spawnRow,
        prevCol: ghost.spawnCol,
        prevRow: ghost.spawnRow,
        state: "chase" as GhostState,
        respawnTimer: 0,
        moveTimer: ghostTickSeconds(this.level),
      });
    }
  }

  private startLevel(): void {
    populatePellets(this.grid);
    this.remainingPellets = this.totalPellets;
    this.resetPositions();
  }

  snapshot(): MazeSnapshot {
    const toView = (entity: MovingEntity, t: number): EntityView => ({
      x: (entity.prevCol + (entity.col - entity.prevCol) * t) * CELL,
      y: (entity.prevRow + (entity.row - entity.prevRow) * t) * CELL,
      direction: entity.direction,
    });

    const playerT = clamp01(1 - this.player.moveTimer / playerTickSeconds(this.level));

    return {
      grid: this.grid.map((row) => row.map((cell) => ({ wall: cell.wall, hasPellet: cell.hasPellet, hasPower: cell.hasPower }))),
      player: toView(this.player, playerT),
      playerInvulnerable: this.invulnSecondsLeft > 0,
      ghosts: this.ghosts.map((ghost) => {
        const interval = ghost.state === "frightened" ? frightenedGhostTickSeconds(this.level) : ghostTickSeconds(this.level);
        const t = clamp01(1 - ghost.moveTimer / interval);
        return { ...toView(ghost, t), state: ghost.state };
      }),
      frightenedSecondsLeft: this.frightenedSecondsLeft,
      score: this.score,
      lives: this.lives,
      level: this.level,
      levelClearActive: this.phase === "levelClear",
      finished: this.finished,
    };
  }
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function minBy<T>(items: readonly T[], score: (item: T) => number): T | undefined {
  let best: T | undefined;
  let bestScore = Infinity;
  for (const item of items) {
    const s = score(item);
    if (s < bestScore) {
      bestScore = s;
      best = item;
    }
  }
  return best;
}

function maxBy<T>(items: readonly T[], score: (item: T) => number): T | undefined {
  let best: T | undefined;
  let bestScore = -Infinity;
  for (const item of items) {
    const s = score(item);
    if (s > bestScore) {
      bestScore = s;
      best = item;
    }
  }
  return best;
}
