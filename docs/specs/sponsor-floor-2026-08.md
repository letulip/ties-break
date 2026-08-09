---
type: specification
status: current
area: economy-and-progression
canonical: false
last-reviewed: 2026-08-09
---

# The sponsor floor – the shop stops refusing the girl the world ranks

**Branch** `fix/sponsor-floor` · **schema UNCHANGED (v45)** · **09.08.2026**
**Bench** `npm run bench:sponsor` (`tools/sponsor-window-bench.ts`), 144 careers x 312 weeks per arm

> **THE WAVE IN FIVE LINES.** `standingClears`'s local arm read her DOMESTIC ranking and nothing
> else, so a junior who went abroad – decaying the only table the shop would look at – was refused
> by the one rung that exists to catch a career the big brands passed on. Winters in which the whole
> ladder refused her go **20 of 338 → 4 of 340**, and **seasons that open with no kit deal go 22.9% → 19.4%**
> (patient arm 23.4% → 19.7%). The residual is NOT the gate: **42 of the 57 remaining bare seasons
> are `offerChance` coming up empty**, which is the design's own dice and a tuning question for the
> owner. Sponsor income moves +3.0% and its share of career income is unchanged at 1.2%.

---

## 1. The bug report is the owner's own save

09.08: «у нас 3 тира этих спонсоров, а мне достается только 1 самый первый… у неё кончился контракт,
а нового не дали.»

Read through the engine's own predicates (`tools/round15-read.ts`) on `olivia-o1p7_w104`:

```
olivia w104   standing {national #67, itf #4, wta unranked}
              local  –        national CLEARS   global CLEARS
              rungFor: global      windowLadder: global -> national
              offerChance 0.7 per letter        seasonSpokenFor: NO
```

**The ladder is not stuck on rung one** – Ines's save climbs `local` → `global` between seasons 0
and 1, so `windowLadder` works. What failed is the FLOOR. Olivia is **ITF #4**, she clears the
GLOBAL gate, and `local` **refuses her**, because its arm was

```ts
standing.nationalRank <= s.maxRank || standing.wtaRanked      // maxRank = 30
```

and she had slid to national #67 by playing abroad. Her five-week window therefore carried TWO
letters at 0.7 each instead of three; both dice missed (~9%) and she opened the season with nothing.

## 2. Why that is a defect and not a balance opinion

**The gate is inverted: the better she gets internationally, the more certainly the shop in her own
home town refuses her.** Her domestic points are a rolling 52-week best-6, so a season on the
international calendar decays them to nothing – the only evidence the local rung would look at is a
table she stops defending the moment she leaves.

⚠ **It is `ECONOMY.sponsorship`'s own 30.07 error with the two tables swapped.** That block was
rebuilt because a local sponsorship was gated on her ITF rank – "an award for domestic prominence
denominated in a currency she does not hold", measured as firing for NOBODY in any preset. The same
sentence is true again in the other direction the moment she leaves home, and the fix is the one the
two rungs above already took on 02.08: **read whichever table she is actually on.** `standingClears`
already carried `|| standing.wtaRanked` as the PROFESSIONAL escape hatch for this rung; the junior
one was simply missing.

## 3. The number, and where it comes from

```ts
localMaxItfRank: 128      // = TIERS.j300.drawSize * 4
```

Both existing junior gates are read off one figure in the tier table (`national.maxItfRank = 32` =
`TIERS.j300.drawSize`, `global.maxItfRank = 8` = the same / 4), and `tests/offers.test.ts` pins the
equalities because economy.ts cannot import the calendar. The floor is picked the same way, and
**two independent readings land on the same number**:

* **the ladder's own step, run downwards.** The rungs divide by four as they climb (32 → 8), so the
  rung below National multiplies by four: 32 x 4;
* **a season of the prestige draw.** J300 runs `everyNWeeks: 13`, i.e. four a season, so 128 is every
  main-draw place at that rung over a year. National signs the girl who is IN this draw, Global the
  one still in it on the last day, and **the shop backs the girl good enough to be in a J300 draw at
  some point this season** – which is what a home-town shop actually knows about a girl.

It is deliberately **wider** than the distributor's gate: a floor that admitted exactly the same
careers as the rung above it would catch nobody the big brands passed on, which is its whole job.

