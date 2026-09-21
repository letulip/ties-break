---
type: plan
status: current
area: life
canonical: false
last-reviewed: 2026-09-20
---

# Wave 8 handoff – «the pregnancy and the return» (`life/wave-8`, v85): the architect's record

Thirteen builders, twelve architect gates plus a baseline, one day. ⚠ Counted, not quoted. Each builder's full report lives in the session; this file is
the distilled record the repo keeps. Read beside [the brief](life-wave-8-builder-2026-09.md), [the
strings table](life-wave-8-strings-2026-09.md) (30 drafts, ALL awaiting his pass) and [the motherhood
spec](../specs/the-motherhood-2026-09.md) (predicted before measured).

**36 commits, `c322301c`..`c6963f8a`, cut from `2bcd2b58`.**

## What shipped, task by task

| task | commits | one line |
| --- | --- | --- |
| the brief | `c322301c` | the two documents, and his go of 20.09 recorded in the header |
| T1 schema v85 | `97bf1850` | `world.pregnancy`, `world.children`, `spiritShock.kind` widened – all seven parts, and the frozen careers an identity at every rung |
| *the architect* | `b43729a9` | the `postpartum` counsel column is unreachable by STRUCTURE, not «until T4» |
| T2 the hazard + the beat | `5b025575` | `pregnancyChanceAt` on `seed:life:pregnancy:<week>`, `'expecting'` BLOCKING, three answers priced on `bond` AND persisted as `support` |
| T2½ three structural things | `2a853442` `993dbddf` `8a3c50e2` | v85 grows `world.comeback`; the `if`-chain that bricked saves in silence becomes a total record; at most ONE pregnancy per career |
| T3 the pause | `6f4e7679` | entries close on the ONE gate, read at the EVENT's week; **nothing released**; the weeks tick |
| T4 the birth | `99cde889` | the row, the kept line, the album entry, the `'postpartum'` shock – and funds byte-equal as the GUARD |
| T5 the decision + `'family'` | `233c04f6` | one coin at the window's end, the record cleared on BOTH arms, a ninth ending that needed **zero** new branches |
| T6 the return | `90080f7e` `f82683b1` `9a4774c6` `82b23137` | the freeze (12/156), the staged factor as a TYPE-fenced function, the ramp – and the fall door's pregnancy clause |
| T7 sponsors | `8fd78e76` | measured, and **no constant ships**: the absence already costs her 30% over three years |
| T8 strings | `c4f91152` … `56f14dcb` | 30 drafts, the provenance walk both ways, and the sweep's own defect measured |
| T9 bench + spec | `1f4f5e6a` … `ed74a354` | eleven sections predicted-then-measured, three disagreements named, the anomaly's cause found |
| *the architect* | `8ae00f7f` | a mislabelled census denominator in T7's section |
| T10 UI | `0c8efae7` `22204249` | the portraits on no union, ONE wire field, and the strings table re-walked |
| T11 the gate | *(no commit)* | the gate in a clean worktree, the wave's frozen identity on five cells, and the e2e case measured as unreachable |
| T11b the last two | `827efe6f` `b9fd70c0` `c6963f8a` | `▶▶` can no longer outrun her card; a twelfth fixture parked inside the pause |

## ⭐⭐⭐ WAVE 8b – THE REVIEW BATCH, one builder, `42b5ebd2`..`edaa0f03` (+ the docs commit)

Opened by his rulings of 21.09 – «да, деноминируем, и Алисину руку тоже давай. Делай спеку на все эти
обсужденные по результатам ревью задачи» – plus an «ок» per item on four strings. The brief is
[life-wave-8b-builder-2026-09.md](life-wave-8b-builder-2026-09.md); ⚠ **NO SCHEMA MOVE ANYWHERE IN
IT**, and none was needed.

| task | commit | one line |
| --- | --- | --- |
| *pre-existing* | `42b5ebd2` | ⚠ the staircase research had no governance frontmatter – `context:audit` was RED at the batch's starting point |
| T1 the strings | `d3cd523e` | C2's post-birth variant on ONE condition, C3, C4 (the sixty-character overlap is now **five**), C5's natural draft with a PER-ROW lint exemption, F2's `grep DRAFT` |
| T2 the diary band | `ff4adbd2` | C6's eight lines, DERIVED at render off three v85 keys – ⭐ the gap this handoff called «wave-2 machinery» cost **no schema move** |
| *pre-existing* | `5de1b2a1` | ⚠ `fade-read.ts` printed «0 knocks» for every save ever handed to it – a cast hid the wrong field name, and `check:tools` was RED at the starting point |
| T3 the staircase | `1c45efc9` | `comebackStages` re-denominated in **Elo** (−200/−100/−50/0), `eloPerCore` **by import**, the copied `20.2` removed from the probe too |
| T4 the postpartum floor | `ef19cb0e` | D5: the base −30 → **−36**, the scale untouched, `warm` now LEVEL with the break-up at both intensities |
| T5 the birth portrait | `8704608e` | the painting ships at **40,166 B**, the bride pays **26,094 B**, and both were read at 375-width DEVICE pixels |
| T6 the album page | `f0481383` | A34 in his corpus document (12 DRAFT strings), the branch turned into a table, and a test that WALKS to a birth |
| T7 the Alice arm | `edaa0f03` | measurement only – [the unclosable head](../research/the-unclosable-head-2026-09.md), four levers named and **unmoved** |
| T8 docs | `de0fab3f` `1ce72f53` | the questions' statuses with his words, this table, the spec addendum, and the sweep counts DATED |
| *the bench* | `7cb78263` | 168 careers × 1300 weeks on BOTH new constants – the D8 ladder and the recovery corridors, spec §15.1a and §15.2 |

