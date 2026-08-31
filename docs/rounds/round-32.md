---
type: round
status: current
area: rounds
canonical: false
last-reviewed: 2026-08-31
---

# Round 32 – from his play on the merged round-31 build (31.08.2026)

Reported after he merged PR #117 and played it. Both items diagnosed before filing; neither was
guessed at.

- [x] **1. «в игре заметил, что у нас в межсезонье на shooting week самих shooting в календаре и
  нет»** – a booked shoot lands in an off-season week and the calendar draws that week empty.
  **build**.

  ⭐ THE ENGINE IS RIGHT AND THE CALENDAR IS BLIND – this is a surfacing gap, not a missing feature.
  `WINTER_SHOOT_WEEKS = OFF_SEASON_WEEKS + 3` (`engine/offers.ts:1743`), so the shoot season is the
  last `OFF_SEASON_WEEKS + 3` weeks of the year and **contains the whole off-season by
  construction**. That is deliberate and true to life: an athlete shoots her sponsors' campaigns in
  the winter, which is exactly when she is not playing.

  ⚠ THE DEFECT IS IN `src/composables/weekDays.ts`, AND IT IS AN ORDER-OF-BRANCHES BUG. The week
  builder has five branches; branch **4, "THE CALENDAR'S OWN BLACKOUTS"** (line 717), returns for an
  off-season week with `days: uniform('off', null, 'Off')` and the `shoot: null` it inherited from
  `base`. The shoot is only ever filled in on branch **5, the ordinary training week** (line 750),
  where `shootDays` is computed at line 770 – and an off-season week has already returned by then.
  `base`'s own comment says it out loud: «Null here and filled in on the ordinary-week branch alone».

  ⚠ `weekGrid.ts` is NOT the defect and needs no new shape: `WEEK_SHAPES.shoot` and `SHOOT_DAY`
  (line 960) already exist and already draw a call time and a shoot block. Nothing reaches them
  because no off-season day is ever handed the `shoot` kind.

  ⚠ NOT CONFIRMED ON A SAVE. His w933 export carries **0 booked shoot deals**, so the report could
  not be reproduced from it; the evidence above is the code path, and he read the defect off a live
  career the save predates. A fix must therefore build its own fixture rather than lean on his.

- [x] **2. «на result of the week внизу под самими результатами висит кусок THIS WEEK где предстоящий
  турнир описан, как на экране самого турнира – надо турнир с result of the week всё-таки убрать»** –
  the week's results and the upcoming tournament are on screen together. **build**.

  ⚠⚠ FOURTH PASS OVER THIS PAIR OF BLOCKS, and the previous three were all mine: round 29 part two
  grew the recap, round 30 #1 cut it back, round 31 #1 moved the ORDER on one arrival. What none of
  them did is ask whether both belong on screen at once, which is what he is now saying they do not.

  `ThisWeekScreen.vue` renders `<NextTournamentPanel v-if="nearestEntered">` at line 253
  **unconditionally on both arrivals**, while `WeekRecapCard` renders above it (line 228) on a story
  arrival and below it (line 261) on a tournament arrival. So a week advanced normally shows the
  results and then the whole tournament plate underneath.

  ⭐ THE SHAPE HE IS ASKING FOR, and it keeps round 31 #1 intact: the tournament panel appears when
  the screen is NOT showing the week's story – `nearestEntered && (!showRecap || tournamentFirst)`.
  Results view shows results; the × that already dismisses the story then reveals what is next; and
  an arrival through Home's Next-tournament plate still opens on the tournament with the story
  below it, exactly as he asked in round 31.

## Where they landed

Both boxes are ticked with the place, per `docs/rounds/README.md` §"Keeping this true". Branch
`round/32`, gated once at the end: `npm run check` exit 0, `npm run test:e2e` exit 0 (31 tests),
`npm run test:sim` exit 0 (12 files), each read out of its own log file rather than a pipe.

- **1** – `cbbbd868`, `src/composables/weekDays.ts`. The off-season branch of `calendarWeekFor` now
  marks the shoot's days (`shootDaysFor(planDays, null)`, the ordinary week's own rule) and names the
  deal, and `weekGrid.ts` draws them through the `SHOOT_DAY` shape that already existed. Nothing else
  about the week moved: the eyebrow still says Off-season, the read-out is unchanged, `nextTripRounds`
  is still refused. Guard: `tests/component/round32-off-season-shoot.test.ts`, 13 arms driven from a
  signed `ad` offer's `terms.shootWeeks` through `toSnapshot` into the grid, on week 933 – the
  off-season week his save sits on – plus all three off-season slots and the three winter weeks that
  already drew.

  ⚠ NOT DONE, AND NAMED: the **exam fortnight** has the identical latent gap and was left with it.
  Measured over 8,000 booked weeks from 4,000 one-year deals, 45.4% land in an off-season week and
  0.4% in an exam week; the gap also closes itself once she leaves school; and that branch's read-out
  counts her sessions out loud, so drawing a shoot beside it is a WORDING question and the wording is
  his (invariant 4). The reasons are recorded above the branch in `weekDays.ts` and pinned in §3 of
  the guard, so a later reader sees a decision rather than an oversight.

