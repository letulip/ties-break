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

## 1a. ⭐⭐ Can the table be MEASURED? – his question, 16.09, and the honest answer has three parts

> «сама идея мне нравится, можно как-то измерить? концептуально корректно звучит»

**⚠⚠ THE PRINCIPLE ITSELF CANNOT BE VALIDATED, AND SAYING SO IS PART OF THE ANSWER.** «Two intense
people burn out; two steady ones drift; the pair that shares a language and differs in temperature
lasts» is a claim about human beings. There is no dataset of tennis coaches' manners against their
players' temperaments, and a bench that «confirmed» it would only be confirming the table it was
handed. Invariant 5 asks for measurement where measurement is possible; it does not license inventing
a ground truth.

**⭐ BUT THREE THINGS ABOUT THE TABLE ARE MEASURABLE, and together they are what a bench can honestly
give here.**

**1. Is it LOAD-BEARING, or decoration?** The actuation arm this repo always runs: flatten the table
so every cell has the same centre, and re-run B0's corner census. If the corners barely move, the
table is doing nothing and all the variation is coming from the draw – which would be worth knowing
before anybody argues about a cell. (Round 42 caught a bench whose actuation arm was a no-op hiding
behind a type cast; the arm is checked before the result is believed.)

**2. Is it BALANCED?** A structural check, not a truth claim, and it is what stops a table that
accidentally breaks the game: **every temperament must have at least one warm manner and at least one
cold one, and no manner may be best for all four.** Otherwise a `fiery` girl is a dead end, or
`analytical` is simply the right answer and the axis is a formality.

**3. ⭐⭐ DOES KNOWING THE TABLE BUY YOU ANYTHING? – the LOOKUP TEST, and this is the one that
matters**, because a legible table is exactly what he refused when he said the cheap coach who clicks
must be «такое же редкое событие, как и prodigy девочка». The measure is precise: **the variance of
realised affinity BETWEEN cells against the variance WITHIN a cell.** If the draw's spread dominates,
a player who memorises the whole table still cannot predict a pairing – the table is flavour and the
discovery stays a discovery. If the cell dominates, he has been handed a strategy guide. **That is
B10**, and it is the bench that can veto the table's shape without anyone arguing about human nature.

**⚠ AND THE FOURTH INSTRUMENT IS HIS PLAYTEST, which no bench replaces.** The principle is a claim
about how a relationship FEELS over seasons. B10 can prove the table is not a lookup; only play can
say whether «she and this man were never going to work» reads as true.

---

## 2. The number

**`chemistry`: −100 … +100, per PAIR (her and one coach), persisted, accrued weekly while that coach
is hired, starting at 0.** Not a snapshot, not a roll at hire: a number with a history, which is the
whole point.

⭐ **THE RANGE IS SIGNED BECAUSE OF HIS «ПРОТИВОПОЛОЖНАЯ химия» (§1).** Zero is the neutral working
relationship – two professionals, nothing more – and it is where every pair starts. Positive is the
click; **negative is the anti-match, and it makes her worse off than no relationship at all** (§5).

**Accrual.** One weekly step:

    chemistry += weeklyRate(A, phase, events)     (while hired, clamped to [-100, +100])

What is fixed for the pair is **`A`, the affinity** – the CORRIDOR its weekly rate lives in (§3).
The rate itself moves week to week, in periods, so the level is the integral of a relationship that
has good stretches and bad ones. That is exactly his «показатель, насколько ей комфортно с тренером»
read as a TRAJECTORY rather than a number.

⚠ **It does not decay while he is hired and it does not decay while he is not** – see §5.

---

## 3. The rate – a CORRIDOR that moves weekly, not a number per pair

⚠⚠ **THE FIRST DRAFT MADE THE RATE A CONSTANT AND THAT WAS TOO FLAT. His correction, 16.09:**

> «фразой «за 3 года 100%» я хотел сказать, что **такое тоже возможно**, % прироста может быть разный в
> зависимости от химии. Здесь тоже нужна вариативность, а не плоская шкала… есть в периодах и плоские года, и взлёты и
> падения даже. На это вполне могут влиять и победы и поражения и психологическое состояние ребёнка.»

