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

## Steps, with who does them

⚠ **THREE WAVES, AND THE ORDER IS NOT A PREFERENCE.** Wave 1's investigation decides whether wave 2
exists at all; wave 3 is a redesign and must not start while the bugs are still moving underneath it.
Inside a wave the agents are bundled by COLLISION SURFACE – no two touch the same file.

⭐ **ONE ROOT, THREE SYMPTOMS.** `ensureSeason` is what rebuilds the calendar AND what drops entries
for events that no longer exist (`world.entries = world.entries.filter(...)`, world.ts:1056). If the
world stops during the freeze, all three of his symptoms follow from that one fact: the calendar is
empty (#7), the four-year-old W500 entry survives (#2d), and the all-zero table makes her world #1
(#4). Fixing the stop may fix all three; that is exactly what wave 1 has to establish.

---

### WAVE 1 – find out what is actually broken (nothing else may start first)

| agent | type | owns (collision surface) | items |
| --- | --- | --- | --- |
| **A1 – the freeze audit** | `general-purpose` | `tools/**` ONLY. **Read-only on `src/`.** | §0, #7, #2d |

**A1's brief.** Reproduce the emptying, or prove it gone. His save shows 0 calendar events, 1 result
row and world rank 1 at graduation; the same career driven through `resumeFromCollege` on current code
shows 164 / 2,289 / rank 70. **Find which path produces his state**, trying at least: a save and
reload between years (the likeliest – it is what a player does), each college tier, `endCollegeEarly`,
and the UI's own message sequence rather than a direct call. ⚠ **If it cannot be reproduced, that is
the finding** – then say which commit fixed it and what test now covers it, and wave 2 shrinks to
step B2 alone.

**Evidence:** a committed probe under `tools/`, its output for each path tried, and a one-line verdict.

---

### WAVE 2 – the bug fixes (only what wave 1 confirms)

| agent | type | owns (collision surface) | items |
| --- | --- | --- | --- |
| **B1 – the freeze's hygiene** | `general-purpose` | `src/engine/world.ts`, `src/engine/world/college.ts`, tests | #2d, #7 |
| **B2 – the table that ties at first** | `general-purpose` | `src/engine/season/ranking.ts`, `src/engine/world/ladder.ts`, tests | #4 |

**B1** makes the freeze keep the world honest: the calendar continues, stale entries do not survive it,
and a career comes out of college into a world that has been playing. ⚠ Scope depends entirely on
A1's verdict – if the stop is already fixed, B1 is only "an entry made before the freeze is released
when the freeze starts", which is a small, self-contained rule.

**B2** fixes the rank, and the rule is narrower than it looks. ⚠ Round 23 already met this on the
DOMESTIC table and the fix was scoped to season tables **because applying it to rolling tables was a
regression** (her ITF rank moved 90 → 200; with 89 players holding points and 111 on zero, "the zeroes
are 90th" is competition ranking answering correctly). The honest rule is narrower than both attempts:
**when EVERY row is on zero, nobody is ranked.** That leaves the normal case untouched and kills the
degenerate one. ⚠ Read `computeRanking`'s round-23 note before writing anything – it records both
earlier attempts and why each was wrong.

**Evidence, both:** the failure reproduced first, then gone; his w474 save loading into a playable
career; the MAIN-stream arms in `condition`/`planner` green and stated.

---

### WAVE 3 – the redesign (after wave 2 is merged)

| agent | type | owns (collision surface) | items |
| --- | --- | --- | --- |
| **C1 – the academy's letters** | `general-purpose` | `src/engine/academy.ts`, `src/engine/offers.ts`, `src/components/InboxSheet.vue`, `src/composables/inboxMail.ts` | #1 |
| **C2 – the fork screen** | `general-purpose` | `src/components/ForkDialog.vue` + its tests | #2a |
| **D1 – the college shell** | `general-purpose` | `src/App.vue`, `src/components/EndingScreen.vue`, `src/components/screens/HomeScreen.vue` | #2b, #3, #4 |
| **D2 – the academic year** | `general-purpose` | `src/engine/ending.ts`, `src/engine/world/endings.ts`, tests | #5 |
| **E1 – what she wants** | ⚠ **NOT YET** | – | #6 |

**C1.** The academy's three notices (arrival, changed share, end) become letters that stay in the
inbox. ⚠ The round-23 toast keeps its job – it says *when* – and gains a destination. Do not remove
the stop; it exists because the verdict lands on the one week a `+4` advance cannot reach.

**C2.** Quotes before the choice, and ⚠ **every refused tier states its reason** – the house rule the
entry gate and the coach card already follow. He could not tell why the cheapest was unavailable.

**D1 – the biggest, and the one the others hang off.** College borrows the EPILOGUE as its shell, so
it inherits an ending's furniture: an album, a sense of conclusion, one button. ⚠ **The owner offered
two shapes and the cheaper is right**: college weeks run on the HOME shell with college content, not
in a second full-screen flow that duplicates the week, the recap and the bottom control and then has
to be kept in step with them. Graduation shows its card and hands back to Home.

**D2.** The fork moves off her birthday: asked after school ends, the place RESERVED, she keeps
playing, she leaves when the academic year starts. ⚠ This is a DESIGN CHANGE, not a bug fix –
`forkDue` does exactly what it was written to do, and `kidAgeThroughWeek`'s comment says so. It also
moves a MAIN-stream-adjacent gate, so it needs the A/B arms checked.

**E1 is deliberately unassigned.** #6 – «где-то её мнение увидеть» – is the first surface of the stat
`the-private-life.md` says does not exist. Building it here as a string on the fork would create the
second opinion system that file exists to prevent. It waits for that layer's step 1.

---

## What this needs from the owner before anything starts

1. **Approve the waves and the D1 shape** (Home shell rather than a parallel flow).
2. ⚠ **Confirm E1 waits.** The alternative is a throwaway string now and a rebuild later.
3. **Say whether his w474 career must be repairable**, or whether a broken save may simply be
   superseded. It changes B1's scope from "fix forward" to "fix forward AND heal".
