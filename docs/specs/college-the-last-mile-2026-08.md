---
type: spec
status: draft
area: college
canonical: false
last-reviewed: 2026-08-27
---

# College, the last mile – eight things round 26 left behind

The owner, 27.08, after playing four years through: «нам чуть-чуть осталось колледж дожать».

**Eight findings from two afternoons of his play, and four of them share a cause.** Round 26 gave
college real tournaments – the student championship, walked through the tour's own flow – and the
texts, types and calibrations around college never learned that it had. Each section below is
measured against the shipped code, not recalled.

---

## 1. Every freshman is exactly 19.0–19.9, and one line decides it

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

### ⚙ THE RECOMMENDATION BELOW IS SUPERSEDED BY §1a – read that first

⚠ **What follows was written before he cut the problem down, and it is kept as the record of why the
cause matters even though the fix changed.** The diagnosis above still holds exactly: `delta === 0`
is why every career reads the same age. But the repair is no longer «move the question» – see §1a,
where the entry age is modelled directly and the fork does not move at all. **Do not build what this
subsection proposes.**

### The superseded recommendation, kept for its argument

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

## 1a. ⚙ REWRITTEN 27.08 – the iceberg was smaller than it looked, and he is the one who shrank it

I had this section arguing that the school model is one country's applied to twenty-four, and that
fixing it needed per-country school calendars. **He cut that off, and he was right:**

> «нам пока не обязательно к каждой стране индивидуально цепляться, мне кажется, надо просто понять
> в каком возрасте идут в колледжи спортсмены»

**The game needs ONE number, not twenty-four school systems.** College entry age is not a consequence
this game has to derive – it can simply be modelled, and everything below follows from that.

### What is true about ATHLETES, which is the only population that matters here

- **Domestic American recruits** arrive at 18, sometimes 19.
- ⭐ **International recruits in tennis arrive noticeably older** – 19, 20, not rarely 21 – because
  they play the junior tour or try futures first. College tennis is one of the most international
  fields in the NCAA, so this is not a rare tail, it is a large share of every roster.
- **17 is a rarity in tennis**, not a normal case. My earlier «17–19» was wrong for athletes; it was
  a schoolchild's range.

⚠⚠ **WHICH PARTLY VINDICATES THE SHIPPED MODEL AND CHANGES WHAT §1 IS ABOUT.** A 19.0–19.9 freshman is
**defensible for an international recruit**. What is NOT defensible is that she is 19.0–19.9 *and
nothing else* – the shipped model has **no spread at all**, because the cohort rule is one
deterministic line on birth month. **The defect is the absence of variance, not the value.**

### So §1 changes shape

| | before this rewrite | after |
| --- | --- | --- |
| the claim | «she is too old» | «there is no spread, and she sits at the older edge of a real range» |
| the fix | move the fork question a year earlier | **model the entry age directly as a band, ~18–20** |
| the cost | ⚠ her last junior season | ⭐ **none** – nothing about the junior calendar has to move |
| what it touches | `forkDue`, `nextAcademicYearStart`, the school calendar | one band, read at the departure |

⭐⭐ **AND THAT REMOVES THE DECISION I PUT TO HIM.** «Do we lose her last junior season?» was the price
of moving the fork. Modelling the entry age directly does not move the fork at all, so the junior
season stays and the question is withdrawn.

### The school finding is still true – it is just not this task

`src/engine/kidLife.ts` never reads `profile.country`, not once: `lastGrade: 12`, first grade at six,
twelfth ending at eighteen, for all twenty-four countries the game offers, **and her grade is printed
on the Kid screen**. That is a real observation and it is the third instance of one pattern in a week
(round 26 #2's nationality-shut college place; the US-only need layer, which is deliberate by statute;
this). ⚠ **But it does not pay for itself here**, and modelling twenty-four school systems to move one
number would be the tail wagging the dog. **Filed to
[geography-and-country.md](../backlog/geography-and-country.md) instead, where the other two country
findings already live.**

### What still needs sourcing, and it is now one question instead of twenty-four