⭐ **SO «33% A YEAR» IS A CEILING THAT A PERFECT PAIR CAN REACH, NOT A RATE IT RUNS AT** – and even a
perfect pair can have a bad year, which is his own example: Borg's conflict at the fifth Slam.

### 3.1 The pair's permanent number is AFFINITY, not a rate

**`A` ∈ [−1, +1], drawn once** from the (temperament × manner) cell on
`rngFromSeed(`${seed}:chemistry:${coachId}`)`. It is the pair's disposition and it never moves. What
it sets is not the speed – it is **the corridor the speed lives in**.

### 3.2 The corridor, anchored on his two ends

| affinity | ceiling / yr | floor / yr | how often the year is a DOWN year |
| --- | ---: | ---: | --- |
| **+1 · the click** | **+33%** (his number) | **−5 to −10%** (his number) | rare – but REACHABLE, and that is the Borg case |
| ~+0.4 · a good pair | lower ceiling | about the same floor | occasionally |
| **0 · no match** | **+5%, and the ups are SHORT** (his) | deeper (his: «сильнее») | **more often** (his: «чаще») |
| **−1 · the anti-match** | small and rare | deepest | most of the time |

⚠ **WHICH HALF IS HIS AND WHICH IS MY INTERPOLATION, said out loud.** The ceiling row is his in both
anchors (+33 at perfect, +5 at none) and he was explicit that it scales – «вверх точно». The FLOOR
he was explicit about only at the two ends (−5…−10 at perfect, deeper and more often at none) and said
so: «вниз не уверен». So the middle of the floor column is the BENCH's to fit, not the spec's to
assert – B7 below.

⭐ **TWO THINGS MOVE AS AFFINITY FALLS, NOT ONE**, and that is the whole shape of his sentence: the
dips get **deeper** AND they get **more frequent**. A pair with no match is not «a slower version of a
good pair» – it is a relationship that keeps almost breaking.

### 3.3 It moves WEEKLY, and in PERIODS rather than noise

> «и заполняться наш гаудж вполне может по недельному циклу, т.е. плавно и постепенно, а не раз в год»

⚠⚠ **AND «PERIODS» IS THE LOAD-BEARING WORD – it is what separates this design from random noise.**
White noise around a mean produces a wobbly line and no story; what he described is **flat years,
surges and declines**, which requires the weekly step to be AUTOCORRELATED. So the pair carries a
second number:

**`phase` ∈ [−1, +1] – the season's own weather**, a slow bounded random walk on
`rngFromSeed(`${seed}:chemistry:${coachId}:${week}`)` with strong persistence and mean reversion
toward `A`. Weeks near each other share a phase; months apart do not. This is where a flat stretch or
a long good run comes from, and it is one draw a week on a purpose-scoped sub-stream – **zero MAIN.**

    weeklyRate = lerp(floor(A), ceiling(A), position(phase)) / 52 + events
    chemistry  = clamp(chemistry + weeklyRate, -100, +100)

### 3.4 The three event channels – his, exactly

Events nudge `phase` rather than `chemistry` directly, so a single result cannot jolt the number: it
bends the weather, and the weather moves the level.

| channel | what pushes it | why it is the right channel |
| --- | --- | --- |
| **wins** | a title, a deep run, a result above the odds ring's expectation | winning together is how a pair finds each other |
| **losses** | an early exit, a losing streak, a bad loss as favourite | his «поражения» – and it is the channel that makes a good pair's bad year possible |
| **her state** | `spiritBandOf` – `heavy`/`dimmed` damps the climb and deepens the dip; `glowing`/`bright` helps | his «психологическое состояние ребёнка», and the world already has the five bands |

### 3.5 ⚠⚠ Three consequences this correction has, and none of them is cosmetic

1. **CHEMISTRY STOPS BEING A PURE FUNCTION OF (seed, coachId).** The level is now path-dependent, so
   only `A` can be re-derived and the LEVEL and the PHASE must both be persisted (§10). The first
   draft's «the rate is not persisted at all» is no longer true and is corrected there.
