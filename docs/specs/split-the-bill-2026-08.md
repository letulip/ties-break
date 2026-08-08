---
type: spec
status: current
area: economy
canonical: false
last-reviewed: 2026-08-08
---

# The bill splits in two – the coach, and the court

The owner could not tell what he was paying for, and both halves of his report are true.

> «на неделях всё еще списывается какая-то рандомная сумма и как будто не за тренера, мне кажется нам
> нужно отдельной строчкой списывать тренера, а отдельной рент залов и прочего с разным тиром для
> разного уровня семей или вынести снова отдельной ручкой выбора наравне с экипом»

Two complaints and one option. The complaints are answered here. The option – making the facility a
*choice* rather than a consequence – is measured in §7 and **not built**; it needs the owner's word.

---

## 1. What was wrong, and it was a recorded decision rather than a bug

`docs/specs/coach-tiers.md` §3 ruled:

> *"Court rental as its own line ($10–30/h) is real and we already charge it for practice matches.
> Adding it to coaching too would be double-counting unless the coaching bill is explicitly 'coach
> only'; simpler to keep the tier price inclusive and say so."*

That ruling is now reversed, and the reversal is recorded **in §3 itself**, next to the sentence it
overturns, because a decision that lives only in a new document is a decision the next reader will
make again.

**What "simpler" cost.** §2 of the same spec prices `self` at *exactly* the court rental – the
parent's hour is free, the court's is not – so the rung labelled **Coaching** was, for a
self-coached family, **100% court rental for a parent who works free**. The game charged them for a
coach they did not have and had no way of saying otherwise. For every other family the line was
coach + court in one figure that nobody could decompose, including us.

**The jitter.** `ECONOMY.coach.weekJitterBps` is `[9200, 10800]` – ±8% on the weekly bill, one
`pickInt`, the week itself varying. It is honest and it stays. What the owner met was an unexplained
number, and an unexplained number in a wallet reads as a swindle. §6 is what was done about that.

---

## 2. What shipped

**Two ledger lines, one total.** `WorldEventCategory` gains `facility` (save schema **v44**). The
weekly training charge is now booked as:

| line | what it is | who pays it |
| --- | --- | --- |
| `coaching` | his labour – the rate above the court | every hired rung |
| `facility` | the court, the hall and the queue for it | **every** rung, including `self` |

**It is a partition, not a re-price.** `engine/coach.ts weeklyBillSplit` runs the *same* expression
`resolveBaseCosts` always charged, then divides it:

```
total    = round(coachWeeklyCents(rate, plan, background, corridor) × jitter)   ← unchanged, verbatim
facility = min(total, round(coachWeeklyCents(courtRate, plan, background, corridor) × jitter))
coach    = total − facility
```

The coach line is the remainder, so the two sum to the total whatever the roundings do. Nothing new
is charged. The practice-match court fee is untouched – a different court on a different day, booked
by the planner and billed under `practice` – so §3's double-counting fear does not arise: **the split
subtracts, it does not add.**

**`self` becomes honest.** `split.coachCents` is 0 by arithmetic at that rung, and the tick emits no
coaching row at all. A self-coached career now books one line a week and it says *Club courts – 5 h*.

**The corridor needed nothing added.** It multiplies the whole bill, so it multiplies the court with
it. That is the owner's own second ask («с разным тиром для разного уровня семей») already satisfied
by arithmetic that was in the model – a working-class club charges 0.7–0.8 of the court, a premium
academy 1.2–1.3.

**`selfRateCents` is now `facilityRateCents`.** The number never changed; it was always the court's
price wearing a coaching name, and the rename is the whole point of the slice.

---

## 3. The measurement: the total did not move

**Method.** A probe ticks 208 weeks with no player action for every (corridor × rung) arm – 15
careers, 3,120 weekly figures – and dumps the per-week charge. Run twice: once in a worktree at the
unmodified `HEAD` (where the sum is the single `coaching` row) and once on this branch (where it is
`coaching + facility`). Diffed cent for cent.

```
weekly figures compared: 3120   mismatches: 0
career totals compared:    15   mismatches: 0
```

