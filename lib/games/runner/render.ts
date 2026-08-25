import {
  GROUND_OBSTACLE_H,
  GROUND_OBSTACLE_W,
  GROUND_TICK_SPACING,
  GROUND_Y,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  OVERHEAD_BOTTOM_Y,
  OVERHEAD_OBSTACLE_H,
  OVERHEAD_OBSTACLE_W,
  PLAYER_DUCK_H,
  PLAYER_STAND_H,
  PLAYER_W,
  PLAYER_X,
  type RunnerSnapshot,
} from "./engine";

export interface RunnerSprites {
  player: HTMLCanvasElement | null;
  /** Resolved from app/globals.css's @theme tokens once at load time — see readCssColor in lib/games/sprites.ts. Used as fallback fills, and for the ground/obstacle strokes that never had a sprite to begin with. */
  colors: {
    gold: string;
    bloodText: string;
    bone: string;
    ash: string;
  };
}

/**
 * Paints one frame. No mask sprite for obstacles — unlike Whack's moles
 * and Invaders' formation, hazards here read better as plain stage
 * props (an amp-corner spike, a low light rig) than as more copies of
 * the band mask, so they're drawn as flat geometry in the danger color
 * instead of a third tinted sprite.
 */
export function drawRunner(ctx: CanvasRenderingContext2D, snapshot: RunnerSnapshot, sprites: RunnerSprites): void {
  ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  // Ground line + scrolling ticks, both driven by groundOffset — the
  // only "parallax" this game has. A single scrolling layer rather than
  // several depth-separated ones: there's no background art in the repo
  // to layer (see the mask-sprite gap noted on MaskGlyph), and inventing
  // sky/mountain art blind, with no way to preview it, isn't a trade
  // worth making for a minigame. The line alone reads as motion.
  ctx.strokeStyle = sprites.colors.ash;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y + 1);
  ctx.lineTo(LOGICAL_WIDTH, GROUND_Y + 1);
  ctx.stroke();

  ctx.fillStyle = sprites.colors.ash;
  for (let x = -snapshot.groundOffset; x < LOGICAL_WIDTH; x += GROUND_TICK_SPACING) {
    ctx.fillRect(x, GROUND_Y + 6, 8, 2);
  }

  for (const obstacle of snapshot.obstacles) {
    ctx.fillStyle = sprites.colors.bloodText;
    if (obstacle.kind === "ground") {
      // A spike — the shape itself telegraphs "jump over this", no
      // separate icon needed.
      ctx.beginPath();
      ctx.moveTo(obstacle.x, GROUND_Y);
      ctx.lineTo(obstacle.x + GROUND_OBSTACLE_W / 2, GROUND_Y - GROUND_OBSTACLE_H);
      ctx.lineTo(obstacle.x + GROUND_OBSTACLE_W, GROUND_Y);
      ctx.closePath();
      ctx.fill();
    } else {
      // A hanging light rig on a cable — reads as "duck under this".
      const top = OVERHEAD_BOTTOM_Y - OVERHEAD_OBSTACLE_H;
      const centerX = obstacle.x + OVERHEAD_OBSTACLE_W / 2;
      ctx.strokeStyle = sprites.colors.ash;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, top);
      ctx.stroke();
      ctx.fillRect(obstacle.x, top, OVERHEAD_OBSTACLE_W, OVERHEAD_OBSTACLE_H);
    }
  }

  const playerH = snapshot.isDucking ? PLAYER_DUCK_H : PLAYER_STAND_H;
  const playerTop = snapshot.playerY - playerH;
  if (sprites.player) {
    // Ducking draws the same sprite at a shorter destination height —
    // canvas scales the source freely, so this reads as a crouch
    // without needing a second sprite.
    ctx.drawImage(sprites.player, PLAYER_X, playerTop, PLAYER_W, playerH);
  } else {
    ctx.fillStyle = sprites.colors.gold;
    ctx.fillRect(PLAYER_X, playerTop, PLAYER_W, playerH);
  }
}
