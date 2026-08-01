<!-- Build-ready proposal derived from the 2026-08-01 full review (docs/review/). Reviewed at b7a9358. -->

# P5 – Dual-universe double-pay: measure the rank bias, then pay one universe

One-line: Build a paired-seed bench that quantifies how much the canonical/shadow double-payout suppresses her rank and hollows rivalries, then – only if it crosses a pre-registered materiality threshold – pay her entered event's AI results from the shadow bracket, keeping the frozen MAIN capture byte-identical.

**Priority:** Tier 2 – engine debt · **Effort:** L · **Risk:** med

## Why (problem)

Every event she enters is played twice and paid twice, and only she pays the difference.

- `tickWeek` step 4 runs canonical AI-only brackets for ALL scheduled events, hers included: `src/engine/world.ts:4479-4483` (`weekDraws = scheduled.map(...)` → `resolveDoubleBookings` → `runAiTournament` per event, no exclusion for `enteredThisWeek`).
- `runAiTournament` (`world.ts:3862-3876`) ledgers a full finish table for that canonical bracket – champion points down to 0-point appearance rows for every entrant.
- Her own run is a separate shadow bracket on `seed:kidtour:<event.id>` (`computeShadowTournament`, `world.ts:3540-3566`), and `finalizeTournament` commits ONLY her row on top: `if (points > 0) world.results.push({ playerId: KID_ID, ... })` (`world.ts:3724`). The shadow bracket's AI finishes are computed and thrown away.

Consequences, all structural:

1. **She can never take points off a rival.** The rival she beats in the shadow final banks whatever the canonical universe handed him the same week. The ranking (`computeRanking`, `src/engine/season/ranking.ts:81-156`) is zero-sum in rank places, so a rival she cannot deduct from is a rival she must out-earn twice.
2. **Her entered events inject up to two tiers' worth of points into the table** – the full canonical table plus her finish – a standing inflation of exactly the players she is racing.
3. **The game already contradicts itself on screen.** `finalizeTournament`'s world-news line announces the SHADOW bracket's champion (`world.ts:3736-3744`, `championId` read from `p.result.finishes`) while the standings paid the CANONICAL bracket's champion. Whenever the two universes disagree, the news names a title the table never awarded.
4. **Rivalry fatigue reads the wrong week.** `rivalConditions` (`src/engine/season/rival.ts:196-213`) reconstructs strain from ledger rows; her actual opponents leave no shadow rows, so playing HER costs a rival nothing – the canonical bracket's parallel self is what gets tired.
5. **The size of the bias has never been measured.** `docs/specs/rank-plateau.md` §1 measured her 5 raw-power points above her point-peers and §5 attributed the plateau to condition (0.707 match factor) – but the double-pay term was never isolated. The review (docs/review/03-game-design-mechanics.md, HIGH finding 3) flags exactly this gap.

This was a deliberate trade, and the code says so: "Canonical ranking excludes the kid so AI-field selection never depends on the kid's own results / entry history – the canonical AI world stays the same world whatever she does" (`world.ts:4293-4294`), and the `runAiTournament` header (`world.ts:3804-3811`) explains the RNG-stability motive. So the fix is not free and must be justified by measurement first. rank-plateau.md is the house methodology for exactly this: predict, measure, only then act – §4 shipped a plausible fix and measured it doing nothing. P5 follows that discipline.

## What (proposed change)

**Phase A (standalone-shippable): measure the bias with a paired-seed bench, against a pre-registered threshold.**

