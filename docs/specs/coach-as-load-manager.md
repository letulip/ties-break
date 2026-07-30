# The coach's real job — and the parent who has to do it himself

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

**(a) Self-management must not beat a paid coach.** If a patient player can out-manage Elite, the
coach ladder we spent two rounds making monotone becomes a trap again. The answer is true to life:
**a parent cannot be at every session.** His best possible management should top out somewhere
around Middle and never reach Elite — not because he is worse at deciding, but because he is not
there. Cap it explicitly and pin the cap.

**(b) It must not become a spreadsheet.** Weekly load sliders are exactly the chore the story screen
was designed to avoid. It has to be **a few decisions with consequences**, in the shape the knock
already proved: the week stops, asks one thing, and the bill is visible. Not a continuous optimum.

**(c) It moves balance for the third time this week.** Every rank-denominated number was just
re-tuned. This will move survival, reach and the coach ladder's monotonicity. That is a cost, not a
blocker — but it means the slice is not done until it is measured.

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
