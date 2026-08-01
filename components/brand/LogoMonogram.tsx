import { MaskGlyph } from "./MaskGlyph";

interface LogoMonogramProps {
  size?: number;
  bg?: string;
  fg?: string;
  shiny?: boolean;
  /** Accessible name. Omit when decorative — see MaskEmblem. */
  title?: string;
  className?: string;
}

/** The mask glyph inside a bordered disc — avatar/favicon/pick use. */
export function LogoMonogram({
  size = 80,
  bg = "var(--color-pitch)",
  fg = "var(--color-bone)",
  shiny = false,
  title,
  className,
}: LogoMonogramProps) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${fg}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}
    >
      <div style={{ width: "92%", height: "92%" }}>
        <MaskGlyph color={fg} shiny={shiny} />
      </div>
    </div>
  );
}
