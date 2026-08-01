# Tears of God — Next.js Implementation Spec

Source: `Tears of God - CI-CD v2.html` (self-extracting bundle: React 18 + Babel standalone + 8 JSX modules + 2 PNGs + 13 woff2).

---

## 0. What the mockup actually is

- A **pan/zoom design canvas** (`DesignCanvas`), not a website. 15 artboards across 5 sections.
- Section `04 · Website` holds the only two web designs: `ABWebLanding` (820×980) and `ABWebTour` (820×760).
- The other 13 artboards are the **design system source of truth** (palette, type, logo system, runes, ornaments) plus print/merch/social collateral.
- Everything is **inline React style objects**. There is no stylesheet to port — only 3 injected CSS classes (`.tog-gold-foil`, `.tog-gold-text`, `.tog-gold-mask`) and 2 keyframes.

### Scaffolding to delete entirely
| Thing | Location | Why |
|---|---|---|
| `#tog-tweaks` panel | template `<body>` | Authoring-tool UI |
| `window.__TOG_TWEAKS`, `TWEAK_DEFAULTS` | template `<script>` | Authoring-tool state |
| `postMessage` edit-mode protocol | `App()` | Host-canvas integration |
| `DesignCanvas`, `DCViewport`, `DCSection`, `DCArtboard`, `DCEditable`, `DCFocusOverlay`, `DCPostIt` | `design-canvas.jsx` | Canvas chrome |
| `window.__resources` lookups | `tokens-primitives.jsx` | Replace with static imports |
| `waitForDeps` `setInterval` render gate | template | Module loading hack |

### Stack (specified)
- **TypeScript** — the content model (shows, members, releases, ticket statuses) is the main source of bugs here; a `ShowStatus` union is worth more than the setup cost.
- **Tailwind CSS v4** — CSS-first `@theme`. The `TOG` object is already a flat token map; it maps 1:1 to theme variables, and the arbitrary-value escape hatch covers the mockup's odd letter-spacings (`0.35em`) without fighting the system.
- **Vercel** — `next/image`, `next/font`, ISR, and `next/og` all work with zero config.
- No CMS in v1 (see §6).

---

## 1. Page & Route Inventory

Nav in both web artboards: `MUSIC · TOUR · BAND · CONTACT`. Only Tour is designed.

| Route | Source | Status |
|---|---|---|
| `/` | `ABWebLanding` | Designed |
| `/tour` | `ABWebTour` | Designed |
| `/music` | — | **Undesigned**, in nav |
| `/band` | — | **Undesigned**, in nav |
| `/contact` | — | **Undesigned**, in nav |
| `/impressum` | — | Legally required (§5 DDG, DE) |
| `/datenschutz` | — | Legally required (DSGVO) |
| `/merch` | merch artboards exist | Optional, out of v1 scope |

Undesigned pages must be composed from existing brand primitives — see §10 Q1.

### App Router structure
```
app/
  layout.tsx              # <html lang="de">, fonts, Header, Footer, Grain, skip-link
  page.tsx                # /
  tour/page.tsx
  music/page.tsx
  band/page.tsx
  contact/page.tsx
  (legal)/
    layout.tsx            # narrow prose column, bone-on-pitch, no hero
    impressum/page.tsx
    datenschutz/page.tsx
  not-found.tsx           # 404 in brand voice
  opengraph-image.tsx     # next/og, generated from brand tokens
  icon.tsx                # mask.png sigil → favicon (spec'd in ABLogoSystem: "USE · FAVICON")
  sitemap.ts
  robots.ts
```
- **One root layout.** Header/Footer are identical across both artboards (only the active nav underline differs) — no route groups needed for the shell.
- `(legal)` group exists only to swap the content container, not the shell.

---

## 2. Component Breakdown

Default is **Server Component**. Client is the exception and is listed explicitly.

### 2.1 Layout / shell (shared)
| Component | Props | Type | Notes |
|---|---|---|---|
| `Header` | — | Server | Reads pathname? No — pass active state down from `SiteNav` client child instead |
| `SiteNav` | `items: NavItem[]` | **Client** | Needs `usePathname()` for active state + mobile disclosure |
| `MobileNavToggle` | — | **Client** | Inside `SiteNav`; `useState` open/closed, focus trap, Esc |
| `Footer` | `variant?: 'landing' \| 'tour'` | Server | Landing: monogram + MetaStrip. Tour: creed + booking email |
| `PostcodeTag` | — | Server | `44575 · DE` — trivial, could inline |

