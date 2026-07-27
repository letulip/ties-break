# "She played" is not "she scored" – the fix, and what it was worth

**Branch:** `fix/rival-fatigue-rows` · off `tune/first-round-zero` (`0b498b3`)
**Closes:** `docs/specs/wave-b-first-round-zero.md` §5(a) and §5(b), the two side effects that slice
surfaced and deliberately left for the owner.
**Change:** three lines of behaviour in two files, plus one named predicate. No knob moved, no
schema bump, no RNG draw added.

## 1. The bug, in one paragraph

The engine records a tournament week by pushing a row into `world.results`. `season/rival.ts`
reconstructs a cohort player's tournament strain from those rows – it is the ONLY record it has –
and both live write sites guarded on `points > 0`. That guard cost nothing while every finish paid:
"has a row" and "played that week" were the same fact. Wave B made a first-round exit worth 0 at
every tier, and the guard then deleted the only record that **half of every draw** had played at
all. A rival who lost her opener read as having RESTED: she banked `recoveryBase` for a week she
spent travelling and playing a match. Meanwhile `season/prehistory.ts` never had the guard, so the
two halves of the engine disagreed about whether a point-less appearance exists.

## 2. What changed

| file | change |
|---|---|
| `src/engine/world.ts` · `runAiTournament` | the `points > 0` guard is **gone**. Every entrant of every draw gets a row; `points` carries the award, 0 included. |
| `src/engine/season/ranking.ts` | new `isCountingResult(r) = r.points > 0`, applied inside `computeRanking` (both the per-player list AND the "seen only in results" tail of the base order) and `windowedBestSum`. |
| `src/engine/world.ts` · `computeCountingResults` | reads through the same predicate, so "counting" means one thing everywhere. |
| `src/engine/season/prehistory.ts` | **no behaviour change** – comments only. |

**Which of the two paths moved, and why: the LIVE path.** Pre-history was already right. It writes a
row for every drawn entry and lets `points` say what the entry was worth, which is exactly the shape
rival fatigue needs; the live bracket was the one throwing the record away. Moving pre-history
instead – adding the missing guard – would have made the two agree at the price of keeping the bug,
because the guard IS the bug. Wave B's §5(b) put the choice this way: "if a played-but-scoreless week
SHOULD leave a record, then world.ts is what changes, not prehistory". It should, so it did.

**Why the ranking filter comes with it.** Scoreless rows are new inhabitants of the ledger and
`computeRanking` reads the ledger. They add 0 to anybody's points, but without the filter a scoreless
row would lend its week to `recency`, silently reordering players who are tied on points – and the
entrant bands are keyed off ORDINAL POSITION in that table, so a reordering would change who gets
into which draw. The filter keeps the standings arithmetic byte-identical to the pre-fix engine given
the same results, which is what makes the measurement below attributable to ONE mechanism: cohort
fatigue, and nothing else.

**The drain formula was not touched and no second one was written.** A reconstructed run's strain is
`tournamentRunStrain` exactly as before (`src/engine/condition.ts`), so a first-round exit costs a
rival one score-less match at that tier – `matchDrain(tier, undefined)`, 2 at Local up to 7 at J300,
ladder-free because it is her first match of the run. The kid pays the identical number for the
identical week.

## 3. Measurement

`tools/rival-fatigue-audit.ts` (new, measurement-only). It borrows the fatigue bench's axes wholesale
– same `PROFILES`, `POLICIES`, seed strings `fatigue-<background>-<i>`, same stepping – so a cell is
the same career as the matching cell of `npm run bench:fatigue`, and "same seeds before and after" is
structural rather than a promise.

Ground truth for "who actually played" is **replayed, not guessed**: `runAiTournament` picks its
field with `selectEntrants(event, cohort, aiRanking, rngFromSeed(seed:aitour:<event.id>))`, all three
inputs are reproducible from the world before the tick, and every entrant of a full draw plays at
least one match. `--verify` asserts the replay against the engine – **0 ghost rows** in every run
below, i.e. no player ever held a row in a week the replay said she was not entered in.

    npx vite-node tools/rival-fatigue-audit.ts --weeks 208 --seeds 30 --verify

