---
type: spec
status: draft
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-28
---

# The calendar she can reach – a distribution algorithm (28.08.2026)

**His ask, verbatim:** «давай посчитаем сколько у нее турниров доступно, наверняка можно как-то так
расставить, чтобы всё гармонично заменялось и было куда ехать играть» · «Давай подумаем как-то
алгоритм распределения пожалуйста». His own earlier proposal, which the measurement confirms:
«более низкие ступени вполне можно заменять более высокими, чтобы плотность календаря и выбор
оставались».

⚠ Round 28 #12 and #16. Read off his save `alice-cfbv_w675` (personal, read-only, never a fixture).

---

## 1. What is actually wrong – three faults, and none is the one the item names

### 1a. ⚠⚠ CORRECTION (28.08, same day) – I OVERSTATED THIS, AND THE SPEC SAYS SO

**`act2-pro-tour.md` §11.4 already sets the OFFERED target and already did the research**: *«a real
top-100 plays 20–25 events over ~44 playing weeks… roughly 500 women's ITF events and 60 WTA ones a
year»*, and its graded table reads **OFFERED = 5.2–6.0 weeks of 8, «~34 weeks carry an event»**.

⚠⚠ **I measured 34 of 48 on her save. The calendar hits its own target exactly.** So «the supply is
upside down» is NOT the defect he is reporting, and the research pass this spec asked for was already
done. ⭐ What survives the correction is below, and it is narrower and better aimed.

⭐ **What DOES survive**: at the top of the ladder a THREE-rung band (the width §11.1 measures) holds
`w75 w100 wta125` **16**, `w100 wta125 wta250` **16**, `wta125 wta250 wta500` **22** – **33–46% of
weeks**, against the spec's own 65–75%. The junior end holds 45–53. **So the inversion is real for
NARROW bands and not for Alice**, whose eligible set spans seven rungs and therefore lands on target.

### 1a-bis. The original claim, kept for the record

The game's own eligibility rule (`tierOutgrown`) closes a rung when the rung **three above** it
opens, so **a player's live band is four adjacent rungs**. Counting our shipped `seasonEventCount`
per four-rung window against 48 playable weeks:

| window | events | |
| --- | --- | --- |
| `j30 j60 j300 w15` | **70** | |
| `w15 w35 w50 w75` | 61 | |
| `w35 w50 w75 w100` | 40 | ⚠ |
| `w50 w75 w100 wta125` | 28 | ⚠ |
| **`w75 w100 wta125 wta250`** | **24** | ⚠⚠ **the floor – and it is where she lives** |
| `w100 wta125 wta250 wta500` | 26 | ⚠ |
| `wta250 wta500 wta1000 slam` | 30 | ⚠ |

⚠ **Read this against 1a**: the four-rung count is right arithmetic aimed at the wrong target. The
spec grades OFFERED on a three-rung band and on weeks-carrying-an-event, not on a raw event count.

### 1b. ⚠⚠ NOBODY DISTRIBUTES THE UNION – and it is one line

[`calendar.ts:2145`](../../src/engine/season/calendar.ts) – `const claimed = new Set<number>()` sits
**inside the per-tier loop**. Each tier therefore spreads its own events beautifully over the span
and is blind to every other tier. Sixteen independent even spreads over the same 48 weeks collide by
ordinary birthday arithmetic.

Measured on her season 13, over her own playable set (50 events): **34 of 48 weeks used, 14 weeks
empty, 16 events landing on a week that already had one.** ⭐ **The supply is 50 events for 48
weeks – the material to fill the season is already there and nothing spreads it.**

### 1c. ⚠ DEAD CONTENT IN THE FEED, AND IT MUST BE FIXED FIRST

Read out of her feed at 26 years old, ranked WTA #110:

1. **`Local Open` never closes** – open, `outgrown=n`, **4 of her 12 open slots in 8 weeks**. Its
   band `[0, 85]` counts DOMESTIC points, which a world-tour player stops earning; the gate that
   should graduate her cannot fire.