### 2.2 Brand primitives (from `tokens-primitives.jsx`, `runes-gold.jsx`)
| Component | Props | Type | Notes |
|---|---|---|---|
| `Wordmark` | `color`, `width`, `shiny`, `as?` | Server | **Convert PNG mask → inline SVG.** Needs accessible name |
| `MaskEmblem` | `color`, `size`, `ring`, `shiny` | Server | Horned sigil, SVG |
| `LogoMonogram` | `size`, `bg`, `fg`, `shiny` | Server | Sigil in a disc |
| `TearHalo` | `size`, `color`, `strokeW` | Server | Pure SVG, 32 computed ray ticks — deterministic, safe |
| `Grain` | `opacity`, `blend` | Server | SVG `feTurbulence` data URI → move to a CSS custom property |
| `Halftone` | `size`, `color`, `opacity` | Server | `radial-gradient` |
| `RegMarks` / `RegCross` | `inset`, `len`, `color`, `weight` | Server | Corner crosshairs |
| `MetaStrip` | `left`, `right`, `color`, `size` | Server | The mono coordinate strip used everywhere |
| `Rune` / `RunicLine` / `RunicVertical` / `RunicBar` | `char`/`children`, `size`, `gold`, `stroke` | Server | 28-glyph path map; keep `RUNE_PATHS` in `lib/runes.ts` |
| `Ornament{Corner,Bottom,Crown,Side}` | `size`, `color`, `stroke` | Server | Pure SVG flourishes |
| `GoldText` / `GoldBar` | `children`, `as` | Server | CSS `background-clip:text` + shimmer keyframe |
| `RuneDot` | `size`, `color` | Server | Rotated square |
| `Stamp` | `children`, `rotate` | Server | Oxblood rubber stamp |
| `Barcode` | `seed: string`, `width`, `height` | Server | ⚠️ **currently `Math.random()` in `useMemo`** — will hydration-mismatch under SSR. Replace with a seeded PRNG or a static bar array |
| `PhotoPlaceholder` | `label`, `aspect`, `dark`, `rotate` | Server | Keep for dev; every real photo slot uses it today |
| `Tape` | `width`, `rotate`, position | Server | Zine tape strip |
| `FiveMark` | `color`, `size` | Server | `V · FÜNF` |

### 2.3 Landing (`/`)
| Component | Props | Type |
|---|---|---|
| `Hero` | `release: Release`, `image` | Server |
| `HeroWordmark` | `width` | Server |
| `ReleaseCallout` | `release` | Server — "NEW EP · OUT NOW" + `SALT AND SWEAT.` + CTAs |
| `CtaButton` | `href`, `variant: 'solid' \| 'outline'`, `children` | Server — must be `<a>`, currently a `<div>` |
| `Marquee` | `items: string[]`, `speed?` | Server — CSS keyframes only; duplicate the track for a seamless loop (mockup has a single non-animated span) |
| `BandBlurb` | `eyebrow`, `headline`, `body` | Server |
| `MemberGrid` | `members: Member[]` | Server |
| `MemberTile` | `member` | Server |
| `NextShowCard` | `show: Show` | Server — derived from show data, not hardcoded |
| `SectionEyebrow` | `index`, `label` | Server — the `01 · DIE BAND` pattern, used 2× on landing and reusable everywhere |

### 2.4 Tour (`/tour`)
| Component | Props | Type |
|---|---|---|
| `TourHeader` | `leg`, `title`, `count`, `range` | Server |
| `ShowTable` | `shows: Show[]` | Server — render as `<table>`, not a grid of divs |
| `ShowRow` | `show` | Server |
| `TicketStatus` | `status: ShowStatus`, `href?` | Server — ⚠️ must not rely on color alone |
| `TourCreedBar` | — | Server — `ALL AGES · NO NAZIS · NO EXCUSES` + booking email |

### 2.5 Undesigned pages (compose from primitives)
- `/music` — `ReleaseCard`, `TrackList`, `EmbedPlayer` (**Client**, lazy iframe façade for Spotify/Bandcamp/YouTube)
- `/band` — `MemberProfile`, `BandStory` (letterhead copy is a ready-made manifesto)
- `/contact` — `ContactForm` (**Client**, `useActionState` + Server Action), `BookingDetails`, `PressKitLinks`

