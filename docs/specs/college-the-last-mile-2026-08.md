---
type: spec
status: draft
area: college
canonical: false
last-reviewed: 2026-08-27
---

# College, the last mile – five things round 26 left behind

The owner, 27.08, after playing four years through: «нам чуть-чуть осталось колледж дожать».

**Five findings from one afternoon of his play, and three of them share a cause.** Round 26 gave
college real tournaments – the student championship, walked through the tour's own flow – and the
texts, types and calibrations around college never learned that it had. Each section below is
measured against the shipped code, not recalled.

---

## 1. She is always a nineteen-year-old freshman, and one line decides it

> «я вижу, что на первый год колледжа Alice исполняется 20 лет, в то время как ее соперницам 18 –
> может быть мы что-то напутали с возрастом ухода в колледж? может быть это надо делать сразу после
> школы, после лета?»

**He is right, and it is not a rounding accident – it is a whole year.**

- `schoolEndWeek(birthMonth)` returns `seasonIndex * WEEKS_PER_YEAR + SCHOOL_YEAR_TURNS_AT`
  (`kidLife.ts:165`) – school ends **exactly on the academic-year boundary**.
- `forkDue` fires on `schoolIsOver`, so she is asked that same week, at age **18.00–18.92** depending
  on birth month.
- `departsWeek = nextAcademicYearStart(world.week)` (`endings.ts:535`), and that function is
  **strictly after** (`kidLife.ts:197`):

      return week + (delta === 0 ? WEEKS_PER_YEAR : delta)

  Her `delta` is **exactly 0**, because school ended on that very offset. **So she skips the September
  she is asked in and departs the following one.**

**Enrolment age: 19.00–19.92, for every birth month the game can roll. She turns twenty inside year
one, always.** Her opponents in `COLLEGE_LEAGUE.opponentAgeBand` are 18–23, so she arrives at the top
of the freshman band rather than the bottom of it.

⚠ **THE GAP IS DELIBERATE AND ITS REASON IS GOOD**: `forkDue`'s own comment says the year between ask
and departure is «her last junior season, played rather than skipped», and the J rungs close on age 18
inside it. Nobody chose a twenty-year-old freshman; it fell out of protecting that season.

### The recommendation, and it keeps both

**Do not change `nextAcademicYearStart` to `>=`.** That enrols her the week she answers, which deletes
the decision entirely – the comment already rejects it and is right to.

**Move the QUESTION instead.** Ask during her final school year – spring, not the week school ends –
and depart on the September school ends on. Then:

- she enrols at **18.00–18.92** and is a freshman among freshmen;
- the decision still has months to breathe, which is what the gap year was really protecting;
- ⭐ it is how it actually works – you apply in your last year of school and start in the autumn;
- and his «все люди в разном возрасте школу заканчивают (+/- 1 год) и это ок» is already delivered by
  birth month, with no new mechanism.

⚠ **THE COST IS REAL AND IT IS HIS CALL**: the last junior season disappears. She would go from
juniors straight to college, which is the ordinary path for a player who chooses college – but it is
one fewer played year in every college career, and §3 below says that year is also what makes her too
strong for the field. **The two are the same decision.**

---

## 1a. ⚠⚠ The iceberg under §1 – the school model is one country's, applied to twenty-four

He saw it before I did: «это же тащит и школьные возраста с собой, как мне кажется, так что "айсберг"
оказался еще больше. На счет 12 класса – это реально так происходит или всё-таки наша додумка?»

**Verified: `src/engine/kidLife.ts` never reads `profile.country`. Not once.** The whole school model
is `ECONOMY.school.lastGrade: 12`, `SCHOOL_CUTOFF_MONTH: 9`, and «grade G runs from age G+5 to G+6» –
first grade at six, twelfth grade ending at eighteen. That is the **United States**, and the game
offers **twenty-four countries** (`composables/countries.ts`). ⚠ And her grade is on screen: the Kid
screen's ladder prints it from `gradeOf`, so the assumption is not buried in the engine, it is shown
to the player as a fact about her life.

⭐ **THIS IS THE THIRD TIME THIS EXACT PATTERN HAS TURNED UP IN A WEEK.** Round 26 #2 deleted the rule
that shut a college place by nationality («по-моему в каждой стране есть домашний универ»); the
need-based aid layer is still US-only by statute (`collegeOffer.ts:701`, and that one is deliberate);
and now the school itself. **An American default that nobody chose, applied to everyone, and visible.**