### ⚠⚠ THREE THINGS THE BATCH FOUND THAT THE WAVE'S OWN GATE COULD NOT HAVE SEEN

1. **`npm run check` was RED at `76348e6f`, in three places, and all three predate the batch.**
   `context:audit` (the staircase research's missing frontmatter), `check:tools` (`fade-read.ts`'
   cast), and `tools:registry:check` (`tools/README.md` lists neither of the two instruments that
   landed with the brief). ⭐ The wave's own `CHECK_EXIT=0` is still true – it ran at `c6963f8a`,
   before those three commits.
2. ⚠⚠⚠ **THE RE-DENOMINATION DID NOT FIX A1 – IT WIDENED IT.** Paired A/B on the same eight seeds,
   arm A a worktree at `5de1b2a1`: straight-back ahead **8 of 8 on BOTH trees**, mean points
   141/55 → **191/54**, the gap 2.6× → **3.5×**. Arm A reproduces the shipped transcription to the
   digit. The mechanism is arithmetic – a shallower handicap makes her a stronger returner, and a
   stronger returner earns more from a big draw than from a W15. **T9's «no drafted number could
   close it» now stands measured twice**, and the three candidates are unchanged and all design.
3. ⚠⚠ **FOUR OF HIS EIGHT DIARY LINES BREAK THIS POOL'S PINNED 80-CHARACTER SCRAP BUDGET** (87, 88,
   106, 89) **and two put the journal in the singular first person**, where its voice has been a
   household «we» for a year. Not one character was reworded and neither law was loosened: the six
   sentences are BASELINED WITH CUSTODY in `tests/week-notes.test.ts`, named, dated, counted, and
   re-arming on any edit. It is the strings table's §8 Q-9 and it is his.

⭐ **AND THE BENCH RE-RAN ON BOTH NEW CONSTANTS** (`BENCH_EXIT=0`, 168 careers, 17 reaching a
pregnancy – **14.5% of married against wave 8's own 15.1%**, so neither constant disturbed the hazard
the wave measured):

* **T3's prediction 3 CONFIRMED** – the D8 ladder at 104 weeks moved **12.5 / 54.2 / 66.7 → 33.3 /
  86.7 / 93.3%** at top 100 / 200 / 500, which brackets the research's «~40% near top-150» exactly.
  ⚠ The hardest bar is unmoved: back to her rank at the pause is **0/14 at 104 weeks**, so §14.3's
  «nobody gets their ranking back» stands.
* **T4's corridors** moved **3.5 / 4.5 / 5.5 → 5.0 / 6.0 / 7.0** weeks, ordering untouched, and the
  psychologist still takes two weeks off every grade.
* ⚠⚠ **A1 CONFIRMED A THIRD TIME** – straight-back ahead **14 of 15**, mean points **703 against 0**.
  The posed 8/8, the paired A/B and now the grid all say the same thing about a constant that was
  predicted to flip it.

## The measured numbers (240 careers × 1300 weeks, the spec's own sections)

* **Input-independence: the law HOLDS**, shipped tree and control tree, on a seed searched until it
  reached both new blocking cards. `rngMain.n` never moves across an `answerLifeBeat`.
* Census **15.1%** of latched careers by 35 (predicted corridor 15–30%), median announcement age
  **30.2**, zero outside 24–35.
* The decision's live chances **0.81 / 0.66 / 0.46** by `support` grade – the model exact against its
  drafts to 0.01.
* The protected rank: **12.0 of 12 spent, 0 of 15 expired unused** – and only by the straight-back arm.
* The ranking decay during the absence: **1.9% of points kept**, #31 → #1620, by construction.
* Postpartum recovery: **3.5 / 4.5 / 5.5** weeks by grade, **2.0 / 3.0 / 3.5** with the psychologist.
* Sponsors: she keeps **70.0%** of her own twin's brand income over 155 weeks.

## The gates

Every hand-back was verified by the architect's own commands, verdicts read from files with fresh
mtimes, never through a pipe and never from a wrapper's notification. The golden fixture was
**re-derived** (`migrateSave(v84.json)`) at three separate gates; `PRE_V85` was checked against the
shipped v84 `FROZEN` constants character for character each time a key was added.

