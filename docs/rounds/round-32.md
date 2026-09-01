---
type: round
status: current
area: rounds
canonical: false
last-reviewed: 2026-09-01
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


- [x] **3. «личный бренд в цене подрос с 250к до 1.8м, а доход у него 1800 в неделю =))) что
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

- **3** – `79f5cd23`, `src/engine/world/brand.ts` + `ECONOMY.business.merch.value.unknownX`. The
  multiple's BASE is now a ramp from 2.5 – what a brand nobody has heard of trades at – to the rung's
  own `earningsMultipleX` at `ECONOMY.fame.cap`, with the four career rungs a premium ON TOP. His
  ruling, exactly: «главное, чтобы эта известность участвовала в механизме». His row goes 18.23x /
  $1,630,191 -> **9.30x / $831,382** on the same untouched $1,720 a week.

  ⭐⭐ THE TOP DID NOT MOVE, AND IT IS NOT THE CAP THAT HELD IT. The ramp reaches `baseX` exactly at
  fame 100, so the multiple there is the pre-wave expression term for term – measured at
  **56,160/56,160 career-weeks in the bench, worst |delta| 0.0**. `maxX` binds at fame **91.3** for a
  career maxed on all four rungs and **never** for the median one, so the cap is no longer what holds
  anything; the ramp's own endpoint is, which is why the shape was chosen rather than inherited from
  the `fame³` multiplication. Spec: `docs/specs/brand-multiple-follows-fame-2026-08.md`; bench:
  `tools/brand-dynamics.ts`, which now reads both arms off ONE walk (`pre32MultipleX` asks the
  shipped function at fame = cap). Guard: `tests/round32-brand-multiple.test.ts`, 14 arms,
  mutation-verified against seven mutations including the constant.

  ⚠⚠ AND IT COST ROUND 30 #9's DAY-ONE ANCHOR, which is arithmetic and not a tuning miss – §4 of the
  spec proves no monotone multiple can hold both. Day-one median worth **$233,173 -> $78,740**, and
  27 of 70 careers that can afford the brand would see it pinned at the mark floor the week they buy
  it (6 of 70 before). The dial that restores it without touching his row is the rung's own
  `entryCents`: the model now says a brand at fame ~10 is worth about $79k, and the price is
  $250,000. NOT DONE, because the price is also the affordability gate, so moving it moves which week
  a family buys and therefore the day-one fame – a fixed point that needs its own bench pass.
  **His to rule on.**

  ⚠ TWO SHIPPED CLAIMS OVERTURNED, both named in the code: a title now reaches the multiple (through
  fame, never through the four rungs, which stay blind to it), and the multiple can now FALL – so a
  slump compounds, measured at median −36.9% against −32.8% over 40,935 live 52-week windows. A live
  career's brand re-prices at the next tick; no schema move was needed (`valueCents` is persisted but
  rewritten every tick by `revalueAssets`, and `SAVE_SCHEMA_VERSION` stays 68).

  ⚠ NOT DONE, AND NAMED: a top-20 career with no titles now prices at the mark rather than above it
  (round 30 #24's second arm), because its fame floor is ~7. That is the fame wall this ledger already
  filed above, and this wave makes it matter more rather than creating it. Recorded in spec §7a.

  Gated on `r32b/brand-multiple` at the end, each read out of its own log file rather than a pipe or
  a background notice: `npm run check` exit 0 (1,116 component tests, unit green in 310s),
  `npm run test:e2e` exit 0 (31 tests), `npm run test:sim` exit 0 (12 files, 283s). ⚠ The FIRST check
  run came back exit 1 on one component arm – the shop row's rate line, which interpolates the
  multiple – and the background notice for that same run announced «exit code 0», which is the lie
  CLAUDE.md records, caught by reading the log.

- [x] **4. «А еще интересно, что будет происходить с годами падения в таблице (как у нее сейчас) –
  известность тоже будет падать и стоимость бренда, соответственно?»** – and, on being shown the
  answer, «Инерция бренда – звучит интересно, давай попробуем». **build** (spec first, then built).

  ⭐⭐ THE MEASUREMENT THAT FORCED IT, off his own w933 save projected five years with nothing won:
  **$831,382 -> $9,098. A 99% capital loss.** The cause is arithmetic and not tuning – fame halves
  every 104 weeks, the income goes as `fame²`, and after #3 the multiple rises with fame too, so the
  worth goes as `fame³` and falls eightfold every two years. ⚠ NOT a defect #3 introduced: before it
  the worth went as `fame²` and still fell fourfold every two years.

- [x] **5. «карьера топ-20 без титулов … Мне кажется здесь как раз на раннем этапе коллаборации нам
  должны помочь, они станут хорошим рычагом роста известности и стоимости бренда как раз»** – and «и
  это надо внедрять да». **build** (spec first, then built).

  ⚠ A CLAIM OF MINE HE WAS RIGHT TO CHALLENGE, recorded because it changed the item: I said a top-20
  player with no titles has no contracts to multiply, and he asked «как такое возможно?». `adBandFor`
  selects the band from `standing.wtaRank`, so a top-20 career is written contracts on schedule. The
  claim was inherited from an agent's report and repeated without measuring.

- **4 + 5** – ONE branch, `r32c/brand-inertia-and-collabs`, and ONE bench, on his own ruling
  «совместный эффект – мерить, да». Both items push on the same number, so two separately measured
  features summed is not the answer.

  ⭐⭐⭐ **THE COMBINED ARM, his w933 career, five years forward with nothing new won:**

  | | A control | B inertia only | C collabs only | **D COMBINED** |
  | --- | ---: | ---: | ---: | ---: |
  | now | $831,382 | $831,382 | $952,076 | **$952,076** |
  | +5 years | **$9,098** | $141,579 | $9,442 | **$166,060** |
  | the fall in WORTH | **−98.9%** | −83.0% | −99.0% | **−82.6%** |
  | the fall in INCOME | −98.6% | −98.6% | −98.7% | −98.7% |

  ⚠ The acceptance was «not 99%, and a decline of the same ORDER as the income's rather than its
  cube». Before the wave the worth fell HARDER than the income; it now falls sixteen points less far,
  and the residual is 18x what it was. ⭐ AND THE INTERACTION IS NOT ADDITIVE: #5 alone does nothing
  for the fall (−99.0%), #4 alone answers it (−83.0%), and together the residual is 17% larger than #4
  alone – because #5 raises the number the migration pins, and the floor is a share of that.

  **#4** – `world/brandStrength.ts`: `strength(w) = max over t ≤ w of fame(t) × max(floorShare,
  2^(−(w−t)/halfLifeWeeks))`, at 208 weeks and 0.4. His ruling in one kernel – a half-life measured in
  YEARS, and a floor that is a share of HER OWN peak because the maximum already contains that peak.
  The INCOME still reads fame; the WORTH reads the stock (`brandBuiltSignals`), and so does the shop
  row's «Worth N years of what it sells» so the screen and the valuation cannot disagree. ⚠ Not a
  character of user-facing copy moved.

  ⭐⭐ THE TOP OF THE SHELF DID NOT MOVE, BY CONSTRUCTION: strength ≥ fame always (the candidate at
  `t = w` is fame itself) and strength ≤ cap always (every candidate is a past fame times a kernel ≤ 1),
  so at fame 100 the two bounds meet. Measured to #3's own standard – **56,160/56,160 career-weeks
  unchanged at fame = cap, worst |delta| 0 cents**, and **72/72 careers' PEAK worth unchanged, worst
  |delta| $0**.

  **#5** – one term in `fameFloorOf`: a delivered shoot ADDS `shootFloorByBand[band]` to the floor, on
  a 52-week half-life against a title's 104, with no permanent residue (that is carried by #4's stock).
  The band is recovered from the CHEQUE the letter froze (`adBandOfTerms`), so **no field is added to
  `AdOfferTerms` and no save is back-filled**. The existing multiplier stays, on his ruling.

  ⚠⚠ THE SIZING CHANGED ON A MEASUREMENT. The first draft read «глобальный дом это не локальный
  ретейнер» as proportional to the cheque – `[0.15, 0.35, 0.6, 1.0]`, 6.7x – and that moved his own row
  **+43.7% on fame and +131% on worth**, back to $1.92M: a retune of the top wearing an early-career
  label. It is also backwards, because the high bands ask for MORE shoots and already have a floor to
  multiply. The shipped gradient is **2.75x** (`[0.04, 0.06, 0.08, 0.11]`) – reach, not money – and is
  the largest of its shape under which his shop row still reads **9 years**, which was #3's own sizing
  criterion and this wave may not undo it. His row: fame 22.33 -> 23.69 (+6.1%), worth +14.5%, beside a
  +12.6% income.

  ⭐⭐⭐ THE CASE HE NAMED CLEARS THE MARK, AND #4 IS WHAT CLEARS IT. Round 30 #24's own guard arm –
  four seasons ended #18, no title, nothing signed, fame 7.24 – priced at the **$62,500 mark** before
  this wave (gross $46,095) and prices at **$67,011, above it**, after. ⚠ #5 alone cannot touch it: she
  has signed nothing, so there is no delivered shoot to add. **That is exactly why he asked for the
  combined measurement.** Once she signs what her band already writes her (two band-2 deals), the same
  career reads $105,512 control -> **$154,741 combined**.

  ⚠ AND A STRUCTURAL FINDING, FILED NOT FIXED: a top-20 career that SIGNS its shelf was already above
  the mark before this wave – the existing multiplier reaches its x2 cap on five deals. The career that
  prices at the mark is the one that signs nothing, and the wall is `fameFloorOf`'s title currency (one
  World Tour 500 title is worth 8 against a whole top-20 season's 4). Neither item moves it; the repair
  is the season-end ladder and it is a retune of the top, so it is HIS to rule on.

  ⭐ AND #3's DAY-ONE COST IS PARTLY REPAID, unasked: median day-one worth **$93,480 -> $103,918**, and
  the careers pinned at the mark the week they buy go **25/70 -> 21/70**. The in-career slump is
  shallower too: 52-week falls median **−34.4% -> −26.0%**.

  ⚠ NOT DONE, AND NAMED: nothing was done about `entryCents` (#3 filed it and it is still his), and the
  fame ladder itself is untouched. A career with no results and no deals gains exactly nothing from
  either item, in every arm and at every week.

  ⭐⭐ THE SAVE – the four-part move, and the field is a PIN rather than a stock. `SAVE_SCHEMA_VERSION`
  **68 -> 69** (main's value read, not assumed), an append-only v68 -> v69 step, `tests/fixtures/saves/
  v69.json`, `npm run e2e:fixtures`. `brandStrengthSeed = {week, value}` is written ONCE by the
  migration and by nothing else – not `createWorld`, not any phase of the tick – which buys four
  things: his career does not jump on the tick after the merge, a new career reads its own history,
  there is no per-week write to get wrong, and **the frozen career hashes move by `schemaVersion`
  alone**. A stock written weekly WOULD have landed on `selfTravelling` (fame 2.55 by week 156,
  measured). `tools/frozen-key-diff.ts` against the branch's own base, all three careers: **1 key of
  59, 59 and 60 – `schemaVersion`**, with `rngMain` AND `offers` byte-identical.

  Specs: `docs/specs/brand-inertia-2026-08.md` and `docs/specs/collaborations-as-early-fame-2026-08.md`,
  both with predicted vs measured and the frontier either way. Bench: `tools/r32-brand-inertia.ts`.
  Guard: `tests/round32-brand-inertia.test.ts`, 25 arms in nine sections, mutation-verified against
  twelve mutations.