2. **The domestic ladder locks her out from below**: «Not enough national pts for Regional
   Championship yet (need 65)», «…National Series yet (need 150)» – said to the world #110.
   Same root, opposite sign.
3. **Junior rows still render at 26**: «Junior Tour 60 takes the top 100 – she has no international
   ranking yet».

⚠⚠ **Fix this before any distribution work**, or the distributor spreads rubbish evenly.

---

## 2. The algorithm

### Part 0 – close the dead rungs (prerequisite, no distribution yet)

A rung opens and closes on **whichever ladder the player actually stands on**. `w15`/`w35` already do
this correctly – «closed to the world's top 150» – and the domestic rungs do not. Give `local`,
`regional` and `national` the same world-ranking clause they already apply to points, and drop
aged-out junior rows from the feed instead of rendering a refusal.

⭐ Cheap, self-contained, and it alone gives back four slots in eight weeks.

---

## ✅ Part 0 as built (28.08) – and the correction that changes what it was FOR

⚠⚠ **THE FEED WAS ALREADY CLEAN, AND THAT IS THE FINDING.** Reproduced on a built world at 26 with a
professional book, folded through the same `feedContext` the Season screen calls: the engine's
`upcoming` carried **34 rows over 15 tier types** – four Local Opens, two Regionals, two Nationals,
eight junior rows – and the screen rendered **9 rows over 7**, all professional. The domestic three
were removed by `paysIntoHerTables` (round-21 #5) and the junior rows by the UI's own age filter
(round-17 #19). **Both rules lived in `composables/tierState.ts`.**

So §1c's «four of her twelve open slots» is an ENGINE reading, and act2-pro-tour.md §4's own words
are what make it a defect anyway: the closure must be *«the engine's latch, not the UI's guess»*.
Part 0 is therefore **not** «hide the rows» – it is **move the closure into the ladder**, and every
assertion that matters is made with the UI's filters withheld.

**What shipped, all of it reusing a mechanism that already existed:**

| | change | file |
| --- | --- | --- |
| 1+2 | `PLAY_DOWN` gains a third limb, `domesticFromProTable`, and `playDownBars` a domestic arm: the club ladder is shut once `activeLadderOf` says she is on the professional table | `engine/world/ladder.ts` |
| 1 | `tierFloorOpen`'s domestic arm asks it **above** the points floor | `engine/world/ladder.ts` |
| 2 | `entryVerdict`'s domestic arm asks it first, so the refusal is `playDownRefusalDetail`'s voice and not «Not enough national pts» | `engine/world/medical.ts` |
| 3 | `tierOpenFor` shuts a rung she has **aged out** of (`tierAgeBlock === 'old'`) – `tierFloorOpen` for j30 is the on-ramp LATCH, so the oracle said OPEN at 26 | `engine/world/ladder.ts` |
| 3 | `entryVerdict` asks the aged-out door before its ladder arms, so j60/j300 stop saying «takes the top 100 – she has no international ranking yet» to a 26-year-old | `engine/world/medical.ts` |
| 2 | ⚠⚠ `tierState` gains an arm for **a lock that is not a gap** – see below | `composables/tierState.ts` |

⚠⚠ **AND FAULT 2 NEARLY SURVIVED THE ENGINE FIX BY BEING RE-DERIVED.** `tierState`'s `locked` arm
prices every lock as a DISTANCE («N more national pts», «opens in the top N»), because until the Play
Down family existed every lock was one. With the engine closing these rungs correctly and that arm
untouched, the Home strip and the Season ladder read **«Regional Championship – locked: 65 more
national pts»** – *the exact sentence the item reports* – and, on Local, the arithmetic's own
reductio: **«locked: 0 more national pts (she has 0 of 0)»**. Caught by reading the surface rather
than the engine, and it is the reason the evidence now asserts the plaque as well as the verdict.

⭐ **The same arm closes an identical defect one table up that PREDATES this wave.** The Play Down
rule has shut W15/W35 to a top-150 player since 15.08, and the plaque has been telling her to earn
**120 junior points she can never earn again**. One arm, both defects, because it is one defect: a
refusal carrying neither `pointsToEnter` nor `rankToEnter` is «a lock with no distance», and the
engine's own sentence is then the only honest copy. `kind` is `'outgrown'`, not `'locked'` – a
padlock promises something to unlock and there is nothing.

⭐ **A TABLE, NOT A RANK CUT, and it is the one place the brief's wording could not be followed.**
«The same world-ranking clause `w15`/`w35` have» is a *rank* cut, and no rank expresses this rule: a
professional at #400 is past the club draws exactly as surely as one at #40, and a cut would have
put the ladder back into disagreement with the feed rule round-21 #5 already shipped. `activeLadderOf`
is the engine's own one answer to which table is hers, so the limb is that rule moved off the screen
and into the ladder. It rides in `PLAY_DOWN` so `hasOutgrown` folds it into the ONE «she is past this
rung» answer for free, which is what §4's «Outgrown is GONE» is denominated in.

⚠ **It does NOT reverse itself, unlike the two rank limbs beside it.** `activeLadderOf`'s
professional arm is permanent (`wtaEverCounted` reads the unpruned high-water mark). That is not the
boredom failure: a professional whose W book has aged out keeps her W15/W35 on-ramp latch, so what
she loses is the table BELOW her, never her last tennis. Asserted, not asserted-by-comment.

**Measured after, same world**: every domestic and junior rung `shut` at the engine, `outgrown=y` on
the domestic three, and the rendered feed **unchanged at 9 rows** – which is the honest report. The
visible change on the Season screen is zero; the change is that the closure now comes from the
engine, so the surfaces that do NOT run `feedContext` (the tier ladder rows, the «Also open to her»
note, the Home strip) inherit it. Before: `local:unscheduled regional:locked national:locked` with
«Reach 65 pts». After: `local:locked regional:locked national:locked`, and the junior three read
`age-locked` rather than an acceptance list.

**Evidence** – `tests/dead-rungs.test.ts`, plus four guards RE-AIMED (never weakened):
`tier-window.test.ts`'s round-21 #5 witness (it used to prove the club draws came back when the UI
filter was withheld – it now proves they stay gone), its «visibility, never access» case,
`ladder-floor.test.ts`'s `hasOutgrown` equivalence (**which was already incomplete: it named two of
the three ceilings and only stayed green because no fixture sat inside a play-down cut**) and its
coach-card case, re-aimed one table down because the professional fixture can no longer hold its own
preconditions. **Seven mutations, each red**: the limb off, the limb unconditional, the limb widened
to `!== 'domestic'`, the age gate dropped from `tierOpenFor`, the domestic turnstile clause dropped,
the aged-out precedence dropped, and the plaque arm dropped.

