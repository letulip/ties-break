---
type: report
status: current
area: delivery
last-reviewed: 2026-09-30
---
# Handoff – feat/feedback-channel (30.09.2026)

## Shipped (stacked on docs/alpha-readiness at ca160da1)
- F1 `8f31367d` – src/errorBuffer.ts (ring of 20, window.onerror + unhandledrejection,
  idempotent), src/feedback.ts (FEEDBACK_ADDRESS, assembleReport off the worker's own
  exportSave bytes + the app's own build line, shareReport with share→bridge→fallback and the
  1,800-char mailto cut), main.ts wiring. Nine mutation arms.
- F2 `24ca7f49` – FeedbackDialog.vue (assembles at open; Send passes the PREPARED report – no
  await between tap and share, mutation-pinned), the More control beside the Saves strip
  (reachable with no career), three recordError lines in stores/game.ts (pin query 9/9 green),
  the strings pair (FB1–FB16, whole-literal stripped-code pin), ~25 arms incl. the D6b bound
  control.
- The share-type verdict: the export is BINARY (44-byte header + gzip, tests decode the real
  bytes) → `application/octet-stream` stays; Android's file-share allowlist likely refuses it.

## Open
- **The wording pass – FB1–FB16** (docs/plans/feedback-strings-2026-09.md), his, at the PR;
  the control's exact spot is his there too (it sits after the Saves strip, before Danger zone).
- **Two smoke rows** (the device checks no code can answer): on his Motorola – does the share
  sheet offer Gmail with the .tsave attached, or does it fall back (both are handled; which one
  IS the Android path decides whether a text-wrapper share is worth revisiting); iOS Safari
  standalone – the whole §A2 checklist plus this control.
- reloadAfterRestart's inner catch is not fed to the ring (the first cause already is); ordinary
  refusals share the 20-row ring with real errors – widen only if the Moto/iOS reports say so.
- The Electron shell must route `mailto:` (app-shells spec §S2 already carries the note).

## Gates (30.09, quiet machine, verdicts from files with fresh mtime)
- check: CHECK_EXIT=0 (/tmp/fb-gate-check.log 21:20) · sim: TESTSIM_EXIT=0, 13 files 448s ·
  e2e: E2E_EXIT=0, 139 · component: COMPONENT_EXIT=0, 247/247 (21:30). Capture unmoved (inside
  check). Schema untouched.
