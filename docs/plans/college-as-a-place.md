---
type: plan
status: draft
area: college
canonical: false
last-reviewed: 2026-08-19
---

# College as a PLACE, not a pause – the owner's brief, round 23 (19.08.2026)

He is about to reach the fork and will verify this himself. His words, and my reading, item by item –
plus §7, which is his own question back to me: «что еще добавишь?»

⚠ **This is a PLAN. Nothing here is built.** Where a thing already exists it says so, because the
biggest risk in this brief is rebuilding what `nationalTeam.ts` already does.

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

## 2. His item 2 – transitional screens between years

The hook exists: the epilogue already asks «another year?» once per year, and `bankCollegeYear`
already banks one. What is missing is what the screen SAYS between them – see §7c, which is the
sharpest risk in this whole brief.

## 3. His item 3 – ⭐ one watchable competition per year

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

### 7e. WHAT SHE COMES BACK TO

The world ran for four years while she was gone. The conveyor turned the cohort over – measured in
round 23 #13, almost nobody survives even one season at the top. **She returns to a field she does
not recognise**, and nothing currently says so. One screen, at re-entry, naming who is gone.

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
