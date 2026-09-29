---
type: report
status: current
area: project-review
last-reviewed: 2026-09-29
---
# Handoff – fix/principles-w7 (29.09.2026)

The first physical wave boundary under docs/context/token-discipline.md §4. A fresh session
resumes from THIS file, not from any prior session's history.

## Shipped
- T7.0 `15aedb6f`+`7f594e15` – the save-conflict card's Reload control (label `Reload`, DRAFT row
  PF6); the button lives INSIDE the refusal `<p>` – a sibling made the component a two-root
  fragment and silently cost every host's scoped `.error` rules (nothing in 2,576 component tests
  measured it; now `principles-w7-reload.test.ts` (i) does).
- T7.1 `3b767482`+`059252d3` – `scripts/notes-pointers.mjs` in `npm run check` and CI: every
  `docs/notes/…#anchor` in `src` resolves or the gate is red. Slug is GitHub-exact (no hyphen
  collapse, underscores kept) so anchors scroll when clicked in a PR.
- T7.2 `c26e6146` – state.ts schema chronicle (v36–v89, 870 lines) → docs/notes/engine/
  save-schema-history.md, verbatim both-ways-proved.
- T7.3 `1e85547a` – `ECONOMY` split into 44 modules under src/engine/economy/, essays → 40 notes
  files; sha256-of-values pin + deep key-order pin (now a standing gate for tuning waves);
  `bench:econ` byte-identical across the split (architect's two-arm measurement, HEAD~1 vs HEAD).
  ⚠ erratum: the commit message says «191-odd importers»; measured 387. Cannot amend.
- T7.4 `5b06d7cb` – 20 life-beat kind modules' chronicles → 14 notes files (123 runs).
- T7.4b `ad57e9b8` – the hub's 156 runs (2,706 lines) → docs/notes/life-beats/hub.md; compiler
  proof: comment-stripped transpile byte-identical.
- T7.6 `444dc2af` – composables/shop.ts → docs/notes/money/shop.md (28 runs); strict date finder
  (no neighbour dates), builder refuses when an owner quote drops out of a retained block.
- `c2bacd9b` – a06 hub ceiling ratcheted 4850 → 3345 (bite-checked red at 3199).
- Code graph rebuilt and current after the 44 new modules.

## T7.5 – the wave's measurement (from each task's verified report)
| module set | lines before → after | notes lines | raw-read tokens |
|---|---|---|---|
| world/state.ts | 2,469 → 1,840 | 1,090 | −25.1% |
| economy.ts (+44 modules) | 8,943 → 5,405 | 7,192 | O1 −21%, one block ≈5.9k |
| lifeBeat kinds (20 files) | 4,165 → 2,275 | 3,750 | comment share 78→59% |
| lifeBeat.ts hub | 4,707 → 3,200 | 3,498 | comment share 71→57% |
| composables/shop.ts | 1,135 → 813 | 700 | comment chars 59.4k→35.5k |
601 pointers under the gate; 0 pins weakened; 0 repoints needed across all moves.

## Open
- The strings table (PF1–PF6, ES1–ES5, AS1–AS19) awaits the owner's wording pass at the PR.
- lifeBeat.ts and shop.ts remain over context-audit's informational WARNING thresholds (not
  errors): short runs (<8 lines) and retained blocks are by design out of the move law's scope.
- hub.md is ~58.6k tokens; splitting it by concern was DECLINED (notes are read per-anchor).
- ~11 historical docs cite `lifeBeat.ts:NNN` line numbers that were stale before this wave.
- PR assembly for w1…w7 via the `pull-request` skill when the owner calls; branches are stacked,
  merge in order, W1 first.

## Files touched (by area)
- src/engine/world/state.ts · src/engine/economy.ts + src/engine/economy/*.ts (44) ·
  src/engine/world/lifeBeat.ts + lifeBeat/*.ts (20) · src/composables/shop.ts ·
  src/components/ui/StoreError.vue · src/stores/game.ts
- docs/notes/: engine/ (1), economy/ (40), life-beats/ (15), money/ (1)
- scripts/notes-pointers.mjs · package.json · .github/workflows/ci.yml
- tests: notes-pointers (+fixtures), principles-w7-reload, principles-t73-economy-identity,
  principles-fix-strings-roundtrip (count 5→6), a06 ceiling, two re-aimed refusal-surface pins

## Gates (29.09, quiet machine, verdicts from files with fresh mtime)
- check: CHECK_EXIT=0 (/tmp/w7-gate-check.log 15:53)
- sim: TESTSIM_EXIT=0 – 13 files green in 470s (/tmp/w7-gate-sim.log 16:01)
- e2e: E2E_EXIT=0 – 139 passed in 50s (/tmp/w7-gate-e2e.log 16:02)
- component: COMP_EXIT=0 – 245 files after the CI-red fix (storage contract enforced; time-bound
  door waits). ⚠ The PR's first CI run caught what no local gate list held: test:component was in
  neither check nor the pull-request skill – the skill carries it now (step 2a-bis).
