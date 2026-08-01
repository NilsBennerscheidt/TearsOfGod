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

  // The interactive variant gets a 44px minimum height (Apple HIG; well
  // clear of WCAG 2.2 SC 2.5.8's 24px floor) — this is the primary action
  // on the tour page, so it has to be comfortably tappable.
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(badgeClasses, "inline-flex min-h-11 items-center px-3 hover:opacity-90")}
    >
      {label} →
    </a>
  );
}