### 3.1 ⚠ Where it bites today, measured – because the number should not be trusted without this

The junior table is the cohort (200 rows) and **75–122 of them hold a counting result in any given
winter** – min 75, p50 90, max 122 over 30 observations (three presets x two seeds x five winters,
`rankingFor(world, 'itf').filter((r) => r.points > 0).length` read at week ≡ 47, the window's own
opening week). That was a throwaway probe and it is NOT in the repo: it is four lines around
`openCareer`/`stepCareerWeek` from `tools/econ-bench.ts`, and the sentence above is what it was for.
So a cut at 128 sits just PAST the
ranked depth: **in today's population this arm reads "she holds a junior world ranking at all"**,
which is the same shape the professional arm one line below it already has.

The ceiling is written down anyway. The cohort has grown once already (FIELD 520 → 1,600) and a rule
spelled "any ranking" stays unbounded when the table outgrows it, while a number starts biting again
the day it does. And the arm cannot become a pension: `itfRanked` is a LIVE 52-week window
(`sponsorStandingOf`), so a girl who stops entering loses it on her own.

### 3.2 The population the cut was sized against

Of the winters in which the domestic gate alone refused the shop, over 144 careers x 6 seasons:

| | eager | patient |
|---|---|---|
| winters the domestic gate refused | 26 | 27 |
| ...of those, holding a junior world rank | 22 | 23 |
| their ITF rank, p10 / p50 / p90 | 24 / 50 / 69 | 24 / 49 / 69 |
| caught by a cut at 8 / 32 / 128 | 1 / 6 / 22 | 1 / 6 / 23 |

