---
type: spec
status: current
area: economy
canonical: false
last-reviewed: 2026-08-08
---

# The court follows the coach – and the part of the owner's ask that cannot be free

The owner priced this himself, from the sport he plays (08.08):

> «Я играю в падел, у нас есть корты за 22 доллара в час (кстати, теннисные стоят похожих денег) и за
> 44+ доллара в час в других местах, есть и дороже всякие элитные корты. Работа тренера на бюджетном
> тире в падел стоит от 10 долларов в час и дальше. Давай пожалуйста приведем стоимости тренеров и
> кортов к этой системе, по крайней мере до проф карьеры…»

The evidence is in [`docs/research/real-coaching-costs.md`](../research/real-coaching-costs.md). This
document is the decision: **what changes, what it was measured to cost, and what is not being shipped.**

---

## 0. THE OWNER'S RULING, and it closes two of the four open questions

He read the research and answered (08.08):

> «Про корты – хорошо, что посчитал и наши цифры подходят, надо теперь математику с тренером еще
> собрать. **Можно вообще стоимость корта по тиру к тиру тренера привязывать и всё. Более дорогой
> тренер = более дорогой корт.**»

**Two rulings, and both are load-bearing.**

1. **The court's price is bound to the coach's rung, and that is the whole rule.** Dearer coach =
   dearer court. So the ladder is monotone across the rungs and not a two-step at the top; §3 is
   rewritten to his rule and §3a records the one cell arithmetic will not let it reach.
2. **«наши цифры подходят» – the price LEVELS are accepted, so the totals do not move.** That is not a
   constraint fighting ruling 1, it is what makes it cheap: `ECONOMY.coach.hourlyRateCents` stays
   untouched and the court becomes a rung function *inside* it, so the change is a partition again and
   survival cannot move.

⚠ **AND IT CLOSES §5/§6: his absolute court figures are no longer an open option.** They were priced
here as the not-shipped arm precisely because they would raise the totals; «наши цифры подходят» is a
decision against that, so §6's arithmetic stays as the record of what was declined and **the bench arm
for it was not run.** The wall-clock went into re-measuring his actual ruling instead.

⚠ **THE DESIGN CHOICE UNDER ALL OF THIS WAS NEVER CONSTRAINED BY REALITY, and that is worth stating so
nobody re-litigates it.** `docs/research/real-coaching-costs.md` §3b found the market doing it **both
ways and saying which** – Camperdown and Escuela Tenis Barcelona bundle the court into the lesson price
in so many words, KĀHLĪ Phuket adds ฿500 for it, 360 Tennis Sofia sells the same session at €20 without
and €35 with, and the LTA's own national average is explicitly *"after paying for court fees"*. **No
published policy anywhere says a coach must pay court hire, or must not.** So "the tier price is
inclusive of the court" was always a design decision on design grounds rather than a reading of the
sport, and the owner has now made the decision that sits on top of it.

---

## 1. The ship rule, written before a single candidate was implemented

Recorded first and verbatim, because a ship rule written after the numbers are in is not a rule.

⚠ **The rule below was written before the first candidate, and the owner's ruling did not change it** –
because his ruling 2 keeps the totals frozen, so "bankruptcies move by exactly zero" is still the right
bar and still provable rather than hoped for. What the ruling changed is the ladder's *shape*, so the
prediction in §4 is restated for the new constants and the measurement re-run against it. **Both runs
are reported.**

**Part 1 – the total-preserving partition – ships only if all five hold:**

1. **Bankruptcies move by EXACTLY zero.** Not "within tolerance". The change does not touch
   `ECONOMY.coach.hourlyRateCents`, so `split.totalCents` is the same integer on every week of every
   career and `world.fundsCents` cannot diverge. Any movement means the change is not a partition.
2. **All 17 identity columns identical per seed**, off the CSV: `gross_expense`, `total_income`, `net`,
   `end_funds`, `weeks_to_bankrupt`, `survived`, `peak_deficit`, `reached_week`, `end_rank`,
   `end_points`, `entries_total`, and the `travel`, `entry`, `gear`, `stringing`, `physio`, `prize`
   totals. `coaching` and `facility` are the only columns permitted to move and their **sum must be
   identical per seed**.
