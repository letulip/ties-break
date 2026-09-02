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
8. **⭐⭐ WHO SHE IS STAYS – 02.09, and it is a correction of what shipped.** He played it and found
   every prologue career was the same girl: «каждая прологовая карьера сейчас Вера Мартин – я просил
   сделать дефолт на **Alice Martin**». Two things follow, and both are his:
   - **The default player is Alice Martin.** `DEFAULT_PROFILE.kidName` is `'Alice'`
     (`kidLastName` already was `'Martin'`). ⚠ That moved all three frozen career hashes, because
     `econ-bench`'s `openCareer` spreads `DEFAULT_PROFILE` and her name is printed into event text –
     the measured per-key diff, the re-stamp and the byte-level proof are in
     `tests/coachTravelEdgeFixtures.ts`. **No schema moved.**
   - **The prologue asks her name, her birthday and her country.** «И отсюда же следует, что часть
     нашего текущего онбординга с датой рождения и именем должны остаться», and, the same day,
     «страну тоже добавь, да». ⭐ THE THREE ARE THE WIZARD'S OWN FIELDS, in the wizard's own words:
     the labels, the month names and the country lists now live in `composables/identityCopy.ts` and
     `composables/countries.ts` and BOTH surfaces read them, so «the prologue asks it differently»
     is not expressible. Not one new sentence reaches a screen (invariant 4).
   - **The hero image may stay** – «Заглавная картинка где папа с девочкой первый раз на корте тоже
     может остаться, кстати». It is the wizard's step N and it was not touched: permission, not an
     instruction to move it. If he wants it INSIDE the prologue that is a separate ask.
   ⚠ AND `playStyle` / `coachTier` ARE STILL NOT ASKED, which is the line between the two kinds of
   field: §4 says both are EARNED from the nine years, and the nine years cannot derive a name.

---

## 3. The nine cards

A year is one screen. Not every year needs a decision, and the decisions are the ones a tennis
parent actually faces – which are not about tournaments.

| age | the scene | the decision |
| --- | --- | --- |
| 5 | she can barely hold it | **none** – the hook, the family's origin (§2.4), and who she is (§2.8) |
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

⭐⭐ **THE FIVE ALSO ASKS WHO SHE IS (§2.8, shipped 02.09), AND IT IS NOT A TENTH SCREEN.** Her name,
her family name, her birthday and her country sit above the origins on the first card – the natural
home, because the five is already the quiet card that carries the family-origin question and because
a naming step of its own would be the tenth scene §3 exists to avoid. ⚠ It is not a DECISION either:
`DECISION_AGES` reads `options` alone, so the count he set («может тогда больше без решений, 3 или
4?») is unchanged and the five still carries none.