### What is actually true in the world – and it is NOT what I expected

The grade COUNT varies far more than the leaving AGE does, because countries that start earlier run
more years:

| | school starts | years | leaves at about |
| --- | --- | --- | --- |
| United States | 6 | 12 | 17–18 |
| Russia | 6–7 | 11 | 17 |
| England | 4–5 | 13 | 18 |
| Australia | 5–6 | 13 | 17–18 |
| New Zealand (his example, not in the game) | 5 | 13 | 17–18 |

⭐⭐ **THE LEAVING AGE CONVERGES ON 17–18 ALMOST EVERYWHERE, AND THAT IS THE FINDING.** «Twelve grades»
is a local fact; «out of school at seventeen or eighteen» is close to a universal one. So the model's
OUTPUT is broadly defensible and its MECHANISM is not – and the output sits at the **top** of the real
range, never below 18.00.

⚠ **THESE FIGURES ARE MY READING AND THEY ARE NOT YET RESEARCH.** This repo keeps `docs/research/`
for exactly this, and no engine constant should be set from the table above until it is written up
there the way `injury-stats-by-age.md` and `retirement-and-withdrawal.md` were. **Sourced first, then
used.**

### Which makes his ±1 not flavour but a correction

> «давай вариативность добавим, ±1 год, и калибруй поле под 17-19»

Today: school ends at **18.00–18.92, and there is no variation at all** – the cohort rule is a single
deterministic line on birth month. Real leaving ages run roughly **17.0–18.9**. So the variation he
asked for is what moves the model from one edge of reality onto the whole of it.

**Two ways to build it, and they are not the same feature:**

- **(a) per-country school length** – the honest fix for §1a: `lastGrade` and the start age become
  country facts, so a Russian girl finishes at 17 and an English one at 18 *because of where she
  lives*. ⚠ Needs the research above first, needs a value for all twenty-four, and ⭐ it makes the
  country choice mean a third thing (see `docs/backlog/geography-and-country.md`).
- **(b) a cohort ± 1 independent of country** – a girl is occasionally a year ahead or behind her
  band. Cheap, delivers the 17–19 spread §3 wants, and is true everywhere. ⚠ But it models
  «she skipped or repeated a year», which is a different claim from «her country's school is shorter».

**Recommendation: (b) now, (a) when the research exists.** (b) unblocks §3 immediately and is honest
on its own terms; (a) is the real repair and should not be guessed at. ⚠ Doing (a) badly – a made-up
`lastGrade` per country – would be worse than the American default, because a wrong specific is harder
to notice than an obvious generic.

⚠ **AND THE TWO MUST NOT BOTH LAND UNCOORDINATED**: (a) plus (b) together would widen the spread twice
and put freshmen at sixteen. Whichever ships second reads the other before choosing its range.

---

## 2. The button offers a year and plays a tournament

> «в интерфейсе колледжа появляется кнопка "Продолжить год", а при нажатии мы попадаем в "the College
> League" – как будто можно тоже наш флоу использовать с неймингом кнопки – Play College Open или
> вроде того, а уже потом "Закончить год"?»

`HomeScreen.vue:1040` has four labels: `Play the first year` · `Another year` · `Play the final year`
· `Finish the year` when `yearInProgress`.

**The label knows about ONE pause inside a year – her birthday – and round 26 added a SECOND.** When
the year stops on the championship the button still reads «Finish the year», and the press drops the
player into a tournament.

⭐⭐ **AND THE FUNCTION'S OWN COMMENT ALREADY FORBIDS THIS, one case earlier:**

> a button still reading «Another year» there would be offering a year it is not going to start

The identical argument one step further: a button reading «Finish the year» when the next press plays
a championship is offering the wrong thing. **His fix is this file's own rule applied to the pause it
did not know about**, not a new preference.

**Build:** a fifth label for the championship pause – «Play the College Open» or the league's own
label – and «Finish the year» after it, exactly as he described.

