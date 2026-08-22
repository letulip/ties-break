---
type: plan
status: draft
area: college
canonical: false
last-reviewed: 2026-08-22
---

# College as a PLACE, not a pause – the owner's brief, round 23 (19.08.2026)

He is about to reach the fork and will verify this himself. His words, and my reading, item by item –
plus §7, which is his own question back to me: «что еще добавишь?»

⚠ **This was round 23's PLAN, and round 24 (20–22.08) BUILT most of it.** The wave record lives in
`docs/plans/college-the-flow.md` and is not duplicated here. Still open in THIS file: §7c-orig's
between-year decisions, §7e's re-entry screen, §7a's missing price, §6's art order, and §6b's
control list. Where a thing exists the section now says so, because the biggest risk in this brief
was always rebuilding what already works – and that risk was real twice over: the §3 wave changed
only how a rubber is RESOLVED, and the League wave reused the fixture clock it found.

---

## 0. ⚠⚠ THREE MEASURED FACTS THAT MUST SHAPE THIS, and two of them broke their own predictions

From `docs/specs/college-as-a-second-act-2026-08.md` §1-2 (n = 52 careers that reached the fork,
three arms sharing the same seeds and the same world up to that week):

| | prediction | what was measured |
| --- | --- | --- |
| **P3** | four frozen years cost her *"under half"* of four coached years | ⚠⚠ **WRONG – it costs about 10%.** |
| **P4** | she leaves at the dense floor of the zero-point group | ⚠⚠ **WRONG – her rank is IDENTICAL at both ends. She was already off the list walking in.** |
| **P5** | the early return is the whole feature | ✅ held – three of the four years are a real question |

**P3 answers his item 5 directly and against his intuition.** He remembered a decision that college
should accrue *less*, and it already does – but by a tenth, not a half. ⚠ Making it much less would
turn college from a choice into a trap, and the fork's whole point is that it is a real third answer.

**P4 is the one that decides the design.** College costs her no ranking *today* – but only because
only unranked girls ever take it. See §7a: that is the missing price, not a fact about college.

---

## 1. His item 1 – a start screen and an end screen

