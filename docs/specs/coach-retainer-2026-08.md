---
type: spec
status: current
area: economy
canonical: true
last-reviewed: 2026-08-08
---

# The coach is on a retainer – R4 reversed, the uplift stops over-quoting, and the sponsor pays the till

Round 14 Group D. Three items from the owner's playtest of 06.08, two owner corrections on 08.08, and
one measurement that turned a "legibility, not arithmetic" diagnosis into both.

Everything numbered below was measured on this branch. The owner's own save
(`tennis-sim_zoe-royv_w255.tsave`, schema v43, week 255) was read locally and is **never committed and
never a fixture**; every figure taken from it is quoted here so nothing downstream has to re-open it.

---

## 1. The falling coach percentage – honest, and quoted 1.76x too high

> «У выбранного тренера поменялся % через некоторое время, сначала было 0,5–1,0, потом стало 0,4–0,9,
> сейчас уже 0,3–0,7. С чем это связано и почему так происходит?»

The number is `formatUplift` on screen T (`CoachMarketScreen.vue`), off `coachSeasonUplift`
(`engine/coach.ts`). It is the extra overall level a rung would add over one season, as a percentage
of the level she is at today, against the self-coached baseline.

### The fall is real and the model reproduces his three sightings

Growth is a share of REMAINING headroom (`growWeek`: `skill += rate x (ceiling - skill) x luck`), so
the same coach buys less as she fills her ceiling; and `ageFactor` eases from `growthEnd: 18` towards
`plateauStart: 23`. Rolling his own girl back through the model's own compounding, potential fixed:

```
 age  realisation  ageFactor  headroom   screen T
14.0      82.2%    0.005580     11.26    +1.1-2.2%
15.0      86.9%    0.004960      8.32    +0.7-1.4%
16.0      89.9%    0.004340      6.38    +0.4-1.0%
17.0      92.0%    0.003720      5.08    +0.3-0.7%   <- his "сейчас"
18.0      93.4%    0.003100      4.21    +0.2-0.5%   <- his save today
```

**Headroom is the dominant driver, not age.** Holding his girl fixed and moving one dial:

| dial moved | screen T |
|---|---|
| as she is today (age 18.0, 93.4% realised) | +0.2-0.5% |
| age rolled back to 15, headroom as today | +0.3-0.7% (ageFactor x1.60) |
| headroom rolled back to 75% realised, age as today | +1.0-2.2% (x4.4) |
| both rolled back | +1.5-3.1% |

### ...but the quote was not honest about DELIVERY, and that half was a bug

`coachSeasonUplift` projected over `upliftHorizonWeeks: 52` **coached** weeks unconditionally and
never asked how many weeks of the year the coach is actually there. Under the R4 rule (§2) he was
stood down for every competition week – measured on the owner's save, weeks 196-255: **34 weeks
billed, 26 not, no vacations and no off-season rows in the window, so 43% of his playable weeks had
no coach at all**.

```
what the screen SAID        +0.2-0.5%    (52 coached weeks assumed)
what he was RECEIVING       +0.1-0.3%    (29/52 effective weeks)
over-quote                  1.76x
```

**Fixed both ways.** `coachSeasonUplift` takes `coachedWeeks` and compounds the mixed season exactly
(`headroomShareTakenMixed`); `coachMarket` feeds it the engine's own count. And §2 makes the coach
present for all 52, so the corrected quote for his save is **+0.2-0.5% – the same number, now true**.

### The market had also stopped discriminating, and nothing said so

At 93.4% realised the entire ladder collapses into four tenths of a point:

```
budget  great fit   +0.1-0.2%
middle  great fit   +0.2-0.4%
high    great fit   +0.2-0.5%   <- his coach, $312/wk
elite   great fit   +0.2-0.5%
```

`coachRoomNote` now prints one engine-computed sentence above the rows, in four bands by realisation.
It **quotes no figure**: `KidScreen` keeps her ceiling behind a fog of war and a percentage here would
be the back door through it.

---

## 2. The weekly retainer on competition weeks – R4 reversed

> «я не отрицаю, мы общались про поездки тренера с игроком... а сейчас я говорю про еженедельное
> списание тренерских сумм на неделях турниров – тренер продолжает работать там и давать прогресс»

### What the record said, and why it did not contradict him

R4 (29.07, `f271a29`) implemented: «мы автоматически можем не считать соревновательные и турнирные
недели тренерскими, **а давать игроку возможность самому отдельным переключателем добавить тренера и
на эти недели тоже**» – default off plus a player toggle.