⚠ **IT MUST READ AN ENGINE FACT, NOT INFER ONE.** `collegeLeagueRevealOpen(world)` already exists;
the pause reason has to reach the snapshot. A screen that guesses which pause it is standing in is the
screen deciding a rule, which `CLAUDE.md` invariant 1 forbids – and the birthday half is already done
the right way (`yearInProgress` is `college.pendingYearStart`, the engine's own fact).

---

## 3. ⚠⚠ The world #100 goes to college and loses, and the numbers say why

> «у нас довольно смешно получается сейчас: сотая ракетка мира приезжает в колледж и проигрывает там»

`collegeLeagueOpponent` draws every attribute from `COLLEGE_LEAGUE.field = { standard: 56, spread: 12 }`
– **uniform 44 to 68**. Against the professional pyramid `fieldPros.ts` documents:

| population | attribute band |
| --- | --- |
| **the college league field** | **44 – 68**, centred 56 |
| professionals, elite (~top 30) | 60 – 70 |
| professionals, **middle (~120)** | **52 – 62** |
| professionals, tail (~150) | 45 – 55 |

**The student field is calibrated at the professional MIDDLE**, which by `fieldPros.ts`'s own
description is «a middle ~120 at strong-junior level» – exactly where a world #100 sits. She is not
losing against the odds; **she is playing her equals, and they should not be her equals.** The top of
a college draw (68) reaches the top of the professional ELITE band.

⚠ Reality's own scale: the best NCAA player is roughly WTA 300–600, i.e. **below** the professional
tail. Ours are above its middle.

⚠ **AND THE CONSTANT'S NEIGHBOURING COMMENT IS SOUND, WHICH IS HOW THIS SURVIVED.** It argues at
length that the field must NOT scale with the programme tier – «paying more for a WORSE chance of the
letter is the perverse arm of the same knob» – and that reasoning is correct. It simply never
compared the number against the pro pyramid, so a well-defended constant sat unchecked.

**Direction, not a number:** the field belongs below the professional tail – centre in the low
forties, top of the draw about where the tail's median is, so an NCAA champion reads as a fifth-hundred
professional.

⚙ **AND THE TARGET IS A RANGE, NOT A POINT (his ruling, 27.08): «калибруй поле под 17-19».** With §1a's
variation shipped a freshman is 17.0–18.9 rather than a single age, so the field is calibrated against
a two-year span of development. ⭐ That is better than it sounds: a spread of freshman strengths against
a fixed field is what real student tennis looks like – some arrive able to win it, some do not – and it
means the fixture stops having one correct answer.

⚠⚠ **DO NOT PICK IT BLIND. The league feeds the call-up.** The national-team ladder reads her league
result on the 0.15 / 0.40 / 0.65 / 0.85 rungs, and round 24 measured the college years at **2.63–2.72
watchable matches a year with a floor of 1 and a ceiling of 2 on all three tariffs**. Dropping the
field moves every one of those. **Re-measure them in the same pass or the fix trades a funny story for
a broken one.**

⭐ **AND §1 IS PART OF THIS.** An eighteen-year-old freshman is a year less developed than a
nineteen-and-a-half-year-old one. Moving the entry age closes part of the gap for free, so §1 should
be decided BEFORE §3's number is chosen – otherwise the field gets re-tuned twice.

---

## 4. «Professional ranking» over a match that awards nothing

> «на экране итогов матча the College League написано Professional ranking – как будто нет»

`TournamentFlow.vue:102`:

    const ladderLabel = computed(() => LADDER_LABEL[pending.value?.ladder ?? 'domestic'])

`LADDER_LABEL.wta` is `'Professional'`, and `LadderTrack` is `'domestic' | 'itf' | 'wta'` – **three
real tables and no fourth answer.** The College League awards nothing at all (its own test pins the
line «No prize money and no ranking points»), so the field is forced to name a table the fixture has
no relationship with.

⚠⚠ **THIS EXACT DEFECT WAS ALREADY FIXED ONCE, and `PendingView.ladder` is the fix.** Its own comment
records the case:

> a National quarter-final between two girls with no international result showed two numbers from a
> table neither of them was playing in

The field was added so no screen would invent the answer. **It came back because the TYPE cannot say
«neither» – the same shape as round 26's `friendly`, where one flag carried two meanings and the
screen filled in the false one.**

**Recommendation: `PendingView.ladder` becomes `LadderTrack | null`**, `null` meaning this fixture
awards nothing, and the screen draws no ranking line at all. The compiler finds every reader.

- ⛔ **Not a fourth `LadderTrack` member** – this is the absence of a table, not another one, and
  `LADDER_LABEL`, `LADDER_TRACKS` and `LadderViews` would all have to be taught a ladder that does
  not exist.
- ⛔ **Not a second boolean beside it** – two fields for one fact is precisely how the first version
  of this bug happened.

⚠ **CHECK THE SECOND SURFACE IN THE SAME PASS.** The Nations Cup tie is also played outside the three
tables. If it reaches the same screen it carries the same lie, and a fix that closes one of two cases
is worse than none – it makes the remaining one look deliberate.

---

## 5. The Season tab lets her enter tournaments she cannot play

> «на время колледжа на вкладке Season кнопки подачи заявок и планирования недели задизаблим
> пожалуйста. Можно рядом или ниже написать пояснение, что это только на время колледжа»

**Measured: `SeasonScreen.vue` contains no reference to college at all** – no `inCollege`, no freeze
check, nothing disabled. Its Enter / Withdraw controls and its «+ Plan week» sheet render exactly as
they do on tour.

⚠ **The ENGINE is correct and that is what hid this.** `enterEvent` (`world/entries.ts:42`) and
`bookVacation` (`world/planner.ts:117`) both open with `guardNotEnded`, which inside the freeze throws
the COLLEGE sentence rather than the ended one – so nothing illegal can happen and the message that
comes back is the right message. **The defect is entirely about WHEN the player learns it.**

⭐ **This is R10-16's own doctrine applied one step earlier than it currently is.** That ruling says a
refused control with no reason on screen is the bug; today the reason arrives in a toast AFTER the
press. A control that cannot work should not look like one that can, and the reason belongs beside it
rather than behind it.

**Build:** disable the entry controls and «+ Plan week» for the duration of the freeze, with a short
line beside or under them saying it lasts while she is at college – ⭐ **his own steer: «как сейчас
наверху появляется»**, so reuse the note the shell already shows rather than inventing a second voice
for the same fact.

⚠ **The sentence must come from the engine, not the screen.** `COLLEGE_FREEZE_REFUSAL` is already
exported for exactly this reason (its own comment: «a string literal copied into a test is a rename
that breaks a report in silence»), and the same argument covers a component. The screen asks whether
she is in college and prints the engine's sentence; it does not compose its own.

⚠ **AND NOT EVERYTHING ON THAT SCREEN IS FROZEN.** Round 24's E2 audit left two cancels deliberately
OPEN inside the freeze – the vacation cancel and the sparring cancel – because undoing a booking is
about the family's own week, not about the tour. **Check each control against `guardNotEndedForGood`
before disabling it**: disabling something the engine still allows is the same class of lie as
enabling something it refuses, pointed the other way.

⭐ Cheapest of the five: every fact exists, the sentence exists, and no engine number moves.

---

## 6. What this wave owes, in order

⚠ The order matters – §1 changes the input to §3, and §2 and §4 touch the same flow.

| # | what | blocked on | size |
| --- | --- | --- | --- |
| 0 | ⚠ **RESEARCH FIRST: school in the twenty-four countries** – start age, years, leaving age, written into `docs/research/` the way the injury and retirement anchors were. Nothing in §1a ships off my table | – | S |
| 1 | **§1 the entry age** – move the question, keep the departure | ⚠ **his ruling on the lost junior season** | M |
| 1b | **§1a variation (b)** – a cohort ± 1, giving freshmen 17.0–18.9 | after §1, and ⚠ never at the same time as (a) | S |
| 2 | **§4 the ladder label** – `LadderTrack | null`, both fixtures | – | S |
| 3 | **§2 the button** – the pause reason reaches the snapshot | – | S |
| 4 | **§5 the frozen Season controls** – disabled, with the engine's own sentence beside them | – | S |
| 5 | **§3 the field strength**, calibrated against the 17–19 span – with the call-up ladder re-measured | §1 **and** §1a-(b) first | M |

**Acceptance for the wave as a whole:**

1. She enrols at **17.0–18.9** and is never twenty in her first year.
2. No screen names a table a fixture does not award in – checked on the College League AND the
   Nations Cup.
3. The button never offers a year when the press plays a tournament.
4. A top-100 professional wins the College League comfortably, and ⚠ **the call-up rungs still read
   what round 24 measured**: 2.63–2.72 watchable matches a year, floor 1, ceiling 2, on all three
   tariffs.
5. ⚠ No control on the Season tab both LOOKS pressable and refuses – and none that the engine still
   allows has been disabled by mistake.
6. ⚠ No school figure in the engine traces to my table rather than to a sourced research file.
7. The frozen MAIN capture is unmoved – none of this draws.