### 2.6 Reusable vs one-off
- **Reusable (→ `components/brand/`, `components/ui/`):** everything in 2.2, plus `SectionEyebrow`, `CtaButton`, `MetaStrip`, `Marquee`, `TicketStatus`.
- **One-off (→ `components/sections/`):** `Hero`, `BandBlurb`, `NextShowCard`, `TourHeader`, `MemberGrid`.

**Client-component total: 4** (`SiteNav`, `MobileNavToggle`, `EmbedPlayer`, `ContactForm`). Everything else ships zero JS.

---

## 3. Styling Strategy

### 3.1 Approach
- Tailwind v4, CSS-first. No `tailwind.config.js`.
- `app/globals.css`:
  ```css
  @import "tailwindcss";

  @theme {
    --color-bone:      #f1ece0;
    --color-bone-dim:  #2a2620;
    --color-pitch:     #131210;   /* ground */
    --color-ink:       #0b0a08;   /* inset surface */
    --color-gold:      #d9b25a;   /* primary accent */
    --color-gold-hi:   #f5dc7e;
    --color-gold-deep: #8a5e1d;
    --color-blood:     #a8201a;   /* secondary, sparing */
    --color-blood-deep:#6b1410;
    --color-bruise:    #1a1614;
    --color-steel:     #7a7268;   /* caption — see contrast note */
    --color-ash:       #2d2824;

    --font-display: var(--font-oswald);
    --font-brutal:  var(--font-archivo);
    --font-mono:    var(--font-jetbrains);

    --tracking-meta:  0.2em;
    --tracking-wide:  0.25em;
    --tracking-widest:0.3em;
    --tracking-ultra: 0.35em;

    --spacing-gutter: 1.75rem;  /* the mockup's ubiquitous 28px */
  }
  ```
- Static classes for everything Tailwind covers; arbitrary values (`tracking-[0.35em]`) only for the handful of one-off letter-spacings.
- `clsx` + `tailwind-merge` for variant props.

### 3.2 Design tokens worth centralizing
- **Palette** — 6 named roles already documented in `ABColorType`: PITCH=ground, INK=surface, GOLD=primary, BLOOD=accent, STEEL=caption, BONE=highlight.
- **Three typographic voices** (explicitly specified in the mockup):
  - `AA · DISPLAY` — Oswald, condensed → titles, headlines
  - `BB · HEADLINE` — Archivo Black 900, all-caps, tight (`-0.03em`) → short and loud
  - `CC · CAPTION` — JetBrains Mono 400/700 → meta, data, coordinates
- **Grid: 8pt**, stated in the `ABColorType` meta strip. Tailwind's 4px scale is compatible.
- **Gold foil gradients** (`runes-gold.jsx`) → CSS custom properties `--gold-foil`, `--gold-foil-v`, `--gold-foil-soft`.
- **Grain** → `--grain-url` custom property + a `.grain` utility.

### 3.3 The scale problem (important)
The web artboards are drawn at **820px wide with absolute positioning and hardcoded px**. They are comps, not layouts. Every value needs remapping, not copying:

| Role | Artboard px @820 | Recommended fluid target |
|---|---|---|
| Tour H1 "No False Idols" | 88 | `clamp(3.5rem, 11vw, 9rem)` |
| Landing H2 "Five from the Ruhrpott." | 42 | `clamp(2rem, 5vw, 3.75rem)` |
| Next-show date | 44 | `clamp(2.5rem, 6vw, 4rem)` |
| Hero EP title | 28 | `clamp(1.75rem, 4vw, 3rem)` |
| Venue name | 20–24 | `clamp(1.125rem, 2vw, 1.5rem)` |
| Body copy | 11 | `0.9375rem` (15px) — **do not ship 11px body text** |
| Meta / eyebrow | 8–10 | `0.75rem` (12px) floor |
| Section gutter | 28 | `1.5rem` → `2.5rem` → `3.5rem` |

- Small type is the biggest hazard: 8–9px caption text at `letter-spacing: 0.2em` is unreadable at 1:1. Establish a **12px floor** for all meta text.
- Hero wordmark is `width: 620` on an 820 canvas = **76% of viewport width**. Preserve that ratio (`w-[76vw] max-w-[900px]`), don't port the px.