3. `vue-tsc -b --force`, `test:quiet`, `test:component`, `test:sim`, `vite build`, `context:audit` green.
4. **No guard weakened.** The flat-court assertion is re-aimed to *within a rung*, with a ⚠ comment
   quoting the new prices, and must still fail under mutation.
5. **No hired rung can book a $0 coach line** at the bottom of its band, at any age row, in any
   corridor.

**Part 2 – anything that moves the TOTAL – does not ship, on any numbers.** That covers the owner's
absolute court figures, widening `WEALTH_CORRIDOR`, and re-reading his 29.07 table as
labour-exclusive-of-court. It is implemented in a throwaway, measured, reverted and reported. For the
record: a movement of **more than 10 careers in 1,620** would be material; below that it is still not
mine to ship, because a re-price is the most load-bearing balance change in this game.

---

## 2. What was wrong, in one sentence and one number

`facilityRateCents(ageYears)` **took no rung argument**, so an Elite coach worked on the same court as
a self-coaching parent. The court's only inputs were her age and the family's corridor, giving a whole
end-to-end spread of **x1.86** – and **x1.00 within one family**, because the corridor is a fact about
the family rather than a choice.

Two independent lines of evidence say that cannot stand:

* **The owner's own venue ladder:** $22 club, $44+ elsewhere, elite dearer still – at least x2 inside
  one city.
* **A published single-venue coach ladder is only x1.13–1.43 wide** (Central Park NYC, Meadows,
  Oak Hollow, Duke, Pure Tennis, Crawley LTC), and the LTA's own certification ladder is x1.91. **Our
  rung ladder is x4.0.** So our four rungs are not four coaches at one club – they are four venues, and
  a flat court denies it.

And one venue's own published court card shows how far it should move: **Pure Tennis Academy,
Wexford PA – $22 member / $44 non-prime / $60 prime, x2.7** – to the dollar, the owner's own two
numbers.

---

## 3. What ships: the court climbs with the rung, and the cheap end does not move

`ECONOMY.coach.courtTierFactor`:

| rung | factor | court/h at 12–16, middle corridor | coach labour left | venue |
| --- | --- | --- | --- | --- |
| self | 1.0 | $20.00 | $0 | the club, booked by the family |
| budget | 1.0 | $20.00 | $10.00 | the same club courts |
| middle | **1.2** | **$24.00** | $26.00 | an academy |
| high | **1.9** | **$38.00** | $42.00 | a performance centre |
| elite | **2.4** | **$48.00** | $72.00 | the best of it |

**In-corridor spread x2.40** against his observed "at least x2". Across corridors, $14.00 (working
club, corridor floor) to $62.40 (wealthy elite, ceiling) = **x4.46**, measured – against **x1.86**
before, and a real single-city spread of x5.1 (Sydney, one municipal operator) to x16.7 (New York).

**Monotone, which is the owner's rule stated as a shape**, and strictly increasing at every rung the
arithmetic can move.

### 3a. `budget` is the one cell his rule cannot reach, and the reason is arithmetic