⚠ **Frozen MAIN capture 41550 / `e6b0c709` VERIFIED unmoved** (`tests/condition.test.ts`, 51 passed),
and the three frozen careers with it (`coach-travel-edge`, `world-trio`, `long-career-ledgers`, 94
passed). Part 0 moves no draw – it changes what she sees, never what she plays.

### ⚠⚠ §4's «at most two tier types» – the ruling, and it is NOT enforced

**§4's own document supersedes it, in the owner's words**, and this was checked before a line was
written. Ruling 11 (§1.11, 03.08): the sliding window *«REPLACES the two-type visibility rule of
ruling 4 rather than sitting beside it»* – «всё так, да». `composables/tierState.ts` already carries
the retirement note. Her legitimate set here spans `w50 w75 w100 wta125 wta250 wta500 slam`, so
enforcing the cap would hide tournaments she may enter – which is the one thing the brief forbade.

⭐ And the owner's amendment of 28.08 settles it from the other side: «может быть всё-таки какие-то
близкие outgrown и стоит оставить… Ближайшую переросшую W-ступень из ленты не убирать. - давай 2
ближайших.» **Part 0 removes no W rung at any rank**, so his floor of two is met by construction. At
his own #110 the ladder gives **three** (`w100 w75 w50`), and the first rung that is gone is `w35`,
four down, shut by the Play Down rule he ruled on 15.08.