### 3.4 Breakpoints
None exist in the mockup. Proposed (Tailwind defaults):
- `< 640` — single column; nav → hamburger; member grid 5→2 cols or horizontal snap-scroll; tour table → stacked cards
- `640–1024` — landing body grid `1.3fr 1fr` collapses to stacked; tour table drops the `TAG` column
- `≥ 1024` — full artboard fidelity
- Content max-width `~1280px`, centered, with the artboard's proportional gutters

### 3.5 Animations
| Animation | Source | Port |
|---|---|---|
| `togShine` (gold shimmer) | `runes-gold.jsx` | CSS keyframe, 8–10s linear infinite |
| `togGoldFoil` SVG gradient `<animate>` | injected `<defs>` | Keep as inline SVG defs in root layout |
| Marquee scroll | not animated in mockup | New CSS keyframe, duplicated track |
- **All three must be wrapped in `@media (prefers-reduced-motion: reduce)`** and disabled. Currently unguarded.

---

## 4. Assets & Media

### Extracted from the bundle
| Asset | Size | Handling |
|---|---|---|
| `wordmark.png` (806×540) | **237 KB** | **Convert to SVG.** It's used as a CSS `mask-image` so it can be tinted — an SVG with `fill="currentColor"` does this natively, kills 237 KB, and scales cleanly at the 620px hero size. If no vector original exists, trace it. |
| `mask.png` (horned sigil) | 11.7 KB | Convert to SVG. Also becomes `app/icon.tsx` (favicon) |
| 13× woff2 | 6–31 KB ea. | Discard — replace with `next/font/google` |

### Fonts (`next/font/google`)
```ts
// app/fonts.ts
Archivo_Black  weight ['400']            subsets ['latin','latin-ext']
JetBrains_Mono weight ['400','700']      subsets ['latin','latin-ext']
Oswald         weight ['400','700']      subsets ['latin','latin-ext']
```
- The bundle ships cyrillic, cyrillic-ext, greek, and vietnamese subsets — **all unused**. `latin` + `latin-ext` covers `ä ö ü Ä Ö Ü ß` and `°`.
- The bundle declares Oswald 300/400/500/600/700; only 400 and 700 are actually used. Drop the other three.
- `display: 'swap'`, expose as CSS variables on `<html>`, wire into `@theme`.

### Imagery — none exists
Every image in the mockup is a `PhotoPlaceholder` (diagonal stripes + label). Real assets needed:
| Slot | Spec from mockup | Aspect |
|---|---|---|
| Hero | `LIVE · MOTION BLUR · B&W` | ~16:10, ≥2000px wide |
| Member portraits ×5 | JONAS, MAX, LENA, TIM, PAUL | 3:4 |
| EP cover | `Salt and Sweat` | 1:1 |

- Real photos → `next/image`, `priority` on hero only, `sizes` set per breakpoint, AVIF/WebP via default Vercel loader.
- Brand SVGs → inline React components in `components/brand/`, **not** `next/image` (they must tint via `currentColor`).
- Grain/halftone → CSS, never image files.
- Keep `PhotoPlaceholder` shipping in v1 so the site is complete before the shoot.

---

## 5. Interactivity & State

| Element | Where | State/logic | Client JS? |
|---|---|---|---|
| Mobile nav | Header | `useState` open, focus trap, Esc, scroll-lock, route-change close | **Yes** — ~1 KB, hand-rolled |
| Active nav item | Header | `usePathname()` | **Yes** (same component) |
| Marquee | Landing | none | **No** — CSS `@keyframes` |
| Gold shimmer | global | none | **No** — CSS |
| Grain / halftone | global | none | **No** — CSS |
| CTA buttons | Landing | none | **No** — plain `<a>` |
| Ticket links | Tour | none | **No** — external `<a>` |
| Contact form | `/contact` | Server Action + `useActionState`, pending state, field errors, success | **Yes** |
| Audio/video embeds | `/music` | lazy-load on click | **Yes** — façade pattern, no library |
| Language switch | (if built) | locale routing | Depends — see §10 Q2 |

### Libraries
- **None required.** No carousel, no modal, no animation library, no state manager.
- Justified additions only: `clsx` + `tailwind-merge` (variants), `zod` (contact form validation), `resend` (form delivery).
- **Explicitly avoid:** Framer Motion (every effect here is a CSS keyframe), any carousel lib (the member grid is a grid), any UI kit (the design is bespoke and hostile to component-library defaults).

