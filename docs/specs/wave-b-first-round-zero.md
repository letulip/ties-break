# Wave B, slice 1 — "a first-round loss pays ZERO": what it measured

**Branch:** `tune/first-round-zero` · **Worktree:** `/Users/letulip/Projects/Claude/tb-pts` (off `abfda7d`)
**Change:** the LAST element of every `TIERS[t].points` array, and nothing else.
**Grounding:** `docs/research/ranking-points-by-tier.md` §1 / §5(b), ITF Reg 31(a).

| tier | before | after |
|---|---|---|
| local | `[30, 18, 10, 5]` | `[30, 18, 10, 0]` |
| regional | `[80, 48, 28, 14, 6]` | `[80, 48, 28, 14, 0]` |
| national | `[200, 120, 70, 35, 15, 6]` | `[200, 120, 70, 35, 15, 0]` |
| j30 | `[400, 240, 140, 70, 30, 12]` | `[400, 240, 140, 70, 30, 0]` |
| j60 | `[600, 360, 210, 105, 45, 18]` | `[600, 360, 210, 105, 45, 0]` |
| j300 | `[1000, 600, 350, 175, 75, 30]` | `[1000, 600, 350, 175, 75, 0]` |

The index claim was verified from the engine before the arrays were touched, and is pinned as a test
rather than asserted as a comment (`tests/wave-b-points.test.ts`, W-B1): `runTournament` sets
`finishes[loser] = rounds - round` with round 0 = the first round, so a first-round loser's finish is
exactly `rounds`, the last slot of a `rounds + 1`-long array. Half of every draw lands there.

The research's "72-point floor" reproduces exactly on the engine: 26 J30 first-round exits at 12
points, best-6 = 72. It is now 0.

## How it was measured

Three benches, same seeds before and after, everything below from runs actually taken:

- `npm run bench:econ` — entry policy v3, 4 profiles × 30 seeds, 14→16 and 14→18.
- `npm run bench:fatigue` — 4 profiles × 3 policies × 30 seeds, 52w / 104w / 208w.
- `npx vite-node tools/points-curve.ts` — NEW, added by this slice. Borrows the fatigue bench's
  profiles, policies and seed strings wholesale (so a cell is the same career), and reports the
  three things neither shipped bench prints: the season-points curve, **band clearance** (how long
  it takes to clear each `enterPointBand`, and how many careers ever do), and the rank bands.

## 1. The points curve fell everywhere — 12 cells of 12

Mean ranking points earned per season, 208w / 4 seasons / 30 seeds (`tools/points-curve.ts`):

| profile | policy | before | after | Δ |
|---|---|---|---|---|
| 8k working self | grinder | 100 ±64 | 64 ±76 | **−36%** |
| 8k working self | balanced | 387 ±362 | 310 ±309 | −20% |
| 8k working self | careful | 332 ±326 | 274 ±331 | −17% |
| 25k middle self | grinder | 98 ±76 | 60 ±61 | **−39%** |
| 25k middle self | balanced | 284 ±387 | 200 ±293 | −30% |
| 25k middle self | careful | 271 ±421 | 206 ±349 | −24% |
| 25k middle hired | grinder | 78 ±138 | 60 ±109 | −23% |
| 25k middle hired | balanced | 148 ±288 | 129 ±268 | −13% |
| 25k middle hired | careful | 156 ±307 | 137 ±276 | −12% |
| 120k wealthy hired | grinder | 200 ±120 | 138 ±124 | −31% |
| 120k wealthy hired | balanced | 619 ±789 | 484 ±660 | −22% |
| 120k wealthy hired | careful | 670 ±867 | 527 ±693 | −21% |

The grinder loses the most (−31 to −39%), which is the intended shape: the policy that enters
everything and wins least was the one living on the participation floor. Spread narrows with the
mean in 9 of 12 cells, so this is the floor being removed rather than variance being added.

## 2. The ladder did NOT stall — but the top of it got harder

The number most at risk was j30's 180 gate. It holds, and in most cells arrives **sooner**:

| gate | 8k balanced | 25k self balanced | 25k hired balanced | 120k balanced |
|---|---|---|---|---|
| regional 65 | 30/30 w9 → 30/30 w10 | 30/30 w11 → 30/30 w13 | 30/30 w11 → 30/30 w13 | 30/30 w10 → 30/30 w11 |
| national 150 | 27/30 w26 → **29/30** w34 | 30/30 w46 → 28/30 w34 | 23/30 w38 → **24/30** w32 | 29/30 w34 → 28/30 w28 |
| **j30 180** | 26/30 w37 → **29/30** w36 | 28/30 w48 → 28/30 w37.5 | 18/30 w37.5 → **23/30** w37 | 26/30 w36 → **27/30** w36 |
| j60 400 | 24/30 w45 → 23/30 w45 | 25/30 w56 → **19/30** w45 | 15/30 w44 → **11/30** w40 | 24/30 w40 → 26/30 w44 |
| j300 900 | 9/30 w70 → **7/30** w32 | 11/30 w58 → **6/30** w50 | 2/30 → 2/30 | 24/30 w46 → **21/30** w61 |