⚠⚠ **ONE PLACE HIS «2 ближайших» IS NOT MET TODAY, REPORTED AND NOT FIXED.** Inside the world's top
50, `PLAY_DOWN.fromAllW` bars the **whole** W series at once, so a #40 player has `wta125` below her
working window and then nothing – one rung, not two, and no W-series rung at all. That number is his
(15.08) and the remedy is a ruling, not a repair. Pinned in `tests/dead-rungs.test.ts` so the day it
changes the test says so out loud.

### Part 1 – ⚠ DEMOTED. Not the cause, and possibly not needed at all

⚠⚠ **Struck on the correction in 1a.** The calendar meets §11.4's OFFERED target for her, so raising
counts would push it PAST a target the owner already set, and «an availability of 20-30 would leave
her playing the whole menu» is that spec's own warning.

⭐ **The research this part asked for is already written**: ~60 WTA events a year in the real sport
against our **34** (slam 4 · wta1000 8 · wta500 10 · wta250 8 · wta125 4). That gap is real and it is
a legitimate future question – but it is **not** what he reported, and Part 2 must be measured alone
first. ⚠ Revisit only if Part 2 leaves narrow-band players (§1a) short of 65–75% of weeks.

### Part 2 – distribute the union, within the band

Hoist `claimed` out of the per-tier loop into a map shared by **tiers within ±3 rungs** – the same
distance `tierOutgrown` already uses, so the calendar's grouping and the eligibility window would
finally be the same number.

⭐ **Why not one global map**: 187 events over 48 weeks makes collisions mandatory. Only collisions
*inside a player's band* cost her anything – a J30 sharing a week with a Grand Slam costs nobody.

---

## 3. Invariants – what each part is allowed to move

| | Part 0 | Part 1 | Part 2 |
| --- | --- | --- | --- |
| `makeEvent` draw order/count | unmoved | ⚠ **moves** | unmoved |
| surfaces / travel costs | unmoved | ⚠ move | unmoved |
| week each event lands on | unmoved | move | ⚠ **moves** |
| frozen career hashes | unmoved | ⚠⚠ re-pin | ⚠⚠ re-pin |
| ⚠⚠ frozen MAIN capture 41550 / `e6b0c709` | **UNMOVED** | **UNMOVED** | **UNMOVED** |

⭐ **Input-independence survives all three.** Placement runs on the purpose-scoped `:calweek:<tier>`
sub-streams, never on MAIN, and none of these parts reads her results – the calendar stays the same
whatever she does. ⚠⚠ **The MAIN capture is cohort drift (`52 × (4 × 199 + 3) + 2`) and the calendar
is not in it – that must be VERIFIED per part, never assumed.**

⚠ Parts 1 and 2 each move which tournaments a frozen career plays, so each needs the per-key diff
protocol and a re-pin, with the control being that part reverted in a detached worktree.

---

## 4. Order, and why

**0 → 2, and 1 only if 2 leaves a hole.** Part 0 is a prerequisite. **Part 2 before Part 1**: distribution is free (no counts
move) and its effect is measurable on its own – her 50 events over 48 weeks should close most of the
14 holes without a single new tournament. **Only then** does Part 1's research pass have an honest
question to answer: how much supply is still missing once the existing supply is spread properly.

⚠ Doing 1 first would add events into a distributor that clumps them, and we would measure the sum
of two changes and learn nothing about either.
