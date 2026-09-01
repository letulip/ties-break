---
type: spec
status: draft
area: product
canonical: false
last-reviewed: 2026-09-01
---

# The childhood prologue – the build spec (01.09.2026)

**Status: DRAFT FOR HIS REVIEW. Nothing is built.** This is the buildable successor to the 30.07
design note (`childhood-prologue.md`), which stays as the argument. Everything here is either a fact
re-measured against `main` on 01.09 or a ruling he gave in the session of the same day.

His framing, and it sets the bar for the whole document: «пролог – это первое, что увидит игрок,
надо хорошо продумать».

---

## 1. The facts, re-measured on `main` today

The 30.07 note ends its first section with «Check it first this time.» It was checked.

**1a. ⚠⚠ THE GROWTH MODEL BELOW 13 IS THE WHOLE PROBLEM, AND IT IS BIGGER THAN THE NOTE ESTIMATED.**
`ageFactor` (`development.ts:343`) clamps at `Math.max(0, (age - growthStart) / (growthEnd - growthStart))`
with `growthStart = 13`, so every age below 13 returns `peakRate` – the maximum junior rate:

    age        6      8     10     12     13     14     16     18
    ageFactor  .00620 .00620 .00620 .00620 .00620 .00558 .00434 .00310

Summed over each window (the age term alone, from the real exported function):

    prologue 6 -> 14    2.56  over 416 weeks
    the game 14 -> 18   0.90  over 208 weeks
    the game 14 -> 23   1.43  over 468 weeks

⭐ **A prologue run through `growWeek` would grant 2.84x the age term of the whole 14→18 window and
180% of everything 14→23 grants.** She would arrive at fourteen with more development behind her than
the entire playable career hands out. The note said "absurdly strong"; this is the number.

**1b. There is no field under 13.** `COHORT.ageBand = [13, 19]`. The Local / Regional / National tiers
genuinely have no `minAgeYears` – that half of the note holds – but entering a ten-year-old today
would put her against fifteen-year-olds.

**1c. Duds are deliberate.** `potentialBand: [4, 26]`, and the comment beside it: «a career at the
bottom of this band is a girl who was never going to make it, and that has to be a career the game
can tell». The game has already decided that low ceilings exist. What it has never had is anything to
SAY to the player who drew one.

**1d. The radar's fog is about the PRESENT, not the ceiling.** `SkillsRadar.vue:254` – «HOW WRONG WE
MIGHT BE about where she is». Potential is never drawn anywhere. ⭐ So showing the formed rose at the
end of the prologue reveals nothing about her ceiling and does not weaken the fog at all – it shows
who you raised, not who she will become.

**1e. The birthday machinery already exists.** `START_AGE_YEARS = 14`, and the game already starts
her at 13-or-14 depending on her birth date (`kidAgeYears(week, birthMonth, birthDay)`).

---

## 2. His rulings (01.09), which this spec is built on

1. **The prologue starts at 5**, and she turns 6 during the first card – decided by her birthday, on
   exactly the machinery that already decides 13-or-14. «я бы поставил начало в 5, 6 происходит
   где-то в первый год.» ⇒ **nine cards, not eight.**
2. **Real tournaments from 10, on a separate throwaway pool** – «отдельный маленький пул на пролог –
   да, я тоже об этом думал» – at his own rhythm of **1–2 a year**, «по принципу колледжа».
3. **The handover tells the truth about her ceiling**, at 13 or 14 depending on age, in the coach's
   voice, beside **the formed skill rose**: «к концу пролога мы должны увидеть розу скиллов … можно
   принести на экран конца пролога как результат вместе с мнением тренера и выбором».
   ⚠ **The game says NOTHING about rerolling.** «Про рестарт с перебросом мы ничего не говорим,
   только слова тренера и честный выбор игрока "продолжить или попробовать снова".»
4. **The player chooses where the family is FROM, not a sum**, and the nine years move the number from
   there – «хорошо звучит, давай попробуем». ⚠ The money's texture (a rare «удалось скопить $1000»
   beat, versus no money on screen at all until the last card) is **his to try in play**: «давай
   сделаем так, я посмотрю и попробую потом, скажу как и что.» Until then the spec builds the
   arithmetic and shows the total **once**, on the last card.
5. **Motivation is DERIVED, never stored.** The age-12 fork reads what the player DID – years of
   one-to-one against group, tournaments entered, whether any year was left light. «Развилку в
   двенадцать лет можно вывести из того, что делал игрок – вот это вообще очень хорошо звучит.»
   ⭐ There are no dice in a derived reading, so the trap he named («на новом заходе она точно должна
   хотеть») cannot arise: there is nothing to roll badly. The real motivation system is HIS later
   work, «при наличии всего сторилайна».