4 profiles × 3 policies × 30 seeds × 208 weeks = 360 careers, **2,610,678 cohort appearances**.

### 3.1 The bias is gone

| reading | before | after |
|---|---|---|
| appearances charged NO strain | **45.6%** (1,190,871) | **0.0%** (0) |
| appearances that left no row at all | 45.6% | 0.0% |
| ghost rows | 0 | 0 |

The same worlds read through a points-only ledger – literally what the pre-fix reconstruction saw –
still report **45.3%** blind. So the 45.6 → 0.0 is the guard, not a change of population.

### 3.2 The field is as tired as the tennis it played

| reading | before | after |
|---|---|---|
| mean cohort condition | 81.3 | **75.8** |
| share of field below the strength knee (70) | 25.1% | **29.0%** |
| share of field EVER below the doctor's floor (15) | 35.5% | **39.3%** |

Read the "before" column as an overstatement of 5.5 condition points across the whole cohort, all
season, every season. The counterfactual proves it is the reconstruction and not the schedule: the
same post-fix worlds, read points-only, come back at 81.4 / 25.3% / 36.6% – i.e. almost exactly the
pre-fix numbers, from worlds where the tennis was demonstrably harder.

**On `rivalFatigueWindowWeeks = 16` (flagged, not changed).** It is long, and the fix makes it longer
in effect: a rival now carries roughly twice as many rows through that window, and 39.3% of the field
touches a condition the game would not let the KID take the court at. Rivals have no medical gate –
nothing withdraws them – so the floor is a yardstick here, not a rule they obey. The knob was left
alone on purpose: shortening it is a tuning decision that would move every cohort-strength reading
again, and it should be taken against a bench that is finally unbiased rather than at the same time
as the thing that unbiases it. Recommend it as the next slice's question.

### 3.3 The kid, against that field

| reading | before | after |
|---|---|---|
| cohort win% vs the kid (24,820 kid matches) | 49.4 | **46.4** |
| kid rank, pooled over all season wraps – mean / median | 96.1 / 109 | 94.3 / 111 |
| best wrap rank per career, mean | 64.9 | **59.1** |
| careers that ever reach top-10 | 2.2% | **6.7%** |
| careers that ever reach top-20 | 7.2% | **15.6%** |
| careers that ever reach top-50 | 24.4% | **37.8%** |

Wave B measured win% falling **1–3 points in every cell** when the bug appeared. It has come back
**3.0 points** pooled, and the per-cell moves are concentrated exactly where that slice saw them –
the two 120k policies that lost the most (`balanced` 45.7 → 40.4, `careful` 44.6 → 38.7) and the 8k
pair (44.1 → 39.9, 43.8 → 39.9). The grinder cells barely move (63.0 → 61.3), which is right: she
plays every week whatever the field is doing, so a fresher or tireder opponent changes her win% least.

The rank MEDIAN is the least informative of these numbers – at 208 weeks it sits on the 0-point group
that most careers end in – which is why the distribution is reported instead. The ceiling is what
moved: a career is now about three times as likely to touch the top 10.

Spot-checked outside the audit, on the fatigue bench's own cell (middle / self-coached, 104w, 10
seeds): mean end-of-run ranking points **192 → 417** for `balanced` and **255 → 429** for `careful`.
The kid does markedly better against a field that is finally paying for its own tennis.

### 3.4 Pre-history row counts: unchanged, exactly as intended

| seed | rows | scoreless | % |
|---|---|---|---|
| `fresh-ph` | 672 → 672 | 49 → 49 | 7.3% |
| `bench-wealthy-0` | 684 → 684 | 52 → 52 | 7.6% |
| `counting` | 679 → 679 | 64 → 64 | 9.4% |

`generatePreHistory` is byte-identical before and after – it is the path the live one was moved onto.
Pinned in `tests/rival-fatigue.test.ts` R4 so a future edit to it has to be deliberate.

