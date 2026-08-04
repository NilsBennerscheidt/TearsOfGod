import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { PhotoPlaceholder } from "@/components/brand/PhotoPlaceholder";
import { members } from "@/content/band";

export async function MemberGrid() {
  const t = await getTranslations("Band");

  return (
    <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
      {members.map((member) => (
        <li key={member.key}>
          <div className="border border-gold-deep">
            {member.photo ? (
              <Image
                src={member.photo}
                alt={member.displayName}
                width={480}
                height={640}
                sizes="(min-width: 640px) 20vw, 50vw"
                className="aspect-3/4 w-full object-cover"
              />
            ) : (
              // Uppercased here rather than in the data, so the source keeps each member's name as they actually write it.
              <PhotoPlaceholder label={member.displayName.toUpperCase()} aspect="3 / 4" />
            )}
          </div>
          <p className="text-meta mt-1 text-center font-mono text-gold-deep uppercase">
            {t(`roles.${member.role}`)}
          </p>
        </li>
      ))}
    </ul>
  );
}
