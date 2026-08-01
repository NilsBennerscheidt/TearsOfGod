import type { ReactNode } from "react";

/** Narrow prose column, no hero — distinct from the marketing pages' layout. */
export default function LegalLayout({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-2xl px-6 py-12 md:py-16">{children}</div>;
}
