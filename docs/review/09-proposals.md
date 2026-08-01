<!-- Build-ready proposals derived from the 2026-08-01 full review. Reviewed at b7a9358. -->

# Proposals – from review findings to build-ready work

Nine proposal packages covering every critical/high finding and the highest-value mediums of the [full review](README.md). Each is a standalone build-ready document in [proposals/](proposals/): evidence-cited problem, defended design decision, ordered implementation sketch with real file/function names, TDD test plan, acceptance criteria, risks, dependencies. All of them respect the engine's standing invariants: MAIN-stream draw-count stability, schema bump + migration + golden fixture for any save change, no Vue/Pinia imports in the engine, one branch per wave.

## The list

| ID | Proposal | Tier | Effort | Depends on |
|---|---|---|---|---|
| [P1](proposals/P1-endings.md) | Career endings – bankruptcy (grace window), retirement, the last injury, the reckoning screen | 1 – product-critical | L | none (P2 plugs `'quit'` in later) |
| [P2](proposals/P2-pillar3-morale-relationship.md) | Pillar 3 minimum viable psyche – morale + parent-kid bond, wired to existing levers only | 1 – product-critical | L | none; coordinate schema № with P3 |
| [P3](proposals/P3-rng-persistence.md) | Persist RNG stream state (schema v35) – O(1) loads, retire the frozen-capture tax | 2 – engine debt | L | none; land before P4 and new-feature randomness |
| [P4](proposals/P4-world-decomposition.md) | world.ts staged decomposition – 15 single-concern modules behind an unchanged barrel, 15 mechanical PRs | 2 – engine debt | L | none hard; sequence around P1/P2/P3 merges |
| [P5](proposals/P5-dual-universe-bench.md) | Dual-universe double-pay – paired-seed bench first, pay one universe only if material | 2 – engine debt | L | none; Phase A before any ranking retune |
| [P6](proposals/P6-quick-wins-wave.md) | Quick-wins wave – shared money formatter (×15 dedup), engine-sourced starting funds, DEV-gated fast-forward, green `test:sim`, theme-color sync | 3 – quick wins | M | none |
| [P7](proposals/P7-legal-provenance-wave.md) | Legal & provenance wave – LICENSE (PolyForm Shield recommended), font OFL texts, art manifest, PRIVACY.md, .github set | 3 – quick wins | M | none |
| [P8](proposals/P8-mobile-platform-wave.md) | Mobile platform wave – top safe-area, system back closes surfaces, dialog semantics + live regions | 4 – platform hygiene | L | none; P9 later upgrades its manual checks to tests |
| [P9](proposals/P9-quality-infrastructure.md) | Quality infrastructure – first mounted component tests, ESLint, coverage, ~1 MB off the precache, audio caching, release discipline | 4 – platform hygiene | L | P6 (money test co-lands red→green) |

Effort scale: S <0.5d · M 0.5–2d · L 2–5d · XL >5d.

## Recommended execution order

One branch per wave, PRs to GitHub origin, owner merges – the packages are sequenced so the cheap certainty lands first and every engine-heavy step makes the next one cheaper:

1. **P6 – quick wins.** Zero schema/draw impact, kills the live money-unit trap, turns Monday's calibration cron green. Do this first for momentum and honest CI.
2. **P7 – legal wave.** Independent paperwork; removes the "legally floating" state before the repo gets more visible. Can run in the same week as P6 (separate branch, no file overlap).
3. **P3 – RNG persistence.** Before any big engine work: it deletes the frozen-capture constraint that P1/P2/P5 would otherwise each have to argue against, and fixes load time for good. Takes **schema v35**.
4. **P1 – endings.** The review's #1 product action. Takes **v36** (after P3; the two proposals were written to coordinate their version numbers – whichever lands second takes the next number).
5. **P2 – pillar 3 psyche.** Takes **v37**. Plugs `'quit'` pressure into P1's `CareerEnding` union; unlocks the burnout finale and the diary parent-voice work later.
6. **P4 – world.ts split**, interleaved. Fifteen mechanical, individually-green extraction PRs – schedule them in the gaps between the feature waves above (never concurrent with a feature PR touching the same region; the proposal maps which extraction blocks on which wave).
7. **P5 – dual-universe.** Phase A (bench only, no engine change) can run any time and MUST run before any ranking-points retune; Phase B only if the pre-registered materiality threshold trips.
8. **P8 – mobile wave**, then **P9 – quality infrastructure** (or swapped; P9's component tests are what turn P8's hand-verified a11y items into regression-proof ones, so P8→P9 is the natural order).

## Coordination notes

- **Schema versions:** P3, P1, P2 each bump the save schema and add a golden fixture. The documents assume landing order P3→P1→P2 (v35→v36→v37); if the owner reorders, renumber – the migrations are independent.
- **world.ts contention:** P1, P2, P5-B and every P4 extraction edit `world.ts`. The one-branch-per-wave rule handles this naturally – just never run a P4 extraction PR concurrently with a feature wave.
- **README honesty:** P1+P2 together close the gap between README's pillar claims and the build. If either Tier 1 package is deferred, P2 contains the exact re-scope wording for README/lore as its documented fallback – the claims should not stay in present tense either way.
