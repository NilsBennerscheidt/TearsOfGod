import type { ShowStatus } from "@/lib/schemas/show";
import { cn } from "@/lib/cn";

interface TicketStatusProps {
  status: ShowStatus;
  /** Translated status word ("Verfügbar" / "Available" / etc.) — the status is conveyed by this text, not by color alone. */
  label: string;
  /** External ticket link. Omitted (or sold-out) renders a non-interactive badge instead. */
  href?: string;
}

export function TicketStatus({ status, label, href }: TicketStatusProps) {
  if (status === "sold-out") {
    return <span className="text-meta text-steel-text font-mono uppercase line-through">{label}</span>;
  }

  const badgeClasses = cn(
    "text-meta font-display inline-block px-2 py-1 uppercase",
    status === "few-left" ? "bg-blood text-bone" : "bg-gold text-pitch",
  );

  if (!href) {
    return <span className={badgeClasses}>{label}</span>;
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cn(badgeClasses, "hover:opacity-90")}>
      {label} →
    </a>
  );
}
