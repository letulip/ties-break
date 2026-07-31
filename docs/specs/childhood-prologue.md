# The childhood prologue, 6→14 — design note (30.07.2026, pre-code)

The owner asked what we could do with the years before the game starts: «давай поразмышляем над стартом
карьеры, а именно 6-14. Что и как там можем сделать? Геймплей упрощенный? Поездки же раньше 14
начинаются, верно?»

**Nothing here is implemented, and it is deliberately scheduled AFTER the endings** (owner, same
conversation: «финалы, а пролог после них»). This exists so the thinking is not lost. Phase 6 of
`docs/plan.md` is the same feature at one line; this is that line worked out.

---

## 1. The two facts that should be checked before anything is designed

**Trips before 14 already work.** `minAgeYears: 13` sits on exactly three tiers — J30, J60, J300 (the ITF
junior tour, which really is 13+). **Local, Regional and National have no age minimum at all**, so the
domestic ladder is already the pre-14 content, mechanically, today. `src/composables/tierState.ts` even
carries an `'age-locked'` state with the comment "kept wired for the childhood prologue", and the `jun`
portrait band (<11) was reserved for it in July. The groundwork is real.

**⚠ AND THE DEVELOPMENT MODEL DOES NOT EXIST BELOW 13. THIS IS THE FINDING THAT SHAPES THE WHOLE FEATURE.**

`ECONOMY.development.ageCurve.growthStart` is **13**, and `ageFactor` computes
`t = Math.max(0, (ageYears - growthStart) / (growthEnd - growthStart))`. For a seven-year-old that clamp
gives `t = 0`, so `ageFactor` returns `peakRate` — **the maximum junior rate**.

Run a prologue through the existing `growWeek` and she gets **six extra years of growth at the peak** and
arrives at 14 absurdly strong. So:

> **A prologue may not reuse `growWeek` below 13.** Either extend the curve downward deliberately, or —
> better — model 6→13 as a *different process*. "Development" at seven is not the same thing it is at
> seventeen: it is coordination, habit and whether she likes it, not headroom against a ceiling.

This is the same class of error that killed three coach-travel attempts on 30.07 (a mechanism proposed
without checking its magnitude against the numbers it had to move). Check it first this time.

---

## 2. What the prologue is FOR

One sentence: **it should hand the player a girl he made, and teach the game's thesis before the game
starts charging him for it.**

Not a tutorial. Not a stat-allocation screen. The main game's whole claim is that the costs are honest and
they arrive before any breakthrough does — a prologue is where that claim can be *felt* for the first time,
cheaply, with a six-year-old who just likes hitting a ball.

---

## 3. The shape: a year is one screen

**8 years × 52 weeks = 416 weeks — twice the whole main game (208), and nothing happens at seven.** The
weekly loop is the wrong instrument here and would be the feature's death. `docs/plan.md` says
"quarter/year ticks"; **year** is the right grain, and not every year needs a decision.

**Eight cards, and the decisions are the real ones a tennis parent faces — which are not about
tournaments:**

| age | the scene | the decision |
| --- | --- | --- |
| 6–7 | she likes it; a racquet and a group class | does she start at all — the hook, and it is cheap |
| 8 | the club across town, or the municipal court | the first real money: a club is ~3× and it is where the coaches are |
| 9 | the group is full of eight-year-olds | group or one-to-one — the first "what share of our income is this" |
| 10 | there is a Local Open in six weeks | enter her? **This can be REAL — the tier exists and has no age gate** |
| 11 | the sports school takes children at eleven | sports school or ordinary school — **how much childhood we spend**, the truest one |
| 12 | she is tired of it / she wants more | the fork the real world is full of. NOT a menu — a consequence of what you did |
| 13 | the junior tour opens (already true in code) | do you go? the first passport, the first flight, the first real bill |
| 14 | — | the handover into the main game |

---

## 4. What the prologue may move — using only what already exists

- **`startingSkills`** — shifted, using exactly the `relativeAgeHeadStart` pattern: post-draw arithmetic at
  `createWorld`, no schema, no new draw. That pattern shipped on 30.07 and is proven.
- **`fundsCents` at week 0 — the strongest one.** Today the opening reserve is flat per background:
  `STARTING_FUNDS_CENTS` = working $8k / middle $25k / wealthy $120k. A prologue makes that number **yours**
  — what you saved, or what you burned on a club at eight. It also answers a question the game currently
  cannot: *what is this $25,000 and where did it come from?*
- **`playStyle` — earned rather than picked.** It is an onboarding menu today. Let it emerge from what she
  actually practised across the eight years. That **deletes an arbitrary choice** and replaces it with a
  consequence, which is strictly better.
- **The coach rung she arrives with** — whoever you are already paying at 14.
- **Possibly the academy**: a prologue that went well could open the game with a scholarship already on the
  table, which is a much better introduction to that system than discovering it in year two.

## 5. What it must NOT move

**`potential`.** Her ceiling is talent, and what you did at eight does not change it. Let a prologue raise
it and "you made her" quietly becomes "she was always going to be good" — and the radar's fog, which is the
game's whole model of not-knowing, stops meaning anything.

This is the same rule the coach spec's §6 keeps (a great coach gets her closer to her ceiling sooner, never
higher) and the same one task 55 keeps (being born in January must not make her *able to get better*). Three
systems, one rule: **a timing or effort effect must never become a talent effect.**

---

## 6. The one genuinely new system, and it is a risk

**Motivation / burnout.** `docs/plan.md` names it ("morale/relationship effects"), and it is the truest
thing about 6→14: dropout and burnout *are* the story of junior sport. A prologue without it cannot really
have the age-12 fork, because "she wants to stop" has to come from somewhere.

But it is a whole system, and if it exists it should exist for the main game too — a morale number that only
the prologue reads is a prologue-shaped hack.

**Proposal, deliberately small:** the prologue produces **one durable number** — how much she wants this —
and the main game reads it in ONE cheap place at first (a candidate: it shifts the knock's rest/push copy, or
it gates one diary band). Then measure, then decide whether it earns more. It gets its own slice and its own
bench run; it does not get designed by feel.

---

## 7. The argument about priority, including the one against my own advice

The endings come first and the owner agreed: the game still cannot be finished, and a prologue adds a
beginning to a game with no end.

**But the prologue has a stronger case than "a new mode", and it is worth writing down:** the prologue *is*
onboarding, played instead of picked. Today the first ten minutes are six screens of menus — pick a
background, pick a coach, pick a play style. A prologue **replaces** that with something better rather than
adding a system beside it, and it needs no new machinery at all except the motivation number in §6.

So the honest framing of the choice is not "endings or prologue". It is **"finish the game, or rebuild its
first ten minutes"** — and the second is cheaper than it sounds.

---

## 8. Open questions for the owner, when this comes up

1. **6 or 5?** `docs/plan.md` says 5→14; the owner said 6–14. One card's difference, but it decides whether
   the first scene is "she can hold a racquet" or "she cannot yet".
2. **Is the age-10 Local Open a real tournament** (the engine plays it, with a draw and a result) or a card
   that says what happened? Real is better and costs almost nothing — the tier is already open — but it drags
   the match viewer into the prologue, and that may be more game than a ten-year-old's Sunday deserves.
3. **Can the prologue END the career?** A parent who says "enough" at twelve is the most common real outcome
   in the sport. It would be honest and it would be a very strange thing to ship as the opening ten minutes.
4. **Does the prologue vary the family background, or is background still picked?** If the prologue sets the
   opening reserve, background becomes "where you started" rather than "your difficulty setting" — which is
   better, and is a change to how the game presents difficulty.
