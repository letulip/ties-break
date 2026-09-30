---
type: spec
status: current
area: delivery
last-reviewed: 2026-09-30
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

## T2 · The headings decision – his eye, two candidates rendered side by side
- **Option A – Onest** (OFL, variable, Cyrillic-native): the closest character match to Sora's
  geometric voice.
- **Option B – Manrope for headings too**: one family, zero new latin bytes, the app's look
  tightens rather than changes.
Deliverable: one HTML sample sheet, both options over real screens' headings in EN and RU, his
one-word pick. His 30.09 direction stands either way: the Cyrillic heading face loads ONLY under
the RU locale (lang-scoped, T3) – EN ships exactly today's bytes. (Golos Text and Rubik stay named as reserves.)

## T3 · The wiring
`lang`-scoped `@font-face` with `unicode-range` subsets: latin serves exactly today's bytes;
Cyrillic subsets load only under the RU locale. `--font-heading`/`--font-body` stay the only
seams (they already are – style.css's own design).

## T4 · The bytes, measured
Cyrillic subsets cost roughly 20–60 KB per face woff2. Measured against the install ceiling by
`scripts/install-size.mjs` before shipping; his standing ruling applies – «это наше ограничение,
мы его будем неизбежно поднимать» – the ceiling moves when a real need meets it, and a language
is one.
