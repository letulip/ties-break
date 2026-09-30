---
type: plan
status: current
area: delivery
last-reviewed: 2026-09-30
---

# Alpha readiness – the checklist (30.09.2026)

His ask: «чего нам может не хватать для полноценного alpha/beta запуска?» – this page is the
answer as a worked checklist. The game itself is not the gap: 44 rounds of playtest fixes, a
pinned deterministic engine, schema v90 with migrations, offline-first. What is left is the
harness around the moment a STRANGER holds the link.

## A · Alpha blockers

### A1 · The feedback channel (his «да, это важная штука» – ruled 30.09)
One prominent control (More / settings, his call on the exact spot at the strings pass) that
sends a report WITH the save attached. His rulings: prominent placement; reports go to
**letulip13@gmail.com** (his explicit 30.09 instruction; ⚠ the address ships in a
source-available client – inherent to any mailto/share target, flagged, accepted by naming it).
- ⚠ DESIGN FACT: `mailto:` cannot attach files and its body caps at ~2KB – «сейв сразу в
  письме» is NOT reachable through mailto alone. The honest mechanics:
  - **Web Share API with files** (`navigator.share({files: [save], text: version+error tail})`) –
    Android/iOS share sheet → Gmail → the save arrives attached, two taps. This is the primary
    path and it covers his own playtest devices.
  - **Desktop fallback**: download the save file + open `mailto:` prefilled with the build line
    and a «attach the file that just downloaded» sentence (DRAFT).
- The report carries: the build line (`scripts/build-stamp.mjs`'s baked value), the last ~20
  entries of an in-memory error buffer (`window.onerror` + `unhandledrejection`, no storage, no
  telemetry – privacy by construction), and the export of the ACTIVE career.
- Every sentence is a DRAFT row in a strings table (invariant 4).
- Size: one small wave (engine untouched; UI + pwa glue + mounted tests incl. 375×667).
- ⚠ The full design moved to its own spec 30.09: [feedback-channel-2026-09.md](../specs/feedback-channel-2026-09.md)
  – incl. the ruled address (feedback@ties-brake.com, the brAke/brEak flag standing) and the
  answer to «а в standalone это будет работать?»: Android/TWA yes natively, iOS wrapper via a
  bridge slot, desktop by fallback.

### A2 · The device smoke matrix – ONE hole left
Measured by the owner 30.09: Motorola G8 Plus (2019) – «всё работает корректно»; macOS in
several formats – ok. **iOS Safari standalone is the one untested surface.** The checklist for
one evening on any iPhone: install to home screen → offline relaunch → music on the lock screen
(Media Session artwork) → a match with the screen staying awake (wakeLock) → export a save,
reimport it → the blocking dialogs on the smallest screen. No code to write unless it fails.

### A3 · Round 44 – ✅ CLOSED 30.09 by the census's count
The LIVE pool (imported `SMALL_TALK_SITUATIONS`) is **51 situations / 204 openers / 612 replies,
all four voices in all 51, zero duplicate ids** – the wave's own claim exact. The 43/172/516
figures are the OLDER document, stale by +8/+32/+96; one line of that doc wants the new numbers
(a follow-up ride-along, not a blocker). ⚠ One real finding beside it: **30 registered rows of
life-wave-6's «noise» pool exist in no `src` literal** – never shipped, reworded, or composed at
runtime; worth one look before beta (§B).

### A4 · Slam – ✅ CLOSED 30.09: «оставляем»
The architect's recommendation, 30.09: **keep `'Slam'`**. It is the sport's generic vocabulary
(like «ace» or «break point»), not a tournament's name; the trademark risk lives in the majors'
proper names (Wimbledon, US Open, Roland Garros, Australian Open) and the bodies (ITF/WTA/ATP) –
none of which the game uses. The code already argues this at `season/calendar.ts:1612`. His word landed 30.09; awaiting-his-word row 1 is closed.

## B · Beta list (does not gate alpha)
- Round 8 #1 – the in-tournament player card (open since 25.07, the oldest item).
- Tab ownership (Web Locks lease) – alpha is covered by the save-conflict Reload (W7 T7.0).
- The shape rulings before a WIDE beta: the-long-goodbye §7 (the career ceiling / the Federer
  dial), Slam wild cards' condition-at-arrival measurement, the grant's presentation.
- Standing wave rules: an e2e case per shipped mechanic; the `TIER_LADDER.indexOf` 33-file sweep
  when a wave has no neighbours there.

## C · The copy census (feeds the localization decision – ordered 30.09)
`tools/copy-census.ts`: an extractor that classifies string literals and template text into
CERTAIN player-facing (copy pools, ECONOMY `label`/`blurb`, letters, refusal sentences, `.vue`
template text and title/aria attributes), LIKELY, and EXCLUDED (ids, keys, paths, seeds), and
prints words + strings per area (diary, beats, letters, shop, album, screens…). Two headline
numbers: the whole player-facing corpus in words, and the live small-talk pool vs the 43/172/516
document (§A3).

**Measured 30.09** (`tools/copy-census.ts`, commit 1f5d0b7b; deterministic, byte-identical runs):
- **CERTAIN player-facing: 3,709 strings / 34,724 words** (3,097 unique – what a translator
  bills once); LIKELY (sampled 20/20 clean player copy): 1,684 / 16,838; grand total **51,562
  words**, plus `src/prologue` (1,968 words of narration) and `src/viz` (966) measured outside
  the totals – the honest full corpus is ≈ **55k words / ≈5k unique strings**.
- Biggest homes: the small-talk corpus 13.5k words, album 4.2k, life-beat pools 2.8k, diary 2.7k.
- **Interpolation load is SMALL and concentrated**: only 10.1% of CERTAIN strings carry `${…}`,
  and the copy pools carry none – the RU plural/case work lives almost entirely in ledger
  sentences (24%) and screen text (30%), a few hundred strings, not thousands.
- Recall measured against the wave string tables: 225 of 404 registered rows found CERTAIN, 102
  LIKELY, 40 not found in source at all (30 = the life-wave-6 noise pool, §A3's finding).

The census is the denominator for the RU/ES conversation: RU first (the owner
authors, invariant 4 survives), ES only through a trusted human translator, both AFTER a key
extraction wave – and none of it gates the alpha.

## E · The launch ladder beyond alpha (his 30.09 commissions, in priority order)
1. **P1 – the feedback channel** ([feedback-channel-2026-09.md](../specs/feedback-channel-2026-09.md)) – the alpha blocker.
2. **P2 – the three shells** ([app-shells-2026-10.md](../specs/app-shells-2026-10.md)) – Android
   TWA → Windows/Steam Electron → iOS Capacitor, local terminal scripts, one orchestrator.
3. **P3 – RU typography** ([ru-typography-2026-09.md](../specs/ru-typography-2026-09.md)) – the
   cmap probe, the headings decision (Sora has no Cyrillic; Manrope and Caveat's families do),
   lang-scoped subsets. Gated on the RU go, not on alpha; the translation itself is his side.

## D · Deliberately NOT for alpha
Monetisation, accounts/cloud saves (file export is honest and shipped), store wrappers (the PWA
link IS the distribution).
