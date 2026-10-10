---
type: spec
status: current
area: delivery
last-reviewed: 2026-10-10
---

# RU typography – the fonts before the words (P3 · gated on the RU decision, not on alpha)

His 30.09 note: the translation itself is his side («мы её переведем, не переживай»); what needs
engineering is TYPE. The shipped trio (self-hosted woff2, round 5 #32): **Sora** (headings,
var), **Manrope** (body, var), **Caveat 600** (the handwritten voice – diary, album).

## The facts to verify FIRST (T1 – a cmap probe, one sitting)
- **Sora: the FAMILY has no Cyrillic.** A replacement or a paired fallback is required for
  headings – no probe changes this.
- **Manrope: the family HAS Cyrillic** (native, designed with it). The question is OUR file:
  `public/fonts/manrope-var.woff2` may be a latin-only subset. T1 reads the cmap and answers.
- **Caveat: the family HAS Cyrillic** (strong native Cyrillic – lucky for the diary voice).
  Same subset question for `caveat-600.woff2`.
T1 = a small node/python probe over the three files printing the Unicode ranges each carries;
the verdict decides whether T3 adds subsets or swaps files.

### ⭐ T1 – EXECUTED (10.10): the verdict, per file
`npm run fonts:probe` (`tools/font-cmap-probe.ts`) – zero dependencies: it reads the woff2 header, inflates the one Brotli
stream with Node's own zlib and reads `cmap` straight out of it (`cmap` is never one of the transformed tables). No network,
no Python, no devDependency.

| file | bytes | family / axes | code points | Cyrillic U+0400-04FF | Russian letters (of 66) | IO small / capital | verdict |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `sora-var.woff2` | 25,240 | Sora, wght 400..800 | 223 | 0 of 256 | 0 | no / no | **NO CYRILLIC** |
| `manrope-var.woff2` | 24,576 | Manrope, wght 200..800 | 218 | 0 of 256 | 0 | no / no | **NO CYRILLIC** |
| `caveat-600.woff2` | 51,296 | Caveat SemiBold, static | 226 | 0 of 256 | 0 | no / no | **NO CYRILLIC** |

