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

**⭐⭐ AND THE GOVERNING RULE OF THE WHOLE WAVE, HIS OWN, 16.09 – EVERYTHING BELOW ANSWERS TO IT:**

> «**Вариативность и неожиданность** – это наши два главных слова, они сделают каждую игру непохожей на
> другую… Но при этом **математика и стабильность** – мы можем воспроизвести все вариации и подтвердить, что
> они возможны.»

That is not a mood; it is a specification, and it has two halves that this document is organised
around. **Variability** means the corners in §1 must actually OCCUR – a career where the entry-level
coach ends up the highest-paid person on the team, and a career where nobody below elite fits her at
all. **Stability** means every one of those corners is reproducible from the seed and its frequency is
MEASURED, so §10's bench does not report a median and call it a design – it names each corner, prints
how often it happens, and hands over a seed that produces it.

**⚠⚠ AND THE FIRST DRAFT OF THIS SPEC FAILED THAT RULE, WHICH IS WHY §3 IS WRITTEN THE WAY IT IS.**
It capped chemistry's reach at one tier above the coach's own, to protect the coach economy. The
owner struck it down on 16.09 and the correction is recorded here rather than quietly applied:

> «я не просил такой потолок, это ты сам придумал… дешевый тренер может вполне стать и элитным,
> особенно если будет просить прибавку регулярно… **у него от успехов спортсменки вполне и его навыки
> тоже могут расти**… Тренер Соболенки её друг, которому просто предложили попробовать, и у Бублика похожая
> история. И это как раз история про химию, а не рейтинг тренера на рынке.»

⭐ **The ceiling is gone, and what replaces it is better than what it was protecting: the coach GROWS
(§4).** A brake that says «this relationship may not go further» is a different thing from a brake that
says «getting there takes a decade and a rare draw», and only the second one tells a story. The
rarity is the gate. The ceiling was a second, redundant brake, and it was mine.

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

## 1. The pairing matrix – what «вариативность» has to mean in a save file

⚠⚠ **THE FIRST DRAFT READ HIS SENTENCE AS AN «EITHER» AND IT WAS AN «AND».** He wrote that in some
tiers there may be no coach who suits her «и по химии и по таланту», and the draft turned that into
«no coach who suits her at all». His correction, 16.09:

> «это было **одновременное условие, а не раздельное**. Т.е. может быть либо химия, либо талант, либо
> химия+талант. А может быть вообще талант+**ПРОТИВОПОЛОЖНАЯ химия**, т.е. у них анти-метч вообще.»

⭐⭐ **THAT LAST CLAUSE ADDS A MECHANIC THE DRAFT DID NOT HAVE: CHEMISTRY GOES NEGATIVE.** Not «slow to
accrue» – actively wrong. The coach who is perfect on paper and cannot work with her is a real
pairing, and it is the one that makes the question mark on an unworked-with card a RISK rather than
merely an unknown.

**So the space is two independent axes and it is a matrix, not a list.** TALENT is what he can do for
her – his tier and how his game reads against hers (`styleFitBetween`, the shipped `fitFactor`).
CHEMISTRY is how the two of them work, drawn per pair.

| | **anti-chemistry** | ordinary (no click) | **the click** |
| --- | --- | --- | --- |
| **wrong talent** | the worst seat in the game – and cheap, which is the trap | an ordinary bad hire | ⭐ they get on and he still cannot teach her game |
| **right talent** | ⭐⭐ **THE ANTI-MATCH** – exactly right on paper, and it does not work | the competent career (the majority) | ⭐⭐ **the jackpot**, and it can start at the bottom rung |

**His corners, restated against that matrix – each one must be a REACHABLE career, and §11's census
must hand over a seed that produces it:**