---

## 6. Data & Content

All content is currently hardcoded inside JSX. Recommendation: **typed content modules in-repo for v1**, no CMS.

```
content/
  band.ts       # name, members[], hometown, coords, est, entity, address
  shows.ts      # Show[]
  releases.ts   # Release[] (EP I — Salt and Sweat)
  social.ts     # IG / YT / Spotify / Bandcamp handles
  copy.ts       # slogans, creeds, manifesto (from letterhead)
lib/
  shows.ts      # getUpcomingShows(), getNextShow(), sort, past-filter
```

```ts
type ShowStatus = 'available' | 'few-left' | 'sold-out';
interface Show {
  date: string;          // ISO 8601 — mockup uses DD.MM.YY, unusable for sorting
  city: string;
  venue: string;
  doors?: string;        // "20:00"
  status: ShowStatus;
  ticketUrl?: string;
  price?: { advance: number; door: number; currency: 'EUR' };
}
```

- `NextShowCard` on the landing page must be **derived** from `getNextShow()`, not duplicated. In the mockup the landing hardcodes `19.06.26 · Werkstatt 44` and the tour page repeats it — guaranteed to drift.
- Dates as ISO; format for display with `Intl.DateTimeFormat('de-DE')`. The mockup's `DD.MM.YY` strings can't be sorted or filtered.
- Weekday (`FR`, `SA`, `SO`) should be **computed**, not stored — the mockup stores it and it's already a consistency risk.
- **Upgrade path:** tour dates are the only content that changes often. If the band needs to self-edit, move `shows.ts` behind a `getShows()` boundary now, then swap in Sanity/Payload later with no component changes. Do not build a CMS in v1.

### Content inventory extracted from the bundle
- **Band:** Tears of God · 5 members (Jonas, Max, Lena, Tim, Paul) · Jonas Krämer = vocals/booking
- **Location:** Castrop-Rauxel, 44575, Ruhrpott DE · 51.5497° N / 7.3121° E
- **Entity:** Tears of God GbR, Bochumer Str. 7, 44575 Castrop-Rauxel · EST. MMXXIV
- **Contact:** jonas@tearsofgod.band · tearsofgod.band · @tearsofgod.band
- **Release:** EP I — *Salt and Sweat* (`TOG · EP · 001`, MMXXVI)
- **Tour:** *No False Idols* 2026, Leg I — 8 dates, 06/2026–08/2026, Castrop-Rauxel → Leipzig
- **Pricing:** VVK 9 € / AK 12 €
- **Slogans:** NO FALSE IDOLS · WIR FÜNF · SWEAT THROUGH YOUR FLOOR · ALL AGES · NO NAZIS · NO EXCUSES · CREW · SWEAT · REPEAT
- **Manifesto:** the letterhead body copy ("We are five. We come from Castrop-Rauxel…") is ready-made `/band` content.

---

## 7. Project Structure