**The wave's own gate**, clean worktree, `npm ci`: `CI_EXIT=0` · `CHECK_EXIT=0` · `E2E_EXIT=0`
(131 passed) · `SIM_EXIT=0` (13/13, serialised). The frozen MAIN capture (41550 / `e6b0c709`) is
untouched and **not re-pinned**; the frozen careers are an identity on **five** cells, only
`schemaVersion` moving and that confirmed by hash identity rather than by «it changed».

## ⚠ THE FINDING THE OWNER MUST READ – the ramp trap runs BACKWARDS

§2 T6 predicts «the wrong ramp must measurably fail more often», with «if the two arms tie, that is a
finding to bring, not a shrug». They do not tie. **They reverse.** Straight-back is ahead on points
on 8 of 8 careers (T6) and **16 of 18, zero against** (T9's bench), spending 12 of 12 protected
entries against small-first's 0.

The cause is **isolated, not guessed**: a diagnostic arm of big draws ONLY – twelve entries and
nothing else for a year – still beat a full small-events programme. **Twelve first-round exits at a
Slam, at 0.6 of her wings, out-earn a year of W15s.** The staged factor works exactly as designed and
losing the big draws still pays more. ⭐ T9 found two things eight careers could not show: small-first's
zero was the **bench policy**, not the plan (releasing two policy brakes gives 24.2 events/yr), and at
**104 weeks the diagnostic arm passes straight-back, 499 against 450** – the freeze is spent by then.

**No constant was moved in either direction.** The measurement is pinned in
`tests/wave8-return-ramp.test.ts` §D in a shape **built to go red the day somebody fixes it**.

## Three defects this wave found in instruments, not in the product

1. **`wedding-bench.ts` §(g) will MIS-REPORT on wave 8.** It folds MAIN + funds + condition + season
   into one line, justified by «everything either arm may differ on moves `bond` and nothing else».
   False now: `support` reaches `spirit`, and `returnPlan` changes which events she books. **A folded
   comparison would report this wave's DESIGN as a P0.** Do not reuse its shape unchanged.
2. **The strings provenance grep is fragile, and so is its published remedy.** `grep '⚠ DRAFT'` finds
   22 of the wave's 39 flagged lines, and its count did not move AT ALL for T10. The remedy offered in
   T8 §9's second form (`grep -E '⚠+ ?\*{0,2}DRAFT'`) returns 28 – it drops the eleven
   `**THE BUILDER'S DRAFT**` spellings. **Only plain `grep DRAFT` is sound.**
3. **`life-beat-dialog.test.ts` measured the wrong element.** Every fit case measured the card before
   a selection, where the last element is the last ANSWER – but since round 42 #8 the control that
   records and closes a blocking beat is `.life-beat-proceed`, appended after the choices and taller.
   **Nothing had ever taken that measurement**, in the file that exists because of round-20 #3.

## Three process facts, all of them the architect's own misses

* **Gates 1–3 did not run `npm run test:component`, and it was RED the whole time** –
  `round29-build-line.test.ts` pins `SAVE_SCHEMA_VERSION` and T1's bump left it at 84 for three
  commits. Found by T3, whose own gate list carried the suite. `npm run check` contains it; hand
  assembling the gate is what let it through.
* **`npm run test:quiet -- <files>` does not filter** – `scripts/units.mjs` reads only `--verbose`
  and `--only=`. The brief said it did; it cost a builder two aborted runs.
* **The provenance grep above was prescribed by the architect**, copied from wave 7, where it worked
  only because that wave's builders happened to spell every flag identically. ⚠ Wave 7's table was
  checked and is **not** affected: all eight lines its narrow grep missed are pool headers or numbers,
  both carried in its own §5.

## What the wave did NOT do

No child-as-state texture, no travel calculus, no standing cost line, no resilience bonus, no repeat
pregnancy enabled, no divorce content, no `spouseBond`, no bereavement, no dynasty, no pregnancy
outside marriage, no boys, no birth fee, no second wallet, no results-driven form – and **no constant
moved on any agent's word**: every §2 number ships at its drafted value.

Two things the brief asked for that did **not** ship, both stated rather than quietly dropped: the
**diary half** of T3's pregnancy texture (the feed row shipped; a diary band needs a new `DiaryFacts`
field, which is wave-2 machinery T3 was not asked to reshape), and `pauseBrandFactor`, which T7
measured and **declined**.

## Still his

1. The **30 strings** and the four picks – all drafts, the table is the reading order.
2. The **ramp trap running backwards** – a points floor, a body cost on big weeks, or accepting that
   our economy makes the freeze a good bet.
3. The **benched corridors**, and the two rulings the architect made inside the wave and shipped as
   revertible commits: the fall door's pregnancy clause (`82b23137`) and the `▶▶` guard (`827efe6f`).
4. **«She plays on for 8 weeks» is 6 weeks of entering** for anybody (the 2-week deadline) and 3 for a
   parent who commits near it. Nothing on screen is wrong; `playsOnWeeks` is a door-closing DATE, not
   an entry budget. His word on which it should be.
5. The full questions list – [life-wave-8-questions-2026-09.md](life-wave-8-questions-2026-09.md),
   six headings, ordered by what a «no» would cost rather than by the task that raised each one.
