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

### A2 · The device smoke matrix – ONE hole left
Measured by the owner 30.09: Motorola G8 Plus (2019) – «всё работает корректно»; macOS in
several formats – ok. **iOS Safari standalone is the one untested surface.** The checklist for
one evening on any iPhone: install to home screen → offline relaunch → music on the lock screen
(Media Session artwork) → a match with the screen staying awake (wakeLock) → export a save,
reimport it → the blocking dialogs on the smallest screen. No code to write unless it fails.

### A3 · Round 44 – the corpus verified by count, not by ledger
The live wave's own claim: the small-talk pool grows to 51 situations off the 43/172/516
document. The copy census (§C) counts the LIVE pool and compares; a shortfall is a finding, a
match closes the row.

### A4 · Slam – one word from him
The architect's recommendation, 30.09: **keep `'Slam'`**. It is the sport's generic vocabulary
(like «ace» or «break point»), not a tournament's name; the trademark risk lives in the majors'
proper names (Wimbledon, US Open, Roland Garros, Australian Open) and the bodies (ITF/WTA/ATP) –
none of which the game uses. The code already argues this at `season/calendar.ts:1612`. One word
(«оставляем») closes awaiting-his-word row 1.

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
document (§A3). The census is the denominator for the RU/ES conversation: RU first (the owner
authors, invariant 4 survives), ES only through a trusted human translator, both AFTER a key
extraction wave – and none of it gates the alpha.

## D · Deliberately NOT for alpha
Monetisation, accounts/cloud saves (file export is honest and shipped), store wrappers (the PWA
link IS the distribution).
