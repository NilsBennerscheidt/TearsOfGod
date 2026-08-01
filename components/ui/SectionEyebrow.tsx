/** The "01 · DIE BAND" pattern — an index number and a label, used at the top of nearly every section. */
export function SectionEyebrow({ children }: { children: string }) {
  return <p className="text-meta text-gold font-mono tracking-widest uppercase">{children}</p>;
}
