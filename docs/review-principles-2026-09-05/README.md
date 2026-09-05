---
type: review
status: audit
area: project-review
canonical: false
last-reviewed: 2026-09-05
baseline: 98e3560b
---

# Ties Break project review – 5 September 2026

> Five independent lanes over `round/36` at `98e3560b`, run in parallel and each forbidden to change
> a line of the product. Sections A-D of the performance lane were taken at that commit; its section
> E and every re-verification were taken at `20318e65`, after the day's seven owner fixes landed.
> The lane reports are `02-engine.md`, `03-ui.md`, `04-performance.md`, `05-duplication.md`,
> `06-tests-tooling.md`; this file ranks and deduplicates them and says who owns each decision.

## Executive verdict

**No P0. Nothing here blocks a merge of `round/36`.** The load-bearing invariants are not merely
documented, they were reproduced: engine purity green, zero runtime import cycles across 119 modules,
the MAIN random stream byte-identical between a no-action arm and an arm firing fifteen kinds of
command over three seeds and 156 weeks, the migration ladder contiguous 1..70 with a fixture per
rung, every cents literal carrying its `_00`, zero lifecycle leaks in nineteen inventoried
listeners and observers, zero facade bypasses, zero vacuous tests in 5,556 `it` blocks, and zero
modules with no test reach out of 152.

Five things matter, and they are all narrow:

1. **The v70 promise "the draw is a fact" breaks once a season.** The conveyor retires the promised
   opponent in tick phase 1 before her match plays in phase 5, and the reader falls back to a live
   draw without saying so – 3 of 20 boundary-week events, 0 of 301 elsewhere. This is the owner's own
   03.09 complaint recurring on the one week a season it can. **E-01.**
2. **A refused boot load opens the prologue over an intact career.** `init` swallows the refusal and
   reaches `ready` with no snapshot, and `showOnboarding` is exactly `ready && !snapshot`. A
   schema-newer save is the realistic trigger. **U-01.**
3. **Three guards can pass while the thing they guard is gone** – a helper that returns an empty
   string for an absent function under a negative assertion, marker helpers whose throw-on-absent
   behaviour nothing tests, and a metadata ratchet that inspects membership rather than edits.
   **T-01, T-02, T-03.**
4. **`toSnapshot` costs 13-24 ms and runs after every command**, two to four times the week tick
   itself, because it recomputes the rankings and re-selects every upcoming event's entrants from
   scratch. It is the one compute cost the player can feel. **P-02.**
5. **219 seconds of the 367-second unit gate is thirteen files run one at a time** while nine cores
   idle. `npm run check` is 421.8 s and the unit project is 87 % of it. **P-13.**

Duplication, which the owner asked about specifically, is **not a problem in the product**: `src/` is
0.23 % duplicated lines. It is a problem in the scaffolding – tests 3.3 %, tools 3.1 % – and in three
places the copies have DRIFTED, which is where the findings are.

## Scope and confidence

| lane | read | ran | report |
| --- | --- | --- | --- |
| E engine | ~11 % of 58.5k lines in full, ~8 % in part, the rest by script and grep | purity, madge, 6 vite-node probes, 2 test files | `02-engine.md` |
| U UI | the four big screens and every composable in full | mounted probes incl. a counting ResizeObserver stub | `03-ui.md` |
| P performance | build output, worker, engine, browser, gate scripts | vite build, node CPU profiles, Playwright at 375 4x and 1280, the whole gate step by step | `04-performance.md` |
| D duplication | src, tests, tools, scripts, e2e | jscpd at two thresholds per area, numeric-literal intersection, grep clusters | `05-duplication.md` |
| T tests, tooling, CI | 365 test files, every gate script, both CI workflows, every tsconfig | the eight cheap gates, single test files, depcheck | `06-tests-tooling.md` |

Severity: **P0** release or data-integrity blocker · **P1** a correctness or truth failure that should
lead the next wave · **P2** a material risk with a bounded response · **P3** opportunistic, or an
owner decision. Effort: **XS** under a day, **S** 1-2 days, **M** 3-5 days, **L** 1-2 weeks.

## The ranked list, deduplicated across lanes

Fourteen items are merged from two or more lanes; the merge is named in the row.

