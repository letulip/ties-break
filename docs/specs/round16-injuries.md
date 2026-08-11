---
type: spec
status: draft
area: engine/injury
canonical: false
last-reviewed: 2026-08-11
---

# Round 16 – the injury cluster: where the injuries come from, and why nothing said so

**Items:** #13 (three injuries in one season at high condition), #17, #18 (a retirement rendered as a
scoreline), #19 (the popup is owed whatever screen was open).
**Reads:** `docs/specs/round16-triage.md` §1 (the brief), `docs/specs/match-retirement.md` (the engine
half that shipped without a surface), `docs/specs/season-life-03-injuries.md` (the weekly model).
**Instrument:** `tools/injury-cause-probe.ts` – new, measurement-only.
**Schema:** **NOT BUMPED.** See §6.

## 0. The question, and the two hypotheses it had to choose between

The owner's Olivia season took **six weeks out, then four, then four** – three injuries in one season,
at high condition throughout. `injuryTau` reads condition, so high condition is supposed to mean low
risk. The triage refused to argue it and named two candidates:

* **(a)** the weekly roll is behaving exactly as designed and the save is a bad-luck tail (n = 1);
* **(b)** the in-match retirement hazard is **adding** injuries on top of it – which
  `tools/injury-ratio-probe.ts` had already seen once, careful-policy injuries going **24 → 68** when
  retirement shipped, because `retireHazard` reads `spentness`, which accumulates WITHIN a match and
  therefore lands on whoever plays long ones.

**Measure before touching a knob.** This document is the measurement; §7 is the knob I did not touch.

## 1. The instrument, and why it needed no schema change

`npx vite-node tools/injury-cause-probe.ts -- [--seeds 40] [--weeks 208] [--policy careful]`

The obstacle was scouted in advance and is real: `injuryHistory` rows are `{kind, severity, week,
weeksOut}` and carry **no cause**, and `InjuryCause = 'week' | 'retirement'` exists only inside
`src/engine/world/injury.ts`. Putting a cause on the persisted row would be a save-schema move and the
owner's call. It was not needed. The probe recovers the cause three ways, from state the world already
publishes, and **reports all three so a disagreement is visible rather than averaged**:

1. **The sentence the engine wrote.** `onsetInjury` branches on the cause to emit a different news
   line – `"Injury: …"` / `"Bad news from the clinic: …"` for the weekly roll, `"She had to stop: …"` /
   `"She stopped, and this time it is serious: …"` for the retirement. Disjoint prefixes, by the
   owner's ruling of 10.08 that the MOMENT is what makes those two weeks different. This is the same
   technique `tools/fatigue-bench.ts` already uses for its walkover and medical-withdrawal counters.
2. **The persisted fact, with no copy in it.** `WorldEvent.match.retiredId === KID_ID` – true for the
   tournament and the practice friendly alike.
3. **The model's own intent.** `injuryTau(world)` is pure state and spends no draw on any stream, so
   it can be evaluated for the week the tick is about to roll and summed. **Σ tau over her at-risk
   weeks IS the number of weekly-roll injuries the design predicts**, which turns hypothesis (a) from
   an opinion into an arithmetic check.

⚠ **The tau reading is taken pre-tick at `week + 1`, and put back.** `tickWeek` increments the week at
its first statement and reaches `rollInjury` at step 1c – before `accrueCondition`, before this week's
result rows exist, before entries are released – so every input `injuryTau` reads still holds the value
the roll will see. The week number is the only one that has not moved yet. `knockTauFactor` is
week-gated through `knockLive`, so `expireKnock` (which runs between) cannot change the answer either.

**Cross-check (1) against (2): 1,562 onsets across three policies, 0 disagreements.** The two counters
never named a different door.

## 2. What it measured – 400 season-years per policy

40 seeds × 2 profiles (working/self-coached, middle/self-coached – the same two the 104w anchor and
the ratio probe use) × 208 weeks = **400 season-years each**. The unit of observation is a season-year,
because "three in one season" is a statement about a 52-week block and a mean cannot answer it.

**Injuries per season, by the door they came in by:**

| policy | mean condition | weekly roll | **retirement** | total | retirement share |
|---|---|---|---|---|---|
| careful (the high-condition arm) | 77.7 | 0.465 | **0.730** | 1.195 | **61.1%** |
| balanced | 70.6 | 0.535 | **0.677** | 1.212 | **55.9%** |
| grinder | 41.5 | 0.800 | **0.698** | 1.498 | **46.6%** |