6. **The tour: B and C together.** C is the prologue teaching the interface as it goes; **B is the
   repaired tour, and it exists only for a player who SKIPS the prologue.** «В будет когда пролог
   скипают, а С будет в прологе … после него В уже не будет.» The existing wizard becomes the skip
   branch: «это создание персонажа будет как альтернативная ветка у нас при скипе пролога».
7. **Ten minutes**, inside a free first fragment of 30–60 minutes (prologue + the first season),
   «после чего окно "понравилось? 10 долларов пожалуйста"». About a minute a card.

---

## 3. The nine cards

A year is one screen. Not every year needs a decision, and the decisions are the ones a tennis
parent actually faces – which are not about tournaments.

| age | the scene | the decision |
| --- | --- | --- |
| 5 | she can barely hold it | **none** – the hook, and the family's origin (§2.4) |
| 6 | she can hold it, and she likes it | **none** – she starts. That choice was made by starting the game |
| 7 | the group works | **none** – a year passes |
| 8 | the club across town, or the municipal court | ⭐ the first real money: a club is ~3x, and it is where the coaches are |
| 9 | the group is full of eight-year-olds | group or one-to-one – the first "what share of our income is this" |
| 10 | there is a Local Open in six weeks | enter her? **A real tournament with the match viewer**, on the prologue's own pool |
| 11 | the sports school takes children at eleven | sports school or ordinary school – **how much childhood we spend** |
| 12 | she is tired of it / she wants more | the fork, **derived from years 5–11**, never a menu |
| 13 | the junior tour opens (already true in code) | **none** – it opens, and «do we go» belongs to the handover, beside the coach's read |
| 14 | — | **the handover** (§5) |

⚠ **FOUR CARDS CARRY NO DECISION – 5, 6, 7 and 13 – and the count is his** («может тогда больше без
решений, 3 или 4?»). Nine consecutive choices is not ten minutes, it is a quiz.

⭐ AND THE SHAPE IS THE ARGUMENT: three quiet years while she is small and nothing costs anything,
five years of real decisions from 8 to 12, then a quiet thirteenth as the run-up to the handover.
**The money starts when the club does, at eight** – which is what actually happens to families.

⚠ THE AGE-10 TOURNAMENT SHOWS THE MATCH VIEWER (his ruling: «да»). §8's open question is closed.

---

## 4. What the prologue may move, and what it may not

**MAY** – all of it using machinery that exists:
- `startingSkills`, shifted post-draw at `createWorld`, exactly the shipped `relativeAgeHeadStart`
  pattern: no schema, no new draw.
- **`fundsCents` at week 0** – today a flat $8k / $25k / $120k by background. The prologue makes it
  yours, and answers a question the game currently cannot: what IS this $25,000.
- **`playStyle`, earned rather than picked** – it emerges from what she actually practised, which
  DELETES an arbitrary menu choice.
- the coach rung she arrives with; possibly an academy offer already on the table.

**MAY NOT: `potential`.** Her ceiling is talent and what you did at eight does not change it. Let the
prologue raise it and «you made her» quietly becomes «she was always going to be good». This is the
same rule the coach spec's §6 and task 55 keep: **a timing or effort effect must never become a
talent effect.**

---

## 5. The handover screen – the most important screen in the game

It is the first thing a player sees that is about HER rather than about menus, and it is where a weak
draw stops being a hundred-hour ambush.

Three things on one screen:
1. **The formed rose** – the radar she arrives with, drawn by the existing component. Safe: §1d.
2. **The coach's read, in his voice, with no number.** He gives an impression and he can be wrong –
   «я видел таких, они доходят до национального уровня и там остаются» – and she may prove him wrong.
   ⚠ If he ever names a ceiling, the fog stops meaning anything.
3. **The honest choice: go on, or start again.** ⚠ Worded as a choice about HER, never as a
   mechanic. The game does not mention rerolling, odds, or a floor (his ruling, §2.3).

⭐ AND THE WIZARD'S PROMISE MUST CHANGE WITH IT. `OnboardingWizard` currently says «Your kid has real
talent. With the right support, anything is possible.» – which `potentialBand: [4, 26]` does not
guarantee. The promise belongs to the PARENT («this will cost more than you think, and sooner»), not
to the child. ⚠ It is his copy: the change is proposed here, not made.

---

## 6. The two paths

    new game ─┬─ the prologue (default)  ── 9 cards ── the handover ── the game, and NO tour (C)
              └─ skip ── the existing wizard, reworded ── the game, WITH the repaired tour (B)

**B – what "repaired" means, measured today.** `.coach-tour` is `position: fixed`, full-screen,
`z-index: 65`, `pointer-events: none` – deliberately, so the page beneath can scroll – and every
step's `selector` points at a BOTTOM-BAR BUTTON, which exists on every screen. So the tour can never
break visibly; it just becomes untrue. Reproduced on `main` on 01.09: with the tour up, tapping
**Stats** and pressing Next four times walked all four steps – "You are the parent", "Her page",
"News and letters", "The money is yours" – **while the player stood on Stats the whole time**, with no
highlight cut into the overlay at all.

