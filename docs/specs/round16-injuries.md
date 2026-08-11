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

---

# §9 – THE CONSEQUENCE, NOT THE RATE: the retirement door gets its own severity table

**Written 11.08, after the owner read §1–§8.** Everything above measured the problem and shipped the
surfacing; this section is the fix, and it changes exactly one thing.

## 9.0 The ruling that bounds it

> «RETIRE_K оставляем как есть, дверь схода надо показывать, а 3 мощные травмы 6-4-4 недели подряд
> одна за одной – это слишком… это значит, что у нас с механикой что-то не то. Это надо чинить.»

Three instructions, and they close off almost every lever §7 listed:

* **the RATE does not move.** `RETIRE_K = 0.07` is untouched, and its 1.50%-of-matches calibration
  (§3) stands. Lever 2 is dead by ruling.
* **the door stays visible.** §5 shipped and is untouched.
* **and what is wrong is the CONSEQUENCE.** Not how often she stops – what stopping costs her.

## 9.1 The diagnosis, verified before it was fixed

`retirementInjury` called `onsetInjury(world, rng, 'retirement', …)`, and `onsetInjury` read
`ECONOMY.availability.severityBands` – **the same table a weekly-roll injury uses**: minor 60% (1-2
wk), moderate 30% (3-6 wk), major 7.5% (8-14 wk), severe 2.5% (16-22 wk). Nominal mean **3.55 weeks**.

Confirmed against the game rather than against the source: the probe's severity mix for the
retirement door read **63.7 / 27.7 / 6.2 / 2.4** at careful policy, i.e. the weekly design inside
sampling error. And measured whole, **36.3% of retirements cost 3+ weeks and 16.8% cost 6+**. The
owner's 6, 4 and 4 are three draws from a table that hands out a 3-6 week layoff nearly a third of
the time – and §2 showed **61% of all her injuries, 68% at high condition, arrive through this door**.
So the acute-injury table was most of what the player actually experienced.

## 9.2 The argument – the mechanism, not the feel

A girl who stops mid-match because her legs are gone is not the same event as a girl who tears
something. Four independent readings say so, and none of them is "it feels harsh":

1. **THE TRIGGER IS EXHAUSTION, BY CONSTRUCTION.** `retireHazard = RETIRE_K × spentness(n, stamina)`
   is zero for the first 120 points and rises with IN-MATCH fatigue. `match-retirement.md` §3 says it
   in as many words – *"A retirement in this engine is exhaustion, not accident"* – and names the
   rolled ankle at 2-2 in the first set as the thing it deliberately does **not** model. A hazard
   indexed on how spent she is was handing out the consequences of an accident it never rolled.
2. **THE RULEBOOKS PUT THAT CATEGORY OUTSIDE INJURY ALTOGETHER.** `retirement-and-withdrawal.md` §6:
   the tour's medical rules refuse a medical time-out for **cramping**, and list **"general player
   fatigue"** as non-treatable – not out of severity but because there is nothing to treat. Cramp,
   heat and a spent body are exactly what this hazard fires on.
3. **THE 2.73% ANCHOR IS A STOPPAGE RATE, NOT AN INJURY RATE.** `RETIRE_K` is calibrated against PLOS
   ONE 2024, and that study's own caveat (research §7, flag (b)) is that it counts matches *"that
   started but did not finish for any reason – illness, injury and anything else are pooled"*. A rate
   borrowed from a pooled population must carry that population's severity mix. Ours carried the mix
   of a diagnosed acute injury instead, which is the one population the anchor is **not**.
4. **THE RULES ARE WRITTEN AROUND HER PLAYING THE FOLLOWING WEEK.** WTA §IV.C.1 is an entire clause
   about the player who retires and is entered next week – examined here, form submitted there,
   examined again on arrival. The ITF junior certificate (CoC §III.B.2.b) is scoped **by default** to
   *"the following week's"* tournament, with §III.B.2.c as the extension for anything longer.
   Rulebooks do not spend their paragraphs on the exception.

**Stated for the owner: a six-week layoff from a retirement should be rare, not a third of them.**

⚠ **What the research does NOT give, and it is worth being honest about.** No source, primary or
secondary, reports the *distribution of time lost* after a tennis retirement – research §7 flag (c)
already records that even junior retirement RATES were not found. So the shape below is argued from the
mechanism and from the rulebooks' own structure, not read off a table. The four bands are a design
decision with reasons attached, which is the most the evidence supports.

## 9.3 The table, band by band

`ECONOMY.availability.retirementSeverityBands` – new; `severityBands` is unchanged and is now the
weekly roll's alone.