- **2** – `cc04cfb7`, `src/components/screens/ThisWeekScreen.vue`, one expression:
  `v-if="nearestEntered && (!showRecap || tournamentFirst)"`. Guard:
  `tests/component/round32-week-results.test.ts`, three states from both sides, mutation-verified so
  that «forgetting round 31 #1» and «rebuilding the defect» fail apart.

  ⚠ ONE THING DELIBERATELY NOT CHANGED, for the owner to rule on: the hosting `<section>` still takes
  its `bare` class from `nearestEntered` rather than from the panel's new condition, so on the results
  view that section is now un-framed while showing only its heading and the entry pill. Its own
  comment says «ONLY WHEN THE PANEL IS THERE», so the two have parted company – but re-binding it is a
  SPACING change, and this round was told to change the visibility condition and nothing else after
  three previous passes each moved more than was asked.


- [ ] **3. «личный бренд в цене подрос с 250к до 1.8м, а доход у него 1800 в неделю =))) что
  как-будто бы не очень соответствует стоимости. Надо как-то настроить этот момент»** – the merch
  brand's valuation and its income do not describe the same business. **measure, spec, bench**.

  ⭐ MEASURED ON HIS w933 SAVE BEFORE ANY PROPOSAL, and it reproduces his screen almost exactly:

      fame              22.3 / 100
      weekly gross      $1,720      = perFamePointCents($30) x fame^2 / famePivot(10)
      annual gross      $89,428
      multiple          18.23x      (cap maxX = 20)
      worth             $1,630,191  = weekly x 52 x multiple

  The arithmetic is internally consistent – his $1.8M at $1,800/wk is ~19x, all but at the ceiling.
  Nothing here is a typo or a unit slip.

  ⚠⚠ THE DEFECT IS WHAT THE MULTIPLE ASKS ABOUT. Every term of `brandMultipleX`
  (`engine/world/brand.ts:263`) reads her TENNIS CAREER and none reads the brand:

      base                            14.00
      14 pro seasons        +0.2 ea   +2.40
      1 top-20 season       +0.3 ea   +0.30
      19 finals lost        +0.1 ea   +1.20
      win rate 68.2%                  +0.33

  So a fourteen-season veteran earns an all-but-maximum multiple on a business turning over $89k a
  year. Real multiples rise with the SIZE, durability and growth of the business, not with the
  founder's résumé: a firm earning $89k a year changes hands at two to five times earnings, not
  eighteen. ⚠ And `baseX` is already 14 before a single achievement, so even an unknown's brand
  trades at 14x.

  ⭐⭐ HIS RULING SHARPENS THE FIX, and it is a better statement than my first one: «её известность
  22.3 – да, это ок, главное, чтобы **эта известность участвовала в механизме**, тогда мы увидим
  разницу на других карьерах». Fame 22.3 is not the defect and is not to be retuned. The defect is
  that fame sits in the INCOME alone (`fame^2`) and nowhere in the MULTIPLE, so two careers with the
  same tennis record and different fame value their brands identically.

  SO: fame enters `brandMultipleX`, and the career terms become a premium ON TOP rather than the
  whole of it.

  ⭐ AND THE CEILING PROTECTS ITSELF, which is why this satisfies both his rulings at once: with
  `maxX = 20` unchanged, a fame-scaled multiple SATURATES at the top – at fame 100 the brand already
  takes $1.56M a year and the multiple is at its cap either way, so the top of the shelf does not
  move by a cent. Only the bottom does: at his 22.3 the multiple should read single digits instead
  of 18.23, and the brand should be worth hundreds of thousands rather than $1.63M.

  ⚠ WATCH THE COMPOUNDING AND MEASURE IT: income already goes as `fame^2`, so a multiple that also
  rises with fame makes worth go as `fame^3` UNTIL the cap bites. Where the cap starts binding is
  the number the spec must report – if it binds only at fame 90+, the middle of the range grows
  faster than anyone intended and the curve needs its shape chosen, not inherited.

  ⚠⚠ THE CEILING IS NOT TO BE CUT. He rejected that framing once already, and correctly – «а что с
  этой цифрой не так? вроде бы как раз спонсорские коллаборации со спортсменами дают и не такое,
  кратно большее». This change may only move the BOTTOM of the scale.

  ⭐ AND A SEPARATE FINDING, NOT PART OF THIS FIX: her fame is 22.3 because fame is fed by TITLES
  (`fameFloorOf` sums title weeks, decayed on a 104-week half-life) and she has none. That is the
  same wall as round 31 §5 (20 of 24 entries at World Tour 500 and above) and the elite-shape
  research. Filed there, not here.

  ⚠ Invariant 5 – balance: a spec in `docs/specs/` with predicted vs measured, and a bench.
