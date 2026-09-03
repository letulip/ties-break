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

The `OFL-*.txt` texts are verbatim from the [google/fonts](https://github.com/google/fonts)
repository (`ofl/sora/OFL.txt`, `ofl/manrope/OFL.txt`, `ofl/caveat/OFL.txt`), upstream
copyright lines included.

Notes:

- The woff2 files are **latin subset only**. The planned RU localization
  (`docs/plan.md`, post-v1 backlog) will need Cyrillic subsets of at least Manrope
  and Caveat – swap the files, keep the names, and the OFL texts stay valid as is.
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