```
tog-website/
├─ app/
│  ├─ layout.tsx
│  ├─ globals.css
│  ├─ fonts.ts
│  ├─ page.tsx
│  ├─ tour/page.tsx
│  ├─ music/page.tsx
│  ├─ band/page.tsx
│  ├─ contact/
│  │  ├─ page.tsx
│  │  └─ actions.ts          # 'use server'
│  ├─ (legal)/
│  │  ├─ layout.tsx
│  │  ├─ impressum/page.tsx
│  │  └─ datenschutz/page.tsx
│  ├─ not-found.tsx
│  ├─ icon.tsx
│  ├─ opengraph-image.tsx
│  ├─ sitemap.ts
│  └─ robots.ts
├─ components/
│  ├─ brand/                 # §2.2 — the design system
│  │  ├─ Wordmark.tsx
│  │  ├─ MaskEmblem.tsx
│  │  ├─ LogoMonogram.tsx
│  │  ├─ TearHalo.tsx
│  │  ├─ Rune.tsx
│  │  ├─ RunicBar.tsx
│  │  ├─ Ornaments.tsx
│  │  ├─ Grain.tsx
│  │  ├─ Halftone.tsx
│  │  ├─ RegMarks.tsx
│  │  ├─ MetaStrip.tsx
│  │  ├─ GoldText.tsx
│  │  ├─ Stamp.tsx
│  │  ├─ Barcode.tsx
│  │  └─ PhotoPlaceholder.tsx
│  ├─ layout/
│  │  ├─ Header.tsx
│  │  ├─ SiteNav.tsx         # 'use client'
│  │  └─ Footer.tsx
│  ├─ sections/
│  │  ├─ Hero.tsx
│  │  ├─ Marquee.tsx
│  │  ├─ BandBlurb.tsx
│  │  ├─ MemberGrid.tsx
│  │  ├─ NextShowCard.tsx
│  │  ├─ TourHeader.tsx
│  │  └─ ShowTable.tsx
│  └─ ui/
│     ├─ CtaButton.tsx
│     ├─ SectionEyebrow.tsx
│     └─ TicketStatus.tsx
├─ content/                  # §6
├─ lib/
│  ├─ runes.ts               # RUNE_PATHS
│  ├─ shows.ts
│  ├─ seo.ts                 # metadata + JSON-LD builders
│  └─ cn.ts
├─ public/
│  ├─ brand/                 # wordmark.svg, mask.svg
│  └─ images/                # photography (once shot)
├─ types/index.ts
├─ next.config.ts
├─ tsconfig.json
└─ package.json
```

---

## 8. SEO, Performance & Accessibility

### 8.1 Metadata
- `metadataBase`, `title.template` = `%s · Tears of God`, description in German.
- Per-route `generateMetadata` — `/tour` especially ("Tour 2026 — No False Idols · 8 Termine").
- `openGraph` (type `website`; `music.album` on `/music`), `twitter: summary_large_image`.
- `app/opengraph-image.tsx` via `next/og` — render the wordmark on pitch with the gold rule. On-brand OG images for free.
- `alternates.canonical` per route.

### 8.2 Structured data (high value for a band)
- `MusicGroup` on `/` — name, genre `Hardcore`, `foundingLocation` Castrop-Rauxel, `sameAs` socials.
- `MusicEvent` per show on `/tour` — `startDate`, `location` (`Place` + `PostalAddress`), `offers` with `availability` mapped from `ShowStatus` (`InStock` / `LimitedAvailability` / `SoldOut`), price 9 EUR. This is what surfaces shows in Google's event results.
- `MusicRelease` for the EP.

### 8.3 Semantic HTML fixes (all present in the mockup)
| Mockup | Fix |
|---|---|
| Nav items are `<span>` | `<nav>` + `<ul>/<li>` + `<Link>`; `aria-current="page"` |
| `LISTEN →` / `WATCH` / `TICKETS` are `<div>` | `<a>` (or `<button>`); real focus states |
| No headings anywhere | `<h1>` per page (landing: wordmark with visually-hidden text); `<h2>` per section |
| Tour list is a grid of `<div>`s | `<table>` + `<thead>`/`<th scope="col">`, or a `<ul>` of definition groups |
| No landmarks | `<header>`, `<nav>`, `<main>`, `<footer>` + skip-to-content link |
| Wordmark is a CSS mask with no text | Inline SVG with `<title>` / `aria-label`, or `sr-only` text |
| Decorative SVGs (halo, ornaments, runes, reg marks) | `aria-hidden="true"` + `focusable="false"` |
| Runic text | Latin text in `sr-only`; runes are decorative, unreadable to AT |
| `<html>` has no `lang` | `lang="de"` (content is German-dominant) |