A college screen at enrolment, and a final one that can arrive **early or at graduation**. The engine
already distinguishes all three outcomes and the kid-life tile already renders them (round 23 #6):
`Year N of 4` / `Graduate – 4 years done` / `Left college – N of 4 years`.

**What is missing is only the screen.** ⚠ And one navigation ruling: the *studying* line is built,
engine-correct and pinned, and **cannot be reached today** because `showEnding` replaces the tab
shell, so screen C is never mounted between years. Whoever builds this owns that ruling.

⭐ **WHAT THE COLLEGE WAVE FOUND, 20.08, AND THE RULING IT DID NOT MAKE.** Three of the four screens
this item asks for already exist under other names, and it is worth writing down which:

* **the start screen** is the epilogue's college block at `yearsDone === 0` – it names the place, the
  bill, «Play the first year», and «She can leave at the end of any year»;
* **the between-year screen** is the same block at `yearsDone > 0`, and since this wave it also lists
  the year's rubbers with a Watch control each;
* **the end screen** already arrives, through the app's ordinary machinery rather than a new surface:
  `finishCollege` / `endCollegeEarly` write `collegeEpilogueLine` as a `milestone` on the CURRENT
  week, `'milestone'` is a `HIGHLIGHT_TYPES` member, and the tab shell routes to the week's own story
  the moment the latch comes off. So graduation lands on a screen that says what four years did.

⭐⭐ **RESOLVED (21.08), AND NOT THE WAY THE PARAGRAPH BELOW FEARED.** What shipped is the full
residency, not a door: college weeks run ON the Home shell (`showCollege` routes the latch,
`CollegeYearCard` is the year, graduation is `CollegeDoneDialog` and hands back to Home), and the
screen-full-of-errors problem was closed from the other side – E2's audit walked all 20 command
sites, `guardNotEnded` answers college with the college sentence (`COLLEGE_FREEZE_REFUSAL`: "She is
at college – the career is not over…"), the vacation/practice cancels are OPEN through
`guardNotEndedForGood`, and the rest refuse honestly, each awaiting its own ruling (§6b). The
shell-wide ruling this section left for the owner was made: hide nothing, refuse truthfully, open
what is unambiguous.

⚠ *As first written (20.08), kept because the risk was real:* THE STUDYING LINE IS UNREACHABLE, AND
THE OBVIOUS FIX IS A ROUND-20 DEAD END. The
tempting move is a «look around» door out of the epilogue into the tab shell. It cannot be taken
casually: the epilogue is a BLOCKING takeover precisely because `advanceWeeks` returns `['ending']`
and `guardNotEnded` throws on most commands, so a player let into the shell mid-college meets a
sticky "Play week" bar, an Enter-event button and a coach market that the engine will REFUSE. That is
a screen full of controls that error – the round-20 failure with a different cause. **The ruling this
needs is which controls the shell hides while an ending is latched**, and that is a shell-wide
decision, not a college one. Left for the owner.

## 2. His item 2 – transitional screens between years

The hook exists: the epilogue already asks «another year?» once per year, and `bankCollegeYear`
already banks one. What is missing is what the screen SAYS between them – see §7c, which is the
sharpest risk in this whole brief.

⭐ **PART-ANSWERED BY §3 (20.08), WHICH IS WHERE §7c SAID IT WOULD BE ANSWERED.** The between-year
card now carries the year's competition as something to DO rather than something to read: one row per
rubber, opponent and result, and the match itself one tap away. What it still did not carry was a
DECISION – and ⭐ **the first one arrived 22.08: her birthday.** The year PAUSES on her week (the
same stop machinery as the call-up), the gift dialog renders on the live Home shell, and the chosen
gift is recorded in `world.birthdays` – free, by the owner's own spec ruling, so the scene is a
reaction and never a purchase. §7c-orig's remaining candidates (does she play the summer, what does
she study, does the family keep paying for anything on the side) are still the honest gap.

## 3. His item 3 – ⭐ one watchable competition per year – ✅ **BUILT (20.08)**

⭐⭐ **SHIPPED.** The rubbers are played through `simulateMatch` on `seed:rubbers:<week>` /
`seed:rubber:<week>:<i>`, land in `world.events` as `match` rows with the same record every other
match carries, and are watched in `MatchReplay` – the same viewer the tour re-watches a match in,
headed with the competition's name (his «кроме названий турниров»). `resumeFromCollege` now returns
`StopReason[]` and adds `'call-up'`, so the year cannot pass in silence; the epilogue's year card
lists one row per rubber with a Watch control. **No save-schema change** – the records live in the
feed, `CollegeCallUp` keeps its three numbers, and `rubbersWon` is simply counted off the court now.

⚠ **Measured, because the model it replaces was a probability curve** (n = 2,000 per row):

| her skill mean | 50 | 54 | 58 | **62** | 66 | 70 | 76 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| the old model `rubberWinChance` | .260 | .340 | .420 | **.500** | .580 | .660 | .780 |
| played through `simulateMatch` | .211 | .294 | .407 | **.479** | .615 | .726 | .838 |

The played curve tracks and is slightly steeper – a real match compounds a skill edge over a set –
and it costs nothing, because a rubber still pays no points, no money, takes no condition and feeds
no development. The table is pinned in `tests/college-second-act.test.ts`.

⚠ **Deliberately NOT done, and each is a balance change §0 and invariant 4 own:** a condition drain
for the rubbers, a layoff when she retires hurt in one (the verb says it happened; the body does
not), and anything that would make the week feed `growWeek`.

*The brief, as written, follows.*

## 3-orig. His item 3, as first read

> «в каждом году минимум одни соревнования, которые можно смотреть так же, как и наши текущие, т.е.
> тот же самый механизм в точности, кроме названий турниров»

⚠⚠ **THE COMPETITION ALREADY EXISTS AND IS ALREADY WIRED INTO COLLEGE.** `src/engine/nationalTeam.ts`
(206 lines) has `rollCallUp`, `rubberWinChance`, `callUpLine`; `world/college.ts`'s `callUpWeek` and
`resolveCallUp` run it inside the freeze, on its own `seed:callup:<week>` sub-stream.

**So this item is NOT "build a tournament". It is one precise gap:** the rubbers are resolved
STATISTICALLY, through `binomial(n, p, u)`, and never played. His ask is that they go through the
same bracket and the same `playMatch` every other event uses – "тот же самый механизм в точности".

That is the highest-value item in the brief and the best-scoped: the fixture, the opponents and the
result already exist; what changes is that the match is *played* rather than *summarised*.

⚠ It is also the one with an RNG cost. Playing rubbers draws where `binomial` drew once, so it needs
its own sub-stream and a re-freeze, and `resolveCallUp` sits INSIDE `resumeFromCollege` – a four-year
loop with no player in it. A played match that wants a viewer is a stop, and a stop inside that loop
is the same 49+4 trap round 23 #16 just fixed. **Design the stop before the match.**

⭐ **HOW IT CAME OUT (20.08).** The stop was designed first and it is a REPORT rather than a halt,
which is his own ruling rather than a shortcut: college is the shortcut («перелистывание 1 года за
клик»), and a year that stopped in the middle and needed a second click to finish itself is the
playable season the fork exists to skip. So the year is still one click and the click hands back the
reason. **And there was no re-freeze to take:** the new draws are on `seed:rubbers:<week>`, a private
sub-stream, `seed:callup:<week>` is byte-identical, and the three frozen careers in
`tests/coach-travel-edge.test.ts` never reach college – they are green untouched, MAIN capture
included (41550 / `e6b0c709`).

### 3+. ⭐⭐ AND THEN THE FLOOR (22.08) – the League, and the call-up earned

The call-up alone left the year mostly silent, measured the moment the Home shell stopped hiding it
behind an album: **0.71 watchable matches per college year**, and on ~⅔ of years one openable row
with nothing in it. The owner's ruling: «я бы хотел, чтобы как минимум 1 турнир в год колледжа был…
вызов в сборную можно будет опереть на результаты студенческого… минимум 1, максимум 2 турнира на
учебный год».

Built as the **College League** (`src/engine/collegeLeague.ts`): a draw of eight at season week 12,
played through `simulateMatch`, watched in `MatchReplay`. ⭐ The floor is ARITHMETIC, not
probability – a college year is 52 consecutive ticked weeks, so season week 12 occurs in it exactly
once, at every tier; and only weeks 12 and 14 carry a tournament, so the ceiling of two holds by the
same argument. The call-up stopped being a bare roll: `callChanceByLeague` reads how far she went –
**0.15 / 0.40 / 0.65 / 0.85** by rounds won, and **0 with no championship on record** (the selectors
have one thing to read about a college player; before she has played one, nobody writes). Measured
at n = 399 years: 2.63–2.72 watchable matches/year, zero years with nothing to open, call-up
16/33/68/84% by result. It awards no points and no money – she is an amateur, and a student fixture
that paid points would quietly make four years of college a ranking route around the fork.

## 4. His item 4 – «заканчиваем или продолжаем?»

⭐ **This already works.** `resumeFromCollege` runs ONE year and returns to the epilogue, which asks
again. P5 measured it as the feature that carries the phase. It needs surfacing (§1, §2), not
building.

## 5. His item 5 – what she gains in college

Answered above: **~10%, not half.** The decision he is half-remembering was that college should not
be free, and it is not – but the honest number is small. ⚠ Recommendation: do NOT cut it further
until §7a gives college a real price. Two prices at once and the fork stops being a fork.

## 6. His item 6 – the portrait ages

⚠ **This is an ART ORDER, not a code task.** Builders here may not create, derive, recolour or
generate art – a standing rule. So item 6 is: decide how many portrait ages exist, commission or
approve the assets, and only then wire them. The wiring is trivial by comparison.

---

## 6a. What round 24 fixed UNDERNEATH this plan – so nobody re-fears it

⚠⚠ **THE FREEZE COULD KILL THE WORLD, and it was live in the owner's own save.** An entry that
outlived the fork opened an unanswerable reveal inside the freeze; `tickWeek` skips housekeeping
while a reveal is open, so the world ticked 204 weeks EMPTY – no calendar, no results, an all-zero
table crowning her world #1. Fixed by three rules (the fork releases her entries; `resumeFromCollege`
refuses to tick past a reveal; the entry scan is gated on `inCollege`) plus the v55 migration that
heals a stranded save on load, and the ranking rule that stops an all-zero table crowning anybody.
Record: `tools/college-freeze-probe.ts`, `tests/college-freeze.test.ts`.