| corridor | rung | 208 weeks, before | 208 weeks, after |
| --- | --- | --- | --- |
| working | self | $15,875 | $15,875 |
| working | budget | $26,303 | $26,303 |
| working | middle | $37,529 | $37,529 |
| working | high | $66,319 | $66,319 |
| working | elite | $116,281 | $116,281 |
| middle | self | $21,302 | $21,302 |
| middle | budget | $28,065 | $28,065 |
| middle | middle | $55,356 | $55,356 |
| middle | high | $75,227 | $75,227 |
| middle | elite | $150,009 | $150,009 |
| wealthy | self | $26,764 | $26,764 |
| wealthy | budget | $40,955 | $40,955 |
| wealthy | middle | $73,879 | $73,879 |
| wealthy | high | $121,130 | $121,130 |
| wealthy | elite | $194,371 | $194,371 |

The claim is also written into `tests/split-the-bill.test.ts` as arithmetic: the pre-split expression
is reproduced verbatim as `wasCharged` and compared against `weeklyBillSplit(...).totalCents` over
1,350 combinations of rung, corridor, plan, age and jitter. A one-cent drift fails it – which the
bench cannot be relied on to catch, since $1/week is invisible in a survival rate and is $208 over a
career.

---

## 4. The split, by corridor and rung

At each rung's **midpoint** rate, balanced plan (5 h), so the corridors are comparable without a
drawn coach's own price moving the share:

**Age 14 (the 12–16 row)**

| rung | working | middle | wealthy | coach share | court share |
| --- | --- | --- | --- | --- | --- |
| self | $0 + $75 | $0 + $100 | $0 + $125 | **0%** | **100%** |
| budget | $38 + $75 | $50 + $100 | $63 + $125 | **33%** | **67%** |
| middle | $113 + $75 | $150 + $100 | $188 + $125 | **60%** | **40%** |
| high | $225 + $75 | $300 + $100 | $375 + $125 | **75%** | **25%** |
| elite | $375 + $75 | $500 + $100 | $625 + $125 | **83%** | **17%** |

(coach + court, weekly.)

**The share is corridor-invariant**, and that is a property rather than a coincidence: the corridor
multiplies both halves equally, so *which market she trains in* changes the money and not the
composition. What changes the composition is the rung and her age:

| age row | budget | middle | high | elite |
| --- | --- | --- | --- | --- |
| 14 (12–16) | 33 / 67 | 60 / 40 | 75 / 25 | 83 / 17 |
| 18 (17–22) | 37 / 63 | 63 / 37 | 78 / 22 | 86 / 14 |
| 24 (23+) | 40 / 60 | 63 / 37 | 80 / 20 | 88 / 12 |

### ⚠ The finding worth the owner's attention

**Two thirds of a Budget family's training bill is the court, not the coach.** A Budget coach's own
labour is $8/h against a $20/h court at 14. That is not a new fact – it is what "the tier price is
inclusive of court rental" has always meant – but it has never been *visible*, and it explains
something the bench has recorded for two waves: why the cheapest rung feels expensive for what it
gives. The court is a floor under the whole ladder, and at the bottom the floor is most of the price.

Nothing was re-priced to fix that. It is reported, not patched.

---

## 5. The effect on `econ-bench`: zero

`bench:econ`, 30 seeds × 9 presets × 3 horizons × 2 policies = **1,620 careers**, before and after,
compared **per seed** off the CSV rather than off the console table:

```
rows compared: 1620
coaching+facility(after) == coaching(before) mismatches: 0
all 17 identity columns identical on every row
bankrupt before: 538/1620   after: 538/1620
```

The seventeen: `gross_expense`, `total_income`, `net`, `end_funds`, `weeks_to_bankrupt`, `survived`,
`peak_deficit`, `reached_week`, `end_rank`, `end_points`, `entries_total`, and the `travel`, `entry`,
`gear`, `stringing`, `physio` and `prize` category totals.

**The bankruptcy rate moved by zero – 538 of 1,620 either way**, which is what the brief asked for and
what a legibility change owes a bench that is currently sensitive.

`grossExpenseCents` is folded from the ledger's own `expenseCents` and never from the category list,
so it was never at risk from the new category; the per-seed identity is what proves the *charge* did
not move rather than the accounting of it.

### What the bench now shows that it could not before

Per season, 14→18, grinder policy – the same money, finally decomposed:

| preset | coach / season | court / season | coach % | court % |
| --- | --- | --- | --- | --- |
| 8k working · self-coached | $0 | $3,823 | 0% | **100%** |
| 8k working · budget | $2,060 | $3,823 | 35% | 65% |
| 8k working · middle | $5,938 | $3,823 | 61% | 39% |
| 25k middle · self-coached | $0 | $5,101 | 0% | **100%** |
| 25k middle · budget | $2,651 | $5,101 | 34% | 66% |
| 25k middle · middle | $8,389 | $5,101 | 62% | 38% |
| 25k middle · high | $16,129 | $5,101 | 76% | 24% |
| 120k wealthy · high | $18,975 | $6,375 | 75% | 25% |
| 120k wealthy · elite | $34,568 | $6,375 | 84% | 16% |

