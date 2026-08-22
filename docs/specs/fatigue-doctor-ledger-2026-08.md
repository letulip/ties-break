---
type: specification
status: current
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-22
---

# The doctor's ledger – why the veto test inverted, and what recklessness actually costs

**MEASUREMENT AND A TEST RE-AIM. No engine line is touched.** The doctor's-veto test in
`tests/fatigue-bench-planner.test.ts` went red on main with three assertions simultaneously false,
and the claim it pinned – "the doctor is a grinder phenomenon" – appeared to have INVERTED: the
managed policies took 2.3x more medical blocks than the degenerate policy that ignores every
warning (26 vs 59, seed 3), the under-floor ratio fell 3.30x -> 2.38x, and the withdrawals
direction flipped (14 vs 16). This spec records the diagnosis: **the phenomenon did not invert –
the metric did.** The instrument is `tools/fatigue-ledger-diag.ts` (committed with this spec) –
replays of the bench's own cells through the same `openFatigueCareer`/`stepFatigueWeek` the tests
call, plus a per-week classification of why a sub-floor week produced no countable veto; every
number below reproduces deterministically from the bench's seeds
(`npx vite-node tools/fatigue-ledger-diag.ts`).

## §1 The owner's ruling (22.08, verbatim – the criterion everything below is judged by)

> «если кто-то из игроков плюнет на восстановление – сам будет виноват и сам будет нести
> последствия в виде травм и прочего, это должно быть четко и явно. Я аккуратно играл и всё равно
> травмы были, так что я ожидаю, что у играющих неаккуратно должно быть больше последствий и
> жестче»

Recklessness must cost more than care, clearly and visibly. The question the old test asked –
"who accumulates more refused-entry EVENTS at one seed" – is not that question, and it stopped
agreeing with it the day the magnitudes shrank.

## §2 What flipped, mechanically – three hypotheses, numbers per hypothesis

Bisected steps (both verified before this branch): the blocks DIRECTION flipped at `7494525` (the
coach's edge, 13.08 – coached careers go deeper, play more, meet the doctor more) and the
under-floor ratio fell 3.30x -> 2.38x at `41ce43a` (the domestic season-to-date table).

**H1 – "the degenerate policy dies/deranks early and stops having entries to veto": the DEATH
half is REJECTED, the DERANK half is real and measured.** Over 40 careers per policy (4 profiles
x seeds 0-9, 104w): grinder endings 0, dead weeks 0, entries 62.2/career vs the managed 64.8 –
she is alive and entering. But classify every sub-floor week by why it produced no countable
veto and the derank channel appears: 77 of the grinder's 207 sub-floor weeks (37%) offer NO
vetoable event inside the commit window at all, against 19 of 109 (17%) for balanced – because
only 8 of her 40 careers ever hold a rank, so the international rungs stay shut and her
refusable calendar is thinner. The counter's affordability clause is negligible (2 of 207
weeks); rehab suppression likewise (6 of 207).

**H2 – "she is injured out, so consequences land as injuries, not vetoes": REJECTED.** Injury
onsets 150 (grinder) vs 134 (balanced) vs 136 (careful); weeks lost 360 vs 347 vs 330. Nearly
equal totals – no differential suppression by rehab weeks either (floor-weeks spent injured are
0-1 per career for every policy).

**H3 – "the managed policies under-rest for the post-coach-edge world (instrument defect)":
REJECTED as an instrument defect – it is the game, and it is a game the owner asked for.** The
managed policies did not get sloppier; they got BETTER at tennis. Since the coach's edge and the
season-table change, care buys wins and wins cost condition: balanced/careful play ~120-122
matches per career against the grinder's 95.8, because the grinder – living under the
`matchStrengthKnee` – loses her openers. Deep runs occasionally end a week under the floor even
for a careful parent (she enters at floor+10 and a five-match run outspends the margin), and a
dense, affordable calendar in front of a wealthy managed family multiply-counts every such dip
(the wealthy·elite cell alone contributes 45 of the managed 59 blocks at seed 3; the test's own
comment already warns that blocks "multiply-count a single dip").

**So the inversion is three defects of the METRIC, not one of the game:** (a) raw sums compare 4
grinder careers against 8 managed careers – an asymmetry that never mattered at 199-vs-5 and
decides everything at 26-vs-59; (b) blocks multiply-count calendar density x wallet, which now
correlates with CARE rather than with recklessness; (c) one seed, at magnitudes ~8x smaller than
when the pins were set (the whole phenomenon shrank: grinder life under the floor 27.9% of weeks
at the 26.07 measure -> 5.0% today).