Read as "n of 30 careers that ever clear it · median week of first arrival". Nothing reads 0/30 that
did not before, so **no rung became unreachable**. The pattern is a ladder that got *stickier at the
J30 rung*: the 180 gate is as easy as ever, while 400 and 900 slipped in 6 of the 8 non-grinder cells.

## 3. The grind did NOT fall — and the two benches disagree about its direction

This is the finding that matters most for the next decision.

**Under the fatigue bench's policies (52w, one season), J30 entries went UP:**

| profile | policy | j30/season before → after | travel/season | survived |
|---|---|---|---|---|
| 8k working | balanced | 3.8 → **4.9** (+29%) | $5,538 → $6,442 | 63% → 57% |
| 8k working | careful | 3.4 → **4.3** (+26%) | $5,221 → $6,081 | 63% → 50% |
| 25k self | balanced | 3.1 → **4.9** (+58%) | $6,781 → $9,295 | 87% → 83% |
| 25k self | careful | 3.2 → **4.5** (+41%) | $7,190 → $9,938 | 77% → 73% |
| 25k hired | balanced | 2.5 → **3.4** (+36%) | $6,318 → $8,532 | 60% → **37%** |
| 25k hired | careful | 2.4 → **3.5** (+46%) | $6,278 → $8,590 | 63% → **40%** |
| 120k wealthy | balanced | 5.7 → 5.8 | $14,539 → $14,564 | 100% → 100% |

**Under the econ bench's entry policy v3 (14→18), J30 entries went DOWN:**

| profile | j30/career before → after | j60 | local | regional | survived |
|---|---|---|---|---|---|
| 8k working | 13.8 → **11.2** (−19%) | 2.4 → **0.8** | 21.3 → 30.3 | 27.5 → 31.5 | 6/30 → **10/30** |
| 25k self | 13.5 → **10.4** (−23%) | 2.1 → 2.0 | 17.6 → 24.1 | 23.4 → 25.5 | 6/30 → 7/30 |
| 25k hired | 4.0 → 4.0 | 0.2 → 0.5 | 10.3 → 12.3 | 10.5 → 9.8 | 0/30 → 0/30 |
| 120k wealthy | 35.1 → 35.1 | 15.3 → **10.3** | 12.9 → 15.3 | 13.1 → 14.3 | 2/30 → 4/30 |

Same engine, same change, opposite sign on the headline metric — because the two policies differ in
what they spend on (the fatigue policies book practice and rescue vacations; v3 does not) and
therefore in what they can afford. **The J30 count is not controlled by the J30 first-round value.**
It is controlled by eligibility, affordability and calendar density: `everyNWeeks: 2` puts 26 J30s a
season on the calendar, and any policy that enters the strongest tier it qualifies for will keep
taking them. That is the thing the retable's own §6 already argued, and this slice is the evidence.

What IS consistent across both benches: **local and regional entries rise, and J60/J300 reach falls.**
She spends longer on the domestic rungs and gets to the expensive ones less often.

## 4. Season W-L, survival, and the outcome bands

Per-season W-L and rank bands, 208w (`tools/points-curve.ts`):

| profile · policy | W-L before → after | win% | best rank | top-10 | top-20 |
|---|---|---|---|---|---|
| 8k balanced | 12.7-9.4 → 12.7-10.0 | 57.4 → 55.9 | #47 → #51 | 2/30 → 0/30 | 4/30 → 2/30 |
| 25k self balanced | 8.8-7.0 → 8.4-6.8 | 55.9 → 55.0 | #44 → #55 | 0/30 → 0/30 | 5/30 → 0/30 |
| 25k self careful | 8.4-6.5 → 8.2-6.4 | 56.4 → 55.9 | #46 → #54 | 3/30 → 1/30 | 4/30 → 1/30 |
| 120k balanced | 13.6-10.4 → 12.6-10.6 | 56.5 → 54.3 | #23 → #28 | 17/30 → 12/30 | 20/30 → 16/30 |
| 120k careful | 14.3-10.3 → 13.1-10.5 | 58.0 → 55.4 | #23 → #25 | 18/30 → 10/30 | 20/30 → 17/30 |

Win% falls 1-3 points in every cell. That is not a points effect — it is §5 below.

**Against `career-outcome-targets.md`,** measured of ALL starts:

| target | aim | before | after |
|---|---|---|---|
| family solvent 14→18 | **60-80%** | 21.1% (76/360) | **18.6%** (67/360) |
| pro contour (econ 14→18 reach proxy) | 50-65% conditional | 70/60/60/90% | 53/43/50/83% |

Both were already far outside target before this change and remain so; solvency moved 2.5 points the
wrong way. The other bands (lives from tennis, top-100, slam, quit) are **not measurable today** and
were not estimated: the doc itself records them as "not yet wired as bench assertions", the quit
mechanic needs the morale system (Phase 6), and a 200-player field (199 cohort + kid) has no defined
analog for "top-100" or "top-250". The rank-band columns above are the honest substitute.

