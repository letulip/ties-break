# Round-5 brand spec (owner items)

Branch `feat/round5-brand`, worktree `tb-r5-brand`. Five owner items, all identity/brand:
typography, PWA icons (the girl, not the ball), the onboarding finale portrait, header
avatar emotions, and a silver finalist treatment. Scope stayed inside the owned surfaces
(fonts, icons/manifest, OnboardingWizard's last step, App.vue header avatar logic,
TournamentFlow's finale art variant, style.css typography) — `src/engine/**`,
`src/audio/**`, `SeasonScreen.vue`, and HomeScreen's news/standings were not touched.

## 1. Typography (item 32) — Sora + Manrope, self-hosted

Downloaded via curl from `fonts.googleapis.com`/`fonts.gstatic.com` (network access worked
this session): Sora weight 600, Manrope weights 400 and 500, **latin subset only** (the
app's UI text is English; the other script subsets Google serves for these families would
have doubled the precache weight for no benefit here). Files:

- `public/fonts/sora-600.woff2` (~15 KB)
- `public/fonts/manrope-400.woff2` (~14 KB)
- `public/fonts/manrope-500.woff2` (~14 KB)

`@font-face` rules + `--font-heading`/`--font-body` custom properties added at the top of
`src/style.css`, each with `font-display: swap` and a system-font fallback chain
(`system-ui, -apple-system, "Segoe UI", sans-serif` — unchanged from the pre-existing
`body` font stack). Applied `--font-heading` (Sora) to `h1`, `section h2`,
`.onboarding-step h2` (a plain `h2` that isn't inside a `<section>`, so the `section h2`
rule doesn't reach it), and `.score-line`; `--font-body` (Manrope) to `body` (inherited
everywhere else). No JS changes — this is pure CSS.

Precaching: `vite.config.ts`'s workbox `globPatterns` already included `woff2`, so no
config change was needed there; confirmed both fonts show up in the built `dist/sw.js`
precache manifest (see Gates below).

One build gotcha: an early draft of the doc-comment above the `@font-face` rules included
the literal glob text `**/*.woff2`, and the `*/` inside it closed the CSS comment early,
which `esbuild`'s CSS minifier flagged as a syntax warning at build time (the dangling
`*/` after it became stray CSS). Reworded the comment to describe the glob instead of
quoting it.

## 2. PWA identity = the girl, not the ball (item 34)

`scripts/gen-icons.mjs` is a full rewrite: sharp-based, source is `art-src/avatars/jun.png`
(the existing 256×256 face crop of the jun-norm portrait; no jpeg sibling existed, but the
lookup checks `.png`, `.jpg`, `.jpeg` in that order and errors clearly if none exist). Each
target is a square canvas filled with the app's theme color `#0f172a` (matches
`vite.config.ts`'s manifest `theme_color`/`background_color`) with the face composited as
a circle, centered:

| file | size | face fraction | notes |
|---|---|---|---|
| `pwa-192.png` | 192 | 0.82 | purpose "any" |
| `pwa-512.png` | 512 | 0.82 | purpose "any" |
| `pwa-maskable-512.png` | 512 | **0.62** | purpose "maskable" — the safe zone the task specified, so an OS-applied circular/squircle mask never clips the face |
| `pwa-apple-180.png` | 180 | 0.82 | iOS touch icon, same generous fill as "any" |
| `favicon.png` | 64 | 0.92, **transparent** canvas (the one exception — see below) | browser tab icon |

The favicon is deliberately different: a bare circular face cutout on a transparent
background (no square corners), since "favicon: circular face png 64" reads as a true
circular icon rather than the square-with-a-circle-inside badge style used for the
installable icons. At 64 px the face fraction is pushed to 0.92 for legibility.

`index.html`: replaced `<link rel="icon" type="image/svg+xml" href="./ball.svg">` with
`<link rel="icon" type="image/png" href="./favicon.png">`. `ball.svg` stays in the repo
and in `vite.config.ts`'s `includeAssets` (added `favicon.png` alongside the existing
`ball.svg`/`pwa-apple-180.png` entries) — it's no longer the favicon, but nothing else in
the app currently references it (grepped `src/`), so it's free for the court/viewer to
pick up later per the task note. The manifest's `icons` array in `vite.config.ts` didn't
need structural changes (same three filenames, new pixel content).