| # | ID | Sev | Eff | what | owner? |
| --- | --- | --- | --- | --- | --- |
| 1 | E-01 | P1 | S | the published draw is not kept across the season boundary | no |
| 2 | U-01 | P1 | S | a refused boot load opens the prologue over an intact career | no |
| 3 | T-01 | P1 | S | a negative pin on a helper that returns `''` for an absent function – vacuous on a rename | no |
| 4 | T-02 | P1 | XS | the marker helpers' throw-on-absent property has no test | no |
| 5 | T-03 | P1 | S | the context ratchet checks membership, not edits (QA-35, still open) | no |
| 6 | P-13 | P1 | S | 219 s of the 367 s unit gate is a serial loop over 13 files | no |
| 7 | P-02 | P2 | S-M | `toSnapshot` recomputes rankings and entrant fields on every command | no |
| 8 | E-02 | P2 | XS | the import spine stops at v38; eight later required fields pass the gate | no |
| 9 | E-03 | P2 | S | the card's chance and her match are two different models (up to 5 pp) | **YES** |
| 10 | E-04 | P2 | XS | `maxMainDraws` has a 0.6 % margin and no test against the live tick | no |
| 11 | U-02 | P2 | S | the store's recovery sentences reach five screens of ten | no |
| 12 | U-03 + D (UI cluster) | P2 | S | the coach's weekly bill is rebuilt from the seed on two screens | no |
| 13 | D-01 | P2 | S | the diary paints her portrait off the band clock, every other surface off her real age | no |
| 14 | T-04 | P2 | XS | two dialogs in `ADVANCE_REFUSALS` have no 375x667 dismiss assertion | no |
| 15 | T-05 + P-14 + P-15 + P-16 | P2 | M | budget by structure: 30 inline timeouts, 10 lazy caches, `goldenSaves` walking the corpus 3x, the component project at vitest's 5 s default | no |
| 16 | U-04 | P2 | S | the first measured UI extraction: App's four tab watchers | no |
| 17 | T-06 + P-19 | P2 | S | CI typechecks twice per job (QA-40, still open) | no |
| 18 | T-07 | P2 | S | the pin-hygiene guard cannot see a negative assertion inside a helper | no |
| 19 | P-04 | P2 | XS | the install-size guard measures `public/` and ships 1,165 KiB more | no |
| 20 | D-02 + E-12 | P3 | XS | five hand-rolled dollar formatters; two of them disagree with `formatCents` on rounding and on -0 | no |
| 21 | U-05…U-10, U-12 | P3 | XS | seven small UI items: an always-running pulse, one unmanaged popup, an unguarded `localStorage`, two timers without teardown, a duplicated `fundsShort` | no |
| 22 | E-05, E-07, E-08 | P3 | XS-S | dropped error codes at the worker boundary, two snapshot fields with no reader, three fully dead exports | no |
| 23 | E-06 | P3 | S | three wire payloads the engine does not re-validate | partly |
| 24 | P-17, P-18 | P3 | XS | a real socket opened from mounted tests; `--verbose` on CI shards | no |
| 25 | D-05 | P3 | S | the benches' ~210 local helpers, five of which disagree | no |
| 26 | T-10, T-11, T-12 | P3 | XS | stale prose inside gates, script and dependency hygiene, tsconfig strictness | no |
| 27 | E-09, E-11, T-08, T-13, D (scaffolding) | P3 | – | reported, not recommended: `world.ts` seams, comment growth, the source-pin estate, no linter, test scaffolding | **YES** |

## What runs without you

Everything above whose "owner?" column says no, in four bundles grouped by collision surface so no
two agents touch one file. Each item ships with a test that fails on the unfixed tree, proved by
mutation. Nothing in this set changes a word on screen, a balance number or a design decision.

| bundle | items | surface |
| --- | --- | --- |
| **W1 engine truth** | E-01, E-02, E-04, E-05, E-06, E-07, E-08, E-12 | `src/engine/**`, `src/worker/**`, `src/shared/**` |
| **W2 the boot and the store** | U-01, U-02, U-03, D-01, U-12 | `src/stores/game.ts`, `src/App.vue`, the screens that read them |
| **W3 the guards** | T-01, T-02, T-03, T-04, T-05, T-07, P-14, P-15, P-16, P-17 | `tests/**`, `scripts/**` |
| **W4 the gate and the bytes** | P-13, P-18, P-19, T-06, T-10, T-11, P-04 | `scripts/units.mjs`, `.github/workflows/**`, `package.json` |

`P-02` (the snapshot cache) and `U-04` (the App extraction) are S-M and touch the hottest paths in
the app; they are held back from the automatic set deliberately and proposed as their own wave, so
that a determinism cache and a UI ownership move are not landing beside eleven other things.

## What needs you

Nine questions, each sharpened to a choice. None blocks the four bundles above.

### 1. E-03 – the number on the card is not the model she plays

The Season card prints `fastMatchProbability` (serve and return only). Her bracket runs
`simulateMatch`, which adds fatigue, a break-point penalty scaled by composure and momentum.
Measured over 4,000 matches per cell: stamina 30 against 90 moves her real win rate **−5.1 pp** from
the printed number, composure 30 against 80 **−1.7 pp**. And AI-vs-AI matches resolve against the
closed form, so **stamina and composure never affect anyone but her.**

