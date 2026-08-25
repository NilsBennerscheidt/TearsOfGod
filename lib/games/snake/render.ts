import { CELL, LOGICAL_HEIGHT, LOGICAL_WIDTH, type SnakeSnapshot } from "./engine";

export interface SnakeSprites {
  head: HTMLCanvasElement | null;
  food: HTMLCanvasElement | null;
  foodRare: HTMLCanvasElement | null;
  colors: {
    gold: string;
    bloodText: string;
    ash: string;
  };
}

const FOOD_RADIUS = CELL * 0.32;

/** Rotation, in radians, that points the head sprite the way it's travelling. The mask itself has no inherent "facing" (it's a front-on emblem, not a side profile) — the tilt still reads as direction of travel, the same convention top-down arcade games use for a symmetric icon. */
const DIRECTION_ANGLE: Record<SnakeSnapshot["direction"], number> = {
  right: 0,
  down: Math.PI / 2,
  left: Math.PI,
  up: -Math.PI / 2,
};

/**
 * Paints one frame. Only the head is the mask sprite — at a 15px cell,
 * repeating a full mask silhouette for every body segment reads as
 * clutter rather than a snake; a plain rounded square per segment is
 * more legible at this scale and still visually distinct from the food
 * (drawn as small mask sprites, since at food-dot size a silhouette
 * blob reads fine and "the mask snake eats little masks" is a nice
 * thread back to the mascot).
 */
export function drawSnake(ctx: CanvasRenderingContext2D, snapshot: SnakeSnapshot, sprites: SnakeSprites): void {
  ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  if (snapshot.food) {
    const sprite = snapshot.food.variant === "blood" ? sprites.foodRare : sprites.food;
    const cx = snapshot.food.col * CELL + CELL / 2;
    const cy = snapshot.food.row * CELL + CELL / 2;
    if (sprite) {
      ctx.drawImage(sprite, cx - FOOD_RADIUS, cy - FOOD_RADIUS, FOOD_RADIUS * 2, FOOD_RADIUS * 2);
    } else {
      ctx.fillStyle = snapshot.food.variant === "blood" ? sprites.colors.bloodText : sprites.colors.gold;
      ctx.beginPath();
      ctx.arc(cx, cy, FOOD_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = sprites.colors.gold;
  const pad = 1.5;
  for (let i = snapshot.segments.length - 1; i >= 1; i--) {
    const segment = snapshot.segments[i];
    if (!segment) continue;
    ctx.globalAlpha = 0.85;
    roundedRect(ctx, segment.x + pad, segment.y + pad, CELL - pad * 2, CELL - pad * 2, 3);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const head = snapshot.segments[0];
  if (head) {
    const size = CELL - pad * 2;
    if (sprites.head) {
      ctx.save();
      ctx.translate(head.x + CELL / 2, head.y + CELL / 2);
      ctx.rotate(DIRECTION_ANGLE[snapshot.direction]);
      ctx.drawImage(sprites.head, -size / 2, -size / 2, size, size);
      ctx.restore();
    } else {
      ctx.fillStyle = sprites.colors.gold;
      roundedRect(ctx, head.x + pad, head.y + pad, size, size, 3);
      ctx.fill();
    }
  }
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