**And it gets worse the fresher she is – which is the whole finding.** Careful policy, by the season's
own mean condition:

| season mean condition | seasons | weekly roll | retirement | total | retirement share |
|---|---|---|---|---|---|
| **>= 80** | 190 | 0.300 | **0.632** | 0.932 | **67.8%** |
| 70–79 | 74 | 0.595 | 0.797 | 1.392 | 57.3% |
| 40–69 | 136 | 0.625 | 0.831 | 1.456 | 57.1% |

⚠ **The retirement count barely moves with condition while the weekly count halves.** That is exactly
the mechanism `match-retirement.md` §4.1 predicted and called a dilution of the C3 signal: the hazard
is zero for the first 120 points, so a retirement is **a long-match event**, and long matches are what
a fresh girl plays. At mean condition 80+ the weekly model – the only one anybody has ever tuned – is
delivering **less than a third** of her injuries.

## 3. Predicted vs measured, on the weekly roll alone (CLAUDE.md invariant 4)

**PREDICTED:** Σ `injuryTau` over her at-risk weeks. **MEASURED:** weekly-cause onsets.

| policy | at-risk weeks | predicted | measured | deviation |
|---|---|---|---|---|
| careful | 15,029 | 185.1 | **186** | **+0.07 s.e.** |
| balanced | 14,926 | 211.0 | **214** | **+0.21 s.e.** |
| grinder | 14,634 | 284.9 | **320** | +2.08 s.e. |

**Hypothesis (a) is answered: the weekly roll is behaving exactly as designed.** In the two arms that
are about the owner's question – the ones that live at high condition – the measured count sits inside
a quarter of a standard error of the model's own prediction. There is no excess to find there.

⚠ **The grinder's +2.08 s.e. is left OPEN and is not this document's finding.** It is the one arm the
owner's question is not about (mean condition 41.5), the residual is +12% on a count of 320, and I can
name candidates but have not measured one: the Poisson s.e. treats onsets as independent when a layoff
removes weeks from the at-risk set and lets condition recover, which induces exactly this sign of
correlation. **Do not tune on that cell.** If it matters, it is its own measurement.

**And the retirement is not misfiring either** – it is on its own shipped calibration:

| policy | her matches | retirement onsets | share | `match-retirement.md` §4 target |
|---|---|---|---|---|
| careful | 19,421 | 292 | 1.50% | 1.39% |
| balanced | 17,736 | 271 | 1.53% | 1.39% |
| grinder | 13,564 | 279 | 2.06% | 1.39% |

So neither model is broken. **They are simply additive, and nobody ever added them up.**

## 4. THE ANSWER – is three-in-a-season at high condition inside the distribution?

Careful policy, the 264 season-years whose mean condition was 70 or better:

| injuries in the season | 0 | 1 | 2 | **3** | **4+** | **P(>= 3)** |
|---|---|---|---|---|---|---|
| **as the game actually ships** | 115 | 56 | 63 | 25 | 5 | **11.4%** |
| **the weekly roll alone** | 180 | 69 | 13 | 2 | 0 | **0.8%** |

Worst season observed: **6 injuries**. The same shape holds on the other two policies at high
condition (balanced 6.3% vs 0.5%; grinder 9.7% vs 0.0%).

**Stated plainly, both ways round, because the answer depends on which model you ask:**

* **Against the game as it ships, three injuries in a season at high condition is INSIDE the
  distribution – comfortably. It happens to about one season in nine.** The owner's save is not a
  freak. It is a common outcome.
* **Against the weekly injury model alone – the only part of this that has ever been tuned, and the
  part the design's "high condition means low risk" promise lives in – it is essentially OUTSIDE:
  about one season in 125.**

So the owner's instinct that something is wrong is **correct**, and hypothesis **(b) is the live one**.
Roughly two in three of his injuries arrive through a door the risk model does not know exists, and it
is the door that opens WIDER the better he looks after her.

⚠ **A consequence worth naming before anybody tunes.** The two doors are not simply additive in the
optimistic direction either: an injury week takes the weekly occurrence roll off the table entirely
(`rollInjury` returns early while `world.injury` is set), so retirement injuries partly **substitute**
for weekly ones. The retirement share above is therefore a lower bound on how much the retirement has
added, not an upper one.

## 5. What shipped – the surfacing (#17/#18/#19)

**The rate was measured and left alone. The silence was the defect that shipped a fix.**

### 5.1 The popup is a consequence of state now, not of a screen having been open