30.07 (`77e08aa`) then cancelled the toggle's mechanic: «давай-ка мы вообще эту механику пока до
нормальных чеков и 18+ вообще не будем делать. Никто никуда не ездит. Не будем здесь усложнять, в про
карьере – там другое дело. **Здесь просто пусть списывается недельный кост и капает навык – всё.**»

That last sentence is the model shipped here. R4 had run **two questions** together – does he travel,
and is the retainer owed – and the toggle for the first was sitting on the arithmetic of the second.

### The change

`coachWorksThisWeek` drops the competition-week clause. Two exemptions survive, both owner rulings:
college («the family stops paying») and a booked family holiday («он не там, он не должен», 30.07).
`coachOnEventWeeks` is no longer read by it: it means **travel**, and only travel, and its row on
screen T stays locked because that mechanic is still cancelled.

The bill and the development rate read the one predicate, so they cannot disagree about whether he
came – that pairing is unchanged and is still guarded.

### Measured: 3 arms x 108 careers (9 presets x 2 policies x 6 seeds x 312 weeks, 14 -> 20)

Only the rule differs between arms; same preset, seed, policy and horizon. The shipped bench's own
`player` arm confounds three levers and says so – this does not.

| arm | bankrupt | coach/career | coach/season | med end funds | worst balance | peak skill | end ITF rank |
|---|---|---|---|---|---|---|---|
| the R4 rule (what shipped) | 44/108 · 40.7% | $63,689 | $10,615 | $22,801 | $4,332 | 59.340 | #71 |
| retainer from wk 208 only | 49/108 · 45.4% | $75,569 | $12,595 | $18,468 | $2,618 | 59.416 | #71 |
| **the retainer (shipped here)** | **57/108 · 52.8%** | **$99,758** | **$16,626** | **$20,939** | **-$148** | **59.625** | **#71** |

**It costs +12.1 points of bankruptcy, +56.6% of career coaching spend (+$4,197 on the median season)
and buys +0.285 peak skill points and no rank movement at all.** That is a bad trade on the bench's
own numbers and it is shipped anyway, because it is a correctness fix rather than a tuning choice: the
family was being told it employed a coach and was employing one for 57% of the year.

On the owner's own save the retainer costs **~$7,012 a season / 23 extra billed weeks**, against
**$40,700 of prize money in the same 60-week window** and $111,250 career – so the 30.07 premise
("junior tennis has no prize money, so there is nothing for a fare to be weighed against") no longer
describes his career at all.

### ⚠ Do NOT build a "he contributes differently on an event week" mechanic

The obvious next thought – a coach at a tournament scouts, adjusts between matches, holds her together
after a loss, so perhaps he should move something other than the development rate – **has already been
built and measured three times, on 30.07, and all three failed** (`77e08aa`):

1. the boolean cost **+$21k at elite over a career for +0.6 skill points** – "a tax, not a decision";
2. discounting the cumulative **run ladder** moved 2 condition points out of ~36, because the whole
   ladder is 6 points against `matchDrain`'s 20-30;
3. a **match-strength edge**, deliberately sized against the surface x style table's 6% so it would be
   commensurate, came out at 2.8-5.0% and made elite results **worse** – 12.7 wins to 5.8, rank 90.7
   to 103.6 over 30 seeds.

The commit's own conclusion is the warning worth keeping: *"I kept proposing mechanisms without first
checking their magnitude against the numbers they had to move."* The owner's instruction on the same
day was the flat model, and he repeated it on 08.08. No proposal is made here.

### Two smaller things the reversal exposed

- **The off-season was always billed at full rate**, and the season quote said otherwise.
  `coachBilling` priced a season over `WEEKS_PER_YEAR - OFF_SEASON_WEEKS` = 49 while
  `resolveBaseCosts` charged all 52 (his save: weeks 205/206/207 at $309/$329/$321). It now returns
  one `seasonCents` over `billedWeeks`, which is what the engine actually charges.
- **`coachBilling.eventWeeks` read 0 on a rolled season**, because `world.entries` empties when the
  calendar turns over – his save reported 0 tournament weeks at week 255. It falls back to the season
  just finished.

### ⚠ Still open, and NOT done here

The owner suggested «какое-то уведомление игроку давать, что поездки теперь возможны». **Travel never
becomes possible today** – the screen-T row is hardcoded `disabled`, and the mechanic behind it was
cancelled on 30.07 with the three measured failures above. A notification saying travel is now
available would be false. It needs the unlock decided first; that is a ruling, not an implementation.

---

## 3. The sponsor that did not pay

> «Несмотря на наличие спонсора, закрывающего струны и ракетки, в разделе bills я выбрал новые, нажал
> купить, и они списались со счёта. Спонсор не покрыл – мне кажется, это неправильно.»

