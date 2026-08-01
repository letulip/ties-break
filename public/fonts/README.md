# Fonts

Self-hosted type trio (see the note at the top of `src/style.css`): Sora for headings,
Manrope for body text, Caveat for the things meant to look written by hand. All three
are licensed under the SIL Open Font License 1.1 – the OFL **requires** that every copy
of the Font Software travel with its copyright notice and the license text, which is
exactly what the `OFL-*.txt` files beside the woff2 are. Do not remove them, and if you
add a font family, add its OFL file in the same move (`tests/legal-assets.test.ts` checks).

| file                | family / weight        | source                                   | license                              |
|---------------------|------------------------|-------------------------------------------|--------------------------------------|
| `sora-600.woff2`    | Sora SemiBold (600)    | Google Fonts (gstatic), latin subset only | SIL OFL 1.1 – [`OFL-Sora.txt`](OFL-Sora.txt)       |
| `manrope-400.woff2` | Manrope Regular (400)  | Google Fonts (gstatic), latin subset only | SIL OFL 1.1 – [`OFL-Manrope.txt`](OFL-Manrope.txt) |
| `manrope-500.woff2` | Manrope Medium (500)   | Google Fonts (gstatic), latin subset only | SIL OFL 1.1 – [`OFL-Manrope.txt`](OFL-Manrope.txt) |
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