2. **RESULTS NOW PAY TWICE AND THAT NEEDS NAMING.** §4's `standing` (the coach grows) reads results,
   and §3.4 reads them again. Winning together genuinely should do both – he gets better AND they get
   closer – but a great career compounds on both axes at once. ⚠ **C13 asks whether the second read
   is damped**; the recommendation is a light damp rather than a fence, because the two effects are
   honestly different things.
3. **THE PSYCHOLOGIST NOW REACHES DEVELOPMENT BY A SECOND ROAD.** `spirit` is his patient, and spirit
   moves chemistry, which moves `coachFactor`. That is thematically right – a girl in a better place
   works better with her coach – but it is a NEW path from money to development and the bench has to
   price it (B8), not discover it in play.

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
  instrument this game already has. Copy his, as ever – the wave ships DRAFT lines for the FOUR
  bands and he rules them.

### 8a. ⭐⭐ The gauge carries the SIGN, and the sign is a gradient – his ruling, 16.09

> «предлагаю, чтобы в положительном направлении заполнение было от светло-зелёного до ярко-зелёного в
> градиенте, а для отрицательного от оранжевого до красного, например. Что-то такое.»

| direction | fill |
| --- | --- |
| **positive** | light green → bright green, as a gradient |
| **negative** | orange → red, as a gradient |

⭐ **THIS IS BETTER THAN THE ARCHITECT'S OWN PROPOSAL AND THE REASON IS WORTH KEEPING.** The
recommendation it replaces was «the ring fills the other way in a warning colour» – one hue per sign.
His gradient carries **two facts in one component**: the DIRECTION is the hue family and the STRENGTH
is the position inside it. A pair at −15 is orange and a pair at −90 is red, and the player reads
«going wrong» and «gone wrong» without a second glyph, a number or a legend.

⭐⭐ **AND THE FIGURE STAYS, WITH ITS SIGN – his ruling, and he struck the spec's own line to make it.**
§8 said «no percentage anywhere» on the grounds that a number is a slider; he answered: «вполне можем
оставить цифру как раз для тех, кто плохо считывает цвета или расположение шкалы. Не вижу ничего плохого
здесь – это **инструмент** всё-таки». He is right and the objection was the wrong shape: a figure is a
slider when it is the ONLY thing on screen and the player has a dial for it; here the player has no
dial for chemistry at all, so the number cannot be optimised – only read. And it is the one channel
that works for a reader who sees neither the hue nor the fill.
⚠ It costs no new component: `ui/ProgressRing.vue` already renders `<b>{{ round(value*100) }}</b>`
inside a `<slot>`, so the sign is a caller's override and not a prop.