### 8.4 Contrast — two real failures
Measured against `--color-pitch` (#131210):
| Pair | Ratio | Verdict |
|---|---|---|
| bone `#f1ece0` on pitch | ~16:1 | Pass |
| gold `#d9b25a` on pitch | ~9.4:1 | Pass |
| pitch on gold (CTA) | ~9.4:1 | Pass |
| bone on blood (`FEW LEFT`) | ~6.2:1 | Pass |
| **steel `#7a7268` on pitch** | **~3.9:1** | **Fails AA** — and it's used at 8–9px |
| **blood `#a8201a` on pitch** | **~2.6:1** | **Fails AA and AAA** — used for the `AND` in the hero headline and the `TOUR · 2026 · LEG I` eyebrow |

- Fix: lighten steel to ≈`#9a9086` for text use (keep `#7a7268` for hairlines/borders only), and lighten blood for on-pitch **text** to ≈`#e0483f` (keep `#a8201a` for fills, where bone-on-blood already passes).
- Do this as a token split (`--color-steel` vs `--color-steel-text`) so the print palette stays intact.

### 8.5 Other a11y
- `TicketStatus` conveys state by **color alone** (gold vs blood vs strikethrough). Add text/icon: `SOLD OUT` already has a word, but `FEW LEFT` vs `AVAILABLE` need a non-color cue and `aria-label`.
- Letter-spacing of `0.2–0.35em` on 8px text is a legibility failure — see the 12px floor in §3.3.
- Marquee/shimmer must respect `prefers-reduced-motion`.
- Visible focus rings (gold, 2px offset) — completely absent from the mockup.

### 8.6 Performance
- **~0 KB client JS** on `/` and `/tour` (nav only). LCP should be image-bound.
- 237 KB wordmark → SVG is the single biggest win.
- Fonts: 3 families is heavy but they're the identity. Trim to 4 weight/family combos and 2 subsets (from 13 shipped files). `next/font` self-hosts and eliminates the Google round-trip.
- Grain: one `position: fixed` overlay in the root layout, not per-section — the mockup instantiates `<Grain>` per artboard. `mix-blend-mode` on a full-viewport fixed layer is a known paint cost; keep opacity ≤0.2 and test on mid-tier mobile.
- Static render everything; `revalidate` only if shows move to a CMS.

---

## 9. Build Order

**Stage 1 — Foundation**
1. `create-next-app` (TS, Tailwind, App Router, ESLint) + Prettier + `prettier-plugin-tailwindcss`
2. `app/fonts.ts` — 3 families, trimmed weights/subsets
3. `globals.css` `@theme` — full token map from §3.1, incl. the contrast-corrected text tokens
4. `types/index.ts` + `content/*` + `lib/shows.ts` — data model before UI
5. Vector the wordmark and sigil → `components/brand/Wordmark.tsx`, `MaskEmblem.tsx`

**Stage 2 — Design system**
6. Port `components/brand/*` (§2.2), one file per primitive, inline styles → Tailwind classes
7. `lib/runes.ts` + `Rune`/`RunicLine`/`RunicVertical`/`RunicBar`
8. Fix `Barcode` determinism; add `aria-hidden` to all decorative SVGs
9. Build a private `/dev/kitchen-sink` route rendering every primitive at every prop combination — this is the regression surface for the whole port

**Stage 3 — Shell**
10. `app/layout.tsx` — fonts, `lang="de"`, skip-link, fixed grain overlay, gold-foil SVG `<defs>`
11. `Header` + `SiteNav` (client) + mobile disclosure with focus trap
12. `Footer`, both variants
13. Focus-visible ring style + `prefers-reduced-motion` block

**Stage 4 — Designed pages**
14. `/` — `Hero` → `Marquee` → `BandBlurb`/`MemberGrid` → `NextShowCard` (wired to `getNextShow()`)
15. `/tour` — `TourHeader` → `ShowTable` (semantic `<table>`) → `TourCreedBar`
16. Responsive pass on both: mobile tour cards, member grid collapse, fluid type

**Stage 5 — Undesigned pages** *(blocked on §10 Q1)*
17. `/music`, `/band`, `/contact` composed from Stage-2 primitives
18. Contact Server Action + zod + Resend + honeypot/rate-limit
19. `/impressum`, `/datenschutz`

**Stage 6 — SEO & polish**
20. `generateMetadata` per route, `sitemap.ts`, `robots.ts`, `icon.tsx`, `opengraph-image.tsx`
21. JSON-LD: `MusicGroup`, `MusicEvent[]`, `MusicRelease`
22. `not-found.tsx` in brand voice

**Stage 7 — Verification**
23. Lighthouse (target ≥95 all four), axe-core pass, keyboard-only walkthrough
24. Real device check for the grain/blend paint cost
25. Swap `PhotoPlaceholder` → real photography when available
26. Vercel deploy, domain `tearsofgod.band`, analytics

Stages 1–4 are the critical path and are unblocked today. Stage 5 needs answers below.

---

## 10. Open Questions

**Blocking**
1. **Three nav pages have no design.** `MUSIC`, `BAND`, `CONTACT` appear in the header of both artboards but no artboard exists. Compose them from the brand system, or cut them from nav in v1?
2. **Language.** The mockup's tweak panel offers `DE / EN` mix, `DEUTSCH`, `ENGLISH`, and the copy is genuinely mixed (`DIE BAND`, `DATUM`, `TAG`, `STADT` alongside `NEXT SHOW`, `SOLD OUT`, `FEW LEFT`). Is the mixed register a deliberate brand voice (keep, single `de` locale), or does this need real i18n (`next-intl`, `/de` + `/en`)? This affects routing, metadata, and every content module.
3. **Ticket links.** `TICKETS` and `AVAILABLE →` have no destination. Is there a ticketing provider (Eventim, Ticketmaster, Dice, direct), or does it link to the venue?
4. **Wordmark vector.** Is there an `.ai`/`.svg` original? The bundle only has a 237 KB PNG. Without a vector I'll trace it, which risks drifting from the original letterforms.

**Non-blocking (proceeding on the stated assumption)**
5. **Scale intent.** The web artboards are 820px wide. Assuming they represent a ~1280–1440px desktop (≈1.6× scale-up), not a literal 820px layout. Confirm — it changes every type size.
6. **Contrast fixes.** Assuming brand-faithful-but-accessible: split the tokens so print keeps `#7a7268`/`#a8201a` while web text uses lightened variants. Alternative is to keep the exact hexes and accept AA failures.
7. **Photography.** Assuming `PhotoPlaceholder` ships in v1 and photos land later. 6 slots specified (§4).
8. **Interaction states.** No hover/focus/active/error/loading states are defined anywhere in the mockup. Assuming: gold underline on nav hover, gold-hi fill on CTA hover, `ash` row tint on tour hover, 2px gold focus ring.
9. **Mobile tour table.** 5 columns won't fit. Assuming stacked cards below `sm`, dropping the `TAG` column at `md`.
10. **Contact delivery.** Assuming a Server Action + Resend to `jonas@tearsofgod.band`. A `mailto:` is simpler but loses booking enquiries to broken mail clients.
11. **Merch.** T-shirt, hoodie, and sticker-sheet artboards exist. Assuming out of v1 scope — confirm whether a shop or a link-out to Bandcamp merch is wanted.
12. **Legal pages.** A German band site needs an Impressum (§5 DDG) and Datenschutzerklärung. I can scaffold the structure but the content must come from the band/their lawyer. The GbR address is already in the letterhead.
13. **Grain intensity.** Default `0.2` in `TWEAK_DEFAULTS`. Assuming fixed at 0.2 and not user-adjustable.
14. **Analytics.** None specified. Assuming Vercel Analytics (cookieless, no consent banner needed) unless GA4 is wanted — GA4 would require a consent banner under DSGVO.

---

## Appendix — Extracted source reference

Bundle contents, unpacked:

| Module | Exports |
|---|---|
| `tokens-primitives.jsx` | `TOG`, `Grain`, `Halftone`, `RegMarks`, `RegCross`, `Wordmark`, `LogoStack`, `LogoHoriz`, `MaskEmblem`, `LogoMonogram`, `TearHalo`, `FiveMark`, `PhotoPlaceholder`, `Barcode`, `Tape`, `Stamp`, `MetaStrip` |
| `runes-gold.jsx` | `GOLD_FOIL*`, `GoldText`, `GoldBar`, `RUNE_PATHS`, `Rune`, `RunicLine`, `RunicVertical`, `RunicBar`, `Ornament{Corner,Bottom,Crown,Side}`, `RuneDot` |
| `ab-web.jsx` | **`ABWebLanding`, `ABWebTour`** ← the only web designs |
| `ab-identity-stationery.jsx` | `ABLogoSystem`, `ABColorType`, `ABBusinessCard`, `ABLetterhead` |
| `ab-print-merch.jsx` | `ABGigPoster`, `ABEPCover`, `ABTshirt`, `ABHoodie` |
| `ab-social.jsx` | `ABInstagramGrid`, `ABInstagramStories`, `ABYouTubeBanner`, `ABStageBackdrop`, `ABStickerSheet` |
| `ab-runic-vertbar.jsx` | `ABRunicAlphabet`, `ABVerticalBar` |
| `design-canvas.jsx` | Canvas chrome — **discard** |
| (3 vendor bundles) | React, ReactDOM, Babel standalone — **discard** |
