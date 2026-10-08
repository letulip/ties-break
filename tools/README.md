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

282 TRACKED TypeScript files: **65 live**, **217 archival**
(of which **113 frozen** out of `check:tools` and **104 still swept**).

## Why the split exists

Every one of these files used to enter the primary TypeScript project, so `vite build` typechecked
a hundred one-shot probes on every run, and a reader had a flat directory with no signal about
which ones are supported. The live set stays in `tsconfig.app.json`; the swept half is typechecked
by `npm run check:tools` (`tsconfig.tools.json`) – which runs inside `npm run check` and as its own
CI step since 02.09. It used to run on demand, which meant it ran never, and the 02.09 review found
it red with nine errors across six tools.

⚠ **Archival is not dead.** A probe here is the reproduction that settled an argument, and the
review's rule is explicit: do not delete measurement instruments to reduce a file count. If a
question comes back to one, run it, and if it answers again, give it a line in `INSTRUMENTS` in
`scripts/tools-registry.mjs` – that is what promotes it back to live.

⚠ **The list is read off the INDEX, not the directory** (H-03, 26.09). An untracked probe sitting
in `tools/` is invisible here and is not compiled by `check:tools`; a `git add`ed one is both. A
gate's verdict is a function of the commit, never of whatever else a checkout happens to hold.

## Live

| Tool | Why it is live |
| --- | --- |
| `_args.ts` | imported by the test suite |
| `_birthday.ts` | imported by the test suite |
| `_fmt.ts` | imported by a live tool |
| `_knocks.ts` | imported by the test suite |
| `_lifeBeats.ts` | imported by the test suite |
| `_spotlight.ts` | imported by a live tool |
| `_stats.ts` | imported by a live tool |
| `ad-shoot-bench.ts` | `npm run bench:adshoot` |
| `album-corpus-emit.ts` | writes src/engine/world/albumCorpus.ts out of docs/specs/album-corpus-2026-09.md – the ONLY legitimate way to change the album's 400 handwritten strings, because the catalogue is generated from the document and never retyped; re-run with --write after any owner edit to that spec; idempotent – a re-run over a correct module changes nothing, and the hand-written comment block above an occasion and its voice order are carried, not dropped (--out <path> is the temp mode) |
| `album-corpus-parse.ts` | imported by the test suite |
| `chemistry-bench.ts` | `npm run bench:chemistry` |
| `childhood-bench.ts` | `npm run bench:childhood` |
| `coach-raise-bench.ts` | `npm run bench:coachraise` |
| `copy-census-walk.ts` | imported by the test suite |
| `copy-text.ts` | imported by the test suite |
| `dead-week-probe.ts` | `npm run bench:deadweek` |
| `demo-save.ts` | writes the demo career used for screenshots and manual playtests |
| `dual-universe-bench.ts` | `npm run bench:dual` |
| `dynasty-bench.ts` | `npm run bench:dynasty` |
| `e2e-fixtures-read.ts` | imported by the test suite |
| `e2e-fixtures.ts` | `npm run e2e:fixtures` |
| `econ-bench.ts` | `npm run bench:econ` |
| `endings-bench.ts` | `npm run bench:endings` |
| `fatigue-bench.ts` | `npm run bench:fatigue` |
| `form-bench.ts` | `npm run bench:form` |
| `form-g-sweep.ts` | `npm run bench:gsweep` |
| `frozen-key-diff.ts` | diffs a frozen RNG capture against a live run – the instrument for "which draw moved?" when the pinned hash changes |
| `i18n-check.ts` | imported by the test suite |
| `i18n-cli.ts` | `npm run i18n:extract` |
| `i18n-extract.ts` | imported by the test suite |
| `i18n-import.ts` | imported by the test suite |
| `i18n-pseudoloc.ts` | imported by the test suite |
| `injury-landscape.ts` | the whole-career injury census behind docs/specs/the-injury-landscape-2026-08.md; re-run whenever injury rates are touched |
| `knock-rate.ts` | `npm run bench:knock` |
| `ladder-floor.ts` | `npm run bench:floor` |
| `life-arrival.ts` | `npm run bench:life-arrival` |
| `load-bench.ts` | `npm run bench:load` |
| `masseur-raise-bench.ts` | `npm run bench:masseurraise` |
| `money-decomposition.ts` | `npm run bench:money` |
| `outgrown-entry-probe.ts` | `npm run bench:outgrown` |
| `points-economy.ts` | `npm run bench:points` |
| `prologue-balance-bench.ts` | `npm run bench:balance` |
| `prologue-court-bench.ts` | `npm run bench:court` |
| `prologue-handover-bench.ts` | `npm run bench:handover` |
| `psy-grid.ts` | `npm run bench:psy` |
| `r31-age-curve.ts` | `npm run bench:agecurve` |
| `r44-decline-seats.ts` | `npm run bench:decline` |
| `radar-bench.ts` | `npm run bench:radar` |
| `retired-college-rule.ts` | imported by a live tool |
| `retirement-rate.ts` | `npm run bench:retire` |
| `season-equation.ts` | `npm run bench:season-eq` |
| `season-mirror.ts` | `npm run bench:mirror` |
| `shop-probe.ts` | `npm run probe:shop` |
| `skill-ceiling.ts` | `npm run bench:skill` |
| `small-talk-corpus-bench.ts` | `npm run bench:smalltalk` |
| `small-talk-corpus-emit.ts` | writes src/engine/world/smallTalkCorpus.ts out of docs/specs/small-talk-corpus-2026-09.md – the ONLY legitimate way to change the 43, because the catalogue is generated from the document and never retyped; re-run with --write after any owner edit to that spec |
| `small-talk-corpus-parse.ts` | imported by the test suite |
| `snapshot-bench.ts` | `npm run bench:snapshot` |
| `spirit-bench.ts` | `npm run bench:spirit` |
| `sponsor-window-bench.ts` | `npm run bench:sponsor` |
| `spotlight-bench.ts` | `npm run bench:spotlight` |
| `two-doors-bench.ts` | `npm run bench:doors` |
| `wedding-bench.ts` | `npm run bench:wedding` |
| `weight-bench.ts` | `npm run bench:weight` |
| `world-turnover.ts` | `npm run bench:world` |

