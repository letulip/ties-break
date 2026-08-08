# The coach's real job — and the parent who has to do it himself

> ⚠ **SECOND PILLAR SHIPPED 08.08 — SCHEDULING.** This spec is about his opinion on her BODY. He now
> has one about her CALENDAR as well, and it is the same design one storey up: the mechanic is not
> new, what moves is who decides. See `docs/specs/ladder-floor-2026-08.md` §4. The owner's ruling
> that ordered it («да, идём этим путём, начинай с расписания») is also the answer to the problem §1
> below opens with — the growth multiplier fades to nothing by ~90% realisation, so the reason to pay
> him at twenty-two has to be something other than making her better.

The owner, 30.07, extending my own proposal further than I took it:

> «тогда у нашего self coach появятся ручки, чтобы он ощутил каково это быть тренером. А остальные
> будут с автонастройкой и эффективностью зависимо от тира напрямую.»

This is the design for that. It is written before any code because the balance it moves has been
re-tuned twice this week and a third pass needs a stated target, not an instinct.

## 1. The problem it solves, with the number

Measured, 8 seeds, wealthy family, balanced plan, coach the only variable:

| | growth 14→18 | final fog |
| --- | --- | --- |
| self-coached | +8.5 | 3.7 |
| Elite | +10.1 | **0.2** |
| difference | **19%** | **18×** |

An Elite coach costs $163k against $104k for High and buys **1.6 skill points** in four years. The
`developmentFactor` ladder is 0.82 → 1.15, a 40% faster *rate*, and it compresses to 19% of extra
distance because `growWeek` takes a share of the **remaining** headroom: a faster rate mostly means
arriving sooner rather than arriving higher. **Raising the multiplier cannot fix this** — the
asymptote eats it.

So the model gave the coach one lever when a real coach has three: how fast she develops
(modelled), *what* she develops (`fitFactor`, ±5%), and **load management — injuries, layoffs,
scheduling — which is not modelled at all.** Today no coach tier touches condition or injury by any
route except `coachIncludesPhysio`, a boolean that is true for every hired rung equally.

That third lever is where a real coach's value actually lives, and it is the one the game can price
honestly: *"your daughter lost one season instead of three."*

## 2. The owner's addition, and why it is better than my version

I proposed giving the coach the lever. He proposed giving it to **both**, differently:

- **The self-coached parent gets the KNOBS.** He manages the load himself, week by week, and finds
  out what being a coach is like. Self-coaching stops being a 0.82 penalty with no gameplay attached
  and becomes the **attentive, low-money path**.
- **A hired coach TAKES THE KNOBS OVER**, and how well he uses them scales with his rung.

That reframes the purchase into the thing it is in life: **you are buying your attention back.** A
parent with a job cannot be at the court every day, so he pays somebody to make those calls. The
game has never said that, and it is the truest sentence available about junior tennis economics.

It also answers, from a completely different direction, the complaint that ordinary weeks are empty.
Load management **is** the ordinary week's content. The knock (v26) is one instance of it; this makes
the whole category playable.

## 3. The levers already exist. Mostly this is about who holds them.

Before inventing anything, the inventory — every one of these already moves condition, injury risk
or lost weeks today:

| lever | today | under this design |
| --- | --- | --- |
| `plan.train` / `plan.rest` presets | the player's, always | self: his. hired: the coach advises or overrides |
| the knock: rest or push | the player's, always | self: his. hired: the coach has an opinion, and his rung says how good it is |
| physio | a boolean per rung | self: he buys it per week. hired: included, quality by rung |
| vacations | the player books them | self: his call when to spend a week. hired: the coach schedules one |
| which events she enters | the player's | hired: the coach warns off a tournament she is too tired to win |
| `restRecoveryBonus`, `blackoutBonus` | passive | unchanged — these are the physics, not the decisions |

So the slice is mostly **routing**, not new mechanics. That is the point: a new mechanic would need
its own balance pass, and this one can be measured against systems that are already tuned.

## 4. Three risks, and the answer to each

**(a) ⚠ THERE IS NO CAP ON THE SELF-COACHED PARENT. I proposed one and the owner was right to
refuse it.**

My first draft said his management should top out near Middle and never reach Elite. The owner:
«есть же довольно много примеров в теннисе, где именно родители тренировали своих детей… Может быть
игрок будет хорош и знает, что и как делать? А нет, так и получит то, что получит.» He is factually
right and the counter-examples are the strongest available — Bublik's father coached him until the
cheques arrived, and Richard Williams coached two daughters to world number one with no professional
background at all. A rule that says a parent *cannot* be that good is a rule the sport disproves.

