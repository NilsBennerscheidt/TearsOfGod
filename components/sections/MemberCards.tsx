import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { PhotoPlaceholder } from "@/components/brand/PhotoPlaceholder";
import { members } from "@/content/band";

/**
 * Full-portrait version of the landing page's MemberGrid strip — name,
 * translated role, and a short per-member bio. Falls back to
 * PhotoPlaceholder when a member has no `photo` set in content/band.ts.
 */
export async function MemberCards() {
  const t = await getTranslations("Band");

  return (
    <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
      {members.map((member) => (
        <li key={member.key}>
          <div className="tog-gold-glow-box border border-gold-deep">
            {member.photo ? (
              <Image
                src={member.photo}
                alt={member.displayName}
                width={480}
                height={640}
                className="aspect-3/4 w-full object-cover"
              />
            ) : (
              <PhotoPlaceholder label={member.displayName.toUpperCase()} aspect="3 / 4" />
            )}
          </div>
          <p className="font-display mt-2 text-lg text-gold uppercase">{member.displayName}</p>
          <p className="text-meta font-mono text-steel-text uppercase">{t(`roles.${member.role}`)}</p>
          <p className="text-body mt-1 text-bone/85">{t(`members.${member.key}.bio`)}</p>
        </li>
      ))}
    </ul>
  );
}
