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

## 4. Results – BASELINE #1

Run 2026-08-01, code fingerprint **bcae9df3d167** (clean tree), 30 paired seeds. §2 and §3 above
are exactly as committed before this sweep existed (aa02268); nothing above the §4 line has moved.
The paired-horizon cross-check passed: every 208w measurement byte-agrees with its 416w twin, so
one table below covers both horizons.

| week | med rank real | med rank cf | med suppr. | spread | neg / zero / pos | peer Δ (mean) | careers w/ inversion | events in window (mean) | double-paid pts/season | news≠table champion |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 104 | #21 | #23 | **0** | −7..+7 | 14 / 7 / 9 | **+24.5** | **17/30 (57%)** | 23.9 | **5383** | 92.1% |
| 208 | #108.5 | #107.5 | **0** | −3..+5 | 4 / 18 / 8 | −0.4 | 5/30 (17%) | 9.7 (9 careers: 0) | 3711 | 91.2% |
| 312 | #97.5 | #97.5 | 0 | 0..0 | 0 / 30 / 0 | 0.0 | 0/30 | 1.4 (28 careers: 0) | 2525 | 91.0% |
| 416 | #88 | #88 | 0 | 0..0 | 0 / 30 / 0 | 0.0 | 0/30 | 5.6 (17 careers: 0) | 1988 | 90.5% |

Supporting tracks: domestic suppression −3..+2 (17 careers non-zero) at 104, gone by 208; WTA
suppression appears once she plays W15/W35 (−4..+6 at 208, 13 careers non-zero; −2..+3 at 416) and
its median is 0 everywhere. Cumulative double-paid volume: **~15,900 canonical points per career**
banked by AI players out of her entered events (~5,400/season while she is active).

**The §2 prediction is half-falsified, and the falsified half is the finding.** Suppression is NOT
"> 0 by construction": per-seed it is symmetric around zero (14 negative vs 9 positive at week
104). The §2 reasoning missed that the counterfactual does not only *remove* the canonical payout
from her rivals – it *re-awards the same tier's points* to the shadow bracket's beneficiaries, who
live in the same table neighbourhood. The swap changes WHICH rivals hold the points, barely how
many sit above her. Meanwhile the second §2 prediction verified exactly: the volume is enormous
(5,400 pts/season ≈ a full second calendar) and it scatters – peers carry +24.5 points of best-6
each at week 104 while her rank stays put. Both universes pay the same neighbourhood; identity
moves, mass does not.

**A career-shape discovery the bench forced into the open** (the reason weeks 312/416 are near-
vacuous): in this cell she stops entering ANYTHING around week ~167–215 – junior tiers age-cap
away and most careers never (or only briefly, 13/30 late) hold W-tier eligibility. At 312, 28 of
30 careers have an empty 52-week window, so real ≡ counterfactual by construction; `kid_points_itf`
median is 0 and the #97.5 "rank" is the zero-point tie block. Those cells say nothing about the
bias – and quite a lot about the cell: rank-plateau's 312/416 rows were measured under an older
calendar in which she kept playing. Worth its own question some day; not this page's.

**What the double-pay measurably does, then** – not a ladder distortion but two integrity wounds
and a volume:

1. **Beaten-rival inversions are the lived experience of the bug**: at the height of her junior
   activity (week 104) **57% of careers** contain at least one rival who is above her on the very
   table while she beat him on court that season – and who would be below her had her bracket been
   the paying one. Up to 3 such rivals per career. By the pre-registered week-208 read it thins to
   17% only because she has mostly stopped playing by then.
2. **The news lies about ~91% of her events** (claim 3 quantified): the announced (shadow)
   champion differs from the champion the table paid (canonical) in 90.5–92.1% of played events.
   Two independent 32-draws over one pool almost never agree – so the on-screen contradiction is
   not an edge case, it is the norm of every tournament week she plays.
3. **The phantom volume is real**: ~5,400 pts/season of canonical payouts from her entered events,
   +24.5 best-6 points on her direct peers at week 104 – it inflates the field she is racing
   without systematically displacing her.

## 5. Verdict

Computed by `verdict()` against the §2 threshold, not eyeballed:

| pre-registered condition | measured | trip? |
| --- | --- | --- |
| median ITF suppression > 10 places at any (horizon, week) cell | 0 at every cell (worst single seed: +7) | **no** |
| beaten-rival inversions in > 25% of careers at week 208 | 17% (5/30) | **no** |