⚠ **The figures above are my reading and are NOT research.** The order of magnitude I hold with
confidence; the distribution I do not. If a constant is going to be set from it – and §3's field
calibration depends on the band – it belongs in `docs/research/` first, sourced, exactly as
`injury-stats-by-age.md` and `retirement-and-withdrawal.md` were before they moved a number.

**The one question: the age distribution of a first-year college tennis player, domestic against
international.** One table. Not twenty-four school calendars.

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

### ⚙ CORRECTED AT THE BUILD, 27.08 – it is not «the championship pause», and it is not one label

⚠ **The paragraph above is right about the cause and wrong about the state, and the walked career is
what says so.** Two probes over `resumeFromCollege`, all twelve birth months, four years each:

| her birth month | the press that plays the championship | what it said |
| --- | --- | --- |
| **April–August** (5/12) | the FIRST press of the year – the fixture is thirty weeks in, her birthday later | `Another year` · `Play the first year` · `Play the final year` |
| **September–March** (7/12) | the SECOND press – her birthday pauses the year first | `Finish the year` |

**So BOTH halves of the label lie, and which one depends only on her birth month.** The academic year
opens on a fixed season week for every career, so the fixture is always at the same offset and only
the cake moves across it.

⚠ **AND `collegeLeagueRevealOpen` CANNOT BE THE PREDICATE**, for a measured reason: it is true exactly
while `snapshot.pending` is set, and `HomeScreen`'s college bar carries `&& !game.snapshot?.pending` –
so while it is true the button is not on screen at all. The state it names is the takeover, not the
rest state before it.

**Built instead:** `collegeLeagueIsNextStop(world)` – «does the press ahead END at the championship» –
reaching the screen as `CollegeProgressView.leagueIsNextStop`, and ONE label, `Play the College
League`, ahead of both orderings. It walks the weeks the press will walk and asks the loop's own two
questions in the loop's own order, so a championship sitting BEHIND a birthday is not promised by the
press that will stop at the cake. ⚠ Its own docstring carries the standing hazard: `resumeFromCollege`
has exactly two mid-year stops today, and a third would have to be taught to this predicate too.

⚠ The name is **the league's own label** (`COLLEGE_LEAGUE.label`), not «College Open» – his «или
вроде того» left the choice open and the fixture already has a name on every other surface.

**Measured after the fix: 0 mismatches over 12 birth months × 4 years – the button names the
championship on exactly the presses that play it, and «Finish the year» on the one after.**

---

## 3. ⚠⚠ The world #100 goes to college and loses, and the numbers say why

> «у нас довольно смешно получается сейчас: сотая ракетка мира приезжает в колледж и проигрывает там»

`collegeLeagueOpponent` draws every attribute from `COLLEGE_LEAGUE.field = { standard: 56, spread: 12 }`
– **uniform 44 to 68**. Against the professional pyramid `fieldPros.ts` documents:

⚠⚠ **CORRECTED 27.08 – THE TABLE I FIRST PUT HERE QUOTED A REJECTED DRAFT**, caught by the
growth-pace measurement. `fieldPros.ts:129` names «elite 60-70 / middle 52-62 / tail 45-55» as *the
draft* pyramid, inside a block headed «THE BANDS WERE TUNED **DOWN** FROM THE FIRST DRAFT». The
shipped storeys are four, at `fieldPros.ts:396`:

| population | count | attribute core |
| --- | --- | --- |
| **the college league field** | – | **44 – 68**, centred 56 |
| `tourElite` – the top of the world | 64 | **67 – 77** |
| `elite` | 30 | **56 – 66** |
| `contender` | 120 | 43 – 53 |
| `journeyman` | 150 | 38 – 48 |