The live ledger, by contrast, exactly doubles: **1057.5 → 2113.3 rows** at the end of a 208-week run,
of which 1056.0 are scoreless. Same 52-week prune rule, same order of magnitude, ~2k rows.

## 4. Pins moved

| pin | old → new | mechanism |
|---|---|---|
| MAIN-stream capture (B1 / C1) | **41550 / `e6b0c709` – UNMOVED** | writing a row draws no randomness on any stream; the loop already visited every entrant. Verified: count, hash, head and tail byte-identical in `tests/condition.test.ts` and `tests/injuries.test.ts`. |
| `kidRank` (B1 / C1 / P1, week 52) | **133 – UNMOVED**, and NOT vacuously | the fixture really did move: mean cohort condition at week 52 goes 78.42 → 71.95 and the scoring half of the AI ledger has a different fingerprint. But `kidRank` counts how many juniors END the year holding counting points, and that count is 132 both times – a different 132. |
| `tests/round11.test.ts` R11-12a · `world.events.length >= 400` at every wrap | `>= 400` every wrap → `> 300` every wrap **plus** "the cap is reached at least once" | season 1 of that fixture now closes on 362 events (season 2: 402). Same seed, pre → post: entries 25 → 21, tournaments 24 → 19, kid matches 42 → 28. The line exists to witness that the feed IS pruned, so it is now asserted where it is true rather than loosened to a number that keeps it green with the witness gone. |
| `tests/fatigue-bench.test.ts` planner · `balanced.practicesPlayed < grinder.practicesPlayed` | replaced by `balanced.practicesPlayed > 0` **and** `balanced.meanCondition > grinder.meanCondition` | the claim died of the mechanism the same test already documents for `careful`: the grinder lives under `medicalFloor`, where the practice gate refuses a friendly outright, so her friendly count is capped by her body and not by her habit. Measured on that cell (seed 0, 104w): grinder 28 → 31 friendlies, balanced 15 → 34, careful 24 → 55. |
| `tests/wave-b-points.test.ts` W-B3b | re-claimed, not deleted | it pinned the breakage ("a first-round exit produces no ledger row"); it now pins the split that replaced it. |
| `tests/rivals.test.ts` A1 | comment re-claimed | its note said the fix "means touching how she played is recorded (world.ts), not this table". That is what happened; the table is unchanged. |

Nothing in `docs/specs/fatigue-reference.md` or `tests/fatigueReference.test.ts` moved: those are
functions of the drain knobs, and no knob was touched.

## 5. Found, deliberately NOT fixed – an owner decision

**`playedWeeksInTrailing4` (world.ts) has the same bug, on the KID's side.** It counts her competed
weeks out of her own ledger rows to feed `consecutivePlayFactor`, the consecutive-play multiplier on
injury risk – and her write site still guards on `points > 0`, so a week she lost her opener in does
not count as a week she played. Her injury exposure is understated by exactly the weeks wave B
zeroed.

It is left alone here for two reasons, both of which the owner should weigh rather than me:

1. **It is a different subsystem with its own targets.** Her tournament STRAIN is not affected – that
   is charged directly at `finalizeTournament` off the match list, never reconstructed – so this is
   purely an injury-risk question, and injury rates are tuned against `docs/specs/season-life-03-injuries.md`
   and the fatigue bench's own anchors.
2. **Fixing it in this commit would make this commit unmeasurable.** Every number in §3 is
   attributable to one mechanism because the kid's half of the ledger did not move. Changing her
   injury exposure at the same time would confound the cohort reading with a kid reading, and the
   whole point of the slice is that bench readings stop being biased.

The fix, if he wants it, is one line (drop the guard at `finalizeTournament`) plus the `isCountingResult`
filter that already exists to keep her counting-results list and her standings honest – both are in
place. It should be measured on its own.

**`enterEvent`'s one-event-per-week rule does not apply to the cohort.** A rival can be selected into
two draws in the same week, and the fatigue window has always charged her for both (`walkWindow`
loops the week's runs). That is unchanged and probably right – she is 199 players wide and the
brackets are independent – but it is now visible in the row counts, so it is recorded rather than
discovered later.