Verified in the build output (`npm run build` → `dist/`): all five files present with the
expected dimensions, `manifest.webmanifest`'s `icons` array resolves to files that exist,
and `dist/sw.js`'s precache manifest includes `favicon.png` and all four `pwa-*.png` (see
Gates).

## 3. Onboarding finale portrait (item 30)

`OnboardingWizard.vue` step 7 (Summary): added the jun-norm portrait — the full-scene art
at `public/images/fem-euro-brunnet/fem-euro-brunnet-jun-norm-fs8.webp` (512×512, already
built by the existing art pipeline), not the small round header avatar — displayed at
140×140, `object-fit: cover`, `border-radius: 12px` (rounded corners, not circular; new
`.onboarding-portrait` class in `style.css`), `loading="lazy"`, directly above the summary
table. Caption below it: "First time on court – ready?" (en dash, per the house style
already used elsewhere in this file's copy, e.g. step 1's "You're the parent now – every
choice…"). Verified live at 375 px: image loads (200), layout stays within the existing
scrollable `.onboarding-body`, no overflow.

## 4. Avatar emotions in the header (item 31)

New crops, all 256×256 webp (quality 82, via the existing `scripts/optimize-art.mjs`
pipeline — ran it after dropping the two new PNGs into `public/avatars/`, which converted
them to webp *and* moved the source PNGs into `art-src/avatars/`, exactly like the existing
`jun.png`/`adult.png` convention):

- `public/avatars/jun-happy.webp` ← crop `(320, 220)` size `380` from
  `art-src/images/fem-euro-brunnet/fem-euro-brunnet-jun-happy-fs8.png` (1254×1254 source).
- `public/avatars/jun-sad.webp` ← crop `(380, 230)` size `380` from
  `art-src/images/fem-euro-brunnet/fem-euro-brunnet-jun-sad-fs8.png` (1254×1254 source).
- `public/avatars/jun-norm.webp` — renamed from the pre-existing `jun.webp` (unchanged
  crop: offset `445/165` size `340` on the jun-norm source, per the existing
  `docs/decisions.md` note). `jun.webp` was kept as a duplicate file (not a symlink, to
  avoid any public-dir-copy edge cases) for backward compatibility — `KidScreen.vue`
  (sibling-owned) still references it directly and continues to work unmodified.

The happy/sad crop offsets were found by eye: extracted trial squares at a few candidate
offsets per source with sharp, inspected each visually, and picked the framing that best
matched the existing norm crop's style (face centered, a little hair/shoulder visible,
consistent headroom). The happy and sad source paintings have noticeably different
compositions from the norm one (the trophy-raise pose sits the face upper-left-of-center;
the bench pose sits it lower and further right), which is why the offsets differ from each
other and from the norm crop's `445/165`, while the crop *size* (380) was kept identical
between happy and sad for consistency.

`App.vue`: new `lastKidMatchWon` computed — walks `game.snapshot.events` from the end
(most recent first) for the last entry carrying a `match`, and reads
`match.winnerId === KID_ID`. `avatarUrl` becomes a computed building
`avatars/jun-{happy|sad|norm}.webp` from that (null → norm, i.e. no match played yet).
Friendly matches don't append a `match`-carrying `WorldEvent` (confirmed by reading
`engine/world.ts` and by testing live — playing a friendly never moved the header off
"norm"), so only tournament results drive this, per the task's own hint.

Live-verified end to end on a real tournament career: header avatar was `jun-norm.webp`
before any match; after a semifinal **loss** it switched to `jun-sad.webp`
(network-confirmed, `<img>` `src` inspected); after later winning a full Regional
Championship (**champion**) it switched to `jun-happy.webp` (same verification). Screenshots
of both states were taken; the sad-avatar transition also visually confirmed in a 375 px
screenshot.

## 5. Silver finalist art (item 11) — fallback used

Attempted a programmatic gold→silver desaturation of `jun-happy` first, per the task's own
suggested approach: a per-pixel HSL pass over the 512×512 `fem-euro-brunnet-jun-happy-fs8`
art, masking pixels in the gold/brass hue band (38°–62°, saturation ≥ 0.35) and pushing
them toward a near-gray, faintly cool tint. Inspected the result (trophy close-up, before
vs. after) and it came out **patchy and unconvincing** — the trophy's highlights,
mid-tones, and shadow gold don't share one consistent hue/saturation band, so parts of the
cup desaturated to a mottled gray-blue while most of the mid-tone body stayed fully gold.
Per the task's own conservatism instruction ("if it looks wrong, be conservative"), this
was **not shipped**. The trial script and its output image were discarded (not committed).