What it settles, in the order it matters:
- **The README's «latin subset only» was literally true.** The FAMILIES of Manrope and Caveat have Cyrillic upstream; OUR files do
  not carry one letter of it (the foundry's own OS/2 range bit says the same: no, no, no). So T3 **adds** subset files for those
  two – it does not swap the files, and the Latin bytes English renders from are not touched.
- **Sora needs a paired face for headings, as the spec said** – its file has none and the family has none.
- **U+2116 (the numero sign) is absent from all three.** It sits inside the Cyrillic subset's own range, so a Russian string with
  it needs the new face. The guillemets, the en and em dash, the ellipsis, the no-break space and the minus sign ARE in all three
  Latin files, so Russian punctuation asks nothing of the new files.
- ⚠ **The probe surfaced a fact that shaped the seam: the Latin files of Sora and Manrope are NOT the same set.** Manrope's carries
  U+0102, U+2191 and U+2193 that Sora's does not; Sora's carries the combining marks U+0300-0301, U+0303-0304 and U+0308 that
  Manrope's does not. Naming Manrope in the HEADING stack for every locale would therefore change how an English heading falls
  back for an arrow or a breve – a visible change to English by the back door. Hence the heading seam below is Russian-scoped.
- The file is pinned by hash in `tests/i18n-l4-1-fonts.test.ts`: if one of the three is swapped, that test names this section and
  asks for a re-run of the probe, so the numbers above cannot go stale unseen.

## T2 · The headings decision – his eye, two candidates rendered side by side
- **Option A – Onest** (OFL, variable, Cyrillic-native): the closest character match to Sora's
  geometric voice.
- **Option B – Manrope for headings too**: one family, zero new latin bytes, the app's look
  tightens rather than changes.
Deliverable: one HTML sample sheet, both options over real screens' headings in EN and RU, his
one-word pick. His 30.09 direction stands either way: the Cyrillic heading face loads ONLY under
the RU locale (lang-scoped, T3) – EN ships exactly today's bytes. (Golos Text and Rubik stay named as reserves.)

### ⭐ T2 – EXECUTED (10.10): the sample sheet is out, the pick is his
`l4-1-headings-sample.html` – a standalone page, NOT in the repository (it loads the candidates from the Google Fonts CDN, which the
app never does). Five real headings from his own tables, EN beside RU, set at the sizes, weights and tracking the app's own
heading rules use (read off `src/style.css` and the screens: 19-20px / 800 / -0.02em for the screen titles, 15.5px / 700 for card
titles, 42px / 800 for the display name), on the app's dark ground; each card shows today's English in Sora (unchanged under either
pick), then the Russian in Option A and in Option B; Golos Text and Rubik are one line each at the foot.
**His pick = one word: `Onest` or `Manrope`. What each costs the repository:**
- **B (Manrope):** nothing further. It is the seam's default, so B is the state T3 already ships; the only work is the two subset
  files below, which the body needs anyway.
- **A (Onest):** one subset file `public/fonts/onest-cyr.woff2` (same recipe as the commands below, source
  `ofl/onest/Onest[wght].ttf`), its `OFL-Onest.txt` verbatim from google/fonts, a row in `public/fonts/README.md`, ONE `@font-face`
  block in `src/style.css` (family `Onest`, the same Cyrillic-only `unicode-range`) and ONE line – `--font-heading-cyr: 'Onest'` – in
  the seam. Two existing census tests then need a deliberate re-aim, which is the point of having them: `round35-ui.test.ts`
  («three self-hosted families and no more») and `legal-assets.test.ts` (the family list), plus the face count in
  `tests/i18n-l4-1-fonts.test.ts`.

## T3 · The wiring
`lang`-scoped `@font-face` with `unicode-range` subsets: latin serves exactly today's bytes;
Cyrillic subsets load only under the RU locale. `--font-heading`/`--font-body` stay the only
seams (they already are – style.css's own design).

### ⭐ T3 – EXECUTED (10.10): what shipped, and the state it ships in
**`src/style.css`: +61 lines, 0 deleted** (`git diff --numstat`) – the three Latin faces and the three font tokens are byte-identical,
pinned verbatim in `tests/i18n-l4-1-fonts.test.ts`. Added, in this order, right after the Caveat block:
1. **Two Cyrillic faces that REUSE the family names Manrope and Caveat**, weights mirroring their Latin faces (200 800 and 600),
   `font-display: swap`, `src: url('/fonts/manrope-cyr.woff2')` and `url('/fonts/caveat-cyr.woff2')`, and
   `unicode-range: U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116` – Cyrillic and the numero sign, nothing a Latin text can type.
   (Google's own cyrillic subset also claims U+0301, the stress mark; it is left out on purpose and the comment says when to add it.)
   *Why the same names rather than new ones:* a browser fetches a face only when text inside its range is laid out, so an English
   session requests neither file; anything that spells `'Manrope'` by name would pick the subset up with no edit (nothing in `src/` does
   today – the court canvas sets its text in the system stack – so that is headroom, not a dependency); and
   `round35-ui`'s «three self-hosted families and no more» stays true. *The overlap rule it rests on:* the Latin face has no range,
   the Cyrillic one comes later, and on a Cyrillic code point the later rule wins – measured, below.
2. **The heading seam.** `--font-body-cyr: 'Manrope'` and `--font-heading-cyr: var(--font-body-cyr)` in `:root`, and ONE rule,
   `:root[lang|='ru'] { --font-heading: 'Sora', var(--font-heading-cyr), var(--font-body-cyr), <today's system tail> }`. English never
   meets it (`lang` is `en`), Latin letters in a Russian heading still set in Sora, Cyrillic ones fall through to the seam, and the body
   face stays behind it so a heading face that fails to load degrades to Manrope and not to the system. The body and hand tokens are
   not overridden: their Cyrillic arrives through the unicode-range faces of the same family, so their chains are identical in both
   languages. *The attribute selector, not `:lang(ru)`:* the two are the same on the root element (`src/i18n/locale.ts` sets
   `<html lang>`), and happy-dom implements only the attribute form (`matches(':lang(ru)')` is false for `lang="ru"`, measured), so the
   mounted smoke flips the real thing instead of standing in for it. *The seam block sits AFTER the main `:root` block on purpose:* `redesign-home`, `round10` and `round12-view` cut the token block with
   `region(css, ':root {', …)` from the FIRST `:root {` in the sheet, and a small block above it was read as the token block (caught by a
   grep for the cutters while the first full-check run was in flight – that run was stopped and restarted – and the unit net now pins the order).
3. **Nets.** `tests/i18n-l4-1-fonts.test.ts` (10, unit): English byte-identity, «every new face claims Cyrillic and nothing else»,
   the graceful-absence ledger, the seam's exact shape and its place after the main token block, the hash that ties T1 to its bytes. `tests/component/l4-1-ru-fonts.test.ts` (6,
   mounted): `LocalePrompt` under the real stylesheet with `lang` flipped en / ru / ru-RU / en, the computed chains of a heading, a
   paragraph and a handwriting probe, the seam proven (`--font-heading-cyr: 'Onest'` slots between Sora and the body face under Russian
   and does nothing under English). Five mutation arms watched red (selector retargeted, body face dropped from the chain, a
   Cyrillic range removed, a Latin face edited, the seam block moved above the main token block) and the sheet restored byte-identical.

**THE SHIPPED STATE WAS GRACEFUL ABSENCE (superseded the same day, 10.10 – the files landed, see «T3 – LANDED» below).** `manrope-cyr.woff2` and `caveat-cyr.woff2` are declared and are **not on disk**: this
machine has neither fontTools nor `pyftsubset` (`which pyftsubset`, `import fontTools` – both absent), and the brief allowed fetching
the OFL sources only if the tooling was already here. Until the files land, a Russian session asks for them, gets a 404 and the
browser falls through to the system face it uses today – nothing regresses. The absence is visible three ways: the build prints one
«didn't resolve at build time» line per file (the existence note), `npm run fonts:probe` lists them ABSENT, and the ledger (`tests/helpers/fontLedger.ts`, enforced by the unit net) goes red the day a listed file appears without being taken off the list. One existing guard was re-aimed for it, in the open: `redesign-home`'s «every self-hosted face has a file on disk» now skips the ledger and still fails for every other face. (A side effect worth knowing: Vite leaves an unresolved
`url()` unchanged, so under a `BASE_PATH` deploy the absent URL carries no base prefix – it 404s either way, and the next build
after the files land rewrites it properly.)

**THE MORNING COMMANDS (exact; run from the repository root; ⭐ RUN 10.10 – the as-run record is under «T3 – LANDED» below; at the L4-1 commit they were NOT RUN here – the brief allowed fetching the sources only where the
tooling was already installed, and it was not. A 404 from `curl` means the source file was renamed upstream: look in
`https://github.com/google/fonts/tree/main/ofl/manrope`):**
```bash
python3 -m venv /tmp/tb-fonts && . /tmp/tb-fonts/bin/activate && pip install fonttools brotli   # brotli lets fonttools write woff2
curl -L -o /tmp/tb-fonts/Manrope.ttf 'https://github.com/google/fonts/raw/main/ofl/manrope/Manrope%5Bwght%5D.ttf'
curl -L -o /tmp/tb-fonts/Caveat.ttf  'https://github.com/google/fonts/raw/main/ofl/caveat/Caveat%5Bwght%5D.ttf'
# Manrope: keep the variable wght axis (200..800, the same range as the Latin file)
pyftsubset /tmp/tb-fonts/Manrope.ttf --unicodes='U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116' \
  --layout-features='*' --flavor=woff2 --output-file=public/fonts/manrope-cyr.woff2
# Caveat: the Latin face is the STATIC 600, so pin the axis first, then subset
fonttools varLib.instancer /tmp/tb-fonts/Caveat.ttf wght=600 -o /tmp/tb-fonts/Caveat-600.ttf
pyftsubset /tmp/tb-fonts/Caveat-600.ttf --unicodes='U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116' \
  --layout-features='*' --flavor=woff2 --output-file=public/fonts/caveat-cyr.woff2
# verify BOTH: exits 1 unless every Russian letter, both IO letters included, is carried
npm run fonts:probe -- --require-cyrillic public/fonts/manrope-cyr.woff2 public/fonts/caveat-cyr.woff2
```
(The `--unicodes` list is the CSS `unicode-range` verbatim: the declaration claims exactly what the file was cut to carry.)
**The checklist the day the files land:** (1) delete both entries from `GRACEFUL_ABSENT_FONTS` in `tests/helpers/fontLedger.ts` (the one list both guards read); (2) name
both files, with their source and size, in `public/fonts/README.md` (`tests/legal-assets.test.ts` insists – the OFL texts already
travel with both families, the stems `manrope` and `caveat` match); (3) `npm run check` – the install ceiling is re-measured (T4);
(4) look at one Russian screen in a real browser (below).

**What happy-dom cannot say, so a browser must (the morning's one visual look):** that the Cyrillic file is actually fetched for
Cyrillic text and not for Latin, and how Sora's Latin and the seam's Cyrillic sit together on one heading line. The overlap rule the
whole split rests on was measured once in Chromium, with a scratch page of two `local()` faces under one family name (the first with
no range, the later with the Cyrillic range): see the line below.
**The overlap measurement (10.10, Chromium 152.0.7977.130 – the desktop app's own pane; `l4-1-overlap-probe.html`, a scratch page that is not in the repository):** two `local()` faces under one family name – the first with no range, standing for the Latin file, the later with exactly this wave's Cyrillic `unicode-range` – against a control family holding the first face alone. At 100px the Latin word measured 301.03 px in the two-face family, in the first face alone and in the control: the later rule never touched Latin. The Cyrillic word measured 310.45 px in the two-face family, equal to the later face alone and different from the control's 361.23 px: the later rule won on the overlap. One mixed line measured 671.68 px, the sum of its two parts – one string, two faces. 8 of 8 checks. **Not measured: WebKit and Gecko.** The rule is the CSS Fonts one (the later rule wins on an overlap) and the standing trick for setting digits or one script in another face, but the app is a PWA and its likely phone is Safari, so the morning's real-browser look should include iOS.

### ⭐ T3 – LANDED (10.10, the same day): the two files are on disk
His ruling in chat, 10.10: «докачать для существующих добро, ударение не нужно, новых шрифтов не нужно» – the two faces the app already
ships (Manrope and Caveat), no stress mark, no new family (Onest is dead). Sora has no Cyrillic upstream (T1) and gets none: a Russian
heading sets its Cyrillic in Manrope through the `--font-heading-cyr` seam, which is what the seam's default always said.

**As run.** The venv and both downloads lived in a scratch directory outside the repository. `python -I -m fontTools.subset` and
`python -I -m fontTools.varLib.instancer` are the entry points that `pyftsubset` and `fonttools varLib.instancer` name (`-I` because the
interpreter was reading downloaded files). The outputs were cut into a scratch directory first and copied into `public/fonts/` only after
a baseline build, so that build measured the tree without them. Every flag is the morning commands' above:
```bash
python3 -m venv $VENV && $VENV/bin/python -m pip install fonttools brotli      # fonttools 4.66.1, brotli 1.2.0
curl -sSLf -o Manrope.ttf 'https://github.com/google/fonts/raw/main/ofl/manrope/Manrope%5Bwght%5D.ttf'   # 164,700 B · Version 4.505 · sha256 3ae11c49…
curl -sSLf -o Caveat.ttf  'https://github.com/google/fonts/raw/main/ofl/caveat/Caveat%5Bwght%5D.ttf'    # 403,648 B · Version 2.000 · sha256 0bdb6b66…
$PY -I -m fontTools.subset Manrope.ttf --unicodes='U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116' \
  --layout-features='*' --flavor=woff2 --output-file=manrope-cyr.woff2
$PY -I -m fontTools.varLib.instancer Caveat.ttf wght=600 -o Caveat-600.ttf
$PY -I -m fontTools.subset Caveat-600.ttf --unicodes='U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116' \
  --layout-features='*' --flavor=woff2 --output-file=caveat-cyr.woff2
```
(`$PY` is the venv's python. The `--unicodes` list is the CSS `unicode-range` verbatim, and **U+0301 is in neither file**: upstream Caveat
carries it (upstream Manrope does not), and the cut dropped it with everything else outside the list. To add a stress mark later, widen
the range AND this list and cut again.)

| file | bytes | glyphs | code points | axes | Russian letters | U+0301 | sha256 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `manrope-cyr.woff2` | 13,604 | 160 | 99 | wght 200..800, variable | 66 of 66, both IO | absent | `7bbcbdcd…` |
| `caveat-cyr.woff2` | 46,868 | 319 | 101 | static, wght 600 | 66 of 66, both IO | absent | `d5de69c2…` |

- **The probe.** `npm run fonts:probe -- --require-cyrillic public/fonts/manrope-cyr.woff2 public/fonts/caveat-cyr.woff2` exits 0, both
  FULL. The plain `npm run fonts:probe` reads five files: Cyrillic FULL 2 / NONE 3 (the three Latin files, bytes untouched) and
  «declared but absent on disk: none». The build prints no «didn't resolve at build time» line (it printed two before).
- **Metrics.** Each new file's `unitsPerEm`, `hhea` and `OS/2` vertical metrics equal the Latin face it pairs with (Manrope 2000 ·
  2132/-600/0 · win 2132/600; Caveat 1000 · 960/-300/0 · win 974/315), read with fontTools off the shipped and the new files, so a line
  that mixes the two files of one family keeps its height.
- **Two small facts, both harmless.** Upstream Manrope `main` is Version 4.505 and the Latin file we ship (gstatic) is 4.504 – same
  metrics, same axis range; the Latin file was not touched, so English stays byte-identical. And upstream Manrope has no U+04B0-04B1
  (Kazakh letters), so its range claims two code points its file does not carry; the browser moves to the next family for them.
- **A real engine, not happy-dom** (Chromium from the repo's Playwright, `@playwright/test` ^1.62.1, cached build 1234; the built `dist/` stylesheet and fonts served to a probe page; the
  script is a scratch file, not in the repository; the Russian sample is a six-letter word, both IO letters and the numero sign, built
  from code points). Under `lang="en"` with Latin text and under `lang="ru"` with Latin text the browser requested the three Latin files
  and **no `-cyr` file** – the `unicode-range` gate holds under Russian too. Under `lang="ru"` with Cyrillic text it fetched
  `manrope-cyr.woff2` and `caveat-cyr.woff2` (200) and reported both Cyrillic-range faces `loaded`. With the two files blocked the
  rendered widths of the body, heading and hand lines all changed (132.2 → 130.17, 190.13 → 188.61 and 125.81 → 152.81 px), so the
  glyphs on screen come from the new files. The heading token resolved to `Sora, Manrope, Manrope, system-ui…`: a Russian heading's
  Cyrillic is Manrope's.
- **The checklist, ticked.** (1) done – both entries are off `GRACEFUL_ABSENT_FONTS` (the ledger is empty; the unit net's ledger test went
  red on the landing, as designed, and is green again). One more pin moved and was re-aimed in the open: `round29p2-offline-install`'s font
  count 3 → 5, with a dated note (its real claim, every font file is in the install, did not move). A new unit pin ties the two files to
  this verdict by sha256, so a regenerated file moves it on purpose. The mounted net (`l4-1-ru-fonts`) pins nothing about absence – it
  reads the sheet's declarations, not the disk – and needed no move. (2) done – two rows and a note in `public/fonts/README.md`. (3) the
  install ceiling is re-measured (below); the full `npm run check` belongs to the gate session. (4) Chromium done as above;
  **not measured: WebKit and Gecko – iOS Safari is the owner's look**, as the overlap measurement already said.

## T4 · The bytes, measured
Cyrillic subsets cost roughly 20–60 KB per face woff2. Measured against the install ceiling by
`scripts/install-size.mjs` before shipping; his standing ruling applies – «это наше ограничение,
мы его будем неизбежно поднимать» – the ceiling moves when a real need meets it, and a language
is one.

### ⭐ T4 – EXECUTED (10.10): the numbers
`node scripts/install-size.mjs` on a fresh `vite build`, before and after this wave (HEAD `a02ae105` and the working tree):

| | install | precache entries | headroom under 18,432 KiB | CSS bundle |
| --- | --- | --- | --- | --- |
| before | 16,416 KiB | 364 | 2,016 KiB | 217.70 kB (38.51 gz) |
| after (wiring only, files absent) | 16,416 KiB | 364 | 2,016 KiB | 218.29 kB (38.61 gz) |
| projected, both subsets at the spec's 60 KB worst case | ~16,533 KiB | 366 | ~1,899 KiB | – |

The wiring costs 0.6 kB of CSS and no precache entry (an absent file is not in the manifest). The two subsets, when they land, are
the only real cost: the projection is **+117 KiB at the worst case, 6 % of the headroom**, and the ceiling does not move for them.
The real figures replace the projection in the morning's `npm run check`.

### ⭐ T4 – MEASURED AGAIN WITH THE FILES ON DISK (10.10)
`node scripts/install-size.mjs` after `vite build`, one tree, the two files absent and then present (HEAD `c05076ee`). The baseline was
re-measured rather than recalled: other commits had added 8 KiB since the table above.

| | install | precache entries | headroom under 18,432 KiB | CSS bundle |
| --- | --- | --- | --- | --- |
| files absent | 16,424 KiB | 364 | 2,008 KiB | 218.65 kB (38.67 gz) |
| files on disk | 16,483 KiB | 366 | 1,949 KiB | 218.65 kB (38.67 gz) – the same hashed file |

**+59 KiB** (13,604 + 46,868 = 60,472 B), two precache entries and not one CSS byte: half of the +117 KiB the worst-case projection
allowed, 2.9 % of the headroom, and the ceiling does not move. Both files are in `dist/sw.js`'s precache manifest, so the Russian type
works offline.
