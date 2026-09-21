---
type: research
status: current
area: season
canonical: false
last-reviewed: 2026-09-21
---

# The unclosable head – can a career reach the top of our own table, and what would it take?

Compiled 21.09.2026, wave 8b T7, on his ask at the wave-8 review: **«Алисину руку тоже давай»**.
Instrument: `tools/probe-favorite-curve.ts`, arms 3 and 4 (EXTENDED, not forked – the staircase
research's own arms 1 and 2 are untouched above them). Zero MAIN draws and zero ticks: no world is
created by either new arm.

⚠⚠ **THIS IS MEASUREMENT ONLY AND NO CONSTANT MOVED** – the wave-8b brief's §2 T7, verbatim: «T7 is
measurement ONLY – no constant moves on any Alice-arm finding; the numbers come back.» §5 names the
levers and leaves every one of them standing.

## 0. The headline

1. **The head is out of reach for four careers in five, at birth, before a week is played.**
   `rollPotential` is the ceiling and it is rolled once off `seed:potential`; its median overall(4)
   is **63.3**, and the `tourElite` floor is **67**. **19.1%** of careers can EVER clear 67.
   **5.8%** can clear 70. **0.0%** clear 77.
2. **Zero titles in an 82-12 season at #7 is the arithmetic, not a defect.** At his specimen's
   overall(4) of 65.1 the closed form gives a title chance of **0.0008 per 64-draw** – about **0.02
   titles in a twenty-event season**. His measured one-title-in-six-seasons is ABOVE that line, not
   below it.
3. **The four voices are treated identically**, measured at 20,000 seeds: every bar sits inside the
   ±1.5 pp corridor, and the mechanism says why before the number does.
4. **The AI-vs-AI bracket resolves by a PROBABILISTIC draw, not argmax** – read and cited in §4, so
   the head of the table is decided by the same curve her own matches are.
5. ⭐ So the specimen's «сдулась at 24» is two different facts wearing one sentence: her `declineFactor`
   really is **0.0000** (nothing had decayed), and the head was never inside her reach. **What looks
   like a fade is a ceiling.**

## 1. The owner's specimen, quoted and not re-derived

Read once through `tools/fade-read.ts` (`decodeExportFile`, nothing of the save copied anywhere).
Carried here as the anchor every number below is answered against:

| | |
| --- | --- |
| overall(4) | **65.1** at WTA **#7** |
| what the table expects at that chair | `coreForStanding(#7)` = **67.4** |
| her best season | S9, **82-12**, **9,064 points**, ⚠ **0 titles** |
| titles, nineteen to twenty-four | **1 in six seasons** |
| `declineFactor` at her age | **0.0000** – nothing had decayed |
| staff | masseur **and** psychologist, both hired |

⚠ **The save was not re-read for this document.** The instrument that produced these lines had a
defect of its own, found by `npm run check:tools` while this wave opened and fixed in its own commit:
`fade-read.ts` cast `knockHistory` to `{ week: number }[]` and `KnockRecord` has no `week`, so the
knocks line printed «0 in the last two years» for every save ever handed to it. **No figure in the
table above came from that line.**

## 2. The ceiling a career is born with – 20,000 seeds

`rollPotential(seed, startingSkills(seed))` is her ceiling: rolled once at birth off
`seed:potential`, never movable by any plan, coach or academy (`engine/radar.ts`' own sentence).
overall(4) is serve / ret / composure / stamina – the four `coreForStanding` is built on;
`groundstrokes` is the style's wing and is no part of the professional table.

| temperament | n | median | max | ≥ 67 | ≥ 70 | ≥ 77 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `sunny` | 4,968 | 63.3 | 76.8 | 19.7% | 5.9% | 0.0% |
| `fiery` | 5,026 | 63.2 | 76.6 | 18.8% | 5.8% | 0.0% |
| `quiet` | 4,937 | 63.4 | 77.5 | 19.5% | 5.7% | 0.0% |
| `deep` | 5,069 | 63.2 | 77.8 | 18.5% | 5.9% | 0.0% |
| **all** | **20,000** | **63.3** | **77.8** | **19.1%** | **5.8%** | **0.0%** |

The bars are the game's own: **67** is the `tourElite` floor (`FIELD.tiers`), **77** the top of that
band, and `SKILL_LAW.top` – the world #1's core – is **76.4**.

⭐ **THE MEDIAN CAREER'S CEILING IS BELOW THE TOP STOREY'S FLOOR.** Not below the world #1, below the
ENTRANCE: the median girl cannot, at her theoretical best, be a member of the band the top 64 players
are drawn from. That is the finding, and it is about the DRAW rather than about the ramp – a career
that cannot reach 67 in principle cannot be argued there by any amount of play.

⚠ **It is a ceiling and not an outcome.** Reaching it takes a whole career of growth; the shares above
are an upper bound on who could ever be in the conversation, not a forecast of who will be.

### 2.1 ⚠ Fairness, and the sample size the corridor actually needs

Every bar is **inside** the ±1.5 pp corridor: spreads of **1.16 / 0.25 / 0.04 pp** at 67 / 70 / 77.

⚠⚠ **AND THE FIRST RUN SAID OTHERWISE, WHICH IS WHY THE SIZE IS IN THE INSTRUMENT'S OWN NOTE.** At the
brief's «≥4000» the four voices hold ~1,000 each; a share near 19% then carries a standard error of
`sqrt(0.19 × 0.81 / 1000)` = **1.24 pp**, so a 1.5 pp corridor is INSIDE the noise and cannot conclude
anything. Measured at 4,000 the spread came out **1.78 pp** and would have READ as unfair. At 20,000
the standard error is 0.56 pp and the corridor means what it says. The arm prints the standard error
beside the spread from now on, so nobody has to take the verdict on trust.

⚠ **And the mechanism says the answer before the number does**: the ceiling is drawn on
`seed:potential` and the temperament on `seed:temperament` – two independent purpose-scoped
sub-streams – so the four shares are four samples of ONE distribution and anything but a tie is
sampling noise by construction. The arm exists to state that with a measurement rather than by
reading the code.

## 3. The title expectation at the head, closed form

A title is six consecutive wins in a 64-draw. Against a field drawn from the top storey's own band
(`FIELD.tiers.tourElite`, core 67–77 over 64 players), her per-match chance is the game's own Elo
form at the gap – `SKILL_LAW.eloPerCore` per core point, **by import** – so the per-event title chance
is the product over the six rounds:

| her overall(4) | p(beat the top of the band) | p(title, 64-draw) | titles / 20 events |
| ---: | ---: | ---: | ---: |
| **65.1** (his specimen) | 0.200 | **0.0008** | **0.02** |
| 67.4 (what #7 expects) | 0.247 | 0.0023 | 0.05 |
| 70.0 | 0.307 | 0.0067 | 0.13 |
| 73.0 | 0.386 | 0.0195 | 0.39 |
| 76.4 (`SKILL_LAW.top`) | 0.483 | 0.0535 | **1.07** |

⭐⭐⭐ **SO 0 TITLES IN AN 82-12 SEASON IS NOT A DEFECT – IT IS WHAT THE TABLE PREDICTS, BY A FACTOR OF
FIFTY.** At 65.1 the expectation is one title every **forty-odd seasons**. His measured **1 title in
six seasons** (≈0.17 a year) is ABOVE the closed form for her build; she over-performed it, which is
the opposite of the complaint the arm was asked to check.

⚠ **It is an upper bound on her side of the draw**, and the document says so rather than leaving it
to be found: the opponents get stronger each round in a seeded bracket and this uses the band's own
spread rather than modelling the seeding, so the true number is at or below every line above.

⭐ **And this is his own calibration working as he ruled it.** The live-list fit of 2026-08
deliberately killed 1990s dominance – «нам не нужно доминирования, как в 90х», #1 beats #10 only 78%
– so a thin title count at the head is that decision arriving, not a regression. What is NEW here is
that the same arithmetic reaches a long way DOWN the table: at 65.1 it is not thin, it is nearly zero.

## 4. ⚠ The bracket resolves by a draw, not by argmax – verified

`src/engine/season/tournament.ts:1055-1056`, the non-kid arm of `playMatch`:

```ts
const p = fastMatchProbability(a, b, { surface: event.surface, tour: JUNIOR_TOUR, seed: '' })
const aWins = rng() < p
```

The stronger AI player wins **with probability p** and never by construction. So the head of the
merged table turns over on the same curve her own matches are decided by, and «the same four names
win everything» is not a mechanism this build has. ⚠ Her own matches take the FULL engine
(`simulateMatch`) on the branch above it; the closed form is the AI-vs-AI shortcut, and §2 of
[the staircase research](the-comeback-staircase-2026-09.md) is where the two were measured against
each other.

## 5. ⭐ The candidate levers – NAMED, and every one of them LEFT STANDING

⚠⚠ **NOT ONE CONSTANT MOVED IN THIS TASK**, and none should move on this document alone: every lever
below is a whole-table decision with a bench of its own, and invariant 5 wants the prediction written
before the number. They are listed so his word has somewhere to land.

1. **`ECONOMY.development.potentialBand` – the ceiling roll itself.** The most direct lever: it is
   what puts the median ceiling at 63.3 against a floor of 67. ⚠ It moves EVERY career, not only the
   gifted ones, and the growth curve, the academy's worth and the whole junior ladder are calibrated
   underneath it.
2. **`FIELD.tiers.tourElite.core` – the bar, rather than the jump.** 67–77 is where the top 64 live.
   Lowering the floor brings the head into reach without touching a single career's ceiling. ⚠ It is
   the table the live WTA Elo list was FITTED to (547 pairs, 2026-08), so moving it re-opens the fit.
3. **The gap between the two.** `coreForStanding(#7)` = 67.4 and his specimen held #7 at 65.1 – the
   TABLE and the RANKING already disagree by two core points about what a #7 is. That gap is neither
   a bug nor a lever on its own; it is the measurement that says levers 1 and 2 are two views of one
   question, and picking either one alone leaves it.
4. **The growth curve's reach, not its ceiling.** Nothing here measures how close a career gets to
   its own ceiling – that is a different arm (walked careers, ceiling against achieved) and it is the
   one this document does NOT run. ⚠ If careers land far below their own ceilings, none of the three
   levers above is the right one and the answer is in `development.ts`.

## 6. ⚠ What this document does NOT answer

* **How close a career gets to its own ceiling.** §5's fourth lever, and it needs walked careers.
* **The middle of the table**, which the staircase research's §4 designed and parked: does her
  measured round depth by Elo gap track the logistic curve the field is built on? That arm was
  designed to run AFTER the staircase landed, and the staircase landed in this same batch (T3) – so
  it is clean to run now and has not been.
* **Whether any of this is a problem.** The numbers say what the model does. Whether a tour where
  four careers in five can never reach the top storey is the game he wants is his call, and it is the
  only question in this document that a measurement cannot answer.