⭐ **So this section was UNDERSTATED, not wrong.** The college field's ceiling of **68 is above the
`elite` band entirely and inside `tourElite` – the world's top sixty-four.** Its centre, 56, is the
FLOOR of the elite storey (ranks #65–94), not a middle. **A student can roll the attributes of a
top-64 professional.**

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

⚙ **AND THE TARGET IS A RANGE, NOT A POINT (his ruling, 27.08).** He first said «под 17-19»; §1a's
rewrite moves that to roughly **18–20**, because the population is athletes rather than schoolchildren
and 17 is a rarity in tennis. So the field is calibrated against a two-year span of development. ⭐ That is better than it sounds: a spread of freshman strengths against
a fixed field is what real student tennis looks like – some arrive able to win it, some do not – and it
means the fixture stops having one correct answer.

⚠⚠ **DO NOT PICK IT BLIND. The league feeds the call-up.** The national-team ladder reads her league
result on the 0.15 / 0.40 / 0.65 / 0.85 rungs, and round 24 measured the college years at **2.63–2.72
watchable matches a year with a floor of 1 and a ceiling of 2 on all three tariffs**. Dropping the
field moves every one of those. **Re-measure them in the same pass or the fix trades a funny story for
a broken one.**

⚠⚠ **AND MY «§1 CLOSES PART OF THE GAP FOR FREE» DOES NOT SURVIVE MEASUREMENT.** A year of freshman
age at 18–19 is worth **+0.8 power points**, against a college-opponent standard deviation of ≈3.2 –
**a quarter of one SD.** §1a is still right for its own reasons; it may **not** be credited with any
of §3's work.

⭐⭐ **WHAT DOES DECIDE §3 IS THE GROWTH CURVE, and that is now measured** – see
[how-fast-she-grows-2026-08.md](how-fast-she-grows-2026-08.md). **90% of her rolled ceiling is spent
by 16.4** and 92.8% by 18; her first top-100 lands at a **median of 18.9** against the development
model's own anchor of ~22, and the anchor's year is the **p90**. ⚠ And it is manager-proof: the figure
is 16.4 / 16.4 / 16.2 / 16.1 across four policies whose ladder outcomes span 0% to 95.6%. **The parent
buys rank and money; the parent does not buy skill.**

⚠⚠ **SO §3 IS ON HOLD AND ITS ORDER IS THE ONLY ACTIONABLE PART.** Both numbers are wrong – the
freshman is three years over-developed AND the field straddles a storey it has no business in. Tune
the field first and it gets tuned twice, because the thing it is a difference against will move.
**Decide the growth curve, then re-take this section.**

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

### ⚙ BUILT 27.08 – the control-by-control audit, and it found a THIRD refused control

**The premise above held: the engine was already right, and no engine number moved.** What the audit
added is the list itself. Every control the screen draws, against the guard behind it:

| control | engine command | guard | shipped |
| --- | --- | --- | --- |
| **Enter** | `enterEvent` | `guardNotEnded` | **disabled** |
| **Withdraw** | `withdrawEvent` | `guardNotEnded` | **disabled** (see below) |
| **Cancel entry** | `cancelEntry` | `guardNotEnded` | **disabled** (see below) |
| **+ Plan week** (both cards) | `bookPractice` / `bookVacation` | `guardNotEnded` | **disabled** |
| **Play it and watch** | `advance(1)` | `advanceRefusal` → `'ending'` | **disabled** – see below |
| rescue card «See the options» | `bookVacation`, through the same sheet | `guardNotEnded` | **suppressed** |
| **Cancel** on a booked practice | `cancelPractice` | `guardNotEndedForGood` | **left live** |
| **Cancel** on a booked vacation | `cancelVacation` | `guardNotEndedForGood` | **left live** |
| the painted vacation card's tap | opens `PlanWeekSheet`'s `booked` pane | reaches `cancelVacation` only | **left live** |
| Tour guide, Watch match, the sandbox friendly | none – no command at all | – | **left live** |

⚠⚠ **«Play it and watch» IS A THIRD REFUSED CONTROL AND IT WAS THE WORST OF THEM, because it was
silent.** The press is an ADVANCE, `advanceRefusal` returns `'ending'` behind any latch – college
included – and `'ending'` is the one stop reason with **no copy in App.vue's `STOP_REASON_TEXT`**, so
R10-16's own «no copy, no toast» rule meant the press produced *nothing at all*: no week, no message.
It is reachable exactly because of the fact E2 built on – `resolveCollegeDeparture` releases her
ENTRIES and leaves `world.practices` alone, so a friendly booked in August is still on the calendar in
September. ⭐ **App.vue's own week bar already stands down on a college week for this argument**
(the note at `.next-week-bar`, and `round24-college-shell.test.ts` pins it); this is the same command
on another screen, and nobody had told it.

⚠ **The rescue card is SUPPRESSED rather than disabled, and it is the only thing here that is.**
Everything else is a control the player went looking for, so it stays on screen greyed with the reason
beside it. This is the game *offering* a booking it will refuse, and its own copy («nothing is booked
until you say so») promises a decision the engine will not take.

⚠ **Withdraw / Cancel entry cannot actually be reached inside the freeze** – `releaseEntriesForTheFreeze`
runs at the departure, so she holds no entry (pinned in the new suite). Both are gated all the same:
the guard is what makes that a rule rather than a hope.

⚠ **The three «left live» rows are the whole second half of the item** and they are pinned in both
directions – `tests/component/round27-college-season.test.ts`, mutation-verified four ways (freeze
never fires → the four freeze cases die; freeze always fires → the on-tour arm dies; freeze the
practice cancel or the vacation card's tap → exactly the E2 case that names it dies).

**The predicate is `guardNotEnded`'s own first question** (`ending.type === 'college'`), not
`snapshot.inCollege` – the same reasoning `world/constants.ts` writes out beside the guard, so the
screen and the refusal cannot disagree about which controls work. The note is `COLLEGE_FREEZE_REFUSAL`
itself, printed once at the head of the calendar rather than eight times over eight cards.

---

## 6. ⚠⚠ The national-team call-up is the SAME RAKE the League just stepped off

> «И опять на те же грабли: "Her country called this year…" во всплывашке сверху и матчи только
> постфактум. Мы уже обсудили, что мы знаем будет это происходить или нет, можно письмо об этом
> пользователю нормальное присылать с приглашением на турнир и проводить этот турнир по обычному
> флоу турнира. А этот попап не нужен для этого флоу вообще.»

**Verified.** `playCallUpRubbers` (`world/college.ts:282`) simulates every rubber **inside the tick**,
stores the result as `college.pendingCallUp`, and the card retells it afterwards. The toast at
`App.vue:868` says «Her country called this year – her matches are in the news feed, and they can be
watched», which is a sentence about something the player was not present for.

⚠ **Round 26 #6/#7 fixed exactly this for the College League and the call-up was not in that item's
scope**, so the identical shape survived one file away. The League now pauses on its week and is
played through `TournamentFlow`; the tie is still resolved and reported.

⭐ **And his key observation is what makes the fix cheap: the game already knows in advance.**
`rollCallUp` decides before the week, which is the same fact the academy letters of round 26 were
built on. So the sequence is available: **a letter with the invitation ahead of time, then the tie
played through the ordinary tournament flow, and the toast deleted** – it exists only to report an
absence.

⚠ **AND §4 IS ITS TWIN.** The tie is played outside all three ladders, so the moment it goes through
`TournamentFlow` it hits the same «Professional ranking» lie §4 records. **Fix §4 first or ship them
together** – doing this one alone converts a postfactum popup into a screen that states a falsehood.

---

## 7. The birthday wish collapses onto «one day» – and it is a pool, not a fluke

> «И снова она просит "One day, not a week, not a trip" второй год подряд, я просил это исправить»
> · correction: «3 раза подряд»

⚠⚠ **His original complaint was answered with a measurement of something else, and this is worth
saying plainly.** Round 26 #9 opened on his «Just a day together на день рождения случается
подозрительно часто» – a complaint about **the day**. The measurement found the whole DIALOG repeating
(53% of consecutive birthdays printed identical rows, worst run eight) and fixed that, recording «the
day was never the problem». **The dialog fix was real and it held. The thing he pointed at was left
alone, and it is still there.**

**The mechanism, and it guarantees his three in a row** (`world/birthday.ts:920`):

    const canAsk = options.filter((g) => g.id === DAY_TOGETHER.id || !spent.has(g.id))

⭐ The day is **exempt from the already-given filter by design**, with a good argument beside it: «a
day with her parents is not a possession and she may want one every year of her life». **But the
consequence was never counted.** There are always exactly four options – three material plus the day.
Material gifts leave the ask pool permanently once given; the day never does. **So the day's share of
the pool rises monotonically across a career, and once the three material options drawn for a birthday
are all already hers, the pool is a single element and the probability is 100%.**

⚠ Round 26 #9b saw the neighbouring version of this – «a career spends SEVEN birthdays in 22-28 and
the band held exactly three material gifts, so C(3,3) = 1» – and widened the bands from 3 to 5. **That
fixes the ROWS, because rows are drawn fresh each year. It cannot fix the ASK, which filters on what
she owns.**

### The fix, and the trap that would defeat a naive one

**A one-birthday cooldown on the ASK, never on the option.** The day stays on the card every year
(his 11.08 ruling and the argument above are both untouched); it simply cannot be VOICED twice
running.

⚠⚠ **The trap:** the code already carries an empty-pool fallback –

    const pool = canAsk.length ? canAsk : options

– so a cooldown layered on top would empty the pool in **exactly the case that matters** (all three
material owned, the day on cooldown), the fallback would restore every option, and the day could come
straight back. **The empty-pool rule has to be decided rather than inherited:** when there is nothing
new to want, she should ask for a material gift AGAIN – the gifts carry `repeat: 'repeatable'` /
`'durable'` and their own `again` wording for precisely this – rather than the day on a loop. ⭐ «She
has one of these from us already, this would be the second» is a human thing to want, and it makes
the scene richer rather than thinner.

⚠ **HARD CONSTRAINT:** `seed:birthday:<age>` is drawn **exactly four times** for every birthday in the
game and the count is **pinned in `tests/birthday-ask.test.ts`**. Filtering the pool is allowed – that
is how `alreadyGiven` already works. Changing the number of draws is not.

### ⚙ BUILT 27.08 – measured before and after, and the average was hiding it

**The mechanism is confirmed exactly as diagnosed, and the measurement found a second thing worth
saying.** `tools/birthday-pool.ts`, 12 careers, 201 tour birthdays and 48 college birthdays, the same
tool on both arms and only the engine differing:

| | before | after |
|---|---|---|
| the day is the ask, overall | **30%** | 24% |
| ...from twenty-two on (**late career**) | **34%** | 28% |
| longest run of consecutive day-asks | **4** | **1** |
| careers that ever ran three in a row | **4 of 12** | **0 of 12** |
| all three material rows already hers → asked the day | **8 of 8 = 100%** | 6 of 8 = 75% |
| she asks for something already in the house | 0 | 2 of 201 = 1% |
| ...of those, on a **durable** row | – | **0** |

⭐ **The run is the number that answers him, and it is structural rather than statistical.** «3 раза
подряд» cannot happen because two in a row cannot happen: worst run 1, on both the tour and the
college band, in every career walked. The college band's own worst run was 3 before and is 1 now.

⚠ **THE SHARE FALLS BY SIX POINTS AND NO FURTHER, AND THAT IS THE FIX WORKING RATHER THAN
UNDER-DELIVERING.** The day is on 100% of dialogs by the owner's own 11.08 ruling and every material
row is on at most 31%, so a healthy day share is *high*. The 6 of 8 that still ask for the day in the
single-element case are correct: the pool is genuinely one row and the day was **not** last year's
ask, so the day is the only true answer. What was removed is the *consecutive* certainty, which is
the whole of what he was reading.

⚠ **AND THE 100% CASE IS ONLY 8 BIRTHDAYS OF 201 – THE SPEC ABOVE NAMES THE EXTREME OF A CONTINUOUS
EFFECT, NOT THE WHOLE OF IT.** The filter lifts the day at every level of ownership: one material row
owned and the pool is 3, two and it is 2, three and it is 1. That is where the other 53 day-asks come
from, and at a ~30% per-birthday rate a three-in-a-row appears in a third of careers by arithmetic.
**His career was not unlucky. It was the distribution**, which is why round 26's 30% average read as
a fair share of four options and nobody looked at the run.

**The empty-pool rule chosen:** `wanted → repeatable rows on the card → any material row on the card →
options`. The last step is unreachable crash-insurance. ⭐ **The repeatable step is not a preference –
it is what keeps a false sentence off the screen.** This is the first ask in the game that can name a
possession she already has, and a DURABLE row's ask is written as a want for a thing she LACKS:
`campusbike` asks «Everyone there has a bicycle. **She walks**, and she has mentioned it twice», which
is false the moment one is chained up outside. A repeatable row's ask is a want that recurs. Measured:
the fallback fired twice in 201 birthdays and **landed on a repeatable row both times**.

**No schema move was needed, and it was checked rather than assumed.** `BirthdayRecord.asked` has
been persisted beside `given` since **v48** – the v48 note says why they are separate fields – so the
cooldown reads the record every save already carries. `chooseGift` is the array's only writer and
pushes one row per birthday in the week it happens; the v48 migration only ever seeds `[]`. The array
is therefore chronological by construction and the last row is her previous birthday, derived before
this birthday's own row exists, exactly as `giftsAlreadyGiven` and `collegeBirthdayIndexOf` are. **Had
`asked` not been on the record this would have been a full four-part move from v63.**

**RNG:** no draw added or removed, MAIN not reached, the frozen capture (41550 / `e6b0c709`) unmoved.

---

## 8. ⚙ SOLVED 27.08 on his own save – it is a label, not the arithmetic

> «что происходит с плашкой Family Budget во время колледжа – такое ощущение, что она отражает
> какую-то другую реальность и слишком большие доходы отражает или какие-то расходы не учитывает,
> хотя вроде бы в Истории списаний всё нормально»

⚙ **REPRODUCED EXACTLY, on the save he sent** (`tennis-sim_alice-cfbv_w502`, week 502, college
4/4 done – read only, never copied into the repo and never a fixture, per his standing rule):

    the expenses tab, "This season"      spent  25 213
    History, seasonHistory season 8      spent  36 514

⭐⭐ **AND THE ARITHMETIC IS NOT WRONG.** Both surfaces call **the same fold from the same start** –
`financeWindow(world.financeWeeks, seasonStartWeek/yearStart)` (`snapshot.ts:1206` and
`milestones.ts:354`). There is nothing in the maths to disagree.

**`seasonStartWeek(502) = 468`, so the tab is showing season 9 at 34 weeks of 52, while History shows
season 8 complete.** 25 213 over 34 weeks projects to ~38 500 against season 8's actual 36 514 – **the
two numbers agree about the world; they describe different periods.**

⚠ **So the defect is entirely that two screens say «за сезон» and mean different seasons, with nothing
on either saying which.** For a player that is indistinguishable from broken maths, and he read it
exactly that way. **The repair is a label and a window that name their period – not a line of
arithmetic.**

⚠ One candidate ruled OUT by the same data, and it had a good comment behind it: `milestones.ts:349`
warns that the wrap-up cannot know off-season weeks 50–51 while the wallet keeps counting them. True,
but it makes History **smaller** than the live tab, and his gap runs the other way.

### What else the save showed, since the ledger was open anyway

    income 47 244 · interest 27 507 · tuition −39 686 · physio −3 510 · coaching −142 · facility −139

- ⭐ **`interest 27 507` is why it «reads like another reality».** She earns $44k in a season she does
  not play, most of it interest on a $780k balance. Not a bug, and exactly what it looks like.
- ⚙ **`physio −3 510` billed through the freeze while the coach's salary is suspended** – asymmetric,
  and **he ruled it is not a problem** («здесь нет проблемы»). Recorded as his decision, not a defect.
- ⭐ **No gear line at all, and that is his own rule**: `if (!inCollege(world)) resolveGear(world)`,
  «her kit is the university's for four years» (W2-ENDINGS). Her kit is pro on all three lines. His
  expected 5–6k a year is correctly absent. ⚠ My first probe reported «racket: null» – that was the
  probe reading a field that does not exist, not a fact about the save.

**Superseded – the original hypothesis, kept because it was nearly right and the reasoning matters.** The card folds `finance.window12w` / `finance.season` – per-category totals
over two windows – while the transactions history reads individual events. Two paths to one number,
which is this repo's most-repeated defect class. ⚠ And tuition is **not** the explanation: it is
charged **weekly** (`world/college.ts:147`, `amountCents: -weekly`), so it cannot fall outside a window
as a lump.

⭐ **THE LEADING CANDIDATE, and it is structural rather than a bug in the arithmetic: a press means a
different thing in college.** On tour one press is one week, so «the last 12 weeks» is twelve presses
of history. In college **one press is a whole YEAR**, so the same window shows less than a quarter of
what just happened, while the history shows all of it. **The label is identical and the meaning is
not** – which is exactly «another reality», and it would also read as «expenses missing», because most
of the year's spending is outside the window the card is folding.

⚠⚠ **THIS IS A HYPOTHESIS AND IT IS NOT MEASURED.** It fits every symptom he described including
«в Истории списаний всё нормально», but so might two or three other explanations. **Measure before
building**: walk a career through college and compare, week by week, what the card would fold against
what the history holds – and report which line diverges first. If the windows are the whole story the
fix is a label and a window that know about the freeze; if a category is genuinely missing it is a
different repair entirely.

---

## 9. What this wave owes, in order

⚠ The order matters – §1 changes the input to §3, and §2 and §4 touch the same flow.

| # | what | blocked on | size |
| --- | --- | --- | --- |
| 0 | ⚠ **RESEARCH FIRST, and it is now ONE table**: the age distribution of a first-year college tennis player, domestic against international. Written into `docs/research/` the way the injury and retirement anchors were. Nothing ships off my reading | – | S |
| 1 | **§1 the entry age as a BAND (~18–20)**, modelled directly at the departure. ⭐ The fork does not move, so her last junior season is not spent and the question I put to him is withdrawn | row 0 | S |
| 2 | **§4 the ladder label** – `LadderTrack | null`, both fixtures | – | S |
| 3 | **§2 the button** – the pause reason reaches the snapshot | – | S |
| 4 | **§5 the frozen Season controls** – disabled, with the engine's own sentence beside them | – | S |
| 4a | **§7 the birthday ask** – a cooldown on the VOICE, and the empty-pool rule decided rather than inherited | – | S |
| 4b | **§8 Family Budget** – ⚠ MEASURE FIRST, build only what the divergence names | a measurement | S–M |
| 4c | **§6 the call-up** – the letter, the tournament flow, the toast deleted | ⚠ **§4 must land first or with it** | M |
| 5 | **§3 the field strength**, calibrated against the 17–19 span – with the call-up ladder re-measured | §1 **and** §1a-(b) first | M |

**Acceptance for the wave as a whole:**

1. Her enrolment age has a real SPREAD across careers, inside the sourced band – rather than the single value every career reads today.
2. No screen names a table a fixture does not award in – checked on the College League AND the
   Nations Cup.
3. The button never offers a year when the press plays a tournament.
4. A top-100 professional wins the College League comfortably, and ⚠ **the call-up rungs still read
   what round 24 measured**: 2.63–2.72 watchable matches a year, floor 1, ceiling 2, on all three
   tariffs.
4a. ⚠ **No fixture she plays is resolved without her** – the League and the national-team tie both
   reach the player as an invitation and a played tournament, and no toast reports an absence.
4b. **The day is never the wish two birthdays running**, and the empty pool asks for something rather
   than falling back to the day.
5. ⚠ No control on the Season tab both LOOKS pressable and refuses – and none that the engine still
   allows has been disabled by mistake.
6. ⚠ No age constant in the engine traces to my reading rather than to a sourced research file.
7. The frozen MAIN capture is unmoved – none of this draws.
