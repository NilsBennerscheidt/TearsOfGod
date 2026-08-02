# Stage 3 — Mobile header, media gallery, news detail, local admin

Four independent workstreams. Phases 1–3 ship the public site; Phase 4 is a
dev-only tool that depends on the `content/media.json` migration in Phase 2.

Decisions already taken (from the kickoff questions):

- Content stays file-based; the admin writes real files in `content/` and
  `public/media/`, so every edit is a reviewable git diff.
- `content/media.ts` becomes `content/media.json` + a Zod schema, because an
  editor cannot safely rewrite hand-authored TypeScript.
- News detail gets all four additions: cover image, in-post gallery, tags +
  share + prev/next, and an embedded media block.

---

## Phase 1 — Mobile header & menu

### 1.1 Centre the logo, move the menu button right

`components/layout/Header.tsx` is a `flex justify-between` row with three
visible children on mobile (toggle, wordmark, locale switcher). Under
`justify-between` the wordmark is only centred when the two outer items happen
to be the same width — they aren't (`MENÜ` vs `DE|EN`).

Switch the bar to a 3-column grid on mobile and keep flex from `md` up:

```
<header className="… grid grid-cols-[1fr_auto_1fr] items-center gap-4 md:flex md:justify-between">
```

with explicit column placement on the mobile-visible children:

| Child | Mobile | Desktop |
| --- | --- | --- |
| `MobileNavToggle` wrapper | `col-start-3 justify-self-end` | `md:hidden` |
| `Link > Wordmark` | `col-start-2 justify-self-center` | `md:col-auto md:justify-self-auto` |
| Locale/meta cluster | `col-start-1 justify-self-start` | `md:col-auto` |
| `SiteNav` | `hidden` | `md:block` |

`1fr_auto_1fr` makes the centre cell geometrically centred regardless of the
side widths, and `display:none` children are skipped by grid placement, so
`SiteNav` costs no cell on mobile. Explicit `col-start-*` (rather than DOM
order) keeps the desktop flex order intact with one DOM tree — no duplicated
`Wordmark`, which would otherwise mean two links with the same accessible name.

The header stays `relative`, so `MobileNavToggle`'s `absolute top-full` panel
and scrim are unaffected.

**Files:** `components/layout/Header.tsx`, `components/layout/MobileNavToggle.tsx`
(root `div` gains the column classes).

### 1.2 Small spin-on-click logo in the mobile header

`SpinnableTearHalo` already exists and is currently only used in `Hero` behind
`hidden sm:block` — i.e. never visible on the phones this is about. Place it in
the mobile header's left cell, next to (or replacing) the `44575 · DE` meta
string, at ~34px:

```tsx
<SpinnableTearHalo size={34} strokeW={2.4} className="md:hidden" />
```

`strokeW` is raised from the default 1.4 because of the ray anti-aliasing note
in `TearHalo` — at 34px a 1.4 stroke in a 160-unit viewBox is sub-pixel and the
32 ticks mush into a grey ring. Verify on a real device; if the ticks still
read as noise at that size, swap to `MaskEmblem ring` inside the same
`tog-mask-spin-btn` wrapper rather than shrinking the halo further.

It stays decorative (`SpinnableTearHalo` already sets `aria-hidden` +
`tabIndex={-1}` when no `title` is passed), so it adds nothing to the tab order
between the locale switcher and the menu button.

**Open, one line either way:** the Hero's `SpinnableTearHalo` is still hidden
below `sm`. Dropping `hidden sm:block` there would show it on mobile too. Not
included by default — with a header instance present, two on one screen is
probably one too many.

### 1.3 Remove the mobile menu's close button

Delete the `<div className="flex justify-end">…</div>` block from
`MobileNavToggle`. Three consequences to handle rather than ignore:

1. **The doc comment on lines 20–24 explicitly justifies that button** ("A
   dedicated close button in the panel now owns that job explicitly"). It must
   be rewritten, not left to contradict the code.
2. **The affordance it replaced comes back.** The toggle's label flips
   `Menu` ↔ `Close` while open, using the existing `Nav.close` message key —
   no new translations. `aria-expanded` already carries this for assistive
   tech; this is the visual half.
3. **The focus trap's first stop changes** from the close button to the first
   nav link. That's the better landing spot anyway; no code change needed, the
   `FOCUSABLE_SELECTOR` query handles it.

Esc, backdrop click, and route-change auto-close all stay.

**Verify:** open the panel, Tab to the last link, Tab again → wraps to the
first link (not out of the panel); Esc closes and returns focus to the toggle.

---

## Phase 2 — Media page

### 2.1 Migrate `content/media.ts` → `content/media.json`

Prerequisite for the admin (Phase 4), useful on its own (adding a photo stops
being a code edit).

- New `lib/schemas/media.ts` — `mediaPhotoSchema`, `mediaVideoSchema`,
  `mediaFileSchema` (`{ photos: [...], videos: [...] }`), mirroring the
  existing `post.ts` / `show.ts` style. `src` constrained to
  `^/media/(photos|videos)/`; `width`/`height` positive ints.
- New `lib/content/media.ts` — `getMedia()` reads and parses the JSON, wrapped
  in React `cache()`, throwing the same `formatZodError` message shape as
  `getPosts()` so a bad file fails loudly at render, not silently.
- `content/media.json` — the current ten photo entries, verbatim.
- Delete `content/media.ts`; update the two type-only imports in
  `PhotoGrid.tsx` and `VideoGrid.tsx` to `@/types/content`, and the value
  import in `app/[locale]/media/page.tsx` to `await getMedia()`.
- Add `MediaPhoto` / `MediaVideo` to `types/content.ts` next to `Post`/`Show`,
  so the type surface matches the other content types.

### 2.2 Brand loader — spin → bounce → settle → spin

A new looping variant of the existing mark, distinct from
`LoadingSpinner`'s current constant `fast` spin.

CSS in `app/globals.css`, one keyframe on a wrapper (the whole mark moves, as
with `tog-mask-spin`), ~3.2s cycle:

| Segment | Frames | Motion |
| --- | --- | --- |
| Spin | 0 → 22% | `rotate(0 → 360deg)` |
| Bounce | 22 → 58% | 3 decaying `translateY` hops (−18%, −9%, −4%) with a slight `scaleY` squash at each landing |
| Rest | 58 → 100% | static — the pause that makes the next spin read as a new cycle |

`LoadingSpinner` gains `variant?: "fast" | "cycle"` (default `"fast"`, so the
kitchen-sink swatches and `LoadingWrapper` are untouched). `"cycle"` applies
`.tog-loader-cycle` to the wrapper and drops `fast` on the inner `TearHalo` —
ambient ring speed underneath the cycle, otherwise two competing rotations.

**Reduced motion:** follow the precedent already set for
`.tog-halo-*-fast` — this is a progress indicator, so `prefers-reduced-motion`
swaps to `tog-spinner-pulse`, it does **not** go static. A frozen loader
misreports "still loading" as "done".

### 2.3 Per-image loader

`PhotoGrid` is a Server Component today. Extract each tile into a new client
`components/sections/PhotoTile.tsx`:

- Renders the `next/image` plus an absolutely positioned
  `<LoadingSpinner variant="cycle" />` overlay while `loaded === false`.
- Sets `loaded` from `onLoad`, **and** checks `imgRef.current?.complete` in a
  mount effect — a cached image can finish decoding before hydration attaches
  the handler, which would otherwise leave the spinner up forever.
- Overlay is `aria-hidden`; the tile's accessible name is the image `alt`.

**Perf fix while in here:** the grid tiles pass `width={8192}` with no `sizes`,
so `next/image` generates a srcset weighted for a full-width 8K image on a
tile that renders at ~180px. Add
`sizes="(min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"` and
`placeholder` left off (the loader is the placeholder).

Video posters get the same treatment via a small `VideoTile` sibling; the
`<video>` element keeps `preload="metadata"`.

### 2.4 Lightbox

New client `components/sections/PhotoLightbox.tsx`, with `PhotoGrid` becoming
a thin client wrapper that owns `openIndex: number | null`.

- Tiles stay real `<a href={photo.src}>` links; the click handler
  `preventDefault()`s and opens the overlay, so the page still works without
  JS and cmd/ctrl-click still opens the file directly (bail out of
  `preventDefault` when `e.metaKey || e.ctrlKey || e.shiftKey`).
- Overlay: full-viewport `fixed inset-0 bg-pitch/95`, the image at
  `object-contain`, caption (alt) + credit + `3 / 10` counter, prev/next
  controls, close button.
- Keyboard: `Esc` closes, `←`/`→` navigate, `Tab` cycles inside the dialog.
  Reuse the focus-trap shape from `MobileNavToggle` — same
  `FOCUSABLE_SELECTOR` constant, lifted into `lib/focus-trap.ts` so there's
  one implementation, not two drifting ones.
- `role="dialog" aria-modal="true"`, body scroll lock, focus restored to the
  originating tile on close.
- The large image renders through `next/image` with
  `sizes="100vw"` — **not** a bare `<img src>`. The originals are 8192px /
  multi-MB; served raw they'd make the lightbox slower than the page it opened
  from. Show `<LoadingSpinner variant="cycle" />` until the full image loads.
- Swipe left/right on touch (`pointerdown`/`pointerup` delta, ~50px
  threshold) — no library.

**New message keys** (`Media.*`, both `de.json` and `en.json`):
`lightboxClose`, `lightboxPrev`, `lightboxNext`, `lightboxCounter`
(`"{current} / {total}"`), `loading`.

---

## Phase 3 — News detail page

All four additions. Frontmatter grows; `lib/schemas/post.ts` is the gate.

### 3.1 Schema

```ts
cover:   { src, alt, width, height, credit? }   // optional
gallery: [ { src, alt, width, height, credit? } ]  // optional, default []
embed:   { kind: "video" | "spotify", … }        // optional
```

`cover`/`gallery` entries reuse `mediaPhotoSchema` from Phase 2.1 rather than
redeclaring the shape. `embed` is a discriminated union:

- `{ kind: "video", src, poster, width, height, title }` — self-hosted, same
  reasoning as `VideoGrid`'s doc comment.
- `{ kind: "spotify", url }` — rendered as a **link/CTA, not an iframe**. An
  embedded Spotify player loads third-party trackers on render, which would
  make the current Datenschutz text inaccurate and require a consent gate.
  This is the same call `VideoGrid` already documents; keep it consistent or
  the privacy page needs rewriting.

### 3.2 Detail page (`app/[locale]/news/[slug]/page.tsx`)

Order: back link → cover → date → title → tags → body → embed → gallery →
share → prev/next → footer.

- **Cover:** `next/image`, `sizes="(min-width: 768px) 42rem, 100vw"`, above the
  date. Credit line under it when present.
- **Tags:** the same `#tag` list `PostCard` renders; extract
  `components/sections/TagList.tsx` so both use one component.
- **Embed:** `components/sections/PostEmbed.tsx`, switching on `kind`.
- **Gallery:** reuses `PhotoGrid` from Phase 2 as-is — same tiles, same
  loader, same lightbox. This is the payoff for building Phase 2 first.
- **Share:** `components/ui/ShareButton.tsx` (client). `navigator.share` when
  available (mobile), otherwise `navigator.clipboard.writeText` with a
  "Copied" state that resets after ~2s. Feature-detect both; render a plain
  copy button when neither exists.
- **Prev/next:** `getPosts(locale)` is already sorted newest-first and already
  `cache()`d, so the neighbours are an index lookup on the array the page has
  loaded — no extra IO. New `getPostNeighbours(locale, slug)` in
  `lib/content/posts.ts` returning `{ prev, next }`, both nullable.

### 3.3 Listing page

`PostCard` grows an optional thumbnail from `post.cover` (fixed aspect,
`sizes` set), and switches to `TagList`.

**New message keys** (`News.*`, both locales): `share`, `shareCopied`,
`prevPost`, `nextPost`, `galleryHeading`, `listenOn`.

---

## Phase 4 — Local-only management app

A dev-only Next route in this same app (not a separate project) that edits the
repo's content files directly. Runs at `http://localhost:3000/admin` under
`npm run dev`; refuses to exist in a production build.

### 4.1 Guards — three layers, all of them needed

1. `app/admin/layout.tsx` and every `app/api/admin/**/route.ts`:
   `if (process.env.NODE_ENV === "production") notFound()` — the precedent is
   already set by `app/[locale]/dev/kitchen-sink/page.tsx`.
2. Every write route additionally rejects non-loopback requests (check the
   request host is `localhost` / `127.0.0.1` / `[::1]`). Guard 1 alone means a
   `next dev` bound to `0.0.0.0` on a café network is an open file-writer.
3. Every path derived from user input goes through a `resolveContentPath()`
   helper: slug must match `^[a-z0-9]+(?:-[a-z0-9]+)*$`, then
   `path.resolve()` the result and assert it's still inside the expected
   content root. A slug like `../../../.ssh/authorized_keys` must fail closed,
   not merely be unlikely.

### 4.2 Routing

`app/admin/*` sits outside `[locale]` — it's a tool, not a localised page.
`middleware.ts`'s matcher currently catches it and next-intl would bounce
`/admin` to `/de/admin`, so the matcher's negative lookahead gains `admin`:

```
"/((?!api|trpc|_next|_vercel|admin|.*\\..*).*)"
```

`app/admin/layout.tsx` is its own minimal shell (no `Header`, no
`NextIntlClientProvider`, no `Grain`) — the admin is not the band site.

### 4.3 API surface

All `runtime = "nodejs"`, all validating with the **same Zod schemas the site
reads with**, before writing. That invariant is the point: the admin cannot
produce a file that breaks the build.

| Route | Method | Does |
| --- | --- | --- |
| `/api/admin/posts` | GET | list all posts, both locales, with a `missingTranslation` flag |
| `/api/admin/posts` | POST | create `content/posts/{locale}/{slug}.md` |
| `/api/admin/posts/[locale]/[slug]` | GET / PUT / DELETE | read / overwrite / remove |
| `/api/admin/shows` | GET / POST | list / create `content/shows/{date}-{slug}.md` |
| `/api/admin/shows/[slug]` | GET / PUT / DELETE | — |
| `/api/admin/media` | GET / PUT | read / write `content/media.json` |
| `/api/admin/upload` | POST | multipart → `public/media/photos/`, returns `{ src, width, height }` |
| `/api/admin/preview` | POST | markdown → HTML via the existing `renderMarkdown()` |

Markdown writes use `matter.stringify(body, frontmatter)` — `gray-matter` is
already a dependency and it round-trips the format `readMarkdownFile()`
already parses.

**Image dimensions with no new dependency:** a ~40-line
`lib/admin/image-size.ts` reading the PNG `IHDR` chunk and the JPEG `SOFn`
marker covers everything in `public/media/photos` today. Deliberately not
`image-size`/`sharp`: a devDependency imported from a route file breaks
`npm ci --omit=dev` production installs, and `sharp` is a native build for one
number per upload.

### 4.4 Screens

Plain forms, Tailwind, no new UI dependency.

- **`/admin`** — dashboard: counts per content type, a warning list (posts
  missing a translation, photos missing `alt`, shows with a past date and
  `available` status), and a link to each editor.
- **`/admin/media`** — drag-and-drop upload (multiple), then a table of
  photos: thumbnail, `alt`, `credit`, up/down reorder, delete. Delete removes
  the JSON entry and asks separately before unlinking the file from
  `public/`. Videos get the same table.
- **`/admin/news`** — locale tabs (`de` / `en`), list, and an editor:
  title / date / slug / excerpt / tags / cover / gallery / embed fields plus a
  body `<textarea>` with a live preview pane driven by `/api/admin/preview`.
  Cover and gallery pick from the media library rather than re-uploading.
  Creating a post in one locale offers to scaffold the other with the same
  slug (the schema treats a shared slug as the same post).
- **`/admin/shows`** — date/time, city, venue, optional bill name, status,
  ticket URL, advance/door price.

### 4.5 What this deliberately does not do

- **No auth.** Loopback-only + dev-only is the security model. Adding a
  password would imply it's safe to expose, which it isn't.
- **No git integration.** Edits land as working-tree changes; `git status` and
  the normal review/commit flow are the safety net, and that's better than a
  button that commits.
- **No production writes.** The site statically generates content pages, so a
  live edit would need a redeploy anyway. Edit locally → commit → deploy. This
  is stated in the admin UI itself so the flow isn't surprising.

---

## Sequencing & verification

| Phase | Depends on | Rough size |
| --- | --- | --- |
| 1 — mobile header/menu | — | small, self-contained |
| 2 — media json + loader + lightbox | — | medium |
| 3 — news detail | 2.1 (schema), 2.4 (lightbox) | medium |
| 4 — admin | 2.1 (`media.json`) | largest |

Phases 1 and 2 are independent and can land in either order. Phase 3 reuses
Phase 2's grid and lightbox wholesale, and Phase 4 needs `media.json` to
exist — so 2 → 3 → 4, with 1 dropped in wherever.

Per phase: `npm run typecheck`, `npm run lint`, `npm run build` (which is also
what catches a bad content file, since the schemas throw at render), plus a
manual pass at 375px width for Phase 1, keyboard-only for the lightbox and
mobile menu, and `prefers-reduced-motion` forced on for the loader.