**⇒ NOT MATERIAL under the pre-registered threshold. Phase B is closed unbuilt**, per §2's own
terms – the rank bias this bench was sent to find is not there at the registered magnitude, and
rank-plateau §5 already owns the actual plateau (condition, not points).

What this page does NOT decide: whether the week-104 inversion rate (57%) and the ~91%
champion-news contradiction – tone and integrity findings, both outside the registered threshold –
justify a differently-scoped slice (e.g. fixing the news line alone, a UI-truth fix with no ledger
change). That is the owner's question; re-registering a new threshold after seeing these numbers
would be exactly the practice this document format exists to prevent, so it is left here as data.

The §3 gate stands regardless: if a Phase B conversation ever reopens, the FIRST step is the
required re-run of this bench after `feat/living-field` merges, fingerprint attached, tables
appended below.

---

## 6. BASELINE #2 — the required re-run, 02.08.2026 (W2-FIELD2)

Run 2026-08-02, code fingerprint **38a3cd4dc0f1** (clean tree), 30 paired seeds, same cell, same
horizons, same pre-registered threshold. §§2–3 above are untouched; nothing that could re-register a
threshold has moved.

**This is the re-run §3 requires.** The obligation was written against `feat/living-field`, which
landed as the FIELD ring; it transferred to **W2-FIELD2** when W3-FIELD was retired by the owner's
ruling 3 on 02.08 (docs/plans/launch-plan-2026-08.md). Between the two baselines the W-tier field
composition changed twice: living-field phase W gave the W rungs a merged universe of ~300 derived
professionals, and this wave added a fourth storey (`FIELD.size` 300 → 364, a `tourElite` head on
550–11,000 points) and re-measured every W rung's `entrantPctBand` into a sliding window. Those are
exactly "the very fields the 312/416 measurement weeks rank her against".

| week | med rank real | med rank cf | med suppr. | spread | peer Δ (mean) | careers w/ inversion | events in window (mean) | double-paid pts/season | news≠table champion |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 104 | #24 | #24 | **0.5** | −4..+8 | **+12.8** | **23/30 (77%)** | 23.9 | **5482** | 90.9% |
| 208 | #109.5 | #109.5 | **0** | −2..+2 | −0.2 | **0/30 (0%)** | 5.3 | 3612 | 91.8% |
| 312 | #97.5 | #97.5 | 0 | 0..0 | 0.0 | 0/30 | 0.0 | 2423 | 91.8% |
| 416 | #88 | #88 | 0 | 0..0 | 0.0 | 0/30 | 4.9 | 1877 | 92.2% |

Median domestic and WTA suppression are 0 at every measured cell. The paired-horizon cross-check
passed again: every 208w measurement byte-agrees with its 416w twin.

**Against the pre-registered threshold, computed by `verdict()`:**

| pre-registered condition | baseline #1 | baseline #2 | trip? |
| --- | --- | --- | --- |
| median ITF suppression > 10 places at any cell | 0 everywhere | 0.5 worst (week 104) | **no** |
| beaten-rival inversions in > 25% of careers at week 208 | 17% (5/30) | 0% (0/30) | **no** |

**⇒ NOT MATERIAL under the pre-registered threshold on the post-field engine as well.** The §5
verdict therefore stands on a field that now exists, which is the whole reason §3 demanded this run.

**What moved between the two baselines, recorded as data and nothing else:**

1. **The week-104 inversion rate rose 57% → 77%** (17/30 → 23/30 careers with at least one rival she
   beat on court sitting above her on the paying table). §5 already lists the inversion rate as a
   tone-and-integrity finding OUTSIDE the registered threshold; it has got worse, and it is worse in
   the season where she plays most.
2. **The week-208 inversion rate fell 17% → 0%**, and the "events in window" column says why: 9.7 →
   5.3. She is playing even less by then than baseline #1's careers were — the career-shape
   discovery §4 forced into the open, one notch further along.
3. **Peer Δ at week 104 halved, +24.5 → +12.8.** The same double-paid volume (5,383 → 5,482
   pts/season, unchanged inside noise) now scatters across a professional table that is 564 rows
   deep instead of 199, so less of it lands on the ten places either side of her.
4. **The news-vs-table contradiction is unchanged at ~91%** (90.5–92.1% → 90.9–92.2%). Two
   independent 32-draws over one pool still almost never agree, and the fourth storey does not touch
   that arithmetic.

**No Phase B recommendation is made here, and none is implied by any number above.** §2's terms and
§5's verdict are the record; whether the inversion rate and the champion-news contradiction justify
a differently-scoped slice remains the owner's question, exactly as §5 left it.
