---
type: plan
status: draft
area: college
canonical: false
last-reviewed: 2026-08-20
---

# The college flow – seven observations from a played career (owner, 20.08.2026)

Save: `tennis-sim_alice-cfbv_w474.tsave`, taken the moment she graduated. Read-only, never committed.
Her earlier save `…_w257.tsave` sits just before the fork and is what the reproductions below drive.

⚠ **A PLAN. NOTHING IS BUILT.** He asked for the analysis first: «Подробно каждый пункт разбирай,
делаем план работ, утверждаем, потом в работу».

---

## 0. ⚠⚠ WHAT HIS SAVE SHOWS, BEFORE ANY OF HIS SEVEN ITEMS

| | his save at w474 | a run of the SAME career on TODAY's code |
| --- | ---: | ---: |
| events on the calendar | **0** | 164 |
| result rows in the whole world | **1** | 2,289 |
| her world rank | **1** | 70 |
| cohort ages | 13**…28** | 13…28 |

**The world did not play for four years.** The single result row is his own W500 in the graduation
week. The calendar is empty. And because *nobody* holds a junior result in the trailing year, the
whole 200-row table is on zero points and competition ranking ties them all at **#1** – her included.

⭐ **THIS EXPLAINS THREE OF HIS SEVEN ITEMS AT ONCE**: the empty calendar (#7), being admitted to a
World Tour 500 while unranked (#4 – the engine believes she is world #1), and the strange silence of
those years (#2c).

⚠⚠ **AND IT DID NOT REPRODUCE ON CURRENT CODE.** Driving his own earlier save to the fork, answering
college and resuming all four years through the same `resumeFromCollege` the worker calls, the world
kept playing: 164 events, 2,289 rows, rank 70. So either the emptying was fixed by work that landed
after his session, or it depends on a path the probe does not take (a save/load between years, a
different tier, an early exit). **THAT IS THE FIRST THING THE WORK MUST ESTABLISH** – see step 1.

---

## 1. «Письмо про академию… можно присылать на почту и там хранить»

> «сейчас как-то незаметно появляется один маленький попапчик сверху, который призывает изучить
> scholarship и кнопка dismiss. Я бы и рад изучить, да только далее не знаю где.»

⚠ **HALF OF THIS IS A ROUND-23 FIX WORKING AS DESIGNED, AND THE OTHER HALF IS THE REAL COMPLAINT.**
Round 23 #16 found the academy verdict landing on the one week a `+4` advance can never reach and gave
it a stop – which is the toast he is describing. The stop was the fix; **the toast was never meant to
be the whole surface.**

His point stands and is sharper than the original item: the toast tells him something happened and
gives him **nowhere to go**. There is an inbox (`InboxSheet.vue`) and there are letters
(`OfferLetter.vue`), and a scholarship – arriving, changing, ending – is exactly the class of thing
that belongs in one, kept.

**Work:** the academy's three notices become letters in the inbox, retained; the toast keeps its job
of saying *when*, and gains a destination.

## 2. The fork itself

### 2a. «Описание и выбор колледжей под кнопкой выбора самого колледжа и непонятно почему самый дешёвый нельзя выбрать»
Two faults in one sentence: the choices are **behind** the control that chooses them, and a rung is
refused **without saying why**. The second is the one that matters – this project has a house rule
about refusals naming their reason (`entryStatus`'s reason codes, the coach card's locked plaque).
**Work:** surface the quotes before the choice, and give every refused tier a stated reason.

### 2b. «После выбора колледжа показывают фотоальбом как будто карьера закончилась»
⭐ **NOT A BUG – IT IS THE ARCHITECTURE SHOWING THROUGH.** College is implemented as an ENDING that
can be resumed (`world.ending.type === 'college'`, and `resumeFromCollege` is "the one command in the
game that CLEARS an ending"). So the epilogue screen is what renders, album and all.

⚠ That was a sound engineering choice and it is now a product problem: **the player is shown the end
of the story in the middle of it.** This is the same finding as his #3, arriving from the other side.

### 2c. «3 клика "+1 год" и ни одного соревнования живого»
His build predates the played rubbers. On current code a call-up plays three real matches that replay
in `MatchReplay`. ⚠ **But three clicks and nothing else is still what four years feel like**, and one
fixture a year does not fill them – see #3.

### 2d. «unranked на w500 сразу после нажатия»
He guessed the cause himself and he is right *and* it is worse: it was a **stale entry** (`W11 '36`,
made before the freeze and still in `world.entries` four years later) **and** the rank check could not
have refused it anyway, because the empty table made her #1. Two independent faults on one screen.

## 3. «Весь флоу колледжа перенести на домашний экран… или отдельный параллельный полноэкранный»

⭐ **THIS IS THE ITEM THE OTHERS HANG OFF, and it is the same conclusion §2b reached from the code.**
College currently borrows the EPILOGUE as its shell, so it inherits an ending's furniture: an album, a
sense of conclusion, and a single button. What it needs is its own shell with a week, a calendar of
its own events, and results.

⚠ **THE CHEAPER OF HIS TWO OPTIONS IS THE FIRST.** Home already has a week, a bottom control and a
recap card; a college week is a week with different content. A second full-screen flow duplicates all
of that and then has to be kept in step with it – the DRY problem this project has spent two rounds
removing. **Recommendation: college weeks run on the Home shell, with college content.**

## 4. «После выпуска экран graduated, потом домашний экран»
Straightforward once #3 lands: the graduation card is the last college screen, and it hands back to
Home rather than to an epilogue. ⚠ And the stale entry from §2d must be cleared when the freeze
starts – an entry made four years ago is not a commitment she made.

## 5. ⭐⭐ «В колледж она пошла ровно в день своего рождения, а должна была в начале учебного года»

**Confirmed, and it is a DESIGN CHANGE rather than a defect** – the code does this deliberately:

    forkDue(ageYears) = ageYears >= ENDINGS.forkAgeYears

read through `kidAgeThroughWeek`, whose own comment says *"a rule meant to be raised ON HER BIRTHDAY –
the fork at nineteen is the one"*. It fires on her birthday exactly as written.

His model is better and it is a different shape: **the fork is asked after school ends, the place is
RESERVED, she keeps playing, and she leaves when the academic year starts.** That splits one moment
into three – ask, hold, depart – and the gap between them is playable time the current design throws
away.

⚠ It also interacts with #6: a decision taken in the spring and acted on in the autumn is exactly
where an opinion of hers has room to matter.

## 6. «Где-то её мнение увидеть, чего она хочет: колледж, тур или завязать»
New, and it is the first appearance of the thing `the-private-life.md` calls the missing stat. ⚠ Do
not build a second opinion system here: if her wanting things is coming, this is its first surface and
should be built as such, not as a one-off string on the fork.

## 7. «Полностью пустой календарь после колледжа»
Same root as §0. If step 1 finds the emptying is already fixed, this becomes: *his existing save is
still broken and needs a repair path* – see step 2.

---

## Steps

| # | step | done when |
| --- | --- | --- |
| **1** | ⚠⚠ **Establish whether the world still stops during college.** Reproduce from his w257 save through the UI path, not the probe: save and reload between years, try each tier, try an early exit. | either a reproduction exists, or a written statement of which commit fixed it and the test that now covers it |
| **2** | **Repair his save.** A world whose calendar is empty and whose table is all zeros should heal on the next tick (measured: 6 ticks restore 142 events and rank 27). Confirm, and if it does not, write the migration. | his w474 save loads into a playable career |
| **3** | **Clear entries at the freeze** (#2d) and refuse an entry the rank cannot support | a stale W500 cannot survive four years |
| **4** | **The academy letters** (#1) – three notices into the inbox, kept | the toast has somewhere to go and the letter is still there next season |
| **5** | **The fork screen** (#2a) – quotes before the choice, every refusal states its reason | no rung is greyed out in silence |
| **6** | ⭐ **The college shell** (#3, #2b, #4) – college weeks on the Home shell; graduation hands back to Home | four years stop looking like four endings |
| **7** | **The academic year** (#5) – ask in spring, reserve, depart in autumn | she plays the summer she is currently losing |
| **8** | **Her opinion** (#6) – built as the first surface of the private-life stat, not as a string | she can want something the player does not |

⚠ **STEPS 1-3 ARE THE BUG FIXES AND SHOULD SHIP FIRST**, separately from 4-8, which are the redesign.