⚠ **D2 – the academic year – in work 22.08.** The fork moves off her birthday («В колледж она пошла
ровно в день своего рождения, а должна была в начале учебного года») to ask-after-school /
place-RESERVED / depart-in-September, and the entry release moves WITH her to the departure – an
entry made while she still plays before September is a commitment she made. *(Status line to update
when D2 reports.)*

## 6b. The open controls at college – E2's audit, for the owner to rule on

All 20 command sites were walked (21.08). Refusals now say the true thing, two are OPEN (cancel
vacation, cancel practice – a booking honoured inside the freeze must be retractable), and these
stay REFUSED awaiting a ruling each:

| control | why it is not obvious |
| --- | --- |
| hire / fire the coach | the retainer is suspended, not cancelled; re-hiring prices off a market she is not in |
| book a vacation | the planner knows nothing of the squad trips (wk 8, 20), the League (12) or the Cup (14) – THREE collision weeks now |
| buy a racquet | gear resolution is shut in the freeze; squad kit is unmodelled |
| training plan / physio | development runs, but the programme coaches her – the parent's lever is suspended with the coach's |
| the birthday gift | ✅ RESOLVED 22.08 – the year pauses and asks (see §2) |

---

## 7. ⭐ What I would add – his own question

### 7a. ⚠⚠ THE RANKING IS THE PRICE, AND TODAY IT IS FREE