## 5. TWO SIDE EFFECTS THE OWNER HAS TO RULE ON

Both come from one root: **the engine uses "has a row in `world.results`" as the record that a week
was PLAYED, and both write sites guard on `points > 0`.** Until now every finish paid, so the two
were the same thing. Zeroing the first round pulls them apart for the first time.

**(a) Rivals who lose their opener no longer accrue any tournament strain.** `rival.ts`
`rivalCondition` reconstructs a rival's fatigue from her ledger rows. With no row, her week reads as
a QUIET week: she earns `recoveryBase` instead of paying for a trip and a match. Half of every
32-draw is now invisible to it, so **the whole cohort is systematically fresher than before** — which
is the mechanism behind the win% drop and the rank regression in §4, and it makes the game harder in
a way nobody chose. Pinned in `tests/wave-b-points.test.ts` (W-B3b) and `tests/rivals.test.ts` (A1).
Not fixed here: the fix is in how a played week is recorded (`world.ts`), not in the points table.

**(b) Pre-history and the live engine now disagree about whether a scoreless week exists.**
`prehistory.ts` has NO `points > 0` guard, so it still writes first-round exits — now as 0-point
rows. Measured: 49/672, 52/684, 64/679 rows (7-9%) on seeds `fresh-ph` / `bench-wealthy-0` /
`counting`. Consequence: the kid is no longer the only point-less player at week 0, so she no longer
opens ranked strictly last. `kidRank` on a fresh career moved **200 → 197** (`fresh-ph`; 195 on
`bench-wealthy-0`), sharing the bottom rank with 3-5 cohort players. "Ranked last" still holds —
nobody is below her — but "the only one down there", which was the entire point of the pre-history
slice, does not. `rankLabel` still reads "Unranked" until she owns a counting result, so the visible
symptom is muted. A one-line guard in `prehistory.ts` fixes it, but the right answer depends on (a):
if a played-but-scoreless week SHOULD leave a record, then world.ts is what changes, not prehistory.

One accidental repair worth noting: the 30-point ambiguity flagged in `tests/rivals.test.ts` A2 —
where a tier-less legacy row read as a J300 first round rather than the likelier Local title — is
**fixed by this change**, because a J300 first round is no longer worth 30. No tie-break knob needed.

## 6. Pins moved

| pin | old → new | mechanism |
|---|---|---|
| MAIN-stream capture | **41550 / `e6b0c709` — UNMOVED** | points are post-draw arithmetic; count, hash, head and tail all byte-identical in condition/injuries/planner |
| `kidRank` (B1/C1/P1, week 52) | 140 → **133** | `awardAiPoints` writes only when `points > 0`; 7 fewer juniors end the year holding counting points, and the point-less kid shares that larger 0-point group's rank |
| `kidRank` fresh career | 200 → **197** | §5(b) |
| `kidRank` fresh (`bench-wealthy-0`) | 200 → **195** | §5(b) |
| `reconstructRun(30)` tier-less | j300/1 match/7 → **local/3 matches/8** | j300 R1 no longer produces 30, so the false candidate disappeared |
| tier `points` arrays | see table at top | the change itself |

`docs/specs/fatigue-reference.md` and `tests/fatigueReference.test.ts` did **not** move: the points
table feeds no fatigue knob. Nothing was regenerated and nothing was hand-edited.

## 7. What this did NOT fix — the case for the retable

Zeroing the first round **did** remove the participation income (points −12% to −39%, the grinder
hit hardest) and it did it without stalling the ladder. It did **not** touch any of the three things
`ranking-points-by-tier.md` actually blames:

1. **`J300 = 2.5 × J30` when reality says 10×.** Untouched. A perfect J30 season still caps at 2400
   and still outscores a J300 title 2.4-to-1, so there is still no reason to get on the expensive
   plane. The measured J300 reach *fell* (§2), which makes this worse, not better.
2. **`j30 = 400` vs `national = 200`.** Untouched, and still inverted against both published
   federation ladders (USTA 3.3×, LTA 2.2× the other way).
3. **The grind itself.** §3: not controlled by the first-round value at all. The two benches move it
   in opposite directions, which is as clear a signal as this slice can give that the lever is
   elsewhere — supply (`everyNWeeks: 2` = 26 J30s a season) and the per-year age caps the research
   flags in §2, not the points table.

**Recommendation for the next slice.** The retable (three international rungs = real ITF ×10,
domestic rungs via the LTA conversion, ladder reordered to `local < regional < j30 < j60 < national
< j300`, all six `enterPointBand`s rescaled) is still needed for 1 and 2 — this slice removed none
of its motivation. But it should be sequenced **after** a decision on §5(a): the retable will be
measured on the same benches, and while first-round losers are invisible to rival fatigue, every
cohort-strength reading those benches produce is biased fresh. Fixing the ledger/record split first
makes the retable's measurement trustworthy; doing it after means measuring the retable twice.

The first-round zero itself should stay either way. It is right by the source, it costs nothing that
the numbers show the player wanting back, and it is the one piece of the retable that is already done.