Fallback shipped instead, in `TournamentFlow.vue`:

- A finale is a "silver" runner-up when `!pending.kidChampion && pending.finishLabel ===
  'Runner-up'` (finishLabel is computed engine-side in `world.ts` and is exactly
  `'Runner-up'` for a lost final — checking the string is enough, no engine changes
  needed).
- Runner-up finale art: the existing **"serious"** (focused/composed, not celebratory or
  devastated) portrait — `fem-euro-brunnet-jun-serious-fs8.webp` — instead of the sad art
  used for an earlier exit.
- Card frame: new `.tf-finale.silver` class — a metallic gradient border (`135deg,
  #f4f6fa → #aab2c0 → #7d8698 → #f4f6fa`, via the transparent-border + double-background
  trick, matching how `.tf-finale.champ` overrides `border-color`) and a light silver-gray
  title color (`#d7dbe4`), replacing the gold accent. A 🥈 sits where the champion's 🏆
  sits.
- Champion path is untouched: `jun-happy` art, gold accent border, 🏆, exactly as before.
- Any other finish (quarterfinalist, semifinalist, round-of-N) keeps the pre-existing
  plain "out" styling and sad art — unchanged.

Live-verified: a real "Champion" run showed the gold-bordered `jun-happy` finale correctly
(and flipped the header avatar to happy, see item 4). A real "Semifinalist" (early, non-
final loss) run showed the plain sad-art "out" card correctly. Getting the engine's RNG to
land on an actual lost-final ("Runner-up") result live took more tournament attempts than
was practical in this session (several draws in a row ended earlier or in a title), so the
`.tf-finale.silver` **visual** (gradient border, title color, medal) was additionally
confirmed by temporarily forcing the class/label on an already-rendered finale card via
DOM injection in the browser (a styling-only check, not a game-logic test — the
`isRunnerUp` condition itself is a plain, low-risk string comparison already covered by
reading `world.ts`'s `finishLabel`). Recommendation for the owner: a dedicated silver
finalist artwork (hand-drawn or a better-targeted edit than naive hue masking) would read
better than the card-frame fallback and is worth commissioning later.

## Gates

- `npx vue-tsc -b`: 0 errors.
- `npx vitest run`: 238/238 passed, 23/23 files (unchanged by this branch — no test files
  touched; the new logic is UI wiring + asset generation, not engine/schema).
- `npm run build`: clean (0 warnings after the CSS-comment fix in item 1). Confirmed in
  `dist/`: `fonts/{sora-600,manrope-400,manrope-500}.woff2`,
  `avatars/{jun,jun-norm,jun-happy,jun-sad,adult}.webp`, `favicon.png`,
  `pwa-{192,512,maskable-512,apple-180}.png` all present; `manifest.webmanifest`'s `icons`
  resolve; `dist/sw.js`'s precache manifest lists all of the above.
- Live preview at 375 px (`npm run preview -- --port 4420`, worktree-scoped launch config
  added under the name `tb-r5-brand-preview` since the shared `.claude/launch.json`'s
  existing `ties-break-preview`/`ties-break-dev` entries point at the sibling `ties-break`
  checkout, not this worktree): computed `font-family` on `body`/`h2` confirmed
  Manrope/Sora with fallbacks; font files fetched 200; onboarding finale image + caption
  confirmed; header avatar confirmed switching norm → sad (real loss) → happy (real
  tournament win) on a live career; champion and plain-eliminated finale variants
  confirmed live, silver variant confirmed via forced-class visual check (see item 5).
  Console was clean throughout (`read_console_messages` returned no logs at every check).

## Conflicts / cross-branch notes

None encountered — `src/engine/**`, `src/audio/**`, `SeasonScreen.vue`, and HomeScreen's
news/standings were not touched. `KidScreen.vue` (sibling-owned) was not edited but its
existing `avatars/jun.webp` reference keeps working via the compatibility alias described
in item 4. `git status` at the end of this branch's work shows only the files listed above
plus this spec — no stray edits to `docs/decisions.md` or `docs/plan.md`.
