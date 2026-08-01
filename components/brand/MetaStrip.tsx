interface MetaStripProps {
  left: React.ReactNode;
  right: React.ReactNode;
  color?: string;
  /** In px. Defaults to 12 — the plan's accessibility floor for meta text; the mockup's own default (9px) is legible neither at scale nor tracked this wide. */
  size?: number;
}

/** The mono coordinate/filename strip used across nearly every artboard. */
export function MetaStrip({ left, right, color = "var(--color-steel-text)", size = 12 }: MetaStripProps) {
  return (
    <div
      className="flex justify-between font-mono tracking-[0.08em] uppercase"
      style={{ fontSize: size, color }}
    >
      <span>{left}</span>
      <span>{right}</span>
    </div>
  );
}