## Archival – swept

One-shot probes and reproductions that have been touched since the 05.09 baseline. Kept as
evidence and typechecked by `npm run check:tools`, which the gate runs – so evidence that stops
compiling reddens a pull request instead of rotting.

- `_corridor.ts` · `_reveals.ts` · `age-injury-fit.ts` · `album-money-probe.ts`
- `album-spread-probe.ts` · `alice-story-read.ts` · `barrel-census.ts` · `birthday-pool.ts`
- `cancel-share-bench.ts` · `career-dossier.ts` · `coach-court-price.ts` · `coach-eye-bench.ts`
- `coach-travel-bench.ts` · `college-choice-probe.ts` · `college-freeze-probe.ts` · `college-home-place.ts`
- `college-news-probe.ts` · `college-price-probe.ts` · `college-return-probe.ts` · `college-scene-bench.ts`
- `college-talent-bands.ts` · `college-year-content.ts` · `composure-bench.ts` · `condition-drain-probe.ts`
- `copy-census.ts` · `domestic-season-to-date.ts` · `drought-probe.ts` · `empty-week-census.ts`
- `fade-read.ts` · `feed-audit.ts` · `first-number-one-probe.ts` · `first-pair-replay.ts`
- `fork-birthday-probe.ts` · `growth-age-sweep.ts` · `growth-pace-probe.ts` · `his-careers-dose.ts`
- `injury-audit.ts` · `kid-share-audit.ts` · `ladder-vs-targets.ts` · `load-and-injury.ts`
- `motherhood-bench.ts` · `one-clock.ts` · `pause-brand-probe.ts` · `potential-band-sweep.ts`
- `pressure-set-census.ts` · `probe-favorite-curve.ts` · `r34-calendar-tiers.ts` · `r34-domestic-reset.ts`
- `r34-field-chance.ts` · `r34-zero-lock.ts` · `r38-academy-worth.ts` · `r38-ceiling-dials.ts`
- `r38-closed-form-residual.ts` · `r38-decline-cliff.ts` · `r38-decline-read.ts` · `r38-decline-shape.ts`
- `r38-fame-presence-sweep.ts` · `r38-field-read.ts` · `r38-save-read.ts` · `r39-apparel-bond.ts`
- `r39-body-seasons.ts` · `r39-brand-loop.ts` · `r39-decline-rotation.ts` · `r39-save-read.ts`
- `r39-tenure-reach.ts` · `r39-terms-walk.ts` · `r40-age-branch.ts` · `r40-childhood-career-blast.ts`
- `r40-childhood-compounding.ts` · `r40-handover-realisation-cuts.ts` · `r40-last-winter.ts` · `r40-retire-trigger.ts`
- `r40-span-and-realisation.ts` · `r41-ad-gate-16.ts` · `r41-alice-save.ts` · `r41-brand-history.ts`
- `r41-brand-ramp.ts` · `r41-kid-share-early.ts` · `r41-one-market.ts` · `r41-winrate-2036.ts`
- `r42-cameo-gap-closer.ts` · `r42-ceiling-clock.ts` · `r42-coach-every-cheque.ts` · `r42-composure-bonus.ts`
- `r42-elite-retainer.ts` · `r42-junior-coverage.ts` · `r42-kid-share-ramp.ts` · `r42-personality-read.ts`
- `r42-sparring-price.ts` · `r42-team-budget-cap.ts` · `real-vs-bench.ts` · `runway-probe.ts`
- `sale-probe.ts` · `school-bench.ts` · `seed-vs-model.ts` · `sponsor-cadence.ts`
- `sponsor-ladder-reach.ts` · `sponsor-silence-probe.ts` · `summer-bench.ts` · `top50-season-probe.ts`
- `wall-l1-bench.ts` · `week-story-trace.ts` · `what-money-buys.ts` · `winrate-read.ts`

