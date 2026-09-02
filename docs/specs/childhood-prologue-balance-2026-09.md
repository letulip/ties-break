---
type: spec
status: draft
area: simulation-and-balance
canonical: false
last-reviewed: 2026-09-02
---

# The prologue's balance pass – the ladder, the width, the money and the weekly line (phase 9)

Phase 9 of `childhood-prologue-build-2026-09.md`, and the four changes the owner ruled on 02.09
after playing phase 7. Invariant 5: a balance change ships with a bench run and a spec recording
**predicted vs measured**. The bench is `npm run bench:balance`
(`tools/prologue-balance-bench.ts`) and every number below is its output.

**Status: DRAFT.** The four decisions are his; the arithmetic under them is this document's, and the
one new sentence on screen is a draft he has not read.

---

## 0. ⭐⭐ The measurement that reframes the whole pass, and the owner has accepted it

⚠ **PROVENANCE: this table was measured earlier in the wave, not by `bench:balance`.** It is quoted
here because it is the reason the four changes are shaped the way they are, and because the owner has
accepted the framing – not because this document re-derived it. Everything from §1 down IS this
bench's own output.

Two careers from one seed, same potential, same plan, differing **only** in childhood:

    age 14   neglected 48.16   devoted 49.92   gap 1.76   (100%)
    age 16                                     gap 1.14   ( 65%)
    age 18                                     gap 0.80   ( 46%)
    age 23                                     gap 0.52   ( 29%)

**The game's own growth closes 71% of any arrival gap by her peak**, and it is structural rather
than a tuning accident: growth is a share of REMAINING headroom, so the weaker girl grows faster.

⭐ **The prologue therefore cannot decide who she becomes – it decides what she arrives with.** That
single fact orders everything below. The levers that survive to her peak are the ones the curve does
not converge:

| lever | converges? | why |
| --- | --- | --- |
| **money** | no | a reserve difference is a reserve difference; nothing regresses it |
| **the coach rung** | no | `developmentFactor` multiplies growth EVERY week, self 0.82 -> elite 1.15 |
| **time on the ranking ladder** | no | weeks are weeks |
| skill points | **yes, 71% of them** | headroom-proportional growth |

So this pass spends its effort on the first two and deliberately declines to spend much on the
third: §2's widening is aimed at ~60% of the model rather than 80%, because buying more of a gap
that half-lives away by eighteen costs balance risk for an effect that disappears.

---

## 1. The coach ladder – where you start bounds where you can reach

### The defect

He found it in play: «карьера за 25к начала у меня с 15к на руках и тренером high тира» – a MIDDLE
family, on the dearest branch the card table has, opening with the reserve spent AND a high-tier
coach on the payroll.

The shipped rule was an even fifth of weighted `teaching` onto the five-rung `CoachTier`. It read
only the childhood, never the family, so nine years of club-and-one-to-one graded the same whether
the money came out of a working family's rent or a wealthy one's petty cash.

### His ruling, 02.09, transcribed

    working    the cheap branch -> self-coached     the dear branch -> a budget coach
    middle     cheap -> budget                      dear -> middle
    wealthy    cheap -> middle                      dear -> high

⭐ Two rungs per origin, overlapping by exactly one with the origin above, so **a working family
that did everything right arrives where a middle family that did nothing special starts.** That
sentence is the whole point of the prologue, and the ladder is the only place in the code that says
it.

⚠ There is no «I coach her myself» option for middle or wealthy. He ruled against it; the reasons
are parked in `docs/backlog/the-team-around-her.md` row 9.

### The branch, and why the cut is not a number anybody chose

`medianChildhood()` is the anchor `childhoodWalk` already normalises the level against – the
childhood that lands EXACTLY on `startingSkills` – and its `teaching` is flat 0.5. So the ordinary
childhood's own weighted teaching is the one place in this codebase where «an ordinary amount of
coaching» is already defined, and the branch is decided against it: better-taught than ordinary takes
the dear rung, not better-taught takes the cheap one.

