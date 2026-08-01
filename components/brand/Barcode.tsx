import { seededRandom } from "@/lib/seededRandom";

interface BarcodeProps {
  /** Same seed → same bars, every render, server or client. Required — this is what fixes the original's Math.random() hydration mismatch. */
  seed: string;
  width?: number;
  height?: number;
  color?: string;
  code?: string;
}

/** Decorative fake barcode (not scannable data). */
export function Barcode({
  seed,
  width = 120,
  height = 32,
  color = "currentColor",
  code = "4 4575 0051549 7",
}: BarcodeProps) {
  const rand = seededRandom(seed);
  const widths = Array.from({ length: 40 }, () => 1 + Math.floor(rand() * 3));
  const { items: bars } = widths.reduce(
    (acc, width, i) => {
      acc.items.push({ key: i, x: acc.x, width });
      acc.x += width + 1;
      return acc;
    },
    { items: [] as { key: number; x: number; width: number }[], x: 2 },
  );

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      style={{ display: "block" }}
      aria-hidden="true"
    >
      {bars.map((bar) => (
        <rect key={bar.key} x={bar.x} y={0} width={bar.width} height={height - 8} fill={color} />
      ))}
      <text x="2" y={height - 1} fontFamily="'JetBrains Mono', monospace" fontSize="6" fill={color}>
        {code}
      </text>
    </svg>
  );
}
