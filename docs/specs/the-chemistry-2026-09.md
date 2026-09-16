---
type: spec
status: draft
area: simulation-and-balance
canonical: false
last-reviewed: 2026-09-16
---

# Chemistry – the coach relationship as a trajectory (round 42 #50, #51, #52)

The owner, 16.09, in three messages that each improved on the last:

> «химия между ребёнком и тренером, а не просто стиль-метч»
> → «может как-то от её темперамента исходя, кстати, у нас их 4 разных»
> → ⭐ «эта самая химия может как-то нарабатываться с разной динамикой – это может стать показателем,
> насколько ей комфортно с тренером»

and then the sharpening that fixes the first architect proposal:

> «самый дешёвый тренер может стать идеальным метчем и дать конкуренцию элитному, но это такое же
> редкое событие, как и prodigy девочка. Вот это я хочу показать.»

and the thing it buys:

> «может быть у неё будет за 3 года 100% метч с бюджетным тренером и он ей будет давать похожий буст
> на high/elite тир вообще»

**What this document is.** The buildable form of that design, plus the two items he grouped with it:
the raise basket (#51) and the card marker (#52). Nothing here is built. It ends in numbered open
questions with recommendations, the way
[the-form-and-the-sparring-2026-09](the-form-and-the-sparring-2026-09.md) §9 did, so he can rule the
wave in one pass.

---

## 0. ⭐⭐ THE FINDING THAT CHANGES THE ANSWER TO HIS OWN WISH

**A cheap coach who suits her ALREADY out-develops an expensive one who does not. The game has
shipped that since round 2 and never told a story about it.** `coachFactor` is one line
(`src/engine/coach.ts:446`):

    ECONOMY.coach.developmentFactor[tier] * ECONOMY.coach.fitFactor[fit]

with `developmentFactor = { self: 0.82, budget: 0.95, middle: 1.04, high: 1.11, elite: 1.15 }` and
`fitFactor = { great: 1.25, good: 1.00, off: 0.75 }`.

| pairing | arithmetic | factor |
| --- | --- | ---: |
| **budget coach, great style fit** | 0.95 × 1.25 | **1.1875** |
| elite coach, good fit | 1.15 × 1.00 | 1.15 |
| elite coach, wrong fit | 1.15 × 0.75 | 0.8625 |

**The whole tier ladder spans 21% (0.95 → 1.15). The fit pill spans 50% (0.75 → 1.25).** So the
budget coach who suits her already beats the elite coach who merely costs money, by a clear margin,
and has done for a year.

⚠ **So his wish does not require breaking the money lever – it requires making an existing truth
LEGIBLE.** Today «fit» is a static pill dealt at the moment of hire: the same pairing reads the same
in every career, forever, and the player looks it up rather than discovers it. Chemistry is the same
truth as a **trajectory** – earned over seasons, different for the same two people in different
careers, and visible as a rate rather than a label. That reframing is what the wave is for, and it is
why the effect below can be modest and still deliver what he asked for.

---

## 1. The number

**`chemistry`: 0–100, per PAIR (her and one coach), persisted, accrued weekly while that coach is
hired.** Not a snapshot, not a roll at hire: a number with a history, which is the whole point.

**Accrual.** One weekly step, no draws:

    chemistry += ratePerYear / 52        (while hired, clamped to [0, 100])

`ratePerYear` is fixed for the pair the first time they work together and never moves again – see §2.
So the rate IS the relationship and the level is only its integral, which is exactly his
«показатель, насколько ей комфортно с тренером».

⚠ **It does not decay while he is hired and it does not decay while he is not** – see §5.

---

## 2. The rate – a DRAW, not a lookup

His sharpening is the design rule: «такое же редкое событие, как и prodigy девочка». A flat
(temperament × manner) table would make «the cheap coach who clicks» true for the same pairing in
every career – a strategy guide entry, not a story. So:

1. **The (temperament × manner) cell sets the CENTRE** of the rate.
2. **A seeded draw sets the pair's own number** around that centre:
   `rngFromSeed(`${seed}:chemistry:${coachId}`)` – purpose-scoped, re-derived at the call site,
   persisting nothing but the resulting rate.

**The bands, his numbers** («3-5-7% в год… а если 10-15 – то лучше, а если больше – вообще хорошо»):

| band | rate/yr | what it means | reads as |
| --- | ---: | --- | --- |
| ordinary | **3–7%** | 14–33 seasons to 100 – she never gets there | «she is polite with him and nothing more» |
| good | **10–15%** | 7–10 seasons – a long career reaches it | «they are finding each other» |
| ⭐ the click | **30–35%** | **3 seasons to 100 – his own number** | the Borg/Bergelin pair |

⚠ **The top band is set by his own sentence and not chosen: «за 3 года 100%» is 33%/yr.** That is
what makes the click worth chasing and what makes it rare.

**Rarity is calibrated to the prodigy draw rather than picked.** `rollPotential`'s [4, 26] band is the
yardstick he named; the bench (§9) sets the click's tail frequency to the same ORDER as a maximal
potential roll, so «as rare as a prodigy» is measured rather than asserted.

### 2a. The manner – a new fact about the coach, orthogonal to his style

Her four temperaments already exist and are already on the tile (round 42 #6/#37), and they have a
clean 2×2 shape: **open/private × intense/steady** (`fiery` = open+intense, `deep` = private+intense,
`quiet` = private+steady, `sunny` = open+steady).

So the coach gets a **manner**, on his own 2×2: **how hard he pushes** (hot/cool) × **what he talks
to** (the person / the technique).

| manner | axes | one line |
| --- | --- | --- |
| **demanding** | hot · person | the standard is the message, and it does not move |
| **warm** | cool · person | the girl first, the forehand second |
| **analytical** | cool · technique | the video, the numbers, the third ball |
| **driving** | hot · technique | rep after rep until the pattern is hers |

⚠ **`manner` is NOT `style`, and the spec insists on the difference.** `style` is the game he PLAYED
and it feeds the match-day edge; `manner` is how he WORKS and it feeds development. Two facts, two
jobs, no overlap (§4).

⚠ **The 4×4 centre table is a PROPOSAL and is C1 below.** The principle behind it: a pair matches on
one axis and complements on the other. Two intense people burn; two steady people drift; the pair
that shares a language and differs in temperature is the one that lasts. **That is a design claim, it
is not measured, and it is the one thing in this document the owner should overrule freely.**

---

## 3. The one reader – development, and one tier is the ceiling

**Chemistry raises the effective development factor from the coach's own tier toward the NEXT tier's,
in proportion:**

    effectiveDev = devFactor[tier] + (devFactor[nextTier] - devFactor[tier]) * (chemistry / 100)

and `coachFactor` then multiplies by `fitFactor[fit]` exactly as it does today. **One line changes.**

**What that buys, in his own case – a budget coach at 100%:**

| pairing | arithmetic | factor | against |
| --- | --- | ---: | --- |
| budget, 0% chemistry, great fit | 0.95 × 1.25 | 1.1875 | – |
| **budget, 100% chemistry, great fit** | 1.04 × 1.25 | **1.30** | beats elite+good (1.15) by 13% |
| elite, good fit | 1.15 × 1.00 | 1.15 | – |
| elite, 100% chemistry, great fit | 1.19 × 1.25 | 1.4875 | still the top of the game |

⭐ **This is his «похожий буст на high/elite» delivered, and money still matters.** A budget coach she
clicks with and who suits her game lands at **1.30** – above every elite pairing except an elite who
also clicks and also suits her. The right cheap coach beats the wrong expensive one; the right
expensive one still wins. Borg/Bergelin, not «hire anyone and wait».

⚠ **Why the ceiling is one tier and not two.** Two tiers puts a budget coach at 1.11 × 1.25 = 1.39,
within 7% of the best pairing in the game at a fifth of the price – and at that point the coach
economy is a formality. ⭐ And it is not needed: §0's arithmetic shows the fit pill already carries
most of the distance, so one tier is enough to make the story true.

⚠ `self` (no coach) has no pair and no chemistry. The ladder's top rung, `elite`, takes
`devFactor.elite + (1.19 - 1.15) × chemistry/100` – C2 asks whether the top rung should accrue at all.

---

## 4. The fences – what chemistry must never touch

1. **STYLE keeps the match-day edge; CHEMISTRY takes development.** His own 16.09 approval («стиль
   нам не важен на элитных… может его вообще опустить?» → answered: it does not need dropping, it
   needs the job where it still matters). `coachEdgePp` and `styleFitBetween` are untouched here.
   ⚠ Two axes, two readers, and neither may read the other's number.
2. **Chemistry never touches money.** Not the retainer, not the band, not the share. A coach who
   clicks does not get cheaper, and #51's raise basket reads results rather than affection.
3. **Chemistry is not a second `fitFactor`.** It moves `devFactor`, which is the TIER's number, and
   the fit pill keeps its own span untouched. Both multiply once, as today.
4. **Zero draws on MAIN.** One purpose-scoped sub-stream, `seed:chemistry:<coachId>`, read at the
   call site. The pair's rate is a pure function of (seed, coachId), so a load reproduces it.
5. **It is READ, never printed as a number** – §6.

---

## 5. Leaving, and coming back

**Leaving resets nothing; it pauses.** The pair keeps both its rate and its accrued level; hiring the
same coach again resumes from where it stopped.

> His own words, which is why this is not an architect's flourish: «"вернуться к её первому тренеру" –
> вот именно об этом я и говорю.»

⚠ **And the pause is genuinely a pause, not slow decay.** A decaying number would make firing a good
coach a permanent punishment and turn the mechanic into a loyalty tax; the design is that going BACK
is a real move, which needs the number to still be there. C3 asks whether a very long absence should
cost anything at all; the recommendation is no.

---

## 6. The marker on the card (#52)

His design, with the icon handed over:

> «наш уменьшенный гаудж (как на строящихся объектах), в правый нижний угол карточки, а над ним
> жёлтую иконку химии» … «цену и Hire поднять в правый верхний угол, тогда освободится низ»

* **The gauge already exists at his size.** `ui/ProgressRing.vue` ships a **36px** variant whose own
  doc line is «чуть меньше размером, чем на главной» – his words from round 41 #28. The marker is that
  component, bottom-right, with the chemistry mark above it in `--accent`.
* **The icon** he handed over is kept at `docs/assets/chemistry-icon-source.svg` – a flask, 32-unit
  viewBox, single path, so it inlines like the rest of our marks rather than shipping as an `<img>`.
* **The card is re-laid first:** price and Hire move to the top-right, which is what frees the bottom
  on every card. That is his instruction and it is a prerequisite, not a nicety.
* **Worked-with coaches carry the gauge. The rest carry a question mark**, not a forecast band.
  ⭐ The reason is his own design one message earlier: the rate is a SEEDED DRAW, so a predicted
  corridor would either lie or leak the draw. A question mark is the honest glyph for «nobody knows
  until you work together», and it is the mechanic's own advertisement.
* **No percentage anywhere.** A number on screen is a slider; the coach's seasonal sentence is the
  instrument this game already has. Copy his, as ever – the wave ships DRAFT lines for the three
  bands and he rules them.

---

## 7. The raise basket (#51)

> «может такое быть, что всего с 1 титулом в сезон (например w250/w500) тренер будет требовать 15%?
> Кажется, что самого факта этого единственного титула маловато, нужна какая-то общая оценка
> прогресса»

He is right: today the ask reads one fact. It should read a **progress score**, and every component
is already in the world:

| component | why it belongs | where it lives today |
| --- | --- | --- |
| **rank movement over the year** | what the market itself prices | the ranking history |
| **realised development** – the share of her remaining headroom she actually took | literally the coach's job | `skills` vs `potential` at both ends of the year |
| **titles weighted by tier** | a component, not the trigger | the season's results |
| ⭐ **the residual against expectation** (after F1) | a coach who got more out of her than the odds said should ask for more | F1's results channel |

Corridor **5–15%** (his), ceiling = the rank band (#49a), refusal = he works out the season.

⚠ **The fourth component is the best one and it needs F1**, so #51 can ship on three components and
gain the fourth later, or wait. C4.

---

## 8. Schema and RNG

**v79, and chemistry is not its only customer** – `sparringTravels` (#48) has been waiting since his
15.09 travel override. One bump, two customers.

| key | shape | migration literal |
| --- | --- | --- |
| `coachChemistry` | `Record<coachId, number>` – accrued level per pair | `{}` – «she has worked with nobody» |
| `sparringTravels` | `boolean` (#48) | `false` |

⚠ **`{}` is exactly true and not a placeholder.** A career that predates the mechanic accrued nothing
with anybody, because there was nothing to accrue. The RATE is not persisted at all: it is a pure
function of `(seed, coachId)` and re-derived, so it cannot drift out of step with a save.

**RNG:** one sub-stream, `rngFromSeed(`${seed}:chemistry:${coachId}`)`, never MAIN. Input-independence
holds by construction – the draw is keyed on the coach's identity and not on when or whether the
player hired him.

---

## 9. The benches, predicted-first (invariant 5)

| # | claim | predicted, written before the run |
| --- | --- | --- |
| B1 | the click's frequency against the prodigy yardstick | tuned to the same ORDER as a maximal `rollPotential` roll – target 1 career in 12–20 sees one click with a coach she actually hires |
| B2 | end-of-career skill, budget+click against elite+good | **+4 to +8 skill points**, i.e. visible but not a re-cut ladder |
| B3 | does money stop mattering? median end rank by coach budget | the elite-hiring corridor stays **ahead** at every background; if it inverts, the ceiling is wrong |
| B4 | time to 90% of ceiling (round 42 #38's clock) | the click moves it **1.5–3 years** earlier; anything past 4 says the effect is too big |
| B5 | the loyalty cost | a player who never switches should not beat a player who switches well by more than **2 skill points** on the median |

⚠ **B3 is the one that can veto the wave**, and it must be run on round 42 #38's own corpus so the
two clocks agree.

---

## 10. Waves, sized

| wave | ships | size |
| --- | --- | --- |
| **C1** | `manner` on the roster, the rate draw, `coachChemistry` + v79, the one `coachFactor` line, the benches | **M** |
| **C2** | the card re-lay (price/Hire to the top-right), the 36px gauge + icon, the question mark, the coach's three seasonal lines | **S–M** |
| **C3** | the raise basket (#51) – three components now, the fourth when F1 lands | **S–M** |

⚠ Order against the other open waves: **#34 (done) → F1 → chemistry → F2**. Chemistry does not depend
on F1 mechanically; it is placed after it because #51's best component comes from F1's results
channel, and because two schema waves in flight at once is how an append-only migration gets edited.

---

## 11. Open questions for the owner – each with a recommendation

| # | question | recommendation |
| --- | --- | --- |
| **C1** | the 4×4 (temperament × manner) centre table, and its principle («match on one axis, complement on the other») | **his to overrule freely** – it is the one unmeasured design claim here. Build the table as a data object so it is one edit, not a refactor |
| **C2** | does the `elite` rung accrue chemistry at all, given it has no next tier? | **yes, at a token +0.04** – a flat zero would say the best coach cannot grow closer to her, which reads wrong; the number stays small because the rung is already the top |
| **C3** | does a long absence cost accrued chemistry? | **no** – decay turns «go back to her first coach» into a punishment, and he named that move as the thing he wants |
| **C4** | does #51 ship on three components now, or wait for F1's fourth? | **ship on three** – the ask is wrong TODAY, and the fourth component slots in without re-shaping the other three |
| **C5** | the click's rate, 30–35%/yr | **his own «за 3 года 100%» = 33%** – recommend taking it literally and letting B1 tune only the FREQUENCY, not the size |
| **C6** | is chemistry visible on the coach's seasonal line from season one, or only once a band is clear? | **once clear** – a sentence in week 3 about a relationship is noise; recommend the line appears at the first season end |
| **C7** | do rival girls carry chemistry with their coaches? | **no, not ever** – it is a development modifier for a career the player steers, and the rival cohort has no coach model to hang it on |

**Done when:** C1–C7 are ruled, B1–B5's corridors are accepted, and the builder brief for C1 points
here.