`InjuryStopDialog` has existed since R9-21a and was gated on the `'injury'` **stop reason**. Only
`advanceWeeks` ever produces one – from `world.injury.sinceWeek === world.week`, asked immediately
after `tickWeek`. That catches the two doors that open **inside** the tick:

| door | opened by | inside the tick? | popup before this fix |
|---|---|---|---|
| the weekly roll | `rollInjury`, step 1c | yes | ✅ |
| a practice friendly | `resolvePractice`, step 1c | yes | ✅ |
| **a tournament retirement** | `retirementInjury` ← `finalizeTournament` ← `closeTournament` | **no – a separate command** | **❌ never, in any career** |

The third is **61% of this game's injuries**. `match-retirement.md` §6 called that omission deliberate
("a second dialog over the finale would be two popups for one beat"); **#18 is the owner overruling
it**, having watched a retirement go past as a scoreline with no explanation attached.

The fix is the argument App.vue's own knock gate has been making since W4: **read a snapshot field,
not a stop reason.** The gate is now the engine's own predicate – `injury.sinceWeek === week` – asked
where the answer survives the command that produced it, plus `!pending` so the report lands *after*
the reveal rather than over it. That keeps the promise the old note was really making.

Two supporting moves:

* **`SnapshotInjury` gains `sinceWeek`.** It was the one persisted field the snapshot deliberately
  dropped, and that omission is what made the dialog dependent on being *told* an injury was fresh.
* **The report is acknowledged by IDENTITY** (`sinceWeek:kind`), persisted per career in localStorage
  like the news / This-week / trophy watermarks. A per-snapshot dismiss flag only worked while the
  GATE was per-advance too; a state gate outlives the advance, so setting the plan on the onset week
  would otherwise re-raise the same popup for ever. ⚠ **An unknown injury counts as unreported** – the
  opposite default to `storedTrophyWatermark`, because the failure modes are not symmetric: showing
  the report twice costs a tap, never showing it cost the owner three injuries.

### 5.2 It says WHEN and WHY

`weekLabel(injury.sinceWeek)` rather than "now", and a **How** row that tells the two doors apart –
read off `WorldEvent.match.retiredId === KID_ID`, the persisted fact, not off the news sentence:

* on court, naming the opponent, and *"The round she had reached is hers"* – the owner's ruling of
  10.08 in the one place a frightened parent will read it;
* a practice friendly said apart from a tournament (there is no round to keep);
* ⚠ and off-court kept **deliberately vague** – *"Off court – it came on between matches."* The engine
  records nothing about where a weekly-roll injury happened (it can land on a training week, a travel
  week, an arrival week or a family holiday), so "she felt it in training" is a sentence this surface
  is forbidden to write. Same honesty rule the commentary and the diary are held to.

### 5.3 The retirement is visible where the result is read

⚠ **Two surfaces of #18 are NOT in this slice, both because another agent holds the file this wave:**
the commentary beat (below) and the **Season card's bracket plaque** (`SeasonScreen.vue`). The plaque
already carries the fact in its VERB – "retired against" / "beat a retiring", the retirement slice's
own solution to the `plaqueLines` trailing-token coupling – so it is the least broken of the three;
the box score below was the one showing a bare *"wins 4-5"*.

`MatchViewer`'s box score said **`{winner} wins {score}`** and nothing else, so a retirement in the
first set rendered as *"Ines Duval wins 4-5"* – a winner with fewer games than the loser, no marker,
no explanation, on the one screen whose whole job is to say what happened. `result.retired` had been
on the match since the retirement slice and **no component had ever read it.** It now carries the
sport's own marker (`ret.`) plus one plain line under it, because three letters are a convention a
parent watching her daughter's first season has no reason to know.