**A** – make the card run a short Monte Carlo of the same model (the card already caches per event;
200 matches cost ~25 ms). The number becomes true; nothing else moves.
**B** – fold an expected-fatigue correction into the closed form and apply it to the preview only.
Cheaper, approximate.
**C** – apply that correction to the field as well, so the rest of the tour feels stamina too. This
moves rankings and every calibration band, and is a balance wave with a spec.
**D** – leave it and say on the card what the number is. That is a wording change and it is yours.

### 2. The coach card's floor computes its worst case from the wrong picture

Rounds 18 and 21 derive the row floor from a 162/264 portrait and call it the worst case. It is the
best case: `budget-2.webp` is 162/280 and is narrower for a given height. At the phone's 104px floor
the true worst case is **59.01px of picture inside a 62px window**, and the hired row's 132px floor
supplies 75.2px against a 78px window. Real rows sit far above both floors, so nothing is visibly
wrong today. **Fixing it moves the phone's floors, and this round may not move the phone without you.**

### 3. `npm run icons` cannot run at all

It throws at `findLogoSource()`: `art-src/logo-lucia-app.png` is on no machine the repository can
see, and `art-src/` is gitignored by design. Today's icon fix re-encoded the shipped PNGs from
themselves, which is exact for the deliverable. **Restoring the master is yours** – until then the
icons cannot be redrawn.

### 4. The offline install ceiling

The guard in `tests/round29p2-offline-install.test.ts:69` sums `public/` (14,594 KiB after today's
fix) against a 16,384 KiB ceiling, while what the phone actually downloads is the built precache
(15,755 KiB). The gap is ~1,165 KiB of hashed bundles the guard cannot see. Restating the guard so it
measures the shipped number is in bundle W4 and needs nothing from you. **The ceiling itself is your
29.08 ruling: restate at 16,384, or move it?**

### 5. Three wording items (E-06's refusals, U-11, D-03)

The engine has no refusal sentences for a malformed `new` payload, an out-of-range `weeks`, or an
unusable save name; `OnboardingWizard` has an `aria-labelledby` pointing at an id nobody owns; and
`layoffNote` is spelled three times with a full stop on one of them. **All four are copy, and copy
is yours.** Propose and you approve, or leave them.

### 6. Real-browser accessibility (T-09)

The parity harness proves presence, not usability: no axe pass, no focus-order assertion, no contrast
check in a real browser. Adding `@axe-core/playwright` is one dependency and about a day.
**Add it, or keep the presence-only guarantee?**

### 7. The source-pin estate (T-08)

80 of 365 test files pin source text; 1,876 `it` blocks live in them against 1,335 in mounted files.
Of a 30-file sample, 21 prove behaviour, 5 prove text exists and 4 could pass against a deleted
feature. The direction of travel is a policy question, not a defect. **Ratchet it down file by file
as waves touch them, or leave it?**

### 8. Comment volume (E-11)

Comments grew **3.6 lines for every code line added** since 02.09; the ratio is 1.82 overall and 6.78
in `engine/world/state.ts`. These are your rulings and reasoning written down, so this is reported,
not proposed. **Say if you want a compression pass anywhere.**

### 9. `world.ts` (E-09) and the dormant surfaces

The barrel's importers went 446 → 486 in three days. The 02.09 ruling – move a seam only when a
feature needs that boundary – still stands and nothing in this wave needed it. **Confirm it stands.**

## What is good

- **The RNG position is its own checksum** (`rng.ts:62-100`), verified on load, repaired loudly, and
  the conditional fourth draw is taken before the condition is read – which is exactly why the
  input-independence A/B holds byte for byte across three seeds and fifteen kinds of command.
- **The worker is a transaction**: clone, run, persist, commit, with a serialised queue, a generation
  token that makes a dead worker's late reply provably ignorable, and one IndexedDB transaction over
  both stores with the careers row as a compare-and-swap anchor.
- **Two doors, two trust levels** on save loading – the database door gets caps and a checksum, the
  file door gets caps, header, checksum, bounded inflation, a bounds walk and a spine.
- **Zero lifecycle leaks.** Of nineteen listener, observer and timer sites, seventeen tear down; the
  two that do not are cosmetic timers whose post-unmount write is a no-op. The round-36 week pager
  was measured with a counting stub: 15 observers created, 15 disconnected.
- **Zero vacuous tests** in 5,556 `it` blocks, **zero** engine, composable or shared modules with no
  test reach, and **zero** components never mounted.
- **The boundary is healthy and measured**: a 97 kB snapshot, `structuredClone` at 0.41 ms, the
  deep-reactive wrap at 1.4 ms per full traversal. The cost is upstream in derivation, not transport.
- **The engine does not slow down with career depth**: 5.3 ms/week at week 52, 6.4 ms/week at week
  516, and the load path is 2.5 ms for a 466 kB world.
- **The art pipeline holds its own policy**: 230 images, all webp, all lossy, mean 48 KB, largest
  100 KB, none over the 120 KB budget, none wider than 512 px.