## Archival – frozen at their blob id

113 probes that have not moved since `98e3560b` (the 05.09 review's own base).
They are OUT of `check:tools` – `tools/generated/archival-frozen.json` records the blob each one is
frozen at, and `npm run tools:registry:check` fails if one of them changes while frozen.

⚠ **Why a frozen probe is not a neglected one** (H-17). A repair to keep a dormant tool compiling
silently changes what a quoted probe measured, and two such repairs landed in 22 days. Freezing is
the opposite of deleting: nothing moves, all 689 path references from the docs still resolve, and
the file still says exactly what it said when it was cited. Edit one and it leaves the freeze on
the next `npm run tools:registry` – and re-enters the typecheck with it, which is the point.

⚠ A frozen probe that a SWEPT or live tool imports is still compiled, as an import rather than as
a root. The freeze removes roots; TypeScript follows edges.

- `_seeds.ts` · `acceptance-cuts.ts` · `aer-cohort.ts` · `age-clock-cost.ts`
- `age-composition.ts` · `age-gate-shift.ts` · `band-probe.ts` · `band-vs-field.ts`
- `best16-bench.ts` · `big-draw-cost.ts` · `big-rung-finishes.ts` · `big-rung-odds.ts`
- `birthday-age-read.ts` · `boredom-guard.ts` · `brand-dynamics.ts` · `brand-gate-bench.ts`
- `calendar-shape.ts` · `career-vs-bench.ts` · `ceiling-walk.ts` · `clone-bench.ts`
- `coach-ladder-claim-probe.ts` · `coach-line-drift.ts` · `college-fork.ts` · `commentary-register-probe.ts`
- `commentary-rung-probe.ts` · `compound-cost.ts` · `counting-window.ts` · `deep-run-cost.ts`
- `domestic-ladder-probe.ts` · `double-booked.ts` · `draw-vs-band.ts` · `failure-modes.ts`
- `fatigue-ledger-diag.ts` · `field-quality.ts` · `fifth-skill-probe.ts` · `first-ranking-probe.ts`
- `grid-visibility.ts` · `head-ladder-sweep.ts` · `his-cadence-probe.ts` · `his-cadence-read.ts`
- `his-careers-brackets.ts` · `injury-cause-probe.ts` · `injury-ratio-probe.ts` · `injury-saves-read.ts`
- `j30-onramp-lock.ts` · `junior-access.ts` · `junior-door-calibration.ts` · `kit-bench.ts`
- `ladder-baseline.ts` · `ladder-walk.ts` · `live-table-inflation.ts` · `market-probe.ts`
- `masseur-bench.ts` · `match-clock-probe.ts` · `merch-fame-vs-rank.ts` · `mirror-probe.ts`
- `mixed-ladder-impact.ts` · `nation-depth.ts` · `next-goal-bench.ts` · `odds-calibration.ts`
- `opener-price-bench.ts` · `outcome-odds.ts` · `plateau-probe.ts` · `play-down-probe.ts`
- `points-audit.ts` · `points-curve.ts` · `policy-vs-owner.ts` · `population-depth.ts`
- `preview-drift.ts` · `pro-season-probe.ts` · `r29-item14-anger.ts` · `r29-item14-read.ts`
- `r29p2-savings-sweep.ts` · `r31-draw-promise.ts` · `r31-draw-stability.ts` · `r31-elite-tenure.ts`
- `r31-exit-where.ts` · `r31-her-arc.ts` · `r31-peak-share.ts` · `r31-surface-kings.ts`
- `r31-tier-ladder.ts` · `r31-top100-age.ts` · `r31-winrate-trend.ts` · `r32-brand-inertia.ts`
- `r34-brand-foot.ts` · `r34-reachable-ceiling.ts` · `r34-savings-income.ts` · `r35-brand-share.ts`
- `r35-draw-fact.ts` · `reach-sweep.ts` · `rehab-lever.ts` · `restore-bench.ts`
- `retirement-shape-probe.ts` · `rival-fatigue-audit.ts` · `round15-read.ts` · `round16-read.ts`
- `round17-read.ts` · `round18-read.ts` · `round23-read.ts` · `round26-probe.ts`
- `season-anchor-read.ts` · `skill-gap-odds.ts` · `slam-difficulty.ts` · `slam-door-cost.ts`
- `teen-at-the-top.ts` · `two-cells.ts` · `two-seasons-read.ts` · `two-tour-overlap.ts`
- `w-onramp-probe.ts` · `wall-freeze-probe.ts` · `wallet-audit.ts` · `what-drives-progress.ts`
- `wild-card-reach.ts`