| corner | his words | what has to be true |
| --- | --- | --- |
| **A · the entry-level coach is the answer** | «самый начальный тренер с хорошей химией обгонит зарплатами всех» | a budget slot lands bottom-right, and **he climbs tiers with her** (§4) until he is paid like the elite he became |
| **B · no tier offers BOTH** | «в других категориях может не быть подходящего и по химии и по таланту» | every affordable coach sits in ONE of the two good cells and never both – the player has to choose which half to buy, which is a real dilemma rather than a shopping list |
| **C · only the top offers both** | «не сложилось ни с кем, кроме элитного или высокого тира, и химия и специализация» | the same, inverted – and the family has to find the money |
| **D · ⭐ THE ANTI-MATCH** | «талант+ПРОТИВОПОЛОЖНАЯ химия» | the best coach she can afford is the WRONG one for her, and the bill says nothing about it – only the seasons do |
| **E · the ordinary career** | (unstated, and it is the majority) | nobody clicks, nobody repels; she is developed by competence |

⚠⚠ **AND TODAY NONE OF THEM CAN HAPPEN, WHICH IS THE ACTUAL DEFECT THIS WAVE FIXES.** Measured in the
source rather than assumed: `buildCoachRoster` (`src/engine/coach.ts:531`) draws from
`rngFromSeed(`${seed}:coaches`)` – **but only the NAMES.** `tier` and `style` are read straight off the
constant `ECONOMY.coach.roster`, so **which tier plays which style is byte-identical in every career
this game has ever run.** The market's SHAPE is a lookup table, and corners B, C and D are literally
impossible: the same budget coach with the same style is on the shelf for every girl ever born.

⭐ **So variability has THREE sources in this wave**, and the first is the cheapest fix in the document:

1. **THE ROSTER** – each slot's `manner` (and see C1a, its `style`) is drawn per career on the
   sub-stream that already exists, `${seed}:coaches`. One new draw on a stream that is already
   purpose-scoped and re-derived at the call site. This is what makes B, C and D possible at all.
2. **THE PAIR** – the signed rate draw of §3, around the (temperament × manner) centre.
3. **THE COACH HIMSELF** – §4, he grows with her results. This is what makes A finish.

---

## 2. The number

**`chemistry`: −100 … +100, per PAIR (her and one coach), persisted, accrued weekly while that coach
is hired, starting at 0.** Not a snapshot, not a roll at hire: a number with a history, which is the
whole point.

⭐ **THE RANGE IS SIGNED BECAUSE OF HIS «ПРОТИВОПОЛОЖНАЯ химия» (§1).** Zero is the neutral working
relationship – two professionals, nothing more – and it is where every pair starts. Positive is the
click; **negative is the anti-match, and it makes her worse off than no relationship at all** (§5).

**Accrual.** One weekly step, no draws:

    chemistry += ratePerYear / 52        (while hired, clamped to [-100, +100])

`ratePerYear` is fixed for the pair the first time they work together and never moves again – see §2.
So the rate IS the relationship and the level is only its integral, which is exactly his
«показатель, насколько ей комфортно с тренером».

⚠ **It does not decay while he is hired and it does not decay while he is not** – see §5.

---

## 3. The rate – a DRAW, not a lookup

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
| ⭐ **the anti-match** | **−10 to −20%** | 5–10 seasons to the floor – it does not need to arrive to hurt | he is not the man for her, and the seasons say so before the bill does |
| ordinary | **3–7%** | 14–33 seasons to 100 – she never gets there | «she is polite with him and nothing more» |
| good | **10–15%** | 7–10 seasons – a long career reaches it | «they are finding each other» |
| ⭐ the click | **30–35%** | **3 seasons to 100 – his own number** | the Borg/Bergelin pair |

⚠ **THE ANTI-MATCH IS DELIBERATELY SLOWER THAN THE CLICK, and the asymmetry is the design.** A click
has to be able to finish inside a career or it is not a story; an anti-match only has to be felt, and
a relationship that collapsed in one season would read as an event rather than as a relationship. C10
asks whether it should be rarer than the click as well as slower; the recommendation is **the same
frequency** – a game where good luck is rare and bad luck is common is not variable, it is punishing.

⚠ **The top band is set by his own sentence and not chosen: «за 3 года 100%» is 33%/yr.** That is
what makes the click worth chasing and what makes it rare.

**Rarity is calibrated to the prodigy draw rather than picked.** `rollPotential`'s [4, 26] band is the
yardstick he named; the bench (§9) sets the click's tail frequency to the same ORDER as a maximal
potential roll, so «as rare as a prodigy» is measured rather than asserted.