| band | weekly (unchanged) | **retirement (new)** | why it is there |
|---|---|---|---|
| minor | 60%, 1-2 wk | **80%, 1-2 wk** | The modal mid-match stoppage is cramp, heat or a tweak that settles. A 1-week layoff in this engine is exactly *"she plays the following week"* – `rollInjury` clears at step 1c of the next tick, before she is asked to enter anything. Four in five, because that is what "the normal case, but not the only one" looks like as a number. |
| moderate | 30%, 3-6 wk | **15%, 3-5 wk** | A spent body moves badly and does pull things, so this must survive – as the minority, not as a third. **Halved.** The ceiling drops 6 → 5 because six is the owner's own number: a six-week layoff is an acute event, and acute events belong to the bands below. |
| major | 7.5%, 8-14 wk | **4%, 8-14 wk** | Roughly halved, **length unchanged**. |
| severe | 2.5%, 16-22 wk | **1%, 16-22 wk** | Roughly halved, **length unchanged**. KEPT DELIBERATELY – see §9.7. |
| | nominal mean **3.55 wk** | nominal mean **2.43 wk** | |

**The line the table draws, and it is one sentence:** minor and moderate are the **exhaustion**
outcomes, so their lengths follow the mechanism; major and severe are the **accident** outcomes – the
body genuinely broke – and a stress reaction does not heal faster because it happened at 5-5 in the
third. So above moderate, what changes is **how often you get there, never what it costs when you do**.

**The transformation in one line:** the probability of anything worse than a niggle is cut by half at
every band, and minor absorbs the difference. 30 → 15, 7.5 → 4, 2.5 → 1, 60 → 80.

## 9.4 ⚠ RNG: the draw sequence is UNCHANGED, and this is why no career re-bases

`onsetInjury` spends **exactly three pulls, in exactly one order, unconditionally**: `rng()` for
severity, `pickInt(rng, lo, hi)` for weeks-out, `drawBodyRegionFrom(rng, table)` for the region. This
change adds nothing and removes nothing:

* the severity uniform is pulled **before** either table is consulted, so the table only decides what
  an already-drawn number *means* – the same post-draw discipline every multiplier in `injuryTau`
  and `ENDINGS.injuryPriorWeeksOut` are built on;
* `pickInt` is `min + Math.floor(rng() * (max - min + 1))` – **one pull for any range**, including a
  collapsed one, so narrowing moderate to 3-5 cannot change the count;