Note the court column: **flat within a corridor and rising only with it** – $3,823 / $5,101 / $6,375 a
season for working / middle / wealthy, whatever rung the family hired. That is the corridor doing
exactly what the owner described, now visible as a number.

---

## 6. The jitter, said out loud

The ±8% stays. What it gained is a sentence, under the rows it explains, in the app's own voice and
with the engine's own numbers (`weeklyBillSplit` for the quote, `coachBillRangeCents` for the
envelope – both the functions the tick bills through, so the note cannot drift from the charge):

> Training quotes at $201 a week – $181 coaching, $20 courts. No week bills exactly that: a session
> moves, a court books at a busier hour. Yours runs $185–217.

Self-coached families get the honest variant: *"Court time quotes at $100 a week – you coach her, so
there is no coaching line."*

⚠ **The coach row is emitted first, and the order is load-bearing rather than tidy.**
`WeekRecapCard`'s handwritten scrap is the week's *first* expense event, so emitting the court above
the coach would have replaced every hired family's training flavour with a court receipt on roughly
two ordinary weeks in three – the one object on the Weekly Story that carries the week's texture.
Coach first keeps that byte-identical. A **self-coached** family's scrap does change, from *"Coaching
block: technique drills"* to *"Club courts – 5 h"*, and that is a fix rather than a loss: the old line
told a family with no coach that it had been at a coaching block, which is the same category error
this whole slice exists to remove.

The facility row itself carries the other half of "why is it not the quote" – rate × hours – by naming
the venue and the hours the plan buys: **Club courts – 5 h** / **Court hire – 5 h** / **Academy
courts – 5 h**, by corridor. That is a pure look-up rather than a flavour draw, which is deliberate:
the weekly bill spends exactly one main-stream `pickInt` and the training row already holds it, and a
standing charge should read the same every week because it *is* the same every week.

### ⚠ Open for the owner: does the jitter justify itself?

Its own comment records that the draw slot was preserved when the coach ladder replaced the old
weekly expense roll – *"exactly one pickInt, in exactly the slot the old expense draw held"* – so the
roll became jitter partly to keep a slot. That is provenance, not a reason.

**The reason it deserves, stated so it can be accepted or rejected:** a real weekly bill is not the
same number 52 times. A session moves, a court goes at a worse hour, an extra half hour lands before
a tournament. At ±8% it is small enough that the rung is still recognisable in the figure and large
enough that the family notices the week. That is a decent merit – but the owner should hear it stated
rather than inherit it, and if he does not want it, removing it is a one-line change that costs one
MAIN draw and a re-pinned capture.

**One draw produced both lines,** and that was a choice rather than a constraint. The frozen MAIN
capture is a documented measurement and not a change-gate (CLAUDE.md invariant 2), so a second jitter
was available and was not taken: the jitter is a property of the *week*, not of the coach and the
court separately, so two independent wobbles would read as noise where one shared one reads as a
week. Zero pin movement, and `tests/split-the-bill.test.ts` holds the streams byte-identical between
a rung that books one line and a rung that books two.

---

## 7. The option NOT built: the facility as a choice

> «или вынести снова отдельной ручкой выбора наравне с экипом»

Make the facility a handle the player picks – club / standard / academy – the way the kit ladder
works, instead of a consequence of the coach he hired.

**The case for it.** It is a real decision with a real trade, and the model is already there: the
corridor *is* three venue tiers, priced 0.7–0.8 / 0.95–1.05 / 1.2–1.3, and the split has just made
the line they price visible. A working family that wanted to buy one rung of facility above its
station – better courts, indoor in winter – currently cannot, and a wealthy family cannot economise
on the one line where economising would be sane. It would also give the Budget rung something to do:
at 67% court, the facility is where a poor family's money actually goes.

**The case against, and it is the one I would ship.**

1. **It adds a decision to a game that has just gained several.** This wave alone added the coach
   market (four rungs × four coaches), the kit ladder, the season planner's packages and the
   retainer stance. The next screen the player has not asked for is the one that makes the previous
   four feel like admin.
