import { getTranslations } from "next-intl/server";
import { PhotoPlaceholder } from "@/components/brand/PhotoPlaceholder";
import { members } from "@/content/band";

export async function MemberGrid() {
  const t = await getTranslations("Band");

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
      {members.map((member) => (
        <div key={member.displayName}>
          <div className="border border-gold-deep">
            <PhotoPlaceholder label={member.displayName} aspect="3 / 4" />
          </div>
          {member.roleKey && (
            <p className="text-meta mt-1 text-center font-mono text-gold-deep uppercase">{t(member.roleKey)}</p>
          )}
        </div>
      ))}
    </div>
  );
}