**A cut at National's own 32 would have caught six of twenty-two** – it would have fixed Olivia
(ITF #4) and almost nobody else, which is how a fix passes its anecdote and leaves the defect in.

## 4. What was measured

`npm run bench:sponsor -- --seeds 4`, 9 presets x 2 policies x 4 seeds x 2 signing policies = 144
careers per arm, 312 weeks, same seeds both sides. The BEFORE arm is this branch with
`economy.ts`/`offers.ts` stashed, so nothing else differs.

### 4.1 The headline – the owner's own sentence as a counter

Coverage and the gap are WEEK counts and cannot answer «у неё кончился контракт, а нового не дали».
That question is about a SEASON opening with nothing, read at the season's first week:

| | BEFORE eager | AFTER eager | | BEFORE patient | AFTER patient |
|---|---|---|---|---|---|
| seasons opened (season 1+) | 293 | 294 | | 295 | 295 |
| **...with NO kit deal** | **67 (22.9%)** | **57 (19.4%)** | | **69 (23.4%)** | **58 (19.7%)** |
| careers that never open a season bare | 31/72 | **34/72** | | 30/72 | **33/72** |

### 4.2 ...and the winter that produced them, by verdict

| winters reached (338 / 340) | BEFORE eager | AFTER eager |
|---|---|---|
| **cleared NO rung at all** | **20** | **4** |
| already promised to a running deal (not bare) | 19 | 19 |
| let a brand down this year (the obligation) | 16 | 16 |
| open to her | 279 | **297** |
| ...of those, no brand wrote (`offerChance`) | 37 (13.3%) | 42 (14.1%) |

**This is the defect, isolated: 16 of the 20 winters in which the WHOLE LADDER refused her were
winters in which she held a junior world ranking and the shop would not look at it.** Four remain,
and they are careers with no standing anywhere – «nothing is manufactured» still holds.

### 4.3 Coverage, the earned split, and the money

| | BEFORE eager | AFTER eager | | BEFORE patient | AFTER patient |
|---|---|---|---|---|---|
| career sponsor coverage | 63.9% | **66.9%** | | 60.7% | **63.7%** |
| the competing half (>= median events) | 78.9% | **82.0%** | | 74.5% | **78.0%** |
| the quieter half | 48.1% | **50.0%** | | 44.4% | **47.6%** |
| longest gap p50 / p90 / max | 54 / 205 / 210 | 54 / 205 / 210 | | 55 / 209 / 210 | 54 / 209 / 210 |
| letters by rung – local / national | 2.88 / 0.54 | 3.08 / 0.54 | | 3.26 / 0.58 | 3.49 / 0.57 |
| sponsor value per career | $2,655 | **$2,735** | | $2,657 | **$2,737** |
| ...as a share of career income | **1.2%** | **1.2%** | | **1.2%** | **1.2%** |

Three cross-checks the change had to pass and does:

1. **Only the local rung moved.** `national` letters are 0.54 → 0.54 and every rung above is
   unchanged to two decimals. The floor was widened; the ladder was not.
2. **Continuity is still EARNED.** The competing half gains +3.1 pp and the quieter half +1.9 pp, so
   the spread between them widens rather than closes. A career that stops competing still loses its
   kit – `itfRanked` decays with her results and `minEvents` is untouched.
3. **It is not a subsidy.** +$80 a career over six seasons, and the share of career income is
   unchanged to the decimal. The econ bench's survival arithmetic cannot see this.

### 4.4 ⚠ The residual is the DICE, not the gate – which is the honest answer to «на протяжении всей карьеры»

`windowLadder`'s comment promises that the lower rungs are "what catch a career the big brands passed
on", and that the promise is a MECHANISM rather than a guarantee. After the fix, **19.4% of seasons
still open with no kit deal**, and the decomposition says why:

| what leaves a season bare (AFTER, eager) | winters |
|---|---|
| a rung she cleared, and no brand wrote – `offerChance` | **42** |
| she let a brand down this year, so nobody writes | 16 |
| she cleared no rung at all | 4 |
| total | 62 winters → 57 bare seasons |

**Three quarters of what is left is `offerChance` = 0.7 per letter.** A girl clearing one rung is
sent nothing three winters in ten; most careers on this bench clear one or two. Closing that is a
TUNING decision and it is the owner's, because it trades directly against the design's own rule
(«nothing is manufactured», `sponsor-window-2026-08.md` §3.2) – the levers are `offerChance` /
`topOfferChance`, or letting a rung whose roll missed re-roll on a later week of the same window.
**No guarantee was added here**, and the 14.1% silent-winter rate is the same number
`sponsor-window-2026-08.md` §10.3.1 already flagged as "that is offerChance, and it is the design".

### 4.5 ⚠ And this rung is BACKGROUND-BLIND, so it is not the answer to «за 8к проще играть, чем за 25к»

Read this fix beside the other two levers or it will be credited with something it does not do.
`standingClears` asks about her RANKING and never about the family, so the floor lands on `working`
and `middle` alike – it does not move the difficulty inversion the owner reported, and the round-15
triage measured three separate sources for that one, all pointing the same way:

| the lever | what `working` gets | what `middle` gets |
|---|---|---|
| the local-sponsor cameo (`ECONOMY.sponsor`, `eligible: ['working']`) | $12,866 median over four seasons = **22.6% of parent income**, fired for **50/50** careers | **$0**, 0/50 |
| the academy's `needFactor` (`ECONOMY.academy`) | **1** – the full weight on the scholarship roll | **0.6** (`wealthy` 0) |
| the wealth corridor on the facility line (`WEALTH_CORRIDOR`) | **0.7–0.8x** the same court | 0.95–1.05x |

Parent income is $245/wk against $425/wk – 1.73x on paper, which the cameo alone closes to 1.39x.
**So a reader who fixes one of the three has not moved the complaint**, and none of the three is
touched here: this branch changes who gets a LETTER, not who can afford the week. See
`docs/specs/round15-triage.md` (headline 2, and item 16 for the cameo's shape, which is the owner's
to rule on).

## 5. What else shipped on this branch (surfacing only, no arithmetic moved)

Round-15 group B, items 8 and 5, plus backlog #90. All three are the same defect in three places:
the engine knew the number and no screen printed it.

* **The kit allowance is on the Bills page** (item 8). `kit.ts` has always computed
  `max(0, kitAllowanceCents - coveredCents)` and only the purchase dialog quoted it, so kit that was
  free last week was charged this week with no warning: «значки free ушли… а почему цена в bills
  отличается от цены в списаниях? Я понял почему – видимо мы выбрали квоту». `Snapshot.kitDeal`
  (new, derived, `KitDealView`) carries the brand, the pot, what is spent and what is left; the Bills
  card prints the running balance, says so when the pot is empty, and a PART-covered line explains
  itself instead of showing two prices with no reason.
* **A contract's length is on screen** (item 5). `terms.seasons`, `fromWeek` and `untilWeek` were all
  persisted and no surface printed any of them. Now: the letter says which week the deal runs to, a
  signed letter carries its interval, the sign-confirm names the end week, and the Bills card prints
  `Two seasons · W1 '32 – W50 '33`.
* **⚠ The coach quote is priced off the BAND again**, which is the same defect from the other side:
  the Money screen's own header promises "EVERY FIGURE IS THE ENGINE'S OWN … cannot drift from the
  charge", and `trainingBillNote` read `snap.ageYears` into three calls – `coachById`,
  `facilityRateCents` and `weeklyBillSplit` – that `resolveBaseCosts` makes with
  `ageAtWeek(world.week)`. It has been the same number only by accident: `Snapshot.ageYears` WAS the
  band. `fix/one-clock` makes it her real age, and the coach roster must stay on the band on purpose
  (a pure function of the age with only the chosen id persisted – key it to her birthday and every
  December career's coach re-rolls). Measured on the identical bug in `ThisWeekScreen.vue`: a
  December girl is 16 from week 156 to 204 while the market restocked at 17, so the screen quoted
  the development rate against a bill charged at the professional one for **49 weeks**. Fixed to
  `ageAtWeek(snap.week)`, the idiom `PlanWeekSheet.vue` already uses, and pinned by a mounted test
  that mounts a real ticked career at the 12-16 / 17-22 boundary and asserts the quoted figure is
  the charged one (mutation-verified: reverting to `snap.ageYears` quotes a different week's money).
* **The academy has a line** (#90). It pays as a discount on travel and never as a row – measured at
  $948 over four seasons while the scholarship is held by 50/50 careers. The Bills page now prints
  the cover share and `coveredCents`, the engine's own running total since the last review.

`kitPurchaseSplit` now calls the same `kitAllowanceRemainingCents` the view does, so the till and
both screens read ONE expression.

## 6. Schema

**No change. v45 is unmoved, no migration, no fixture.** `localMaxItfRank` is an ECONOMY constant and
`KitDealView` is derived at snapshot time from the persisted offer – neither is saved state.

## 7. Files

| file | what changed |
|---|---|
| `src/engine/economy.ts` | `sponsorship.localMaxItfRank` and the argument for it |
| `src/engine/offers.ts` | `standingClears`'s local arm reads the junior table too |
| `src/engine/world/kit.ts` | `kitAllowanceRemainingCents`, `kitDealView` |
| `src/engine/world/snapshot.ts` · `src/shared/protocol.ts` | `Snapshot.kitDeal` / `KitDealView` |
| `src/components/screens/MoneyScreen.vue` | the Bills allowance block, the three per-line arms, the academy card, and `trainingBillNote` priced off `ageAtWeek(snap.week)` |
| `src/components/OfferLetter.vue` · `InboxSheet.vue` | the term, on the paper and on the confirm |
| `tests/offers.test.ts` | the equality pin, Olivia as a fixture, and the three things the floor still refuses |
| `tests/economy.test.ts` | the 30.07 guard re-aimed in its meaning, every assertion kept |
| `tests/component/bills-sponsor-quota.test.ts` | new – the Bills page and the letter, both mounted: the balance (read off `StatRow`'s own slots, so the pot cannot pass for it), the empty pot, and the term on the paper before and after the signature |
| `tools/sponsor-window-bench.ts` | THE FLOOR counter (bare season openings), the winter verdicts, the refused-population ranks |
| `tools/round15-read.ts` · `tools/two-cells.ts` | four type errors that had `vue-tsc -b --force` red on this branch before any of this (see §8) |

## 8. ⚠ The gate was already red when this branch was cut

`vue-tsc -b --force` failed at `d6e9fc5` with six errors in the two round-15 triage tools –
`o.spentCents` (the field is `coveredCents`), `world.ending?.kind` (the discriminant is `type`), a
`PlayerProfile` literal missing five fields, and three casts that need `unknown`. Two of them were
real reading bugs in the tools, not just type noise. They are fixed here because `npm run check`
cannot otherwise pass on any branch cut from this head; the changes are four lines and a comment
each, and are called out so the merge can be sequenced.
