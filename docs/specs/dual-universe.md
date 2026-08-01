# Dual-universe double-pay – the measured bias (P5 Phase A)

Branch `bench/p5-dual-universe`, built against b7a9358. Proposal:
`docs/review/proposals/P5-dual-universe-bench.md`. Tool: `tools/dual-universe-bench.ts`
(`npm run bench:dual`). Method sibling: `docs/specs/rank-plateau.md` – predict, measure, only then
act; §4 there shipped a plausible fix and measured it doing nothing, which is why §2 below is
committed to git BEFORE the first sweep ran.

**Phase A only.** Zero engine changes – this page is a measurement and a verdict against a
pre-registered threshold. Whatever the numbers say, Phase B (pay one universe) is the owner's gate,
not this branch's.

---

## 0. The proposal's load-bearing claims, checked against the code first

Every mechanism this bench leans on was re-verified at b7a9358 before a line of it was built:

1. **Canonical brackets run for ALL scheduled events, hers included – CONFIRMED.**
   `world.ts:4479-4482`: `weekDraws = scheduled.map((e) => drawAiEntrants(...))` →
   `resolveDoubleBookings` → `runAiTournament` per event. `scheduled` is every event of the week
   (`world.ts:4292`); there is no exclusion for `enteredThisWeek` anywhere in the pipeline.
2. **`finalizeTournament` ledgers ONLY her row; the shadow AI finishes are discarded – CONFIRMED.**
   `world.ts:3724`: `if (points > 0) world.results.push({ playerId: KID_ID, ... })` is the single
   ledger write in the whole finalize path; nothing iterates `p.result.finishes` into `results`.
   The shadow bracket's other 31 finishes die with `closeTournament` (`world.ts:3796-3798`).
3. **The news names the SHADOW champion while the table paid the CANONICAL one – CONFIRMED, still
   live.** `world.ts:3736-3744` reads `championId` out of `p.result.finishes` (the shadow bracket)
   and prints "🏆 X won the …"; the same event's canonical bracket had already banked its own
   champion's points at `world.ts:3870-3873`. Whenever the two universes crown different players,
   the feed announces a title the standings never awarded. The bench counts how often (§4).
4. **At most one event per tier per week, so (week, tier) identifies her event – CONFIRMED.**
   `calendar.ts:711-718`: buildSeason tracks occupancy PER TIER ("each tier still gets a unique
   week, which is what keeps the `${year}-w${week}-${tier}` ids unique" – the id itself is minted
   from (year, week, tier) at `calendar.ts:691`). `resolveDoubleBookings` restates it as the reason
   its tie-break is unreachable (`tournament.ts:396-398`). The counterfactual swap therefore keys
   on (week, tier, non-kid) exactly as the proposal claimed; no re-keying on event identity needed.
5. **The `TB_BENCH_NO_AUTORUN` dynamic-import pattern works for reusing the fatigue harness –
   CONFIRMED.** `points-curve.ts:28-40` is the precedent; the bench copies it, and additionally
   captures the variable's pre-set value so it keeps the same importer contract itself.
   One wrinkle the proposal understated: `stepFatigueWeek` spawns AND closes the pending tournament
   inside one call (`fatigue-bench.ts:786-806`), so "capture after tickWeek, before the policy
   skips" cannot be done by sequencing calls without forking its ~60-line entry policy. The bench
   instead arms a get/set interceptor on `world.pendingTournament` (plain `Object.defineProperty`,
   zero RNG draws, engine reads/writes the property unchanged) and captures at the engine's one
   assignment site, `world.ts:4398`. Engine-free instrumentation holds because the assigned value
   is already complete: `PendingTournament` is "a tournament whose outcome is fully computed … but
   is being REVEALED one round at a time" (`world.ts:185-199`), and nothing mutates
   `result.finishes` after construction (`computeShadowTournament`, `world.ts:3539-3566`).

Two engine facts the metrics depend on, also verified: walkover and medical-withdrawal weeks never
assign `pendingTournament` (`world.ts:4333-4386`), so they stay canonical in both universes; and
every entrant of a canonical draw leaves a row, scoring or not (`world.ts:3818-3833`), which the
shadow-derived mirror rows reproduce.

## 1. Method – the counterfactual ledger, open-loop

**Cell.** rank-plateau's own: 120k wealthy · elite coach × `balanced` (money never binds, the
default player's habits). Careers stepped by the fatigue bench's `openFatigueCareer` /
`stepFatigueWeek` on the same `fatigue-wealthy-<i>` seed strings – a seed here IS the matching
`bench:fatigue` career, byte for byte. 30 paired seeds; horizons **208w** (measure at 104, 208) and
**416w** (measure at 104, 208, 312, 416); measurements read end-of-week state, post-commit.
The 208w careers are prefixes of the 416w ones (same stream), which the sweep uses as a built-in
determinism cross-check: shared measurement weeks must agree per seed, byte for byte.