A Budget coach's whole bill is **$30/h** at 12–16 and **$20 of it is already the court**, so his labour
is $10 at the midpoint and **$4 at the bottom of his own band**. Lifting his court even to the owner's
own $22 club figure would leave the cheapest Budget coach in the game **$2/h** – below every published
coaching rate in `real-coaching-costs.md` §3a, and it would deepen a finding that document already
reports about exactly this corner (§7.3: a working career's Budget coach earns $3–12/h of labour, below
the owner's own $10 floor across 78% of the band).

So `self` and `budget` share the club court, and **the fiction is exact rather than a workaround**: a
club coach uses the club's courts, which are the same courts the parent books for herself. That is also
the half of the ladder the owner's data confirms – $20 against his $22, $10/h Budget labour against his
"from $10/h" – so it is the half where a change would be inventing a correction.

`middle` takes the largest step its own bill allows: its midpoint total is $50/h, so any court above
$25/h makes the room the larger half of an ordinary academy's bill and inverts the composition the whole
ladder is built on. The hard ceiling is x1.25 and **1.2 is the largest step that clears it without
landing on the line.**

### 3b. The two ceilings that pin 1.2, 1.9 and 2.4

* **A rung's court must stay under half its midpoint bill** or the room becomes the larger half and the
  "Budget is mostly the court, Elite is mostly the man" shape inverts. `middle` x1.25 and `high` x2.0
  land exactly on that line, which is why they are 1.2 and 1.9.
* **Every rung's band LOW must exceed its own court**, or a coach drawn at the bottom of his rung books
  a $0 coach line and the ledger says a coach worked free:

| age row | middle: lo vs court | high: lo vs court | elite: lo vs court |
| --- | --- | --- | --- |
| 12–16 | $40.00 > $24.00 | $64.00 > $38.00 | $96.00 > $48.00 |
| 17–22 | $48.00 > $26.40 | $80.00 > $41.80 | $128.00 > $52.80 |
| 23+ | $52.00 > $28.80 | $96.00 > $45.60 | $160.00 > $57.60 |

### 3c. ⚠ The corner where the two axes meet, checked because it is the one that can go wrong

`courtTierFactor` and `wealthCorridor` are different axes – the venue a rung's coaches work at, and the
market she trains in – and **elite x wealthy is the one cell where two multipliers compound.** At the
corridor's ceiling (1.3) that is:

| age row | elite court, wealthy ceiling |
| --- | --- |
| 12–16 | **$62.40/h** |
| 17–22 | $68.64/h |
| 23+ | **$74.88/h** |

**It is comfortably inside real premium court hire, and not near the top of it** `[S]`: Roosevelt Island
Racquet Club, New York, indoor clay, weekday prime, is **$132 member / $250 non-member**; the
International Tennis Hall of Fame's grass courts at Newport are **$250/h**; Islington's indoor courts
are **£40** non-member. So neither axis is doing the other's job at their product – our dearest possible
court is a quarter of the dearest court anyone in the research publishes.

⚠ **One caveat on that check, stated rather than smoothed over.** The coordinator's reconciliation cited
a European premium ceiling near €30/h and a Dubai indoor near $95/h. **Neither figure is in the court
research this document rests on** – the Spain and UAE arms returned nothing usable, which
`real-coaching-costs.md` §2c records as its largest gap. Against a €30/h ceiling our $62–75 corner would
be *above* the market and the elite factor would want cutting to roughly x1.2. **The check passes on the
evidence I have and would fail on evidence I do not**, so it is worth one Spanish municipal *tarifas*
PDF before the number is treated as settled.

### The composition, after

Middle corridor, midpoint rates, balanced plan:

| rung | coach share, before | after | court share, before | after |
| --- | --- | --- | --- | --- |
| self | 0% | 0% | 100% | 100% |
| budget | 33% | 33% | 67% | 67% |
| middle | 60% | **52%** | 40% | **48%** |
| high | 75% | **53%** | 25% | **48%** |
| elite | 83% | **60%** | 17% | **40%** |

⚠ **The court share is no longer monotone, and that is the change speaking rather than a mistake.** It
falls 100 → 67, sits at 48 across `middle` and `high` where the venue is stepping as fast as the coach
is, then falls to 40 at `elite` where the man finally outruns the room. The reading is exactly right: in
the middle of the ladder the family is buying a better *place* about as fast as it is buying a better
*coach*. The headline shape survives – **Budget is mostly the court, Elite is mostly the man** – and the
whole middle of the ladder is now interesting instead of a smooth interpolation.

⚠ **And one consequence to state rather than bury.** At `middle` the coach beats the court by $26 to $24
*at the midpoint*, so a middle coach drawn below **$48/h** – about 40% of his $40–60 band – is
court-dominated where none was before. That is the price of giving `middle` a real step, it is the
largest step its own bill allows, and it is asserted at the midpoint (which is where the market card
quotes) rather than at every draw.

### The row has to say which venue, or the split's own bug comes back

The facility row's words are a pure look-up (`facilityFlavor`), and until now they named the corridor
only – three strings, because the corridor was the court's only input. With a rung input, two families
in one corridor would see **the same words and different numbers**, which is precisely the
unexplained-charge complaint the bill split exists to remove. So the look-up becomes **3 corridors x 4
venue steps, one step per distinct court price**: rungs that pay the same read the same, and rungs that
pay differently say so. A test asserts exactly that invariant over all fifteen cells, so the copy cannot
drift out of step with the price later.

| corridor | self, budget | middle | high | elite |
| --- | --- | --- | --- | --- |
| working | Club courts | Indoor courts | Academy courts | Performance centre |
| middle | Court hire | Academy courts | Performance centre | Show courts |
| wealthy | Academy courts | Performance centre | Show courts | Centre court |

**The ladders overlap between corridors on purpose** – a working family's best venue is a middle
family's ordinary one, which is what a real market looks like from inside it. **The first column is the
three strings that shipped with the split, verbatim**, because `self` and `budget` pay exactly what they
paid before. Still a pure look-up. Still zero draws.

---

## 4. The measurement

*(filled in below from the runs; predicted first, as the invariant requires.)*

### 4a. RUN ONE – the two-step ladder (1.0 / 1.0 / 1.0 / 1.9 / 2.4), before the owner's ruling

**Predicted, and it is a prediction about arithmetic rather than about balance:** bankruptcies
**538 → 538 of 1,620**, all 17 identity columns identical per seed, `coaching + facility` identical per
seed, and the `coaching` / `facility` columns moving at exactly **three of the nine presets** – the only
three that hire above `middle`.

⚠ *This prediction was first written as "the only TWO of the nine", which was wrong on a countable fact –
`25k middle · high coach` hires above `middle` too. Corrected against `PRESETS` before the run finished,
and recorded rather than quietly fixed, because a predicted-vs-measured note whose prediction gets edited
after the fact is worth nothing.*

**Measured**, per seed off the CSV rather than off the console table:

```
rows compared: 1620
bankrupt before 538/1620   after 538/1620
17 identity columns, rows differing: NONE
coaching+facility sum mismatches: 0
ANY other column differing:  NONE
```

| preset | rows whose split moved | coach / career | court / career |
| --- | --- | --- | --- |
| 25k middle · high coach | 180 | $66,039 → $47,523 | $20,573 → $39,089 |
| 120k wealthy · high coach | 180 | $77,667 → $54,537 | $25,701 → $48,832 |
| 120k wealthy · elite coach | 180 | $142,246 → $106,264 | $25,701 → $61,682 |

**Predicted exactly, on every line.** 540 of 1,620 rows moved – the three presets that hire above
`middle`, all 180 of each – and not one other column in the file differs by a cent.

### 4b. RUN TWO – the owner's ladder (1.0 / 1.0 / **1.2** / 1.9 / 2.4)

**Predicted, before the run:** the same three claims hold – bankruptcies **538 → 538**, all 17 identity
columns identical, `coaching + facility` identical – and the split now moves at **five of the nine
presets** rather than three, because `8k working · middle coach` and `25k middle · middle coach` hire at
`middle` and `middle` now has a court of its own. **900 of 1,620 rows**, 180 each.

**Measured**, per seed off the CSV:

```
rows compared: 1620
bankrupt before 538/1620   after 538/1620
17 identity columns, rows differing: NONE
coaching+facility sum mismatches: 0
ANY other column differing:  NONE
```

| preset | rows moved | coach / career | court / career |
| --- | --- | --- | --- |
| 8k working · middle coach | 180 | $24,262 → $21,177 | $15,422 → $18,507 |
| 25k middle · middle coach | 180 | $34,258 → $30,144 | $20,573 → $24,688 |
| 25k middle · high coach | 180 | $66,039 → $47,523 | $20,573 → $39,089 |
| 120k wealthy · high coach | 180 | $77,667 → $54,537 | $25,701 → $48,832 |
| 120k wealthy · elite coach | 180 | $142,246 → $106,264 | $25,701 → $61,682 |

**Predicted exactly, on every line.** 900 of 1,620 rows moved – the five presets that hire at `middle`
or above, all 180 of each – **and not one other column in the file differs by a cent.**

### 4c. The verdict against the ship rule

| the rule | the measurement |
| --- | --- |
| 1. bankruptcies move by exactly zero | **538 → 538 of 1,620.** Zero. |
| 2. all 17 identity columns identical per seed, `coaching + facility` identical | **NONE differ. 0 sum mismatches.** No column outside those two moved at all. |
| 3. `vue-tsc -b --force`, `test:quiet`, `test:component`, `vite build`, `context:audit` | green (2,414 unit tests, 99 component) |
| 4. no guard weakened; the re-aims still fail under mutation | **seven mutations run, every one caught** – see §9 |
| 5. no hired rung books a $0 coach line | asserted over the whole rate table, every age row, and mutation-verified |

**SHIPS.** The rule was written before the first candidate and it is met on every clause, by
construction rather than by luck: `hourlyRateCents` is untouched, so `world.fundsCents` cannot diverge
and the bench is a check on the wiring rather than on the balance.

⚠ **And the honest caveat about what a zero means.** This measurement proves the change is a
*partition*. It does not prove the partition is *right* – no bench can, because the family's wallet
cannot tell the two lines apart. What makes it right is §0's ruling and §3's evidence, and what makes
it safe is this table.

---

## 5. What is NOT shipped: the owner's absolute court figures

> «есть корты за 22 доллара в час … и за 44+ доллара в час в других местах»

**His $44 court does not fit, and the arithmetic says so before any bench does.** Under a partition
that preserves the total, a $44 court inside a $50 Middle bill leaves **$6/h of labour** for an
ordinary academy coach. The court simply cannot be lifted to his absolute figures without lifting the
totals – and lifting the totals is a survival change.

⚠ **And the reason is not that our court is too cheap. It is that our family's tennis budget is too
small in dollars.** `parentIncomeCents` is a weekly *contribution to the war chest*, not a household
income: **$12,740 / $22,100 / $39,000 a year**. Five hours a week of a $44 court is $11,440 a year –
**52% of the middle family's entire tennis budget, before a coach, a flight, an entry fee or a
racket.** In his real market a family paying $44/h has a household income far above $22,100. **Our
coach and court prices are at real-world scale; our income is not.** The two can only be moved
together, and that is a decision about the whole economy rather than about a court.

The measurement of his figures, unbuffered, is in §6 – so that what he is choosing between is priced
rather than described.

---

## 6. His figures, priced

**The arm.** Hold the coach's **labour** at exactly today's value and add his court on top, so that
every extra cent is the room and nothing about a coach's own price changes:

```
new total(tier, age) = today's total(tier, age) − today's club court(age) + his court(tier, age)
```

His court ladder, middle-corridor, using the age scaling the club court already has (x1.0 / 1.1 / 1.2):

| venue | 12–16 | 17–22 | 23+ |
| --- | --- | --- | --- |
| club (self, budget, middle) | $22.00 | $24.20 | $26.40 |
| his "$44+" (high, x2.0) | $44.00 | $48.40 | $52.80 |
| the $60 prime court on the same real card (elite, x2.7) | $59.40 | $65.34 | $71.28 |

Which lands these midpoints, against today's:

| rung | 12–16 | 17–22 | 23+ | today, 12–16 | change at 12–16 |
| --- | --- | --- | --- | --- | --- |
| self | $22 | $24 | $26 | $20 | **+10%** |
| budget | $32 | $37 | $42 | $30 | **+6.7%** |
| middle | $52 | $62 | $67 | $50 | **+4%** |
| high | $104 | $126 | $149 | $80 | **+30%** |
| elite | $159 | $203 | $247 | $120 | **+33%** |

⚠ **Note where the money is, because it is not where it looks like it should be.** The cheap end barely
moves – which is §3's whole finding, that it was already right – and the top moves a third. **His
figures are not a general price rise. They are a price rise at `high` and `elite` and nowhere else**,
because those are the only two rungs whose venue his second and third numbers describe.

**What it does to the family, balanced plan, middle corridor** (arithmetic, not bench):

| rung | weekly now | weekly under his figures | share of the middle family's weekly $425 |
| --- | --- | --- | --- |
| self | $100 | $110 | 24% → 26% |
| budget | $150 | $160 | 35% → 38% |
| middle | $250 | $260 | 59% → 61% |
| high | **$400** | **$520** | 94% → **122%** |
| elite | **$600** | **$797** | 141% → **188%** |

**The bench:**

*(filled in below.)*

---

## 7. The seam past the professional career

His scope was explicit: *«по крайней мере до проф карьеры»*. Past it a player may plausibly buy her own
court – she has prize money, a manager and a reason to train somewhere better than her parents could
afford. The 23+ rate row already steps the court to $24/h, but it steps it *because she is older*, not
because she is now the customer. Making the venue **her** decision belongs after the fork at nineteen.
Recorded, not built.

---

## 8. Files

| what | where |
| --- | --- |
| the factor ladder | `src/engine/economy.ts` – `ECONOMY.coach.courtTierFactor` |
| the court's price | `src/engine/coach.ts` – `facilityRateCents(ageYears, tier)`, `weeklyBillSplit` |
| the two lines, and the venue's words | `src/engine/world.ts` – `resolveBaseCosts`, `facilityFlavor` |
| the quote surfaces | `src/engine/world/coachMarket.ts`, `MoneyScreen.vue`, `ThisWeekScreen.vue` |
| the guards | `tests/split-the-bill.test.ts`, `tests/coachTiers.test.ts` |
| the arithmetic behind every table | `tools/coach-court-price.ts` |
| the evidence | `docs/research/real-coaching-costs.md` |

**No save-schema change.** `courtTierFactor` is a constant and `WorldEventCategory` already has
`facility`; nothing persisted gains or loses a field, so there is no `SAVE_SCHEMA_VERSION` bump, no
migration and no fixture. A loaded v44 career simply starts booking the new split at the load week –
the same rule v44 set for itself, and for the same reason: `financeWeeks` keeps a total per category
and no rate, no hours and no plan, so history cannot be re-decomposed without guessing.

## 9. The guards, and what each one is now protecting

Four mutations were run against `tests/split-the-bill.test.ts` (17 tests, up from 14), and each is a
way the venue ladder could plausibly be broken by a later hand:

| mutation | what it breaks | tests failing |
| --- | --- | --- |
| `high` and `elite` back to 1.0 | undoes the ladder entirely | **2** |
| `high` 1.9 → 2.1 | the court becomes over half a `high` bill | **2** |
| `budget` 1.0 → 1.3 | moves the cheap end the owner's data confirms | **3** |
| `elite` 2.4 → 4.2 | the court passes the elite band's low, so a drawn coach books $0 | **2** |
| `FACILITY_VENUE.wealthy` collapsed to one string | the receipt stops naming the venue it charges for | **1** |

Three assertions were re-aimed rather than dropped, each with a ⚠ comment quoting the new prices:
the flat-court guard (now *within a rung*, and it asserts the across-rung movement too), the
band-low-vs-court guard (now against each rung's **own** court), and `coachTiers.test.ts`'s
`facilityRateCents(14, 'self') === $20.00` – whose asserted value did not move, which is the cheap
end's claim stated as an assertion.

---

## 10. Verification

`vue-tsc -b --force` (all three tsconfig projects), `test:quiet` (**2,414** unit tests), `test:component`
(**99**), `vite build` and `context:audit` all green.

`test:sim` – **9 files, zero assertion failures introduced.** Two files report red and both are the
caveats `split-the-bill-2026-08.md` §10 already records:

* `tests/econ-bench.test.ts` – every assertion passes; exit 1 comes from birpc's hard-coded 60 s
  `onTaskUpdate` timeout at 67 s wall. A runner failure, not a test failure, and both `scripts/units.mjs`
  and `scripts/sim.mjs` are written about it.
* `tests/econ-reach.test.ts` – *"14→18 drifted: expected 1 to be >= 12"*, reading **exactly 1 of 30** –
  the same figure the previous spec records for the unmodified baseline (`+ BOTH (HEAD) 1 of 30`).

⚠ **And this time it is not merely "it reproduces on HEAD" – it is proved.** The per-seed CSV comparison
in §4b covers `reached_week`, `end_rank` and `end_points` over the same 1,620 careers and finds **zero**
rows differing. A change that cannot move a single seed's reach week cannot be the cause of a reach
tripwire, whatever that tripwire reads.

**Draw discipline:** zero new draws on any stream. `courtTierFactor` is a post-draw multiply on a pure
look-up and `facilityFlavor` is still a look-up rather than a flavour draw, so the frozen MAIN capture
(41550 / `e6b0c709`) is untouched and `tests/split-the-bill.test.ts` still holds the streams
byte-identical between a rung that books one line and a rung that books two.
