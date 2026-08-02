Drop band photos here:

  - group.jpg               → set band.groupPhoto in content/band.ts to "/band/group.jpg"
  - murk.jpg, danji.jpg, nils.jpg, lars.jpg, gary.jpg
                             → set the matching member's `photo` field in
                               content/band.ts to "/band/<name>.jpg"

Until a member's `photo` is set, the /band page falls back to a labeled
PhotoPlaceholder automatically — no code changes needed beyond content/band.ts.
Portraits look best around a 3:4 aspect ratio (matches the existing
MemberGrid strip on the homepage); the group photo is used at 16:9.
