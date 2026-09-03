---
type: reference
status: current
area: tooling
last-reviewed: 2026-08-24
---

# `tools/` – the registry

**Generated** by `npm run tools:registry`. Do not hand-edit: `npm run tools:registry:check` fails
when this page and the repository disagree, and it also asserts that `tsconfig.app.json` lists
exactly the live set.

185 TypeScript files: **30 live**, **155 archival**.

## Why the split exists

Every one of these files used to enter the primary TypeScript project, so `vite build` typechecked
a hundred one-shot probes on every run, and a reader had a flat directory with no signal about
which ones are supported. The live set stays in `tsconfig.app.json`; the whole directory is still
typechecked by `npm run check:tools` (`tsconfig.tools.json`) – which runs inside `npm run check`
and as its own CI step since 02.09. It used to run on demand, which meant it ran never, and the
02.09 review found it red with nine errors across six tools.

⚠ **Archival is not dead.** A probe here is the reproduction that settled an argument, and the
review's rule is explicit: do not delete measurement instruments to reduce a file count. If a
question comes back to one, run it, and if it answers again, give it a line in `INSTRUMENTS` in
`scripts/tools-registry.mjs` – that is what promotes it back to live.

## Live

| Tool | Why it is live |
| --- | --- |
| `ad-shoot-bench.ts` | `npm run bench:adshoot` |
| `childhood-bench.ts` | `npm run bench:childhood` |
| `dead-week-probe.ts` | `npm run bench:deadweek` |
| `demo-save.ts` | writes the demo career used for screenshots and manual playtests |
| `dual-universe-bench.ts` | `npm run bench:dual` |
| `e2e-fixtures-read.ts` | imported by the test suite |
| `e2e-fixtures.ts` | `npm run e2e:fixtures` |
| `econ-bench.ts` | `npm run bench:econ` |
| `endings-bench.ts` | `npm run bench:endings` |
| `fatigue-bench.ts` | `npm run bench:fatigue` |
| `frozen-key-diff.ts` | diffs a frozen RNG capture against a live run – the instrument for "which draw moved?" when the pinned hash changes |
| `injury-landscape.ts` | the whole-career injury census behind docs/specs/the-injury-landscape-2026-08.md; re-run whenever injury rates are touched |
| `knock-rate.ts` | `npm run bench:knock` |
| `ladder-floor.ts` | `npm run bench:floor` |
| `load-bench.ts` | `npm run bench:load` |
| `money-decomposition.ts` | `npm run bench:money` |
| `outgrown-entry-probe.ts` | `npm run bench:outgrown` |
| `points-economy.ts` | `npm run bench:points` |
| `prologue-balance-bench.ts` | `npm run bench:balance` |
| `prologue-court-bench.ts` | `npm run bench:court` |
| `prologue-handover-bench.ts` | `npm run bench:handover` |
| `r31-age-curve.ts` | `npm run bench:agecurve` |
| `radar-bench.ts` | `npm run bench:radar` |
| `retired-college-rule.ts` | imported by a live tool |
| `retirement-rate.ts` | `npm run bench:retire` |
| `season-mirror.ts` | `npm run bench:mirror` |
| `shop-probe.ts` | `npm run probe:shop` |
| `skill-ceiling.ts` | `npm run bench:skill` |
| `sponsor-window-bench.ts` | `npm run bench:sponsor` |
| `world-turnover.ts` | `npm run bench:world` |

## Archival

One-shot probes and reproductions. Kept as evidence; typechecked by `npm run check:tools`, which
the gate now runs – so evidence that stops compiling reddens a pull request instead of rotting.