### 3a. The manner – a new fact about the coach, orthogonal to his style

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

## 4. ⭐⭐ THE COACH GROWS – his 16.09 addition, and it is what replaces the ceiling

> «у него от успехов спортсменки вполне и его навыки тоже могут расти»

Bergelin did not coach the greatest player of his era because he was the best coach available in
1971. He became that coach **by doing it**. Same for the friend Sabalenka was offered, same for
Bublik's. **A career is a thing that happens to the coach too**, and nothing in this engine has ever
said so: `tier` is dealt at the roster and is a constant for life.

**`standing`: accrued per coach while employed, driven by HER results – and at thresholds his `tier`
rises one rung.** The driver is #9's basket, which is the same basket the raise ask reads, because
«what he achieved with her» is one question and should not have two answers:

* **rank movement over the year** – what the market itself prices;
* **realised development** – the share of her remaining headroom she actually took;
* **titles weighted by tier**.

⚠ **The driver is HER RESULTS, not elapsed time, and that fence is the whole integrity of the
mechanic.** A coach who sits on a plateau does not climb; hiring the cheapest man on the shelf and
waiting ten years buys nothing. The owner named this trap himself one message before the design
(««найми кого угодно и жди» – вот как раз мой поинт был в том, что … это такое же редкое событие»), and
the answer is that BOTH gates are needed: the click has to be drawn AND she has to actually win.

⚠ **His price rises with him, and that is the point rather than the cost.** `coachRetainerBandOf`
already reads HER rank; `tier` is the other half of the quote. So a coach who grew with her is
expensive by the time he is good, which is exactly his sentence – «особенно если будет просить
прибавку регулярно» – and it is how corner A pays for itself instead of breaking the economy.

⚠ **Growth is NOT chemistry and the two must not be collapsed.** Chemistry is how well these two
work together and it is drawn. Standing is how good he has become and it is EARNED. A coach can climb
to elite while the pair stays ordinary – then the family owns an expensive coach and a polite
relationship, which is a real and instructive outcome. C4 asks whether chemistry should give standing
a tailwind; the recommendation is a small one, not a large one.

⚠ **He does not grow while unemployed**, and he does not fall. A coach put down at rung 2 is still at
rung 2 when she comes back – the same rule §7 gives the relationship, for the same reason.

---

## 5. The one reader – development, and the relationship's own reach

**Chemistry raises the effective development factor from the coach's CURRENT tier toward the next
one's, in proportion:**

    effectiveDev = devFactor[tier] + (devFactor[nextTier] - devFactor[tier]) * (chemistry / 100)

and `coachFactor` then multiplies by `fitFactor[fit]` exactly as today. **One line changes.**

⭐⭐ **AND `tier` IS NO LONGER A CONSTANT, WHICH IS THE WHOLE DIFFERENCE FROM THE FIRST DRAFT.** §4
lets it climb. So «one tier» is not a career ceiling any more – it is **what a RELATIONSHIP is worth
on top of what a man can DO**, and the second half is now uncapped. The two compound over a decade:

| season | his tier | chemistry | effectiveDev | × great fit |
| --- | --- | ---: | ---: | ---: |
| hired at 12 | budget | 0 | 0.950 | 1.188 |
| after the click shows | budget | 60 | 1.004 | 1.255 |
| he has climbed once | middle | 85 | **1.100** | **1.375** |
| he has climbed twice, late career | high | 100 | **1.150** | **1.4375** |

**The last row IS the elite pairing, to the third decimal** – an elite coach at 1.15 × 1.25. A budget
coach and a girl who clicked with him arrive at the top of the game together, over a career, and he
is paid like the elite coach he became. That is Bergelin, and nothing caps it.

