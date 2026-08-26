import { CELL, LOGICAL_HEIGHT, LOGICAL_WIDTH, type Direction, type MazeSnapshot } from "./engine";

export interface MazeSprites {
  /** One tinted sprite per ghost, by index — engine has no notion of color, this is purely a rendering concern. */
  ghosts: readonly (HTMLCanvasElement | null)[];
  frightened: HTMLCanvasElement | null;
  player: HTMLCanvasElement | null;
  colors: {
    gold: string;
    bloodText: string;
    steelText: string;
    goldDeep: string;
    ash: string;
  };
}

/** Same convention as Snake's render.ts — the mask has no inherent facing, but rotating it toward the travel direction reads as motion. */
const DIRECTION_ANGLE: Record<Direction, number> = {
  right: 0,
  down: Math.PI / 2,
  left: Math.PI,
  up: -Math.PI / 2,
};

const PELLET_RADIUS = CELL * 0.09;
const POWER_PELLET_RADIUS = CELL * 0.22;

export function drawMaze(ctx: CanvasRenderingContext2D, snapshot: MazeSnapshot, sprites: MazeSprites): void {
  ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  ctx.fillStyle = sprites.colors.ash;
  snapshot.grid.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell.wall) ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
    });
  });

  ctx.fillStyle = sprites.colors.gold;
  const powerPulse = 1 + Math.sin(performance.now() / 200) * 0.15;
  snapshot.grid.forEach((row, r) => {
    row.forEach((cell, c) => {
      const cx = c * CELL + CELL / 2;
      const cy = r * CELL + CELL / 2;
      if (cell.hasPellet) {
        ctx.beginPath();
        ctx.arc(cx, cy, PELLET_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      } else if (cell.hasPower) {
        ctx.beginPath();
        ctx.arc(cx, cy, POWER_PELLET_RADIUS * powerPulse, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  });

  // Blink in the last ~1.5s of frightened mode as a "wearing off" warning
  // — the same idea as Invaders' invulnerability blink, applied to a
  // color swap instead of visibility.
  const frightenedBlinking = snapshot.frightenedSecondsLeft > 0 && snapshot.frightenedSecondsLeft < 1.5;
  const blinkOn = Math.floor(performance.now() / 180) % 2 === 0;

  snapshot.ghosts.forEach((ghost, i) => {
    if (ghost.state === "eaten") return;
    const isFrightened = ghost.state === "frightened" && !(frightenedBlinking && !blinkOn);
    const sprite = isFrightened ? sprites.frightened : sprites.ghosts[i] ?? null;
    const size = CELL - 2;
    if (sprite) {
      ctx.drawImage(sprite, ghost.x + 1, ghost.y + 1, size, size);
    } else {
      ctx.fillStyle = isFrightened ? sprites.colors.steelText : sprites.colors.bloodText;
      ctx.fillRect(ghost.x + 1, ghost.y + 1, size, size);
    }
  });

  const playerVisible = !snapshot.playerInvulnerable || Math.floor(performance.now() / 90) % 2 === 0;
  if (playerVisible) {
    const size = CELL - 2;
    if (sprites.player) {
      ctx.save();
      ctx.translate(snapshot.player.x + CELL / 2, snapshot.player.y + CELL / 2);
      ctx.rotate(DIRECTION_ANGLE[snapshot.player.direction]);
      ctx.drawImage(sprites.player, -size / 2, -size / 2, size, size);
      ctx.restore();
    } else {
      ctx.fillStyle = sprites.colors.gold;
      ctx.fillRect(snapshot.player.x + 1, snapshot.player.y + 1, size, size);
    }
  }
}