* `drawBodyRegionFrom` takes **one pull for any table** (pinned in body.ts's own header).

So `seed:retire:<week>` and `seed:injury:<week>` are byte-identical in position to before, and the
frozen MAIN capture (41550 / `e6b0c709`) never saw either stream. **This is pinned, not asserted:**
`tests/injuries.test.ts` C12 counts the pulls for both causes on a wrapped generator (3 and 3), and
then proves the stronger form – after an onset, the caller's generator is exactly three steps on,
whichever table was read.

**No schema change.** `InjurySeverity` is untouched, so `SEVERITY_DESCRIPTOR`, `onsetCostCents`, the
snapshot, the dialog and every persisted `injuryHistory` row keep their vocabulary. The only new
thing in the world is a constant.

## 9.5 PREDICTED vs MEASURED (CLAUDE.md invariant 4)

Same instrument as §1–§4 – `tools/injury-cause-probe.ts`, extended (measurement-only) to report the
LENGTH of a layoff by door and the WEEKS LOST per season, because §1–§4 could count injuries and not
weigh them. Same corpus: 40 seeds × 2 profiles × 208 weeks = **400 season-years per policy**.

⚠ **The BEFORE run reproduces §2 and §4 to the decimal** (0.465 / 0.730 / 1.195, 61.1%, 11.4%, 186
against a predicted 185.1, 292 of 19,421 matches = 1.50%). The instrument is the same instrument.

**PREDICTED, written down before the run:**

| | prediction | reasoning |
|---|---|---|
| mean weeks per retirement | 3.38 → **~2.3** served | nominal 3.55 → 2.43, × the ~0.95 the physio factor already takes off |
| P(3+ wk \| retirement) | 36.3% → **~19%** | 20% by design, a little less once physio rounds 3s down to 2 |
| P(6+ wk \| retirement) | 16.8% → **5%** | moderate now tops at 5, so 6+ is major-or-worse only |
| **weeks lost per season, careful** | 4.04 → **~3.4** | the retirement door's 2.47 falls by a third; the weekly door does not move |
| injuries per season | **UP slightly** | shorter layoffs → more at-risk weeks → more weekly rolls, and more matches → more retirement hazard |
| P(>= 3 injuries) at high condition | 11.4% → **up a little** | same reason; the RATE was not touched, so the count cannot fall |

**MEASURED:**

### Injuries per season – the count barely moves, exactly as predicted

| policy | weekly | retirement | total | retirement share |
|---|---|---|---|---|
| careful | 0.465 → **0.500** | 0.730 → **0.695** | 1.195 → **1.195** | 61.1% → **58.2%** |
| balanced | 0.535 → **0.590** | 0.677 → **0.695** | 1.212 → **1.285** | 55.9% → **54.1%** |
| grinder | 0.800 → **0.813** | 0.698 → **0.713** | 1.498 → **1.525** | 46.6% → **46.7%** |

The weekly count rises in all three arms and the substitution named in §4's ⚠ is why: an injury week
takes the weekly occurrence roll off the table entirely, so shortening the retirement layoffs hands
weeks **back** to the weekly model. Careful's at-risk weeks went 15,029 → 15,321. **The total count is
unchanged at careful and up 6% at balanced** – and that is the honest, slightly counter-intuitive
result this measurement exists to catch: *she gets hurt just as often, and loses far less to it.*

### And both calibrations survive untouched

| policy | retirement, % of her matches (target 1.39%) | weekly roll, measured vs Σ tau |
|---|---|---|
| careful | 1.50% → **1.41%** | 186 / 185.1 (+0.07 s.e.) → **200 / 190.6 (+0.68 s.e.)** |
| balanced | 1.53% → **1.50%** | 214 / 211.0 (+0.21 s.e.) → **236 / 222.9 (+0.87 s.e.)** |
| grinder | 2.06% → **2.09%** | 320 / 284.9 (+2.08 s.e.) → **325 / 292.0 (+1.93 s.e.)** |

`RETIRE_K` did not move and neither did the rate: careful's 292 → 278 onsets is 0.8 Poisson s.e., i.e.
noise between two sets of careers that diverged the moment the first layoff got shorter. The weekly
roll is still inside one s.e. of its own prediction in the two arms the owner's question is about.
⚠ **The grinder's residual is still OPEN and still not this document's finding** – it was +2.08 s.e.
before and is +1.93 s.e. after, i.e. untouched by this change, exactly as §3's note said it should be.

### The consequence – which is the whole of what moved

Careful policy, every retirement onset measured whole:

| | before | **after** |
|---|---|---|
| severity mix (minor/mod/major/severe) | 63.7 / 27.7 / 6.2 / 2.4 | **83.5 / 13.3 / 2.9 / 0.4** |
| mean weeks served | 3.38 | **2.18** |
| median | 2 | **2** |
| **P(3+ weeks)** | **36.3%** | **16.5%** |
| **P(6+ weeks)** | **16.8%** | **3.2%** |
| P(8+ weeks) | 8.6% | **3.2%** |
| worst observed | 21 wk | 16 wk |

The weekly door over the same runs: mean 3.47 → 3.69, P(3+) 36.0% → 37.5%. **It did not move**; the
drift is 186 versus 200 onsets drawn from an unchanged table.

Predicted ~2.3 mean, measured **2.18**. Predicted ~19% at 3+, measured **16.5%**. Predicted 5% at 6+,
measured **3.2%** – all three landed slightly *shorter* than predicted, because the physio recovery
factor rounds a 3-week band down more often than a 6-week one.

## 9.6 WEEKS LOST PER SEASON – the number the owner actually feels

| policy | before | **after** | change | via the weekly door | via the retirement door |
|---|---|---|---|---|---|
| **careful** | **4.04** | **3.31** | **-18%** | 1.61 → **1.84** | **2.47 → 1.51 (-39%)** |
| balanced | 4.31 | **3.70** | -14% | 1.97 → 2.07 | 2.46 → **1.71 (-30%)** |
| grinder | 5.04 | **4.37** | -13% | 2.77 → 2.80 | 2.35 → **1.65 (-30%)** |

And at the condition band his question is about – careful policy, season mean ≥ 70, 261 season-years:
**weeks lost fell 4.03 → 3.05, a fifth of her season back.**

⚠ **The finding underneath the headline: the retirement door is no longer the majority of what she
loses.** Before, it opened 2.47 of the 4.08 weeks a careful season lost – 61%, matching its 61% share
of the injuries. After, it opens 1.51 of 3.36 – **45%.** The weekly model, which is the only half of
this that has ever been tuned and the half the design's *"high condition means low risk"* promise
lives in, is the larger half of her lost season again.

## 9.7 Three-in-a-season – inside or outside what a player should expect?

Careful policy, the season-years at mean condition ≥ 70 – **264 before, 261 after**. ⚠ The two arms
are not the same seasons and cannot be: shortening a layoff changes which weeks she plays, so a career
diverges from its first retirement onward and a season's mean condition lands differently. Paired
seeds, unpaired seasons; the counts are close because the divergence is small, not because it is zero.

| | 0 | 1 | 2 | **3** | **4+** | **P(>= 3)** |
|---|---|---|---|---|---|---|
| before | 115 | 56 | 63 | 25 | 5 | **11.4%** |
| **after** | 119 | 57 | 58 | 21 | 6 | **10.3%** |

**Three injuries in a season is still inside the distribution, and it was always going to be.** The
owner ruled the rate untouched, and the count of injuries is a fact about the rate – 10.3% against
11.4% is 1.1 points on 261 seasons, i.e. noise. **A player at high condition should still expect
about one season in ten to carry three injuries. That has not changed and was not asked to.**

**What changed is what those three seasons cost, and that is the question his sentence was really
asking.** «3 мощные травмы 6-4-4 недели» is a claim about **fourteen weeks**, not about the number
three, so the probe now measures both:

| careful, season mean condition >= 70 | before | **after** |
|---|---|---|
| mean weeks lost in a season | 4.03 | **3.05** |
| P(season loses 6+ weeks) | 26.1% | **20.7%** |
| P(season loses 10+ weeks) | 13.6% | **8.4%** |
| **P(3+ injuries AND 10+ weeks lost) – his season** | **5.3%** | **2.3%** |

**The answer, stated both ways round because they differ:**

* **Three injuries in a season: INSIDE, and deliberately still inside. About one season in ten.** A
  season with three stoppages in it is a normal season of tennis; the game should be able to tell that
  story.
* **The owner's season – three injuries that cost fourteen weeks between them – has gone from about
  one season in nineteen to about one in forty-three.** That is the outcome he called «слишком», and
  it is now a genuinely bad year rather than a routine one.

Same direction on the other two arms: balanced 6.3% → 5.0%, grinder 10.0% → 6.3% (all seasons).

## 9.8 ⚠ AND THE FAILURE MODE ON THE OTHER SIDE – does the door still read as a real event?

**If a retirement costs a day it stops mattering, and #18's dialog becomes a popup about nothing.**
This was measured too, deliberately, in the same table:

| careful policy | before | **after** |
|---|---|---|
| she is back the following week (1 wk) | 31.8% | **41.0%** |
| she misses at least one more week (2+ wks) | 68.2% | **59.0%** |
| a real layoff (3+ wks) | 36.3% | **16.5%** |
| the one that changes a season (8+ wks) | 8.6% | **3.2%** |

**It is still an event, and here is the case in full:**

* **59% of retirements still cost her more than the week she stopped in** – the majority, not a
  rump. The modal outcome is not "nothing happened".
* **One retirement in six still costs 3+ weeks**, so the door can still take a run of tournaments off
  her, and the parent cannot treat "she stopped" as free.
* **The severe band was kept alive on purpose.** It is 1% rather than 2.5%, and it still fires –
  measured onsets, and it is the only band that reaches the copy's own worst sentence, *"She stopped,
  and this time it is serious: … The dream takes a hit."* A band nobody draws is a sentence nobody
  reads. At ~0.7 retirements a season that is roughly **one career in fourteen over ten seasons** –
  rare enough to be a story, on the same standard `ENDINGS.injuryPriorWeeksOut` was measured to (4.4%
  of full-life careers).
* **And the retirement itself was never only the layoff.** She loses the match she was in, keeps only
  the round she had reached, gives up the week's remaining tennis, and the news line, the dialog and
  the `ret.` box score all fire. §5's whole surfacing sits on top of this and is untouched.

⚠ **The one consequence that genuinely got rarer, named rather than buried:** the career-ending
injury (`ENDINGS`, #4) needs a fresh `severe` on a body that has already lost 20 weeks, and this
change reduces both terms through the retirement door. It was measured at 4.4% of full-life careers
before this wave; it will be lower now. **Not re-measured here** – it is `tools/endings-bench.ts`'s
question over full careers, not this probe's over 208 weeks, and no test pins it. Flagged for the
owner: if the career-ending injury is meant to hold its 4.4%, `injuryPriorWeeksOut` is the knob and it
is a separate measurement.

## 9.9 What did NOT change

* **`RETIRE_K = 0.07`** – by ruling. Measured after: 1.41% / 1.50% / 2.09% of her matches against a
  1.39% target, i.e. where it was.
* **`severityBands`** – the weekly roll's table, byte-identical. Its 60/30/10 Monte-Carlo pin
  (`tests/injuries.test.ts` C7) is untouched and green.
* **Every draw on every stream.** See §9.4.
* **`SAVE_SCHEMA_VERSION`**, `migrations.ts`, `InjurySeverity`, the snapshot, the dialog, the box
  score, the news copy, `tiltedBodyRegions`, the entry sweep, the onset bill.
* **§5's surfacing**, in full.

## 9.10 Guards

**`tests/injuries.test.ts` C12 – new, five assertions, and the first two are about RNG rather than
balance.** A per-cause table is only safe because it changes what an already-drawn uniform *means*;
if a future edit ever makes one door spend a different number of pulls, every existing career's
`seed:retire:<week>` re-bases from that week on, silently, and only for the careers that got hurt.
So: both causes spend exactly three pulls; and after an onset the caller's generator sits exactly
three steps on, whichever table was read. Then the tables are checked well-formed (four labels in
order, cumulative, ending at exactly 1 – a table whose last `cum` fell short would silently fall
through on high rolls), the retirement mix is measured through the real door over 600 seeds against
its own design, and the weekly cause is measured the same way as a controlled A/B.

⚠ **MUTATION-VERIFIED.** Pointing `severityBandsFor` at the weekly table for both causes kills the
retirement Monte-Carlo and leaves C7's weekly 60/30/10 sample green – the pair that proves the two
doors are genuinely separate. Adding a fourth pull to `onsetInjury` kills both RNG tests. Restored.

**Two benches carry a ⚠ note rather than a change**, because both report a severity mix over careers
that contain both doors and would otherwise mislead the next reader: `tools/injury-audit.ts`'s `band`
column (the weekly roll's design, printed beside onsets that may not have been drawn against it) and
its designed-mix comparison, which now prints **both** designs side by side. No assertion in either
moved; they are benches, not gates.

### 9.10.1 ⚠ ONE GUARD RE-AIMED, AND IT TURNED OUT TO HAVE BEEN VACUOUS

`tests/econ-bench.test.ts` – *"parent income is the deterministic weekly contribution plus
injury-withdrawal refunds"* – went red on this branch. **It is a real assertion failure, not
contention** (the base commit was re-run alone and is green), and the diagnosis is worth recording
because the test had never actually been exercised.

It asserted that the `sponsor` bucket is a whole multiple of one of the two annual grant sizes, *"on
the reasoning that the sponsor bucket holds ONLY whole annual grants for a middle career (no cameo,
which is working-only)"*. **Both halves of that sentence had already been retired by owner rulings,
and the line survived only because the cell measured ZERO** – `0 % anything === 0` passes, and so does
a cap on zero.

* **The grant is not cash any more** (31.07, «кит вместо денег»): it is paid in kit, and economy.ts
  says *"the money never reaches the balance"*. `category: 'sponsor'` has exactly **one** emitter left
  in the engine, and it is the random cameo. A whole annual grant can no longer reach that bucket.
* **The cameo is not background-gated any more** (10.08, «порог по деньгам на счету, а не по строчке
  в анкете»): `ECONOMY.sponsor.eligible` is gone and `sponsorNeedMet` – a runway test on the balance –
  replaced it.

**What made it fire is this change working as designed:** shorter retirement layoffs put her back on
court, she enters and travels more, her runway drops under `ECONOMY.sponsor.runwayWeeks` in seasons 2
and 3, and the shop chips in. Measured, middle/seed 0, 208 weeks: **0 → 7 cameos totalling $8,433.36**,
every one inside the $500-$1,500 band, none a multiple of $1,000.

**Re-aimed STRICTER, not weakened.** A modulus on a SUM can be satisfied by any number of wrong rows
that happen to add up; the replacement checks **every row** against the only instrument that can
legally produce one, and reconciles the bench's captured total against the independent replay's rows.
A grant leaking back into cash, or any third instrument arriving in that bucket, now fails it. The
case's actual protected fact – `cats.income` equals the replayed parent contribution plus refunds
exactly, i.e. no sponsor money leaks into the income bucket – is **untouched** and green. The two
scans of the week's ledger were merged into one pass in the same edit: the file already sits inside
birpc's 60s RPC window and a second full scan per captured week took it to 71s.

**`tools/injury-cause-probe.ts` gained three reports and lost none** – layoff length by door, the
"does it still read as a real event" table, and weeks-lost per season with the two thresholds the
owner's sentence names. All measurement-only; it still imports the engine read-only and changes no
constant.
