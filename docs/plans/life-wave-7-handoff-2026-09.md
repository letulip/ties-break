---
type: plan
status: current
area: life
canonical: false
last-reviewed: 2026-09-18
---

# Wave 7 handoff – «the wedding» (`life/wave-7`, v83): the architect's record

Four builders, four gates, one day. Each builder's full report lives in the session; this file is
the distilled record the repo keeps. Read beside [the brief](life-wave-7-builder-2026-09.md), [the
strings table](life-wave-7-strings-2026-09.md) (65 drafts, ALL awaiting his pass) and [the wedding
spec](../specs/the-wedding-2026-09.md) (predicted before measured).

## What shipped, task by task

| task | commits | one line |
| --- | --- | --- |
| T1 schema v83 | `910677f6` `918c87b5` | `latchedWeek` + `partnerName` on every `LoveEpisode` row, all SEVEN parts (README row included), the peel rung an identity – a 156-week career never reaches 23 |
| T2 the hazard + the beat | `6f1dd63e` | `weddingEligible`/`rollWedding` on `seed:life:wedding:<week>`, `'engaged'` BLOCKING, bless/distance/oppose through the standing `answerLifeBeat` seam |
| T3 the wedding lands | `eccbd578` | `landWedding`: the latch, the kept feed row, the album entry via the milestone channel, `partnerNameFor` persisted at the engagement (28-name pool, first names only) |
| T4 the latch factor | `022cd8e2` | the ending hazard × `latchEndFactor` at `rollEnds`' one seam – marriage steadies the slot; the divorce door stays real and rare |
| T5 spouse-view | `ea12002c` | non-blocking, 4 occasions read off EXISTING seams (tier track ≠ domestic · travel-billed window · `seasonWrapsWithNoVacation` · the round-23 #18 money split), zero draws on ineligible weeks |
| T10 own-key | `c651801b` `d1def7cb` | one-time, narrative-only, gated on the `independent` life stage (not raw 22), zero draws, no mechanic |
| UI wiring | `88fdbb61` | every per-kind map total; both kinds render through the unchanged `LifeBeatDialog` and its standing 375x667 assertion |
| T7 strings | `372d12d4` | the table: 66 drafts → 65 after the ruling, reconciliation code↔table clean both ways |
| T8 bench + spec | `2c1e371f` `44881390` | `tools/wedding-bench.ts` (7 sections, input-independence FIRST) + the spec |
| T9 K5 healed | `12c00815` | the corpus bench never ticked at all – a real-career arm added; addendum in the corpus spec |
| the ruling applied | `0bd18889` | the price removed: 3 writes, funds byte-equal is now the GUARD (red-first arm 8) |

T6 (the naming pass) folded into T3 – zero engine work remained; the pool rides the strings table.

## The measured numbers (168 careers to 31.1, the spec's §3)

* **Input-independence: IDENTICAL over 912 weeks**, eager-vs-drain, shipped and control trees.
* Census **51.2%** latched by 30 (proposed corridor 45–70), median wedding age **26.3**; both
  trajectories marry: one-long 56.6%, several-short 41.5%.
* Latch factor: **6.2 vs 35.2** endings/100 episode-years (control 1.0: 35.2 vs 49.7) – ratio
  0.176 ≈ the shipped 0.15; one second wedding occurred in the grid (the machinery is live).
* Engagement-cancel rate **10.0%**; bond medians 69.5 → 70.5 → 70.5 (the deltas heal in a season).
* Spouse-view **5.13/season vs the 5.2 ceiling – SATURATED**; mix: road 35.6 / swing 33.5 /
  money 30.9 / no-vacation 0.0 (instrument bound: the bench policy books a family week).
* K5: all four gated rows reachable after the heal; `clear-next-week` agrees with the live 91%
  (98.5% on the askable sample); `march-entry-open` reads 24.6% – a DISAGREEMENT reported, not
  averaged (a March deadline's seasonal window is the candidate reading).

## The four gates

Each builder's hand-back was verified by the architect's own commands, verdicts from files with
fresh mtimes: gate 1 – 178 tests (goldens, peel rung, capture); gate 2 – 144 unit + 2177
component + `vue-tsc` 0; gate 3 – engine untouched by the bench builder, spec structure held;
gate 4 – grep-zero on the removed price, 117 tests. The frozen MAIN capture (41550 / `e6b0c709`)
was run at every gate and never moved.

## What the wave did NOT do

No pregnancy, no children, no divorce CONTENT (the schema shape pre-pays it), no `spouseBond`, no
second wallet, no new shock kind, no residence mechanic, no diary memory painting for the wedding
(`MILESTONE_PRIORITY` deliberately unextended – T5+/owner territory), and **no constant ruled**:
every `ECONOMY.wedding` number ships at its drafted value except the RULED `ageGate: 23` and the
REMOVED price.

## Still his

1. The 65 strings and the 28 names – all drafts, the table is the reading order.
2. The census corridor (51.2 measured vs proposed 45–70) and the answer deltas' scale.
3. Spouse-view's saturation – 5.13/season is «every cooldown expiry fires»; if it plays chatty,
   the throttle is one drafted hazard constant.
4. The march-entry-open 24.6% vs live 91% disagreement (K5 addendum) – which instrument reads the
   design's truth.
   ⚠ **Half of this is settled, 26.09, and the half that is his is still open.** C-07 of the
   principles review found the fact certifying a March entry that the college freeze refuses, and
   his ruling 3(a) gates it on `!inCollege(world)` – so the COLLEGE half of the disagreement is
   gone by construction: 24.6 % -> 0.0 %, measured on 130 college pause-weeks. What remains his is
   the original question on the weeks she is NOT at college: whether 24.6 % or the live 91 % reads
   the design's truth there. Nothing about the independent weeks moved.

---

## Two hazards this wave measured – RULED INTO CLAUDE.md on 19.09

⭐ He ruled the room free rather than the rules out: «давай вынеси graphify в отдельный документ и
впиши обе опасности» – the graphify block moved to  and both hazards are
now house law. The full stories stay here. They were parked because `CLAUDE.md` sits **24 characters**
under its own 22,000-character budget and the budget's comment says exactly what that means: the
ceiling «turns the next large addition into a decision rather than a drift». What leaves is the
owner's call, so nothing was removed to make room.

**1. `git commit --amend` defeats the pathspec rule from the other side.** CLAUDE.md already warns
that `git commit` takes the whole index and prescribes the pathspec form. An amend breaks it the
other way: a builder amended their own commit, with a pathspec, while a colleague's commit had
landed on top – and the amend swallowed the colleague's commit under the builder's message. It was
repaired (`git reset --soft <their sha>`, re-commit, both messages verbatim) and nothing was lost,
but only because the builder noticed and said so. **The rule: in a shared checkout never amend, add
a second commit.** A wrong number in a message is cheaper than a commit that ate somebody's work.

**2. A missing exit sentinel is not a verdict.** CLAUDE.md's (a)/(b)/(c) all point at the same
technique – append `echo "…_EXIT=$?"` inside the command and read the verdict out of the file.
Twice this wave a backgrounded run was reported as «failed with exit code 144» while the command
itself ran to completion: the wrapper died before the `echo` could execute, so the file never got
its sentinel and the technique silently could not fire. **No sentinel line means no measurement** –
not a failure and not a pass. Re-run, or wait on the PID.

⚠ And a third thing the budget itself taught: `CLAUDE.md`'s own barrel count had drifted from 280
(19.08) to 698, in the very paragraph whose lesson is «count it, do not quote it». Corrected in
place with both dates rather than deleted, because deleting the stale number would delete the
lesson it is evidence for.