P4's finding is not "college is cheap". It is **"only girls with nothing to lose ever go"**. The
moment a RANKED girl can choose it, four years at one event a year erases a professional book – and
*that* is what makes «продолжаем или заканчиваем?» a real question in years 2, 3 and 4 rather than a
polite prompt. Without it the fork is free, and a free choice is not a choice.

This is the single most important addition, and it is mostly already true – it just needs a career
where it can bite.

### 7b. THE TEAM IS THE EMOTIONAL CONTENT, and it is half-built

Everything in this game so far is her, alone, with a parent paying. A college or national side is the
first time she plays **for somebody other than herself**. That is what college is FOR narratively,
and `nationalTeam.ts` is already half of it. §3 buys the mechanic; this is the reason to buy it.

### 7c. ⚠⚠ WITHDRAWN BY THE OWNER, AND HE IS RIGHT – kept here because the reasoning matters

I raised this as the brief's biggest risk. He answered it (19.08) and the answer is better than the
worry: «если у нас появятся соревнования в процессе колледжа, то для родителя это будет примерно как
2 месяца сезона с играми пролистать. Там у него тоже не много работы так-то. Иными словами, я не вижу
проблему при наличии турниров.»

⭐ **The concern was CONDITIONAL and I stated it as absolute.** A college year with a competition in
it is an ordinary stretch of season – and an ordinary stretch of season is *already* mostly advancing
weeks. Measured against the game we actually have rather than against an ideal, there is no deficit
to fill.

**So it collapses into §3 and adds nothing of its own:** with the competitions, this is a non-issue;
without them, «4 клика и диплом» (his words) is the whole failure, and §3 is already the item that
prevents it. What follows is kept as the record of an argument that was made and settled.

### 7c-orig. THE PARENT HAS NO JOB FOR FOUR YEARS (as originally written)

In college the programme coaches her – the bill says so («At college – the programme coaches her, not
us»). So the game's central decision, the coach and his travel, is **suspended for four years**. A
four-year stretch in which the player decides nothing is the real risk in this brief, and his item 2
is where it shows. Either the between-year screens carry decisions that matter, or college becomes a
loading bar with a graduation card at the end.

**Candidates for those decisions**, cheapest first: whether she plays the summer, whether she takes
the call-up at all, what she studies (a flavour choice with one mechanical edge), and whether the
family keeps paying for anything on the side.

### 7d. THE WALLET GETS A REST, AND HE SHOULD FEEL IT

No travel, no coach, no entries. After two seasons of bleeding – measured on his own careers, −$11k
then −$9k before the turn – four years of **not** bleeding is a story the ledger can tell for free.
It is also the honest counterweight to §7a: college costs her ranking and gives him his money back.

⭐ And the rest is when the SHOP would matter most – see `docs/backlog/the-shop-and-the-broker.md`
§0a: four idle years and an idle wallet are that file's best moment, and a shop command is exactly
the `guardNotEndedForGood` family class round 24 created.

### 7e. WHAT SHE COMES BACK TO

The world ran for four years while she was gone. The conveyor turned the cohort over – measured in
round 23 #13, almost nobody survives even one season at the top. **She returns to a field she does
not recognise**, and nothing currently says so. One screen, at re-entry, naming who is gone.

⭐ **NOW THE BRANCH'S STRONGEST NEXT CANDIDATE (22.08):** with the shell, the League and the
birthday in, re-entry is the remaining unbuilt scene – and D2's departure week gives the four years
a natural opening bookend that this screen would close.

### 7f. CAN COLLEGE DISAPPOINT? – ⭐ ANSWERED BY THE OWNER, AND THE ANSWER IS A DESIGN

I asked whether college should be able to go wrong: an injury, a bad year, a programme that drops
her. His answer (19.08): «я тоже об этом думал и склоняюсь к мысли, что это каждый для себя решит
сам, мы же не знаем как ее карьера дальше будет разворачиваться после колледжа, верно?»

⭐ **THE DISAPPOINTMENT IS RETROSPECTIVE, NOT SCRIPTED.** Whether four years were the right call is
decided by what happens AFTER them, and the game does not know that at the time – so it must not
pretend to. A scripted setback would be the game telling the player what his choice was worth; the
answer he gives leaves that judgement where it belongs.

⚠ **What this rules OUT, concretely:** no "college goes badly" event, no programme that drops her, no
punitive arm on the fork. **What it rules IN:** the years must be RECORDED well enough that a player
can look back and judge them – which is §1's end screen, §7d's ledger, and §7e's changed world doing
work they were already going to do.