⚠ **Money was the other candidate and it is nearly the same reading.** Measured: the two selectors
agree on **26 of the 32** runs, because in this table the dearer answer is also the better-taught one
on every card but the tenth. Teaching wins on two grounds – a RUNG is a statement about who teaches
her, and it leaves the modal prologue on the rung the wizard's own default sits on.

### PREDICTED vs MEASURED

**PREDICTED:** exactly six outcomes, both rungs of every pair reachable, `elite` unreachable, and no
middle family able to reach `high` however much it spends.

**MEASURED**, all 32 runs x 3 origins:

    BEFORE (the even fifth, the shipped table)   the same for every origin:
      budget 2/32   middle 23/32   high 7/32
      and the dearest branch on a MIDDLE family -> high          <- his complaint, reproduced

    AFTER (the ladder)
      working    ruled [self, budget]     self 15/32   budget 17/32
      middle     ruled [budget, middle]   budget 15/32   middle 17/32
      wealthy    ruled [middle, high]     middle 15/32   high 17/32

      rungs reachable at all: self, budget, middle, high      elite: never
      the branch cut (the ordinary childhood's teaching): 0.5000
      the 32 runs span teaching [0.2469, 0.8050]

⚠ **A finding worth his eye.** The widening in §2 pushes the top of the teaching range from 0.7522 to
0.8050 – and the OLD rule on the NEW table would have graded 2 of the 32 runs `elite`. The two
changes had to land together: widening the cards without replacing the rung rule would have made his
complaint worse, not better.

---

## 2. What the decisions buy – widened, moderately

**PREDICTED.** The card table spans **42.3%** of what the model can move her by. Target ~60%, not
80% – §0's reason. Widen the three pairs he named: municipal court / club, group / one-to-one,
ordinary school / sports school.

**MEASURED.** Two bases, because both are honest and they answer different questions:

| basis | before | after | the model |
| --- | --- | --- | --- |
| `childhoodWalk().level` – the model's own quantity, pre-clamp | 1.982 (**42.3%**) | 2.543 (**54.3%**) | 4.686 |
| mean attribute at fourteen, 4,000 seeds, post-clamp | 1.873 (**43.7%**) | 2.387 (**55.7%**) | 4.287 |

The two bases differ because `childhoodArrival` clamps into `STARTING_SKILL_BAND`, which is also the
answer to «why not push further»:

⚠⚠ **THE TABLE'S WIDTH HAS A STRUCTURAL CEILING NEAR 58%, and it is worth recording because the
obvious repair does not work.** Raising the dear arms past ~0.9 teaching buys almost nothing – the
best run's mean attribute is pinned at ~49.65 by the band clamp whatever is done to the top of the
table. Candidates were measured at 55.1%, 55.7%, 57.4%, 57.8% and 61.3%; everything above ~58%
required cheap arms that contradict the cards' own copy. So the remaining width is at the BOTTOM, and
the bottom is where the copy binds.

### What moved, and what the copy would not let move

| card | cheap arm | dear arm |
| --- | --- | --- |
| 8 municipal / club | teaching 0.35 -> **0.30** (share held at 0.6) | 0.85/0.80 -> **0.95/0.95** |
| 9 group / one-to-one | teaching 0.45 -> **0.25** (share held at 0.6) | unchanged 0.85/1.00 |
| 10 stay-home / enter | unchanged 0.70/0.50 | share 0.75 -> **0.80**, teaching held equal |
| 11 ordinary / sports school | 0.60/0.50 -> **0.50/0.25** | 0.95/0.85 -> **1.00/1.00** |
| 12 let her stop / finish | 0.35/0.30 -> **0.20/0.10** | 0.75/0.60 -> **0.80/0.65** |
| 12 keep the size / give her the year | unchanged 0.70/0.60 | teaching 0.95 -> **1.00** |

⚠ **NOT ONE PRICE MOVED AND NOT ONE SENTENCE CHANGED** (invariant 4). Every note's claimed multiplier
– «about three times the municipal court», «about four times the group», «about twice the club», «a
quarter of what this year was going to cost», «about two and a half times what you pay now» – is
checked in `tests/prologue-cards.test.ts` against the cents beside it, and all of them still hold
because the cents are untouched.

⚠⚠ **AND ONE GAP WAS DELIBERATELY NOT WIDENED, WHICH IS A FINDING RATHER THAN AN OMISSION.** Card 9's
own lede says «An hour on her own with a coach is not a different amount of tennis. It is a different
price», and its note says «for the same hour of her week» – while the shipped table gives one-to-one
share 0.85 against the group's 0.60, i.e. 42% more tennis. **The copy and the numbers already
disagree there.** Widening that share gap was the cheapest 2 points of span available and it was
declined: deepening a contradiction the owner has not seen is not a balance decision. The width at
card 9 comes from `teaching` alone. **The tension is his to resolve** – either the note changes or
the shares equalise, and equalising them changes which face of the twelfth a player sees
(`isSoleLowestShare` stops counting age 9 as a light year), so it is not a free edit.

⚠ **The fork did not move.** `readTwelfth` reads the sole-highest `teaching` and the sole-lowest
`share` per card; every pair still orders the same way, the tenth's two answers are still equally
taught, and the `wants-more` face is still drawn on the same 10 of the 32 runs.

---

## 3. The money – narrower, and the dial written down

**PREDICTED.** His words: «По суммам минимальным как-то совсем грустно, особенно у рабочих и
средних», and the aim «прийти как можно ближе к нашему коридору изначальному, который поигран и
померян» – i.e. nearer the flat $8k / $25k / $120k the whole economy was tuned against.

⭐⭐ **There was already a dial and nobody had written it down.** The shipped model divided the clamped
spend by `startingFundsCents.middle` – nine years of FLOW over one family's BALANCE – which chose
**0.399** of every family's reserve without ever saying so. The shape is kept exactly; the divisor
becomes a named constant:

    moved  = clamp((reference - spent) / swing, ±1)          a position in the table's range
    funds  = round(base[background] x (1 + reserveSwingShare x moved))

    ECONOMY.prologue.reserveSwingShare: 0.399 (implied)  ->  0.20 (named)

⚠ **The ceiling on it is the game's own, not a taste.** `WEALTH_CORRIDOR` puts one background step at
0.25 of the middle centre (0.75 / 1.00 / 1.25), and §2.4 says the player chooses where the family is
FROM – so a childhood able to move a reserve by a quarter could carry a family across a class
boundary. A fifth sits inside that bound with room to spare, and `tests/prologue-handover.test.ts`
asserts `share < step` rather than asserting the value.

**MEASURED**, all 32 runs:

    background   flat        BEFORE               AFTER                AFTER median
    working      $8,000      $4,808 - $11,192     $6,400 - $9,600      $8,541
    middle       $25,000     $15,025 - $34,975    $20,000 - $30,000    $26,692
    wealthy      $120,000    $72,120 - $167,880   $96,000 - $144,000   $128,120

The poorest arrival moves from **60% of the flat number to 80% of it**. §2.4's ruling is untouched:
every background still moves by the same PROPORTION of its own reserve, which the test now asserts
directly (two backgrounds walking the same childhood come off it at the same multiple, never at the
same number of cents).

⚠ The money spec's §2 recorded that the median run arrives RICHER than the flat number, because the
model is anchored on the midpoint of the range and the table's distribution is not symmetric about
it. **That is unchanged and still his call** – narrowing the share scales the asymmetry down (+13.5%
-> +6.8% for a working family) without removing it.

---

## 4. ⭐⭐ The acceptance – the poorest arrival survives its first season

Not a number picked in advance: a condition. **The poorest arrival must survive its first season with
the coach it arrives with.** Walked rather than argued – a real career from week 0 under
`econ-bench`'s own entry policy, 24 seeds, three seasons so the runway is a number rather than a
yes/no.

**MEASURED:**

    CONTROL – the wizard's own working-class career, flat $8,000, no prologue:
      self     survived the season 24/24    under water: earliest wk  54, median wk  94
      budget   survived the season 23/24    earliest wk  46, median wk  63
      middle   survived the season 21/24    earliest wk  42, median wk  96
      high     survived the season  6/24    earliest wk  32, median wk  44

    BEFORE – the even fifth, the old table, the shipped reserve:
      working / dearest    $4,808   high     survived  0/24   earliest wk 19, median wk  26
      working / cheapest  $11,192   budget   survived 23/24   earliest wk 47, median wk  95
      middle  / dearest   $15,025   high     survived 20/24   earliest wk 38, median wk  72
      middle  / cheapest  $34,975   budget   survived 24/24   earliest wk 144, median wk 148

    AFTER – the ladder and the narrowed reserve:
      working / dearest    $6,400   budget   survived 21/24   earliest wk 39, median wk  90
      working / cheapest   $9,600   self     survived 24/24   earliest wk 54, median wk  83
      middle  / dearest   $20,000   middle   survived 24/24   earliest wk 55, median wk 116
      middle  / cheapest  $30,000   budget   survived 24/24   earliest wk 95, median wk 100

⭐ **The runway, in one line: the poorest arrival goes under water at week 26 before this pass and at
week 90 after it, and it survives its first season on 21 of 24 seeds instead of 0 of 24.** It now
matches the wizard's own working-class career at the `middle` rung (21/24) and beats it at `high`
(6/24).

### ⚠⚠ And what the runway is spent on – which is why the LADDER met the acceptance and the money did not

The first season's ledger for that same arrival, mean over the seeds:

    BEFORE   out:  coaching $7,883   facility $7,420   physio $2,388   travel $1,554
                   gear $775   entry $766   stringing $311
             in:   parent income $12,770   academy $413

    AFTER    out:  travel $4,520   facility $3,905   physio $2,527   coaching $2,102
                   entry $2,024   gear $775   stringing $311
             in:   parent income $12,816   academy $428   sponsor $494

**Coaching plus facility was $15,303 of a season on a $4,808 reserve against $12,770 of income – and
the facility line follows the rung too (`courtTierFactor` runs 1.0 -> 2.4).** The same pair costs
$6,007 after. The family did not merely survive: it started PLAYING – travel $1,554 -> $4,520, entry
$766 -> $2,024 – which is the difference between a career and a family watching one.

⚠ **The money dial is not the runway, and that was measured rather than assumed.** Moving
`reserveSwingShare` across its whole range (0.399 down to 0.10) moves the poorest arrival's
under-water week by about one week. The rung is the runway; the reserve is not. So the dial in §3 is
set by his corridor ask alone, and this section is honest about which change did the work.

---

## 5. The weekly line on the handover – his idea, and the thesis of the game

**PREDICTED.** Over nine years the cheapest childhood spends about $18 a week and the dearest about
$60. In the game a coach is billed BY THE WEEK. So the handover says roughly what those nine years
cost per week, and the player meets the first weekly bill already knowing the scale.

**MEASURED:**

    the childhood is 9 cards x 52 weeks = 468 weeks
      cheapest   $8,200 over the nine years  =  $18 a week
      dearest   $28,150 over the nine years  =  $60 a week

    ...and a coach, at 14, on the balanced plan, for a middle family (`coachWeeklyBandCents`):
      self    $44 - $170 a week
      budget  $105 - $204 a week
      middle  $175 - $340 a week
      high    $280 - $544 a week
      elite   $420 - $816 a week

**The dearest childhood a parent can buy, per week, is a quarter of the cheapest hired coach.** That
is the sentence the screen now carries.

⭐ **NEW COPY, AND IT IS A DRAFT.** `weeklySpentLine` in `src/prologue/handover.ts`, beside
`spentLine` and in the same table, marked DRAFT like every other sentence on that screen:

> That is about $18 a week, every week of it.

⚠ **The figure is derived from the run and never typed.** `cents` is the player's own total; the
divisor is `CARD_AGES.length x WEEKS_IN_SEASON`, so a card whose price moves – or a tenth card –
moves the sentence with no edit. The component test walks three totals and reads the two figures back
off the rendered screen, and the mutation (a typed constant) reddens it.

⚠ The handover now carries TWO figures where §2.4 said one. It is the same total said twice rather
than a second number, and the once-ness test was widened to two with the derivation test standing
beside it as the reason. The round-20 #3 fit assertion was re-run on the longer card: both controls
are still inside a 375x667 viewport.

---

## 6. What did NOT move

- **`potential`.** §4's one prohibition, and it is structural rather than promised:
  `rollPotential(seed, startingSkills(seed, profile))` is a function of the seed alone and
  `startingSkills` ignores its profile argument, so nothing this pass touches can reach the ceiling
  roll even in principle. Proved byte-for-byte against a wizard career on the same seed, and
  mutation-verified, in `tests/prologue-handover.test.ts`.
- **The frozen capture (41,550 draws / `e6b0c709`) and every career hash.** No draw is added
  anywhere and no wizard-path code changed: `childhoodWalk` takes no seed, the ladder is a weighted
  mean and a comparison, and the reserve is integer arithmetic. `prologueCoachTier` and
  `prologueFundsCents` are unreachable without a `prologue` argument, which the wizard path never
  passes. Verified rather than argued – the full gate is green, including `tests/condition.test.ts`,
  which holds the capture.
- **`SAVE_SCHEMA_VERSION`.** Stays at 69. Everything this pass moves lands on fields every save has
  carried for dozens of versions; nothing about a career records that it came through a prologue.
- **Any price on any card, and any sentence on any card.** See §2.
- **`CHILDHOOD.swingPoints` / `shapeSwingPoints`.** The model's own dials are untouched – this pass
  widened how much of the model the CARDS reach, not what the model is worth. Both remain the two
  dials `childhood-growth-2026-09.md` §8 offers him.

---

## 7. One correction this pass forced, recorded because it looks like a weakening

`tests/prologue-handover.test.ts`'s «a prologue career and a wizard career are the same SHAPE of
world» compared a prologue career against a wizard career on the DEFAULT `middle` rung. Since the
ladder, a working family's cheap branch arrives **self-coached** – and `openingCoachId` returns
`null` for a `self` rung, on both paths – so the shape comparison was reading a career with a coach
against one without and calling the difference a shape change.

The wizard control now carries the rung the prologue derived, and a second test proves the exemption
is narrow: a wizard career at `self` and one at `middle` differ in **exactly one line** of the shape,
and that line is `.coachId`. The claim under test is that the PATH does not change the shape; the
rung changes it, and it changes it identically whichever door the career came through.

---

## 8. The dials this pass leaves him

- **`ECONOMY.prologue.reserveSwingShare` (0.20)** – how far nine years may move a family's reserve.
  Bounded above by 0.25 (a background step of the price corridor). At 0 every family opens on the
  flat number; at 0.399 it is what shipped.
- **The card table's eight paired options** – §2's own numbers, and the ceiling on them is measured.
- **Card 9's copy-versus-share tension** (§2) – his to resolve, and not free.
- ⚠ And the one this pass explicitly did NOT touch: `CHILDHOOD.swingPoints`. Raising it widens
  BOTH the model and the cards, which moves §2's ratio not at all and §0's convergence not at all.