**The two ledgers.** Real = `world.results` exactly as the engine wrote it. Counterfactual = the
same rows with, for every event she actually played, the canonical AI rows at that (week, tier)
replaced by rows derived from her shadow bracket's finish table
(`points = TIERS[tier].points[finish] ?? 0`, dense over the draw, kid row untouched – hers is
identical in both universes by construction, and the bench throws if the swap ever moves her
points). Events older than the 52-week window (`RESULTS_WINDOW`, `world.ts:496`) are skipped: the
engine would have pruned both universes' rows alike. Rankings over both ledgers via the engine's
own `computeRanking` with the live roster + kid and the same `inTrack` folds `recomputeKidRank`
uses (`world.ts:749-757, 772-780`) – the headline table is the ITF one (`kidRank`'s table,
rank-plateau's "her rank"); domestic and WTA ride along as supporting columns.

**OPEN-LOOP, stated before any number:** entrant selection, rival fatigue and her own draws still
ran on the canonical ledger. The counterfactual re-prices finishes that already happened; it cannot
re-run the world's reactions to the re-priced table. It is a first-order estimate. The closed-loop
number, if Phase B is ever built, comes from that phase's before/after paired re-run – rank-plateau
§4's exact method.

**Metrics** (per seed, per measurement week; aggregates over 30 seeds):

- **(a) rank suppression** – `rankReal − rankCf` on the ITF table; positive = the double-pay costs
  her places. Headline aggregate: the median.
- **(b) peer points delta** – peers fixed on the REAL ITF table, ±10 table places around her
  (rank-plateau §1's definition); their mean best-6 there minus the same ids' mean on the
  counterfactual table. Positive = points the double-pay handed exactly the players she is racing.
- **(c) beaten-rival inversions** – rivals she beat on court in a played event inside the current
  52w window who sit strictly above her on the real ITF table and strictly below her on the
  counterfactual one. Aggregate: share of careers with ≥ 1 inversion.
- **(d) double-paid volume** – canonical points banked by AI players out of her entered events;
  career-cumulative and per-season. This is the raw size of the second payout.
- *(supporting)* **champion contradictions** – played events where the news' champion (shadow,
  claim 3) differs from the champion the table paid (canonical): the on-screen lie, as a rate.

## 2. PRE-REGISTERED threshold and prediction

*This section was committed to git, with the bench, BEFORE the first sweep ran – the numbers in §4
did not exist when these words were written. rank-plateau.md is the reason for the discipline.*

**Materiality threshold (decided now):** the bias is material if

- median ITF rank suppression exceeds **10 places** at any measured (horizon, week) cell, **OR**
- beaten-rival inversions occur in more than **25% of careers at week 208** (read off the 416w
  horizon; identical to the 208w one by the prefix property).

Below both: Phase A still ships (this bench + this page + the "not material" verdict), and Phase B
is closed unbuilt.

**Prediction, rank-plateau style:** suppression is **> 0 by construction** – she can only add
points to rivals, never remove them, so the real table can only place her at-or-below the
counterfactual one; any negative per-seed suppression would be a tie/recency artefact, small and
rare. Magnitude: unknown, and that is the point of measuring. Direction of (b) likewise ≥ 0.
For (d): she enters ~20 events a season in this cell (rank-plateau §3), so the double-paid volume
should be on the order of a full second calendar's payout across those weeks – hundreds of points
a season into her direct field. If (a) still comes out small against that volume, the diagnosis is
that the injected points spread mostly to players far from her table neighbourhood – which is
exactly the kind of thing only a measurement can decide.

## 3. BASELINE #1 – and the RE-RUN this spec requires

This sweep is **baseline #1, taken on pre-population `main`** (b7a9358 lineage). A separate branch
in flight, `feat/living-field`, will change W-tier field composition – the very fields the 312/416
measurement weeks rank her against.

**Required:** after `feat/living-field` merges, this same bench MUST be re-run and its tables added
to this page BEFORE any Phase B decision is taken. A Phase B argued from baseline #1 alone would be
argued against a field that no longer exists. To keep the two runs attributable, the bench prints a
**code fingerprint** header (`git rev-parse HEAD` of the worktree, `-dirty` when the tree is not
clean) on stdout and stamps it into every CSV row; the tables in §4 carry it too.

## 4. Results

*Pending – filled by the post-sweep commit. The threshold and prediction above are frozen; nothing
above this line moves once the numbers land.*

## 5. Verdict

*Pending – the §2 threshold applied to §4, computed by the bench itself (`verdict()`), not
eyeballed. Phase B remains the owner's gate either way.*
