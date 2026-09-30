---
type: spec
status: current
area: delivery
last-reviewed: 2026-09-30
---

# The feedback channel (P1 · alpha blocker · his rulings of 30.09)

One prominent control that sends a report WITH the save attached. Rulings: prominent (More /
settings – the exact spot is his at the strings pass); reports go to `FEEDBACK_ADDRESS` – ruled
30.09 as **feedback@ties-brake.com** ⚠ AS WRITTEN, with the architect's flag standing: the game
is «Ties Break», the ruled domain spells «ties-brAke» – confirmed or corrected in one word, and
it is ONE constant either way (provisional until the domain registers, his note).

## The report
- the build line (`scripts/build-stamp.mjs`'s baked value – the app already renders it);
- the tail (~20 rows) of an in-memory error ring buffer: `window.onerror` +
  `unhandledrejection`, module-scope, no storage, no network – privacy by construction;
- the ACTIVE career's export file, exactly what the Saves strip produces.

## The transport – one adapter, `shareReport()`, three backends by feature-detect
1. **Web Share API with files** (`navigator.canShare({files})`): Android Chrome (browser, PWA
   and TWA shell – TWA runs IN Chrome, so it simply works), iOS Safari 15+ incl. standalone.
   Share sheet → Gmail → the save arrives attached. Two taps.
2. **The wrapper bridge slot**: a WKWebView (iOS Capacitor shell) does NOT expose
   `navigator.share` – the shell injects its Share plugin behind the same adapter face
   (docs/specs/app-shells-2026-10.md owns the injection; this spec owns the slot).
3. **Fallback (desktop, Electron/Steam)**: download the export + open `mailto:` prefilled with
   the build line and the error tail (⚠ mailto CANNOT attach files and its body caps ~2KB – the
   sentence asks to attach the just-downloaded file; DRAFT).

## Law
- Every sentence is a DRAFT row in a strings table with the roundtrip pin (invariant 4).
- Engine untouched; the buffer and adapter live in `src/` app-side (`pwa.ts`-adjacent).
- Mounted tests: the control reachable and inside 375×667 (mutation-proved); the adapter arms
  (share path called with a File; fallback path downloads + opens mailto – spies); the report
  text carries the build line and the buffer tail (mutate → red). No telemetry, asserted: zero
  network calls from the module (spy on fetch/XHR).

Size: one small wave – S1 buffer+adapter+engine-of-report, S2 the control+dialog+strings, S3
mounted tests+gates. Builder plan on «делай».