⭐ The minimum honest repair is not a click-trap: **if the screen changes, the tour ends** – quietly,
with "run the tour again" available in More. It converts a wrong tour into no tour, which is strictly
better, and it builds nothing the prologue will later delete. ⚠ Do NOT build the click-capturing
overlay (option A): that is the overloaded tour he does not want, in a component C replaces.

---

## 7. The build plan

Each phase ships on its own and is measured before the next starts.

**Phase 1 – the growth model 6→13. The gate on everything else.**
There is no prologue until this exists, because §1a says a prologue on today's curve breaks the game.
Model 6→13 as a DIFFERENT process, not an extension of the curve: at seven it is coordination, habit
and whether she likes it, not headroom against a ceiling.
*Acceptance*: a nine-year walk from 5 leaves her at fourteen **within the band a fresh 14-year-old
occupies today** – quote both distributions. ⚠ Invariant 5: a spec with predicted vs measured, and a
bench. ⚠ Invariant 2: no MAIN draw; a purpose-scoped sub-stream or no randomness at all.
⚠ The frozen capture and every career hash must be provably unmoved: a prologue that changes an
existing career is a defect, not a feature.

**Phase 2 – the nine cards as data, and the screen that draws them.**
Cards are a table, not nine components. No engine call except the ones §4 names.
*Acceptance*: a mounted walk through all nine on a 375x667 phone, every card's dismiss control inside
the viewport (the round-20 #3 rule). Ten minutes measured, not assumed – time the walk.

**Phase 3 – the prologue's own tournament pool.**
8–16 local children, no ranking, no potential, no career arc, thrown away at the handover. ⚠ It may
never enter `world.cohort` or any table: the ladder was just repaired and this must not touch it.
*Acceptance*: the main cohort's composition is byte-identical with and without a prologue; a played
Local Open at 10 produces a result and a memory and nothing else.

**Phase 4 – the handover.**
The rose, the coach's read, the choice. The save arrives at week 0 with what the prologue earned.
*Acceptance*: a career started through the prologue and one started through the wizard produce the
same SHAPE of world – same schema, same invariants, only different numbers.

**Phase 5 – the tour, both halves.**
B (the screen-change exit) ships with phase 4 or before it; C is phases 2–4 doing their job.
*Acceptance*: the reproduction in §6 no longer reproduces; a prologue player never sees a tour.

⚠ **NOT IN v1, and named so nobody smuggles them in:** the motivation system (his, later); a
difficulty menu (§2.4 replaces it); any change to `potential`; any change to the main cohort;
the second and third «lекarstva» for a weak draw (a rising floor, and a capped career's own way to be
worth playing) – both are real, both are his to rule on, and neither is a prologue feature.

---

## 8. What this spec does not decide

- The money's texture on screen (§2.4) – he will play it and say.
- The money's texture on screen (§2.4) – he will play it and say.
- ⭐ The copy below is DRAFTED, not decided – he asked for drafts in our own pool and tone
  («покажешь текст … исходя из нашего пула и тон-оф-войс общего»). It ships only with his word.

### 8a. The coach's read at the handover – drafted

⭐ IT USES THE VOCABULARY THE COACH ALREADY HAS. `coachMarket.ts:1120` already grades her remaining
room in WORDS, not numbers: `Huge potential` / `Still room to grow` / `Close to her ceiling`. The
handover speaks in those three bands, in the register of `COACH_FIELD_LINES` – short, declarative,
no adjective stacks – and **he is allowed to be wrong**, which is what keeps the fog meaning
something.

**Close to her ceiling** (the weak draw, and the case this screen exists for)
- «She is near what she has. I have been wrong before – but not often about this.»
- «What you see is close to what you get. Some find another gear at seventeen. Most do not.»
- «There is not much more in there. She can have a good life in this sport. She will not have a famous one.»

**Still room to grow**
- «There is more in there. How much, I could not tell you yet.»
- «She is not finished. The next three years will say how far.»

**Huge potential**
- «I do not say this often. There is a great deal more in there.»
- «Whatever she is now, she is nowhere near the end of it.»

### 8b. The wizard's promise, reworded – drafted

It reads «Your kid has real talent. With the right support, anything is possible.» and
`potentialBand: [4, 26]` does not guarantee it. The promise belongs to the PARENT.

- **A** «The talent is hers. The bills, the drives and the decisions are yours.»  ⭐ recommended – it
  is the game's thesis in one line and it promises nothing about her
- **B** «Your kid can play. What happens next is mostly about you – and it will cost more than you
  think, sooner than you think.»
- **C** «She has something. Whether it becomes anything is a question about your time, your money and
  your nerve.»

⚠ TWO MORE LINES CARRY THE SAME FAULT and must move with it or the wizard contradicts itself:
«Let's get to know your future champion.» and «Here's your champion in the making.» Both promise a
champion.