**The real risk was never realism, it was a dominant strategy**: if self-management is free and can
match Elite, nobody hires anybody and the ladder is dead content. But the answer to that is not a
cap on his skill. It is that self-coaching already costs two things, and one of them is a mechanism
this game has already built and measured:

1. **Attention.** The self-coached parent has to make every one of these decisions himself, every
   week. That is a real price for a player, and a hired coach is precisely "pay money to stop being
   asked". The knob-holder pays in taps.
2. **⚠ HE DECIDES IN THE FOG, and this is the good part.** Measured: a self-coached career ends with
   a fog band of **3.7** against Elite's **0.2** — an eighteen-fold difference in how well anyone
   knows this girl. So the parent making the load calls is making them *without a reliable read on
   his own daughter*. That is not a cap on how well he can decide; it is a cap on **what he can
   see** — and it is exactly the real asymmetry. Richard Williams could coach to number one, but he
   also KNEW his daughters. A parent without that read is guessing, and the radar already says so.

So: **skilled play may beat a paid coach, and that is the reward for attention.** Bad play gets what
it gets. What we must NOT ship is self-management that beats Elite *while also being easier* — and
the fog is what stops that without a single arbitrary number.

**(b) It must not become a spreadsheet.** Weekly load sliders are exactly the chore the story screen
was designed to avoid. It has to be **a few decisions with consequences**, in the shape the knock
already proved: the week stops, asks one thing, and the bill is visible. Not a continuous optimum.

**(c) It moves balance, and the owner asked why, since "we are not changing anything, just
detailing what the coach already does".** The precise answer, because it matters:

**The coach does not currently do anything about load.** Not a little — nothing. Today the plan
presets, the knock's rest-or-push, physio, vacations and every entry decision are the *player's*, at
every tier, identically. The only thing a rung changes is `coachIncludesPhysio`, a boolean that is
true for all four hired rungs equally. So there is nothing to "detail": the behaviour does not exist
yet.

Which means the slice necessarily **adds capability to the hired tiers** rather than redistributing
it. An Elite coach who manages load well is new, and fewer lost weeks means more tournaments played,
which means points, which means rank, which means reach and entries and money. That chain is exactly
the one the bench measures.

**And the movement IS the feature.** If a hired career's numbers do not move, the coach's automation
is merely reproducing the average of what players already do, and the slice has built nothing worth
buying. So the measurement is not a safety check on a neutral change — it is the proof that the
change happened at all. Every rank-denominated number was re-tuned this week; expect to revisit
`developmentFactor` LAST, and only if weeks-lost turns out not to carry the coach's value on its
own.

## 5. The measurement that makes the purchase legible

The number I promised the owner, and the one this slice lives or dies on:

> **Weeks lost, per coach rung** — to injury layoff, to a knock rested, to a tournament entered too
> tired to win. Before and after, 120 seeds, both policy arms.

If the table reads "self-coached loses 14 weeks a career, Budget 10, Elite 4", the purchase has an
honest price and the sentence writes itself. If the spread is two weeks, this design has failed and
the multiplier was the wrong lever after all — and that is a real outcome to report, not a failure to
hide.

Second measurement, because (a) is the risk that matters: **a well-managed self-coached career
against a badly-managed Elite one.** The first should beat the second. It should not beat a
well-managed Elite one.

## 6. Not in this slice

- No change to `potential`. A great coach does not raise her ceiling — he gets her closer to it
  sooner. Letting him touch the ceiling would also make the radar's fog decorative, which is the one
  thing that design cannot survive.
- No new `developmentFactor` values. If load management works, the multiplier ladder should be left
  exactly where it is and the coach's value should come from weeks, not points.
- No AI coach for the rivals. The cohort does not model load at all and giving it one is a different
  slice.

---

## 7. The baseline, measured — and the premise holds

Added at the start of implementation, because §5 asks for "before and after" and there was no before.
`npm run bench:load` (new, `tools/load-bench.ts`), 120 paired seeds × 208 weeks, 14→18. The rung is
**not** in the seed, so every rung faces the same calendar, cohort and girl.

**Grinder arm — 85/15, pushes every knock, enters everything:**

