import { socials } from "@/content/social";

/**
 * Tile-style presentation of the socials list — larger and grid-laid-out,
 * for the /media page where each platform earns real visual weight.
 * SocialLinks (footer) renders the same list as a compact inline row;
 * both read content/social.ts directly rather than each keeping its own
 * copy of the URLs.
 */
export function SocialGrid() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
      {socials.map((social) => (
        <li key={social.id}>
          <a
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            className="tog-gold-glow-box flex min-h-20 items-center justify-center border border-gold-deep px-4 py-6 text-center font-display text-sm tracking-wide text-bone uppercase hover:text-gold"
          >
            {social.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
