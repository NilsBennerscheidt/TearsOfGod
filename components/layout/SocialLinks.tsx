import { socials } from "@/content/social";

interface SocialLinksProps {
  /** Translated accessible name for the nav landmark. */
  label: string;
}

export function SocialLinks({ label }: SocialLinksProps) {
  return (
    <nav aria-label={label}>
      <ul className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {socials.map((social) => (
          <li key={social.id}>
            <a
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              // min-h-11 keeps these at a comfortable tap size on mobile;
              // in a single row that costs no extra vertical space.
              className="text-meta text-steel-text hover:text-gold inline-flex min-h-11 items-center px-1 font-mono tracking-wide uppercase"
            >
              {social.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