New tool `tools/dual-universe-bench.ts` (npm script `bench:dual`), extending the rank-plateau harness: same axes as `tools/fatigue-bench.ts` (reused via dynamic import with `TB_BENCH_NO_AUTORUN='1'`, the exact pattern of `tools/points-curve.ts:28-40`), 120k wealthy preset + balanced policy (rank-plateau's cell: money never binds), 30 paired seeds, horizons 208w and 416w, measurement weeks 104/208/312/416.

Instrumentation is engine-untouched: after each `tickWeek`, if `world.pendingTournament` is set its `result.finishes` is already fully computed (`world.ts:190-199` – the shadow result is complete before any reveal), so the bench records `(week, tier, finishes)` before the policy skips/closes. It maintains a counterfactual ledger: a mirror of `world.results` in which the canonical rows of her played events (`playerId !== KID_ID && week === playWeek && tier === enteredTier` – unique, since `buildSeason` runs at most one event per tier per week, see `resolveDoubleBookings` comment `season/tournament.ts:398-401`) are replaced by shadow-derived rows (`points = TIERS[tier].points[finish] ?? 0`), pruned on the same 52-week rule (`RESULTS_WINDOW`, `world.ts:496`). Each measurement week it runs `computeRanking` over both ledgers.

Metrics: (a) her rank, real vs counterfactual – median suppression per horizon; (b) points delta of her peers (±10 places, rank-plateau §1's definition); (c) **beaten-rival inversions** – a rival she beat in that week's event who sits above her in the real table and below her in the counterfactual; (d) double-paid volume – canonical points banked by AI players out of her entered events per season.

**Pre-registered materiality threshold (decided now, before any number exists):** the bias is material if median rank suppression exceeds 10 places at any measured horizon, OR beaten-rival inversions occur in more than 25% of careers at week 208. Below both: Phase A still ships (bench + `docs/specs/dual-universe.md` recording method, numbers and the "not material" verdict), Phase B is closed unbuilt. Pre-registered prediction, rank-plateau style: suppression is > 0 by construction (she can only add points to rivals, never remove), magnitude unknown; the counterfactual is open-loop (selection/fatigue feedback still ran on the canonical ledger), so it is a first-order estimate – the closed-loop number comes from Phase B's before/after re-run.

**Phase B (only if material): one universe pays.** When she actually plays an event, its canonical bracket does not run; the shadow bracket's AI finishes are ledgered at commit time instead. Chosen over "keep both brackets, ledger shadow" because the whole point is one universe per event – keeping a silent parallel bracket preserves the champion-news contradiction and pays nobody. Runner-up alternatives under Risks.

## How (implementation sketch)

Phase A first; Phase B steps 4+ only after the threshold trips.

1. **`tools/dual-universe-bench.ts`**: dynamic-import `PROFILES`, `POLICIES`, `openFatigueCareer`, `stepFatigueWeek` from `tools/fatigue-bench.ts` (set `process.env.TB_BENCH_NO_AUTORUN = '1'` first, as `points-curve.ts` does). Step careers manually so the shadow `result.finishes` is captured off `world.pendingTournament` after `tickWeek`, before `skipTournament`/`closeTournament`. Add `"bench:dual": "vite-node tools/dual-universe-bench.ts"` to `package.json:13-17`. `--csv` flag like the sibling benches.
2. **`docs/specs/dual-universe.md`**: methodology, the pre-registered threshold and prediction (written BEFORE the first run), then the measured tables – the rank-plateau.md document shape. Cross-link from rank-plateau.md's "still open" list.
3. **Decision gate**: owner reads the verdict. Not material → stop here, spec records why.
4. **Flag the run** (Phase B): `PendingTournament` (`world.ts:190-199`) gains optional `paysAi?: true`, set by `computeShadowTournament` (`world.ts:3540`). Optional-additive on a persisted type is NOT a schema bump by repo precedent (`SeasonResult.tier`, `world.ts:3816-3818`); the default-undefined is the compatibility boundary – an old save carrying a live mid-reveal `pendingTournament` finalizes the old way, correct because its canonical rows were already ledgered at tick time.
5. **Skip the canonical bracket for her played event** (`world.ts:4479-4483`): build `weekDraws` from `scheduled.filter(e => e.id !== world.pendingTournament?.eventId)`. Keying on `pendingTournament` (not `enteredThisWeek`) makes walkover/medical weeks (`world.ts:4333-4386`, no shadow run) fall through to canonical automatically.
6. **Cross-universe double-booking**: pass the shadow field ids – `Object.keys(p.result.finishes)` minus `KID_ID` (finishes are dense over the whole draw, `world.ts:3838-3840`) – into `resolveDoubleBookings` (`season/tournament.ts:376`) via a new optional `preBooked?: ReadonlySet<string>` that seeds `booked`. Zero draws (the function is draw-free by construction). Her opponents can no longer also appear in a canonical draw the same week, which would otherwise become visible as two ledger rows per player-week once shadow rows exist.
7. **Pay from the shadow at commit**: extract a small helper `ledgerAiRows(world, event, finishes, excludeId?)` from `runAiTournament`'s loop (`world.ts:3869-3874`); call it in `finalizeTournament` (`world.ts:3615`) when `p.paysAi`, before her own row lands – 0-point appearance rows included, preserving the rival-fatigue contract (`season/rival.ts:10-19`). The reveal-week rank recompute is already deferred to finalize (`world.ts:4485-4491`), so standings see the rows.
8. **`skipEvent`** (`world.ts:4720`, the pre-reveal discard): when `p.paysAi`, call `ledgerAiRows(..., excludeId = KID_ID)` before clearing `pendingTournament` – the AI played, she withdrew from the paper results; her shadow finish stays uncommitted.
9. **RNG draw-count ledger, precisely**: MAIN stream untouched – no line above adds or removes a weekly-`rng` read, so the frozen capture 41550/e6b0c709 must RE-DERIVE byte-for-byte, not re-pin. `seed:kidtour:<id>` byte-identical – her matches do not change. `seed:aitour:<id>` of a played event goes entirely unread that week – safe because streams are per-event (`rngFromSeed`, `world.ts:3857-3858`) with no other consumer. Second-order: the ledger now depends on her runs, so next weeks' `aiRanking` (`world.ts:4295`) shifts, band-candidate COUNTS in `selectEntrants` shift, and per-event `aitour` draw counts move – explicitly precedented and accepted for the age gate ("NOT byte-identical to the pre-cap ones and cannot be", `season/tournament.ts:146-152`); only the MAIN stream is the invariant.
10. **Verification**: re-run `bench:dual` in before/after paired-seed mode (rank-plateau §4's exact method) for the closed-loop measurement, plus the survival/econ guardrail cells (§4's "balance cost of keeping it" sweep) – results into `docs/specs/dual-universe.md`.

## Test plan

TDD order, Phase A: (1) unit-test the bench's counterfactual ledger builder on a hand-built results fixture – replacement keyed on (week, tier, non-kid), pruning identical to `RESULTS_WINDOW`; (2) determinism smoke: one cell twice, byte-identical CSV; (3) run the sweep, write the spec.

Phase B, tests first:

- **New engine tests** (in `tests/` beside `condition.test.ts`'s B1 suite): (a) a played event leaves EXACTLY the shadow finishes at its (week, tier) – dense over the draw, kid row via finalize, no canonical rows: one-universe conservation; (b) walkover and medical weeks still ledger canonical rows (pendingTournament null path); (c) `skipEvent` ledgers shadow rows minus hers; (d) champion news equals the ledgered champion – the `world.ts:3736-3744` contradiction becomes an invariant; (e) `resolveDoubleBookings` honours `preBooked` with zero draws.
- **Re-aim, deliberately, the one test this breaks**: `tests/condition.test.ts:343-369` ("entering (and playing) an event never perturbs the main stream") asserts `aiResults(world)` equals the non-entering baseline. Draws count/hash and cohort equality stay; the aiResults assertion becomes "differences confined to rows at the (week, tier) of her played events, all other rows byte-equal" – which is the new invariant stated positively. Dated note in the file per house style.
- **Pins that must NOT move**: `REF = { count: 41550, hash: 'e6b0c709', kidRank: 151 }` (`tests/planner.test.ts:162`, `tests/condition.test.ts`) – `recordRun` enters nothing, so even kidRank stands; any movement is a regression. `tests/econ-bench.test.ts:306` (`kidRank` 120 at week 0) – unmoved. Pins on entered careers elsewhere re-derive with dated notes.
- **Golden saves**: no schema bump, no new fixture (optional-field precedent, `world.ts:3816-3818`); `tests/goldenSaves.test.ts` corpus must stay green unmodified. If review insists `paysAi` is schema-worthy, fall back to v35 + no-op migration + new fixture – mechanical either way.
- **Benches**: `bench:dual` before/after paired seeds proves the suppression closes; `bench:fatigue`/`bench:econ`/`points-curve` survival and points-curve cells within noise or consciously retuned.

## Acceptance criteria

- [ ] `bench:dual` exists, reuses fatigue-bench axes, runs deterministically, and reports rank suppression, peer point deltas, beaten-rival inversions and double-paid volume per cell.
- [ ] `docs/specs/dual-universe.md` records threshold and prediction BEFORE numbers, then the measured verdict; rank-plateau.md links it.
- [ ] Phase A ships alone if the threshold does not trip.
- [ ] (If material) a played event pays out of exactly one bracket; canonical still pays walkover/medical/non-entered weeks; `skipEvent` pays shadow minus her.
- [ ] Frozen MAIN capture 41550/e6b0c709 re-derives byte-for-byte; `seed:kidtour` runs byte-identical (her match records unchanged on same seed).
- [ ] Champion news and standings name the same champion for her events.
- [ ] No schema bump; golden-save corpus green untouched.
- [ ] Full suite green with only the documented re-aims/re-pins, each carrying a dated note.

## Risks & alternatives

- **Reversing a deliberate trade** (`world.ts:4293-4294`): the AI world stops being input-independent – a reload-scummer can reshape rivals' points by entering differently. Mitigation: the MAIN-stream invariant (the one that protects saves and replay) is untouched; input-dependence of outcomes is already true of everything the kid touches, and single-save UX makes scumming niche (accepted precedent: the injury-dodge finding, review 03 LOW).
- **Balance shift**: rivals now lose points to her and gain fatigue from playing her – field-wide totals drop slightly. Mitigation: the §4-style guardrail sweep in step 10; retune only on evidence.
- **Open-loop counterfactual underestimates** (Phase A): stated in the spec; the threshold is set against the lower bound, and Phase B's paired before/after is the closed-loop truth.
- **Runner-up (Phase B)**: keep the canonical bracket running but ledger shadow finishes for her event – smaller diff (no `weekDraws` filter, no `preBooked`), but burns a wasted bracket, keeps players booked into a ghost event out of other draws while giving them no row, and keeps two universes alive per event. Rejected: complexity without the identity gain.
- **Runner-up (skip path)**: kid-less re-run on a new `seed:skiptour:<id>` stream for `skipEvent` weeks – cleaner narrative (no finishes shaped by discarded matches) but needs the tick-time fatigue map, i.e. stashing the fatigued field in `PendingTournament` (real save-size/schema cost). Rejected for a rare, deliberate action.

## Dependencies

None. Independent of the endings/morale packages; touches the same `world.ts` region as any tick work, so coordinate the merge window (one-branch-per-wave rule). P5's Phase A should run BEFORE any ranking-points retune (rank-plateau.md §5.1) so that retune measures a single-universe table if Phase B lands.