### It was explanation (a): the coverage was never consulted on that path

`setKitGrade` did `world.fundsCents -= costCents` with no reference to `activeKitDeal`, `terms.covers`
or `coveredCents`. Coverage was consulted in exactly two places and this was not one of them:
`resolveGear` (the recurring bill) and `kitFreshCap` (the wear ceiling). No test pinned it, and the
commit that introduced the ladder (`41408b9`) never mentions the deal. It was simply never wired.

It was **not** an exhausted allowance: his `kit-151` national deal had **$536.22 of $3,000 unspent** at
week 255, and `resolveGear` was demonstrably still paying (week 252: *"Restring – budget synthetic – on
Netrally Distribution: $0"*).

And the screen said so while charging him. `MoneyScreen` prints *"Her sponsor supplies this line"*
directly under the rung buttons, and the confirm dialog quoted the sticker price.

**Fixed.** `kitPurchaseSplit` is `resolveGear`'s own arithmetic – same `Math.min(amount, remaining)`,
same allowance ceiling, same "the row is still emitted at what the family actually paid". Buying up
does not buy more sponsorship; it spends the same pot faster. The button, the dialog and the till all
quote `payableCents`, which is the engine's number.

### The letter over-promised a second way, independently

`signOffer` zeroed `coveredCents` once, at signature, and **nothing ever reset it**. So «up to $3,000
of kit **over the season**» was really $3,000 over the whole TERM – two seasons at `national`, three at
`global`. His save had spent $2,463.78 of one pot across ~100 weeks.

`rolloverKitAllowance` now clears the active deal's counter in the season-boundary block.
**Idempotent by construction and therefore no schema change**: `tickWeek` visits each week exactly
once, so a reset hung on `week % WEEKS_PER_YEAR === 0` fires exactly once per season – no
`coveredSeasonIndex`, no migration, no golden fixture. It also repairs the goodbye letter for free,
which reports `coveredCents` as *"kitted her out all season – $X of kit"* and was reporting a term.

### ⚠ A tuning question this exposed and does not answer

With a per-SEASON pot, `global.seasonCents` at $5,000 is now **larger than a wealthy family's whole
annual covered-lines bill**. Measured on one clean covered season (seed `flat-rich-top`, weeks 52-103,
global rung, all three lines):

```
covered $4,446 · family paid $1,288 (apparel, which no kit deal has ever covered)
gross kit bill $5,734 · cap $5,000
```

So the top rung effectively covers everything she buys on cadence, and the ceiling only starts to bite
when she also buys UP the ladder – which since this wave spends the same pot. The old test read this
as "the ceiling binds" only because the term-wide pot let a 53-week window saturate it. Sized
deliberately or not, it is a number to look at with the per-season reading in mind.

### What a kit rung actually buys, and why the screen never said

> «Еще вообще хорошо бы дать понять что разные тиры шмота дают вообще.»

He could not tell because the screen was promising something the model refuses to give. `equipment.ts`
is explicit: **fresh kit is exactly neutral at every rung** (`startWear` is 0 from `composite` up,
every multiplier is 1) and **wear only ever subtracts**. A `pro` frame does not hit harder than a new
`composite` one. The old copy – *"Better kit lasts longer, plays truer and is kinder to her body"* –
was wrong in the middle clause.

A rung buys **time**, and that is now what the button says (`goodWeeksFor`, weeks before the line
reads "Worn" in the screen's own vocabulary):

| line | alloy | composite | performance | pro |
|---|---|---|---|---|
| strings | 1 | 3 | 4 | 5 |
| frame | 11 | 16 | 23 | 31 |
| shoes | 4 | 8 | 11 | 15 |

`alloy` is the one rung that starts partway down its own curve – on strings and shoes immediately, and
on the frame only once its 13-week flat head is past ("sound is sound however old"), which is why
`goodWeeksFor` treats the frame separately.

---

## Schema

**No bump.** `SAVE_SCHEMA_VERSION` stays **43**. Nothing persisted changed shape: `coachOnEventWeeks`
keeps its type and its value and only its meaning narrows; `coveredCents` keeps its type and becomes a
per-season counter reset by a week-triggered rule rather than by a new field; `payableCents` and
`goodWeeks` are snapshot-derived view fields that persist nothing.

## Gate

`vue-tsc -b --force` clean · unit 110 files / 2361 tests green · component 8 files / 94 tests green.
Frozen MAIN capture untouched (41550 / `e6b0c709`) – every changed path is post-draw arithmetic, and
the draw-invariance guard in `coachTiers.test.ts` still passes on the same 52-week capture.