| rung | layoff | wasted trips | **weeks lost** | % of career | injuries | matches |
| --- | --- | --- | --- | --- | --- | --- |
| self | 51.8 | 14.8 | **66.6** | 32.0% | 14.7 | 75.3 |
| budget | 39.2 | 11.4 | **50.5** | 24.3% | 12.2 | 103.3 |
| middle | 38.6 | 11.4 | **50.0** | 24.0% | 12.0 | 103.7 |
| high | 39.1 | 11.9 | **51.1** | 24.5% | 12.1 | 103.9 |

**Player arm — 75/25, rests every knock, heeds the fatigue caution:**

| rung | layoff | rested | wasted | **weeks lost** | % | injuries | matches | **rank** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| self | 38.0 | 26.9 | 1.3 | **66.2** | 31.8% | 10.9 | 99.2 | 103.7 |
| budget | 28.1 | 26.0 | 3.1 | **57.2** | 27.5% | 8.8 | 125.2 | **85.2** |
| middle | 27.5 | 26.0 | 3.4 | **56.8** | 27.3% | 8.6 | 125.3 | 85.9 |
| high | 27.8 | 26.1 | 3.3 | **57.2** | 27.5% | 8.6 | 125.3 | 85.9 |
| elite | 28.5 | 26.3 | 3.6 | **58.3** | 28.0% | 8.9 | 125.5 | 85.9 |

`budget → elite` = **−1.1 weeks**, the same figure to the decimal as the grinder arm. Both arms
independently produce the same flat, faintly backwards ladder.

**§4(c) is confirmed, and harder than it was stated:**

- `self → budget` = **16 weeks**. The whole ladder's load value, and it is one boolean —
  `coachIncludesPhysio`.
- `budget → high` = **0.6 weeks**, across three rungs and roughly **$100k** of fees. That is noise.
  The four hired rungs are, for load purposes, the same coach.

So there is nothing to redistribute and the slice is additive, exactly as the spec argued. It also
sets the target: a rung ladder worth buying has to open a gap in a range where **16 weeks** is what
one boolean already buys, so a 2-week spread across four rungs would be indistinguishable from what
ships today.

**One interaction the "after" table must be read against.** Wasted trips *fall* as the rung improves
(14.8 → 11.4), which looks backwards until you see why: a self-coached girl loses 51.8 weeks to
injury, so she has fewer weeks in which to enter anything. Fewer trips, fewer wasted ones. Weeks-lost
and trips-wasted are **not independent**, and a change that adds available weeks will add wasted trips
unless the coach is also warning her off them.

### ⚠ 7a. And §5's headline metric turns out to be necessary but not sufficient

Put the two arms side by side at the top of the ladder and the problem is unmissable:

| | weeks lost | composition | matches | **rank** |
| --- | --- | --- | --- | --- |
| grinder, budget | 50.5 | 39 layoff · 0 rested · 11 wasted | 103.3 | 105.7 |
| player, budget | 57.2 | 28 layoff · 26 rested · 3 wasted | 125.2 | **85.2** |

**The player arm loses MORE weeks and finishes 20 rank places higher.** So "weeks lost" is not a
quantity to be minimised — the 26.9 rested weeks are a *purchase*, not a loss, and lumping them in one
total with layoff weeks hides exactly the decision the slice is about. A layoff week is taken from her;
a rested week is spent by him, and it buys 10 fewer injuries and 22 more matches.

This is a correction to my own §5, and it matters because the after-table would otherwise be read
backwards: a coach who correctly rests more knocks will *increase* weeks-lost as measured, and look like
a regression. So the measurement the slice is judged on becomes:

1. **layoff weeks** — down. This is the number that is unambiguously a loss.
2. **wasted trips** — down, per available week (not absolute — see the interaction above).
3. **rested weeks** — free to move in either direction; it is the coach's instrument, not his score.
4. **rank at 18, and matches played** — the outcome the other three are only proxies for. If rank does
   not move, nothing that matters happened.

The player-vs-grinder gap also sets an honest ceiling on what the automation can be worth: **~20 rank
places is what disciplined load management already buys** a player who makes the calls himself. A hired
coach reproducing that for someone who does not want to make them is a real product; a hired coach
beating it would mean the rung is doing something a human player cannot, which is the dominant strategy
in reverse and just as wrong.

## 8. The mechanism: the coach decides through his own read of her

The one design decision §3 left open — "quality by rung" needs a *mechanism*, and there are only two
honest candidates.