- `_seeds.ts` · `acceptance-cuts.ts` · `aer-cohort.ts` · `age-clock-cost.ts`
- `age-composition.ts` · `age-gate-shift.ts` · `age-injury-fit.ts` · `band-probe.ts`
- `band-vs-field.ts` · `best16-bench.ts` · `big-draw-cost.ts` · `big-rung-finishes.ts`
- `big-rung-odds.ts` · `birthday-age-read.ts` · `birthday-pool.ts` · `boredom-guard.ts`
- `brand-dynamics.ts` · `brand-gate-bench.ts` · `calendar-shape.ts` · `career-vs-bench.ts`
- `ceiling-walk.ts` · `clone-bench.ts` · `coach-court-price.ts` · `coach-eye-bench.ts`
- `coach-ladder-claim-probe.ts` · `coach-line-drift.ts` · `coach-travel-bench.ts` · `college-choice-probe.ts`
- `college-fork.ts` · `college-freeze-probe.ts` · `college-home-place.ts` · `college-news-probe.ts`
- `college-price-probe.ts` · `college-return-probe.ts` · `college-talent-bands.ts` · `college-year-content.ts`
- `commentary-register-probe.ts` · `commentary-rung-probe.ts` · `compound-cost.ts` · `counting-window.ts`
- `deep-run-cost.ts` · `domestic-ladder-probe.ts` · `domestic-season-to-date.ts` · `double-booked.ts`
- `draw-vs-band.ts` · `drought-probe.ts` · `empty-week-census.ts` · `failure-modes.ts`
- `fatigue-ledger-diag.ts` · `feed-audit.ts` · `field-quality.ts` · `fifth-skill-probe.ts`
- `first-pair-replay.ts` · `first-ranking-probe.ts` · `fork-birthday-probe.ts` · `grid-visibility.ts`
- `growth-age-sweep.ts` · `growth-pace-probe.ts` · `head-ladder-sweep.ts` · `his-cadence-probe.ts`
- `his-cadence-read.ts` · `his-careers-brackets.ts` · `his-careers-dose.ts` · `injury-audit.ts`
- `injury-cause-probe.ts` · `injury-ratio-probe.ts` · `injury-saves-read.ts` · `j30-onramp-lock.ts`
- `junior-access.ts` · `junior-door-calibration.ts` · `kid-share-audit.ts` · `kit-bench.ts`
- `ladder-baseline.ts` · `ladder-vs-targets.ts` · `ladder-walk.ts` · `live-table-inflation.ts`
- `load-and-injury.ts` · `market-probe.ts` · `masseur-bench.ts` · `match-clock-probe.ts`
- `merch-fame-vs-rank.ts` · `mirror-probe.ts` · `mixed-ladder-impact.ts` · `nation-depth.ts`
- `next-goal-bench.ts` · `odds-calibration.ts` · `one-clock.ts` · `opener-price-bench.ts`
- `outcome-odds.ts` · `plateau-probe.ts` · `play-down-probe.ts` · `points-audit.ts`
- `points-curve.ts` · `policy-vs-owner.ts` · `population-depth.ts` · `potential-band-sweep.ts`
- `preview-drift.ts` · `pro-season-probe.ts` · `r29-item14-anger.ts` · `r29-item14-read.ts`
- `r29p2-savings-sweep.ts` · `r31-draw-promise.ts` · `r31-draw-stability.ts` · `r31-elite-tenure.ts`
- `r31-exit-where.ts` · `r31-her-arc.ts` · `r31-peak-share.ts` · `r31-surface-kings.ts`
- `r31-tier-ladder.ts` · `r31-top100-age.ts` · `r31-winrate-trend.ts` · `r32-brand-inertia.ts`
- `r34-brand-foot.ts` · `r34-calendar-tiers.ts` · `r34-domestic-reset.ts` · `r34-field-chance.ts`
- `r34-reachable-ceiling.ts` · `r34-savings-income.ts` · `r34-zero-lock.ts` · `r35-brand-share.ts`
- `r35-draw-fact.ts` · `reach-sweep.ts` · `real-vs-bench.ts` · `rehab-lever.ts`
- `restore-bench.ts` · `retirement-shape-probe.ts` · `rival-fatigue-audit.ts` · `round15-read.ts`
- `round16-read.ts` · `round17-read.ts` · `round18-read.ts` · `round23-read.ts`
- `round26-probe.ts` · `runway-probe.ts` · `school-bench.ts` · `season-anchor-read.ts`
- `skill-gap-odds.ts` · `slam-difficulty.ts` · `slam-door-cost.ts` · `sponsor-ladder-reach.ts`
- `summer-bench.ts` · `teen-at-the-top.ts` · `top50-season-probe.ts` · `two-cells.ts`
- `two-seasons-read.ts` · `two-tour-overlap.ts` · `w-onramp-probe.ts` · `wall-freeze-probe.ts`
- `wall-l1-bench.ts` · `wallet-audit.ts` · `week-story-trace.ts` · `what-drives-progress.ts`
- `what-money-buys.ts` · `wild-card-reach.ts` · `winrate-read.ts`