⚠ **The COMMENTARY line is not in this slice, and it is owed.** `src/viz/commentary.ts` is owned by
the commentary cluster (triage §2) this wave and two agents were briefly pointed at it at once; the
retirement's beat still reads *"X cannot continue. Y goes through."*, which says a scoreboard's worth
and not that she is hurt. **Handed to the commentary agent**, whose file it is. The suggested wording,
for whoever takes it: *"X cannot continue. She retires hurt – Y goes through."* – it matches the word
the tournament summary has printed since the retirement slice (*" – she retired hurt"*), so the
surfaces describing one moment would describe it alike, and it keeps every pin in
`tests/viz/commentary.test.ts` green (the beat still starts with the retiring player's name, still
contains the winner's, still says neither "straight sets" nor "in three").

⚠ **RNG discipline held (invariant 2), and `commentary.ts` was left untouched by this slice** – so
its pins at `tests/viz/commentary.test.ts:43`/`:58` (the `Math.random` trap and the no-RNG-import
source pin) are not this wave's to re-aim and were not touched. Nothing here draws on any stream at
all: `injuryTau` is pure state, the snapshot builder draws nothing, the dialog and the viewer are
presentation, and the probe only reads.

## 6. Save schema: NOT bumped

`SAVE_SCHEMA_VERSION` is untouched and `engine/migrations.ts` has no new entry.

`SnapshotInjury.sinceWeek` is a **view** change. `Snapshot` is what the worker posts to the UI; the
save is `WorldState`, which has carried `injury.sinceWeek` since slice C. Nothing new is persisted, so
there is nothing for a migration to do. The two doc comments that stated the old omission out loud
(`protocol.ts` on `SnapshotInjury`, `world.ts` on `WorldState.injury`) are **restated in place** rather
than left lying.

**The cause is still NOT on `injuryHistory`.** Adding it would be the three-part move and it is the
owner's call; §1 shows the measurement did not need it.

## 7. The knob I did not touch, and the levers if he wants one

**No balance constant was changed.** The measurement names `RETIRE_K = 0.07` as the source of the
additive load, and stops there – the rate is *on its own calibration target* (§3), so this is not a
mis-set knob, it is a **design question the owner has not been asked yet**: is one retirement per ~67
of her matches, landing preferentially on a fresh girl who plays long matches, the amount of injury he
wants on top of the weekly model?

The levers, in order of honesty – the same list `match-retirement.md` §4.1 drew up, now with the
number that was missing from it:

1. **Nothing.** Accept ~1.2 injuries a season at high condition, two thirds of them retirements, and
   accept that "high condition means low risk" is now only true of one of the two doors. The rate
   matches the real-world anchor (2.73% of matches, PLOS ONE 2024) and the fiction is honest.
2. **Lower `RETIRE_K`.** It is the one knob that moves this and it moves nothing else; halving it
   would take the careful arm from 1.195 to ~0.83 injuries a season and the retirement share from 61%
   to ~44%. The cost is that the measured 2.81%-of-matches calibration against the real tour breaks –
   he would be choosing the game's feel over the anchor, knowingly.
3. **Make the weekly model KNOW about the second door** – e.g. suppress or damp the weekly roll for
   some weeks after a retirement, so the two stop stacking. This is the only lever that keeps both
   calibrations, and it is the most work.
4. **Nothing, plus the surfacing** – which is what shipped, and is worth re-measuring against before
   anything else is done. A large part of #13 may simply have been that three injuries arrived with no
   explanation attached to any of them, and the owner is now told what happened, when, and why.

**Recommended: ship §5, re-read a season, and decide (1)–(3) with that in hand.**

## 8. Guards

`tests/round16-injury-surfacing.test.ts` (unit) – the engine half. An advance onto a retirement week
returns `'tournament'` and **not** `'injury'`, because the layoff does not exist yet – the defect in
one assertion – and once the reveal closes the layoff is open, dated this week, and on the snapshot.
Plus source pins that the gate reads `sinceWeek === week`, no longer reads `stopReasons`, and
acknowledges by identity.

`tests/component/injury-surfacing.test.ts` (component, mounted) – the copy. The dialog names the
injury, severity and layoff; tells a tournament retirement from a practice one from an ordinary
layoff; refuses to invent a place for an off-court injury; dates the injury rather than "now"; and does
**not** mistake an OPPONENT's retirement for hers. The viewer's box score carries `ret.` and the plain
sentence on a retirement and neither on a completed match.

⚠ **MUTATION-VERIFIED.** `retiredName` forced to null kills the retirement viewer test and correctly
leaves the completed-match control green; `circumstance` forced to its off-court branch kills both
dialog retirement tests; `snapshot.injury.sinceWeek` shifted by one kills both engine tests. All three
restored.

**Four fixtures re-aimed, none weakened:** `tests/calendar-grid.test.ts` and
`tests/calendar-screen.test.ts` build `SnapshotInjury` literals by hand and now carry the field the
type requires. ⚠ Nothing in the calendar reads `sinceWeek`, so the value is inert there and every
original assertion is unchanged – the alternative, making the field optional, would have re-created
the exact defect this document is about (`undefined === week` is silently false, for ever).