2. **The corridor is currently a fact about the family, not a purchase**, and it prices *five*
   things – travel, medical, vacations, practice fees and the court. Turning one of its five
   customers into a player choice either forks the constant (two corridors, one chosen and one
   inherited, which is a knob that will drift) or drags the other four along with it, which is a
   balance change the size of the economy.
3. **The measured room is small at the rung that would use it.** At Budget/working the whole facility
   line is $75/wk. One tier of movement is ±$25/wk against a $245/wk parent income – real, but not a
   decision you would build a screen for.
4. **The legibility fix may be the whole ask.** He offered the handle as an *alternative* («или»), not
   as an addition, and the first option is now shipped and measured. Whether the number being visible
   was what he wanted is a question a playtest answers in one session and a spec cannot answer at all.

**Recommendation: ship the split, hold the handle.** If he still wants it after a week with the
visible line, the cheapest honest version is *not* a fourth screen – it is one row on the Coach
Market beside the rung, three states, priced off the corridor the family already has, so the choice
lives where the other training money is decided.

---

## 8. Draw discipline, and what a save sees

- **Zero new MAIN draws.** The week's single `pickInt` is passed into `weeklyBillSplit` as `jitter`;
  everything else is a post-draw multiply off pure look-ups. The frozen capture (41550 / `e6b0c709`)
  is untouched.
- **The facility row's words spend nothing** – a corridor look-up, not a flavour draw.
- **A hired family writes one more event a week, and the cost of that was measured rather than
  assumed.** `events` is capped at 400 and the Money ledger reads the last 50 financial rows, so an
  extra weekly row shortens the history those windows span. Measured on the same 160-week career
  before and after: the ledger's 50-row slice spans **9 weeks → 8**, and `EVENTS_ORDINARY_FLOOR`'s
  120 rows **15 weeks → 14**. Smaller than it sounds, because on a career that plays a calendar most
  financial rows are travel, entry and prize rather than the training bill. No action taken; recorded
  so the next reader of `EVENTS_ORDINARY_FLOOR` does not have to re-derive it. (Its own comment claims
  "120 is ~30-40 ordinary weeks", which this career shape does not reach either way – a pre-existing
  discrepancy, not one the split introduced.)
- **v44 back-fills nothing, on purpose.** A v43 career's `coaching` rows are the numbers that were
  actually charged as one line, and nothing in a save can say which cents of them were the court: the
  split needs the hourly rate and the hours of the week it was drawn in, and `financeWeeks` keeps a
  total per category and no rate, no hours and no plan. A reconstruction would be a guess wearing a
  ledger's clothes. History stays as it was billed; the split begins at the load week.

## 9. Files

| what | where |
| --- | --- |
| the split | `src/engine/coach.ts` – `weeklyBillSplit`, `facilityRateCents` |
| the two lines | `src/engine/world.ts` – `resolveBaseCosts`, `facilityFlavor` |
| the category | `src/shared/protocol.ts` – `WorldEventCategory` |
| the migration | `src/engine/migrations.ts` v43 → v44, `tests/fixtures/saves/v44.json` |
| the rows and the note | `src/components/screens/MoneyScreen.vue`, `--cat-facility` in `src/style.css` |
| the engine nets | `tests/split-the-bill.test.ts` – 14 tests, three mutations verified (a one-cent total drift, a one-cent facility drift, and a `self` rung that books a zero coach row: 4 / 3 / 1 tests fail respectively) |
| the UI nets | `tests/component/round20-ui.test.ts` – two mounted tests, both mutation-verified (dropping the row and hiding the note each fail 2) |
| the reversal | `docs/specs/coach-tiers.md` §3 |

## 10. Verification

`vue-tsc -b --force`, `test:quiet` (2,411 unit tests), `test:component` (99), `vite build` and
`context:audit` all green. `test:sim` – 9 files, **zero assertion failures introduced**; two caveats,
both pre-existing and both verified against the unmodified `HEAD` in a worktree:

- `tests/econ-bench.test.ts` – 13/13 assertions pass, exit 1 from birpc's hard-coded 60 s
  `onTaskUpdate` timeout (65–76 s wall under load 17 from concurrent agents). The failure mode
  `scripts/units.mjs` and `scripts/sim.mjs` are both written about.
- `tests/econ-reach.test.ts` – `14→18 drifted: expected 1 to be >= 12`. **Reproduces identically on
  the unmodified baseline (also exactly 1 of 30)**, and the test's own notes already record
  `+ BOTH (HEAD) 1 of 30` for the two waves that landed before this branch. Not this slice's, and
  moved by it by zero.
