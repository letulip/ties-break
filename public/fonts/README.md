# Fonts

Self-hosted type trio (see the note at the top of `src/style.css`): Sora for headings,
Manrope for body text, Caveat for the things meant to look written by hand. All three
are licensed under the SIL Open Font License 1.1 – the OFL **requires** that every copy
of the Font Software travel with its copyright notice and the license text, which is
exactly what the `OFL-*.txt` files beside the woff2 are. Do not remove them, and if you
add a font family, add its OFL file in the same move (`tests/legal-assets.test.ts` checks).

| file                | family / weight        | source                                   | license                              |
|---------------------|------------------------|-------------------------------------------|--------------------------------------|
| `sora-var.woff2`    | Sora, variable **wght 400–800** | Google Fonts (gstatic), latin subset only | SIL OFL 1.1 – [`OFL-Sora.txt`](OFL-Sora.txt)       |
| `manrope-var.woff2` | Manrope, variable **wght 200–800** | Google Fonts (gstatic), latin subset only | SIL OFL 1.1 – [`OFL-Manrope.txt`](OFL-Manrope.txt) |
| `caveat-600.woff2`  | Caveat SemiBold (600)  | Google Fonts (gstatic), latin subset only | SIL OFL 1.1 – [`OFL-Caveat.txt`](OFL-Caveat.txt)   |
| `manrope-cyr.woff2` | Manrope, variable **wght 200–800**, **Cyrillic subset** (13,604 B) | google/fonts `ofl/manrope/Manrope[wght].ttf` (v4.505), cut to U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116 – 10.10 | SIL OFL 1.1 – [`OFL-Manrope.txt`](OFL-Manrope.txt) |
| `caveat-cyr.woff2`  | Caveat SemiBold (600), **Cyrillic subset** (46,868 B) | google/fonts `ofl/caveat/Caveat[wght].ttf` (v2.000), pinned at wght=600, cut to the same range – 10.10 | SIL OFL 1.1 – [`OFL-Caveat.txt`](OFL-Caveat.txt)   |

The `OFL-*.txt` texts are verbatim from the [google/fonts](https://github.com/google/fonts)
repository (`ofl/sora/OFL.txt`, `ofl/manrope/OFL.txt`, `ofl/caveat/OFL.txt`), upstream
copyright lines included.

Notes:

- The first three woff2 files in the table are **latin subset only** – measured, not assumed: `npm run fonts:probe` reads
  each file's `cmap` and finds 0 Cyrillic code points in all three (L4-1, 10.10). The RU locale gets its Cyrillic as
  ADDITIONAL files – `manrope-cyr.woff2` and `caveat-cyr.woff2`, the last two rows, declared in `src/style.css` with a
  Cyrillic-only `unicode-range` – so the Latin files are not swapped and English renders from exactly the bytes it always
  did. The two landed 10.10, on the owner's ruling: the faces the app already ships, no new family, no stress mark
  (U+0301 is in neither file nor in either range). Both carry all 66 Russian letters, the two IO letters included, and the
  numero sign: `npm run fonts:probe -- --require-cyrillic public/fonts/manrope-cyr.woff2 public/fonts/caveat-cyr.woff2`
  exits 0. Sora has no Cyrillic upstream and ships none – a Russian heading sets its Cyrillic in Manrope (the
  `--font-heading-cyr` seam in `src/style.css`). The commands that cut them, the upstream versions and the measured bytes
  are in `docs/specs/ru-typography-2026-09.md` §T3. The OFL texts stay valid as they are: same two families. One quirk,
  harmless: upstream Manrope has no U+04B0-04B1 (Kazakh letters), so its range claims two code points its file does not
  carry, and the browser falls through to the next family for them.
- Vite copies `public/` into `dist/` verbatim, so the deployed site carries the license
  texts next to the fonts automatically. The service-worker precache glob
  (`vite.config.ts`) covers `woff2` but not `.txt`/`.md`, so none of this adds a byte
  to the offline install.
- Asset provenance elsewhere: music in [`../music/README.md`](../music/README.md),
  sound effects in [`../sounds/README.md`](../sounds/README.md), art in
  [`../images/README.md`](../images/README.md).


## ⭐ Why two files became variable (round 35 #8, 03.09.2026)

The stylesheet asked these two families for **seven faces they did not ship** – Sora 700/800 and
Manrope 600/700/800 – across **235 rules**, and a mounted Home had **111 elements** rendering with
SYNTHETIC bold: the browser drawing each stroke a second time, offset. Five static files were the
plan, at about 72 KB. Google now serves both families as VARIABLE fonts, so **two files replace
three** and carry every weight between them:

    was  manrope-400 14,108 + manrope-500 14,044 + sora-600 15,000  =  43,152 bytes
    is   manrope-var 24,576 + sora-var    25,240                    =  49,816 bytes   (+6.5 KB)

⚠ The ranges above are read off each file's own `fvar` table, not off a reference page. Caveat stays
a single static face: it is asked for at 600 and nowhere else.