**Rejected: a hidden oracle.** The injury roll is deterministic given the seed, so a coach could be
made to know whether pushing this knock *actually* leads to an injury and be right N% of the time by
rung. This is the obvious implementation and it must not ship: it is foreknowledge, it makes the rung
a dice-loader rather than a judgement, and no in-world story explains it.

**Chosen: he decides on the facts he can see, and the fog is how much he can see.** The radar already
models exactly this and it is already measured — a self-coached career ends at fog band **3.7**, an
Elite one at **0.2**, an eighteen-fold difference in how well anyone knows this girl. So:

- the load decision is a rule over **observable state** — condition, the knock's part and whether it
  is a repeat, weeks of consecutive play, the tier's own condition floor. No foresight, no new roll.
- what the rung changes is the **precision of the inputs**: the coach reads her through
  `axisReadings`' confidence, so a Budget coach is deciding about a girl he has a blurry read of and an
  Elite coach about one he knows. Same rule, different clarity.

Three things fall out of this, and they are why it is the right choice rather than merely a defensible
one:

1. **It reuses a measured system instead of adding an unmeasured one.** No new balance surface.
2. **It answers risk (a) without a cap.** The self-coaching parent gets the same rule and the worst
   read in the game — 3.7 against 0.2. He is not forbidden from being Richard Williams; he is just
   the one making calls in the dark, which is the true asymmetry and the owner's own point.
3. **It makes the fog load-bearing.** §6 already refuses to let the coach touch `potential` because
   that would make the fog decorative. This is the same argument from the other side: the fog now
   *does* something on a week nobody is looking at the radar.

---

## 9. What shipped, and what it measures — the "after"

`npm run bench:load`, 120 paired seeds × 208 weeks, raw runs archived as
`docs/specs/load-baseline-2026-07-30.txt` (before) and `docs/specs/load-after-2026-07-30.txt` (after).

**Player arm — 75/25, rests every knock, heeds the caution:**

| rung | layoff | rested | wasted | injuries | **taps** | matches | rank |
| --- | --- | --- | --- | --- | --- | --- | --- |
| self | 37.7 | 26.9 | 1.4 | 10.9 | **14.2** | 99.4 | 103.8 |
| budget | 28.3 | 20.8 | 3.1 | 8.9 | **6.5** | 124.6 | 87.7 |
| middle | 26.6 | 20.5 | 3.1 | 8.7 | **4.6** | 124.3 | 86.1 |
| high | 26.1 | 20.4 | 3.3 | 8.4 | **3.1** | 124.4 | 89.0 |
| elite | 23.4 | 19.9 | 3.4 | 8.2 | **1.8** | 126.0 | 86.1 |

**Three columns are now monotone ladders across all four hired rungs** — layoff weeks (28.3 → 23.4),
injuries (8.9 → 8.2) and interruptions (6.5 → 1.8, a 3.6× spread). `budget → elite` is **5.3 weeks**
against the baseline's **−0.1**. §5's question is answered: the purchase has an honest price.

**And a listener — the parent who believes the coach's line on the card — gets the biggest number in
the wave:** wasted trips fall **10.2 → 2.8**, and `self → elite` is **33.3 weeks** of a 208-week career.
Advice is worth nothing until it is followed, which is why that arm had to exist.

### ⚠ 9a. What did NOT move, stated plainly

**Rank does not separate the hired rungs** (87.7 / 86.1 / 89.0 / 86.1 — flat and non-monotone), and it
will not, for a reason that is structural rather than a tuning miss:

- rank is won by **skill**, and skill is driven by `developmentFactor`, which §6 forbade this slice from
  touching;
- the load ladder buys **availability**, and 5 extra weeks convert to only ~1.4 more matches.

So the top of the ladder is sold on **her health and your time**, not on ranking. That is defensible —
arguably it is the truer product — but it is not what a player will assume, and it is the one thing to
watch in playtest. If the owner wants the rungs to differ in *results*, the honest lever is
`developmentFactor`, and §6 should be reopened deliberately rather than drifted into.

**The fog builds the attention ladder, not the outcome one.** §8's mechanism produced the monotone tap
spread and, on its own, nothing else — a ±12-point misread on a binary decision taken 13 times a career
cannot move a 208-week outcome. The outcome ladder came from `physioQuality` instead: the boolean §4(c)
complained about, made into a rung. §8 is still the right mechanism for *who decides and how often*; it
was the wrong one for *how well it turns out*, and I built it before noticing the difference.