⚠⚠ **AND IT MADE THE FIVE THE LONGEST CARD IN THE WALK, WHICH IS HIS TO RULE ON.** Measured, not
estimated (`tests/component/prologue-walk.test.ts` prints it): at 375x667 the card's content floor is
**2301px against 635px of room – about 3.6 screens of scroll** before the three origins. The way out
is still reachable and always will be, because `.dialog-card` is capped at the viewport and scrolls
(round-20 #3), so this is a READING-LENGTH question rather than a defect: the first thing a new
player meets is now a form with a story on top of it. The country picker is most of the height – a
search field, nine tiles and a way to open the other fifteen. If he wants it shorter the options are
his: a second scene for the identity, or a quieter country control. **Nothing was cut to make it fit.**

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

**SHIPPED 02.09 (phase 5), both halves.** B: `OnboardingTour.vue` takes the shell's `tab` as a
`screen` prop and ends the moment it moves – the same exit **Skip tour** takes, so More's existing
**Show the tour** re-arms it. The click-capturing overlay was NOT built and `pointer-events: none`
stays. C: `App.vue`'s `finishPrologue` marks the device onboarded on the handover's «go on», so a
prologue player never meets the marks. No step's wording moved and no new sentence reaches the
screen. The record, the mutations and the test map are in `docs/specs/onboarding-tour.md`.

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
⭐ **DONE 02.09.** The reproduction is a mounted test that walks the exact path (tapping Stats, then
four presses of Next that have nothing to press) and a browser test that makes the tap for real;
`e2e/prologue.spec.ts` asserts the prologue reaches week 1 with the tour absent, the device flag
written and still absent after a reload. Every claim was mutation-verified – see §6.

**Phase 6 – who she is (§2.8). SHIPPED 02.09.** The owner's own correction after playing phase 4:
the default player is Alice Martin, and the age-5 card asks for her name, her birthday and her
country in the wizard's controls and the wizard's words. The three frozen careers were re-stamped
under the file's own protocol – per-key diff first, `PRE_NAME_VERA` as the byte-level identity, no
guard deleted. *Acceptance, and all of it is measured*: a prologue career carries what the player
typed, asserted end to end from the card to `world.profile` and again in a real browser through a
real worker (`e2e/prologue.spec.ts` types a name and reads it back out of the seed the worker
echoed); the wizard path unchanged; the age-5 card's way out inside a 375x667 viewport; every claim
mutation-verified.

**Phase 7 – the coach's read gains a second dimension, and the prologue gets its art. SHIPPED 02.09.**
Two owner asks answered together. The read: «оставляем туман … вот ими надо добавить понимание про
базу и перспективы» – a BASE band beside the room band, drawn deterministically, words only, no
ceiling contour. The look: «по типу нашего home screen где большой арт на всю ширину экрана» – every
card carries a painting that already ships, the face derived from the reads the card already
computes, and the age-5 card's content measured down from 1115px to 997px in a real browser *with*
the painting on it. *Acceptance, all measured*: a neglected childhood and a devoted one from the SAME
seed get different base sentences and the same room sentence; every card renders its art and the
age-5 card uses `welcome-1`; the mood is derived, not typed; every control reachable at 375x667. The
cuts, the distribution, the height before and after and two findings recorded rather than fixed are
in §8c.

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

⭐⭐ **AND SINCE PHASE 7 HE SAYS TWO THINGS.** The owner, 02.09, answering his own ask that a player
must come off this screen knowing «на сколько мощно сейчас (на момент 13-14) и какой запас впереди»:

> «оставляем туман, у нас есть слова тренера – вот ими надо добавить понимание про **базу и
> перспективы** как раз в дополнение к туману»

    the BASE = WHAT YOU BUILT          where she stands against fourteen-year-olds TODAY
    the ROOM = WHAT SHE WAS BORN WITH  how much was in her before anybody did anything

⚠⚠ **AND THAT IS WHY ONE OF THEM ANSWERS THE CHILDHOOD AND THE OTHER CANNOT.** `handoverRoomBand`
reads her BIRTH build on purpose (§4: the childhood may not move `potential`), so the room sentence
is IDENTICAL for a neglected childhood and a devoted one from the same seed – measured, 100% of
seeds. `handoverBaseBand` reads her ARRIVAL, so the base sentence moves with what the player did –
40.9% of seeds between the cheapest and the dearest walk through the shipped card table. **Do not
"fix" the room band to respond to the player.** The base band is where the nine years are answered.

⚠ **NO CEILING CONTOUR ON THE ROSE. The fog stays** (§5, and the owner's own ruling). The potential
is never drawn; this is words only, and neither sentence names a number or a ceiling.

**The base, DRAFTED – none of it has been read by him**, and the three room bands below are
untouched: the base goes FIRST and his approved sentence follows it, unchanged.

**Ahead of her age group** (above p80 of today's fourteen-year-olds)
- «She is ahead of most girls her age. Somebody did the work.»
- «She is further along than the girls she will be playing.»

**Among them** (p20 to p80 – 62% of them)
- «She is where most girls her age are.»
- «She is level with the girls she will be playing.»

**Behind them** (below p20)
- «She is behind most girls her age. That is the ground she starts from.»
- «There is ground to make up on the girls her age.»

**The two together, on one screen, from the same seed raised two ways:**

    NEGLECTED   «She is behind most girls her age. That is the ground she starts from.»
                «There is more in there. How much, I could not tell you yet.»

    DEVOTED     «She is where most girls her age are.»
                «There is more in there. How much, I could not tell you yet.»

---

### 8a-i. The room bands – §8a as it stood, and it is unchanged


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

---

## 8c. Phase 7, measured – the base band's cuts, and the height of the first screen

Everything in this section is a measurement taken on this branch, not a prediction (invariant 5).

### The reference: what a freshly created fourteen-year-old IS

Re-measured at 20,000, 100,000 and 400,000 seeds; every quantile below is stable to the hundredth at
all three sample sizes, so the cuts are not an artefact of a sample.

    MEAN ATTRIBUTE OF A FRESH FOURTEEN-YEAR-OLD (400,000 seeds)
      min 40.10   p05 44.30   p20 46.30   p50 48.50   p80 50.70   p95 52.70   max 57.30

### The cuts: p20 and p80, i.e. 46.30 and 50.70

**Why those and not another pair, in two steps that are both measurable.**

1. **The middle band has to hold more than half of the population, because the copy says so.** «She
   is where most girls her age are» is false if the middle third holds 37.6% – which is what the
   tertiles measure – so the tertiles were rejected on the sentence, not on taste.
2. **Inside the pairs that survive that test, take the one that moves the band most with the
   childhood.** Same seed, `neglectedChildhood()` versus `devotedChildhood()`:

   | cuts | middle band holds | the model's extremes move it | the CARD TABLE moves it |
   | --- | --- | --- | --- |
   | p05/p95 | 91.9% | 40.9% | 15.4% |
   | p10/p90 | 81.6% | 60.0% | 25.7% |
   | p15/p85 | 72.4% | 76.0% | 33.7% |
   | **p20/p80** | **62.7%** | **89.9%** | **40.9%** |
   | p25/p75 | 52.0% | 89.0% | 46.9% |
   | tertiles | 34.9% | 82.5% | 53.9% – ⚠ and «most» is a lie |

⭐ **AND THE PAIR LANDS AT 48.50 ± 2.20, WHICH IS ONE DEVOTED CHILDHOOD FROM THE MEDIAN.** Phase 1
measured a devoted childhood at +2.188 and a neglected one at −2.093. That is not how the cuts were
chosen – they are the reference's own quantiles – but it is *why* the band moves: doing the work
carries the median girl across a cut and doing nothing leaves her where she was born.

### The resulting distribution

    over careers the prologue never touched:   behind 18.9%   level 61.8%   ahead 19.3%

    per childhood, at these cuts (20,000 seeds each):
                        below   among   ahead
      the reference     19.3%   61.5%   19.2%
      neglected         49.7%   46.1%    4.2%
      median            19.4%   61.4%   19.2%
      grinder           30.5%   57.5%   11.9%
      mixed             12.1%   58.1%   29.8%
      devoted            3.5%   47.5%   49.0%

### ⚠⚠ Two findings recorded rather than fixed

**1. THE SHIPPED CARD TABLE REACHES 44% OF THE MODEL'S SPAN.** Enumerating all 32 runs through
`PROLOGUE_CARDS`: mean arrival 47.48 at the cheapest and 49.35 at the dearest – **1.87 points**,
against the model's neglected↔devoted **4.28**. The cheapest run is also the lowest-arrival one, so
money and build are perfectly aligned in the table today. That is why the base band moves on 40.9%
of seeds for a real player and 89.9% between the model's extremes. **Widening what a card buys is a
balance change and the owner's**; it is named here, not made.

**2. THE FIT MODEL OVER-COUNTS THIS CARD BY MORE THAN DOUBLE, in two named ways.**
`tests/component/fits.ts` calls itself a floor that «UNDER-COUNTS AND NEVER OVER-COUNTS». On the
age-5 card that is false, because happy-dom does no layout:

| control | the model | a real Chromium at 375x667 |
| --- | --- | --- |
| the month/day pair (`<select>` × 2) | 962px – it stacks the 42 `<option>`s | 47px |
| the nine-tile picker (`display: grid`) | 523px – it stacks the cells in one column | 190px |
| **the whole age-5 card** | **2301px** | **1115px** |

An over-count can only produce a false RED, so the model is still safe to gate on and the ceiling in
`prologue-walk.test.ts` is set against it. But the number the owner is asked to judge is the
browser's, and `e2e/prologue.spec.ts` now asserts it. **Teaching `fits.ts` about `grid` and `<select>`
was NOT done here** – it would move the numbers in every other dialog's test in the same commit as a
height fix, which is exactly the confound this section exists to avoid.

### The height, before and after

| | model (`fits.ts`) | real Chromium at 375x667 |
| --- | --- | --- |
| before phase 7 | 2301px – 3.6 screens | 1115px – 1.76 screens |
| after phase 7 | **1940px – 3.1 screens** | **997px – 1.57 screens** |

⭐ **And the 997 includes a 193px painting the 1115 did not have**, so the content that is *not* the
picture fell from 1115 to 804 – **−28%**. The identity block alone went from **561px to 253px**
(−55%). What paid for it, in order of size:

* **the country picker opens closed** (315px → 89px) – one tile, her own country, and the wizard's
  own `Browse all countries` as the way in. Not one new string, and the picker's parts, views and
  headings are untouched;
* **the two names share a row** (138px → 69px);
* nothing else was cut. The scene, the two read lines, the three origins and the way out are
  unchanged, and so is every word on the card.

### What the picture is, per card

| card | painting | how the face is chosen |
| --- | --- | --- |
| age 5 | `welcome-1.webp` | none – ⭐ the owner's own instruction: «у нас есть картинка где она первый раз на корт приходит вообще» |
| ages 6–10 | `fem-euro-brunnet-jun-*.webp` | `moodAt`: warm → `happy`, otherwise `norm` |
| ages 11 | `fem-euro-brunnet-young-*.webp` | the same |
| ages 12–13 | `fem-euro-brunnet-young-*.webp` | the twelfth's fork: `tired` → `tired`, `wants-more` → `serious` |

⚠ **THE FACE IS DERIVED, NEVER TYPED.** `moodAt` (src/prologue/run.ts) reads the same counts
`warmthAt` and `readTwelfth` read, so the picture cannot disagree with the sentence under it, and
there is no `mood` column in `cards.ts` for anybody to keep in sync by hand –
`tests/prologue-art.test.ts` asserts the table declares no face at all. The band boundary the art
uses was set for this months ago (owner, 25.07: «young starts at 11 – the childhood prologue is
coming, so the boundary is deliberately set where the prologue will need it»).

⚠ **AND THE TEXT STAYS UNDER THE PICTURE.** The owner allowed either – «а текст под ним или частично
на нем» – and `tests/component/contrast.ts` composites colours through the real cascade and cannot
see a photograph, so a title moved onto the art would leave `assertLegible` measuring a background
that is not behind it. Round-17 #3 is why that gate exists. The fade into `--panel` is what buys the
same look without blinding it.