⚠ **Three things the build has to get right, and they are accessibility rather than taste:**
* **Hue is not the only channel – and now there are THREE.** Red/green is the commonest colour-vision
  confusion, so the FILL FRACTION says it too (a negative pairing fills from the other end, so the
  ring's shape differs even when its colour does not) and the FIGURE says it outright with a `−`.
* **The neutral is a real state, not an empty one.** Chemistry starts at 0 and most careers stay
  ordinary (§1's corner E), so the gauge at rest must read «nothing has happened yet» rather than
  «bad» – the unfilled track, not the first orange step.
* **`--accent` stays the icon's.** The chemistry mark above the ring keeps the wave's accent yellow
  (his round-42 #52 instruction); the gradient belongs to the ring alone, so the two never compete.

⚠ And the unworked-with card still carries the QUESTION MARK rather than a forecast – a gradient
that predicted a seeded draw would leak it.

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
| `coachPairs` | `Record<coachId, { chem: number; phase: number; standing: number }>` | `{}` – «she has worked with nobody» |
| `sparringTravels` | `boolean` (#48) | `false` |

⚠ **ONE KEY WITH THREE NUMBERS, NOT THREE PARALLEL MAPS.** All three are facts about one PAIR and
all three are written on the same week by the same pass; three maps keyed on the same id would be
three chances for them to disagree about who exists.

⚠ **`standing` stores the SCORE and not the tier**, so the tier is always a pure function of it and a
threshold retune moves every save at once instead of stranding careers at a rung that no longer exists.

⚠⚠ **AND `phase` HAS TO BE PERSISTED, WHICH THE FIRST DRAFT GOT WRONG.** That draft said «the RATE is
not persisted at all: it is a pure function of `(seed, coachId)`». That stopped being true the moment
the rate started moving with results and with her state (§3.5): the week's weather is path-dependent,
so it cannot be re-derived from a seed alone. **`A` still can** – it is drawn from `(seed, coachId)`
and nothing else – and that is the half which keeps «every variation reproducible» true: same seed,
same player choices, same career, to the bit.

⚠ **The roster's drawn `manner` is NOT persisted** – `buildCoachRoster` is already a pure function of
`(seed, ageYears)` and stays one. A career reproduces its market from its seed, which is what makes
«every game different» and «every game reproducible» the same sentence rather than two.

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
| ⭐ B7 | §3.2's FLOOR column, which he was explicit about not being sure of | fit it so that a PERFECT pair sees a down year about **1 season in 8** at −5…−10%/yr (the Borg case, rare but real) and a NO-MATCH pair sees one **more often than not**. ⚠ The ceiling column is his and is not the bench's to move |
| ⭐ B8 | the psychologist's SECOND road to development (§3.5) – spirit → chemistry → `coachFactor` | **under 1.5 skill points** over a career at the top rung, against his direct composure effect. If it is larger, the seat is buying development through a side door and the coupling needs damping |
| B9 | do PERIODS actually appear, or is it noise? | a perfect pair's weekly series should show runs of **8+ weeks** on one side of its mean; a series that alternates every week is white noise wearing a phase and §3.3 has not been built |
| ⭐⭐ B10 | §1a's LOOKUP TEST – variance of realised affinity BETWEEN cells against WITHIN a cell | **within-cell must dominate, by at least 2:1.** Below that the 4×4 is a strategy-guide entry and the discovery he asked for is gone. ⚠ This bench can veto the TABLE's shape without anyone having to argue about human nature, which is why §1a puts it first |
| B11 | §1a's BALANCE check – structural, not statistical | every temperament has ≥1 warm manner and ≥1 cold one; no manner is best for all four. A failure here is a broken game, not a mis-tuned one |

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
| **C1** | the 4×4 (temperament × manner) centre table, and its principle («match on one axis, complement on the other») | ✅ **RULED 16.09: the principle stands** – «сама идея мне нравится… концептуально корректно звучит» – with the honest answer to «можно как-то измерить?» in §1a. Built as a data object so a retune is one edit |
| **C1a** | does the roster draw `style` per career as well as `manner`? | ✅ **RULED 16.09: yes.** It is the other half of «не быть подходящего и по химии и по таланту», and corner B is weak without it. ⚠ ONE coach of each style stays somewhere on the shelf so no career is unplayable; what varies is which TIER he sits at |
| **C2** | does the relationship's own reach stay at one tier? | **keep it** – §4 removed what the old ceiling was actually blocking, and one tier keeps affection and competence legible as two different things. ⚠ If he disagrees this is one constant, not a redesign |
| **C3** | does the `elite` rung accrue chemistry, having no next tier? | **yes, a token +0.04** – a flat zero would say the best coach cannot grow closer to her, which reads wrong |
| **C4** | does chemistry give §4's standing a tailwind? | **a small one** – a coach learns more from a girl he understands. Recommend a modest multiplier, not a second driver, so B5's mutation arm stays interpretable |
| **C5** | does #51 ship on three components now, or wait for F1's fourth? | **ship on three** – the ask is wrong TODAY and the fourth slots in without re-shaping the others |
| **C6** | the click's rate, 33%/yr | ✅ **RE-RULED 16.09 AND THE ANSWER REPLACED THE QUESTION: 33% is a CEILING a perfect pair can reach, not a rate it runs at.** The corridor, the weekly period and the three event channels are §3, rewritten on his correction. B7 fits the floor column he was explicit about not being sure of |
| **C7** | is chemistry visible on the coach's seasonal line from season one, or once a band is clear? | **once clear** – a sentence in week 3 about a relationship is noise |
| **C8** | do rival girls carry chemistry, or coach growth? | **neither, ever** – both are modifiers on a career the player steers, and the rival cohort has no coach model to hang them on |
| **C9** | ⚠ **can a coach's TIER decline?** | **no** – one direction only. A falling tier would punish a player for a bad season twice (results, then the coach). ⚠ This is about §4's STANDING and not about §5a's chemistry, which is signed and does fall – two different numbers |
| **C12** | ⭐ does the gauge show a FIGURE, and does it carry the minus? | ✅ **RULED 16.09: THE FIGURE STAYS, WITH THE SIGN** – and he struck my «no percentage anywhere» himself: «вполне можем оставить цифру как раз для тех, кто плохо считывает цвета или расположение шкалы… это инструмент всё-таки». See §8a |
| **C13** | ⭐ results now pay TWICE – into §4's `standing` and into §3.4's `phase`. Is the second read damped? | ✅ **RULED 16.09: «окей, давай слегка» – lightly damped, not fenced.** Winning together honestly does both things, so a fence would delete a true effect; the chemistry read takes a fraction of the standing read's weight, and B0's corner A says whether the fraction is right |
| **C10** | is the anti-match as FREQUENT as the click, or rarer? | ✅ **RULED 16.09: the same frequency** («согласен»). A game where good luck is rare and bad luck is common is not variable, it is punishing. It is already slower to ARRIVE (§3), which is the only asymmetry the design needs |
| **C11** | ⚠ does the §8 gauge show a NEGATIVE pairing, and how? | ✅ **RULED 16.09: yes, and by GRADIENT** – his design, and it is better than the recommendation it answers. See §8a |

**Done when:** C1–C11 are ruled, B0's corner frequencies are accepted as a corridor, the four seasonal
DRAFT lines are ruled (§5a – the anti line especially), and the builder brief for C1 points here.

✅ **RULED 16.09 – TEN OF TWELVE.** `C1a`, `C2`–`C5`, `C7`–`C9` accepted as recommended in one pass
(«остальное ок, оставляем твои рекомендации»); **C6 re-ruled** into §3's corridor; **C10** the
anti-match is as frequent as the click; **C11** the gauge carries the sign as a gradient; **C12** the
figure stays with it.

✅✅ **AND THE LAST TWO CAME BACK 16.09 – C1–C13 ARE ALL RULED.**

* **C1** – «сама идея мне нравится… концептуально корректно звучит», with «можно как-то измерить?» answered in
  §1a: the principle cannot be validated, three things about the table can, and B10's lookup test is
  the one that can veto its shape.
* **C13** – «окей, давай слегка»: the second read of results is lightly damped.

⚠ **So the gate this document sets on itself is OPEN and the builder brief may point here.** What is
still owed is not a ruling but the FOUR seasonal DRAFT lines (§5a – the anti-match line especially),
and those are written by the build and ruled by him before the wave ships, not before it starts.

---

## 14. ⚠ What this document does not claim

* **The 4×4 table is not measured** and is flagged as such twice, on purpose.
* **B0's predicted frequencies are guesses about a system that does not exist yet.** They are written
  down so the run can embarrass them, which is the only reason to predict anything.
* **Nothing here is built.** No constant moved, no engine file was touched, and the numbers in §5's
  table are arithmetic on today's `ECONOMY.coach` rather than the output of a run.
* **It says nothing about how the relationship FEELS in play**, which on a mechanic the player meets
  through one sentence a season is most of the question, and is a playtest rather than a bench.

---

## 15. ⭐⭐ WAVE C1, BUILT AND MEASURED (16.09) – predicted against measured

**What shipped.** `manner` on the coach roster, drawn per career on the existing `seed:coaches`
sub-stream; affinity `A` ∈ [−1, +1] drawn once per pair around the (temperament × manner) cell; the
corridor of §3.2; the weekly `phase` of §3.3; two of the three event channels of §3.4; schema **v79**
(`coachPairs`, and `sparringTravels` riding with it); and one term in `coachFactor`.

**Where it lives.** `src/engine/chemistry.ts` (the whole mechanic, a leaf), `ECONOMY.chemistry` (every
knob – nothing reads a literal), `buildCoachRoster` and `coachFactor` in `src/engine/coach.ts`,
`accrueCoachPair` in `src/engine/world/phaseGrowth.ts` (the one writer of `coachPairs`), the v78 → v79
step in `src/engine/migrations.ts`, `tests/round43-chemistry.test.ts` (42 cases, ten measured mutation
arms, ~1.0 s) and `tools/chemistry-bench.ts` (`npm run bench:chemistry`).

### 15.1 The benches

| # | predicted, written before the run | MEASURED | verdict |
| --- | --- | --- | --- |
| **B10** · the lookup test | within-cell variance dominates between-cell **by ≥ 2:1** | within 0.13, between 0.03, **ratio 3.9 : 1** | ✅ the draw dominates; the 4×4 is flavour, not a strategy guide |
| **B11** · the balance check | every temperament has ≥ 1 warm manner and ≥ 1 cold one; no manner best for all four | a clean Latin square – each row has exactly one +0.26 and one −0.26, each manner is best for exactly one temperament | ✅ structural, by construction |
| **B9** · do periods appear? | a perfect pair's weekly series shows **runs of 8+ weeks** on one side of its mean | 400 years: 2,270 runs, mean length **9.2 weeks**, longest 176; runs of 8+ hold **82.1% of all weeks** | ✅ §3.3 is built – this is not noise wearing a phase |
| **B7** · the floor column | a PERFECT pair sees a down year **1 season in 8**; a NO-MATCH pair **more often than not** | perfect pair **1 in 67** on the weather alone; no-match pair **68.5%** | ⚠ half met – see 15.3 |
| **B0** · the corner census | A 1 in 15–30 · B 1 in 6–12 · C 1 in 8–15 · D 1 in 10–20 met, 1 in 25–40 hired · E 50–70% | below | ✅ no corner at zero |

**B0, 3,000 careers, with a reproducing seed for each corner.** The census definitions are the
bench's own and are stated in its header: `affordable` is a tier proxy (working shops at budget,
middle adds middle, wealthy adds high – elite is gated on results, which is what makes C «the family
has to find the money»); `talent` is a GREAT style fit; `click` is A ≥ +0.60, `anti-match` A ≤ −0.60,
and «workable chemistry» A ≥ +0.25.

| corner | predicted | **measured** | reproducing seed |
| --- | --- | --- | --- |
| **A** · a budget coach is both the right teacher and a click | 1 in 15–30 | **7.9% · 1 in 12.6** | `chem-0` (working, aggressive, quiet) |
| **B** · nothing in reach offers both | 1 in 6–12 | **42.8% · 1 in 2.3** | `chem-2` (wealthy, aggressive, sunny) |
| **C** · only above her reach offers both | 1 in 8–15 | **28.6% · 1 in 3.5** | `chem-3` (working, counterpuncher, fiery) |
| **D** · the anti-match is on her shelf | 1 in 10–20 | **14.3% · 1 in 7.0** | `chem-1` (middle, aggressive, deep) |
| **D** · ...and he is the coach she opens with | 1 in 25–40 | **7.1% · 1 in 14.0** | `chem-1` (middle, aggressive, deep) |
| **E** · the ordinary career – her own coach is neither | the majority, 50–70% | **83.1%** | `chem-2` (wealthy, aggressive, sunny) |

⚠ **Three of the six are commoner than predicted and one is much commoner.** B and C were guesses
about a system that did not exist, and both turn on where «workable chemistry» is drawn – which is a
REPORTING threshold, not an engine constant. What matters is the shape: every corner occurs, none is
at zero, and the ordinary career is still the overwhelming majority.

⭐ **And C10 comes out right by construction rather than by tuning:** an opening coach is a click in
8.3% of careers and an anti-match in 8.6%. «Согласен» – the same frequency.

⚠ **Corner A is measured as its PRECONDITION and not as its finish.** «The entry-level coach ends up
the best-paid on the team» needs §4's tier climb, which is wave C2 – no coach's tier moves on this
tree. What C1 owns is the gate, and the gate opens 1 career in 12.6.

### 15.2 Two things the bench sent back, and both were engine changes

⚠⚠ **THE RESULTS CHANNEL WAS A FLAT TAX ON EVERY CAREER IN THE GAME, and only a real career found
it.** The first build weighted a loss half again as heavily as a win and charged a first-round exit on
top – the natural reading of «поражения». Measured over 12 careers × 208 weeks: 806 wins, 784 losses,
14 titles and **454 first-round exits**, which drove the median career to a standing phase of
**−0.36** and wore its relationship down for no reason but arithmetic. ⚠ **In a knockout sport every
event but one ends in a loss**, so any asymmetry there is a tax rather than a signal. The fix was to
make the two weights exact mirrors and drop the exit term: `wins − losses` already IS the depth of a
run (a title is +5 net, a semifinal +2, a first-round exit −1), a 50% season is exactly neutral, and
the median career now ends 208 weeks at a phase of **+0.09**. ⚠ «A bad loss as FAVOURITE» is an
EXPECTATION-relative read and is not built – C5 defers that residual to F1 itself, and this wave did
not fake it.

⚠⚠ **AND `driftAtPerfect` MOVED, 22 → 12, BECAUSE B7 SAID «NEVER».** With the median year at +19 and
the floor at −7, a down year needed the weather below −0.76 for a whole season – four standard
deviations of the yearly mean – so a perfect pair could not have a bad year at all. At 12 the median
year is +11 and the zero crossing is 1.9σ away, which also puts a perfect pair's climb to 100 at
«roughly a decade», §5's own sentence.

### 15.3 B7, honestly: the Borg year comes from the RESULTS, not from the dice

The weather alone, 400 seasons per affinity, no events:

| affinity | floor/yr | drift/yr | ceiling/yr | median year | best | worst | DOWN years |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| +1.00 | −7.0 | 12.0 | 33.0 | +11.4 | +27.6 | −1.8 | 1.5% (1 in 67) |
| +0.60 | −12.2 | 7.2 | 21.8 | +6.3 | +17.3 | −5.4 | 9.8% (1 in 10.3) |
| +0.25 | −16.8 | 3.0 | 12.0 | +1.6 | +9.0 | −12.0 | 35.8% |
| 0.00 | −20.0 | 0.0 | 5.0 | −1.2 | +3.8 | −14.9 | **68.5%** |
| −0.60 | −27.8 | −6.0 | 2.6 | −7.6 | +0.9 | −20.0 | 99.8% |
| −1.00 | −33.0 | −10.0 | 1.0 | −11.3 | −1.8 | −28.2 | 100% |

...and the same pairs under four result regimes (median season total):

| affinity | quiet | ordinary | bad year | **disaster** |
| ---: | ---: | ---: | ---: | ---: |
| +1.00 | +12.3 | +12.6 | +3.1 | **−1.5** |
| +0.60 | +6.4 | +7.0 | −1.5 | −6.8 |
| 0.00 | −1.8 | −1.3 | −9.0 | −14.4 |

⭐ **So B7's second half is met at 68.5%, and its first half is met by a different mechanism than the
one it predicted.** A perfect pair sees a down year 1 season in 67 on the weather, 1 in 10 at A = +0.6,
and reliably in a season where the results collapse. That is §3.4's own claim – «losses are the
channel that makes a good pair's bad year possible» – measured rather than assumed. ⚠ The **ceiling**
column was not touched: +33 and +5 are his and are pinned by name in
`tests/round43-chemistry.test.ts`.

### 15.4 ⚠⚠ C1a IS NOT BUILT, AND IT IS THE ONE THING IN THIS DOCUMENT THE WAVE DID NOT DO

C1a rules that the roster draws `style` per career as well as `manner`. It WAS built, benched, and
handed back, because it costs a shipped economic principle and buys almost nothing:

* **what it bought** – corner B 41.3% → 42.8%, corner C 25.7% → 28.6%, and A, D and E unmoved to
  within noise, over 3,000 careers on the same seeds. ⭐ **The corners are made by the CHEMISTRY
  draw.** The style shuffle adds about one point and three points to two of them.
* **what it cost** – ⚠⚠ **a 4.7% COACHING DISCOUNT AT EVERY RUNG ABOVE BUDGET, in every career in the
  game.** `bestFitCoachAt` breaks a tie by PRICE, and a shuffled shelf creates ties: measured over
  4,000 careers a rung, 24% drew TWO great-fit coaches at the rung (the cheaper wins) and 25% drew
  NONE (she falls back to the cheapest good fit). Elite's opening rate went **$149.93/h → $142.92/h**,
  Middle's $50.00 → $47.61, High's $80.12 → $76.33.
* **what that broke** – `tests/economy-calibration.test.ts`'s wealthy cell went red: an idle year
  flipped from a **$2,970 BURN to break-even**, which reverses round 7's «premium everything must
  hurt». That is an owner principle, not a tuning note, and trading it for three points of corner C is
  his call and not an agent's.

⚠ **And he has already ruled the neighbouring question once**, on 30.07 («2 counterpancher budget,
none big serve»): a play style is chosen ONCE, on screen R, before the player knows what coaching
costs, and it is irreversible, so a rung with a hole in it taxes the family least able to buy its way
out. A shuffled shelf re-opens that on one career in four.

**So the question back to him is one line:** is «which tier plays which style» worth a 4.7% cut in
what coaching costs, given that the corners arrive without it? If yes, C1a ships in C2 together with a
re-pin of the three burn bands. `tests/round43-chemistry.test.ts` pins the current answer so the draw
cannot be re-added silently.

### 15.5 What C1 is worth, and why end-of-career skill is the wrong ruler

48 paired careers × 468 weeks, chemistry ON against **the same tree with the corridor neutralised in
place** (every anchor to 0, so the level never leaves 0 and `coachFactor` is byte-identical to the
shipped arithmetic). The neutralised arm accrued **exactly 0** on all 48 and the build moved on **48
of 48** – the arm is real.

| the hired pair | careers | end chemistry | end-skill delta |
| --- | ---: | ---: | ---: |
| click, A ≥ +0.60 | 5 | **+52.5** | +0.04 |
| good, +0.25…+0.60 | 5 | +53.9 | +0.03 |
| ordinary | 25 | −0.4 | −0.09 |
| cooling | 8 | −24.8 | −0.18 |
| anti-match, A ≤ −0.60 | 5 | **−28.7** | −0.34 |

⚠ **THE LEVEL MOVES PROPERLY AND THE END-SKILL COLUMN IS ALMOST FLAT, AND THAT IS A BROKEN RULER
RATHER THAN A BROKEN MECHANIC.** `growWeek` grows TOWARD `potential`: a faster rate does not raise the
destination, it arrives sooner, and a girl nine years in is at or near her ceiling on both arms. §5's
own table is the right way to read what C1 is worth – a budget pair at +52 chemistry develops at 1.005
against 0.95 – and the number that compounds is the coach's own TIER, which is wave C2's.
⭐ **The downside is the half that shows today**, because an anti-match pushes the rate below what
reaching the ceiling needs: −0.34 skill points, worst case −1.56. Which is exactly why §5a says the
anti-match must be VISIBLE.

### 15.6 The four seasonal lines – ⚠ DRAFT, and nothing renders them

§5a asks for four and says the anti-match line is load-bearing, because a negative pairing that is
invisible is a hidden tax. **These are DRAFTS for the owner to rule, cut or rewrite. C1 ships no
player-facing string at all** – the seasonal line lands in C3 with the card and the gauge.

| band | DRAFT line |
| --- | --- |
| **anti-match** | «A season with him, and she is further from her game than she started. Whatever he is saying, she is not hearing it.» |
| **ordinary** | «They work well enough. He runs the sessions, she does them, and neither of them talks about it much.» |
| **good** | «She listens to him now. Something in the way he explains a thing has started landing.» |
| **the click** | «He knows what to say to her before she knows she needs it. This is the year it stopped being coaching and started being theirs.» |

⚠ The anti-match line deliberately names the COST – further from her game – rather than the mood,
because the player's only other channel is a bill that says nothing is wrong.