⚠ **What still bounds it is TIME and the DRAW, which is the right pair of brakes.** Getting there
needs the click (rare by §3), her actual results (§4's gate), and roughly a decade. A player cannot
shortcut it with money, and a player who tries «hire anyone and wait» gets nothing, because neither
gate opens on patience alone.

⚠ **The relationship's own reach stays at one tier, and C2 asks whether even that should go.** The
reason to keep it is that it keeps the two mechanics legible as two – affection and competence are
different things and a player should be able to tell which one is paying. The reason to drop it is
that the rarity gate is already doing the work. **Recommendation: keep it, because §4 removed what it
was actually blocking.**

### 5a. ⭐ Downward – what the anti-match costs

Negative chemistry is **symmetric, toward the tier BELOW**:

    effectiveDev = devFactor[tier] - (devFactor[tier] - devFactor[prevTier]) * (|chemistry| / 100)

| pairing | at 0 | **at −100** |
| --- | ---: | ---: |
| elite coach, great fit | 1.4375 | **1.3875** (he develops her like a `high` coach) |
| middle coach, good fit | 1.040 | **0.950** (like a `budget` coach) |
| budget coach, good fit | 0.950 | **0.820 – like no coach at all** |

⭐ **The bottom-left cell of §1's matrix is therefore a genuinely bad place to be, and it is CHEAP,
which is the trap.** A family that hires the cheapest man on the shelf and draws an anti-match is
paying for coaching that develops her exactly as well as coaching herself would.

⚠ **AND IT MUST BE VISIBLE, OR IT IS A HIDDEN TAX.** The player never sees the number (§8), so the
coach's seasonal line carries it, and it must be unmistakable rather than merely cool – this is the
one place in the wave where the copy is load-bearing rather than decorative. DRAFT lines go to the
owner with the wave; the mechanic does not ship before he has ruled them.

⚠ `self` (no coach) has no pair and no chemistry. `elite` has no next tier: it takes a token `+0.04`
upward (C3) and the full symmetric fall downward, because `high` is a real rung beneath it.

---

## 6. The fences – what chemistry must never touch

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

## 7. Leaving, and coming back

**Leaving resets nothing; it pauses.** The pair keeps both its rate and its accrued level; hiring the
same coach again resumes from where it stopped.

> His own words, which is why this is not an architect's flourish: «"вернуться к её первому тренеру" –
> вот именно об этом я и говорю.»

⚠ **And the pause is genuinely a pause, not slow decay.** A decaying number would make firing a good
coach a permanent punishment and turn the mechanic into a loyalty tax; the design is that going BACK
is a real move, which needs the number to still be there. C3 asks whether a very long absence should
cost anything at all; the recommendation is no.

---

## 8. The marker on the card (#52)

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

## 9. The raise basket (#51), and how a budget coach out-earns everyone

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

⭐⭐ **AND THIS IS THE SAME BASKET §4 READS, ON PURPOSE.** «What he achieved with her» is one question
and must not have two answers: the score that decides what he ASKS is the score that decides what he
BECOMES. One computation, two readers.

⭐ **So this is the mechanism behind his «обгонит зарплатами всех», and it needs no special
case.** A budget coach who clicked and won climbs tiers (§4) and asks regularly (here); his quote is
`bandedRateCents` of his CURRENT tier against HER rank, so by the time she is top-10 the man she hired
at twelve for $200 a week is quoting like the elite coach he is – and he is the only one on the team
whose price the family watched grow from nothing. ⚠ That is a story the player experiences as a bill,
which is the best kind of story this game can tell.

⚠ **The fourth component is the best one and it needs F1**, so #51 can ship on three components and
gain the fourth later, or wait. C5.

---

## 10. Schema and RNG

**v79, and chemistry is not its only customer** – `sparringTravels` (#48) has been waiting since his
15.09 travel override. One bump, two customers.

| key | shape | migration literal |
| --- | --- | --- |
| `coachChemistry` | `Record<coachId, number>` – accrued level per pair | `{}` – «she has worked with nobody» |
| `coachStanding` | `Record<coachId, number>` – §4's earned score, from which his tier is derived | `{}` – «nobody has grown on her account» |
| `sparringTravels` | `boolean` (#48) | `false` |

⚠ **`coachStanding` stores the SCORE and not the tier**, so the tier is always a pure function of it
and a threshold retune moves every save at once instead of stranding careers at a rung that no longer
exists. Same discipline as the chemistry RATE, which is not persisted at all.

⚠ **The roster's drawn `manner` is NOT persisted either** – `buildCoachRoster` is already a pure
function of `(seed, ageYears)` and stays one. A career reproduces its market from its seed, which is
what makes «every game different» and «every game reproducible» the same sentence rather than two.

⚠ **`{}` is exactly true and not a placeholder.** A career that predates the mechanic accrued nothing
with anybody, because there was nothing to accrue. The RATE is not persisted at all: it is a pure
function of `(seed, coachId)` and re-derived, so it cannot drift out of step with a save.

**RNG:** one sub-stream, `rngFromSeed(`${seed}:chemistry:${coachId}`)`, never MAIN. Input-independence
holds by construction – the draw is keyed on the coach's identity and not on when or whether the
player hired him.

---

## 11. The benches, predicted-first (invariant 5)

⭐⭐ **B0 IS NEW AND IT IS THE ONE THAT ANSWERS HIS RULE.** «Мы можем воспроизвести все вариации и
подтвердить, что они возможны» is not satisfied by a median. It is satisfied by a census.

**B0 · THE CORNER CENSUS.** Walk N careers; for each, classify which of §1's corners it landed in;
report the frequency of each **and print one reproducing seed per corner**. The output is a table the
owner can read and a set of seeds a builder can load.

| corner | predicted frequency, written before the run |
| --- | ---: |
| A · the entry-level coach ends up the best-paid on the team | **1 career in 15–30** |
| B · no affordable tier offers BOTH chemistry and talent | **1 in 6–12** |
| C · only the top tier offers both, and the family has to find the money | **1 in 8–15** |
| D · ⭐ the ANTI-MATCH – the best coach she can afford is the wrong one | **1 in 10–20 careers meets one; 1 in 25–40 HIRES one for a season or more** |
| E · the ordinary career, nobody clicks and nobody repels | **the majority – 50–70%** |

⚠ **B and D are the two the census exists for**, because both are impossible today and both are the
ones a reader will disbelieve. D is reported as two numbers on purpose – meeting an anti-match is
common, living with one is not, and a player who fires him in a season has played correctly.

⚠ **A CORNER AT ZERO IS A FAILED WAVE, not a tuning note.** If B never occurs, the roster draw is too
narrow; if A never occurs, either the click is too rare or §4's thresholds are out of reach. **This
bench can veto the wave**, and it is the reason it is numbered before the others.

| # | claim | predicted, written before the run |
| --- | --- | --- |
| B1 | the click's frequency against the prodigy yardstick | tuned to the same ORDER as a maximal `rollPotential` roll – target 1 career in 12–20 sees one click with a coach she actually hires |
| B2 | end-of-career skill, corner A against a bought-elite career | **within ±3 skill points** – the two roads should ARRIVE together, which is the design; a large gap either way is a defect |
| B3 | does money stop mattering? median end rank by coach budget | the elite-hiring corridor stays **ahead on the MEDIAN**, because corner A is rare; if it inverts, §4's thresholds are too cheap |
| B4 | time to 90% of ceiling (round 42 #38's clock) | corner A moves it **1.5–3 years** earlier than an equivalent unbought career |
| B5 | §4's own gate – does «hire cheap and wait» buy anything? | **zero tiers climbed** on a career with no results movement. This is the mutation arm: if a plateau career still climbs, the driver is reading time and not results |
| B6 | the coach's bill at career end, corner A | **inside the elite band** – he became elite, so he is paid like it, and the family watched it happen |

⚠ **B3 changed shape from the first draft and the change is the owner's correction.** It used to ask
whether a cheap coach could ever match an expensive one – the answer is now deliberately YES, rarely.
So the claim is about the MEDIAN career, where money must still buy development, and the corner is
where it must not.

⚠ B0 and B4 run on round 42 #38's own corpus so the two clocks agree.

---

## 12. Waves, sized

| wave | ships | size |
| --- | --- | --- |
| **C1** | the roster's per-career `manner` draw, the pair's rate draw, `coachChemistry` + v79, the one `coachFactor` line, **B0's census** | **M** |
| **C2** | §4 – `coachStanding`, the tier climb, the price that follows it, B5's mutation arm | **M** |
| **C3** | the card re-lay (price/Hire to the top-right), the 36px gauge + icon, the question mark, the coach's seasonal lines | **S–M** |
| **C4** | the raise basket (#51) – three components now, the fourth when F1 lands | **S–M** |

⚠ **C1 and C2 are one schema wave** (both keys land in v79 together) but two builds, and C1 must be
benched before C2 starts: B0's census is what says the roster draw produced corners at all, and §4's
thresholds are meaningless until we know how often a click happens to begin with.

⚠ Order against the other open waves: **#34 (done) → F1 → chemistry → F2**. Chemistry does not depend
on F1 mechanically; it is placed after it because #51's best component comes from F1's results
channel, and because two schema waves in flight at once is how an append-only migration gets edited.

---

## 13. Open questions for the owner – each with a recommendation

| # | question | recommendation |
| --- | --- | --- |
| **C1** | the 4×4 (temperament × manner) centre table, and its principle («match on one axis, complement on the other») | **his to overrule freely** – the one unmeasured design claim in this document. Build it as a data object so it is one edit, not a refactor |
| **C1a** | does the roster draw `style` per career as well as `manner`? | **yes** – it is the other half of «не быть подходящего и по химии и по таланту», and corner B is weak without it. ⚠ Keep ONE coach of each style somewhere on the shelf so no career is unplayable; the variation is which TIER he sits at |
| **C2** | does the relationship's own reach stay at one tier? | **keep it** – §4 removed what the old ceiling was actually blocking, and one tier keeps affection and competence legible as two different things. ⚠ If he disagrees this is one constant, not a redesign |
| **C3** | does the `elite` rung accrue chemistry, having no next tier? | **yes, a token +0.04** – a flat zero would say the best coach cannot grow closer to her, which reads wrong |
| **C4** | does chemistry give §4's standing a tailwind? | **a small one** – a coach learns more from a girl he understands. Recommend a modest multiplier, not a second driver, so B5's mutation arm stays interpretable |
| **C5** | does #51 ship on three components now, or wait for F1's fourth? | **ship on three** – the ask is wrong TODAY and the fourth slots in without re-shaping the others |
| **C6** | the click's rate, 33%/yr | **his own «за 3 года 100%» taken literally** – let B1 tune the FREQUENCY, never the size |
| **C7** | is chemistry visible on the coach's seasonal line from season one, or once a band is clear? | **once clear** – a sentence in week 3 about a relationship is noise |
| **C8** | do rival girls carry chemistry, or coach growth? | **neither, ever** – both are modifiers on a career the player steers, and the rival cohort has no coach model to hang them on |
| **C9** | ⚠ **can a coach's TIER decline?** | **no** – one direction only. A falling tier would punish a player for a bad season twice (results, then the coach). ⚠ This is about §4's STANDING and not about §5a's chemistry, which is signed and does fall – two different numbers |
| **C10** | is the anti-match as FREQUENT as the click, or rarer? | **the same frequency** – a game where good luck is rare and bad luck is common is not variable, it is punishing. It is already slower to arrive (§3), which is enough asymmetry |
| **C11** | ⚠ does the §8 gauge show a NEGATIVE pairing, and how? | **yes, and it must** – a hidden penalty is a bug, not a mystery. Recommend the ring filling the other way in a warning colour rather than a second glyph, so one component carries both signs. ⚠ The three seasonal lines become FOUR (anti, ordinary, good, click) and the anti line is the load-bearing one |

**Done when:** C1–C11 are ruled, B0's corner frequencies are accepted as a corridor, the four seasonal
DRAFT lines are ruled (§5a – the anti line especially), and the builder brief for C1 points here.

---

## 14. ⚠ What this document does not claim

* **The 4×4 table is not measured** and is flagged as such twice, on purpose.
* **B0's predicted frequencies are guesses about a system that does not exist yet.** They are written
  down so the run can embarrass them, which is the only reason to predict anything.
* **Nothing here is built.** No constant moved, no engine file was touched, and the numbers in §5's
  table are arithmetic on today's `ECONOMY.coach` rather than the output of a run.
* **It says nothing about how the relationship FEELS in play**, which on a mechanic the player meets
  through one sentence a season is most of the question, and is a playtest rather than a bench.