## §3 The full consequence ledger (4 profiles x seeds 0-9, 104w, 40 careers per policy)

    metric                                grinder     balanced     careful
    medical blocks (total)                   218         164          70
    medical withdrawals (total)              119          65          14
    medical warnings (total)                 313         121          25
    weeks below medical floor                207         109          23
    injury onsets                            150         134         136
      of them moderate / major / severe   24/8/2      18/8/2      21/9/0
    weeks lost injured                       360         347         330
    career-ending injuries                     0           0           0
    bankruptcy endings                         0           2           0
    entries (mean/career)                   62.2        65.2        64.4
    matches (mean/career)                   95.8       121.8       119.6
    wins (mean/career)                      49.0        73.3        70.7
    end ITF points (mean)                    5.7        69.8        61.0
    prize money (mean/career)               $0.0     $1241.5     $1031.8
    careers ever ranked                     8/40       35/40       29/40
    best rank while ranked (mean)           62.3        44.6        46.1

Per career, the doctor still visits the grinder more on every surface: blocks 5.45 vs 2.93,
withdrawals 2.98 vs 0.99, warnings 7.8 vs 1.8, life under the floor 4.98% of weeks vs 1.59%
(ratio 3.13x pooled over ten seeds, 3.22x over seeds 0-3; per-seed the pooled ratio wobbles
1.83x to 18x, which is why one seed could read 2.38x).

**And the totals answer the owner's question in the game's favour, with one thin channel.** The
grinder's recklessness costs her: the career itself (8/40 ever ranked vs 35/40; zero prize money
against ~$1.2k; 5.7 end points against ~70), the doctor (every surface, per career), and the body
per match played – 3.9 injury onsets per 100 matches vs ~2.8. What keeps her injury TOTAL near
the careful player's is exposure: she loses her openers, so she simply plays ~25% fewer matches.
Consequences land as losses, warnings and a destroyed career rather than as extra absolute
injuries.

## §4 The honest baseline – the owner's own saves (read-only)

He said he played carefully and still had injuries. His careers agree, and they calibrate what
"careful" costs: naomi (working·middle coach, 75/25+physio, week 674): 11 injuries – 9 minor, 1
moderate, 1 major – 29 weeks lost over ~13 seasons (0.85/season). ines (middle·middle, week 570):
4 injuries, 8 weeks lost (~0.36/season). alice (middle·middle, week 474, reached rank 1): 6
injuries, 13 weeks lost. olivia (working·self on the GRIND plan 85/15, week 464): 9 injuries with
6 moderate, 29 weeks lost – the harshest severity mix of the four, on the most reckless plan.
Direction in his own play matches the ruling; the bench's archetypes sit above his rates because
they enter far more events per season than he does.

## §5 What the test now pins (re-aimed, not weakened)

The rewritten assertions pin the ruling's own claim – "recklessness costs more than care, in
total and visibly" – on a sample that can support it (seeds 0-3 x 4 profiles, per-career means,
32 managed careers against 16 grinder ones):

1. the PHENOMENON: the grinder lives under the medical floor a multiple of the managed share
   (bound 2x against a measured ~3x; degenerate answer 1x), and the managed share stays small;
2. the DOCTOR, per career: more blocks, more withdrawals, more warnings for the grinder;
3. the CAREER: fewer wins, fewer end points, fewer ranked careers, and per-match injury rate
   higher for the grinder – the totals through which the owner's «жестче» is actually delivered.

Old assertions that compared raw sums across unequal run counts are gone, with a ⚠ note in the
file naming this spec. Every rewritten assertion was mutation-tested (property reverted, red
observed).

## §6 For the owner – the one thin channel, and a proposal with numbers (his call)

By his criterion the game is already right on totals, but the INJURY channel alone is thin:
+12% onsets (150 vs 134), +4% weeks lost, severity mix nearly identical (moderate 24 vs 18-21,
major 8 vs 8-9, severe 2 vs 0-2). If «последствия в виде травм … жестче» is meant to be visible
on the injury feed itself and not only in the standings, the lever is the condition->injury
coupling below the knee: today a wrecked body pays ~1.4x per match (3.9 vs 2.8 onsets per 100
matches); steepening the sub-knee tau curve so a low-condition match pays ~2.5-3x would put the
grinder at roughly 260-320 onsets per 40 careers (vs ~134 managed) and push her severity mix
visibly worse, while touching a careful career barely at all (the managed policies spend ~1.6%
of their weeks under the floor against the grinder's ~5%, and their matches are played fresh).
Magnitude is a tuning decision with its own bench run; nothing here presumes it.
